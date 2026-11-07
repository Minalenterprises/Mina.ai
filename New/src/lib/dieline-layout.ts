import type { Design } from './types'
import { getShapeParams, resolveShape, roundLayout, ROUND_LABEL_ARC, shapeFootprint } from './shapes'

export type Point = [number, number]
/** cut = steel rule, fold = crease/score, perf = perforation / tear line. */
export type Rule = { points: Point[]; closed?: boolean; layer: 'cut' | 'fold' | 'perf' }
/** `frame` overrides the printed area (mm, centred unless cy is given) so it matches the 3D label aspect. */
export type Panel = { id: string; name: string; x: number; y: number; width: number; height: number; polygon?: Point[]; circle?: boolean; artwork?: 'front' | 'lid' | 'info'; frame?: { width: number; height: number; cy?: number }; rotate?: boolean }
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
  const shape = resolveShape(design)
  const poly = (layer: Rule['layer'], points: Point[], closed = true) => result.rules.push({ layer, closed, points })
  const polygonPanel = (id: string, name: string, points: Point[], artwork?: Panel['artwork'], frame?: Panel['frame']) => {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1])
    const p = panel(id, name, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), artwork)
    p.polygon = points
    if (frame) p.frame = frame
    return p
  }
  if (EXTRA_SHAPES.has(shape)) buildExtra(design, shape, result, { panel, line, rect, dimH, dimV, tray, poly, polygonPanel })
  else if (shape === 'bag' || shape === 'carton') {
    const bag = shape === 'bag', glue = 15, turnover = bag ? Math.min(30, H * .15) : 0
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
  } else if (shape === 'canister' || shape === 'hat-box') {
    const diameter = Math.min(L, W), circumference = Math.PI * diameter, x = 24, y = 60, r = diameter / 2
    result.title = 'CANISTER · WRAP + DISCS'
    rect('cut', x, y, circumference + 15, H); line('fold', x + circumference, y, x + circumference, y + H)
    const rl = roundLayout(design); panel('wrap', 'BODY WRAP', x, y, circumference, H, 'front').frame = { width: rl.labelR * ROUND_LABEL_ARC, height: (rl.band[1] - rl.band[0]) * .92, cy: y + H - (rl.band[0] + rl.band[1]) / 2 }; panel('glue', 'GLUE LAP', x + circumference, y, 15, H)
    dimH(x, y - 12, circumference, 'Circumference'); dimV(x + circumference + 25, y, H, 'H')
    for (let i = 0; i < (design.openTop ? 1 : 2); i++) {
      const dx = x + i * (diameter + 28), dy = y + H + 38
      const p = panel(`disc-${i}`, i ? 'LID DISC' : 'BOTTOM DISC', dx, dy, diameter, diameter, i ? 'lid' : 'info')
      p.circle = true
      result.holes.push({ x: dx + r, y: dy + r, radius: r }); dimH(dx, dy + diameter + 10, diameter, 'Diameter')
    }
    if (shape === 'hat-box') {
      result.title = 'HAT BOX · BODY WRAP + LID RIM + DISCS'
      const rl2 = roundLayout(design)
      if (!design.openTop) {
        const ry = y + H + 38 + diameter + 30, rimC = Math.PI * (diameter + 4)
        rect('cut', x, ry, rimC + 15, rl2.capH); line('fold', x + rimC, ry, x + rimC, ry + rl2.capH)
        panel('lid-rim', 'LID RIM', x, ry, rimC, rl2.capH); panel('rim-glue', 'GLUE LAP', x + rimC, ry, 15, rl2.capH)
        dimV(x + rimC + 25, ry, rl2.capH, 'Lid rim')
      }
    }
    result.notes.push(`Circular diameter ${mm(diameter)} mm · glue overlap 15 mm; wrap circumference excludes overlap.`)
  } else if (shape === 'hexagon') {
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
    result.title = shape === 'drawer' ? 'DRAWER · TRAY + SLEEVE' : 'PRESENTATION BOX · TRAY + LID'
    let end = tray('tray', 24, 60, L, W, H)
    if (shape === 'drawer') {
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
      if (shape === 'window') {
        const ww = L * .7, wh = W * .62
        const wx = 24 + lidDepth + (L + clearance - ww) / 2, wy = lidY + lidDepth + (W + clearance - wh) / 2
        rect('cut', wx, wy, ww, wh)
        panel('window-hole', 'CLEAR WINDOW', wx, wy, ww, wh)
        result.notes.push(`Window cut ${mm(ww)} × ${mm(wh)} mm; clear film supplied separately.`)
      }
      result.notes.push(`Lid clearance ${mm(clearance)} mm · lid return ${mm(lidDepth)} mm · corner glue tabs shown.`)
    }
    if (shape === 'divider') {
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

type Tools = {
  panel: (id: string, name: string, x: number, y: number, width: number, height: number, artwork?: Panel['artwork']) => Panel
  line: (layer: Rule['layer'], x1: number, y1: number, x2: number, y2: number) => void
  rect: (layer: Rule['layer'], x: number, y: number, w: number, h: number) => void
  dimH: (x: number, y: number, w: number, name?: string) => void
  dimV: (x: number, y: number, h: number, name?: string) => void
  tray: (id: string, ox: number, oy: number, l: number, w: number, h: number, lid?: boolean) => number
  poly: (layer: Rule['layer'], points: Point[], closed?: boolean) => void
  polygonPanel: (id: string, name: string, points: Point[], artwork?: Panel['artwork'], frame?: Panel['frame']) => Panel
}
const EXTRA_SHAPES = new Set(['snap-lock', 'crash-lock', 'reverse-tuck', 'wine-box', 'briefcase', 'telescope', 'book-box', 'cake-box', 'cone', 'triangle', 'tetra', 'heart', 'octagon', 'prism', 'extrude', 'pyramid', 'pillow', 'gable', 'mailer', 'tray', 'sleeve', 'display', 'pouch', 'sachet', 'tube', 'bottle', 'jar', 'lathe'])
const arc = (x1: number, y1: number, x2: number, y2: number, sag: number, steps = 24): Point[] =>
  Array.from({ length: steps + 1 }, (_, i): Point => { const k = i / steps; return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k + Math.sin(k * Math.PI) * sag] })

function buildExtra(design: Design, shape: string, result: FlatLayout, T: Tools) {
  const { length: L, width: W, height: H } = design.dimensions
  const info = design.productInfo, infoBack = info?.placement === 'back'
  const x0 = 24, y0 = 60, glue = 15
  if (CARTON_VARIANTS.has(shape)) cartonVariant(design, shape, result, T)
  else if (shape === 'telescope' || shape === 'book-box' || shape === 'cake-box' || shape === 'cone' || shape === 'triangle' || shape === 'tetra') buildStructures(design, shape, result, T)
  else if (shape === 'octagon' || shape === 'prism' || shape === 'extrude' || shape === 'heart') {
    // Side strip: one panel per footprint edge, then base and lid polygons.
    const fp = shapeFootprint(design).map(([x, z]): Point => [x * L / 2, z * W / 2])
    const taper = getShapeParams(design).taper
    const ccx = fp.reduce((t, p) => t + p[0], 0) / fp.length, ccz = fp.reduce((t, p) => t + p[1], 0) / fp.length
    const edges = fp.map((p, i) => {
      const q = fp[(i + 1) % fp.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1e-6
      let nz = -(q[0] - p[0]) / len
      const nx = (q[1] - p[1]) / len, mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2
      if (nx * (mx - ccx) + nz * (mz - ccz) < 0) nz = -nz
      return { len, mz, mx, nz }
    })
    // Same rule as the 3D builder: a flat front panel faces the viewer and is wider than 20% of the length.
    const flat = edges.map((e, i) => ({ e, i })).filter(({ e }) => e.nz > .7 && e.len > L * .2).sort((a, b) => b.e.nz * b.e.len - a.e.nz * a.e.len)
    const front = flat.length ? flat[0].i : edges.reduce((best, e, i) => (e.mz > edges[best].mz ? i : best), 0)
    const order = edges.map((_, i) => (front + i) % edges.length)
    const total = edges.reduce((a, e) => a + e.len, 0)
    const strip = !flat.length
    result.title = strip ? 'CUSTOM SHAPE · CURVED SIDE WRAP + BASE / LID' : `${edges.length}-SIDED BOX · SIDE STRIP + BASE / LID`
    T.rect('cut', x0, y0, total + glue, H)
    let px = x0
    if (strip) {
      T.panel('side-wrap', 'SIDE WRAP', px, y0, total, H, 'front').frame = { width: Math.min(total * .45, L) * .92, height: H * .59 }
      // Score every outline corner sharper than ~25° so the wrap follows the shape.
      let run = 0
      order.forEach((edgeIndex, i) => { run += edges[edgeIndex].len; const next = edges[order[(i + 1) % order.length]]; const turn = Math.abs(edges[edgeIndex].nz - next.nz); if (i < order.length - 1 && turn > .1) T.line('fold', px + run, y0, px + run, y0 + H) })
      px += total
    } else order.forEach((edgeIndex, i) => {
      const e = edges[edgeIndex]
      const p = T.panel(`side-${i}`, i ? `SIDE ${i + 1}` : 'FRONT', px, y0, e.len, H, i === 0 && e.len > L * .2 ? 'front' : i === Math.round(edges.length / 2) && infoBack ? 'info' : undefined)
      if (p.artwork === 'front') p.frame = { width: e.len * .86, height: H * .7 }
      px += e.len
      T.line('fold', px, y0, px, y0 + H)
    })
    T.panel('side-glue', 'GLUE LAP', px, y0, glue, H)
    T.dimH(x0, y0 - 12, total, 'Perimeter'); T.dimV(x0 + total + glue + 10, y0, H, 'H')
    const xs = fp.map(p => p[0]), zs = fp.map(p => p[1])
    const bw = Math.max(...xs) - Math.min(...xs)
    const pieces = design.openTop ? 1 : 2
    for (let i = 0; i < pieces; i++) {
      const k = i ? taper * 1.02 : 1, ox = x0 + i * (bw * 1.02 + 30) - Math.min(...xs) * k, oy = y0 + H + 34 - Math.min(...zs) * k
      const pts = fp.map(([x, z]): Point => [ox + x * k, oy + z * k])
      T.poly('cut', pts)
      T.polygonPanel(`poly-${i}`, i ? 'LID' : 'BASE', pts, i ? 'lid' : !infoBack ? 'info' : undefined, i ? { width: L * taper * .58, height: W * taper * .56 } : undefined)
      T.dimH(ox + Math.min(...xs) * k, oy + Math.max(...zs) * k + 10, bw * k, i ? 'Lid' : 'Base')
    }
    result.notes.push(taper !== 1 ? `Tapered walls (top ${Math.round(taper * 100)}%): side panels become trapezoids; converter adjusts the strip.` : 'Separate base/lid pieces and a folded side strip; rim allowance needs converter review.')
  } else if (shape === 'pyramid') {
    result.title = 'PYRAMID · BASE + FOUR PETAL PANELS'
    const sF = Math.hypot(H, W / 2), sS = Math.hypot(H, L / 2)
    const bx = x0 + sS, by = y0 + sF
    T.rect('fold', bx, by, L, W)
    T.panel('pyr-base', 'BASE', bx, by, L, W, infoBack ? undefined : 'info')
    const tris: [string, Point[], Panel['artwork']][] = [
      ['FRONT', [[bx, by + W], [bx + L, by + W], [bx + L / 2, by + W + sF]], 'front'],
      ['BACK', [[bx, by], [bx + L, by], [bx + L / 2, by - sF]], infoBack ? 'info' : undefined],
      ['LEFT', [[bx, by], [bx, by + W], [bx - sS, by + W / 2]], undefined],
      ['RIGHT', [[bx + L, by], [bx + L, by + W], [bx + L + sS, by + W / 2]], undefined],
    ]
    tris.forEach(([name, pts, art], i) => {
      const p = T.polygonPanel(`pyr-${i}`, name, pts, art)
      if (art === 'front') p.frame = { width: L * .5, height: sF * .34, cy: by + W + sF * .26 }
    })
    T.poly('cut', [[bx, by], [bx + L / 2, by - sF], [bx + L, by], [bx + L + sS, by + W / 2], [bx + L, by + W], [bx + L / 2, by + W + sF], [bx, by + W], [bx - sS, by + W / 2]])
    T.dimH(bx, by - sF - 8, L, 'L'); T.dimV(bx + L + sS + 10, by, W, 'W'); T.dimV(bx + L + sS + 22, by + W, sF, 'Slant')
    result.notes.push('Panels meet at the apex; add tip tabs or a ribbon tie per converter spec.')
  } else if (shape === 'pillow') {
    result.title = 'PILLOW BOX · CURVED SCORES'
    const flap = W * 1.1, y = y0 + flap, total = 2 * L + glue
    T.panel('pillow-glue', 'GLUE LAP', x0, y, glue, H)
    T.panel('pillow-front', 'FRONT', x0 + glue, y, L, H, 'front').frame = { width: L * .8, height: H * .74 }
    T.panel('pillow-back', 'BACK', x0 + glue + L, y, L, H, infoBack || info?.visible ? 'info' : undefined)
    for (const px of [x0 + glue, x0 + glue + L, x0 + total]) T.line('fold', px, y, px, y + H)
    for (const px of [x0 + glue, x0 + glue + L]) {
      T.poly('fold', arc(px, y, px + L, y, -flap * .85), false)
      T.poly('fold', arc(px, y + H, px + L, y + H, flap * .85), false)
    }
    const top = [...arc(x0 + glue, y, x0 + glue + L, y, -flap), ...arc(x0 + glue + L, y, x0 + total, y, -flap).slice(1)]
    const bottom = [...arc(x0 + total, y + H, x0 + glue + L, y + H, flap).slice(0), ...arc(x0 + glue + L, y + H, x0 + glue, y + H, flap).slice(1)]
    T.poly('cut', [[x0, y], ...top, [x0 + total, y + H], ...bottom, [x0, y + H]])
    T.dimH(x0 + glue, y - flap - 10, L, 'L'); T.dimV(x0 + total + 10, y, H, 'H')
    result.notes.push(`Curved end flaps ${mm(flap)} mm deep; score depth tuned by converter for the board caliper.`)
  } else if (shape === 'gable') {
    result.title = 'GABLE BOX · BODY + GABLE TOP'
    const body = H * .7, handle = H * .12, rise = H - body - handle, top = rise + handle, bottomFlap = W * .6
    const y = y0 + top, lengths = [L, W, L, W], total = 2 * (L + W) + glue
    T.panel('gable-glue', 'GLUE LAP', x0, y, glue, body)
    let px = x0 + glue
    lengths.forEach((len, i) => {
      const p = T.panel(`gable-${i}`, ['FRONT', 'RIGHT', 'BACK', 'LEFT'][i], px, y, len, body, i === 0 ? 'front' : i === 2 && infoBack ? 'info' : undefined)
      if (i === 0) p.frame = { width: L * .9, height: body * .66 }
      if (i % 2 === 0) {
        const roof = T.panel(`gable-roof-${i}`, i ? 'BACK ROOF' : 'FRONT ROOF', px, y - rise, len, rise, i === 0 ? 'lid' : undefined)
        if (i === 0) roof.frame = { width: L * .7, height: rise * .62 }
        T.panel(`gable-handle-${i}`, 'HANDLE', px, y - top, len, handle)
        T.line('fold', px, y - rise, px + len, y - rise)
        const hw = Math.min(len * .32, 50), hh = handle * .36
        T.poly('cut', [...arc(px + len / 2 - hw / 2, y - rise - handle / 2 - hh / 2, px + len / 2 + hw / 2, y - rise - handle / 2 - hh / 2, 0, 1), ...arc(px + len / 2 + hw / 2, y - rise - handle / 2 + hh / 2, px + len / 2 - hw / 2, y - rise - handle / 2 + hh / 2, 0, 1)])
      } else {
        T.panel(`gable-gusset-${i}`, 'GUSSET', px, y - rise, len, rise)
        T.line('fold', px, y, px + len / 2, y - rise); T.line('fold', px + len, y, px + len / 2, y - rise)
      }
      T.panel(`gable-bottom-${i}`, 'BOTTOM FLAP', px, y + body, len, bottomFlap, i === 0 && !infoBack ? 'info' : undefined)
      T.line('cut', px + len, y + body, px + len, y + body + bottomFlap)
      px += len
      T.line('fold', px, y - (i % 2 ? rise : top), px, y + body)
    })
    T.line('fold', x0 + glue, y, x0 + total, y); T.line('fold', x0 + glue, y + body, x0 + total, y + body)
    T.poly('cut', [[x0, y], [x0 + glue, y], [x0 + glue, y - top], [x0 + glue + L, y - top], [x0 + glue + L, y - rise], [x0 + glue + L + W, y - rise], [x0 + glue + L + W, y - top], [x0 + glue + 2 * L + W, y - top], [x0 + glue + 2 * L + W, y - rise], [x0 + total, y - rise], [x0 + total, y + body + bottomFlap], [x0 + glue, y + body + bottomFlap], [x0 + glue, y + body], [x0, y + body]])
    T.dimV(x0 + total + 10, y, body, 'Body'); T.dimV(x0 + total + 22, y - top, top, 'Gable'); T.dimH(x0, y + body + bottomFlap + 12, total, 'Blank')
    result.notes.push('Gable gussets fold inward on the diagonal scores; handle plates are double thickness when erected.')
  } else if (shape === 'mailer') {
    result.title = 'MAILER · ROLL-END TUCK FRONT'
    const tuck = H * .82, oy = y0 + W + tuck
    const end = T.tray('mail', x0, oy, L, W, H)
    const front = result.panels.find(p => p.id === 'mail-front'); if (front) front.frame = { width: L * .8, height: H * .6 }
    const lx = x0 + H
    T.panel('mail-lid', 'LID', lx, oy - W, L, W, 'lid').frame = { width: L * .86, height: W * .82 }
    T.panel('mail-tuck', 'TUCK FRONT', lx, oy - W - tuck, L, tuck)
    T.line('fold', lx, oy, lx + L, oy); T.line('fold', lx, oy - W, lx + L, oy - W)
    T.rect('cut', lx, oy - W - tuck, L, W + tuck)
    T.dimV(lx - 10, oy - W, W, 'Lid'); T.dimV(lx - 10, oy - W - tuck, tuck, 'Tuck')
    result.notes.push(`Lid hinges on the back panel; tuck front ${mm(tuck)} mm. Blank ends at ${mm(end)} mm.`)
  } else if (shape === 'tray') {
    result.title = 'OPEN TRAY · FLARED WALLS'
    T.tray('tray', x0, y0, L, W, H)
    const front = result.panels.find(p => p.id === 'tray-front'); if (front) front.frame = { width: L * .72, height: H * .7 }
    result.notes.push('Walls flare outward; converter adds the draft angle and rim flange.')
  } else if (shape === 'sleeve') {
    result.title = 'SLEEVE BOX · TRAY + PRINTED SLEEVE'
    const end = T.tray('tray', x0, y0, L, W, H)
    const sw = L * .66, sy = end + 40
    let sx = x0
    ;[W, H, W, H, glue].forEach((w, i) => {
      const p = T.panel(`sleeve-${i}`, ['SLEEVE TOP', 'FRONT', 'SLEEVE BOTTOM', 'BACK', 'GLUE LAP'][i], sx, sy, w, sw, i === 0 ? 'lid' : i === 1 ? 'front' : i === 3 && infoBack ? 'info' : undefined)
      // Sleeve panels lie rotated on the sheet: frames are given in 3D orientation and the artwork is turned 90°.
      if (i === 0) p.frame = { width: sw * .8, height: W * .72 }
      if (i === 1) p.frame = { width: sw * .86, height: H * .7 }
      if (i <= 1) p.rotate = true
      if (i) T.line('fold', sx, sy, sx, sy + sw)
      T.dimH(sx, sy - 10, w); sx += w
    })
    T.rect('cut', x0, sy, 2 * (W + H) + glue, sw); T.dimV(sx + 10, sy, sw, 'Sleeve')
    result.notes.push('Sleeve panels are rotated 90° on the sheet; slide clearance set by converter.')
  } else if (shape === 'display') {
    result.title = 'COUNTER DISPLAY · BASE + HEADER'
    const header = H * .65, lip = H * .32, bx = x0 + H, by = y0 + H + header
    T.panel('disp-base', 'BASE', bx, by, L, W, infoBack ? undefined : 'info')
    T.panel('disp-back', 'BACK + HEADER', bx, by - H - header, L, H + header, 'front').frame = { width: L * .9, height: header * .82, cy: by - H - header / 2 }
    T.panel('disp-lip', 'FRONT LIP', bx, by + W, L, lip, 'lid').frame = { width: L * .9, height: lip * .75 }
    const sideL: Point[] = [[bx, by], [bx - H, by], [bx - lip, by + W], [bx, by + W]]
    const sideR: Point[] = [[bx + L, by], [bx + L + H, by], [bx + L + lip, by + W], [bx + L, by + W]]
    T.polygonPanel('disp-left', 'LEFT', sideL); T.polygonPanel('disp-right', 'RIGHT', sideR)
    T.rect('fold', bx, by, L, W)
    T.poly('cut', [[bx, by - H - header], [bx + L, by - H - header], [bx + L, by], [bx + L + H, by], [bx + L + lip, by + W], [bx + L, by + W], [bx + L, by + W + lip], [bx, by + W + lip], [bx, by + W], [bx - lip, by + W], [bx - H, by], [bx, by]])
    T.dimH(bx, by - H - header - 8, L, 'L'); T.dimV(bx + L + H + 10, by - H - header, H + header, 'Back + header'); T.dimV(bx + L + H + 10, by, W, 'W')
    result.notes.push('Header shown in one piece with the back; a separate header card is also common.')
  } else if (shape === 'pouch' || shape === 'sachet') {
    const pouch = shape === 'pouch', seal = pouch ? 10 : 8, gusset = pouch ? W : 0
    result.title = pouch ? 'STAND-UP POUCH · FRONT / BACK / GUSSET' : 'SACHET · FRONT / BACK'
    const fh = H * (pouch ? .65 : .58)
    T.panel('pouch-front', 'FRONT', x0, y0, L, H, 'front').frame = { width: L * .8, height: fh, cy: y0 + H * (pouch ? .09 : .08) + H * .12 + fh / 2 }
    T.panel('pouch-back', 'BACK', x0 + L + 20, y0, L, H, info?.visible ? 'info' : undefined)
    for (const px of [x0, x0 + L + 20]) { T.rect('cut', px, y0, L, H); T.rect('fold', px + seal, y0 + seal, L - 2 * seal, H - 2 * seal) }
    if (pouch) {
      T.panel('pouch-gusset', 'BOTTOM GUSSET', x0, y0 + H + 20, L, gusset); T.rect('cut', x0, y0 + H + 20, L, gusset); T.line('fold', x0, y0 + H + 20 + gusset / 2, x0 + L, y0 + H + 20 + gusset / 2)
      T.dimV(x0 + L + 8, y0 + H + 20, gusset, 'Gusset')
    }
    T.dimH(x0, y0 - 10, L, 'W'); T.dimV(x0 - 10, y0, H, 'H')
    for (const px of [x0, x0 + L + 20]) result.rules.push({ layer: 'perf', points: [[px, y0 + seal * 2.2], [px + L, y0 + seal * 2.2]] })
    result.notes.push(`Dotted line marks the tear / easy-open perforation. Dashed lines mark ${seal} mm heat seals. Flexible film: printer confirms web direction and eye-mark.`)
  } else {
    // Round containers: the printed part is the wrap label (plus a cap/lid disc).
    const r = roundLayout(design), circumference = 2 * Math.PI * r.labelR, bandH = Math.max(10, r.band[1] - r.band[0])
    const tube = shape === 'tube'
    result.title = tube ? 'TUBE · BODY WRAP + CAP WRAP + DISCS' : `${shape.toUpperCase()} · WRAP-AROUND LABEL`
    const wrapH = tube ? H : bandH
    T.rect('cut', x0, y0, circumference + (tube ? glue : 0), wrapH)
    T.panel('wrap', tube ? 'BODY WRAP' : 'WRAP LABEL', x0, y0, circumference, wrapH, 'front').frame = { width: r.labelR * ROUND_LABEL_ARC, height: bandH * .92, cy: tube ? y0 + H - (r.band[0] + bandH / 2) : undefined }
    if (tube) { T.panel('wrap-glue', 'GLUE LAP', x0 + circumference, y0, glue, H); T.line('fold', x0 + circumference, y0, x0 + circumference, y0 + H) }
    T.dimH(x0, y0 - 12, circumference, 'Circumference'); T.dimV(x0 + circumference + (tube ? glue : 0) + 12, y0, wrapH, tube ? 'H' : 'Label')
    let y = y0 + wrapH + 30
    if (tube && !design.openTop) {
      const capC = 2 * Math.PI * (r.R + 2)
      T.rect('cut', x0, y, capC + glue, r.capH); T.panel('cap-wrap', 'CAP WRAP', x0, y, capC, r.capH, 'lid').frame = { width: (r.R + 2) * 1.4, height: r.capH * .55 }
      T.dimV(x0 + capC + glue + 12, y, r.capH, 'Cap'); y += r.capH + 30
    }
    const discs = tube ? (design.openTop ? 1 : 2) : design.openTop ? 0 : 1
    for (let i = 0; i < discs; i++) {
      const d = (tube ? r.R : r.neckR * 1.2) * 2, dx = x0 + i * (d + 28)
      const p = T.panel(`disc-${i}`, tube ? (i ? 'TOP DISC' : 'BOTTOM DISC') : 'CAP LABEL', dx, y, d, d, tube && !i ? 'info' : 'lid')
      p.circle = true
      result.holes.push({ x: dx + d / 2, y: y + d / 2, radius: d / 2 }); T.dimH(dx, y + d + 10, d, 'Diameter')
    }
    if (!tube) result.notes.push(`${shape === 'lathe' ? 'Custom revolved' : shape === 'jar' ? 'Jar' : 'Bottle'} container is sourced as a finished part; this sheet is the paper label (${mm(circumference)} × ${mm(bandH)} mm).`)
    else result.notes.push(`Tube Ø ${mm(r.R * 2)} mm · cap ${mm(r.capH)} mm · 15 mm glue overlap.`)
  }
}

// ---------------------------------------------------------------------------------------------
// Extended structures
// ---------------------------------------------------------------------------------------------

const CARTON_VARIANTS = new Set(['snap-lock', 'crash-lock', 'reverse-tuck', 'wine-box', 'briefcase'])
/** A flap drawn in panel-local coordinates: u along the panel edge (0…len), v outward from the fold (≥ 0). */
type Flap = { name: string; pts: Point[]; folds?: Point[][]; cuts?: Point[][]; artwork?: Panel['artwork']; frame?: (len: number) => { width: number; height: number; v: number } }
const noFlap = (len: number): Flap => ({ name: '', pts: [[0, 0], [len, 0]] })
const tuckFlap = (len: number, depth: number): Flap => {
  const tongue = Math.min(15, depth * .5)
  return { name: 'TUCK FLAP', pts: [[0, 0], [0, depth], [2, depth + tongue * .65], [Math.min(7, len * .2), depth + tongue], [len - Math.min(7, len * .2), depth + tongue], [len - 2, depth + tongue * .65], [len, depth], [len, 0]], folds: [[[0, depth], [len, depth]]] }
}
const dustFlap = (len: number, depth: number): Flap => ({ name: 'DUST FLAP', pts: [[0, 0], [1.5, depth * .3], [len * .3, depth], [len - 1.5, depth], [len, depth * .45], [len, 0]] })
const snapLong = (len: number, depth: number): Flap => ({ name: 'LOCK FLAP', pts: [[0, 0], [0, depth], [len * .32, depth], [len * .32, depth * .72], [len * .68, depth * .72], [len * .68, depth], [len, depth], [len, 0]] })
const snapShort = (len: number, depth: number): Flap => ({ name: 'LOCK TAB', pts: [[0, 0], [len * .18, depth], [len * .82, depth], [len, 0]] })
const crashFlap = (len: number, depth: number, glue: boolean): Flap => ({ name: glue ? 'CRASH-LOCK + GLUE' : 'CRASH-LOCK FLAP', pts: [[0, 0], [0, depth], [len - depth * .7, depth], [len, 0]], folds: [[[0, 0], [Math.min(len * .45, depth * .95), depth]]] })
const stadium = (cx: number, cy: number, w: number, h: number): Point[] => {
  const r = h / 2, pts: Point[] = []
  for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 10; pts.push([cx - w / 2 + r + Math.cos(a) * r, cy + Math.sin(a) * r]) }
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 10; pts.push([cx + w / 2 - r + Math.cos(a) * r, cy + Math.sin(a) * r]) }
  return pts
}
const handleHalf = (len: number, half: number, plate: number): Flap => {
  const slot = Math.min(len * .32, 75), slotH = Math.max(6, plate * .34)
  return { name: 'TOP + HANDLE', pts: [[0, 0], [0, half], [plate * .3, half + plate], [len - plate * .3, half + plate], [len, half], [len, 0]], folds: [[[0, half], [len, half]]], cuts: [stadium(len / 2, half + plate * .55, slot, slotH)] }
}

