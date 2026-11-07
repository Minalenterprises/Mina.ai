import type { Design, ShapeParams } from './types'

/**
 * Every physical packaging shape the 3D engine and the dieline builder understand.
 * `Design.structure` stores the shape id; legacy designs (category + standard
 * structure) are mapped by `resolveShape`, so older projects keep rendering.
 */
export const SHAPE_IDS = [
  'rigid-box', 'carton', 'bag', 'canister', 'hexagon', 'drawer', 'window', 'divider',
  'octagon', 'prism', 'pillow', 'pyramid', 'gable', 'mailer', 'tube', 'bottle', 'jar',
  'pouch', 'sachet', 'tray', 'sleeve', 'display', 'lathe', 'extrude',
] as const
export type ShapeId = typeof SHAPE_IDS[number]

export type ShapeInfo = {
  id: ShapeId
  name: string
  /** Legacy category kept for UI compatibility (thumbnails, plan editor, exports). */
  category: 'Box' | 'Carton' | 'Bag' | 'Canister'
  description: string
  dimensions: { length: number; width: number; height: number }
  /** Whether `openTop` / open-close applies. */
  lid: boolean
  /** Whether the shape is round and length/width are both the diameter. */
  round?: boolean
  params?: (keyof ShapeParams)[]
}

export const SHAPES: ShapeInfo[] = [
  { id: 'rigid-box', name: 'Rigid lid & base box', category: 'Box', description: 'Two-piece telescoping gift box with lift-off lid and insert.', dimensions: { length: 200, width: 200, height: 80 }, lid: true },
  { id: 'carton', name: 'Folding carton (tuck end)', category: 'Carton', description: 'Straight tuck-end retail carton with hinged top flap. openTop makes an open shopping box.', dimensions: { length: 60, width: 45, height: 150 }, lid: true },
  { id: 'mailer', name: 'Mailer box (roll-end tuck front)', category: 'Box', description: 'E-commerce mailer with hinged lid that folds over the front.', dimensions: { length: 300, width: 220, height: 100 }, lid: true },
  { id: 'drawer', name: 'Slide drawer / matchbox', category: 'Box', description: 'Outer sleeve with sliding inner tray and pull loop.', dimensions: { length: 180, width: 120, height: 50 }, lid: true },
  { id: 'window', name: 'Window display box', category: 'Box', description: 'Tray with lid that has a clear film window.', dimensions: { length: 220, width: 160, height: 65 }, lid: true },
  { id: 'divider', name: 'Compartment box', category: 'Box', description: 'Lidded box with four internal compartments.', dimensions: { length: 240, width: 180, height: 65 }, lid: true },
  { id: 'hexagon', name: 'Hexagon box', category: 'Box', description: 'Six-sided rigid box with lift-off lid.', dimensions: { length: 180, width: 180, height: 85 }, lid: true },
  { id: 'octagon', name: 'Octagon box', category: 'Box', description: 'Eight-sided rigid box with lift-off lid.', dimensions: { length: 180, width: 180, height: 90 }, lid: true },
  { id: 'prism', name: 'Polygon prism box', category: 'Box', description: 'Any regular polygon box (3–12 sides, shapeParams.sides) with optional taper and lid.', dimensions: { length: 160, width: 160, height: 120 }, lid: true, params: ['sides', 'taper'] },
  { id: 'pyramid', name: 'Pyramid box', category: 'Box', description: 'Square-based pyramid whose four triangular panels fold open like petals.', dimensions: { length: 120, width: 120, height: 120 }, lid: true },
  { id: 'pillow', name: 'Pillow box', category: 'Carton', description: 'Curved pillow-pack carton. width is the bulge thickness.', dimensions: { length: 160, width: 45, height: 110 }, lid: false },
  { id: 'gable', name: 'Gable box', category: 'Carton', description: 'Carton with a peaked gable top and carry-handle cut-out.', dimensions: { length: 150, width: 90, height: 160 }, lid: true },
  { id: 'tray', name: 'Open tray', category: 'Box', description: 'Open-top tray with angled walls, e.g. food or display tray.', dimensions: { length: 240, width: 160, height: 50 }, lid: false, params: ['taper'] },
  { id: 'sleeve', name: 'Tray with sleeve', category: 'Box', description: 'Printed wrap-around sleeve over a sliding tray.', dimensions: { length: 200, width: 140, height: 50 }, lid: true },
  { id: 'display', name: 'Counter display box', category: 'Box', description: 'Open-front shelf-ready display with raised printed header card.', dimensions: { length: 260, width: 180, height: 120 }, lid: false },
  { id: 'bag', name: 'Shopping bag', category: 'Bag', description: 'Gusseted paper bag with turnover and optional rope handles.', dimensions: { length: 250, width: 120, height: 330 }, lid: false },
  { id: 'pouch', name: 'Stand-up pouch', category: 'Bag', description: 'Flexible doypack pouch with bottom gusset and top seal/tear notch. width is gusset depth.', dimensions: { length: 140, width: 60, height: 200 }, lid: false },
  { id: 'sachet', name: 'Flat sachet', category: 'Bag', description: 'Pillow sachet with crimped top and bottom seals. width is filled thickness.', dimensions: { length: 100, width: 12, height: 140 }, lid: false },
  { id: 'canister', name: 'Canister', category: 'Canister', description: 'Paper tube canister with friction lid.', dimensions: { length: 90, width: 90, height: 140 }, lid: true, round: true },
  { id: 'tube', name: 'Tube with lids', category: 'Canister', description: 'Long paper tube with telescoping top cap and bottom end cap (posters, wine, tea).', dimensions: { length: 80, width: 80, height: 300 }, lid: true, round: true, params: ['capHeight'] },
  { id: 'bottle', name: 'Bottle', category: 'Canister', description: 'Bottle with shoulder, neck and screw cap; wrap-around label. Use material clear/glass/plastic.', dimensions: { length: 70, width: 70, height: 220 }, lid: true, round: true, params: ['neckRatio', 'shoulder', 'capHeight'] },
  { id: 'jar', name: 'Jar', category: 'Canister', description: 'Wide-mouth jar with screw lid; wrap label.', dimensions: { length: 90, width: 90, height: 100 }, lid: true, round: true, params: ['capHeight'] },
  { id: 'lathe', name: 'Custom revolved shape', category: 'Canister', description: 'Arbitrary round object from shapeParams.profile: [radius 0–1, height 0–1] points bottom→top, revolved around the vertical axis (vases, cups, bottles, cosmetics).', dimensions: { length: 100, width: 100, height: 160 }, lid: false, round: true, params: ['profile'] },
  { id: 'extrude', name: 'Custom extruded shape', category: 'Box', description: 'Arbitrary footprint from shapeParams.footprint: [x, z] points in -1..1 (heart, star, shield, arch…) extruded to height, with optional lid and taper.', dimensions: { length: 160, width: 160, height: 80 }, lid: true, params: ['footprint', 'taper'] },
]

