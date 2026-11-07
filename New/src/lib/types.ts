export type ToolActivity = { id: string; name: string; summary: string; status: 'complete' | 'error'; fields?: string[] }
export type Message = { id: string; role: 'assistant' | 'user'; text: string; image?: string; tools?: ToolActivity[]; error?: boolean }
export type Typography = {
  text: string
  subtitle: string
  fontFamily: string
  fontWeight: 400 | 700
  size: number
  lineHeight: number
  letterSpacing: number
  align: 'left' | 'center' | 'right'
  color: string
  placement: 'front' | 'lid' | 'both'
  transform: 'original' | 'uppercase' | 'lowercase'
  visible: boolean
  background: string
  blockScale: number
}
export type PreviewSettings = { camera: 'perspective' | 'front' | 'back' | 'top' | 'bottom'; openBox: boolean; autoRotate: boolean }
export type Surface = { texture: string; scale: number; strength: number; rotation: number }
export type PrintLayer = { name: string; shape: 'ellipse' | 'rect' | 'leaf' | 'petal' | 'path' | 'logo' | 'image'; x: number; y: number; width: number; height: number; rotation: number; fill: string; stroke: string; strokeWidth: number; opacity: number; path?: string }
export type PrintArtwork = { enabled: boolean; name: string; tileSize: number; rotation: number; background: string; layers: PrintLayer[]; image?: string; prompt?: string }
export type ProductInfo = { visible: boolean; placement: 'bottom' | 'back'; showSpecs: boolean; description: string; contents: string; care: string; warnings: string; origin: string; website: string; sku: string; barcode: string }
export type ModelPart = {
  name: string
  shape: 'box' | 'cylinder' | 'sphere'
  size: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  color: string
  material: 'paper' | 'metal' | 'glass'
}
export type ProductCategory = 'Box' | 'Canister' | 'Carton' | 'Bag' | (string & {})
export type Structure = 'standard' | 'hexagon' | 'drawer' | 'window' | 'divider'
  | 'rigid-box' | 'carton' | 'bag' | 'canister' | 'octagon' | 'prism' | 'pillow' | 'pyramid' | 'gable' | 'mailer'
  | 'tube' | 'bottle' | 'jar' | 'pouch' | 'sachet' | 'tray' | 'sleeve' | 'display' | 'lathe' | 'extrude'
  | 'snap-lock' | 'crash-lock' | 'reverse-tuck' | 'telescope' | 'book-box' | 'cake-box' | 'wine-box' | 'briefcase' | 'hat-box' | 'cone' | 'heart' | 'triangle' | 'tetra'
/** Optional parameters for parametric shapes. All optional; sensible defaults per shape. */
export type ShapeParams = {
  /** Prism sides, 3–12. */
  sides?: number
  /** Top scale relative to the base, 0.2–1.5 (prism, extrude, tray walls). */
  taper?: number
  /** Bottle neck diameter / body diameter, 0.1–1. */
  neckRatio?: number
  /** Bottle shoulder height as a fraction of total height, 0–0.6. */
  shoulder?: number
  /** Cap / lid height in mm, 0–200 (0 = automatic). */
  capHeight?: number
  /** Revolve profile: [radius 0–1, height 0–1] from bottom to top. */
  profile?: [number, number][]
  /** Extrude footprint: [x, z] points in -1..1. */
  footprint?: [number, number][]
}
/** Physically based surface preset. 'auto' infers from material + finish text. */
export type MaterialPreset = 'auto' | 'paper' | 'kraft' | 'matte' | 'gloss' | 'soft-touch' | 'foil' | 'metal' | 'clear' | 'glass' | 'plastic'
export type Design = {
  id: string
  name: string
  brief: string
  category: ProductCategory
  structure?: Structure
  shapeParams?: ShapeParams
  materialPreset?: MaterialPreset
  color: string
  innerColor?: string
  accentColor?: string
  wallThickness?: number
  cornerRadius?: number
  typography?: Partial<Typography>
  surface?: Partial<Surface>
  artwork?: Partial<PrintArtwork>
  productInfo?: Partial<ProductInfo>
  modelParts?: ModelPart[]
  material: string
  finish: string
  dimensions: { length: number; width: number; height: number }
  quantity: number
  notes: string
  reference?: string
  palette?: string[]
  logo?: string
  openTop?: boolean
  hasHandles?: boolean
  customCode?: string
  stage: 'chat' | 'plan' | 'design'
  status: 'Draft' | 'Ready' | 'Archived'
  messages: Message[]
  chatStep: number
  createdAt: string
  updatedAt: string
}
export type Order = {
  id: string
  designId: string
  designName: string
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  quantity: number
  notes: string
  status: 'Requested' | 'In review' | 'Approved' | 'In production' | 'Shipped'
  createdAt: string
}
export type SupportMessage = { id: string; role: 'user' | 'admin'; text: string; createdAt: string }
export type SupportThread = { id: string; name: string; messages: SupportMessage[]; status: 'Open' | 'Resolved' }
export type Example = { name: string; category: string; label: string; color: string; image: string; brief: string; type: Design['category'] }
export const examples: Example[] = [
  { name: 'A little better.', category: 'Everyday, thoughtfully packaged.', label: 'LIFESTYLE', color: '#b8c9ac', image: '/images/hero-packaging.webp', brief: 'A minimal sage green presentation box for a stainless steel spoon, with a fitted insert and a premium, everyday feel.', type: 'Box' },
  { name: 'Slow days', category: 'A fresh take on the daily ritual.', label: 'FOOD & BEVERAGE', color: '#c9bade', image: '/images/slow-days.webp', brief: 'A playful lavender cylindrical canister for matcha tea, with a clean label and a reusable lid.', type: 'Canister' },
  { name: 'Good stuff.', category: 'Feel-good design. Inside and out.', label: 'BEAUTY & CARE', color: '#e2a18b', image: '/images/good-stuff.webp', brief: 'A warm coral and peach skincare carton, with a soft-touch matte finish and a refined, minimal design.', type: 'Carton' },
]
export type Template = {
  id: string
  name: string
  description: string
  icon: string
  category: Design['category']
  structure?: Structure
  shapeParams?: ShapeParams
  materialPreset?: MaterialPreset
  typography?: Partial<Typography>
  modelParts?: ModelPart[]
  innerColor?: string
  accentColor?: string
  color: string
  material: string
  finish: string
  dimensions: { length: number; width: number; height: number }
  openTop?: boolean
  hasHandles?: boolean
  customCode?: string
  tag?: string
  /** Optional material finish applied with the template. */
  surface?: Partial<Surface>
  brief: string
  notes: string
}
export const uid = () => crypto.randomUUID()
export function newDesign(brief = ''): Design {
  return { id: uid(), name: 'Untitled idea', brief, category: 'Box', structure: 'standard', color: '#b8c9ac', material: 'Recycled rigid board', finish: 'Matte', dimensions: { length: 240, width: 90, height: 40 }, quantity: 100, notes: 'A considered, minimal design with a fitted insert. No logo unless supplied.', openTop: false, hasHandles: false, customCode: undefined, stage: 'design', status: 'Draft', messages: [{ id: uid(), role: 'assistant', text: 'Hey, I’m minal. Your idea person.\nTell me what you’d like to make. A little detail is all we need to get started.' }], chatStep: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
}
