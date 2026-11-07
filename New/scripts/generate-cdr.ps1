param(
    [Parameter(Mandatory=$true)][string]$inputSvgPath,
    [Parameter(Mandatory=$true)][string]$outputCdrPath
)
# Converts the studio's editable SVG (named layer groups, live <text>, vector motifs) into a native .cdr
# using the locally installed CorelDRAW automation interface:
#   1. imports the SVG with text kept as text,
#   2. turns every top-level group (Bleed, Artwork, Texture, Images, Text, Glue, Safe, Cut, Crease,
#      Perforation, Marks, Dimensions) into a CorelDRAW layer of the same name,
#   3. converts uniform fills and outlines to CMYK,
#   4. marks guide layers (Safe, Dimensions) as non-printing, then saves .cdr.
$ErrorActionPreference = 'Stop'
$app = $null
$doc = $null
$ownsApp = $false
$previousDocument = $null
$layerOrder = @('Bleed', 'Artwork', 'Texture', 'Images', 'Text', 'Glue', 'Safe', 'Cut', 'Crease', 'Perforation', 'Marks', 'Dimensions')
$nonPrinting = @('Safe', 'Dimensions')
try {
    $type = [System.Type]::GetTypeFromProgID('CorelDRAW.Application')
    if (-not $type) { throw 'CorelDRAW is not installed or its automation interface is unavailable. Use the CorelDRAW package (editable SVG) instead.' }
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
    $doc.Unit = 3 # cdrMillimeter
    $doc.ActivePage.SetSize($width, $height)
    $importOptions = $app.CreateStructImportOptions()
    try { $importOptions.MaintainLayers = $true } catch { }
    try { $importOptions.ImageResampleOptions = $null } catch { }
    $importFilter = $doc.ActiveLayer.ImportEx($inputSvgPath, 0, $importOptions) # 0 = cdrAutoSense
    $importFilter.Finish()
    $page = $doc.ActivePage
    $all = $page.Shapes.All()
    $all.CenterX = $width / 2
    $all.CenterY = $height / 2

    # Importers often wrap the whole drawing in one group: open it one level so the named layer groups are top level.
    if ($page.Shapes.Count -eq 1 -and $page.Shapes.Item(1).Type -eq 7) { $page.Shapes.Item(1).Ungroup() | Out-Null } # 7 = cdrGroupShape

    # One CorelDRAW layer per named group, stacked in production order (first = bottom).
    $layers = @{}
    foreach ($name in $layerOrder) {
        $group = $null
        foreach ($shape in @($page.Shapes)) { if ($shape.Name -eq $name -or $shape.Name -like "$name*") { $group = $shape; break } }
        if ($null -eq $group) { continue }
        $layer = $page.CreateLayer($name)
        $layers[$name] = $layer
        $group.MoveToLayer($layer)
        try { if ($group.Type -eq 7) { $group.Ungroup() | Out-Null } } catch { }
        if ($nonPrinting -contains $name) { try { $layer.Printable = $false } catch { } }
    }
    # Stack layers: each new layer goes above the previous one.
    $previous = $null
    foreach ($name in $layerOrder) { if ($layers.ContainsKey($name)) { if ($null -ne $previous) { try { $layers[$name].MoveAbove($previous) } catch { } }; $previous = $layers[$name] } }

    # CMYK conversion of uniform fills and outlines (bitmaps and text keep their content; text stays editable).
    foreach ($shape in @($page.Shapes.FindShapes())) {
        try { if ($shape.Fill.Type -eq 1) { $shape.Fill.UniformColor.ConvertToCMYK() } } catch { }
        try { if ($shape.Outline.Type -eq 1) { $shape.Outline.Color.ConvertToCMYK() } } catch { }
    }

    $options = $app.CreateStructSaveAsOptions()
    $doc.SaveAs($outputCdrPath, $options)
    $doc.Close()
    $doc = $null
    Write-Output 'Native CDR created from the editable SVG: live text, named layers, CMYK colours.'
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
} finally {
    if ($null -ne $doc) { try { $doc.Dirty = $false; $doc.Close() } catch { } }
    if ($null -ne $previousDocument) { try { $previousDocument.Activate() } catch { } }
    if ($ownsApp -and $null -ne $app) { try { if ($app.Documents.Count -eq 0) { $app.Quit() } } catch { } }
    if ($null -ne $app) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) }
}
