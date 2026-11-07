import type { Design, PrintArtwork, PrintLayer } from './types'
import { getSurface } from './textures'
import { textureCanvas } from './texture-canvas'

export const DEFAULT_ARTWORK: PrintArtwork = { enabled: false, name: 'Custom print', tileSize: 80, rotation: 0, background: 'auto', layers: [] }
export const getArtwork = (design: Design): PrintArtwork => ({ ...DEFAULT_ARTWORK, ...design.artwork })
export const newPrintLayer = (shape: PrintLayer['shape'] = 'ellipse'): PrintLayer => ({ name: 'New motif', shape, x: 50, y: 50, width: 25, height: 25, rotation: 0, fill: '#233c60', stroke: 'none', strokeWidth: 1, opacity: 1 })
const leafPath = 'M 0 -50 C 70 -45 70 45 0 50 C -70 45 -70 -45 0 -50 Z'
const petalPath = 'M 0 50 C -70 10 -50 -50 0 -50 C 50 -50 70 10 0 50 Z'
function flower(x: number, y: number, color: string, size = 36): PrintLayer[] {
  return [...Array.from({ length: 6 }, (_, i) => ({ ...newPrintLayer('petal'), name: `Petal ${i + 1}`, x: x + Math.sin(i * Math.PI / 3) * size * .24, y: y + Math.cos(i * Math.PI / 3) * size * .24, width: size * .4, height: size * .55, rotation: -i * 60, fill: color })), { ...newPrintLayer(), name: 'Flower center', x, y, width: size * .15, height: size * .15, fill: '#e6bc68' }]
}
export const PRINT_STARTERS: { id: string; name: string; artwork: PrintArtwork }[] = [
  { id: 'navy-blooms', name: 'Navy blooms', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Navy blooms', background: '#c3d4e8', tileSize: 110, layers: [...flower(27, 29, '#213c67', 60), ...flower(77, 78, '#436594', 33)] } },
  { id: 'garden', name: 'Botanical garden', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Botanical garden', background: '#f5eedf', layers: [...flower(30, 32, '#cc6575', 32), ...flower(75, 78, '#dea66d', 24), ...[20, 50, 80].map((x, i) => ({ ...newPrintLayer('leaf'), name: 'Garden leaf', x, y: 65 - i * 15, width: 13, height: 30, rotation: 30 + i * 50, fill: '#607c58' }))] } },
  { id: 'lattice', name: 'Heritage lattice', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Heritage lattice', tileSize: 35, background: '#e8e5db', layers: [ { ...newPrintLayer('path'), name: 'Interlocking lattice', width: 100, height: 100, path: 'M -50 0 L -30 -20 L -20 -20 L -20 -30 L 0 -50 L 20 -30 L 20 -20 L 30 -20 L 50 0 L 30 20 L 20 20 L 20 30 L 0 50 L -20 30 L -20 20 L -30 20 Z M -20 0 L 0 -20 L 20 0 L 0 20 Z', fill: 'none', stroke: '#788b8e', strokeWidth: 2 } ] } },
  { id: 'terrazzo', name: 'Studio terrazzo', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Studio terrazzo', background: '#f4e6d6', tileSize: 65, layers: Array.from({ length: 18 }, (_, i) => ({ ...newPrintLayer('path'), name: `Chip ${i + 1}`, x: (i * 37 + 13) % 100, y: (i * 61 + 17) % 100, width: 6 + i % 7, height: 5 + i % 9, rotation: i * 47 % 360 - 180, path: 'M -40 -30 L 50 -50 L 25 45 L -50 20 Z', fill: ['#aa6760', '#455c61', '#d6ab62', '#899477'][i % 4] })) } },
  { id: 'deco', name: 'Art deco fans', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Art deco fans', background: '#243e3b', tileSize: 55, layers: [ ...[95, 75, 55].map(size => ({ ...newPrintLayer('path'), name: 'Deco arch', width: size, height: size, path: 'M -50 50 C -50 -80 50 -80 50 50 M 0 50 L 0 -47', fill: 'none', stroke: '#caac70', strokeWidth: 2 })) ] } },
  { id: 'logo-repeat', name: 'Your logo repeat', artwork: { ...DEFAULT_ARTWORK, enabled: true, name: 'Your logo repeat', layers: [{ ...newPrintLayer('logo'), name: 'Company logo', width: 55, height: 55 }] } },
]

export function validateArtwork(value: unknown): Partial<PrintArtwork> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Artwork must be an object.')
  const result: Record<string, unknown> = {}
  const num = (v: unknown, low: number, high: number) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < low || v > high) throw new Error(`Artwork number must be between ${low} and ${high}.`); return v }
  const color = (v: unknown, extra = 'none') => { if (v !== extra && (typeof v !== 'string' || !/^#[a-f\d]{6}$/i.test(v))) throw new Error('Artwork colors must use six-digit hex colors.'); return v }
  for (const [key, v] of Object.entries(value)) {
    if (key === 'enabled' && typeof v === 'boolean') result[key] = v
    else if (key === 'name' && typeof v === 'string' && v.length <= 80) result[key] = v
    else if (key === 'tileSize') result[key] = num(v, 10, 600)
    else if (key === 'rotation') result[key] = num(v, -180, 180)
    else if (key === 'background') result[key] = color(v, 'auto')
    else if (key === 'layers' && Array.isArray(v) && v.length <= 80) result[key] = v.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Each motif must be an object.')
      const layer = { ...newPrintLayer(), ...item } as PrintLayer
      if (Object.keys(item).some(k => !['name', 'shape', 'x', 'y', 'width', 'height', 'rotation', 'fill', 'stroke', 'strokeWidth', 'opacity', 'path'].includes(k))) throw new Error('Unsupported motif field.')
      if (!['ellipse', 'rect', 'leaf', 'petal', 'path', 'logo', 'image'].includes(layer.shape)) throw new Error('Unsupported motif shape.')
      if (typeof layer.name !== 'string' || layer.name.length > 80) throw new Error('Motif name is too long.')
      for (const k of ['x', 'y'] as const) num(layer[k], -100, 200)
      for (const k of ['width', 'height'] as const) num(layer[k], .1, 200)
      num(layer.rotation, -360, 360); num(layer.opacity, 0, 1); num(layer.strokeWidth, 0, 20)
      color(layer.fill); color(layer.stroke)
      if (layer.path !== undefined && (typeof layer.path !== 'string' || layer.path.length > 4000 || !/^[MmLlHhVvCcSsQqTtAaZz\d\s.,+eE-]+$/.test(layer.path))) throw new Error('Paths must contain only SVG path commands and numeric coordinates.')
      if (layer.shape === 'path' && !layer.path) throw new Error('A custom path motif needs path coordinates centered in -50 to 50 space.')
      if (layer.path) {
        if (!/^\s*[Mm]/.test(layer.path) || (layer.path.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || []).some(n => !Number.isFinite(Number(n)) || Math.abs(Number(n)) > 1000)) throw new Error('Paths must start with M and use finite coordinates within -1000 to 1000.')
        if (typeof Path2D !== 'undefined') { try { new Path2D(layer.path) } catch { throw new Error('Invalid vector path coordinates.') } }
      }
      return layer
    })
    else throw new Error(`Unsupported or invalid artwork field: ${key}`)
  }
  if (!Object.keys(result).length) throw new Error('Supply an artwork change.')
  return result as Partial<PrintArtwork>
}
const imageCache = new Map<string, Promise<HTMLImageElement>>()
function loadImage(url?: string) {
  if (!url) return Promise.resolve(undefined)
  if (!imageCache.has(url)) { if (imageCache.size > 12) imageCache.clear(); const img = new Image(); img.src = url; imageCache.set(url, img.decode().then(() => img)) }
  return imageCache.get(url)!
}
export async function printTile(design: Design, size = 512) {
  const a = getArtwork(design), surface = getSurface(design)
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = a.enabled && a.background !== 'auto' ? a.background : design.color; ctx.fillRect(0, 0, size, size)
  if (a.enabled) {
    const [logo, image] = await Promise.all([a.layers.some(l => l.shape === 'logo') ? loadImage(design.logo) : undefined, a.layers.some(l => l.shape === 'image') ? loadImage(a.image) : undefined])
    ctx.scale(size / 100, size / 100)
    for (const layer of a.layers) for (const dx of [-200, -100, 0, 100, 200]) for (const dy of [-200, -100, 0, 100, 200]) {
      ctx.save(); ctx.translate(((layer.x % 100) + 100) % 100 + dx, ((layer.y % 100) + 100) % 100 + dy); ctx.rotate(layer.rotation * Math.PI / 180); ctx.globalAlpha = layer.opacity
      const img = layer.shape === 'logo' ? logo : layer.shape === 'image' ? image : undefined
      if (img) { const scale = Math.min(layer.width / img.width, layer.height / img.height); ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale) }
      else if (!['logo', 'image'].includes(layer.shape)) {
        // Paths live in a 100-unit square. Scaling occurs before painting, keeping every motif editable.
        ctx.scale(layer.width / 100, layer.height / 100)
        const path = new Path2D(layer.shape === 'leaf' ? leafPath : layer.shape === 'petal' ? petalPath : layer.shape === 'path' ? layer.path : undefined)
        if (layer.shape === 'ellipse') path.ellipse(0, 0, 50, 50, 0, 0, Math.PI * 2)
        if (layer.shape === 'rect') path.rect(-50, -50, 100, 100)
        if (layer.fill !== 'none') { ctx.fillStyle = layer.fill; ctx.fill(path) }
        if (layer.stroke !== 'none' && layer.strokeWidth) { ctx.strokeStyle = layer.stroke; ctx.lineWidth = layer.strokeWidth * 100 / Math.max(layer.width, layer.height); ctx.stroke(path) }
      }
      ctx.restore()
    }
    ctx.resetTransform()
  }
  if (surface.texture !== 'none') {
    ctx.globalCompositeOperation = 'multiply'
    const grain = textureCanvas(surface.texture, surface.strength, size)
    const repeat = ctx.createPattern(grain, 'repeat')!
    const factor = a.enabled ? 64 * surface.scale / a.tileSize : 1
    repeat.setTransform(new DOMMatrix().translate(size / 2, size / 2).rotate(a.enabled ? surface.rotation : 0).scale(factor).translate(-size / 2, -size / 2))
    ctx.fillStyle = repeat; ctx.fillRect(0, 0, size, size)
  }
  return canvas
}
