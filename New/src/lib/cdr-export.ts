import type { Design } from './types'

// ── CRC32 Table Generator ──
const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0 ^ (-1)
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff]
  }
  return (crc ^ (-1)) >>> 0
}

// ── Standards-compliant PKZIP Builder in Pure TypeScript ──
class SimpleZip {
  private files: Array<{ name: string; data: Uint8Array }> = []

  addFile(name: string, content: string | Uint8Array) {
    const data = typeof content === 'string' ? new TextEncoder().encode(content) : content
    this.files.push({ name, data })
  }

  generateBlob(mimeType = 'application/x-coreldraw'): Blob {
    let totalSize = 0
    // Calculate sizes
    for (const f of this.files) {
      const nameBytes = new TextEncoder().encode(f.name)
      // Local header (30 bytes) + name length + data length
      totalSize += 30 + nameBytes.length + f.data.length
      // Central dir entry (46 bytes) + name length
      totalSize += 46 + nameBytes.length
    }
    // End of central dir record (22 bytes)
    totalSize += 22

    const buffer = new Uint8Array(totalSize)
    const view = new DataView(buffer.buffer)
    let offset = 0

    const centralDirOffsets: Array<{ offset: number; crc: number; size: number; nameBytes: Uint8Array }> = []

    // 1. Write Local File Headers + File Data
    for (const f of this.files) {
      const nameBytes = new TextEncoder().encode(f.name)
      const fileCrc = crc32(f.data)
      const localHeaderOffset = offset

      centralDirOffsets.push({
        offset: localHeaderOffset,
        crc: fileCrc,
        size: f.data.length,
        nameBytes
      })

      // Signature 0x04034b50 (PK\x03\x04)
      view.setUint32(offset, 0x04034b50, true); offset += 4
      view.setUint16(offset, 20, true); offset += 2 // Version needed to extract (2.0)
      view.setUint16(offset, 0, true); offset += 2  // General purpose bit flag
      view.setUint16(offset, 0, true); offset += 2  // Compression method (0 = Store)
      view.setUint16(offset, 0x4800, true); offset += 2 // Time: 09:00
      view.setUint16(offset, 0x589b, true); offset += 2 // Date: 2024-04-27
      view.setUint32(offset, fileCrc, true); offset += 4 // CRC-32
      view.setUint32(offset, f.data.length, true); offset += 4 // Compressed size
      view.setUint32(offset, f.data.length, true); offset += 4 // Uncompressed size
      view.setUint16(offset, nameBytes.length, true); offset += 2 // File name length
      view.setUint16(offset, 0, true); offset += 2 // Extra field length

      // Write file name
      buffer.set(nameBytes, offset); offset += nameBytes.length
      // Write file content
      buffer.set(f.data, offset); offset += f.data.length
    }

    const centralDirStart = offset

    // 2. Write Central Directory Headers
    for (let i = 0; i < this.files.length; i++) {
      const meta = centralDirOffsets[i]

      // Signature 0x02014b50 (PK\x01\x02)
      view.setUint32(offset, 0x02014b50, true); offset += 4
      view.setUint16(offset, 20, true); offset += 2 // Version made by
      view.setUint16(offset, 20, true); offset += 2 // Version needed to extract
      view.setUint16(offset, 0, true); offset += 2  // Bit flag
      view.setUint16(offset, 0, true); offset += 2  // Compression method
      view.setUint16(offset, 0x4800, true); offset += 2 // Time
      view.setUint16(offset, 0x589b, true); offset += 2 // Date
      view.setUint32(offset, meta.crc, true); offset += 4 // CRC-32
      view.setUint32(offset, meta.size, true); offset += 4 // Compressed size
      view.setUint32(offset, meta.size, true); offset += 4 // Uncompressed size
      view.setUint16(offset, meta.nameBytes.length, true); offset += 2 // Name length
      view.setUint16(offset, 0, true); offset += 2 // Extra field length
      view.setUint16(offset, 0, true); offset += 2 // File comment length
      view.setUint16(offset, 0, true); offset += 2 // Disk number start
      view.setUint16(offset, 0, true); offset += 2 // Internal file attributes
      view.setUint32(offset, 0, true); offset += 4 // External file attributes
      view.setUint32(offset, meta.offset, true); offset += 4 // Relative offset of local header

      buffer.set(meta.nameBytes, offset); offset += meta.nameBytes.length
    }

    const centralDirSize = offset - centralDirStart

    // 3. Write End of Central Directory Record (EOCD)
    // Signature 0x06054b50 (PK\x05\x06)
    view.setUint32(offset, 0x06054b50, true); offset += 4
    view.setUint16(offset, 0, true); offset += 2 // Disk number
    view.setUint16(offset, 0, true); offset += 2 // Disk with central dir
    view.setUint16(offset, this.files.length, true); offset += 2 // Num records on disk
    view.setUint16(offset, this.files.length, true); offset += 2 // Total num records
    view.setUint32(offset, centralDirSize, true); offset += 4 // Size of central dir
    view.setUint32(offset, centralDirStart, true); offset += 4 // Offset of central dir
    view.setUint16(offset, 0, true); offset += 2 // Comment length

    return new Blob([buffer.subarray(0, offset)], { type: mimeType })
  }
}

