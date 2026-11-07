import type { Design, Surface } from './types'

export const TEXTURES = [
  ['none', 'Smooth', 'Paper'], ['fine-paper', 'Fine paper', 'Paper'], ['cotton-paper', 'Cotton stock', 'Paper'], ['kraft', 'Natural kraft', 'Paper'], ['recycled', 'Recycled flecks', 'Paper'], ['laid-paper', 'Laid paper', 'Paper'], ['corrugated', 'Micro corrugated', 'Paper'],
  ['linen', 'Bookcloth linen', 'Textile'], ['canvas', 'Woven canvas', 'Textile'], ['herringbone', 'Herringbone weave', 'Textile'], ['silk', 'Fine silk', 'Textile'], ['felt', 'Soft felt', 'Textile'],
  ['wood', 'Wood grain', 'Natural'], ['cork', 'Natural cork', 'Natural'], ['marble', 'Marble veins', 'Natural'], ['leather', 'Pebbled leather', 'Natural'], ['stone', 'Stone grain', 'Natural'],
  ['brushed-metal', 'Brushed metal', 'Metal'], ['hammered', 'Hammered finish', 'Metal'], ['foil', 'Crinkled foil', 'Metal'],
  ['pinstripe', 'Fine pinstripe', 'Pattern'], ['dots', 'Micro dots', 'Pattern'], ['grid', 'Embossed grid', 'Pattern'], ['diagonal', 'Diagonal lines', 'Pattern'], ['diamond', 'Diamond emboss', 'Pattern'], ['waves', 'Soft waves', 'Pattern'], ['chevron', 'Chevron', 'Pattern'], ['crosshatch', 'Crosshatch', 'Pattern']
].map(([id, name, category]) => ({ id, name, category }))
export const DEFAULT_SURFACE: Surface = { texture: 'none', scale: 1, strength: .5, rotation: 0 }
export const getSurface = (design: Design): Surface => ({ ...DEFAULT_SURFACE, ...design.surface })

/** Deterministic seamless material tiles, with no remote images or random reload changes. */
export function textureCanvas(id: string, strength = .5, size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  let seed = 842193
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  const unit = size / 512
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size)
  if (id === 'none') return canvas
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
