import type { PrintArtwork, PrintLayer } from './types'
import { DEFAULT_ARTWORK, newPrintLayer, PRINT_STARTERS } from './print-artwork'

/**
 * Print design library: every design is built from editable vector motif layers (ellipse, rect,
 * leaf, petal, or SVG paths in −50…50 coordinates), so colours, sizes, positions and the mm repeat
 * stay editable in the studio, by the AI tools, and as vector objects in the SVG/CorelDRAW export.
 * Positions are tile percent; anything crossing a tile edge wraps, so every repeat is seamless.
 */
export type PrintDesign = { id: string; name: string; category: string; tags?: string; artwork: PrintArtwork }

// ---------------------------------------------------------------------------------------------
// Geometry helpers (all output is plain SVG path syntax accepted by validateArtwork)
// ---------------------------------------------------------------------------------------------
const r1 = (n: number) => Math.round(n * 10) / 10
type Pt = [number, number]
const polar = (a: number, r: number): Pt => [Math.cos(a) * r, Math.sin(a) * r]
const P = (pts: Pt[], close = true) => `M ${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L ')}${close ? ' Z' : ''}`
const circ = (cx: number, cy: number, r: number) => `M ${r1(cx + r)} ${r1(cy)} A ${r1(r)} ${r1(r)} 0 1 0 ${r1(cx - r)} ${r1(cy)} A ${r1(r)} ${r1(r)} 0 1 0 ${r1(cx + r)} ${r1(cy)} Z`
const star = (n: number, ro: number, ri: number, rot = -Math.PI / 2) => P(Array.from({ length: n * 2 }, (_, i) => polar(rot + i * Math.PI / n, i % 2 ? ri : ro)))
const poly = (n: number, r: number, rot = -Math.PI / 2) => P(Array.from({ length: n }, (_, i) => polar(rot + i * 2 * Math.PI / n, r)))
/** Rosette of n pointed petals from the centre. */
const petals = (n: number, len: number, spread = .34, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => {
  const a = rot + i * 2 * Math.PI / n, c1 = polar(a - spread, len * .74), t = polar(a, len), c2 = polar(a + spread, len * .74)
  return `M 0 0 Q ${r1(c1[0])} ${r1(c1[1])} ${r1(t[0])} ${r1(t[1])} Q ${r1(c2[0])} ${r1(c2[1])} 0 0 Z`
}).join(' ')
/** Round-petal flower: n circles around the centre. */
const roundFlower = (n: number, ring: number, r: number, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => { const [x, y] = polar(rot + i * 2 * Math.PI / n, ring); return circ(x, y, r) }).join(' ')
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
/** Smooth organic closed blob (Catmull-Rom through jittered radii). */
function blob(seed: number, n = 8, jitter = .32) {
  const rand = rng(seed), pts = Array.from({ length: n }, (_, i): Pt => polar(i * 2 * Math.PI / n, 50 * (1 - jitter + rand() * jitter)))
  let d = `M ${r1(pts[0][0])} ${r1(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    d += ` C ${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`
  }
  return `${d} Z`
}
/** Horizontal sine band across the full motif width (period divides 100, so it tiles). */
function waveBand(thickness: number, amp: number, waves = 2) {
  const top: Pt[] = [], bottom: Pt[] = []
  for (let i = 0; i <= 40; i++) { const x = -50 + i * 2.5, y = Math.sin((x + 50) / 100 * waves * Math.PI * 2) * amp; top.push([x, y - thickness / 2]); bottom.unshift([x, y + thickness / 2]) }
  return P([...top, ...bottom])
}
/** Visible arcs of one seigaiha scale (the part not hidden by the next row), so no fill/ordering is needed. */
function seigaihaScale(rings = [50, 38, 26, 14]) {
  return rings.map(rho => {
    let a = 0
    for (let k = 0; k <= 180; k++) { const t = k * Math.PI / 360, x = rho * Math.cos(t), y = -rho * Math.sin(t); if (Math.min(Math.hypot(x - 50, y - 25), Math.hypot(x + 50, y - 25)) >= 50) { a = t; break } }
    const x = rho * Math.cos(a), y = -rho * Math.sin(a)
    return `M ${r1(x)} ${r1(y)} A ${rho} ${rho} 0 0 0 ${r1(-x)} ${r1(y)}`
  }).join(' ')
}
/** Asanoha (hemp leaf) unit inside a pointy-top hexagon of radius 50. */
function asanoha() {
  const v = Array.from({ length: 6 }, (_, i) => polar(-Math.PI / 2 + i * Math.PI / 3, 50))
  let d = P(v)
  v.forEach((p, i) => {
    const q = v[(i + 1) % 6], g: Pt = [(p[0] + q[0]) / 3, (p[1] + q[1]) / 3]
    d += ` M 0 0 L ${r1(p[0])} ${r1(p[1])} M ${r1(g[0])} ${r1(g[1])} L 0 0 M ${r1(g[0])} ${r1(g[1])} L ${r1(p[0])} ${r1(p[1])} M ${r1(g[0])} ${r1(g[1])} L ${r1(q[0])} ${r1(q[1])}`
  })
  return d
}
const HOUNDSTOOTH = ['11110001', '11100011', '11000111', '11111111', '00001111', '00010110', '00110000', '01110000']
const houndstoothPath = () => HOUNDSTOOTH.flatMap((row, y) => [...row].map((bit, x) => bit === '1' ? `M ${-50 + x * 12.5} ${-50 + y * 12.5} h 12.5 v 12.5 h -12.5 Z` : '')).filter(Boolean).join(' ')

// Common motif paths.
const HEART = 'M 0 45 C -60 0 -45 -45 0 -18 C 45 -45 60 0 0 45 Z'
const TULIP = 'M 0 30 C -35 20 -40 -20 -30 -45 L -15 -25 L 0 -48 L 15 -25 L 30 -45 C 40 -20 35 20 0 30 Z'
const PAISLEY = 'M 5 48 C -38 48 -46 4 -22 -18 C -6 -32 2 -48 28 -50 C 18 -38 30 -24 32 -6 C 34 26 24 48 5 48 Z'
const PAISLEY_INNER = 'M 5 34 C -22 34 -28 8 -12 -6 C 0 -16 6 -28 18 -32 C 14 -22 20 -12 20 0 C 20 20 16 34 5 34 Z'
const CRESCENT = 'M 12 -46 A 48 48 0 1 0 12 46 A 38 38 0 1 1 12 -46 Z'
const QUARTER = 'M -50 50 L -50 -50 A 100 100 0 0 1 50 50 Z'
const HALF_DISC = 'M -50 0 A 50 50 0 0 1 50 0 Z'
const RHOMBUS = 'M 0 -50 L 50 0 L 0 50 L -50 0 Z'
const TRIANGLE = 'M 0 -50 L 50 50 L -50 50 Z'
const CUP = 'M -34 -18 L 30 -18 L 22 26 C 20 34 -24 34 -26 26 Z M 30 -8 C 50 -8 50 16 26 14'
const STEAM = 'M -12 -26 C -20 -36 -4 -40 -12 -50 M 4 -26 C -4 -36 12 -40 4 -50'
const BEAN_CREASE = 'M 0 -44 C -16 -20 16 20 0 44'
const BERRY = 'M 0 48 C -40 28 -46 -20 -28 -34 C -14 -44 14 -44 28 -34 C 46 -20 40 28 0 48 Z'
const SEEDS = [[-14, -14], [8, -18], [-4, 2], [16, 4], [-18, 12], [4, 22], [-6, 34]].map(([x, y]) => circ(x, y, 2.6)).join(' ')
const LANTERN = 'M -8 -50 L 8 -50 L 8 -42 L 20 -34 L 26 18 L 14 34 L -14 34 L -26 18 L -20 -34 L -8 -42 Z M 0 34 L 0 46'
const LANTERN_GLOW = 'M -14 -26 L 14 -26 L 18 14 L 10 24 L -10 24 L -18 14 Z'
const TREE = 'M 0 -50 L 24 -18 L 12 -18 L 32 10 L 16 10 L 40 38 L -40 38 L -16 10 L -32 10 L -12 -18 L -24 -18 Z'
const BALLOON = 'M 0 30 C -30 30 -36 -8 -30 -24 C -22 -46 22 -46 30 -24 C 36 -8 30 30 0 30 Z M -5 36 L 5 36 L 0 30 Z'
const RAINBOW = (r: number) => `M ${-r} 30 A ${r} ${r} 0 0 1 ${r} 30`
const SQUIGGLE = 'M -50 0 C -42 -20 -33 -20 -25 0 C -17 20 -8 20 0 0 C 8 -20 17 -20 25 0 C 33 20 42 20 50 0'
const ZIGZAG = P([[-50, 10], [-30, -10], [-10, 10], [10, -10], [30, 10], [50, -10]], false)
const ARCH = 'M -30 50 L -30 -10 C -30 -40 0 -50 0 -50 C 0 -50 30 -40 30 -10 L 30 50 Z'
const SNOWFLAKE = Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3, [x, y] = polar(a, 48), [bx, by] = polar(a, 28), [l1x, l1y] = polar(a - .5, 40), [l2x, l2y] = polar(a + .5, 40); return `M 0 0 L ${r1(x)} ${r1(y)} M ${r1(bx)} ${r1(by)} L ${r1(l1x)} ${r1(l1y)} M ${r1(bx)} ${r1(by)} L ${r1(l2x)} ${r1(l2y)}` }).join(' ')
const FERN = (() => { let d = 'M 0 50 C 4 20 -4 -20 0 -50'; for (let i = 0; i < 9; i++) { const y = 40 - i * 10, len = 26 - i * 2.4; d += ` M 0 ${y} Q ${r1(len * .6)} ${r1(y - 6)} ${r1(len)} ${r1(y - 14)} M 0 ${y} Q ${r1(-len * .6)} ${r1(y - 6)} ${r1(-len)} ${r1(y - 14)}` } return d })()
const FROND = (() => { let d = 'M -46 46 Q 0 10 46 -46'; for (let i = 1; i < 10; i++) { const t = i / 10, x = -46 + 92 * t, y = 46 - 92 * t + Math.sin(t * Math.PI) * -6; d += ` M ${r1(x)} ${r1(y)} Q ${r1(x - 4)} ${r1(y - 20)} ${r1(x - 16)} ${r1(y - 30)} M ${r1(x)} ${r1(y)} Q ${r1(x + 20)} ${r1(y + 4)} ${r1(x + 30)} ${r1(y + 16)}` } return d })()
const WHEAT = (() => { let d = 'M 0 50 L 0 -40'; for (let i = 0; i < 5; i++) { const y = -36 + i * 12; d += ` M 0 ${y} Q -16 ${y - 4} -18 ${y - 14} Q -4 ${y - 10} 0 ${y} Z M 0 ${y} Q 16 ${y - 4} 18 ${y - 14} Q 4 ${y - 10} 0 ${y} Z` } return d })()
const SPRIG = 'M 0 50 C 0 20 6 -10 0 -50'
const EUCALYPTUS = [[-14, 30, 11], [14, 14, 10], [-12, -4, 9], [12, -20, 8], [-8, -36, 7]].map(([x, y, r]) => circ(x, y, r)).join(' ')
const OLIVE = 'M -46 30 C -10 20 20 -6 46 -34'
const OLIVE_LEAVES = [[-30, 24, -.2], [-12, 14, -.5], [6, 2, -.7], [24, -14, -.9]].map(([x, y, a], i) => { const s = i % 2 ? 1 : -1, tip = polar(a + s * 1.2, 20); return `M ${x} ${y} Q ${r1(x + tip[0] * .5 + s * 6)} ${r1(y + tip[1] * .5 - 6)} ${r1(x + tip[0])} ${r1(y + tip[1])} Q ${r1(x + tip[0] * .5 - s * 6)} ${r1(y + tip[1] * .5 + 6)} ${x} ${y} Z` }).join(' ')
const MARBLE_VEINS = ['M -50 -30 C -30 -40 -20 -10 0 -18 C 20 -26 30 6 50 -4', 'M -50 22 C -36 10 -24 34 -6 26 C 10 18 24 44 50 36', 'M -20 -50 C -24 -30 -6 -24 -12 -2 C -16 16 2 26 -4 50']
const BRUSH = 'M -40 6 C -20 -10 0 14 20 -2 C 30 -10 38 -4 42 0'

// ---------------------------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------------------------
const L = (shape: PrintLayer['shape'], name: string, o: Partial<PrintLayer>): PrintLayer => ({ ...newPrintLayer(shape), name, ...o })
const path = (name: string, d: string, o: Partial<PrintLayer>): PrintLayer => L('path', name, { path: d, ...o })
const art = (name: string, background: string, tileSize: number, layers: PrintLayer[], rotation = 0): PrintArtwork => ({ ...DEFAULT_ARTWORK, enabled: true, name, background, tileSize, rotation, layers })
/** Deterministic scatter positions (two staggered grids + jitter) that read as hand-placed. */
function scatter(count: number, seed: number) {
  const rand = rng(seed), cols = Math.ceil(Math.sqrt(count)), step = 100 / cols
  return Array.from({ length: count }, (_, i) => ({ x: ((i % cols) + .5 + (Math.floor(i / cols) % 2 ? .5 : 0)) * step + (rand() - .5) * step * .5, y: (Math.floor(i / cols) + .5) * step + (rand() - .5) * step * .5, r: rand() }))
}
const grid = (cols: number, rows: number, stagger = false) => Array.from({ length: cols * rows }, (_, i) => ({ x: ((i % cols) + .5 + (stagger && Math.floor(i / cols) % 2 ? .5 : 0)) * 100 / cols, y: (Math.floor(i / cols) + .5) * 100 / rows, i, row: Math.floor(i / cols), col: i % cols }))

const flower2 = (x: number, y: number, size: number, petal: string, centre: string, n = 5, rot = 0): PrintLayer[] => [
  path('Flower petals', roundFlower(n, 22, 24, -Math.PI / 2 + rot), { x, y, width: size, height: size, fill: petal }),
  L('ellipse', 'Flower centre', { x, y, width: size * .3, height: size * .3, fill: centre }),
]

const LIB: PrintDesign[] = [
  // ── Floral ────────────────────────────────────────────────────────────────────────────────
  { id: 'ditsy-floral', name: 'Ditsy floral', category: 'Floral', tags: 'small flowers liberty', artwork: art('Ditsy floral', '#f6efe4', 60, scatter(14, 7).flatMap((p, i) => flower2(p.x, p.y, 12 + (i % 3) * 3, ['#d16b7a', '#e6a65d', '#6f8fb3'][i % 3], '#f3d27a', 5, p.r))) },
  { id: 'daisy-field', name: 'Daisy field', category: 'Floral', tags: 'daisy white yellow', artwork: art('Daisy field', '#8fb59a', 70, [...scatter(9, 11).flatMap((p, i) => [path('Daisy petals', petals(10, 50, .2), { x: p.x, y: p.y, width: 22 - (i % 3) * 3, height: 22 - (i % 3) * 3, rotation: p.r * 90, fill: '#fffaf0' }), L('ellipse', 'Daisy heart', { x: p.x, y: p.y, width: 6, height: 6, fill: '#f2b632' })])]) },
  { id: 'tulip-rows', name: 'Tulip rows', category: 'Floral', tags: 'tulip scandi folk', artwork: art('Tulip rows', '#fbf3e8', 50, grid(3, 3, true).flatMap(g => [path('Tulip stem', 'M 0 -10 L 0 50', { x: g.x, y: g.y + 4, width: 10, height: 20, fill: 'none', stroke: '#4f7a5a', strokeWidth: 1.2 }), L('leaf', 'Tulip leaf', { x: g.x + 3, y: g.y + 10, width: 4, height: 9, rotation: 35, fill: '#4f7a5a' }), path('Tulip bloom', TULIP, { x: g.x, y: g.y - 2, width: 13, height: 13, fill: ['#e05d5d', '#f2a541', '#c86b98'][g.i % 3] })])) },
  { id: 'cherry-blossom', name: 'Cherry blossom', category: 'Floral', tags: 'sakura japanese pink', artwork: art('Cherry blossom', '#fdf1f3', 70, [path('Branch', 'M -50 20 C -20 0 0 30 20 6 C 34 -10 40 -30 50 -36', { width: 100, height: 100, fill: 'none', stroke: '#6b4a3a', strokeWidth: 1.4 }), ...scatter(10, 21).flatMap((p, i) => [path('Blossom', petals(5, 50, .55), { x: p.x, y: p.y, width: 14 - (i % 3) * 2, height: 14 - (i % 3) * 2, rotation: p.r * 72, fill: i % 2 ? '#f4b6c2' : '#f7cfd8' }), L('ellipse', 'Blossom eye', { x: p.x, y: p.y, width: 2.4, height: 2.4, fill: '#c2436a' })])]) },
  { id: 'wild-rose', name: 'Wild rose', category: 'Floral', tags: 'rose red romance', artwork: art('Wild rose', '#2d1f2b', 90, [...flower2(28, 30, 34, '#c94f6d', '#f2c14e', 5), path('Rose petals inner', roundFlower(5, 12, 13, -Math.PI / 2 + .6), { x: 28, y: 30, width: 20, height: 20, fill: '#e07a93' }), ...flower2(76, 78, 24, '#e07a93', '#f2c14e', 5, .3), L('leaf', 'Rose leaf', { x: 46, y: 44, width: 8, height: 18, rotation: -50, fill: '#5b7d5a' }), L('leaf', 'Rose leaf', { x: 62, y: 64, width: 7, height: 15, rotation: 40, fill: '#5b7d5a' }), L('leaf', 'Rose leaf', { x: 10, y: 52, width: 7, height: 15, rotation: 140, fill: '#5b7d5a' })]) },
  // ── Botanical & eco ───────────────────────────────────────────────────────────────────────
  { id: 'kraft-leaves', name: 'Kraft leaves', category: 'Botanical & eco', tags: 'eco kraft leaf outline natural', artwork: art('Kraft leaves', '#c9a27a', 60, scatter(12, 5).map((p, i) => L('leaf', 'Leaf outline', { x: p.x, y: p.y, width: 7 + (i % 3), height: 16 + (i % 4) * 2, rotation: p.r * 360, fill: 'none', stroke: '#4a3424', strokeWidth: .8 }))) },
  { id: 'fern-garden', name: 'Fern garden', category: 'Botanical & eco', tags: 'fern green leaves', artwork: art('Fern garden', '#eef3ea', 80, grid(3, 2, true).map(g => path('Fern frond', FERN, { x: g.x, y: g.y, width: 22, height: 42, rotation: (g.i % 2 ? 18 : -14), fill: 'none', stroke: g.i % 2 ? '#3f6b4b' : '#6f9a6a', strokeWidth: 1 }))) },
  { id: 'palm-fronds', name: 'Palm fronds', category: 'Botanical & eco', tags: 'tropical palm summer', artwork: art('Palm fronds', '#f3ead6', 110, scatter(5, 33).map((p, i) => path('Palm frond', FROND, { x: p.x, y: p.y, width: 40, height: 40, rotation: p.r * 360, fill: 'none', stroke: i % 2 ? '#2f6b4f' : '#5c8f5b', strokeWidth: 1.6 }))) },
  { id: 'eucalyptus', name: 'Eucalyptus sprigs', category: 'Botanical & eco', tags: 'eucalyptus sage', artwork: art('Eucalyptus sprigs', '#f6f4ef', 70, grid(3, 2, true).flatMap(g => [path('Sprig stem', SPRIG, { x: g.x, y: g.y, width: 14, height: 30, rotation: g.i * 25 - 30, fill: 'none', stroke: '#7d8c7a', strokeWidth: 1 }), path('Round leaves', EUCALYPTUS, { x: g.x, y: g.y, width: 22, height: 30, rotation: g.i * 25 - 30, fill: '#9fb3a3', opacity: .9 })])) },
  { id: 'olive-branch', name: 'Olive branch', category: 'Botanical & eco', tags: 'olive mediterranean', artwork: art('Olive branch', '#f4f0e3', 70, grid(2, 2, true).flatMap(g => [path('Olive stem', OLIVE, { x: g.x, y: g.y, width: 40, height: 34, fill: 'none', stroke: '#6b6b3a', strokeWidth: 1 }), path('Olive leaves', OLIVE_LEAVES, { x: g.x, y: g.y, width: 40, height: 34, fill: '#8a9a5b' }), L('ellipse', 'Olive', { x: g.x + 8, y: g.y - 2, width: 4.5, height: 6, rotation: 30, fill: '#3e4a2a' })])) },
  { id: 'wheat-sheaf', name: 'Wheat', category: 'Botanical & eco', tags: 'wheat bakery grain harvest', artwork: art('Wheat', '#f6e7c8', 55, grid(4, 2, true).map(g => path('Wheat stalk', WHEAT, { x: g.x, y: g.y, width: 12, height: 40, rotation: g.i % 2 ? 10 : -10, fill: '#c89b4b', stroke: '#9c7430', strokeWidth: .5 }))) },
  // ── Geometric ─────────────────────────────────────────────────────────────────────────────
  { id: 'triangles', name: 'Triangle rows', category: 'Geometric', tags: 'triangle modern', artwork: art('Triangle rows', '#f2efe8', 40, grid(4, 4).map(g => path('Triangle', TRIANGLE, { x: g.x + (g.row % 2 ? 12.5 : 0), y: g.y, width: 16, height: 16, rotation: g.row % 2 ? 180 : 0, fill: ['#264653', '#2a9d8f', '#e9c46a', '#e76f51'][(g.i + g.row) % 4] }))) },
  { id: 'harlequin', name: 'Harlequin diamonds', category: 'Geometric', tags: 'diamond argyle', artwork: art('Harlequin diamonds', '#1f2a44', 40, grid(2, 2).flatMap(g => [path('Diamond', RHOMBUS, { x: g.x, y: g.y, width: 50, height: 50, fill: g.i % 3 ? '#c9a96e' : '#2f3e63' })]).concat([path('Diamond', RHOMBUS, { x: 0, y: 0, width: 50, height: 50, fill: '#8a6f45' }), path('Diamond', RHOMBUS, { x: 50, y: 50, width: 50, height: 50, fill: '#8a6f45' })])) },
  { id: 'hex-outline', name: 'Hexagon grid', category: 'Geometric', tags: 'hexagon honeycomb tech', artwork: art('Hexagon grid', '#14161a', 30, grid(2, 3, true).map(g => path('Hexagon', poly(6, 46), { x: g.x, y: g.y, width: 50, height: 38.5, fill: 'none', stroke: '#00e0a4', strokeWidth: .8 }))) },
  { id: 'overlap-circles', name: 'Overlapping circles', category: 'Geometric', tags: 'circle line minimal', artwork: art('Overlapping circles', '#f7f5f0', 30, [[0, 0], [50, 0], [0, 50], [50, 50], [25, 25], [75, 25], [25, 75], [75, 75]].map(([x, y]) => L('ellipse', 'Ring', { x, y, width: 70.7, height: 70.7, fill: 'none', stroke: '#3d5a80', strokeWidth: .6 }))) },
  { id: 'bauhaus', name: 'Bauhaus blocks', category: 'Geometric', tags: 'bauhaus modernist bold', artwork: art('Bauhaus blocks', '#f1e9da', 60, grid(2, 2).flatMap(g => [L('rect', 'Block', { x: g.x, y: g.y, width: 50, height: 50, fill: ['#1d3557', '#e63946', '#f1c453', '#2a9d8f'][g.i] }), path('Quarter disc', g.i % 2 ? HALF_DISC : QUARTER, { x: g.x, y: g.y, width: 40, height: 40, rotation: g.i * 90, fill: ['#f1c453', '#f1e9da', '#1d3557', '#e63946'][g.i] })])) },
  { id: 'parquet-lattice', name: 'Parquet lattice', category: 'Geometric', tags: 'parquet herringbone woven', artwork: art('Parquet lattice', '#e9e2d4', 30, grid(4, 4).map(g => L('rect', 'Brick', { x: g.x, y: g.y, width: 30, height: 9, rotation: (g.col + g.row) % 2 ? 45 : -45, fill: g.i % 3 ? '#b08d6a' : '#8b6b4c', opacity: .9 }))) },
  { id: 'checkerboard', name: 'Checkerboard', category: 'Stripes & checks', tags: 'check chess retro', artwork: art('Checkerboard', '#f4ecd8', 24, grid(4, 4).filter(g => (g.row + g.col) % 2 === 0).map(g => L('rect', 'Check', { x: g.x, y: g.y, width: 25, height: 25, fill: '#2b2b2b' }))) },
  // ── Islamic & girih ───────────────────────────────────────────────────────────────────────
  { id: 'khatam-stars', name: 'Khatam stars', category: 'Islamic & girih', tags: 'eight point star rub el hizb arabic', artwork: art('Khatam stars', '#0f3d3e', 40, [path('Eight-point star', star(8, 50, 38.3), { x: 50, y: 50, width: 56, height: 56, fill: '#d4af37' }), path('Inner star', star(8, 50, 38.3), { x: 50, y: 50, width: 30, height: 30, fill: '#0f3d3e' }), path('Corner star', star(8, 50, 38.3), { x: 0, y: 0, width: 56, height: 56, fill: '#d4af37' }), path('Corner inner', star(8, 50, 38.3), { x: 0, y: 0, width: 30, height: 30, fill: '#0f3d3e' }), path('Cross', poly(4, 50, 0), { x: 50, y: 0, width: 22, height: 22, fill: '#f2e3c6' }), path('Cross', poly(4, 50, 0), { x: 0, y: 50, width: 22, height: 22, fill: '#f2e3c6' })]) },
  { id: 'girih-lattice', name: 'Girih lattice', category: 'Islamic & girih', tags: 'girih lattice geometric arabic', artwork: art('Girih lattice', '#f5ecd9', 45, [...[[50, 50], [0, 0]].flatMap(([x, y]) => [path('Star outline', star(8, 50, 34), { x, y, width: 60, height: 60, fill: 'none', stroke: '#1f5c58', strokeWidth: 1.4 }), path('Octagon', poly(8, 50, Math.PI / 8), { x, y, width: 24, height: 24, fill: 'none', stroke: '#b8860b', strokeWidth: 1.2 })]), path('Link lines', 'M -50 0 L 50 0 M 0 -50 L 0 50', { x: 50, y: 0, width: 40, height: 40, rotation: 45, fill: 'none', stroke: '#1f5c58', strokeWidth: 1 }), path('Link lines', 'M -50 0 L 50 0 M 0 -50 L 0 50', { x: 0, y: 50, width: 40, height: 40, rotation: 45, fill: 'none', stroke: '#1f5c58', strokeWidth: 1 })]) },
  { id: 'moroccan-trellis', name: 'Moroccan trellis', category: 'Islamic & girih', tags: 'quatrefoil moroccan', artwork: art('Moroccan trellis', '#e9f1f2', 36, [[50, 50], [0, 0]].map(([x, y]) => path('Quatrefoil', [circ(-22, 0, 24), circ(22, 0, 24), circ(0, -22, 24), circ(0, 22, 24)].join(' '), { x, y, width: 60, height: 60, fill: 'none', stroke: '#2b6777', strokeWidth: 1.2 }))) },
  { id: 'arabesque-medallion', name: 'Arabesque medallion', category: 'Islamic & girih', tags: 'rosette medallion arabic eid', artwork: art('Arabesque medallion', '#1b3a4b', 60, [[50, 50], [0, 0]].flatMap(([x, y]) => [path('Rosette', petals(12, 50, .22), { x, y, width: 44, height: 44, fill: '#d4af37' }), path('Star', star(8, 50, 30), { x, y, width: 22, height: 22, fill: '#1b3a4b' }), L('ellipse', 'Centre', { x, y, width: 6, height: 6, fill: '#e9d8a6' })]).concat([[50, 0], [0, 50]].map(([x, y]) => path('Small star', star(4, 50, 18), { x, y, width: 14, height: 14, fill: '#e9d8a6' })))) },
  // ── Mughal & paisley ──────────────────────────────────────────────────────────────────────
  { id: 'paisley', name: 'Paisley boteh', category: 'Mughal & paisley', tags: 'paisley boteh mughal urdu', artwork: art('Paisley boteh', '#7a1f2b', 60, grid(2, 2, true).flatMap(g => [path('Boteh', PAISLEY, { x: g.x, y: g.y, width: 26, height: 34, rotation: g.i % 2 ? 160 : -20, fill: '#e0a43b' }), path('Boteh inner', PAISLEY_INNER, { x: g.x, y: g.y, width: 26, height: 34, rotation: g.i % 2 ? 160 : -20, fill: 'none', stroke: '#7a1f2b', strokeWidth: .8 }), path('Boteh dots', roundFlower(6, 18, 5), { x: g.x, y: g.y, width: 9, height: 9, rotation: g.i * 30, fill: '#f4d8a6' })])) },
  { id: 'mughal-buti', name: 'Mughal buti', category: 'Mughal & paisley', tags: 'buti mughal floral sprig', artwork: art('Mughal buti', '#f4ead7', 40, grid(3, 3, true).flatMap(g => [path('Buti bloom', petals(5, 50, .5, -Math.PI / 2), { x: g.x, y: g.y - 3, width: 10, height: 10, fill: '#b5283b' }), L('leaf', 'Buti leaf', { x: g.x - 3, y: g.y + 3, width: 3, height: 7, rotation: -40, fill: '#3e6b48' }), L('leaf', 'Buti leaf', { x: g.x + 3, y: g.y + 3, width: 3, height: 7, rotation: 40, fill: '#3e6b48' })])) },
  { id: 'jaali-arches', name: 'Jaali arches', category: 'Mughal & paisley', tags: 'jaali arch mughal window', artwork: art('Jaali arches', '#efe3cf', 50, grid(3, 2).flatMap(g => [path('Arch', ARCH, { x: g.x, y: g.y, width: 30, height: 46, fill: 'none', stroke: '#8c5a3c', strokeWidth: 1.2 }), path('Arch star', star(6, 50, 24), { x: g.x, y: g.y - 6, width: 9, height: 9, fill: '#8c5a3c' })])) },
  // ── Japanese ──────────────────────────────────────────────────────────────────────────────
  { id: 'seigaiha', name: 'Seigaiha waves', category: 'Japanese', tags: 'seigaiha wave japanese', artwork: art('Seigaiha waves', '#1d3557', 40, grid(2, 8).map(g => path('Wave scale', seigaihaScale(), { x: g.col * 50 + (g.row % 2 ? 25 : 0), y: g.row * 12.5, width: 50, height: 50, fill: 'none', stroke: '#f1faee', strokeWidth: .9 }))) },
  { id: 'asanoha', name: 'Asanoha hemp leaf', category: 'Japanese', tags: 'asanoha japanese hemp star', artwork: art('Asanoha hemp leaf', '#f3efe6', 36, Array.from({ length: 12 }, (_, i) => ({ col: i % 3, row: Math.floor(i / 3) })).map(({ col, row }) => path('Asanoha unit', asanoha(), { x: col * 33.33 + (row % 2 ? 16.67 : 0), y: row * 25, width: 33.4, height: 33.4, fill: 'none', stroke: '#b7472a', strokeWidth: .6 }))) },
  { id: 'shippo', name: 'Shippō circles', category: 'Japanese', tags: 'shippo seven treasures', artwork: art('Shippō circles', '#2c3e50', 30, [[0, 0], [50, 0], [0, 50], [50, 50], [25, 25], [75, 25], [25, 75], [75, 75]].map(([x, y]) => L('ellipse', 'Shippō ring', { x, y, width: 70.7, height: 70.7, fill: 'none', stroke: '#e5c07b', strokeWidth: .8 }))) },
  { id: 'sakura-wave', name: 'Sakura & waves', category: 'Japanese', tags: 'sakura seigaiha', artwork: art('Sakura & waves', '#f9e8e8', 60, [...grid(2, 8).filter(g => g.row >= 5).map(g => path('Wave scale', seigaihaScale(), { x: g.col * 50 + (g.row % 2 ? 25 : 0), y: g.row * 12.5, width: 50, height: 50, fill: 'none', stroke: '#6a8caf', strokeWidth: .7 })), ...scatter(6, 41).map(p => path('Blossom', petals(5, 50, .55), { x: p.x, y: p.y * .55, width: 11, height: 11, rotation: p.r * 72, fill: '#e98ca2' }))]) },
  // ── Scandinavian ──────────────────────────────────────────────────────────────────────────
  { id: 'scandi-folk', name: 'Scandi folk flowers', category: 'Scandinavian', tags: 'folk nordic flower', artwork: art('Scandi folk flowers', '#f7f3ec', 60, grid(2, 2, true).flatMap(g => [path('Folk bloom', petals(8, 50, .3), { x: g.x, y: g.y, width: 24, height: 24, fill: '#c0392b' }), L('ellipse', 'Folk centre', { x: g.x, y: g.y, width: 8, height: 8, fill: '#f7f3ec' }), L('ellipse', 'Folk dot', { x: g.x, y: g.y, width: 3.5, height: 3.5, fill: '#1f4e5f' }), L('leaf', 'Folk leaf', { x: g.x - 14, y: g.y + 8, width: 5, height: 12, rotation: -60, fill: '#1f4e5f' }), L('leaf', 'Folk leaf', { x: g.x + 14, y: g.y + 8, width: 5, height: 12, rotation: 60, fill: '#1f4e5f' })])) },
  { id: 'scandi-hearts', name: 'Nordic hearts', category: 'Scandinavian', tags: 'heart nordic red', artwork: art('Nordic hearts', '#ffffff', 30, grid(3, 3, true).map(g => path('Heart', HEART, { x: g.x, y: g.y, width: 14, height: 14, fill: g.i % 2 ? '#d64545' : '#2f4858' }))) },
  { id: 'scandi-lines', name: 'Dots & dashes', category: 'Scandinavian', tags: 'minimal line dots nordic', artwork: art('Dots & dashes', '#e8e4dc', 30, [...[12.5, 62.5].map(y => L('rect', 'Dash row', { x: 50, y, width: 100, height: 1.6, fill: '#5d6b6b' })), ...grid(4, 2).map(g => L('ellipse', 'Dot', { x: g.x, y: g.row * 50 + 37.5, width: 4, height: 4, fill: '#c97b63' }))]) },
  // ── Memphis & retro ───────────────────────────────────────────────────────────────────────
  { id: 'memphis', name: 'Memphis party', category: 'Memphis & retro', tags: 'memphis 80s squiggle', artwork: art('Memphis party', '#fff7e6', 70, scatter(16, 9).map((p, i) => {
    const color = ['#ff6f91', '#2ec4b6', '#ffd23f', '#1b1b1b'][i % 4], k = i % 4
    return k === 0 ? path('Squiggle', SQUIGGLE, { x: p.x, y: p.y, width: 18, height: 8, rotation: p.r * 180, fill: 'none', stroke: color, strokeWidth: 1.2 })
      : k === 1 ? path('Triangle', TRIANGLE, { x: p.x, y: p.y, width: 8, height: 8, rotation: p.r * 360, fill: 'none', stroke: color, strokeWidth: 1 })
        : k === 2 ? L('ellipse', 'Dot', { x: p.x, y: p.y, width: 5, height: 5, fill: color })
          : path('Zigzag', ZIGZAG, { x: p.x, y: p.y, width: 14, height: 5, rotation: p.r * 180, fill: 'none', stroke: color, strokeWidth: 1 })
  })) },
  { id: 'retro-waves', name: '70s waves', category: 'Memphis & retro', tags: 'retro 70s wave stripes groovy', artwork: art('70s waves', '#f4e1c1', 60, ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f'].map((fill, i) => path('Wave band', waveBand(12, 8), { x: 50, y: 12.5 + i * 25, width: 100, height: 100, fill }))) },
  { id: 'groovy-daisies', name: 'Groovy daisies', category: 'Memphis & retro', tags: 'retro daisy flower power', artwork: art('Groovy daisies', '#e9c46a', 60, scatter(7, 17).flatMap((p, i) => [path('Groovy petals', roundFlower(8, 30, 20), { x: p.x, y: p.y, width: 18 + (i % 3) * 4, height: 18 + (i % 3) * 4, fill: i % 2 ? '#fff4e0' : '#e76f51' }), L('ellipse', 'Groovy centre', { x: p.x, y: p.y, width: 6, height: 6, fill: '#6d3b2a' })])) },
  // ── Luxury ────────────────────────────────────────────────────────────────────────────────
  { id: 'gold-marble', name: 'Gold-vein marble', category: 'Luxury', tags: 'marble gold luxury', artwork: art('Gold-vein marble', '#f5f3ef', 120, [...MARBLE_VEINS.map((d, i) => path('Grey vein', d, { x: 50, y: 50, width: 100, height: 100, rotation: i * 7, fill: 'none', stroke: '#b9b6b0', strokeWidth: .5, opacity: .8 })), path('Gold vein', 'M -50 -10 C -28 -24 -10 8 10 -6 C 26 -18 36 10 50 2', { x: 50, y: 50, width: 100, height: 100, fill: 'none', stroke: '#c9a96e', strokeWidth: .9 }), path('Gold vein', 'M -50 40 C -30 30 -12 48 8 38 C 24 30 34 46 50 44', { x: 50, y: 50, width: 100, height: 100, fill: 'none', stroke: '#c9a96e', strokeWidth: .6 })]) },
  { id: 'gold-lattice', name: 'Gold line lattice', category: 'Luxury', tags: 'gold line black luxury geometric', artwork: art('Gold line lattice', '#111111', 30, [path('Gold diamond', RHOMBUS, { x: 50, y: 50, width: 100, height: 100, fill: 'none', stroke: '#c9a96e', strokeWidth: .5 }), path('Gold diamond', RHOMBUS, { x: 50, y: 50, width: 50, height: 50, fill: 'none', stroke: '#c9a96e', strokeWidth: .4 }), L('ellipse', 'Gold dot', { x: 50, y: 50, width: 3, height: 3, fill: '#c9a96e' }), L('ellipse', 'Gold dot', { x: 0, y: 0, width: 3, height: 3, fill: '#c9a96e' })]) },
  { id: 'deco-scales', name: 'Deco scales', category: 'Luxury', tags: 'art deco scales gold navy', artwork: art('Deco scales', '#13213c', 30, grid(2, 8).map(g => path('Deco scale', seigaihaScale([50, 34]), { x: g.col * 50 + (g.row % 2 ? 25 : 0), y: g.row * 12.5, width: 50, height: 50, fill: 'none', stroke: '#c9a96e', strokeWidth: .9 }))) },
  // ── Stripes & checks ──────────────────────────────────────────────────────────────────────
  { id: 'breton', name: 'Breton stripe', category: 'Stripes & checks', tags: 'stripe navy nautical', artwork: art('Breton stripe', '#fbfaf6', 20, [L('rect', 'Stripe', { x: 50, y: 25, width: 100, height: 18, fill: '#1d2d50' }), L('rect', 'Stripe', { x: 50, y: 75, width: 100, height: 18, fill: '#1d2d50' })]) },
  { id: 'pinstripe-print', name: 'Pinstripe', category: 'Stripes & checks', tags: 'pinstripe suit', artwork: art('Pinstripe', '#2b2d42', 12, [L('rect', 'Pinstripe', { x: 25, y: 50, width: 3, height: 100, fill: '#d9d9d9' }), L('rect', 'Pinstripe', { x: 75, y: 50, width: 3, height: 100, fill: '#d9d9d9' })]) },
  { id: 'candy-stripe', name: 'Candy stripe', category: 'Stripes & checks', tags: 'diagonal stripe candy', artwork: art('Candy stripe', '#ffffff', 16, [L('rect', 'Candy stripe', { x: 25, y: 50, width: 25, height: 100, fill: '#e63946' }), L('rect', 'Candy stripe', { x: 75, y: 50, width: 25, height: 100, fill: '#e63946' })], 45) },
  { id: 'gingham-print', name: 'Gingham', category: 'Stripes & checks', tags: 'gingham check picnic', artwork: art('Gingham', '#ffffff', 14, [L('rect', 'Warp band', { x: 25, y: 50, width: 50, height: 100, fill: '#4c7fb8', opacity: .45 }), L('rect', 'Weft band', { x: 50, y: 25, width: 100, height: 50, fill: '#4c7fb8', opacity: .45 })]) },
  { id: 'buffalo-check', name: 'Buffalo check', category: 'Stripes & checks', tags: 'buffalo plaid lumberjack', artwork: art('Buffalo check', '#b22222', 40, [L('rect', 'Warp band', { x: 25, y: 50, width: 50, height: 100, fill: '#111111', opacity: .55 }), L('rect', 'Weft band', { x: 50, y: 25, width: 100, height: 50, fill: '#111111', opacity: .55 })]) },
  { id: 'tartan', name: 'Tartan', category: 'Stripes & checks', tags: 'tartan plaid scottish', artwork: art('Tartan', '#1f4d3a', 50, [L('rect', 'Navy warp', { x: 30, y: 50, width: 30, height: 100, fill: '#1d2d50', opacity: .6 }), L('rect', 'Navy weft', { x: 50, y: 30, width: 100, height: 30, fill: '#1d2d50', opacity: .6 }), L('rect', 'Red line', { x: 75, y: 50, width: 3, height: 100, fill: '#c0392b' }), L('rect', 'Red line', { x: 50, y: 75, width: 100, height: 3, fill: '#c0392b' }), L('rect', 'Gold line', { x: 30, y: 50, width: 1.2, height: 100, fill: '#e9c46a' }), L('rect', 'Gold line', { x: 50, y: 30, width: 100, height: 1.2, fill: '#e9c46a' })]) },
  { id: 'houndstooth-print', name: 'Houndstooth', category: 'Stripes & checks', tags: 'houndstooth tweed classic', artwork: art('Houndstooth', '#f4f1ea', 14, [path('Houndstooth', houndstoothPath(), { x: 50, y: 50, width: 100, height: 100, fill: '#1b1b1b' })]) },
  // ── Polka & halftone ──────────────────────────────────────────────────────────────────────
  { id: 'polka', name: 'Classic polka', category: 'Polka & halftone', tags: 'polka dots', artwork: art('Classic polka', '#e63946', 20, [L('ellipse', 'Dot', { x: 25, y: 25, width: 22, height: 22, fill: '#fff5ea' }), L('ellipse', 'Dot', { x: 75, y: 75, width: 22, height: 22, fill: '#fff5ea' })]) },
  { id: 'halftone', name: 'Halftone burst', category: 'Polka & halftone', tags: 'halftone pop art comic', artwork: art('Halftone burst', '#ffd23f', 50, grid(8, 8, true).map(g => { const d = Math.hypot(g.x - 50, g.y - 50) / 70; return L('ellipse', 'Halftone dot', { x: g.x, y: g.y, width: r1(Math.max(1, 10 * (1 - d))), height: r1(Math.max(1, 10 * (1 - d))), fill: '#e63946' }) })) },
  { id: 'confetti', name: 'Confetti', category: 'Polka & halftone', tags: 'confetti party birthday', artwork: art('Confetti', '#ffffff', 50, scatter(30, 3).map((p, i) => L(i % 3 ? 'rect' : 'ellipse', 'Confetti', { x: p.x, y: p.y, width: i % 3 ? 2.2 : 3, height: i % 3 ? 5 : 3, rotation: p.r * 360, fill: ['#ff6f91', '#2ec4b6', '#ffd23f', '#845ec2', '#ff9671'][i % 5] }))) },
  // ── Abstract organic ──────────────────────────────────────────────────────────────────────
  { id: 'organic-blobs', name: 'Organic blobs', category: 'Abstract organic', tags: 'blob abstract modern pastel', artwork: art('Organic blobs', '#f6efe7', 90, scatter(7, 13).map((p, i) => path('Blob', blob(100 + i), { x: p.x, y: p.y, width: 18 + (i % 3) * 6, height: 16 + (i % 2) * 8, rotation: p.r * 360, fill: ['#e8b4a0', '#a8c3b8', '#f2d49b', '#c7b7d6'][i % 4] }))) },
  { id: 'brush-strokes', name: 'Brush strokes', category: 'Abstract organic', tags: 'brush paint abstract', artwork: art('Brush strokes', '#fbf8f2', 70, scatter(10, 27).map((p, i) => path('Brush stroke', BRUSH, { x: p.x, y: p.y, width: 22, height: 14, rotation: p.r * 180 - 90, fill: 'none', stroke: ['#2d3142', '#bf4e30', '#4f8a8b'][i % 3], strokeWidth: 3 }))) },
  { id: 'pebbles', name: 'River pebbles', category: 'Abstract organic', tags: 'stone pebble calm', artwork: art('River pebbles', '#e8e4dc', 60, scatter(14, 19).map((p, i) => path('Pebble', blob(300 + i, 6, .18), { x: p.x, y: p.y, width: 11 + (i % 4) * 2, height: 8 + (i % 3) * 2, rotation: p.r * 180, fill: ['#9aa5a0', '#c8c1b4', '#7d847f', '#b5a999'][i % 4] }))) },
  // ── Food, coffee & tea ────────────────────────────────────────────────────────────────────
  { id: 'coffee-beans', name: 'Coffee beans', category: 'Food & drink', tags: 'coffee bean cafe roaster', artwork: art('Coffee beans', '#efe3d0', 45, scatter(10, 29).flatMap(p => [L('ellipse', 'Bean', { x: p.x, y: p.y, width: 8, height: 11, rotation: p.r * 360, fill: '#5b3a29' }), path('Bean crease', BEAN_CREASE, { x: p.x, y: p.y, width: 8, height: 11, rotation: p.r * 360, fill: 'none', stroke: '#efe3d0', strokeWidth: .7 })])) },
  { id: 'teacups', name: 'Teacups', category: 'Food & drink', tags: 'tea cup cafe', artwork: art('Teacups', '#e3efe6', 60, grid(2, 2, true).flatMap(g => [path('Cup', CUP, { x: g.x, y: g.y, width: 20, height: 20, fill: '#ffffff', stroke: '#2f5d50', strokeWidth: 1 }), path('Steam', STEAM, { x: g.x, y: g.y, width: 20, height: 20, fill: 'none', stroke: '#2f5d50', strokeWidth: .8 }), L('ellipse', 'Saucer', { x: g.x, y: g.y + 7, width: 22, height: 3, fill: '#2f5d50' }), L('leaf', 'Tea leaf', { x: g.x + 16, y: g.y - 12, width: 4, height: 8, rotation: 30, fill: '#6f9a6a' })])) },
  { id: 'citrus-slices', name: 'Citrus slices', category: 'Food & drink', tags: 'lemon orange citrus fresh juice', artwork: art('Citrus slices', '#fff9e8', 60, scatter(6, 31).flatMap((p, i) => { const peel = i % 2 ? '#f4a261' : '#f2c94c', flesh = i % 2 ? '#ffd6a5' : '#fff1a8'; return [L('ellipse', 'Peel', { x: p.x, y: p.y, width: 20, height: 20, fill: peel }), L('ellipse', 'Flesh', { x: p.x, y: p.y, width: 17, height: 17, fill: flesh }), path('Segments', Array.from({ length: 8 }, (_, k) => { const [x, y] = polar(k * Math.PI / 4, 46); return `M 0 0 L ${r1(x)} ${r1(y)}` }).join(' '), { x: p.x, y: p.y, width: 17, height: 17, rotation: p.r * 45, fill: 'none', stroke: peel, strokeWidth: .7 })] })) },
  { id: 'strawberries', name: 'Strawberries', category: 'Food & drink', tags: 'strawberry fruit summer', artwork: art('Strawberries', '#fdf0f0', 50, scatter(7, 37).flatMap(p => [path('Berry', BERRY, { x: p.x, y: p.y, width: 12, height: 13, rotation: p.r * 60 - 30, fill: '#e63946' }), path('Seeds', SEEDS, { x: p.x, y: p.y, width: 12, height: 13, rotation: p.r * 60 - 30, fill: '#ffe8a3' }), path('Calyx', star(6, 50, 18), { x: p.x, y: p.y - 6, width: 9, height: 5, rotation: p.r * 60 - 30, fill: '#3f8f4a' })])) },
  // ── Festive ───────────────────────────────────────────────────────────────────────────────
  { id: 'eid-moons', name: 'Eid moons & stars', category: 'Festive', tags: 'eid ramadan crescent moon star islamic arabic urdu', artwork: art('Eid moons & stars', '#0b3b3c', 60, [...grid(2, 2, true).map(g => path('Crescent', CRESCENT, { x: g.x, y: g.y, width: 18, height: 18, rotation: -20, fill: '#d4af37' })), ...scatter(10, 43).map((p, i) => path('Star', star(5, 50, 20), { x: p.x, y: p.y, width: 3 + (i % 3) * 1.5, height: 3 + (i % 3) * 1.5, fill: '#f2e3c6' }))]) },
  { id: 'ramadan-lanterns', name: 'Ramadan lanterns', category: 'Festive', tags: 'fanoos lantern ramadan eid', artwork: art('Ramadan lanterns', '#22223b', 70, grid(3, 2, true).flatMap(g => [path('Hanging cord', 'M 0 -50 L 0 50', { x: g.x, y: g.y - 20, width: 4, height: 20, fill: 'none', stroke: '#c9a96e', strokeWidth: .6 }), path('Lantern frame', LANTERN, { x: g.x, y: g.y, width: 16, height: 24, fill: '#c9a96e', stroke: '#8a6f45', strokeWidth: .4 }), path('Lantern glow', LANTERN_GLOW, { x: g.x, y: g.y, width: 16, height: 24, fill: '#f6d06f' })])) },
  { id: 'christmas-trees', name: 'Christmas trees', category: 'Festive', tags: 'christmas tree xmas winter holiday', artwork: art('Christmas trees', '#f4efe6', 50, grid(3, 2, true).flatMap(g => [path('Tree', TREE, { x: g.x, y: g.y, width: 18, height: 24, fill: g.i % 2 ? '#2d6a4f' : '#40916c' }), L('rect', 'Trunk', { x: g.x, y: g.y + 11, width: 3, height: 4, fill: '#7f5539' }), path('Tree star', star(5, 50, 20), { x: g.x, y: g.y - 12, width: 5, height: 5, fill: '#e9c46a' })])) },
  { id: 'snowflakes', name: 'Snowflakes', category: 'Festive', tags: 'snow winter christmas', artwork: art('Snowflakes', '#1d3557', 50, scatter(9, 47).map((p, i) => path('Snowflake', SNOWFLAKE, { x: p.x, y: p.y, width: 10 + (i % 3) * 4, height: 10 + (i % 3) * 4, rotation: p.r * 60, fill: 'none', stroke: '#f1faee', strokeWidth: .7 }))) },
  // ── Kids ──────────────────────────────────────────────────────────────────────────────────
  { id: 'rainbows', name: 'Little rainbows', category: 'Kids', tags: 'rainbow kids nursery', artwork: art('Little rainbows', '#fff8f0', 50, grid(2, 2, true).flatMap(g => ['#ef767a', '#f6ae2d', '#7dcfb6', '#6c8ead'].map((stroke, k) => path('Rainbow arc', RAINBOW(46 - k * 9), { x: g.x, y: g.y, width: 22, height: 22, fill: 'none', stroke, strokeWidth: 1.6 })))) },
  { id: 'balloons', name: 'Balloons', category: 'Kids', tags: 'balloon party birthday kids', artwork: art('Balloons', '#eaf4f4', 60, scatter(7, 53).flatMap((p, i) => [path('String', 'M 0 -50 C -10 -20 10 20 0 50', { x: p.x, y: p.y + 12, width: 4, height: 14, fill: 'none', stroke: '#7a7a7a', strokeWidth: .4 }), path('Balloon', BALLOON, { x: p.x, y: p.y, width: 12, height: 15, fill: ['#ff6f91', '#ffd23f', '#2ec4b6', '#845ec2'][i % 4] })])) },
  { id: 'stars-moons-kids', name: 'Stars & moons', category: 'Kids', tags: 'night star moon nursery', artwork: art('Stars & moons', '#b8c0ff', 50, scatter(12, 59).map((p, i) => i % 4 === 0 ? path('Moon', CRESCENT, { x: p.x, y: p.y, width: 10, height: 10, rotation: p.r * 90, fill: '#fff3b0' }) : path('Star', star(5, 50, 22), { x: p.x, y: p.y, width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, rotation: p.r * 72, fill: '#ffffff' }))) },
  // ── Logo repeats ──────────────────────────────────────────────────────────────────────────
  { id: 'logo-staggered', name: 'Logo staggered', category: 'Logo repeats', tags: 'logo brand monogram', artwork: art('Logo staggered', 'auto', 60, [L('logo', 'Company logo', { x: 25, y: 25, width: 30, height: 30 }), L('logo', 'Company logo', { x: 75, y: 75, width: 30, height: 30 })]) },
  { id: 'logo-diagonal', name: 'Logo diagonal', category: 'Logo repeats', tags: 'logo brand rotated', artwork: art('Logo diagonal', 'auto', 50, [L('logo', 'Company logo', { x: 25, y: 25, width: 28, height: 28, rotation: -30 }), L('logo', 'Company logo', { x: 75, y: 75, width: 28, height: 28, rotation: -30, opacity: .5 })]) },
]

const CORE_CATEGORY: Record<string, string> = { 'navy-blooms': 'Floral', garden: 'Floral', lattice: 'Geometric', terrazzo: 'Abstract organic', deco: 'Luxury', 'logo-repeat': 'Logo repeats' }
/** The full editable print library: the original starters plus the extended collection. */
export const PRINT_LIBRARY: PrintDesign[] = [...PRINT_STARTERS.map(p => ({ ...p, category: CORE_CATEGORY[p.id] || 'Geometric' })), ...LIB]
export const PRINT_CATEGORIES = [...new Set(PRINT_LIBRARY.map(p => p.category))]
export const findPrint = (id: string) => PRINT_LIBRARY.find(p => p.id === id)
/** A deep copy safe to store on a design. */
export const clonePrint = (p: PrintDesign): PrintArtwork => ({ ...p.artwork, layers: p.artwork.layers.map(l => ({ ...l })) })
export const searchPrints = (query = '', category = 'All') => {
  const q = query.trim().toLowerCase()
  return PRINT_LIBRARY.filter(p => (category === 'All' || p.category === category) && (!q || `${p.name} ${p.category} ${p.tags || ''}`.toLowerCase().includes(q)))
}