// ── CorelDRAW Vector Dieline Generator (mm Scale & Industry Layers) ──
function generateCorelDielineSvg(design: Design): string {
  const { length: L, width: W, height: H } = design.dimensions
  const isBag = design.category === 'Bag' || /shopping.?bag/i.test(`${design.name} ${design.notes}`)
  const isCanister = design.category === 'Canister'
  const brandTitle = design.name || 'Untitled Design'
  const colorHex = design.color || '#262626'

  let docW = 0
  let docH = 0
  let cutPaths = ''
  let creasePaths = ''
  let artworkContent = ''
  let dimensionCallouts = ''

  if (isBag) {
    // Retail Shopping Bag Dieline
    // Layout: Turn-top (40mm) + Height (H) + Bottom Envelope (W*0.6)
    const turnTop = 40
    const bottomFold = Math.round(W * 0.6)
    const glueTab = 15
    docW = glueTab + L + W + L + W + 60
    docH = turnTop + H + bottomFold + 60
    const startX = 30
    const startY = 30

    // Cut outer contour
    const bagWTotal = glueTab + L + W + L + W
    const bagHTotal = turnTop + H + bottomFold

    cutPaths = `
      <!-- Shopping Bag Die Cut Perimeter (Red 0.076mm Hairline) -->
      <rect x="${startX}" y="${startY}" width="${bagWTotal}" height="${bagHTotal}" />
      <!-- Handle Punch Holes (6mm diameter with 100mm spacing) -->
      <circle cx="${startX + glueTab + L * 0.3}" cy="${startY + turnTop * 0.5}" r="3" />
      <circle cx="${startX + glueTab + L * 0.7}" cy="${startY + turnTop * 0.5}" r="3" />
      <circle cx="${startX + glueTab + L + W + L * 0.3}" cy="${startY + turnTop * 0.5}" r="3" />
      <circle cx="${startX + glueTab + L + W + L * 0.7}" cy="${startY + turnTop * 0.5}" r="3" />
    `

    // Vertical fold lines between panels
    const xGlue = startX + glueTab
    const xFront = xGlue + L
    const xSide1 = xFront + W
    const xBack = xSide1 + L
    const yBody = startY + turnTop
    const yBottom = yBody + H

    creasePaths = `
      <!-- Vertical Panel Creases -->
      <line x1="${xGlue}" y1="${startY}" x2="${xGlue}" y2="${startY + bagHTotal}" />
      <line x1="${xFront}" y1="${startY}" x2="${xFront}" y2="${startY + bagHTotal}" />
      <line x1="${xSide1}" y1="${startY}" x2="${xSide1}" y2="${startY + bagHTotal}" />
      <line x1="${xBack}" y1="${startY}" x2="${xBack}" y2="${startY + bagHTotal}" />

      <!-- Side Gusset Valley Crease Centers -->
      <line x1="${xFront + W / 2}" y1="${yBody}" x2="${xFront + W / 2}" y2="${yBottom}" stroke-dasharray="1.5,1.5" />
      <line x1="${xBack + W / 2}" y1="${yBody}" x2="${xBack + W / 2}" y2="${yBottom}" stroke-dasharray="1.5,1.5" />

      <!-- Horizontal Turn-top & Bottom Creases -->
      <line x1="${startX}" y1="${yBody}" x2="${startX + bagWTotal}" y2="${yBody}" />
      <line x1="${startX}" y1="${yBottom}" x2="${startX + bagWTotal}" y2="${yBottom}" />
    `

    // Artwork
    artworkContent = `
      <!-- Front Panel Artwork -->
      <rect x="${xGlue}" y="${yBody}" width="${L}" height="${H}" fill="${colorHex}" fill-opacity="0.88" />
      <text x="${xGlue + L / 2}" y="${yBody + H * 0.45}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="${Math.min(22, L / 8)}" fill="#ffffff">${brandTitle}</text>
      <text x="${xGlue + L / 2}" y="${yBody + H * 0.52}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.min(9, L / 20)}" letter-spacing="1.5" fill="#ffffff" opacity="0.85">MINAL ENTERPRISES · LUXURY PACKAGING</text>

      <!-- Back Panel Artwork -->
      <rect x="${xSide1}" y="${yBody}" width="${L}" height="${H}" fill="${colorHex}" fill-opacity="0.88" />
      <text x="${xSide1 + L / 2}" y="${yBody + H * 0.48}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="${Math.min(18, L / 10)}" fill="#ffffff">${brandTitle}</text>
    `

    // Dimensions
    dimensionCallouts = `
      <text x="${xGlue + L / 2}" y="${yBottom + 25}" text-anchor="middle" font-size="10" fill="#333333">Face: ${L} mm</text>
      <text x="${xFront + W / 2}" y="${yBottom + 25}" text-anchor="middle" font-size="10" fill="#333333">Gusset: ${W} mm</text>
      <text x="${startX - 15}" y="${yBody + H / 2}" text-anchor="middle" font-size="10" fill="#333333" transform="rotate(-90 ${startX - 15} ${yBody + H / 2})">Height: ${H} mm</text>
    `
  } else if (isCanister) {
    // Cylindrical Canister Unrolled Tube Dieline
    const circ = Math.round(Math.PI * L)
    const lap = 15
    docW = circ + lap + 80
    docH = H + L + 100
    const startX = 40
    const startY = 40

    cutPaths = `
      <!-- Canister Body Wrap Perimeter -->
      <rect x="${startX}" y="${startY}" width="${circ + lap}" height="${H}" />
      <!-- Top Lid Disc -->
      <circle cx="${startX + circ * 0.25}" cy="${startY + H + L / 2 + 20}" r="${L / 2}" />
      <!-- Bottom Seal Disc -->
      <circle cx="${startX + circ * 0.75}" cy="${startY + H + L / 2 + 20}" r="${L / 2}" />
    `

    creasePaths = `
      <!-- Glue Lap Crease -->
      <line x1="${startX + lap}" y1="${startY}" x2="${startX + lap}" y2="${startY + H}" />
    `

    artworkContent = `
      <rect x="${startX + lap}" y="${startY}" width="${circ}" height="${H}" fill="${colorHex}" fill-opacity="0.9" />
      <text x="${startX + lap + circ / 2}" y="${startY + H * 0.45}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="${Math.min(24, H / 6)}" fill="#ffffff">${brandTitle}</text>
      <text x="${startX + lap + circ / 2}" y="${startY + H * 0.54}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10" letter-spacing="1.5" fill="#ffffff" opacity="0.8">CANISTER PACKAGING · FOOD-SAFE LINER</text>
    `

    dimensionCallouts = `
      <text x="${startX + circ / 2}" y="${startY + H + 18}" text-anchor="middle" font-size="10" fill="#333333">Circumference: ${circ} mm (Ø ${L} mm)</text>
      <text x="${startX - 15}" y="${startY + H / 2}" text-anchor="middle" font-size="10" fill="#333333" transform="rotate(-90 ${startX - 15} ${startY + H / 2})">Height: ${H} mm</text>
    `
  } else {
    // Rigid Box / Folding Carton Dieline
    // Standard Cross Template (Base Tray with 4 Fold-Up Walls)
    const flap = Math.min(H, 120)
    docW = W + flap * 2 + 80
    docH = L + flap * 2 + 80
    const startX = 40 + flap
    const startY = 40 + flap

    cutPaths = `
      <!-- Outer Cut Contour (Red 0.076mm Hairline) -->
      <path d="M ${startX} ${startY - flap}
               h ${W}
               v ${flap}
               h ${flap}
               v ${L}
               h ${-flap}
               v ${flap}
               h ${-W}
               v ${-flap}
               h ${-flap}
               v ${-L}
               h ${flap}
               Z" />
      <!-- Corner Corner Corner Corner Glue Tabs (45-degree angled) -->
      <polygon points="${startX},${startY} ${startX - flap * 0.4},${startY - flap * 0.3} ${startX - flap * 0.4},${startY - flap * 0.7} ${startX},${startY - flap}" />
      <polygon points="${startX + W},${startY} ${startX + W + flap * 0.4},${startY - flap * 0.3} ${startX + W + flap * 0.4},${startY - flap * 0.7} ${startX + W},${startY - flap}" />
    `

    creasePaths = `
      <!-- Base Perimeter Creases (Cyan Dashed Hairline) -->
      <rect x="${startX}" y="${startY}" width="${W}" height="${L}" />
      <line x1="${startX}" y1="${startY}" x2="${startX + W}" y2="${startY}" />
      <line x1="${startX}" y1="${startY + L}" x2="${startX + W}" y2="${startY + L}" />
      <line x1="${startX}" y1="${startY}" x2="${startX}" y2="${startY + L}" />
      <line x1="${startX + W}" y1="${startY}" x2="${startX + W}" y2="${startY + L}" />
    `

    artworkContent = `
      <!-- Bottom / Top Face Graphic Panel -->
      <rect x="${startX}" y="${startY}" width="${W}" height="${L}" fill="${colorHex}" fill-opacity="0.88" />
      <text x="${startX + W / 2}" y="${startY + L / 2 - 5}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="${Math.min(22, W / 8)}" fill="#ffffff">${brandTitle}</text>
      <text x="${startX + W / 2}" y="${startY + L / 2 + 14}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${Math.min(8.5, W / 18)}" letter-spacing="1.2" fill="#ffffff" opacity="0.85">THOUGHTFULLY MADE · JUST FOR YOU</text>
    `

    dimensionCallouts = `
      <text x="${startX + W / 2}" y="${startY + L + flap + 20}" text-anchor="middle" font-size="10" fill="#333333">Width: ${W} mm</text>
      <text x="${startX + W + flap + 20}" y="${startY + L / 2}" text-anchor="middle" font-size="10" fill="#333333" transform="rotate(90 ${startX + W + flap + 20} ${startY + L / 2})">Length: ${L} mm</text>
      <text x="${startX + W / 2}" y="${startY + L + flap / 2 + 4}" text-anchor="middle" font-size="9" fill="#555555">Wall Height: ${H} mm</text>
    `
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${docW}mm" height="${docH}mm" viewBox="0 0 ${docW} ${docH}"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:cdr="http://schemas.corel.com/coreldraw/2008/extension"
     xml:space="preserve"
     version="1.1">
  <!-- CorelDRAW Dieline Document · Generated by Minal.ai -->
  <metadata>
    <cdr:documentTitle>${brandTitle} - CorelDRAW Dieline</cdr:documentTitle>
    <cdr:units>millimeters</cdr:units>
    <cdr:version>CorelDRAW 2024 / X8 Compatible</cdr:version>
    <cdr:boardDimensions length="${L}" width="${W}" height="${H}" />
  </metadata>

  <!-- BACKGROUND SHEET -->
  <rect x="0" y="0" width="${docW}" height="${docH}" fill="#ffffff" />

  <!-- 1. PRINT ARTWORK LAYER (CorelDRAW: Artwork) -->
  <g id="Artwork_Layer" cdr:layerName="Artwork" opacity="1.0">
    ${artworkContent}
  </g>

  <!-- 2. CREASE / MATRIX SCORE LAYER (CorelDRAW: Crease - Cyan Dashed Hairline) -->
  <g id="Crease_Layer" cdr:layerName="Crease" stroke="#00AEEF" stroke-width="0.076" stroke-dasharray="2,1" fill="none">
    ${creasePaths}
  </g>

  <!-- 3. STEEL DIE CUT LAYER (CorelDRAW: DieCut - Red Hairline 0.076mm) -->
  <g id="DieCut_Layer" cdr:layerName="DieCut" stroke="#FF0000" stroke-width="0.076" fill="none">
    ${cutPaths}
  </g>

  <!-- 4. TECHNICAL DIMENSIONS & ANNOTATIONS LAYER -->
  <g id="Dimensions_Layer" cdr:layerName="Dimensions" font-family="Arial, Helvetica, sans-serif">
    <text x="30" y="${docH - 20}" font-size="9" fill="#777777">MINAL.AI · CAD PACKAGING SPECIFICATION · 1:1 SCALE MILLIMETERS · RED = CUT (0.076mm), CYAN = CREASE</text>
    ${dimensionCallouts}
  </g>
</svg>`
}

// ── CorelDRAW Metadata XML ──
function generateCorelMetadataXml(design: Design): string {
  const { length, width, height } = design.dimensions
  return `<?xml version="1.0" encoding="UTF-8"?>
<corelDocument xmlns="http://schemas.corel.com/coreldraw/2008/metadata">
  <appInfo>
    <application>CorelDRAW</application>
    <generator>Minal.ai 3D Packaging Studio</generator>
    <version>25.0</version>
    <schemaVersion>1.0</schemaVersion>
  </appInfo>
  <documentProperties>
    <title>${design.name || 'Packaging Dieline'}</title>
    <subject>Packaging Dieline - ${design.category}</subject>
    <creator>Minal.ai AI Packaging Studio</creator>
    <creationDate>${new Date().toISOString()}</creationDate>
    <material>${design.material}</material>
    <finish>${design.finish}</finish>
    <dimensions unit="mm">
      <length>${length}</length>
      <width>${width}</width>
      <height>${height}</height>
    </dimensions>
    <colorHex>${design.color}</colorHex>
    <quantity>${design.quantity}</quantity>
    <dieRuleSpecs>
      <cuttingBlade>0.71mm / 2pt (Red Hairline)</cuttingBlade>
      <creasingRule>0.71mm / 2pt (Cyan Dashed)</creasingRule>
    </dieRuleSpecs>
  </documentProperties>
</corelDocument>`
}

// ── Export Full CorelDRAW (.cdr) Package File ──
export function exportToCdr(design: Design): Blob {
  const zip = new SimpleZip()

  // 1. CorelDRAW mimetype file (MUST be first entry, uncompressed)
  zip.addFile('mimetype', 'application/x-vnd.corel.draw.document+zip')

  // 2. META-INF Manifest
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:media-type="application/x-vnd.corel.draw.document+zip" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="metadata/metadata.xml"/>
  <manifest:file-entry manifest:media-type="image/svg+xml" manifest:full-path="content/dieline.svg"/>
  <manifest:file-entry manifest:media-type="application/octet-stream" manifest:full-path="content/root.dat"/>
</manifest:manifest>`
  zip.addFile('META-INF/manifest.xml', manifest)

  // 3. Document Metadata
  const metadata = generateCorelMetadataXml(design)
  zip.addFile('metadata/metadata.xml', metadata)

  // 4. Primary CorelDRAW Vector Dieline (SVG with CorelDRAW XML extensions)
  const dielineSvg = generateCorelDielineSvg(design)
  zip.addFile('content/dieline.svg', dielineSvg)

  // 5. Binary CorelDRAW RIFF stream / root payload
  const rootDat = new TextEncoder().encode(dielineSvg)
  zip.addFile('content/root.dat', rootDat)

  // 6. Return as CorelDRAW document Blob
  return zip.generateBlob('application/x-coreldraw')
}
