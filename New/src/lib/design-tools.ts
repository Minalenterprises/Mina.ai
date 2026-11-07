import { FONTS, fontExists, loadFont } from './fonts'
import { contrastRatio, getTypography, printedText, textColor } from './typography'
import { TEXTURES, getSurface } from './textures'
import { getProductInfo } from './product-info'
import { validateSurface, validateProductInfo } from './surface-validation'
import { getArtwork, PRINT_STARTERS, validateArtwork } from './print-artwork'
import { templates, type Design, type MaterialPreset, type ModelPart, type PreviewSettings, type Structure, type Typography } from './types'
import { isShapeId, resolveShape, shapeInfo, shapePatch, SHAPE_IDS, SHAPES, validateShapeParams, type ShapeId } from './shapes'
import { MATERIAL_PRESETS, resolveMaterialPreset } from './materials-catalog'

export const DESIGN_FIELDS = ['name', 'brief', 'category', 'structure', 'shapeParams', 'materialPreset', 'color', 'innerColor', 'accentColor', 'wallThickness', 'cornerRadius', 'material', 'finish', 'dimensions', 'quantity', 'notes', 'openTop', 'hasHandles', 'typography', 'modelParts', 'surface', 'productInfo', 'artwork'] as const
export type DesignPatch = Omit<Partial<Pick<Design, typeof DESIGN_FIELDS[number]>>, 'dimensions'> & { dimensions?: Partial<Design['dimensions']> }
const STRUCTURES: Structure[] = ['standard', 'hexagon', 'drawer', 'window', 'divider', ...SHAPE_IDS.filter(id => !['hexagon', 'drawer', 'window', 'divider'].includes(id))] as Structure[]
const PRESET_IDS = ['auto', ...MATERIAL_PRESETS.map(p => p.id)] as MaterialPreset[]
const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`)
  return value as Record<string, unknown>
}
const number = (value: unknown, min: number, max: number, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be a number from ${min} to ${max}.`)
  return value
}
const hex = (value: unknown, label: string) => {
  if (typeof value !== 'string' || !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value)) throw new Error(`${label} must be a 3- or 6-digit hex color.`)
  return value.length === 4 ? `#${value.slice(1).split('').map(c => c + c).join('')}` : value.toLowerCase()
}
const text = (value: unknown, max: number, label: string) => {
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label} must be text up to ${max} characters.`)
  return value
}
const enumValue = <T extends string>(value: unknown, options: readonly T[], label: string): T => {
  if (typeof value !== 'string' || !options.includes(value as T)) throw new Error(`${label} must be one of: ${options.join(', ')}.`)
  return value as T
}
export function validateTypography(value: unknown): Partial<Typography> {
  const input = record(value, 'Typography'), output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (['text', 'subtitle'].includes(key)) output[key] = text(value, key === 'text' ? 240 : 160, key)
    else if (key === 'fontFamily') {
      if (typeof value !== 'string' || !fontExists(value)) throw new Error('Choose an installed font using list_fonts.')
      output[key] = value
    } else if (key === 'fontWeight') {
      if (value !== 400 && value !== 700) throw new Error('fontWeight must be 400 or 700.')
      output[key] = value
    } else if (key === 'size') output[key] = number(value, 5, 60, key)
    else if (key === 'lineHeight') output[key] = number(value, 1, 2, key)
    else if (key === 'blockScale') output[key] = number(value, .25, 1, key)
    else if (key === 'background') output[key] = value === 'none' ? 'none' : hex(value, key)
    else if (key === 'letterSpacing') output[key] = number(value, -.02, .2, key)
    else if (key === 'color') output[key] = value === 'auto' ? 'auto' : hex(value, key)
    else if (key === 'align') output[key] = enumValue(value, ['left', 'center', 'right'], key)
    else if (key === 'placement') output[key] = enumValue(value, ['front', 'lid', 'both'], key)
    else if (key === 'transform') output[key] = enumValue(value, ['original', 'uppercase', 'lowercase'], key)
    else if (key === 'visible' && typeof value === 'boolean') output[key] = value
    else throw new Error(`Unsupported typography field: ${key}.`)
  }
  if (!Object.keys(output).length) throw new Error('Supply at least one typography change.')
  return output as Partial<Typography>
}
function vector(value: unknown, min: number, max: number, label: string) {
  const input = record(value, label)
  return { x: number(input.x, min, max, `${label}.x`), y: number(input.y, min, max, `${label}.y`), z: number(input.z, min, max, `${label}.z`) }
}
export function validateModelParts(value: unknown): ModelPart[] {
  if (!Array.isArray(value) || value.length > 24) throw new Error('Model parts must be an array with at most 24 elements.')
  return value.map(item => {
    const part = record(item, 'Model part')
    return { name: text(part.name, 60, 'Part name'), shape: enumValue(part.shape, ['box', 'cylinder', 'sphere'], 'shape'), size: vector(part.size, 1, 600, 'size'), position: vector(part.position, -1200, 1200, 'position'), ...(part.rotation ? { rotation: vector(part.rotation, -360, 360, 'rotation') } : {}), color: hex(part.color, 'Part color'), material: enumValue(part.material, ['paper', 'metal', 'glass'], 'Part material') }
  })
}
export function validateDesignPatch(value: unknown): DesignPatch {
  const raw = record(value, 'Design update'), output: Record<string, unknown> = {}
  const input: Record<string, unknown> = { ...raw }
  if (input.shape !== undefined) {
    // `shape` is the friendly name for the physical structure; it also keeps category consistent.
    if (!isShapeId(input.shape)) throw new Error(`shape must be one of: ${SHAPE_IDS.join(', ')}.`)
    Object.assign(output, shapePatch(input.shape))
    delete input.shape
  }
  for (const [key, value] of Object.entries(input)) {
    if (!DESIGN_FIELDS.includes(key as typeof DESIGN_FIELDS[number])) throw new Error(`Unsupported design field: ${key}.`)
    if (['name', 'brief', 'notes', 'material'].includes(key)) {
      output[key] = text(value, key === 'name' ? 80 : key === 'material' ? 100 : 2000, key)
      if (key === 'name' && !(value as string).trim()) throw new Error('Name cannot be empty.')
    } else if (['color', 'innerColor', 'accentColor'].includes(key)) output[key] = hex(value, key)
    else if (key === 'category') output[key] = enumValue(value, ['Box', 'Canister', 'Carton', 'Bag'], key)
    else if (key === 'structure') output[key] = enumValue(value, STRUCTURES, key)
    else if (key === 'shapeParams') output[key] = validateShapeParams(value)
    else if (key === 'materialPreset') output[key] = enumValue(value, PRESET_IDS, key)
    else if (key === 'finish') output[key] = enumValue(value, ['Matte', 'Soft-touch', 'Gloss'], key)
    else if (key === 'quantity') output[key] = Math.round(number(value, 1, 100000, key))
    else if (key === 'wallThickness') output[key] = number(value, .5, 6, key)
    else if (key === 'cornerRadius') output[key] = number(value, 0, 20, key)
    else if (key === 'typography') output[key] = validateTypography(value)
    else if (key === 'surface') output[key] = validateSurface(value)
    else if (key === 'artwork') output[key] = validateArtwork(value)
    else if (key === 'productInfo') output[key] = validateProductInfo(value)
    else if (key === 'modelParts') output[key] = validateModelParts(value)
    else if (key === 'dimensions') {
      const dimensions = record(value, 'Dimensions')
      if (!Object.keys(dimensions).length) throw new Error('Supply a dimension.')
      for (const [axis, dimension] of Object.entries(dimensions)) {
        if (!['length', 'width', 'height'].includes(axis)) throw new Error(`Unknown dimension: ${axis}`)
        number(dimension, 5, 600, axis)
      }
      output[key] = dimensions
    } else if (['openTop', 'hasHandles'].includes(key) && typeof value === 'boolean') output[key] = value
    else throw new Error(`Invalid value for ${key}.`)
  }
  if (!Object.keys(output).length) throw new Error('Supply at least one design change.')
  // A structure from the new shape catalogue implies its category, so the UI and exports stay consistent.
  if (typeof output.structure === 'string' && isShapeId(output.structure) && output.category === undefined) output.category = shapeInfo(output.structure).category
  return output as DesignPatch
}
export function mergeDesign(design: Design, patch: DesignPatch): Design {
  const structureChanged = patch.structure !== undefined && patch.structure !== design.structure
  const shapeParams = patch.shapeParams ? { ...(structureChanged ? {} : design.shapeParams), ...patch.shapeParams } : structureChanged ? undefined : design.shapeParams
  return { ...design, ...patch, shapeParams, dimensions: { ...design.dimensions, ...patch.dimensions }, typography: { ...design.typography, ...patch.typography }, surface: { ...design.surface, ...patch.surface }, productInfo: { ...design.productInfo, ...patch.productInfo }, artwork: { ...design.artwork, ...patch.artwork }, ...(patch.structure || patch.category ? { customCode: undefined } : {}), updatedAt: new Date().toISOString() }
}
export function designState(design: Design) {
  const a = getArtwork(design)
  return { ...Object.fromEntries(DESIGN_FIELDS.map(key => [key, design[key]])), shape: resolveShape(design), resolvedMaterial: resolveMaterialPreset(design), artwork: { ...a, image: undefined, hasImage: !!a.image }, typography: getTypography(design), surface: getSurface(design), productInfo: getProductInfo(design), hasLogo: !!design.logo, hasReference: !!design.reference, palette: design.palette || [] }
}
export function previewKey(design: Design) {
  return JSON.stringify({ ...designState(design), artworkImage: design.artwork?.image, logo: design.logo, customCode: design.customCode })
}
export function reviewDesign(design: Design) {
  const typography = getTypography(design)
  const a = getArtwork(design)
  const bg = typography.background !== 'none' ? typography.background : a.enabled && a.background !== 'auto' ? a.background : design.color
  const ratio = contrastRatio(bg, textColor(design))
  const warnings = []
  if (a.enabled && a.layers.length && typography.visible && typography.background === 'none') warnings.push('Check printed copy against the motifs; a solid brand plaque can improve readability.')
  if (a.enabled && a.layers.some(l => l.shape === 'logo') && !design.logo) warnings.push('Logo motifs have no uploaded company logo.')
  if (typography.visible && ratio < 3) warnings.push('Printed text has low contrast against the packaging color.')
  if (printedText(design).length > 120) warnings.push('Long printed copy may need a smaller type size or a larger printed face.')
  const shape = resolveShape(design), info = shapeInfo(shape)
  if (design.category !== 'Box' && ['hexagon', 'drawer', 'window', 'divider'].includes(design.structure || '')) warnings.push('Legacy box structures (hexagon, drawer, window, divider) render only with category Box; use update_design shape to switch.')
  if (info.round && design.dimensions.length !== design.dimensions.width) warnings.push(`The ${info.name.toLowerCase()} is round; length and width should both equal the diameter.`)
  const preset = resolveMaterialPreset(design)
  if ((preset === 'glass' || preset === 'clear') && ['bottle', 'jar'].includes(shape) && getTypography(design).color === 'auto') warnings.push('Transparent containers print on a paper label (innerColor). Check the label text colour against that paper.')
  if (shape === 'extrude' && !design.shapeParams?.footprint) warnings.push('Custom extrude is using the default heart footprint; set shapeParams.footprint for another outline.')
  if (shape === 'lathe' && !design.shapeParams?.profile) warnings.push('Custom revolved shape is using the default profile; set shapeParams.profile for another silhouette.')
  return { shape, contrastRatio: +ratio.toFixed(2), font: typography.fontFamily, printedText: printedText(design), warnings, productionStatus: 'Concept preview; manufacturing tolerances and print output need manufacturer review.' }
}

const string = (description?: string) => ({ type: 'STRING', ...(description ? { description } : {}) })
const numeric = (description?: string) => ({ type: 'NUMBER', ...(description ? { description } : {}) })
const choice = (values: string[]) => ({ type: 'STRING', enum: values })
const object = (properties: Record<string, unknown>, required?: string[]) => ({ type: 'OBJECT', properties, ...(required ? { required } : {}) })
const vectorSchema = object({ x: numeric(), y: numeric(), z: numeric() }, ['x', 'y', 'z'])
const pairList = (description: string) => ({ type: 'ARRAY', description, items: { type: 'ARRAY', items: { type: 'NUMBER' } } })
const shapeParamsSchema = object({
  sides: { type: 'INTEGER', description: 'prism: 3–12 sides' },
  taper: numeric('prism/extrude/tray: top scale vs base, 0.2–1.5 (1 = straight walls, <1 narrows, >1 flares)'),
  neckRatio: numeric('bottle: neck diameter / body diameter, 0.1–1'),
  shoulder: numeric('bottle: shoulder height fraction 0–0.6'),
  capHeight: numeric('tube/bottle/jar: cap height mm 0–200; 0 = automatic'),
  profile: pairList('lathe: 2–64 [radius 0–1, height 0–1] points from bottom (0) to top (1); radius is a fraction of the diameter/2. Example vase: [[0,0],[0.7,0],[1,0.3],[0.55,0.75],[0.65,1]]'),
  footprint: pairList('extrude: 3–64 [x, z] outline points in -1..1, z positive = front. Example star, arch, shield, heart, rounded hexagon.'),
})
const shapeChoice = { type: 'STRING', enum: [...SHAPE_IDS], description: 'Physical packaging shape. Call list_shapes for descriptions.' }
const typographySchema = object({ background: string('Hex or none: solid brand plaque behind text and uploaded logo'), blockScale: numeric('0.25-1: centered branding area scale'), text: string('Exact printed copy, preserves line breaks. Empty string follows product name.'), subtitle: string('Optional subtitle. Empty removes it.'), fontFamily: string('Exact installed family from list_fonts.'), fontWeight: { type: 'INTEGER', description: '400 or 700' }, size: numeric('5–60 percent of the shorter print area side; text auto-fits.'), lineHeight: numeric('1–2'), letterSpacing: numeric('-0.02 to 0.2 em'), align: choice(['left', 'center', 'right']), color: string('Hex or auto'), placement: choice(['front', 'lid', 'both']), transform: choice(['original', 'uppercase', 'lowercase']), visible: { type: 'BOOLEAN' } })
const partSchema = object({ name: string(), shape: choice(['box', 'cylinder', 'sphere']), size: vectorSchema, position: vectorSchema, rotation: vectorSchema, color: string(), material: choice(['paper', 'metal', 'glass']) }, ['name', 'shape', 'size', 'position', 'color', 'material'])
const artworkSchema = object({ enabled: { type: 'BOOLEAN' }, name: string(), background: string('Six-digit hex or auto'), tileSize: numeric('10–600 mm; square repeat size'), rotation: numeric('-180–180 degrees'), layers: { type: 'ARRAY', description: 'Replace all motif layers, maximum 80. Positions and sizes in tile percent. Paths centered in -50 to 50 coordinates. Omitted layer fields use defaults.', items: object({ name: string(), shape: choice(['ellipse', 'rect', 'leaf', 'petal', 'path', 'logo', 'image']), x: numeric('-100–200'), y: numeric('-100–200'), width: numeric('0.1–200'), height: numeric('0.1–200'), rotation: numeric('-360–360'), fill: string('Six-digit hex or none'), stroke: string('Six-digit hex or none'), strokeWidth: numeric('0–20 tile percent'), opacity: numeric('0–1'), path: string('Safe SVG path commands only, max 4000 characters; arbitrary custom motifs.') }, ['shape']) } })
export const DESIGN_TOOL_DECLARATIONS = [
  { name: 'list_print_designs', description: 'Explore editable floral, botanical, geometric, art deco, terrazzo and logo repeat starting points. Invent original motifs with update_artwork; these are optional starters.', parameters: object({ query: string() }) },
  { name: 'apply_print_design', description: 'Apply an editable printed design by starter ID. Company logo repeat requires an uploaded logo.', parameters: object({ id: string() }, ['id']) },
  { name: 'update_artwork', description: 'Create original printed patterns with editable motif layers, custom vector paths, exact uploaded logos, or generated images. Preserve omitted settings. This is printed graphic artwork, separate from material texture. Read existing layers before changing them.', parameters: artworkSchema },
  { name: 'generate_artwork_image', description: 'Generate an actual original raster illustration or seamless texture using Google image AI. Can edit existing image or use uploaded reference. Applies returned image under existing motifs/logo layers. Requires image model access/quota. Exact logos and text should remain separate editable layers.', parameters: object({ prompt: string('Detailed visual instruction, max 4000 characters'), seamless: { type: 'BOOLEAN' }, editCurrent: { type: 'BOOLEAN' }, useReference: { type: 'BOOLEAN' } }, ['prompt']) },
  { name: 'read_design', description: 'Read the actual current packaging specification and typography.' },
  { name: 'list_fonts', description: 'Search the 72 locally installed font families before choosing typography.', parameters: object({ query: string(), category: string() }) },
  { name: 'list_templates', description: 'List ready-made packaging templates (shape, dimensions, colours, material). Good starting points.', parameters: object({ query: string() }) },
  { name: 'list_shapes', description: 'List every physical shape the 3D engine can build (boxes, cartons, mailers, pillow, pyramid, gable, polygon prisms, tubes, bottles, jars, pouches, sachets, trays, sleeves, displays, custom revolved and custom extruded shapes) with default dimensions and parameters.', parameters: object({ query: string() }) },
  { name: 'set_shape', description: 'Switch the packaging to a physical shape. By default also applies that shape’s typical dimensions; pass keepDimensions true to keep the current size, or pass dimensions. For anything not in the catalogue use shape lathe (round, profile) or extrude (any outline, footprint).', parameters: object({ shape: shapeChoice, keepDimensions: { type: 'BOOLEAN' }, dimensions: object({ length: numeric('5–600 mm'), width: numeric('5–600 mm'), height: numeric('5–600 mm') }), shapeParams: shapeParamsSchema, openTop: { type: 'BOOLEAN' } }, ['shape']) },
  { name: 'update_design', description: 'Apply requested packaging changes. Omitted fields are preserved. Validation errors are returned for correction. Prefer shape (or set_shape) over category/structure.', parameters: object({ name: string(), brief: string(), notes: string(), shape: shapeChoice, shapeParams: shapeParamsSchema, materialPreset: { type: 'STRING', enum: [...PRESET_IDS], description: 'Physically based surface: paper, kraft, matte, soft-touch, gloss, foil (metallic), metal, clear (film/PET), glass, plastic; auto infers from material text.' }, category: choice(['Box', 'Canister', 'Carton', 'Bag']), structure: { type: 'STRING', enum: STRUCTURES as string[] }, color: string('Hex color'), innerColor: string('Hex interior / lining colour; also the paper label colour on glass or clear bottles and jars'), accentColor: string('Hex handle/accent color'), wallThickness: numeric('0.5–6 mm'), cornerRadius: numeric('0–20 mm'), material: string(), finish: choice(['Matte', 'Soft-touch', 'Gloss']), quantity: { type: 'INTEGER' }, dimensions: object({ length: numeric('5–600 mm'), width: numeric('5–600 mm'), height: numeric('5–600 mm') }), openTop: { type: 'BOOLEAN' }, hasHandles: { type: 'BOOLEAN' } }) },
  { name: 'update_typography', description: 'Set actual printed copy, font, color, alignment, spacing, size, case, and printed faces.', parameters: typographySchema },
  { name: 'apply_template', description: 'Apply a template by its exact ID. Preserve branding and typography; use update_design for further changes.', parameters: object({ id: string() }, ['id']) },
  { name: 'set_model_parts', description: 'Replace optional model accessories with up to 24 safe primitives: inserts, dividers, ribbons, display objects. All sizes/positions are mm; origin is the base center; y points upward. Rotation is degrees. These add geometry; they do not cut holes in the base model.', parameters: object({ parts: { type: 'ARRAY', items: partSchema } }, ['parts']) },
  { name: 'list_textures', description: 'Explore 28 real procedural material texture tiles.', parameters: object({ query: string() }) },
  { name: 'update_surface', description: 'Apply a texture from list_textures, preserving omitted surface settings.', parameters: object({ texture: string(), scale: numeric('0.25–4; larger makes larger pattern tiles'), strength: numeric('0–1'), rotation: numeric('-180–180 degrees') }) },
  { name: 'update_product_info', description: 'Print underside or back information. Never invent ingredients, certifications, barcode numbers or claims.', parameters: object({ visible: { type: 'BOOLEAN' }, placement: choice(['bottom', 'back']), showSpecs: { type: 'BOOLEAN' }, description: string(), contents: string(), care: string(), warnings: string(), origin: string(), website: string(), sku: string(), barcode: string('Valid EAN-13 including checksum, or empty to remove.') }) },
  { name: 'set_preview', description: 'Show a useful view of the real model and open/close the lid or drawer.', parameters: object({ camera: choice(['perspective', 'front', 'back', 'top', 'bottom']), openBox: { type: 'BOOLEAN' }, autoRotate: { type: 'BOOLEAN' } }) },
  { name: 'review_design', description: 'Review text contrast and structure consistency before confirming changes.' },
  { name: 'inspect_preview', description: 'Inspect a screenshot of the rendered 3D model after applying changes. Use this to check lettering and placement.' }
]

export async function executeDesignTool(name: string, args: unknown, design: Design, preview: PreviewSettings) {
  const input = record(args, 'Tool arguments')
  let patch: DesignPatch | undefined
  let nextPreview = preview
  if (name === 'read_design') return { design, preview, result: designState(design), summary: 'Read current design', fields: [] }
  if (name === 'list_fonts') return { design, preview, result: FONTS.filter(font => (!input.query || font.family.toLowerCase().includes(String(input.query).toLowerCase())) && (!input.category || font.category.toLowerCase() === String(input.category).toLowerCase())), summary: 'Explored installed fonts', fields: [] }
  if (name === 'list_templates') return { design, preview, result: templates.filter(template => !input.query || `${template.name} ${template.description}`.toLowerCase().includes(String(input.query).toLowerCase())).map(({ id, name, dimensions, category, structure, description }) => ({ id, name, dimensions, category, structure: structure || 'standard', description })), summary: 'Explored packaging templates', fields: [] }
  if (name === 'list_shapes') return { design, preview, result: SHAPES.filter(shape => !input.query || `${shape.id} ${shape.name} ${shape.description}`.toLowerCase().includes(String(input.query).toLowerCase())).map(({ id, name, description, dimensions, lid, round, params }) => ({ id, name, description, defaultDimensions: dimensions, hasLid: lid, round: !!round, params: params || [] })), summary: 'Explored packaging shapes', fields: [] }
  if (name === 'list_textures') return { design, preview, result: TEXTURES.filter(texture => !input.query || `${texture.name} ${texture.category}`.toLowerCase().includes(String(input.query).toLowerCase())), summary: 'Explored material textures', fields: [] }
  if (name === 'list_print_designs') return { design, preview, result: PRINT_STARTERS.filter(p => !input.query || p.name.toLowerCase().includes(String(input.query).toLowerCase())), summary: 'Explored editable print designs', fields: [] }
  if (name === 'apply_print_design') {
    const starter = PRINT_STARTERS.find(p => p.id === input.id)
    if (!starter) throw new Error('Unknown print design. Call list_print_designs first.')
    patch = { artwork: { ...starter.artwork, layers: starter.artwork.layers.map(l => ({ ...l })) } }
  }
  else if (name === 'update_artwork') patch = { artwork: validateArtwork(input) }
  else if (name === 'update_surface') patch = { surface: validateSurface(input) }
  else if (name === 'update_product_info') patch = { productInfo: validateProductInfo(input) }
  else if (name === 'update_design') patch = validateDesignPatch(input)
  else if (name === 'set_shape') {
    if (!isShapeId(input.shape)) throw new Error(`shape must be one of: ${SHAPE_IDS.join(', ')}.`)
    for (const key of Object.keys(input)) if (!['shape', 'keepDimensions', 'dimensions', 'shapeParams', 'openTop'].includes(key)) throw new Error(`Unsupported set_shape field: ${key}.`)
    const shape = input.shape as ShapeId
    const request: Record<string, unknown> = { shape }
    if (input.dimensions !== undefined) request.dimensions = input.dimensions
    else if (input.keepDimensions !== true) request.dimensions = { ...shapeInfo(shape).dimensions }
    if (input.shapeParams !== undefined) request.shapeParams = input.shapeParams
    if (input.openTop !== undefined) request.openTop = input.openTop
    patch = validateDesignPatch(request)
    patch.shapeParams = patch.shapeParams || {}
    if (input.openTop === undefined && !shapeInfo(shape).lid) patch.openTop = false
  }
  else if (name === 'update_typography') patch = { typography: validateTypography(input) }
  else if (name === 'set_model_parts') patch = { modelParts: validateModelParts(input.parts) }
  else if (name === 'apply_template') {
    const template = templates.find(template => template.id === input.id)
    if (!template) throw new Error('Unknown template ID. Call list_templates first.')
    patch = { category: template.category, structure: template.structure || 'standard', shapeParams: template.shapeParams || {}, materialPreset: template.materialPreset || 'auto', dimensions: { ...template.dimensions }, material: template.material, finish: template.finish, color: template.color, innerColor: template.innerColor, accentColor: template.accentColor, openTop: template.openTop ?? false, hasHandles: template.hasHandles ?? false, notes: template.notes, modelParts: template.modelParts || [], ...(!design.typography ? { typography: template.typography } : {}) }
  } else if (name === 'set_preview') {
    const camera = input.camera === undefined ? preview.camera : enumValue(input.camera, ['perspective', 'front', 'back', 'top', 'bottom'], 'camera')
    for (const key of ['openBox', 'autoRotate']) if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new Error(`${key} must be a boolean.`)
    nextPreview = { camera, openBox: input.openBox === undefined ? preview.openBox : input.openBox as boolean, autoRotate: input.autoRotate === undefined ? preview.autoRotate : input.autoRotate as boolean }
  } else if (name === 'review_design') return { design, preview, result: reviewDesign(design), summary: 'Checked design contrast and structure', fields: [] }
  else throw new Error(`Unknown tool: ${name}`)
  const next = patch ? mergeDesign(design, patch) : design
  if (patch?.artwork) {
    const a = getArtwork(next)
    if (a.enabled && a.layers.some(l => l.shape === 'logo') && !next.logo) throw new Error('Upload your company logo before adding logo motifs.')
    if (a.enabled && a.layers.some(l => l.shape === 'image') && !a.image) throw new Error('Generate or upload artwork before adding image motifs.')
  }
  if (patch?.typography?.fontFamily) await loadFont(patch.typography.fontFamily)
  const fields = patch ? Object.keys(patch).flatMap(key => key === 'typography' ? Object.keys(patch.typography || {}).map(field => `typography.${field}`) : [key]) : Object.keys(input)
  return { design: next, preview: nextPreview, result: { applied: true, fields, design: designState(next), preview: nextPreview }, summary: name === 'set_shape' ? `Changed shape to ${shapeInfo(resolveShape(next)).name}` : name === 'update_surface' ? 'Applied a material texture' : name === 'update_product_info' ? 'Updated printed product information' : name === 'update_typography' ? 'Updated printed text and typography' : name === 'apply_template' ? 'Applied packaging template' : name === 'set_model_parts' ? `Added ${next.modelParts?.length || 0} model parts` : name === 'set_preview' ? 'Adjusted the preview' : 'Updated packaging design', fields }
}
