import type { Design } from './types'

export type Point = [number, number]
export type Rule = { points: Point[]; closed?: boolean; layer: 'cut' | 'fold' }
export type Panel = { id: string; name: string; x: number; y: number; width: number; height: number; polygon?: Point[]; circle?: boolean; artwork?: 'front' | 'lid' | 'info' }
export type Dimension = { x1: number; y1: number; x2: number; y2: number; label: string }
export type FlatLayout = { width: number; height: number; panels: Panel[]; rules: Rule[]; holes: { x: number; y: number; radius: number }[]; dimensions: Dimension[]; footerY: number; title: string; notes: string[] }
export const mm = (value: number) => Number(value.toFixed(2)).toString()

/** One physical coordinate system for the preview, SVG, CorelDRAW, and CAD geometry. */
export function buildDieline(design: Design): FlatLayout {
  const { length: L, width: W, height: H } = design.dimensions
  const result: FlatLayout = { width: 0, height: 0, panels: [], rules: [], holes: [], dimensions: [], footerY: 0, title: '', notes: [] }
  const info = design.productInfo
  const panel = (id: string, name: string, x: number, y: number, width: number, height: number, artwork?: Panel['artwork']) => {
    const p: Panel = { id, name, x, y, width, height, artwork }
    result.panels.push(p)
    return p
  }
  const line = (layer: Rule['layer'], x1: number, y1: number, x2: number, y2: number) => result.rules.push({ layer, points: [[x1, y1], [x2, y2]] })
  const rect = (layer: Rule['layer'], x: number, y: number, w: number, h: number) => result.rules.push({ layer, closed: true, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] })
  const dimH = (x: number, y: number, w: number, name = '') => result.dimensions.push({ x1: x, y1: y, x2: x + w, y2: y, label: `${name ? name + ' · ' : ''}${mm(w)} mm` })
  const dimV = (x: number, y: number, h: number, name = '') => result.dimensions.push({ x1: x, y1: y, x2: x, y2: y + h, label: `${name ? name + ' · ' : ''}${mm(h)} mm` })
  const tray = (id: string, ox: number, oy: number, l: number, w: number, h: number, lid = false) => {
    const x = ox + h, y = oy + h, tab = Math.min(15, h * .35), bevel = Math.min(4, h * .2)
    result.rules.push({ layer: 'cut', closed: true, points: [
      [x, oy], [x + l, oy], [x + l + tab, oy + bevel], [x + l + tab, y - bevel], [x + l, y],
      [x + l + h, y], [x + l + h, y + w], [x + l, y + w], [x + l + tab, y + w + bevel], [x + l + tab, y + w + h - bevel],
      [x + l, y + w + h], [x, y + w + h], [x - tab, y + w + h - bevel], [x - tab, y + w + bevel], [x, y + w],
      [ox, y + w], [ox, y], [x, y], [x - tab, y - bevel], [x - tab, oy + bevel],
    ] })
    rect('fold', x, y, l, w)
    for (const tx of [x, x + l]) { line('fold', tx, oy, tx, y); line('fold', tx, y + w, tx, y + w + h) }
    panel(`${id}-base`, lid ? 'LID / TOP' : 'BASE / UNDERSIDE', x, y, l, w, lid ? 'lid' : info?.placement !== 'back' ? 'info' : undefined)
    panel(`${id}-front`, 'FRONT', x, y + w, l, h, !lid ? 'front' : undefined)
    panel(`${id}-back`, 'BACK', x, oy, l, h, !lid && info?.placement === 'back' ? 'info' : undefined)
    panel(`${id}-left`, 'LEFT', ox, y, h, w)
    panel(`${id}-right`, 'RIGHT', x + l, y, h, w)
    dimH(x, oy - 8, l, 'L'); dimV(x + l + h + 9, y, w, 'W'); dimV(x + l + h + 9, y + w, h, lid ? 'Lid depth' : 'H')
    if (!lid && design.hasHandles) {
      const spacing = Math.min(l * .23, 75), inset = Math.min(h * .14, 12)
      for (const hx of [x + l / 2 - spacing, x + l / 2 + spacing]) {
        result.holes.push({ x: hx, y: y + w + h - inset, radius: 2 }, { x: hx, y: oy + inset, radius: 2 })
      }
    }
    return oy + w + 2 * h
  }
  if (design.category === 'Bag' || design.category === 'Carton') {
    const bag = design.category === 'Bag', glue = 15, turnover = bag ? Math.min(30, H * .15) : 0
    const flap = bag ? W * .5 : W, top = bag ? turnover : design.openTop ? 0 : flap
    const x = 24, y = 60 + top, lengths = [L, W, L, W], total = 2 * (L + W) + glue
    result.title = bag ? 'GUSSETED BAG · FLAT ARTWORK' : 'FOLDING CARTON · FLAT ARTWORK'
    panel('glue', 'GLUE LAP', x, y, glue, H)
    let px = x + glue
    for (const [i, len] of lengths.entries()) {
      panel(`body-${i}`, ['FRONT', 'RIGHT GUSSET', 'BACK', 'LEFT GUSSET'][i], px, y, len, H, i === 0 ? 'front' : i === 2 && info?.placement === 'back' ? 'info' : undefined)
      line('fold', px, bag ? y - top : y, px, bag ? y + H + flap : y + H)
      dimH(px, 48, len, i % 2 ? 'W' : 'L')
      if (bag) {
        panel(`turn-${i}`, 'TURNOVER', px, y - top, len, top)
        panel(`bottom-${i}`, 'BOTTOM FOLD', px, y + H, len, flap)
        if (i % 2) line('fold', px + len / 2, y - top, px + len / 2, y + H + flap)
      } else {
        if (top) { panel(`top-${i}`, 'TOP FLAP', px, y - top, len, top, i === 0 ? 'lid' : undefined); line('cut', px + len, y - top, px + len, y) }
        panel(`bottom-${i}`, 'BOTTOM FLAP', px, y + H, len, flap, i === 0 && info?.placement !== 'back' ? 'info' : undefined)
        line('cut', px + len, y + H, px + len, y + H + flap)
      }
      if (design.hasHandles && (i === 0 || i === 2)) {
        const spread = Math.min(L * .23, 75), inset = Math.min(H * .14, 12)
        for (const hx of [px + L / 2 - spread, px + L / 2 + spread]) result.holes.push({ x: hx, y: y + inset, radius: 2 })
      }
      px += len
    }
    if (bag) rect('cut', x, y - top, total, top + H + flap)
    else {
      result.rules.push({ layer: 'cut', closed: true, points: [[x, y], [x + glue, y], [x + glue, y - top], [x + total, y - top], [x + total, y + H + flap], [x + glue, y + H + flap], [x + glue, y + H], [x, y + H]] })
    }
    line('fold', x + glue, y, x + total, y); line('fold', x + glue, y + H, x + total, y + H)
    dimV(x + total + 10, y, H, 'H'); dimV(x + total + 10, y + H, flap, 'Bottom'); dimH(x, y + H + flap + 12, total, 'Blank')
    if (bag && info?.visible && info.placement !== 'back') {
      const iy = y + H + flap + 40
      panel('bottom-info', 'BOTTOM INFORMATION LABEL', x, iy, L, W, 'info'); rect('cut', x, iy, L, W)
      dimH(x, iy + W + 10, L); dimV(x + L + 10, iy, W)
      result.notes.push('Bottom information supplied as a separate adhesive label for the assembled bag.')
    }
    result.notes.push(bag ? `Turnover ${mm(top)} mm · bottom fold ${mm(flap)} mm · glue lap 15 mm.` : 'Concept closure flaps; locking tabs and tuck allowances require a converter specification.')
  } else if (design.category === 'Canister') {
    const diameter = Math.min(L, W), circumference = Math.PI * diameter, x = 24, y = 60, r = diameter / 2
    result.title = 'CANISTER · WRAP + DISCS'
    rect('cut', x, y, circumference + 15, H); line('fold', x + circumference, y, x + circumference, y + H)
    panel('wrap', 'BODY WRAP', x, y, circumference, H, 'front'); panel('glue', 'GLUE LAP', x + circumference, y, 15, H)
    dimH(x, y - 12, circumference, 'Circumference'); dimV(x + circumference + 25, y, H, 'H')
    for (let i = 0; i < (design.openTop ? 1 : 2); i++) {
      const dx = x + i * (diameter + 28), dy = y + H + 38
      const p = panel(`disc-${i}`, i ? 'LID DISC' : 'BOTTOM DISC', dx, dy, diameter, diameter, i ? 'lid' : 'info')
      p.circle = true
      result.holes.push({ x: dx + r, y: dy + r, radius: r }); dimH(dx, dy + diameter + 10, diameter, 'Diameter')
    }
    result.notes.push(`Circular diameter ${mm(diameter)} mm · glue overlap 15 mm; wrap circumference excludes overlap.`)
  } else if (design.structure === 'hexagon') {
    const r = Math.min(L, W) / 2, side = r, width = Math.sqrt(3) * r, x = 24, y = 60
    result.title = 'HEXAGON · SIDE STRIP + BASE / LID'
    rect('cut', x, y, side * 6 + 15, H)
    for (let i = 0; i < 6; i++) {
      panel(`hex-wall-${i}`, i ? `SIDE ${i + 1}` : 'FRONT', x + i * side, y, side, H, i === 0 ? 'front' : i === 3 && info?.placement === 'back' ? 'info' : undefined)
      line('fold', x + (i + 1) * side, y, x + (i + 1) * side, y + H)
    }
    panel('hex-glue', 'GLUE LAP', x + side * 6, y, 15, H)
    dimH(x, y - 12, side, 'Side'); dimV(x + side * 6 + 25, y, H, 'H')
    for (let i = 0; i < (design.openTop ? 1 : 2); i++) {
      const dx = x + i * (width + 28), dy = y + H + 35
      const p = panel(`hex-disc-${i}`, i ? 'LID' : 'BASE', dx, dy, width, r * 2, i ? 'lid' : info?.placement !== 'back' ? 'info' : undefined)
      p.polygon = Array.from({ length: 6 }, (_, n): Point => { const a = Math.PI / 6 + n * Math.PI / 3; return [dx + width / 2 + Math.cos(a) * r, dy + r + Math.sin(a) * r] })
      result.rules.push({ layer: 'cut', closed: true, points: p.polygon }); dimH(dx, dy + 2 * r + 10, width, 'Across flats')
    }
    result.notes.push('Separate rigid-board base/lid pieces and six-sided wrap; assembly and rim allowance need converter review.')
  } else {
    result.title = design.structure === 'drawer' ? 'DRAWER · TRAY + SLEEVE' : 'PRESENTATION BOX · TRAY + LID'
    let end = tray('tray', 24, 60, L, W, H)
    if (design.structure === 'drawer') {
      const sy = end + 40, glue = 15
      let sx = 24
      for (const [i, w] of [W, H, W, H, glue].entries()) {
        panel(`sleeve-${i}`, ['SLEEVE TOP', 'SIDE', 'SLEEVE BOTTOM', 'SIDE', 'GLUE LAP'][i], sx, sy, w, L, i === 0 ? 'lid' : undefined)
        if (i) line('fold', sx, sy, sx, sy + L)
        dimH(sx, sy - 10, w); sx += w
      }
      rect('cut', 24, sy, 2 * (W + H) + glue, L); dimV(sx + 10, sy, L, 'L'); end = sy + L
      result.notes.push('Sleeve uses nominal dimensions; sliding clearance is set by the converter.')
    } else if (!design.openTop) {
      const lidDepth = Math.min(H * .25, 20), clearance = (design.wallThickness ?? 2) * 2
      const lidY = end + 40
      end = tray('lid', 24, lidY, L + clearance, W + clearance, lidDepth, true)
      if (design.structure === 'window') {
        const ww = L * .7, wh = W * .62
        const wx = 24 + lidDepth + (L + clearance - ww) / 2, wy = lidY + lidDepth + (W + clearance - wh) / 2
        rect('cut', wx, wy, ww, wh)
        panel('window-hole', 'CLEAR WINDOW', wx, wy, ww, wh)
        result.notes.push(`Window cut ${mm(ww)} × ${mm(wh)} mm; clear film supplied separately.`)
      }
      result.notes.push(`Lid clearance ${mm(clearance)} mm · lid return ${mm(lidDepth)} mm · corner glue tabs shown.`)
    }
    if (design.structure === 'divider') {
      const dh = Math.max(5, H - (design.wallThickness ?? 2)), y = end + 35
      for (const [i, size] of [L, W].entries()) {
        const dx = 24 + (i ? L + 24 : 0)
        panel(`divider-${i}`, `DIVIDER ${i + 1}`, dx, y, size, dh); rect('cut', dx, y, size, dh)
        const slot = design.wallThickness ?? 2
        result.rules.push({ layer: 'cut', points: [[dx + size / 2 - slot / 2, y], [dx + size / 2 - slot / 2, y + dh / 2], [dx + size / 2 + slot / 2, y + dh / 2], [dx + size / 2 + slot / 2, y]] })
        dimH(dx, y - 9, size)
      }
    }
  }
  const xs = result.rules.flatMap(r => r.points.map(p => p[0])).concat(result.dimensions.map(d => Math.max(d.x1, d.x2) + 14))
  const ys = result.rules.flatMap(r => r.points.map(p => p[1])).concat(result.dimensions.map(d => Math.max(d.y1, d.y2) + 8))
  for (const h of result.holes) { xs.push(h.x + h.radius); ys.push(h.y + h.radius) }
  result.width = Math.max(320, ...xs) + 24
  if (design.customCode) result.notes.push('Custom 3D code is not unfolded; this sheet shows the nominal base packaging.')
  result.footerY = Math.max(...ys) + 24
  result.height = result.footerY + 52
  return result
}
