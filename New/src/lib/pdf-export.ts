import type { Design } from './types'
import { buildDieline, sheetMarks, type Point } from './dieline-layout'

/**
 * Print-proof PDF written directly (no dependencies): page size = sheet at 1:1 mm, the printed artwork
 * as a high-resolution JPEG on an "Artwork" layer, and die lines, marks and dimensions as true vectors
 * in CMYK on separate PDF layers (optional content groups) that Acrobat, CorelDRAW and Illustrator list.
 * Dimension text uses the standard Helvetica font (live text, Latin characters).
 */
const PT = 72 / 25.4
const enc = new TextEncoder()
type Layer = 'Artwork' | 'Cut' | 'Crease' | 'Perforation' | 'Marks' | 'Dimensions'
const LAYERS: Layer[] = ['Artwork', 'Cut', 'Crease', 'Perforation', 'Marks', 'Dimensions']

const pdfText = (value: string) => value.replace(/[^\x20-\x7e\xa0-\xff]/g, c => ({ '×': 'x', '·': '-', '–': '-', '—': '-', '’': "'", '“': '"', '”': '"', 'Ø': 'O' } as Record<string, string>)[c] ?? '?').replace(/([\\()])/g, '\\$1')
const f = (v: number) => (Math.round(v * 1000) / 1000).toString()

