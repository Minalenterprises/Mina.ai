param(
    [Parameter(Mandatory=$true)][string]$inputSvgPath,
    [Parameter(Mandatory=$true)][string]$outputCdrPath
)
$ErrorActionPreference = 'Stop'
$app = $null
$doc = $null
$ownsApp = $false
$previousDocument = $null
try {
    $type = [System.Type]::GetTypeFromProgID('CorelDRAW.Application')
    if (-not $type) { throw 'CorelDRAW is not installed or its automation interface is unavailable. Export SVG instead.' }
    try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('CorelDRAW.Application') } catch {
        $app = [System.Activator]::CreateInstance($type)
        $ownsApp = $true
        $app.Visible = $false
    }
    try { $previousDocument = $app.ActiveDocument } catch { }
    $xml = New-Object System.Xml.XmlDocument
    $xml.XmlResolver = $null
    $xml.Load($inputSvgPath)
    $root = $xml.DocumentElement
    $width = [double]::Parse($root.GetAttribute('width').Replace('mm',''), [Globalization.CultureInfo]::InvariantCulture)
    $height = [double]::Parse($root.GetAttribute('height').Replace('mm',''), [Globalization.CultureInfo]::InvariantCulture)
    $doc = $app.CreateDocument()
    $doc.Unit = 3 # cdrMillimeter (4 is centimeters)
    $doc.ActivePage.SetSize($width, $height)
    # SVG contains the same complete artwork and rules displayed in the studio.
    $importOptions = $app.CreateStructImportOptions()
    $importFilter = $doc.ActiveLayer.ImportEx($inputSvgPath, 0, $importOptions)
    $importFilter.Finish()
    $range = $doc.ActivePage.Shapes.All()
    $range.CenterX = $width / 2
    $range.CenterY = $height / 2
    $options = $app.CreateStructSaveAsOptions()
    $doc.SaveAs($outputCdrPath, $options)
    $doc.Close()
    $doc = $null
    Write-Output 'Native CDR created from full SVG artwork.'
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
} finally {
    if ($null -ne $doc) { try { $doc.Dirty = $false; $doc.Close() } catch { } }
    if ($null -ne $previousDocument) { try { $previousDocument.Activate() } catch { } }
    if ($ownsApp -and $null -ne $app) { try { if ($app.Documents.Count -eq 0) { $app.Quit() } } catch { } }
    if ($null -ne $app) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) }
}
