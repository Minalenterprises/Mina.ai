import { TEXTURES } from './textures'

/**
 * Deterministic seamless material tiles, generated on demand with no remote images.
 * Tiles are memoised per (id, strength, size): the 3D scene, the 2D dieline, the print tile and
 * the picker thumbnails all reuse one canvas instead of regenerating tens of thousands of strokes.
 * Callers must treat the returned canvas as read-only.
 */
const cache = new Map<string, HTMLCanvasElement>()
const CACHE_LIMIT = 48
export function textureCanvas(id: string, strength = .5, size = 512): HTMLCanvasElement {
  const key = `${id}|${strength.toFixed(3)}|${size}`
  const hit = cache.get(key)
  if (hit) { cache.delete(key); cache.set(key, hit); return hit }
  const canvas = paintTexture(TEXTURES.some(t => t.id === id) ? id : 'none', strength, size)
  cache.set(key, canvas)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  return canvas
}
export const clearTextureCache = () => cache.clear()

/** Deterministic seamless material tiles, with no remote images or random reload changes. */
function paintTexture(id: string, strength: number, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  let seed = 842193
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  const unit = size / 512
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size)
  if (id === 'none') return canvas
  if (EXTENDED.has(id)) { paintExtended(ctx, id, strength, size, random); return canvas }
  const line = (points: number[], opacity = .15, width = 1) => {
    ctx.strokeStyle = `rgba(25,25,25,${opacity * strength})`; ctx.lineWidth = width * unit
    ctx.beginPath(); ctx.moveTo(points[0] * unit, points[1] * unit)
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i] * unit, points[i + 1] * unit)
    ctx.stroke()
  }
  const flecks = (count: number, spread: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `rgba(30,30,30,${random() * alpha * strength})`
      const x = random() * size, y = random() * size, r = (.4 + random() * spread) * unit
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (.35 + random()), random() * Math.PI, 0, Math.PI * 2); ctx.fill()
    }
  }
  if (['fine-paper', 'cotton-paper', 'kraft', 'recycled', 'felt', 'cork', 'stone', 'leather', 'hammered'].includes(id)) {
    const spread = id === 'fine-paper' ? .5 : id === 'cotton-paper' || id === 'felt' ? 1.5 : id === 'recycled' || id === 'kraft' ? 3 : id === 'leather' ? 5 : 8
    flecks(id === 'fine-paper' || id === 'cotton-paper' ? 38000 : 12000, spread, id === 'recycled' || id === 'cork' ? .5 : .24)
    if (id === 'kraft' || id === 'cotton-paper' || id === 'felt') for (let i = 0; i < 1000; i++) { const x = random() * 512, y = random() * 512; line([x, y, x + random() * 8, y + random() * 3], .12) }
    if (id === 'hammered' || id === 'leather') for (let i = 0; i < 1400; i++) { ctx.strokeStyle = `rgba(70,70,70,${.18 * strength})`; ctx.lineWidth = unit; ctx.beginPath(); ctx.arc(random() * size, random() * size, (2 + random() * 5) * unit, 0, Math.PI * 2); ctx.stroke() }
  } else if (id === 'wood' || id === 'marble' || id === 'waves' || id === 'foil') {
    const gap = id === 'wood' ? 3 : id === 'marble' ? 28 : id === 'foil' ? 12 : 20
    for (let y = -40; y < 552; y += gap) {
      const points: number[] = []
      const offset = random() * 12
      for (let x = 0; x <= 512; x += 4) points.push(x, y + Math.sin(x * Math.PI / 256 + offset) * (id === 'wood' ? 8 : 24) + Math.sin(x * Math.PI / 64) * 3)
      line(points, id === 'marble' ? .28 : .15, id === 'marble' ? 1 + random() * 2 : 1)
    }
    if (id === 'marble') flecks(4000, .6, .1)
  } else if (['linen', 'canvas', 'grid', 'silk', 'crosshatch', 'herringbone'].includes(id)) {
    const gap = id === 'silk' ? 2 : id === 'canvas' ? 9 : id === 'grid' ? 32 : 5
    for (let x = 0; x < 512; x += gap) { line([x, 0, x, 512], .15, id === 'canvas' ? 2 : 1); line([0, x, 512, x], .13, 1) }
    if (id === 'herringbone' || id === 'crosshatch') for (let y = 0; y < 512; y += 16) for (let x = 0; x < 512; x += 32) line([x, y, x + 16, y + 12, x + 32, y], .3)
    if (id === 'linen' || id === 'canvas') flecks(2000, .6, .12)
  } else if (id === 'brushed-metal' || id === 'laid-paper' || id === 'corrugated' || id === 'pinstripe') {
    const gap = id === 'brushed-metal' ? 1 : id === 'laid-paper' ? 4 : id === 'corrugated' ? 14 : 16
    for (let x = 0; x < 512; x += gap) line([x, 0, x, 512], id === 'corrugated' ? .32 : .08 + random() * .16, id === 'corrugated' ? 4 : 1)
    if (id === 'laid-paper') for (let y = 0; y < 512; y += 64) line([0, y, 512, y], .18)
  } else if (id === 'dots') {
    ctx.fillStyle = `rgba(30,30,30,${.45 * strength})`
    for (let y = 8; y < 512; y += 24) for (let x = 8; x < 512; x += 24) { ctx.beginPath(); ctx.arc(x * unit, y * unit, 2 * unit, 0, Math.PI * 2); ctx.fill() }
  } else {
    for (let x = -512; x < 1024; x += 24) { line([x, 0, x + 512, 512], .24); if (id === 'diamond') line([x, 0, x - 512, 512], .24) }
    if (id === 'chevron') for (let y = -32; y < 544; y += 24) for (let x = 0; x < 512; x += 64) line([x, y, x + 32, y + 20, x + 64, y], .25, 2)
  }
  return canvas
}

