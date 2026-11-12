/**
 * Decorative pattern tiles (florals, wedding, geometric, abstract, seasonal). Procedural and
 * seamless: every motif is drawn with wrap-around copies, so tiles repeat with no seam.
 * Colours are painted (these ids are listed as tinted textures); `strength` scales opacity.
 */
export const PATTERNS: [id: string, name: string, category: string][] = [
  ['rose-garden', 'Rose garden', 'Floral'], ['daisy-meadow', 'Daisy meadow', 'Floral'], ['cherry-blossom', 'Cherry blossom', 'Floral'], ['tulip-field', 'Tulip field', 'Floral'],
  ['sunflower', 'Sunflowers', 'Floral'], ['lotus', 'Lotus bloom', 'Floral'], ['peony', 'Peony blush', 'Floral'], ['wildflower', 'Wildflower mix', 'Floral'],
  ['botanical-leaves', 'Botanical leaves', 'Floral'], ['palm-leaves', 'Palm leaves', 'Floral'], ['lavender', 'Lavender sprigs', 'Floral'], ['ditsy-floral', 'Ditsy floral', 'Floral'],
  ['lace', 'Wedding lace', 'Wedding'], ['damask', 'Damask', 'Wedding'], ['pearls', 'Pearl scatter', 'Wedding'], ['gold-sparkle', 'Gold sparkle', 'Wedding'],
  ['art-deco', 'Art deco fans', 'Wedding'], ['trellis', 'Ornate trellis', 'Wedding'], ['hearts', 'Tiny hearts', 'Wedding'], ['blush-watercolor', 'Blush watercolor', 'Wedding'],
  ['triangles', 'Triangles', 'Geometric'], ['hexagons', 'Hexagon tiles', 'Geometric'], ['scales', 'Fish scales', 'Geometric'], ['tartan', 'Tartan plaid', 'Geometric'],
  ['zigzag', 'Zigzag', 'Geometric'], ['stars', 'Scattered stars', 'Geometric'], ['memphis', 'Memphis shapes', 'Geometric'], ['circles', 'Overlapping circles', 'Geometric'],
  ['watercolor', 'Watercolor wash', 'Abstract'], ['brush-strokes', 'Brush strokes', 'Abstract'], ['ink-marble', 'Ink marbling', 'Abstract'], ['topographic', 'Topographic lines', 'Abstract'],
  ['confetti', 'Confetti', 'Abstract'], ['snowflakes', 'Snowflakes', 'Seasonal'], ['autumn-leaves', 'Autumn leaves', 'Seasonal'], ['night-sky', 'Starry night', 'Seasonal'],
]
export const PATTERN_IDS = new Set(PATTERNS.map(p => p[0]))
const TAU = Math.PI * 2
const PALETTES: Record<string, string[]> = {
  rose: ['#d4506b', '#e8788f', '#b83a57'], daisy: ['#ffffff', '#f6c945'], cherry: ['#f7b6c8', '#f08fae', '#fbd3df'], tulip: ['#e5484d', '#f5a524', '#b54fb0', '#f27ca0'],
  sun: ['#f5b700', '#e08a00'], lotus: ['#f48fb1', '#f8bbd0'], peony: ['#f4a6b8', '#e98aa3', '#fad4dd'], wild: ['#7aa2f7', '#f5a524', '#e66a8a', '#9b6bd6', '#f2d544'],
  leaf: ['#2f6b4f', '#3f8f67', '#1f4d3a', '#6aa97f'], gold: ['#c9a24b', '#e4c76e', '#a8802c'], autumn: ['#c2531b', '#d98324', '#8c3b12', '#b5892e'],
  conf: ['#e5484d', '#f5a524', '#3e9bd9', '#4cb782', '#9b6bd6', '#f27ca0'],
}
export function paintPattern(ctx: CanvasRenderingContext2D, id: string, strength: number, size: number, random: () => number) {
  const k = size / 512, a = Math.min(1, .35 + strength * .85)
  ctx.save(); ctx.scale(k, k)
  const pick = (p: string[]) => p[Math.floor(random() * p.length)]
  const wrap = (x: number, y: number, r: number, draw: (x: number, y: number) => void) => {
    for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { const px = x + dx, py = y + dy; if (px > -r && px < 512 + r && py > -r && py < 512 + r) draw(px, py) }
  }
  const col = (c: string, o = 1) => { ctx.globalAlpha = Math.min(1, a * o); ctx.fillStyle = c; ctx.strokeStyle = c }
  const petals = (x: number, y: number, r: number, n: number, color: string, rot = 0, width = .45) => wrap(x, y, r * 1.5, (px, py) => {
    col(color); for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(px + Math.cos(rot + i * TAU / n) * r * .55, py + Math.sin(rot + i * TAU / n) * r * .55, r * .5, r * width, rot + i * TAU / n, 0, TAU); ctx.fill() }
  })
  const dot = (x: number, y: number, r: number, color: string, o = 1) => wrap(x, y, r, (px, py) => { col(color, o); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill() })
  const leaf = (x: number, y: number, len: number, ang: number, color: string, o = .9) => wrap(x, y, len, (px, py) => {
    col(color, o); ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .32, len, 0); ctx.quadraticCurveTo(len * .5, len * .32, 0, 0); ctx.fill(); ctx.restore()
  })
  const line = (pts: [number, number][], color: string, w: number, o = 1) => { for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { col(color, o); ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => { if (i) ctx.lineTo(x + dx, y + dy); else ctx.moveTo(x + dx, y + dy) }); ctx.stroke() } }
  const grid = (cell: number, fn: (x: number, y: number, row: number, col: number) => void) => { const n = Math.round(512 / cell); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) fn(c * cell + cell / 2, r * cell + cell / 2, r, c) }
  const flower = (x: number, y: number, r: number, n: number, palette: string[], center: string, rot = random() * TAU) => { petals(x, y, r, n, pick(palette), rot); dot(x, y, r * .22, center) }
  const scatter = (count: number, fn: (x: number, y: number) => void) => { for (let i = 0; i < count; i++) fn(random() * 512, random() * 512) }
  const polygon = (x: number, y: number, r: number, n: number, rot: number, color: string, o = 1) => wrap(x, y, r, (px, py) => { col(color, o); ctx.beginPath(); for (let i = 0; i < n; i++) { const t = rot + i * TAU / n; if (i) ctx.lineTo(px + Math.cos(t) * r, py + Math.sin(t) * r); else ctx.moveTo(px + Math.cos(t) * r, py + Math.sin(t) * r) } ctx.closePath(); ctx.fill() })
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  switch (id) {
    case 'rose-garden': scatter(10, (x, y) => { leaf(x, y, 40, random() * TAU, '#3f8f67', .8); leaf(x, y, 34, random() * TAU, '#2f6b4f', .8) }); scatter(14, (x, y) => { const c = pick(PALETTES.rose); for (let i = 3; i > 0; i--) petals(x, y, 10 + i * 8, 6, c, i, .5 + i * .05); dot(x, y, 6, '#8c2d44') }); break
    case 'daisy-meadow': scatter(16, (x, y) => flower(x, y, 24 + random() * 10, 12, PALETTES.daisy.slice(0, 1), '#f5b700')); scatter(10, (x, y) => leaf(x, y, 26, random() * TAU, '#6aa97f', .7)); break
    case 'cherry-blossom': scatter(8, (x, y) => line([[x, y], [x + 70, y + 40], [x + 110, y + 20]], '#6b4a3a', 4, .8)); scatter(26, (x, y) => { petals(x, y, 20, 5, pick(PALETTES.cherry), random() * TAU, .55); dot(x, y, 3, '#c2335c') }); break
    case 'tulip-field': grid(64, (x, y, r, c) => { const px = x + (r % 2 ? 32 : 0), color = pick(PALETTES.tulip); wrap(px, y, 40, (qx, qy) => { col('#3f8f67'); ctx.fillRect(qx - 2, qy, 4, 28); col(color); ctx.beginPath(); ctx.moveTo(qx - 14, qy - 14); ctx.quadraticCurveTo(qx - 14, qy + 10, qx, qy + 12); ctx.quadraticCurveTo(qx + 14, qy + 10, qx + 14, qy - 14); ctx.lineTo(qx + 7, qy - 4); ctx.lineTo(qx, qy - 16); ctx.lineTo(qx - 7, qy - 4); ctx.closePath(); ctx.fill() }); void c }); break
    case 'sunflower': scatter(9, (x, y) => { const r = 38 + random() * 12; petals(x, y, r, 16, '#f5b700', random() * TAU, .22); petals(x, y, r * .8, 12, '#e08a00', random() * TAU, .2); dot(x, y, r * .32, '#5a3a1a') }); break
    case 'lotus': scatter(9, (x, y) => { for (const [n, s, c] of [[8, 1, '#f8bbd0'], [6, .72, '#f48fb1'], [5, .45, '#f06292']] as const) petals(x, y, 36 * s, n, c, random() * TAU, .35); dot(x, y, 5, '#f5b700') }); break
    case 'peony': scatter(9, (x, y) => { const c = pick(PALETTES.peony); for (let i = 4; i > 0; i--) petals(x, y, 8 + i * 9, 7, c, i * .7, .6); dot(x, y, 4, '#b04a65') }); scatter(12, (x, y) => leaf(x, y, 34, random() * TAU, '#6aa97f', .7)); break
    case 'wildflower': scatter(26, (x, y) => { flower(x, y, 10 + random() * 12, 5 + Math.floor(random() * 4), PALETTES.wild, '#f5d742') }); scatter(20, (x, y) => leaf(x, y, 18, random() * TAU, '#6aa97f', .8)); break
    case 'ditsy-floral': grid(42, (x, y, r) => { const px = x + (r % 2 ? 21 : 0); flower(px, y, 11, 5, PALETTES.wild, '#fff3b0', r); leaf(px + 14, y + 12, 9, 1, '#6aa97f') }); break
    case 'botanical-leaves': scatter(30, (x, y) => leaf(x, y, 44 + random() * 30, random() * TAU, pick(PALETTES.leaf), .85)); break
    case 'palm-leaves': scatter(7, (x, y) => { const base = random() * TAU; for (let i = -5; i <= 5; i++) leaf(x, y, 70 - Math.abs(i) * 4, base + i * .22, pick(PALETTES.leaf), .9) }); break
    case 'lavender': scatter(12, (x, y) => { const ang = -Math.PI / 2 + (random() - .5) * .6; line([[x, y + 60], [x, y - 40]], '#6aa97f', 2); for (let i = 0; i < 9; i++) { dot(x + (i % 2 ? 6 : -6), y - i * 6, 5, i % 3 ? '#8e6fd1' : '#b39ddb', .95) } void ang }); break
    case 'lace': grid(64, (x, y) => { for (let i = 0; i < 8; i++) { const t = i * TAU / 8; wrap(x, y, 30, (px, py) => { col('#444', .55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px + Math.cos(t) * 14, py + Math.sin(t) * 14, 9, 0, TAU); ctx.stroke() }) } dot(x, y, 4, '#444', .6) }); break
    case 'damask': grid(128, (x, y) => { wrap(x, y, 70, (px, py) => { col('#8a6d3b', .8); ctx.beginPath(); ctx.moveTo(px, py - 52); ctx.bezierCurveTo(px + 40, py - 20, px + 40, py + 20, px, py + 52); ctx.bezierCurveTo(px - 40, py + 20, px - 40, py - 20, px, py - 52); ctx.fill(); col('#ffffff', 1); ctx.beginPath(); ctx.ellipse(px, py, 12, 26, 0, 0, TAU); ctx.fill(); col('#8a6d3b', .8); ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill() }) }); break
    case 'pearls': scatter(120, (x, y) => { const r = 3 + random() * 6; dot(x, y, r, '#d9d2c5', .9); dot(x - r * .3, y - r * .3, r * .35, '#ffffff', .95) }); break
    case 'gold-sparkle': scatter(160, (x, y) => { const r = 1.5 + random() * 4; dot(x, y, r, pick(PALETTES.gold), .9) }); scatter(26, (x, y) => polygon(x, y, 9, 4, Math.PI / 4, '#e4c76e', .95)); break
    case 'art-deco': grid(64, (x, y) => { wrap(x, y, 40, (px, py) => { for (let r = 30; r > 0; r -= 8) { col('#c9a24b', .85); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py + 30, r, Math.PI, TAU); ctx.stroke() } }) }); break
    case 'trellis': for (let i = -512; i < 1024; i += 64) { line([[i, 0], [i + 512, 512]], '#8a6d3b', 2.4, .8); line([[i, 512], [i + 512, 0]], '#8a6d3b', 2.4, .8) } grid(64, (x, y) => dot(x, y, 4, '#c9a24b', .9)); break
    case 'hearts': grid(48, (x, y, r) => wrap(x + (r % 2 ? 24 : 0), y, 20, (px, py) => { col('#e8788f', .85); ctx.beginPath(); ctx.moveTo(px, py + 9); ctx.bezierCurveTo(px - 16, py - 2, px - 8, py - 14, px, py - 5); ctx.bezierCurveTo(px + 8, py - 14, px + 16, py - 2, px, py + 9); ctx.fill() })); break
    case 'blush-watercolor': scatter(40, (x, y) => dot(x, y, 50 + random() * 70, pick(['#f7c6d0', '#fbe0e6', '#f2b5c4', '#e8d0f0']), .22)); break
    case 'triangles': grid(48, (x, y, r, c) => polygon(x, y, 26, 3, (r + c) % 2 ? Math.PI / 2 : -Math.PI / 2, pick(PALETTES.conf), .75)); break
    case 'hexagons': grid(64, (x, y, r) => polygon(x + (r % 2 ? 32 : 0), y, 31, 6, 0, pick(['#8aa4c8', '#b7c9de', '#5c7fa8', '#d6e0ee']), .85)); break
    case 'scales': for (let r = 0; r < 18; r++) for (let c = -1; c < 9; c++) { const x = c * 64 + (r % 2 ? 32 : 0), y = r * 32; wrap(x, y, 40, (px, py) => { col(pick(['#3e9bd9', '#4cb782', '#5c7fa8']), .75); ctx.beginPath(); ctx.arc(px, py, 32, 0, Math.PI); ctx.fill(); col('#ffffff', .5); ctx.lineWidth = 2; ctx.stroke() }) } break
    case 'tartan': for (let x = 0; x < 512; x += 128) { ctx.globalAlpha = a * .55; ctx.fillStyle = '#b3262d'; ctx.fillRect(x, 0, 64, 512); ctx.fillStyle = '#1f3a5f'; ctx.fillRect(x + 64, 0, 16, 512); ctx.fillRect(0, x, 512, 64); ctx.fillStyle = '#b3262d'; ctx.fillRect(0, x + 64, 512, 16); ctx.fillStyle = '#222'; ctx.fillRect(x + 100, 0, 6, 512); ctx.fillRect(0, x + 100, 512, 6) } break
    case 'zigzag': for (let y = 0; y < 512; y += 32) { const pts: [number, number][] = []; for (let x = 0; x <= 512; x += 32) pts.push([x, y + (x / 32 % 2 ? 0 : 20)]); line(pts, ['#e5484d', '#3e9bd9', '#f5a524'][(y / 32) % 3], 6, .85) } break
    case 'stars': scatter(48, (x, y) => { const r = 6 + random() * 10, rot = random() * TAU; wrap(x, y, r, (px, py) => { col(pick(PALETTES.gold), .95); ctx.beginPath(); for (let i = 0; i < 10; i++) { const t = rot + i * TAU / 10, rr = i % 2 ? r * .45 : r; if (i) ctx.lineTo(px + Math.cos(t) * rr, py + Math.sin(t) * rr); else ctx.moveTo(px + Math.cos(t) * rr, py + Math.sin(t) * rr) } ctx.closePath(); ctx.fill() }) }); break
    case 'memphis': scatter(34, (x, y) => { const c = pick(PALETTES.conf), t = Math.floor(random() * 3); if (t === 0) dot(x, y, 8 + random() * 8, c); else if (t === 1) polygon(x, y, 12 + random() * 8, 3, random() * TAU, c); else line([[x, y], [x + 24, y + 10], [x + 48, y], [x + 72, y + 10]], c, 4) }); break
    case 'circles': grid(64, (x, y) => { for (const [r, c] of [[34, '#3e9bd9'], [24, '#4cb782'], [14, '#f5a524']] as const) { wrap(x, y, r, (px, py) => { col(c, .5); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke() }) } }); break
    case 'watercolor': scatter(46, (x, y) => dot(x, y, 40 + random() * 70, pick(['#8fb8de', '#b7a6e0', '#f4b6c2', '#a8d5ba', '#f6d98f']), .2)); break
    case 'brush-strokes': scatter(34, (x, y) => { const c = pick(['#1f3a5f', '#c2531b', '#2f6b4f', '#8a6d3b']); line([[x, y], [x + 60 + random() * 60, y + (random() - .5) * 30]], c, 10 + random() * 12, .55) }); break
    case 'ink-marble': for (let i = 0; i < 26; i++) { const y0 = random() * 512, ph = random() * TAU, c = pick(['#1f3a5f', '#6b4aa0', '#2c8c8c', '#222']); const pts: [number, number][] = []; for (let x = 0; x <= 512; x += 8) pts.push([x, y0 + Math.sin(x * TAU / 512 * 2 + ph) * 26 + Math.sin(x * TAU / 512 * 5 + ph * 2) * 8]); line(pts, c, 1 + random() * 4, .5) } break
    case 'topographic': for (let i = 0; i < 18; i++) { const y0 = i * 30, ph = i * .35; const pts: [number, number][] = []; for (let x = 0; x <= 512; x += 8) pts.push([x, y0 + Math.sin(x * TAU / 512 * 2 + ph) * 22 + Math.cos(x * TAU / 512 * 3 - ph) * 10]); line(pts, '#2f6b4f', 1.5, .6) } break
    case 'confetti': scatter(110, (x, y) => { const c = pick(PALETTES.conf), rot = random() * TAU; wrap(x, y, 10, (px, py) => { col(c, .9); ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.fillRect(-6, -2.5, 12, 5); ctx.restore() }) }); break
    case 'snowflakes': scatter(34, (x, y) => { const r = 8 + random() * 14; wrap(x, y, r, (px, py) => { col('#7aa2c8', .9); ctx.lineWidth = 1.8; for (let i = 0; i < 6; i++) { const t = i * TAU / 6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(t) * r, py + Math.sin(t) * r); ctx.stroke() } }) }); scatter(60, (x, y) => dot(x, y, 2 + random() * 2, '#a9c4de', .8)); break
    case 'autumn-leaves': scatter(30, (x, y) => leaf(x, y, 34 + random() * 20, random() * TAU, pick(PALETTES.autumn), .88)); break
    case 'night-sky': ctx.globalAlpha = a * .85; ctx.fillStyle = '#1b2a4a'; ctx.fillRect(0, 0, 512, 512); scatter(120, (x, y) => dot(x, y, .8 + random() * 2, '#fff7d6', .95)); scatter(14, (x, y) => polygon(x, y, 8, 4, Math.PI / 4, '#ffe9a8', .95)); break
  }
  ctx.restore(); ctx.globalAlpha = 1
}