export const shapeInfo = (id: ShapeId) => SHAPES.find(shape => shape.id === id)!
const LEGACY_BOX = new Set<ShapeId>(['hexagon', 'drawer', 'window', 'divider'])

export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === 'string' && (SHAPE_IDS as readonly string[]).includes(value)
}

/** The single source of truth for which geometry a design renders and unfolds as. */
export function resolveShape(design: Pick<Design, 'category' | 'structure'>): ShapeId {
  const structure = design.structure
  if (isShapeId(structure) && !LEGACY_BOX.has(structure)) return structure
  if (design.category === 'Box' && structure && LEGACY_BOX.has(structure as ShapeId)) return structure as ShapeId
  if (design.category === 'Bag') return 'bag'
  if (design.category === 'Canister') return 'canister'
  if (design.category === 'Carton') return 'carton'
  return 'rigid-box'
}

/** Patch that switches a design to a shape, keeping category consistent for legacy UI. */
export function shapePatch(id: ShapeId) {
  const info = shapeInfo(id)
  return { category: info.category, structure: id === 'rigid-box' || id === 'carton' || id === 'bag' || id === 'canister' ? 'standard' as const : id }
}

export const DEFAULT_PROFILE: [number, number][] = [[0, 0], [.92, 0], [1, .04], [1, .55], [.78, .78], [.42, .9], [.4, 1]]
export const DEFAULT_FOOTPRINT: [number, number][] = Array.from({ length: 40 }, (_, i): [number, number] => {
  // A heart: a recognisable non-convex default for the custom extrude path.
  const t = (i / 40) * Math.PI * 2
  const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
  return [x / 17, -y / 17]
})

export function getShapeParams(design: Pick<Design, 'shapeParams' | 'structure' | 'category'>): Required<Omit<ShapeParams, 'profile' | 'footprint'>> & Pick<ShapeParams, 'profile' | 'footprint'> {
  const p = design.shapeParams || {}
  const shape = resolveShape(design)
  return {
    sides: Math.round(p.sides ?? (shape === 'octagon' ? 8 : shape === 'hexagon' ? 6 : 6)),
    taper: p.taper ?? (shape === 'tray' ? .9 : 1),
    neckRatio: p.neckRatio ?? .36,
    shoulder: p.shoulder ?? .22,
    capHeight: p.capHeight ?? 0,
    profile: p.profile,
    footprint: p.footprint,
  }
}

const finitePair = (value: unknown, min: number, max: number, label: string): [number, number] => {
  if (!Array.isArray(value) || value.length !== 2 || value.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)) throw new Error(`${label} points must be [number, number] pairs from ${min} to ${max}.`)
  return [value[0], value[1]]
}