const EXTENDED = new Set(['washi', 'vellum', 'eggshell', 'newsprint', 'seed-paper', 'mulberry', 'exposed-flute', 'velvet', 'burlap', 'denim', 'tweed', 'suede', 'quilted', 'bamboo', 'rattan', 'terrazzo', 'slate', 'croc-leather', 'burl', 'sand', 'holographic', 'pearlescent', 'carbon-fiber', 'glitter', 'sandblasted', 'satin-chrome', 'honeycomb', 'seigaiha', 'girih', 'houndstooth', 'gingham', 'polka', 'argyle', 'fluted'])
const TAU = Math.PI * 2
const HOUNDSTOOTH = ['11110001', '11100011', '11000111', '11111111', '00001111', '00010110', '00110000', '01110000']

/** Extended library. Drawn in a 512-unit tile; every pattern period divides 512 (or is wrapped) so tiles repeat seamlessly. */
function paintExtended(ctx: CanvasRenderingContext2D, id: string, strength: number, size: number, random: () => number) {
  ctx.save()
  ctx.scale(size / 512, size / 512)
  const ink = (alpha: number, shade = 25) => `rgba(${shade},${shade},${shade},${Math.min(1, alpha * strength)})`
  /** Draws a shape at the 9 tile offsets so anything crossing an edge reappears on the opposite edge. */
  const wrap = (draw: (dx: number, dy: number) => void) => { for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) draw(dx, dy) }
  const stroke = (style: string, width: number, path: () => void) => { ctx.strokeStyle = style; ctx.lineWidth = width; ctx.beginPath(); path(); ctx.stroke() }
  const flecks = (count: number, radius: number, alpha: number, shade = 30) => {
    for (let i = 0; i < count; i++) { ctx.fillStyle = ink(random() * alpha, shade); ctx.fillRect(random() * 512, random() * 512, radius * (.4 + random()), radius * (.4 + random())) }
  }
  const fibers = (count: number, length: number, alpha: number, width: number) => {
    for (let i = 0; i < count; i++) {
      const x = random() * 512, y = random() * 512, a = random() * TAU, bend = (random() - .5) * length
      const ex = x + Math.cos(a) * length, ey = y + Math.sin(a) * length, cx = (x + ex) / 2 + bend, cy = (y + ey) / 2 - bend
      const style = ink(alpha * (.4 + random() * .6)), w = width * (.5 + random())
      wrap((dx, dy) => stroke(style, w, () => { ctx.moveTo(x + dx, y + dy); ctx.quadraticCurveTo(cx + dx, cy + dy, ex + dx, ey + dy) }))
    }
  }
  /** Per-pixel periodic field, value 0..1 multiplied in as grey, or an RGB triple for tinted finishes. */
  const field = (fn: (x: number, y: number) => number | [number, number, number]) => {
    const n = 256, image = ctx.createImageData(n, n)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = fn(x * 2, y * 2), i = (y * n + x) * 4
      const [r, g, b] = typeof v === 'number' ? [v, v, v] : v
      image.data[i] = 255 * (1 - (1 - r) * strength); image.data[i + 1] = 255 * (1 - (1 - g) * strength); image.data[i + 2] = 255 * (1 - (1 - b) * strength); image.data[i + 3] = 255
    }
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = n
    tmp.getContext('2d')!.putImageData(image, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(tmp, 0, 0, 512, 512)
  }
  const ribs = (period: number, depth: number, sharp = 1) => {
    for (let x = 0; x < 512; x += period) {
      const g = ctx.createLinearGradient(x, 0, x + period, 0)
      g.addColorStop(0, ink(depth)); g.addColorStop(.5 / sharp, ink(0)); g.addColorStop(1, ink(depth))
      ctx.fillStyle = g; ctx.fillRect(x, 0, period, 512)
    }
  }
  const hsl = (h: number, s: number, l: number): [number, number, number] => {
    const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
    return [f(0), f(8), f(4)]
  }
  const P = (k: number) => k * TAU / 512
  switch (id) {
    case 'washi': flecks(9000, 1.2, .12); fibers(420, 46, .22, .7); break
    case 'mulberry': flecks(5000, 1.5, .1); fibers(260, 90, .32, 1.3); break
    case 'vellum': field((x, y) => .9 + .05 * Math.sin(P(x) * 2 + Math.sin(P(y) * 3)) + .05 * Math.cos(P(y) * 4 + Math.sin(P(x) * 2))); break
    case 'eggshell': flecks(30000, 1, .1); for (let i = 0; i < 2600; i++) { const x = random() * 512, y = random() * 512, r = 1 + random() * 2; ctx.fillStyle = ink(.08); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill() } break
    case 'newsprint': flecks(30000, 1.2, .4, 60); fibers(400, 10, .35, .6); break
    case 'seed-paper': flecks(12000, 1.6, .18); for (let i = 0; i < 260; i++) { const x = random() * 512, y = random() * 512, a = random() * Math.PI, c = ['rgba(120,86,48,', 'rgba(96,120,60,', 'rgba(60,44,30,', 'rgba(180,140,90,'][i % 4]; ctx.fillStyle = `${c}${.65 * strength})`; wrap((dx, dy) => { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 2 + random() * 2.5, 1 + random() * 1.4, a, 0, TAU); ctx.fill() }) } break
    case 'exposed-flute': ribs(16, .42, 1); for (let x = 0; x < 512; x += 16) stroke(ink(.3), 1, () => { ctx.moveTo(x, 0); ctx.lineTo(x, 512) }); break
    case 'fluted': ribs(8, .32, 1.6); break
    case 'velvet':
      field((x, y) => .86 + .07 * Math.sin(P(x) * 3 + 1.4 * Math.sin(P(y) * 2)) + .05 * Math.cos(P(y) * 5 + Math.sin(P(x) * 4)) + (random() - .5) * .05)
      flecks(14000, .8, .05); break
    case 'suede': flecks(30000, .9, .12); for (let i = 0; i < 2400; i++) { const x = random() * 512, y = random() * 512; stroke(ink(.07), 1.4, () => { ctx.moveTo(x, y); ctx.lineTo(x + 6 + random() * 10, y + random() * 2) }) } break
    case 'burlap':
      for (let x = 0; x < 512; x += 12) stroke(ink(.36), 5, () => { for (let y = 0; y <= 512; y += 32) { const jx = x + Math.sin(y * .05 + x) * 1.5; if (y) ctx.lineTo(jx, y); else ctx.moveTo(jx, y) } })
      for (let y = 0; y < 512; y += 12) stroke(ink(.3), 5, () => { for (let x = 0; x <= 512; x += 32) { const jy = y + Math.cos(x * .05 + y) * 1.5; if (x) ctx.lineTo(x, jy); else ctx.moveTo(x, jy) } })
      fibers(500, 14, .3, .6); break
    case 'denim':
      for (let x = -512; x < 1024; x += 8) stroke(ink(.28), 3, () => { ctx.moveTo(x, 0); ctx.lineTo(x + 512, 512) })
      for (let x = 0; x < 512; x += 8) stroke(ink(.06), 1, () => { ctx.moveTo(x, 0); ctx.lineTo(x, 512) })
      flecks(6000, 1, .12); break
    case 'tweed': for (let i = 0; i < 9000; i++) { const x = random() * 512, y = random() * 512, a = random() > .5 ? Math.PI / 4 : -Math.PI / 4, l = 3 + random() * 6; stroke(ink(.1 + random() * .25, random() > .8 ? 90 : 25), 1, () => { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l) }) } break
    case 'quilted':
      for (let x = -512; x < 1024; x += 64) for (const dir of [1, -1]) { ctx.setLineDash([5, 4]); stroke(ink(.5), 1.2, () => { ctx.moveTo(x, 0); ctx.lineTo(x + dir * 512, 512) }) }
      ctx.setLineDash([])
      for (let y = 0; y <= 512; y += 64) for (let x = 0; x <= 512; x += 64) for (const [cx, cy] of [[x, y], [x + 32, y + 32]]) { const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30); g.addColorStop(0, ink(0)); g.addColorStop(1, ink(.18)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx + 32, cy); ctx.lineTo(cx, cy + 32); ctx.lineTo(cx - 32, cy); ctx.fill() }
      break
    case 'bamboo':
      for (let x = 0; x < 512; x += 64) {
        const g = ctx.createLinearGradient(x, 0, x + 64, 0); g.addColorStop(0, ink(.35)); g.addColorStop(.18, ink(.05)); g.addColorStop(.8, ink(.1)); g.addColorStop(1, ink(.4)); ctx.fillStyle = g; ctx.fillRect(x, 0, 64, 512)
        const offset = (x * 37) % 128
        for (let y = offset; y < 512 + offset; y += 128) { const yy = y % 512; stroke(ink(.45), 3, () => { ctx.moveTo(x + 2, yy); ctx.lineTo(x + 62, yy) }); stroke(ink(.15), 1, () => { ctx.moveTo(x + 2, yy + 4); ctx.lineTo(x + 62, yy + 4) }) }
        for (let i = 0; i < 6; i++) { const lx = x + 8 + random() * 48; stroke(ink(.08), 1, () => { ctx.moveTo(lx, 0); ctx.lineTo(lx, 512) }) }
      }
      break
    case 'rattan':
      for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) {
        const across = ((x + y) / 32) % 2 === 0
        for (let k = 4; k < 32; k += 8) stroke(ink(.32), 5, () => { if (across) { ctx.moveTo(x, y + k); ctx.lineTo(x + 32, y + k) } else { ctx.moveTo(x + k, y); ctx.lineTo(x + k, y + 32) } })
        ctx.fillStyle = ink(.5); ctx.fillRect(x + 14, y + 14, 4, 4)
      }
      break
    case 'terrazzo': flecks(5000, 1.4, .1); for (let i = 0; i < 180; i++) { const x = random() * 512, y = random() * 512, r = 3 + random() * 11, n = 4 + Math.floor(random() * 3), rot = random() * TAU; const c = ['rgba(176,104,96,', 'rgba(70,92,97,', 'rgba(214,171,98,', 'rgba(137,148,119,', 'rgba(60,60,60,'][i % 5]; ctx.fillStyle = `${c}${.75 * strength})`; wrap((dx, dy) => { ctx.beginPath(); for (let k = 0; k < n; k++) { const a = rot + k * TAU / n, rr = r * (.6 + ((k * 7 + i) % 5) / 10); if (k) ctx.lineTo(x + dx + Math.cos(a) * rr, y + dy + Math.sin(a) * rr); else ctx.moveTo(x + dx + Math.cos(a) * rr, y + dy + Math.sin(a) * rr) } ctx.fill() }) } break
    case 'slate': for (let y = 0; y < 512; y += 6) { const style = ink(.05 + random() * .14); stroke(style, 2 + random() * 3, () => { for (let x = 0; x <= 512; x += 16) { const yy = y + Math.sin(P(x) * 2 + y) * 3; if (x) ctx.lineTo(x, yy); else ctx.moveTo(x, yy) } }) } flecks(8000, 1.2, .12); break
    case 'sand': flecks(60000, 1, .32); break
    case 'croc-leather':
      for (let y = 0; y < 512; y += 32) {
        let x = (y / 32) % 2 ? -18 : 0
        const cells: number[] = []
        while (x < 512) { const w = 22 + Math.floor(random() * 22); cells.push(x, Math.min(w, 512 - x + ((y / 32) % 2 ? 18 : 0))); x += w }
        for (let i = 0; i < cells.length; i += 2) wrap((dx) => { const cx = cells[i] + dx, w = cells[i + 1]; const g = ctx.createRadialGradient(cx + w / 2, y + 16, 2, cx + w / 2, y + 16, w * .7); g.addColorStop(0, ink(0)); g.addColorStop(1, ink(.25)); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx + 1.5, y + 1.5, w - 3, 29, 7); ctx.fill(); stroke(ink(.45), 1.2, () => ctx.roundRect(cx + 1.5, y + 1.5, w - 3, 29, 7)) })
      }
      break
    case 'burl': {
      ctx.fillStyle = `rgba(150,105,60,${.35 * strength})`; ctx.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 14; i++) { const cx = random() * 512, cy = random() * 512, rings = 6 + Math.floor(random() * 8), seed = random() * 10; wrap((dx, dy) => { for (let r = 3; r < rings * 7; r += 4) stroke(`rgba(70,40,20,${.22 * strength})`, 1.2, () => { for (let k = 0; k <= 48; k++) { const a = k * TAU / 48, rr = r * (1 + .25 * Math.sin(a * 3 + seed) + .1 * Math.sin(a * 7)); const px = cx + dx + Math.cos(a) * rr, py = cy + dy + Math.sin(a) * rr * .8; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py) } }) }) }
      break
    }
    case 'holographic': field((x, y) => { const h = ((x + y) / 512 * 720 + 40 * Math.sin(P(x) * 3) + 40 * Math.cos(P(y) * 2)) % 360; return hsl((h + 360) % 360, .7, .84 + .06 * Math.sin(P(x - y) * 8)) }); break
    case 'pearlescent': field((x, y) => { const t = .5 + .5 * Math.sin(P(x) * 2 + Math.sin(P(y) * 3) * 1.5); return hsl(300 - t * 120, .55, .88 + .06 * Math.cos(P(y) * 4 + P(x) * 2)) }); break
    case 'sandblasted': field(() => .82 + random() * .18); break
    case 'satin-chrome': field((x, y) => .78 + .16 * (.5 + .5 * Math.sin(P(y) * 2 + .4 * Math.sin(P(x) * 1))) + (random() - .5) * .04); break
    case 'glitter': flecks(9000, 1, .2); for (let i = 0; i < 9000; i++) { const s = 1.5 + random() * 2.5, c = random(); ctx.fillStyle = c > .66 ? `rgba(120,120,135,${.6 * strength})` : c > .33 ? `rgba(160,130,60,${.5 * strength})` : `rgba(210,210,220,${.9 * strength})`; ctx.save(); ctx.translate(random() * 512, random() * 512); ctx.rotate(random() * TAU); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore() } break
    case 'carbon-fiber':
      for (let y = 0; y < 512; y += 16) for (let x = 0; x < 512; x += 16) {
        const horizontal = ((x + y) / 16) % 2 === 0
        const g = horizontal ? ctx.createLinearGradient(x, y, x, y + 16) : ctx.createLinearGradient(x, y, x + 16, y)
        g.addColorStop(0, ink(.7)); g.addColorStop(.5, ink(.3)); g.addColorStop(1, ink(.75)); ctx.fillStyle = g; ctx.fillRect(x, y, 16, 16)
      }
      break
    case 'honeycomb': {
      const cols = 16, rows = 18, w = 512 / cols, rh = 512 / rows
      for (let r = 0; r < rows + 1; r++) for (let c = -1; c < cols + 1; c++) {
        const cx = c * w + (r % 2 ? w / 2 : 0), cy = r * rh
        stroke(ink(.42), 1.4, () => { for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, px = cx + Math.cos(a) * w * .55, py = cy + Math.sin(a) * rh * .66; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py) } })
      }
      break
    }
    case 'seigaiha':
      for (let r = 0; r < 17; r++) for (let c = -1; c < 9; c++) {
        const cx = c * 64 + (r % 2 ? 32 : 0), cy = r * 32
        for (let k = 30; k > 2; k -= 7) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, k, Math.PI, TAU); ctx.fill(); stroke(ink(.42), 1.6, () => ctx.arc(cx, cy, k, Math.PI, TAU)) }
      }
      break
    case 'girih':
      for (let y = 0; y <= 512; y += 64) for (let x = 0; x <= 512; x += 64) {
        for (const rot of [0, Math.PI / 4]) stroke(ink(.45), 1.4, () => { for (let k = 0; k <= 4; k++) { const a = rot + k * Math.PI / 2, px = x + Math.cos(a) * 22, py = y + Math.sin(a) * 22; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py) } })
        stroke(ink(.3), 1, () => { ctx.moveTo(x + 22, y); ctx.lineTo(x + 42, y); ctx.moveTo(x, y + 22); ctx.lineTo(x, y + 42) })
        stroke(ink(.3), 1, () => { for (let k = 0; k <= 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, px = x + 32 + Math.cos(a) * 14, py = y + 32 + Math.sin(a) * 14; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py) } })
      }
      break
    case 'houndstooth': ctx.fillStyle = ink(.55); for (let ty = 0; ty < 512; ty += 32) for (let tx = 0; tx < 512; tx += 32) HOUNDSTOOTH.forEach((row, y) => [...row].forEach((bit, x) => { if (bit === '1') ctx.fillRect(tx + x * 4, ty + y * 4, 4, 4) })); break
    case 'gingham': ctx.fillStyle = ink(.22); for (let k = 0; k < 512; k += 32) { ctx.fillRect(k, 0, 16, 512); ctx.fillRect(0, k, 512, 16) } break
    case 'polka': ctx.fillStyle = ink(.4); for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? 32 : 0; x < 512 + 32; x += 64) { ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); if (y === 0) { ctx.beginPath(); ctx.arc(x, 512, 9, 0, TAU); ctx.fill() } } break
    case 'argyle':
      for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 64) { ctx.fillStyle = ink(((x / 64 + y / 128) % 2) ? .28 : .12); ctx.beginPath(); ctx.moveTo(x + 32, y); ctx.lineTo(x + 64, y + 64); ctx.lineTo(x + 32, y + 128); ctx.lineTo(x, y + 64); ctx.fill() }
      ctx.setLineDash([4, 4]); for (let x = -512; x < 1024; x += 64) for (const dir of [2, -2]) stroke(ink(.5), 1, () => { ctx.moveTo(x, 0); ctx.lineTo(x + dir * 256, 512) }); ctx.setLineDash([])
      break
  }
  ctx.restore()
}
