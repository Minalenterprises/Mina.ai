import type { Design } from './types'
import { buildDieline } from './dieline-layout'

/** Millimeter vector geometry from the identical on-screen layout. Artwork is in SVG/CDR. */
export function exportToDxf(design: Design): Blob {
  const layout = buildDieline(design), output: string[] = []
  const add = (...values: (string | number)[]) => output.push(...values.map(String))
  add(0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1015', 9, '$INSUNITS', 70, 4, 9, '$MEASUREMENT', 70, 1, 0, 'ENDSEC')
  add(0, 'SECTION', 2, 'TABLES', 0, 'TABLE', 2, 'LTYPE', 70, 1, 0, 'LTYPE', 2, 'CONTINUOUS', 70, 0, 3, 'Solid line', 72, 65, 73, 0, 40, 0, 0, 'ENDTAB', 0, 'TABLE', 2, 'LAYER', 70, 3)
  for (const [name, color] of [['DIECUT', 1], ['CREASE', 4], ['DIMENSIONS', 7]]) add(0, 'LAYER', 2, name, 70, 0, 62, color, 6, 'CONTINUOUS')
  add(0, 'ENDTAB', 0, 'ENDSEC', 0, 'SECTION', 2, 'ENTITIES')
  const line = (layer: string, x1: number, y1: number, x2: number, y2: number) => add(0, 'LINE', 8, layer, 10, x1.toFixed(3), 20, (layout.height - y1).toFixed(3), 30, 0, 11, x2.toFixed(3), 21, (layout.height - y2).toFixed(3), 31, 0)
  const text = (x: number, y: number, value: string, size = 3.5) => add(0, 'TEXT', 8, 'DIMENSIONS', 10, x, 20, layout.height - y, 30, 0, 40, size, 1, value.replace(/[\r\n]/g, ' ').replace(/[^\x20-\x7e]/g, char => `\\U+${char.charCodeAt(0).toString(16).padStart(4, '0')}`))
  for (const r of layout.rules) {
    for (let i = 1; i < r.points.length + (r.closed ? 1 : 0); i++) {
      const a = r.points[i - 1], b = r.points[i % r.points.length]
      line(r.layer === 'cut' ? 'DIECUT' : 'CREASE', ...a, ...b)
    }
  }
  for (const c of layout.holes) add(0, 'CIRCLE', 8, 'DIECUT', 10, c.x, 20, layout.height - c.y, 30, 0, 40, c.radius)
  for (const d of layout.dimensions) { line('DIMENSIONS', d.x1, d.y1, d.x2, d.y2); text((d.x1 + d.x2) / 2, (d.y1 + d.y2) / 2 - 3, d.label) }
  for (const p of layout.panels) text(p.x + 3, p.y + 6, p.name, Math.min(3, p.width / 15))
  text(24, 17, design.name || 'Packaging design', 6)
  text(24, 27, layout.title)
  text(24, 36, `${design.dimensions.length} x ${design.dimensions.width} x ${design.dimensions.height} mm; 1:1 mm`)
  text(24, layout.footerY, `${design.material}; ${design.finish}; quantity ${design.quantity}`)
  text(24, layout.footerY + 8, 'CUT: red. CREASE: cyan. Full printed artwork is in SVG / CDR.')
  text(24, layout.footerY + 18, 'Structural concept; confirm manufacturing allowances before production.')
  add(0, 'ENDSEC', 0, 'EOF')
  return new Blob([output.join('\r\n')], { type: 'application/dxf' })
}