export function validateShapeParams(value: unknown): ShapeParams {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('shapeParams must be an object.')
  const input = value as Record<string, unknown>, output: ShapeParams = {}
  const num = (key: string, min: number, max: number) => {
    const v = input[key]
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`shapeParams.${key} must be a number from ${min} to ${max}.`)
    return v
  }
  for (const key of Object.keys(input)) {
    if (key === 'sides') output.sides = Math.round(num(key, 3, 12))
    else if (key === 'taper') output.taper = num(key, .2, 1.5)
    else if (key === 'neckRatio') output.neckRatio = num(key, .1, 1)
    else if (key === 'shoulder') output.shoulder = num(key, 0, .6)
    else if (key === 'capHeight') output.capHeight = num(key, 0, 200)
    else if (key === 'profile') {
      if (!Array.isArray(input.profile) || input.profile.length < 2 || input.profile.length > 64) throw new Error('shapeParams.profile needs 2–64 [radius, height] points.')
      output.profile = input.profile.map(point => finitePair(point, 0, 1, 'profile'))
      for (let i = 1; i < output.profile.length; i++) if (output.profile[i][1] < output.profile[i - 1][1]) throw new Error('shapeParams.profile heights must go from bottom (0) to top (1) without decreasing.')
    } else if (key === 'footprint') {
      if (!Array.isArray(input.footprint) || input.footprint.length < 3 || input.footprint.length > 64) throw new Error('shapeParams.footprint needs 3–64 [x, z] points.')
      output.footprint = input.footprint.map(point => finitePair(point, -1, 1, 'footprint'))
    } else throw new Error(`Unsupported shapeParams field: ${key}.`)
  }
  return output
}

/** Normalised footprint polygon (x right, z toward the viewer), scaled later to L × W. */
export function shapeFootprint(design: Design): [number, number][] {
  const shape = resolveShape(design), p = getShapeParams(design)
  if (shape === 'extrude') return p.footprint && p.footprint.length >= 3 ? p.footprint : DEFAULT_FOOTPRINT
  const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : p.sides
  // A flat face points to the front (+z) so the label sits on a real panel.
  return Array.from({ length: sides }, (_, i): [number, number] => {
    const a = Math.PI / 2 + Math.PI / sides + (i * 2 * Math.PI) / sides
    return [Math.cos(a), Math.sin(a)]
  })
}

export function shapeProfile(design: Design): [number, number][] {
  const p = getShapeParams(design)
  return p.profile && p.profile.length >= 2 ? p.profile : DEFAULT_PROFILE
}

export type RoundLayout = { R: number; capH: number; neckR: number; neckH: number; shoulderH: number; bodyTop: number; endH: number; band: [number, number]; labelR: number }
/** Millimetre layout of round containers, shared by the 3D builder and the dieline/label sheet. */
export function roundLayout(design: Design): RoundLayout {
  const shape = resolveShape(design), p = getShapeParams(design)
  const { length: L, width: W, height: H } = design.dimensions
  const R = Math.min(L, W) / 2, scale = 3.6 / Math.max(L, W, H)
  const out: RoundLayout = { R, capH: 0, neckR: R, neckH: 0, shoulderH: 0, bodyTop: H, endH: 0, band: [H * .2, H * .84], labelR: R }
  if (shape === 'canister') {
    out.capH = Math.max(.07 / scale, Math.min(H * .14, .28 / scale))
    out.band = [H * .14, H - (design.openTop ? 0 : out.capH) - H * .04]
  } else if (shape === 'tube') {
    out.capH = p.capHeight || H * .2
    out.endH = Math.min(H * .06, out.capH * .5)
    out.band = [out.endH + H * .05, H - (design.openTop ? 0 : out.capH) - H * .03]
  } else if (shape === 'bottle' || shape === 'jar') {
    const jar = shape === 'jar'
    out.capH = p.capHeight || (jar ? H * .2 : H * .13)
    out.neckR = jar ? R * .84 : R * p.neckRatio
    out.neckH = jar ? H * .06 : H * .12
    out.shoulderH = jar ? H * .06 : H * p.shoulder
    out.bodyTop = Math.max(H * .2, H - out.capH * .8 - out.neckH - out.shoulderH)
    out.band = jar ? [H * .12, out.bodyTop - H * .04] : [out.bodyTop * .16, out.bodyTop * .9]
  } else if (shape === 'lathe') {
    const profile = shapeProfile(design)
    let best: [number, number, number] | undefined
    for (let i = 0; i < profile.length - 1; i++) {
      let j = i
      const r0 = profile[i][0]
      while (j + 1 < profile.length && Math.abs(profile[j + 1][0] - r0) < .06) j++
      const span = profile[j][1] - profile[i][1]
      if (span > .12 && r0 > .3 && (!best || span * r0 > (best[1] - best[0]) * best[2])) best = [profile[i][1], profile[j][1], Math.max(...profile.slice(i, j + 1).map(v => v[0]))]
    }
    if (best) { out.band = [best[0] * H + H * .03, best[1] * H - H * .03]; out.labelR = best[2] * R } else out.band = [0, 0]
  }
  return out
}
/** Physical width of the curved front print on round containers (mm), matching the 3D wrap arc. */
export const ROUND_LABEL_ARC = 1.75
