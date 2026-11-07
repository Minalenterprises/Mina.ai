import type { Design } from './types'
import { corelPalette, type EditableSvgResult } from './vector-export'
import { hexToCmyk } from './dieline-layout'

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

  generateBlob(mimeType = 'application/zip'): Blob {
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

// ── CorelDRAW package ──
// A true .cdr is a proprietary binary (RIFF) format that cannot be written in the browser. The native
// .cdr route (/api/generate-cdr) drives an installed CorelDRAW to import the editable SVG and save .cdr.
// When that is unavailable, this package holds everything CorelDRAW opens natively with live text:
// the layered editable SVG, a CMYK palette, and instructions.

export function corelReadme(design: Design, result: EditableSvgResult) {
  return [
    `${design.name || 'Packaging design'} — CorelDRAW-ready package from Mina packaging studio`,
    '',
    'FILES',
    '  design-editable.svg   Layered, fully editable flat artwork at 1:1 mm.',
    '  mina-palette.xml      CorelDRAW custom colour palette (CMYK estimates of every colour used).',
    '',
    'OPEN IN CORELDRAW',
    '  1. Install the fonts listed below (bundled in the studio under public/fonts; also free on Google Fonts).',
    '  2. File > Import (or Open) > design-editable.svg. Keep text as text when asked.',
    '  3. Window > Dockers > Objects: every production layer is a named top-level group:',
    `     ${result.stats.layers.join(', ')}.`,
    '     Select a group and use Object > Group > Ungroup to edit, or move its contents onto a Corel layer of the same name.',
    '  4. Window > Color Palettes > Open Palette > mina-palette.xml to apply CMYK swatches.',
    '',
    'WHAT IS EDITABLE',
    `  - ${result.stats.texts} live text objects (font family, size, weight, colour, alignment and letter spacing preserved).`,
    `  - ${result.stats.motifs} individual vector print motifs, clipped to their panels (PowerClip).${result.stats.patternFallback ? ' The repeat was too dense to expand, so it is a vector pattern fill.' : ''}`,
    '  - Die lines: Cut (magenta), Crease (cyan, dashed), Perforation (orange, dotted) as separate curves.',
    '  - Bleed (3 mm) shapes, safe-zone guides, crop and registration marks, colour bar, dimensions.',
    '  - Logos and generated artwork are separate embedded bitmap objects; the material grain is a transparent bitmap overlay.',
    '',
    'LIMITS (honest notes)',
    '  - Colours are stored as RGB hex in SVG; CMYK values here and in data-cmyk attributes are naive estimates.',
    '    Use Edit > Document Properties / Color Proofing with your printer\'s ICC profile for final separations.',
    '  - Arabic/Urdu text imports as live text; check shaping with the Noto Nastaliq Urdu / Noto Sans Arabic fonts installed.',
    '  - Structural geometry is a concept: confirm tolerances, board caliper and glue areas with your converter.',
    '',
    'FONTS USED',
    ...result.fonts.map(f => `  - ${f}`),
    '',
    'COLOURS (HEX → approx. CMYK %)',
    ...result.colors.map(c => `  ${c.toUpperCase()}  C${hexToCmyk(c).join(' / ')}`),
    '',
  ].join('\r\n')
}

/** Zip with the editable SVG, CMYK palette and instructions. */
export function buildCorelPackage(design: Design, result: EditableSvgResult): Blob {
  const zip = new SimpleZip()
  zip.addFile('design-editable.svg', result.svg)
  zip.addFile('mina-palette.xml', corelPalette(design.name || 'Mina design', result.colors))
  zip.addFile('README-CorelDRAW.txt', corelReadme(design, result))
  return zip.generateBlob('application/zip')
}