export async function exportPrintPdf(design: Design, artworkJpeg: Uint8Array, pixel: { width: number; height: number }): Promise<Blob> {
  const layout = buildDieline(design), W = layout.width * PT, H = layout.height * PT
  const X = (x: number) => f(x * PT), Y = (y: number) => f((layout.height - y) * PT)
  const ops: string[] = []
  const begin = (layer: Layer) => ops.push(`/OC /oc${LAYERS.indexOf(layer)} BDC`), end = () => ops.push('EMC')
  const polyline = (points: Point[], closed?: boolean) => ops.push(`${points.map(([x, y], i) => `${X(x)} ${Y(y)} ${i ? 'l' : 'm'}`).join(' ')} ${closed ? 's' : 'S'}`)
  const circle = (cx: number, cy: number, r: number) => {
    const k = .5523 * r
    ops.push(`${X(cx + r)} ${Y(cy)} m ${X(cx + r)} ${Y(cy - k)} ${X(cx + k)} ${Y(cy - r)} ${X(cx)} ${Y(cy - r)} c ${X(cx - k)} ${Y(cy - r)} ${X(cx - r)} ${Y(cy - k)} ${X(cx - r)} ${Y(cy)} c ${X(cx - r)} ${Y(cy + k)} ${X(cx - k)} ${Y(cy + r)} ${X(cx)} ${Y(cy + r)} c ${X(cx + k)} ${Y(cy + r)} ${X(cx + r)} ${Y(cy + k)} ${X(cx + r)} ${Y(cy)} c S`)
  }
  const text = (x: number, y: number, value: string, size: number, rotate = false) => ops.push(rotate ? `BT /F1 ${f(size * PT)} Tf 0 1 -1 0 ${X(x)} ${Y(y)} Tm (${pdfText(value)}) Tj ET` : `BT /F1 ${f(size * PT)} Tf ${X(x)} ${Y(y)} Td (${pdfText(value)}) Tj ET`)

  begin('Artwork'); ops.push(`q ${f(W)} 0 0 ${f(H)} 0 0 cm /Im1 Do Q`); end()
  ops.push(`${f(.25 * PT)} w 1 J 1 j`)
  begin('Cut'); ops.push('0 1 0 0 K [] 0 d')
  for (const r of layout.rules.filter(r => r.layer === 'cut')) polyline(r.points, r.closed)
  for (const h of layout.holes) circle(h.x, h.y, h.radius)
  end()
  begin('Crease'); ops.push(`1 0 0 0 K [${f(2 * PT)} ${f(1.3 * PT)}] 0 d`)
  for (const r of layout.rules.filter(r => r.layer === 'fold')) polyline(r.points, r.closed)
  end()
  begin('Perforation'); ops.push(`0 .5 1 0 K [${f(.6 * PT)} ${f(.9 * PT)}] 0 d`)
  for (const r of layout.rules.filter(r => r.layer === 'perf')) polyline(r.points, r.closed)
  end()
  const m = sheetMarks(layout)
  begin('Marks'); ops.push(`1 1 1 1 K [] 0 d ${f(.15 * PT)} w`) // registration black prints on every plate
  for (const [p, q] of m.crop) polyline([p, q])
  for (const r of m.registration) { circle(r.x, r.y, r.r); circle(r.x, r.y, r.r * .45); polyline([[r.x - r.r * 1.5, r.y], [r.x + r.r * 1.5, r.y]]); polyline([[r.x, r.y - r.r * 1.5], [r.x, r.y + r.r * 1.5]]) }
  end()
  begin('Dimensions'); ops.push('0 0 0 .85 k 0 0 0 .6 K [] 0 d')
  text(24, 17, design.name || 'Packaging design', 6); text(24, 27, layout.title, 3.5)
  text(24, 36, `L ${design.dimensions.length} x W ${design.dimensions.width} x H ${design.dimensions.height} mm - scale 1:1 - bleed 3 mm - safe 3 mm`, 3.5)
  for (const d of layout.dimensions) {
    polyline([[d.x1, d.y1], [d.x2, d.y2]])
    const vertical = d.x1 === d.x2, cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2, approx = d.label.length * 1.75 / 2
    if (vertical) text(cx - 2.5, cy + approx, d.label, 3.5, true); else text(cx - approx, cy - 2.5, d.label, 3.5)
  }
  for (const p of layout.panels) text(p.x + 3, p.y + 5.1, p.name, Math.max(.8, Math.min(3, (p.width - 6) / Math.max(1, p.name.length * .6))))
  text(24, layout.footerY, `SHEET ${f(layout.width)} x ${f(layout.height)} mm - ${design.material} - ${design.finish} - quantity ${design.quantity}`, 3.5)
  text(24, layout.footerY + 8, 'CUT magenta (0/100/0/0) - CREASE cyan dashed (100/0/0/0) - PERF orange dotted - artwork raster 300 dpi', 3)
  end()

  const content = enc.encode(ops.join('\n'))
  const objects: (Uint8Array | string)[] = []
  const add = (o: Uint8Array | string) => { objects.push(o); return objects.length }
  const ocgIds = LAYERS.map(name => add(`<< /Type /OCG /Name (${name}) >>`))
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const imageHead = enc.encode(`<< /Type /XObject /Subtype /Image /Width ${pixel.width} /Height ${pixel.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${artworkJpeg.length} >>\nstream\n`)
  const image = add(concat([imageHead, artworkJpeg, enc.encode('\nendstream')]))
  const stream = add(concat([enc.encode(`<< /Length ${content.length} >>\nstream\n`), content, enc.encode('\nendstream')]))
  const pagesId = objects.length + 2
  const page = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /TrimBox [0 0 ${f(W)} ${f(H)}] /Contents ${stream} 0 R /Resources << /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${image} 0 R >> /Properties << ${ocgIds.map((id, i) => `/oc${i} ${id} 0 R`).join(' ')} >> >> >>`)
  add(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`)
  const ocRefs = ocgIds.map(id => `${id} 0 R`).join(' ')
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R /OCProperties << /OCGs [${ocRefs}] /D << /Order [${ocRefs}] /ON [${ocRefs}] >> >> >>`)
  const info = add(`<< /Title (${pdfText(design.name || 'Packaging design')} - print proof) /Producer (Mina packaging studio) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`)

  const chunks: Uint8Array[] = [enc.encode('%PDF-1.6\n%\xe2\xe3\xcf\xd3\n')]
  const offsets: number[] = []
  let length = chunks[0].length
  objects.forEach((o, i) => {
    offsets.push(length)
    const body = typeof o === 'string' ? enc.encode(o) : o
    const chunk = concat([enc.encode(`${i + 1} 0 obj\n`), body, enc.encode('\nendobj\n')])
    chunks.push(chunk); length += chunk.length
  })
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${length}\n%%EOF\n`
  chunks.push(enc.encode(xref))
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}