function cartonVariant(design: Design, shape: string, result: FlatLayout, T: Tools) {
  const { length: L, width: W, height: H } = design.dimensions
  const info = design.productInfo, infoBack = info?.placement === 'back'
  const briefcase = shape === 'briefcase', glue = 15, Hb = briefcase ? H * .8 : H, plate = H - Hb
  const lengths = [L, W, L, W], names = ['FRONT', 'RIGHT', 'BACK', 'LEFT']
  const open = !!design.openTop
  const top = lengths.map((len, i): Flap => {
    if (open) return noFlap(len)
    if (briefcase) return i % 2 ? dustFlap(len, W * .45) : handleHalf(len, W / 2, plate)
    if (i === 2) return { ...tuckFlap(len, W), artwork: 'lid', frame: l => ({ width: l * .8, height: W * .72, v: W / 2 }) }
    return i % 2 ? dustFlap(len, Math.min(W * .8, L * .55)) : noFlap(len)
  })
  if (briefcase && !open) top[0] = { ...top[0], artwork: 'lid', frame: l => ({ width: l * .7, height: W * .36, v: W * .25 }) }
  const bottom = lengths.map((len, i): Flap => {
    if (shape === 'snap-lock' || briefcase) return i % 2 ? snapShort(len, W * .5) : snapLong(len, W * .8)
    if (shape === 'crash-lock') return crashFlap(len, W * (i % 2 ? .55 : .7), i % 2 === 0)
    if (shape === 'reverse-tuck') return i === 0 ? tuckFlap(len, W) : i % 2 ? dustFlap(len, Math.min(W * .8, L * .55)) : noFlap(len)
    return i === 2 ? tuckFlap(len, W) : i % 2 ? dustFlap(len, Math.min(W * .8, L * .55)) : noFlap(len)
  })
  const depth = (f: Flap) => Math.max(0, ...f.pts.map(p => p[1]))
  const topDepth = Math.max(0, ...top.map(depth)), bottomDepth = Math.max(0, ...bottom.map(depth))
  const x = 24, y = 64 + topDepth, total = glue + 2 * (L + W)
  result.title = ({ 'snap-lock': 'SNAP-LOCK BOTTOM CARTON', 'crash-lock': 'CRASH-LOCK BOTTOM CARTON', 'reverse-tuck': 'REVERSE TUCK END CARTON', 'wine-box': 'WINE CARTON + NECK INSERT', briefcase: 'BRIEFCASE HANDLE CARTON' } as Record<string, string>)[shape] + ' · FLAT ARTWORK'
  T.polygonPanel('glue', 'GLUE LAP', [[x + glue, y], [x, y + 4], [x, y + Hb - 4], [x + glue, y + Hb]])
  const outline: Point[] = [[x + glue, y], [x, y + 4], [x, y + Hb - 4], [x + glue, y + Hb]]
  const starts: number[] = []
  let px = x + glue
  lengths.forEach((len, i) => {
    starts.push(px)
    const p = T.panel(`body-${i}`, names[i], px, y, len, Hb, i === 0 ? 'front' : i === 2 && infoBack ? 'info' : undefined)
    if (i === 0) p.frame = { width: len * .9, height: Hb * .64, cy: y + Hb * .45 }
    T.dimH(px, y - topDepth - 8, len, i % 2 ? 'W' : 'L')
    px += len
  })
  const place = (f: Flap, i: number, side: 'top' | 'bottom') => {
    const ox = starts[i], map = ([u, v]: Point): Point => [ox + u, side === 'top' ? y - v : y + Hb + v]
    return { pts: f.pts.map(map), folds: (f.folds || []).map(line => line.map(map)), cuts: (f.cuts || []).map(c => c.map(map)) }
  }
  let bottomInfo = false
  bottom.forEach((f, i) => {
    const placed = place(f, i, 'bottom')
    outline.push(...placed.pts)
    if (!f.name) return
    const art: Panel['artwork'] = !infoBack && !bottomInfo && depth(f) >= W * .7 ? 'info' : undefined
    if (art) bottomInfo = true
    T.polygonPanel(`bottom-${i}`, f.name, placed.pts, art)
    T.line('fold', starts[i], y + Hb, starts[i] + lengths[i], y + Hb)
    placed.folds.forEach(line => T.poly('fold', line, false))
  })
  outline.push([x + total, y + Hb], [x + total, y])
  for (let i = 3; i >= 0; i--) {
    const f = top[i], placed = place(f, i, 'top')
    outline.push(...[...placed.pts].reverse())
    if (!f.name) continue
    const p = T.polygonPanel(`top-${i}`, f.name, placed.pts, f.artwork)
    if (f.frame) { const fr = f.frame(lengths[i]); p.frame = { width: fr.width, height: fr.height, cy: y - fr.v } }
    T.line('fold', starts[i], y, starts[i] + lengths[i], y)
    placed.folds.forEach(line => T.poly('fold', line, false))
    placed.cuts.forEach(c => T.poly('cut', c))
  }
  T.poly('cut', outline)
  starts.forEach(sx => T.line('fold', sx, y, sx, y + Hb))
  T.dimV(x + total + 10, y, Hb, briefcase ? 'Body' : 'H')
  if (bottomDepth) T.dimV(x + total + 22, y + Hb, bottomDepth, 'Bottom')
  if (briefcase && !open) T.dimV(x + total + 22, y - topDepth, topDepth, 'Top + handle')
  T.dimH(x, y + Hb + bottomDepth + 12, total, 'Blank')
  let end = y + Hb + bottomDepth + 24
  if (shape === 'wine-box') {
    const iy = end + 22, ix = 24, flap = Math.min(25, H * .1), d = Math.min(L, W) * .42
    T.panel('insert-l', 'INSERT LEG', ix, iy, flap, L); T.panel('insert-top', 'NECK INSERT', ix + flap, iy, W, L); T.panel('insert-r', 'INSERT LEG', ix + flap + W, iy, flap, L)
    T.rect('cut', ix, iy, W + 2 * flap, L); T.line('fold', ix + flap, iy, ix + flap, iy + L); T.line('fold', ix + flap + W, iy, ix + flap + W, iy + L)
    result.holes.push({ x: ix + flap + W / 2, y: iy + L / 2, radius: d / 2 })
    T.dimH(ix, iy + L + 9, W + 2 * flap, 'Insert'); end = iy + L
    result.notes.push(`Neck insert hole Ø ${mm(d)} mm; set to the actual bottle neck diameter before cutting.`)
  }
  result.notes.push(shape === 'snap-lock' || briefcase ? '1-2-3 snap-lock bottom: lock flaps interleave without glue; slot depth set by converter for board caliper.'
    : shape === 'crash-lock' ? 'Crash-lock flaps and pre-glue zones shown schematically (diagonal score = glue fold); converter supplies the exact auto-bottom geometry.'
      : shape === 'reverse-tuck' ? 'Reverse tuck: top tuck hinges on the back panel, bottom tuck on the front panel.'
        : 'Straight tuck end: both tucks hinge on the back panel.')
  void end
}

