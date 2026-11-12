import type { Design, Surface } from './types'
import { PATTERNS, PATTERN_IDS } from './texture-patterns'

/**
 * Procedural material finish catalogue. This module is intentionally light (ids, names and
 * physical hints only) so validation, the AI tools and the UI pickers can import it without
 * pulling the canvas generators; those live in `texture-canvas.ts`.
 */
export const TEXTURES = [
  ['none', 'Smooth', 'Paper'], ['fine-paper', 'Fine paper', 'Paper'], ['cotton-paper', 'Cotton stock', 'Paper'], ['kraft', 'Natural kraft', 'Paper'], ['recycled', 'Recycled flecks', 'Paper'], ['laid-paper', 'Laid paper', 'Paper'], ['corrugated', 'Micro corrugated', 'Paper'],
  ['linen', 'Bookcloth linen', 'Textile'], ['canvas', 'Woven canvas', 'Textile'], ['herringbone', 'Herringbone weave', 'Textile'], ['silk', 'Fine silk', 'Textile'], ['felt', 'Soft felt', 'Textile'],
  ['wood', 'Wood grain', 'Natural'], ['cork', 'Natural cork', 'Natural'], ['marble', 'Marble veins', 'Natural'], ['leather', 'Pebbled leather', 'Natural'], ['stone', 'Stone grain', 'Natural'],
  ['brushed-metal', 'Brushed metal', 'Metal'], ['hammered', 'Hammered finish', 'Metal'], ['foil', 'Crinkled foil', 'Metal'],
  ['pinstripe', 'Fine pinstripe', 'Pattern'], ['dots', 'Micro dots', 'Pattern'], ['grid', 'Embossed grid', 'Pattern'], ['diagonal', 'Diagonal lines', 'Pattern'], ['diamond', 'Diamond emboss', 'Pattern'], ['waves', 'Soft waves', 'Pattern'], ['chevron', 'Chevron', 'Pattern'], ['crosshatch', 'Crosshatch', 'Pattern'],
  // Extended library (procedural, no downloads).
  ['washi', 'Japanese washi', 'Paper'], ['vellum', 'Translucent vellum', 'Paper'], ['eggshell', 'Eggshell stock', 'Paper'], ['newsprint', 'Newsprint', 'Paper'], ['seed-paper', 'Seed / plantable paper', 'Paper'], ['mulberry', 'Handmade mulberry', 'Paper'], ['exposed-flute', 'Exposed B-flute', 'Paper'],
  ['velvet', 'Velvet / soft-touch', 'Textile'], ['burlap', 'Hessian burlap', 'Textile'], ['denim', 'Denim twill', 'Textile'], ['tweed', 'Tweed', 'Textile'], ['suede', 'Brushed suede', 'Textile'], ['quilted', 'Quilted stitch', 'Textile'],
  ['bamboo', 'Bamboo', 'Natural'], ['rattan', 'Rattan cane weave', 'Natural'], ['terrazzo', 'Terrazzo', 'Natural'], ['slate', 'Slate', 'Natural'], ['croc-leather', 'Embossed croc leather', 'Natural'], ['burl', 'Walnut burl', 'Natural'], ['sand', 'Fine sand', 'Natural'],
  ['holographic', 'Holographic foil', 'Metal'], ['pearlescent', 'Pearlescent', 'Metal'], ['carbon-fiber', 'Carbon fibre', 'Metal'], ['glitter', 'Glitter', 'Metal'], ['sandblasted', 'Sandblasted metal', 'Metal'], ['satin-chrome', 'Satin chrome', 'Metal'],
  ['honeycomb', 'Honeycomb emboss', 'Pattern'], ['seigaiha', 'Seigaiha waves', 'Pattern'], ['girih', 'Islamic star lattice', 'Pattern'], ['houndstooth', 'Houndstooth', 'Pattern'], ['gingham', 'Gingham', 'Pattern'], ['polka', 'Polka dots', 'Pattern'], ['argyle', 'Argyle', 'Pattern'], ['fluted', 'Fluted ribs', 'Pattern'],
  ...PATTERNS,
].map(([id, name, category]) => ({ id, name, category }))

/** Physical hints the 3D renderer applies on top of the substrate preset for a finish. */
export type TextureFinish = { metalness?: number; roughness?: number; iridescence?: number; sheen?: number; clearcoat?: number; bump?: number }
export const TEXTURE_FINISHES: Record<string, TextureFinish> = {
  foil: { metalness: .7, roughness: .3 }, hammered: { metalness: .7, roughness: .4 }, 'brushed-metal': { metalness: .75, roughness: .38 },
  holographic: { metalness: .85, roughness: .16, iridescence: 1, clearcoat: .6 }, pearlescent: { metalness: .25, roughness: .3, iridescence: .7, sheen: .5, clearcoat: .4 },
  'carbon-fiber': { metalness: .3, roughness: .25, clearcoat: 1 }, glitter: { metalness: .8, roughness: .35, iridescence: .4 }, sandblasted: { metalness: .8, roughness: .62 }, 'satin-chrome': { metalness: .95, roughness: .22 },
  velvet: { roughness: 1, sheen: 1, bump: .3 }, suede: { roughness: .98, sheen: .7 }, vellum: { roughness: .5, clearcoat: .2 }, 'croc-leather': { roughness: .55, clearcoat: .3, bump: 1.4 },
  quilted: { bump: 1.6 }, honeycomb: { bump: 1.3 }, fluted: { bump: 1.4 }, 'exposed-flute': { bump: 1.5 }, slate: { roughness: .9 },
}
/** Textures that paint their own colours (all others are neutral grain multiplied over the base colour). */
export const TINTED_TEXTURES = new Set(['holographic', 'pearlescent', 'glitter', 'terrazzo', 'seed-paper', 'burl', ...PATTERN_IDS])
export const DEFAULT_SURFACE: Surface = { texture: 'none', scale: 1, strength: .5, rotation: 0 }
export const getSurface = (design: Design): Surface => ({ ...DEFAULT_SURFACE, ...design.surface })
export const textureName = (id: string) => TEXTURES.find(texture => texture.id === id)?.name ?? 'Smooth'
