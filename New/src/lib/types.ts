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
export type Design = {
  id: string
  name: string
  brief: string
  category: ProductCategory
  structure?: Structure
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
  brief: string
  notes: string
}
export const templates: Template[] = [
  { id: 'document-archive', name: 'Document Archive Box', description: 'Readable labeling and a roomy tray for bills and paperwork', icon: 'box', category: 'Box', tag: 'Boxes', color: '#f0e9dc', innerColor: '#c7bea9', material: 'Recycled rigid board', finish: 'Matte', dimensions: { length: 320, width: 230, height: 100 }, typography: { fontFamily: 'Source Sans 3', size: 25, align: 'left' }, brief: 'A practical document storage box with clear, readable branding.', notes: 'Lift-off lid with a roomy rectangular document tray.' },
  { id: 'perfume-drawer', name: 'Perfume Presentation Drawer', description: 'Dark sleeve, contrasting tray, and refined serif type', icon: 'box', category: 'Box', structure: 'drawer', tag: 'Specialty', color: '#23342f', innerColor: '#d9c9aa', accentColor: '#b89960', material: 'Recycled rigid board', finish: 'Soft-touch', dimensions: { length: 180, width: 120, height: 55 }, typography: { fontFamily: 'Cormorant Garamond', size: 30, letterSpacing: .04 }, brief: 'An elegant perfume presentation drawer with contrasting inner tray.', notes: 'Sliding drawer and pull loop.' },
  { id: 'coffee-ritual', name: 'Coffee Ritual Canister', description: 'Tall circular canister with a clear typographic label', icon: 'canister', category: 'Canister', tag: 'Specialty', color: '#743f2e', material: 'Paperboard with food-safe lining', finish: 'Matte', dimensions: { length: 100, width: 100, height: 180 }, typography: { fontFamily: 'Bebas Neue', size: 28, fontWeight: 400 }, brief: 'A warm coffee canister with strong display typography.', notes: 'Circular reusable lid concept.' },
  { id: 'urdu-gift', name: 'Urdu Gift Collection', description: 'Six-sided gift box with locally bundled Urdu typography', icon: 'box', category: 'Box', structure: 'hexagon', tag: 'Specialty', color: '#224d43', innerColor: '#e5d7bd', material: 'Recycled rigid board', finish: 'Soft-touch', dimensions: { length: 200, width: 200, height: 100 }, typography: { fontFamily: 'Noto Nastaliq Urdu', fontWeight: 400, size: 25, letterSpacing: 0, text: 'خوبصورت تحفہ' }, brief: 'An Urdu-branded six-sided gift presentation box.', notes: 'Exact Urdu lettering with natural shaping.' },
  { id: 'stationery-retail', name: 'Stationery Retail Bag', description: 'Warm paper bag with clean type and colored rope handles', icon: 'bag', category: 'Bag', tag: 'Bags & Retail', color: '#dfb88a', accentColor: '#354535', material: 'Kraft paperboard', finish: 'Matte', dimensions: { length: 240, width: 110, height: 290 }, openTop: true, hasHandles: true, typography: { fontFamily: 'DM Sans', size: 23 }, brief: 'A stationery shopping bag with contrasting handles and readable branding.', notes: 'Open retail paper bag.' },
  { id: 'confectionery-collection', name: 'Confectionery Collection', description: 'Four compartments with soft pastel packaging and elegant labels', icon: 'box', category: 'Box', structure: 'divider', tag: 'Specialty', color: '#d1b9c9', innerColor: '#f5e8de', material: 'Paperboard with food-safe lining', finish: 'Matte', dimensions: { length: 240, width: 180, height: 65 }, typography: { fontFamily: 'Playfair Display', size: 25 }, brief: 'A four-compartment confectionery gift collection.', notes: 'Internal dividers and removable lid.' },
  {
    id: 'hexagonal-gift', name: 'Hexagonal Gift Box', description: 'Six-sided presentation box with a lift-off lid', icon: 'box', category: 'Box', structure: 'hexagon', tag: 'Specialty', color: '#586a72', material: 'Recycled rigid board', finish: 'Soft-touch', dimensions: { length: 180, width: 180, height: 85 }, brief: 'A sculptural six-sided gift box with a contrasting inner lining and a lift-off lid.', notes: 'Hexagonal rigid presentation box.'
  },
  {
    id: 'drawer-box', name: 'Slide Drawer Box', description: 'Sleeve and pull-out tray for small gifts', icon: 'box', category: 'Box', structure: 'drawer', tag: 'Boxes', color: '#866b63', material: 'Recycled rigid board', finish: 'Matte', dimensions: { length: 180, width: 120, height: 50 }, brief: 'A premium slide drawer gift box for small accessories with a contrasting tray.', notes: 'Matchbox-style sleeve and sliding tray.'
  },
  {
    id: 'bakery-window', name: 'Bakery Window Box', description: 'Display box with a clear top window', icon: 'box', category: 'Box', structure: 'window', tag: 'Specialty', color: '#c69b74', material: 'Paperboard with food-safe lining', finish: 'Matte', dimensions: { length: 220, width: 160, height: 65 }, brief: 'A warm bakery box with a clear window that lets the product show through.', notes: 'Food-safe display box with clear window concept.'
  },
  {
    id: 'tea-dividers', name: 'Tea Collection Box', description: 'Four compartments with a removable lid', icon: 'box', category: 'Box', structure: 'divider', tag: 'Specialty', color: '#82977e', material: 'Paperboard with food-safe lining', finish: 'Matte', dimensions: { length: 210, width: 160, height: 75 }, brief: 'A reusable tea collection box with four organized compartments.', notes: 'Four interior dividers for individual tea varieties.'
  },
  {
    id: 'shopping-bag',
    name: 'Shopping Bag',
    description: 'Classic retail shopping bag with rope handles and open top',
    icon: 'bag',
    category: 'Bag',
    color: '#1e293b',
    material: 'Kraft paperboard',
    finish: 'Matte',
    dimensions: { length: 250, width: 120, height: 330 },
    openTop: true,
    hasHandles: true,
    tag: 'Bags & Retail',
    brief: 'A premium retail shopping bag with rope handles, clean typography, and a luxury feel.',
    notes: 'Shopping bag style with open top and side gussets. Rope or ribbon handles.'
  },
  {
    id: 'open-shopping-box',
    name: 'Open Shopping Box',
    description: 'Modern open-top retail presentation box with handles',
    icon: 'box',
    category: 'Carton',
    color: '#262626',
    material: 'Recycled rigid board',
    finish: 'Soft-touch',
    dimensions: { length: 260, width: 140, height: 280 },
    openTop: true,
    hasHandles: true,
    tag: 'Bags & Retail',
    brief: 'An open-top retail shopping box with ribbon handles and a clean modern aesthetic.',
    notes: 'Open-top shopping box. No lid, hollow open tray with side ribbon handles.'
  },
  {
    id: 'gift-box',
    name: 'Gift Box',
    description: 'Elegant presentation box with lid',
    icon: 'box',
    category: 'Box',
    color: '#c9a96e',
    material: 'Recycled rigid board',
    finish: 'Soft-touch',
    dimensions: { length: 200, width: 200, height: 80 },
    brief: 'A square luxury gift box with magnetic closure and a gold-toned design.',
    notes: 'Square presentation box. Magnetic closure lid with fitted insert.'
  },
  {
    id: 'wine-box',
    name: 'Wine Box',
    description: 'Single bottle wine presentation box',
    icon: 'box',
    category: 'Box',
    color: '#722F37',
    material: 'Recycled rigid board',
    finish: 'Matte',
    dimensions: { length: 100, width: 100, height: 340 },
    brief: 'A tall, elegant wine bottle presentation box with a deep burgundy finish and embossed branding.',
    notes: 'Tall single-bottle wine box with fitted insert for bottle support.'
  },
  {
    id: 'cosmetics-box',
    name: 'Cosmetics Box',
    description: 'Skincare or makeup product carton',
    icon: 'carton',
    category: 'Carton',
    color: '#f5e1d0',
    material: 'FSC paperboard',
    finish: 'Soft-touch',
    dimensions: { length: 60, width: 45, height: 150 },
    brief: 'A luxurious skincare carton with soft-touch lamination and rose gold accents.',
    notes: 'Slim cosmetics carton for serum bottles or foundation. Premium unboxing feel.'
  },
  {
    id: 'coffee-canister',
    name: 'Coffee Canister',
    description: 'Cylindrical coffee or tea container',
    icon: 'canister',
    category: 'Canister',
    color: '#5C3D2E',
    material: 'Paperboard with food-safe lining',
    finish: 'Matte',
    dimensions: { length: 90, width: 90, height: 140 },
    brief: 'A warm brown cylindrical canister for specialty coffee beans with food-safe inner lining.',
    notes: 'Food-safe canister with resealable lid. Fits 250g of coffee beans.'
  },
  {
    id: 'jewelry-box',
    name: 'Jewelry Box',
    description: 'Small precious items box',
    icon: 'box',
    category: 'Box',
    color: '#1a1a2e',
    material: 'Recycled rigid board',
    finish: 'Soft-touch',
    dimensions: { length: 90, width: 90, height: 40 },
    brief: 'A compact midnight blue jewelry box with velvet-feel finish for rings, earrings, or necklaces.',
    notes: 'Small luxury box with magnetic closure and cushioned insert.'
  },
  {
    id: 'food-box',
    name: 'Food Box',
    description: 'Bakery, chocolate, or treats box',
    icon: 'box',
    category: 'Box',
    color: '#e8d5b7',
    material: 'Paperboard with food-safe lining',
    finish: 'Matte',
    dimensions: { length: 220, width: 150, height: 60 },
    brief: 'A natural kraft bakery box for cookies, pastries, or chocolates with a window option.',
    notes: 'Food-safe bakery box with potential window cut-out. Tuck-end closure.'
  },
  {
    id: 'perfume-box',
    name: 'Perfume Box',
    description: 'Luxury fragrance packaging',
    icon: 'carton',
    category: 'Carton',
    color: '#2d2d2d',
    material: 'FSC paperboard',
    finish: 'Gloss',
    dimensions: { length: 80, width: 80, height: 180 },
    brief: 'A sleek black perfume carton with high-gloss UV coating and metallic foil logo.',
    notes: 'Premium fragrance carton. High-gloss finish with spot UV or foil stamping.'
  },
  {
    id: 'subscription-box',
    name: 'Subscription Box',
    description: 'Monthly subscription mailer box',
    icon: 'box',
    category: 'Box',
    color: '#ff6b35',
    material: 'Kraft paperboard',
    finish: 'Matte',
    dimensions: { length: 300, width: 220, height: 100 },
    brief: 'A bold, colorful subscription box with custom inner print and a memorable unboxing experience.',
    notes: 'E-commerce mailer box with printed interior. Self-locking tabs.'
  },
  {
    id: 'candle-box',
    name: 'Candle Box',
    description: 'Single candle jar packaging',
    icon: 'box',
    category: 'Box',
    color: '#f0ebe3',
    material: 'Recycled rigid board',
    finish: 'Matte',
    dimensions: { length: 100, width: 100, height: 120 },
    brief: 'A clean, minimal candle box in warm ivory with a lift-off lid and snug jar fit.',
    notes: 'Candle jar box with fitted insert. Lift-off lid design.'
  },
  {
    id: 'tea-box',
    name: 'Tea Box',
    description: 'Tea bag or loose leaf collection',
    icon: 'box',
    category: 'Box',
    color: '#7d9b76',
    material: 'Paperboard with food-safe lining',
    finish: 'Matte',
    dimensions: { length: 200, width: 140, height: 70 },
    brief: 'A serene green tea collection box with compartments for multiple tea varieties.',
    notes: 'Multi-compartment tea box. Food-safe with dividers for different tea types.'
  },
  {
    id: 'tech-box',
    name: 'Tech Product Box',
    description: 'Electronics or gadget packaging',
    icon: 'box',
    category: 'Box',
    color: '#ffffff',
    material: 'Recycled rigid board',
    finish: 'Soft-touch',
    dimensions: { length: 180, width: 180, height: 60 },
    brief: 'A clean white tech product box with a minimal Apple-style design and magnetic closure.',
    notes: 'Premium tech packaging with magnetic lid, foam insert, and clean typography.'
  },
  {
    id: 'soap-box',
    name: 'Soap Box',
    description: 'Artisan soap or bath product',
    icon: 'carton',
    category: 'Carton',
    color: '#d4a574',
    material: 'Kraft paperboard',
    finish: 'Matte',
    dimensions: { length: 100, width: 70, height: 40 },
    brief: 'A rustic kraft soap box with a die-cut window and handmade artisan feel.',
    notes: 'Tuck-end carton with optional window. Natural kraft look.'
  },
  {
    id: 'supplement-bottle',
    name: 'Supplement Box',
    description: 'Vitamin or supplement bottle carton',
    icon: 'carton',
    category: 'Carton',
    color: '#2e5e4e',
    material: 'FSC paperboard',
    finish: 'Matte',
    dimensions: { length: 70, width: 70, height: 140 },
    brief: 'A clean, clinical supplement carton in forest green with clear product information.',
    notes: 'Supplement bottle carton with nutritional info panels and clean design.'
  },
]
export const uid = () => crypto.randomUUID()
export function newDesign(brief = ''): Design {
  return { id: uid(), name: 'Untitled idea', brief, category: 'Box', structure: 'standard', color: '#b8c9ac', material: 'Recycled rigid board', finish: 'Matte', dimensions: { length: 240, width: 90, height: 40 }, quantity: 100, notes: 'A considered, minimal design with a fitted insert. No logo unless supplied.', openTop: false, hasHandles: false, customCode: undefined, stage: 'design', status: 'Draft', messages: [{ id: uid(), role: 'assistant', text: 'Hey, I’m minal. Your idea person.\nTell me what you’d like to make. A little detail is all we need to get started.' }], chatStep: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
}