function buildStructures(design: Design, shape: string, result: FlatLayout, T: Tools) {
  const { length: L, width: W, height: H } = design.dimensions
  const info = design.productInfo, infoBack = info?.placement === 'back'
  const x0 = 24, y0 = 60, glue = 15, board = design.wallThickness ?? 2
  if (shape === 'telescope') {
    result.title = 'FULL TELESCOPE · BASE + DEEP LID'
    const end = T.tray('base', x0, y0, L, W, H)
    if (!design.openTop) {
      const c = board * 2, lidH = H * .85
      T.tray('lid', x0, end + 40, L + c, W + c, lidH, true)
      const baseFront = result.panels.find(p => p.id === 'base-front'), lidFront = result.panels.find(p => p.id === 'lid-front')
      if (baseFront) baseFront.artwork = undefined
      if (lidFront) { lidFront.artwork = 'front'; lidFront.frame = { width: (L + c) * .85, height: lidH * .7 } }
      const lidTop = result.panels.find(p => p.id === 'lid-base'); if (lidTop) lidTop.frame = { width: (L + c) * .9, height: (W + c) * .86 }
      result.notes.push(`Deep lid ${mm(lidH)} mm (85% of base height) with ${mm(c)} mm clearance; covers the base front, so the front print sits on the lid.`)
    }
  } else if (shape === 'book-box') {
    result.title = 'BOOK BOX · TRAY + HARD COVER WRAP'
    const end = T.tray('tray', x0, y0, L, W, H)
    if (!design.openTop) {
      const turn = 15, spine = H + board * 2, gap = board * 1.5, y = end + 40 + turn, x = x0 + turn
      const widths = [L, spine, L], names = ['FRONT COVER', 'SPINE', 'BOTTOM BOARD']
      const total = widths.reduce((a, b) => a + b, 0) + gap * 2
      const c = turn * .7
      T.poly('cut', [[x - turn + c, y - turn], [x + total + turn - c, y - turn], [x + total + turn, y - turn + c], [x + total + turn, y + W + turn - c], [x + total + turn - c, y + W + turn], [x - turn + c, y + W + turn], [x - turn, y + W + turn - c], [x - turn, y - turn + c]])
      T.rect('fold', x, y, total, W)
      let bx = x
      widths.forEach((w, i) => {
        const p = T.panel(`cover-${i}`, names[i], bx, y, w, W, i === 0 ? 'lid' : undefined)
        if (i === 0) p.frame = { width: w * .86, height: W * .82 }
        if (i) { T.line('fold', bx - gap, y, bx - gap, y + W); T.line('fold', bx, y, bx, y + W) }
        T.dimH(bx, y + W + turn + 8, w, i === 1 ? 'Spine' : '')
        bx += w + gap
      })
      for (const [name, px, py, pw, ph] of [['TURN-IN', x - turn, y - turn, total + 2 * turn, turn], ['TURN-IN', x - turn, y + W, total + 2 * turn, turn]] as const) T.panel(`turn-${py}`, name, px, py, pw, ph)
      T.dimV(x + total + turn + 10, y, W, 'W')
      result.notes.push(`Cover boards ${mm(board)} mm greyboard; ${turn} mm turn-ins and ${mm(gap)} mm hinge gaps. Magnets sit under the front cover edge and in the tray front.`)
    }
  } else if (shape === 'cake-box') {
    result.title = 'CAKE BOX · ONE PIECE WITH WINDOW LID'
    const tuck = H * .8, oy = y0 + W + tuck
    T.tray('cake', x0, oy, L, W, H)
    const lx = x0 + H
    if (!design.openTop) {
      T.panel('cake-lid', 'LID', lx, oy - W, L, W, 'lid').frame = { width: L * .7, height: W * .14, cy: oy - W + W * .1 }
      T.panel('cake-tuck', 'TUCK FRONT', lx, oy - W - tuck, L, tuck)
      T.line('fold', lx, oy, lx + L, oy); T.line('fold', lx, oy - W, lx + L, oy - W)
      const ww = L * .7, wh = W * .58, wx = lx + (L - ww) / 2, wy = oy - W / 2 + W * .06 - wh / 2
      T.rect('cut', wx, wy, ww, wh); T.panel('window-hole', 'CLEAR WINDOW', wx, wy, ww, wh)
      const dust = Math.min(H * .85, L * .3)
      T.poly('cut', [[lx, oy - W - tuck], [lx + L, oy - W - tuck], [lx + L, oy - W], [lx + L + dust, oy - W + W * .12], [lx + L + dust, oy - W * .12], [lx + L, oy], [lx, oy], [lx - dust, oy - W * .12], [lx - dust, oy - W + W * .12], [lx, oy - W]])
      T.line('fold', lx, oy - W, lx, oy); T.line('fold', lx + L, oy - W, lx + L, oy)
      T.polygonPanel('cake-dust-l', 'DUST', [[lx, oy - W], [lx - dust, oy - W + W * .12], [lx - dust, oy - W * .12], [lx, oy]])
      T.polygonPanel('cake-dust-r', 'DUST', [[lx + L, oy - W], [lx + L + dust, oy - W + W * .12], [lx + L + dust, oy - W * .12], [lx + L, oy]])
      T.dimV(lx - dust - 10, oy - W, W, 'Lid'); T.dimV(lx - dust - 10, oy - W - tuck, tuck, 'Tuck')
      result.notes.push(`Window ${mm(ww)} × ${mm(wh)} mm; food-safe clear film glued inside. Lid hinges on the back wall.`)
    }
  } else if (shape === 'cone') {
    const R = Math.min(L, W) / 2, slant = Math.hypot(R, H), theta = 2 * Math.PI * R / slant
    result.title = 'CONE SLEEVE · FAN BLANK'
    const half = Math.min(theta / 2, Math.PI * .98)
    const minX = Math.min(0, ...[-half, half].map(a => Math.sin(a) * slant)), ax = x0 + glue + Math.max(slant * Math.sin(Math.min(half, Math.PI / 2)), -minX), ay = y0 + Math.max(0, -Math.cos(half) * slant) + 4
    const arcPts: Point[] = []
    for (let i = 0; i <= 64; i++) { const a = -half + (2 * half * i) / 64; arcPts.push([ax + Math.sin(a) * slant, ay + Math.cos(a) * slant]) }
    const fan: Point[] = [[ax, ay], ...arcPts]
    const p = T.polygonPanel('cone-fan', 'CONE WALL', fan, 'front')
    const rl = roundLayout(design), bandMid = (rl.band[0] + rl.band[1]) / 2, along = slant * bandMid / H
    p.frame = { width: rl.labelR * ROUND_LABEL_ARC, height: (rl.band[1] - rl.band[0]) * slant / H * .9, cy: ay + along }
    // Glue flap along the left straight edge.
    const ex = Math.sin(-half), ey = Math.cos(-half), nx = -ey, ny = ex
    const g: Point[] = [[ax, ay], [ax + ex * slant, ay + ey * slant], [ax + ex * slant * .97 + nx * 12, ay + ey * slant * .97 + ny * 12], [ax + ex * 12 + nx * 8, ay + ey * 12 + ny * 8]]
    T.polygonPanel('cone-glue', 'GLUE', g)
    T.poly('cut', [g[3], g[2], g[1], ...arcPts.slice(1), [ax, ay]])
    T.line('fold', ax, ay, ax + ex * slant, ay + ey * slant)
    T.dimV(Math.max(...arcPts.map(q => q[0])) + 12, ay, slant, 'Slant')
    result.notes.push(`Fan radius ${mm(slant)} mm, sweep ${mm(theta * 180 / Math.PI)}°, rim Ø ${mm(R * 2)} mm; 12 mm glue flap.`)
  } else if (shape === 'triangle') {
    result.title = 'TRIANGULAR PRISM · STRIP + END CAPS'
    const s = Math.hypot(W / 2, H), x = x0 + H + 4, rows: [string, number, Panel['artwork']][] = [['GLUE LAP', 12, undefined], ['BACK SLOPE', s, infoBack ? 'info' : undefined], ['BASE', W, infoBack ? undefined : 'info'], ['FRONT SLOPE', s, 'front']]
    let y = y0
    const ys: number[] = []
    rows.forEach(([name, hgt, art], i) => {
      ys.push(y)
      const p = T.panel(`tri-${i}`, name, x, y, L, hgt, art)
      if (art === 'front') p.frame = { width: L * .84, height: s * .62 }
      if (i) T.line('fold', x, y, x + L, y)
      y += hgt
    })
    const by = ys[2], capL: Point[] = [[x, by], [x, by + W], [x - H, by + W / 2]], capR: Point[] = [[x + L, by], [x + L, by + W], [x + L + H, by + W / 2]]
    T.polygonPanel('tri-cap-l', 'END CAP', capL); T.polygonPanel('tri-cap-r', design.openTop ? 'END CAP' : 'END FLAP', capR)
    T.line('fold', x, by, x, by + W); T.line('fold', x + L, by, x + L, by + W)
    T.poly('cut', [[x, y0], [x + L, y0], [x + L, by], [x + L + H, by + W / 2], [x + L, by + W], [x + L, y], [x, y], [x, by + W], [x - H, by + W / 2], [x, by]])
    T.dimH(x, y0 - 10, L, 'L'); T.dimV(x + L + H + 10, ys[1], s, 'Slope'); T.dimV(x + L + H + 22, by, W, 'Base')
    result.notes.push('End caps fold in from the base; add tuck tabs per converter spec.')
  } else {
    result.title = 'TETRAHEDRON · FOUR-FACE STRIP'
    const e = Math.hypot(L / 2, H, W / 2) // AD = AC = BC = BD
    const third = (p: Point, q: Point, a: number, b: number, away: Point): Point => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]), k = (a * a - b * b + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, a * a - k * k))
      const ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d, mx = p[0] + ux * k, my = p[1] + uy * k
      const c1: Point = [mx - uy * hh, my + ux * hh], c2: Point = [mx + uy * hh, my - ux * hh]
      return Math.hypot(c1[0] - away[0], c1[1] - away[1]) > Math.hypot(c2[0] - away[0], c2[1] - away[1]) ? c1 : c2
    }
    const A: Point = [0, 0], B: Point = [L, 0], D = third(A, B, e, e, [L / 2, -1])
    const C = third(A, D, e, W, B), B2 = third(D, C, e, e, A), A2 = third(C, B2, e, L, D)
    const raw = [A, B, D, C, B2, A2]
    const mnx = Math.min(...raw.map(p => p[0])), mny = Math.min(...raw.map(p => p[1]))
    const off = ([px, py]: Point): Point => [px - mnx + x0 + 14, py - mny + y0 + 14]
    const [a, b, d, c, b2, a2] = raw.map(off)
    T.polygonPanel('tetra-front', 'FRONT', [a, b, d], 'front').frame = { width: L * .42, height: Math.hypot(H, W / 2) * .3, cy: (a[1] + b[1]) / 2 + (d[1] - (a[1] + b[1]) / 2) * .36 }
    T.polygonPanel('tetra-left', 'LEFT', [a, d, c]); T.polygonPanel('tetra-right', 'RIGHT', [d, c, b2]); T.polygonPanel('tetra-back', 'BACK', [c, b2, a2], infoBack ? 'info' : undefined)
    const cx = (c[0] + a2[0]) / 2, cy = (c[1] + a2[1]) / 2, ox = cx - (b2[0] + c[0] + a2[0]) / 3, oy = cy - (b2[1] + c[1] + a2[1]) / 3, on = Math.hypot(ox, oy) || 1
    const gx = ox / on * 10, gy = oy / on * 10
    const glueFlap: Point[] = [c, a2, [a2[0] + gx + (c[0] - a2[0]) * .06, a2[1] + gy + (c[1] - a2[1]) * .06], [c[0] + gx + (a2[0] - c[0]) * .06, c[1] + gy + (a2[1] - c[1]) * .06]]
    T.polygonPanel('tetra-glue', 'GLUE', glueFlap)
    T.poly('cut', [a, b, d, b2, a2, glueFlap[2], glueFlap[3], c, a])
    for (const [p, q] of [[a, d], [d, c], [c, b2], [c, a2]] as const) T.line('fold', p[0], p[1], q[0], q[1])
    T.dimH(a[0], Math.max(a[1], b[1]) + 10, L, 'Base edge')
    result.notes.push(`Edges ${mm(L)} / ${mm(W)} mm (seals) and ${mm(e)} mm (slant). Top and bottom seals are crossed at 90°.`)
  }
}
