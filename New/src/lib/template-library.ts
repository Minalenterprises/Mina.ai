import type { Design, MaterialPreset, Surface, Template, Typography } from './types'
import { isShapeId, shapeInfo } from './shapes'
import { getArtwork, PRINT_STARTERS } from './print-artwork'

/**
 * Template library and style presets. Kept out of `types.ts` so the Studio can load it on
 * demand (Templates modal, AI tools) instead of shipping it with every page.
 */
const CORE_TEMPLATES: Template[] = [
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
  { id: 'pillow-gift', name: 'Pillow Gift Box', description: 'Curved pillow pack for scarves, soaps and gift cards', icon: 'carton', category: 'Carton', structure: 'pillow', tag: 'Specialty', color: '#c9a0b4', material: 'Metallized cardstock', finish: 'Gloss', dimensions: { length: 160, width: 45, height: 110 }, brief: 'A glossy pillow gift box with soft curves.', notes: 'Curved crease pillow box.' },
  { id: 'octagon-tea', name: 'Octagon Tea Box', description: 'Eight-sided rigid box with lift-off lid', icon: 'box', category: 'Box', structure: 'octagon', tag: 'Specialty', color: '#3f5f4a', innerColor: '#efe4cf', material: 'Recycled rigid board', finish: 'Soft-touch', dimensions: { length: 180, width: 180, height: 90 }, brief: 'An octagonal tea gift box.', notes: 'Octagonal rigid box.' },
  { id: 'pyramid-favor', name: 'Pyramid Favor Box', description: 'Square pyramid with petal-folding panels', icon: 'box', category: 'Box', structure: 'pyramid', tag: 'Specialty', color: '#e8b04a', material: 'FSC paperboard', finish: 'Matte', dimensions: { length: 110, width: 110, height: 110 }, brief: 'A playful pyramid favor box for sweets.', notes: 'Four triangular panels fold to a point.' },
  { id: 'gable-bakery', name: 'Gable Bakery Box', description: 'Carry box with a peaked handle top', icon: 'carton', category: 'Carton', structure: 'gable', tag: 'Bags & Retail', color: '#d9b48f', material: 'Kraft paperboard', finish: 'Matte', materialPreset: 'kraft', dimensions: { length: 150, width: 90, height: 160 }, brief: 'A kraft gable box for pastries and take-away.', notes: 'Gable top with handle cut-out.' },
  { id: 'mailer-box', name: 'E-commerce Mailer', description: 'Roll-end tuck-front mailer with hinged lid', icon: 'box', category: 'Box', structure: 'mailer', tag: 'Boxes', color: '#f4f1ea', innerColor: '#ff6b35', material: 'E-flute corrugated board', finish: 'Matte', dimensions: { length: 300, width: 220, height: 100 }, brief: 'A subscription mailer with a bold printed interior.', notes: 'Hinged lid with tuck front.' },
  { id: 'poster-tube', name: 'Tube With Lids', description: 'Long paper tube with top cap and end cap', icon: 'canister', category: 'Canister', structure: 'tube', tag: 'Specialty', color: '#20324a', material: 'Spiral-wound paperboard', finish: 'Matte', dimensions: { length: 80, width: 80, height: 300 }, brief: 'A premium paper tube with telescoping cap.', notes: 'Top cap and bottom end cap.' },
  { id: 'serum-bottle', name: 'Glass Serum Bottle', description: 'Bottle with shoulder, neck, cap and wrap label', icon: 'canister', category: 'Canister', structure: 'bottle', tag: 'Specialty', color: '#c98f5a', accentColor: '#1d1d1d', material: 'Amber glass', finish: 'Gloss', materialPreset: 'glass', dimensions: { length: 50, width: 50, height: 130 }, brief: 'An amber glass serum bottle with a black cap.', notes: 'Wrap-around paper label.' },
  { id: 'cream-jar', name: 'Cosmetic Jar', description: 'Wide-mouth jar with screw lid', icon: 'canister', category: 'Canister', structure: 'jar', tag: 'Specialty', color: '#f2e6dc', accentColor: '#c9a96e', material: 'Frosted glass', finish: 'Soft-touch', dimensions: { length: 80, width: 80, height: 70 }, brief: 'A frosted cosmetic cream jar with gold lid.', notes: 'Screw lid jar.' },
  { id: 'coffee-pouch', name: 'Stand-up Pouch', description: 'Flexible doypack with gusset and tear notch', icon: 'bag', category: 'Bag', structure: 'pouch', tag: 'Bags & Retail', color: '#2b2b2b', material: 'Matte laminated film', finish: 'Matte', dimensions: { length: 140, width: 60, height: 210 }, brief: 'A matte black coffee pouch.', notes: 'Stand-up pouch with bottom gusset.' },
  { id: 'sample-sachet', name: 'Sample Sachet', description: 'Flat sachet with crimped seals', icon: 'bag', category: 'Bag', structure: 'sachet', tag: 'Bags & Retail', color: '#b7d3df', material: 'Foil laminate', finish: 'Gloss', materialPreset: 'foil', dimensions: { length: 80, width: 8, height: 110 }, brief: 'A foil sample sachet for skincare.', notes: 'Three-side seal sachet.' },
  { id: 'food-tray', name: 'Food Tray', description: 'Open tray with angled walls', icon: 'box', category: 'Box', structure: 'tray', tag: 'Boxes', color: '#e7d7bd', material: 'Moulded pulp board', finish: 'Matte', materialPreset: 'kraft', dimensions: { length: 240, width: 160, height: 50 }, brief: 'A sustainable food tray.', notes: 'Open tray.' },
  { id: 'chocolate-sleeve', name: 'Chocolate Sleeve Box', description: 'Printed sleeve over a sliding tray', icon: 'box', category: 'Box', structure: 'sleeve', tag: 'Boxes', color: '#5a2e2a', innerColor: '#e9d3b5', material: 'FSC paperboard', finish: 'Soft-touch', dimensions: { length: 200, width: 120, height: 35 }, brief: 'A chocolate bar sleeve box.', notes: 'Sleeve and tray.' },
  { id: 'counter-display', name: 'Counter Display', description: 'Shelf-ready display with header card', icon: 'box', category: 'Box', structure: 'display', tag: 'Bags & Retail', color: '#e94f37', innerColor: '#ffffff', material: 'E-flute corrugated board', finish: 'Gloss', dimensions: { length: 260, width: 180, height: 120 }, brief: 'A bright counter display for impulse products.', notes: 'Open front with header.' },
  { id: 'custom-vase', name: 'Custom Revolved Shape', description: 'Any round object from a profile curve', icon: 'canister', category: 'Canister', structure: 'lathe', tag: 'Custom', color: '#d8c8b8', material: 'Ceramic look', finish: 'Gloss', dimensions: { length: 100, width: 100, height: 160 }, brief: 'A custom revolved container.', notes: 'Profile-driven geometry.' },
  { id: 'custom-heart', name: 'Custom Extruded Shape', description: 'Any footprint (heart by default) with lid', icon: 'box', category: 'Box', structure: 'extrude', tag: 'Custom', color: '#c2273d', innerColor: '#f5d5da', material: 'Recycled rigid board', finish: 'Soft-touch', dimensions: { length: 180, width: 170, height: 70 }, brief: 'A heart-shaped gift box.', notes: 'Footprint-driven geometry.' },
]

/** Ready packaging templates by sector. Each uses a real shape from the catalogue, so 3D, dieline and exports all work. */
type T = Omit<Template, 'icon' | 'category'> & { icon?: Template['icon']; category?: Template['category'] }
const SECTOR_TEMPLATES: T[] = [
  // Cosmetics
  { id: 'serum-reverse-tuck', tag: 'Cosmetics', name: 'Serum Carton', description: 'Slim reverse-tuck carton with pearlescent soft-touch', structure: 'reverse-tuck', color: '#f3e6dd', accentColor: '#b98b6e', material: 'FSC paperboard 350 gsm', finish: 'Soft-touch', dimensions: { length: 40, width: 40, height: 120 }, surface: { texture: 'pearlescent', strength: .45 }, typography: { fontFamily: 'Cormorant Garamond', size: 24, letterSpacing: .08, transform: 'uppercase' }, brief: 'A refined serum carton with a pearlescent soft-touch finish.', notes: 'Reverse tuck end; fits a 30 ml dropper bottle.' },
  { id: 'lipstick-box', tag: 'Cosmetics', name: 'Lipstick Tube Box', description: 'Tiny reverse-tuck box in high-gloss crimson', structure: 'reverse-tuck', color: '#b0243a', material: 'Metallized cardstock', finish: 'Gloss', dimensions: { length: 28, width: 28, height: 90 }, typography: { fontFamily: 'Playfair Display', size: 30 }, brief: 'A glossy lipstick tube box.', notes: 'Reverse tuck end; foil logo concept.' },
  { id: 'cream-carton', tag: 'Cosmetics', name: 'Face Cream Carton', description: 'Snap-lock carton for a cream jar with linen emboss', structure: 'snap-lock', color: '#e9efe6', material: 'FSC paperboard 400 gsm', finish: 'Matte', dimensions: { length: 70, width: 70, height: 60 }, surface: { texture: 'linen', strength: .5 }, typography: { fontFamily: 'Lora', size: 26 }, brief: 'A calm, botanical face-cream carton.', notes: 'Snap-lock bottom for jar weight.' },
  { id: 'fragrance-book-box', tag: 'Cosmetics', name: 'Fragrance Book Box', description: 'Magnetic book-style box in black velvet-touch', structure: 'book-box', color: '#1c1c1c', innerColor: '#c9b38b', accentColor: '#c9a96e', material: 'Rigid greyboard wrapped in velvet-touch paper', finish: 'Soft-touch', dimensions: { length: 160, width: 110, height: 60 }, surface: { texture: 'velvet', strength: .6 }, typography: { fontFamily: 'Cinzel', size: 22, letterSpacing: .12, color: '#c9a96e' }, brief: 'A luxury fragrance book box with magnetic closure.', notes: 'Opens like a book; magnetic catch.' },
  // Food
  { id: 'cereal-crash-lock', tag: 'Food', name: 'Cereal Carton', description: 'Crash-lock bottom for fast filling lines', structure: 'crash-lock', color: '#f2b134', material: 'Recycled paperboard', finish: 'Gloss', dimensions: { length: 190, width: 60, height: 280 }, typography: { fontFamily: 'Anton', size: 34, fontWeight: 400, transform: 'uppercase' }, brief: 'A bold breakfast cereal carton.', notes: 'Auto (crash-lock) bottom.' },
  { id: 'chocolate-prism', tag: 'Food', name: 'Chocolate Prism', description: 'Toblerone-style triangular bar carton', structure: 'triangle', color: '#5a2e2a', accentColor: '#d4af37', material: 'FSC paperboard', finish: 'Matte', dimensions: { length: 220, width: 60, height: 55 }, surface: { texture: 'fine-paper' }, typography: { fontFamily: 'Abril Fatface', size: 34, fontWeight: 400, color: '#e8cf9a' }, brief: 'A triangular chocolate bar pack.', notes: 'End flap opens.' },
  { id: 'snack-pouch', tag: 'Food', name: 'Kraft Snack Pouch', description: 'Stand-up pouch with recycled kraft look', structure: 'pouch', color: '#c9a27a', material: 'Kraft paper / PLA laminate', finish: 'Matte', materialPreset: 'kraft', dimensions: { length: 150, width: 70, height: 220 }, surface: { texture: 'recycled', strength: .6 }, typography: { fontFamily: 'DM Sans', size: 26 }, brief: 'An eco snack pouch.', notes: 'Zip and tear notch.' },
  { id: 'spice-tube', tag: 'Food', name: 'Spice Tube', description: 'Paper tube with cap for spices and salts', structure: 'tube', color: '#c4572b', material: 'Spiral-wound paperboard, food-safe liner', finish: 'Matte', dimensions: { length: 50, width: 50, height: 140 }, typography: { fontFamily: 'Bitter', size: 26 }, brief: 'A warm spice tube.', notes: 'Shaker cap concept.' },
  { id: 'popcorn-cone', tag: 'Food', name: 'Popcorn Cone', description: 'Striped conical sleeve for snacks', structure: 'cone', color: '#e63946', material: 'Food-safe paperboard', finish: 'Gloss', dimensions: { length: 120, width: 120, height: 200 }, surface: { texture: 'pinstripe', strength: .7, scale: 2 }, typography: { fontFamily: 'Lobster', size: 30, fontWeight: 400 }, brief: 'A cinema popcorn cone.', notes: 'Fan blank with glue flap.' },
  { id: 'milk-tetra', tag: 'Food', name: 'Tetra Milk Pack', description: 'Four-faced tetrahedron pack', structure: 'tetra', color: '#e0f0ff', material: 'Liquid packaging board', finish: 'Gloss', dimensions: { length: 120, width: 120, height: 110 }, typography: { fontFamily: 'Rubik', size: 28 }, brief: 'A playful tetra milk pack.', notes: 'Crossed seals.' },
  // Coffee & tea
  { id: 'coffee-roaster-pouch', tag: 'Coffee & Tea', name: 'Roaster Coffee Bag', description: 'Matte black pouch with valve-ready front', structure: 'pouch', color: '#1f2b24', material: 'Matte laminated film', finish: 'Matte', dimensions: { length: 130, width: 80, height: 230 }, typography: { fontFamily: 'Space Grotesk', size: 24, transform: 'uppercase', letterSpacing: .06 }, brief: 'A specialty coffee pouch.', notes: 'Degassing valve concept.' },
  { id: 'coffee-tin', tag: 'Coffee & Tea', name: 'Coffee Tin', description: 'Brushed-metal canister with friction lid', structure: 'canister', color: '#b9b4ab', material: 'Tinplate', finish: 'Matte', materialPreset: 'metal', dimensions: { length: 100, width: 100, height: 150 }, surface: { texture: 'brushed-metal', strength: .5 }, typography: { fontFamily: 'Bebas Neue', size: 32, fontWeight: 400 }, brief: 'A reusable coffee tin.', notes: 'Friction lid.' },
  { id: 'matcha-washi-tube', tag: 'Coffee & Tea', name: 'Matcha Washi Tube', description: 'Japanese washi-wrapped tube', structure: 'tube', color: '#8da57b', material: 'Paper tube wrapped in washi', finish: 'Matte', dimensions: { length: 70, width: 70, height: 160 }, surface: { texture: 'washi', strength: .7 }, typography: { fontFamily: 'Noto Serif', size: 24, letterSpacing: .1 }, brief: 'A Japanese matcha tube.', notes: 'Telescoping cap.' },
  { id: 'tea-book-box', tag: 'Coffee & Tea', name: 'Tea Sampler Book', description: 'Book box with linen cover for tea sachets', structure: 'book-box', color: '#2f4a3a', innerColor: '#efe4cf', material: 'Rigid board with bookcloth', finish: 'Matte', dimensions: { length: 200, width: 140, height: 45 }, surface: { texture: 'linen', strength: .6 }, typography: { fontFamily: 'Cormorant Garamond', size: 26, color: '#efe4cf' }, brief: 'A tea sampler book box.', notes: 'Opens from the spine.' },
  // Candles & home
  { id: 'candle-hat-box', tag: 'Candles & Home', name: 'Candle Hat Box', description: 'Round box with deep lid for jar candles', structure: 'hat-box', color: '#efe7da', material: 'Rigid board wrapped in cotton paper', finish: 'Matte', dimensions: { length: 120, width: 120, height: 110 }, surface: { texture: 'cotton-paper', strength: .6 }, typography: { fontFamily: 'EB Garamond', size: 26 }, brief: 'A soft ivory candle box.', notes: 'Deep lift-off lid.' },
  { id: 'candle-telescope', tag: 'Candles & Home', name: 'Noir Candle Box', description: 'Full telescope box in velvet black', structure: 'telescope', color: '#2b2b2b', innerColor: '#d6c3a5', material: 'Rigid greyboard', finish: 'Soft-touch', dimensions: { length: 100, width: 100, height: 120 }, surface: { texture: 'velvet', strength: .5 }, typography: { fontFamily: 'Cinzel', size: 24, color: '#d6c3a5' }, brief: 'A noir luxury candle box.', notes: 'Deep telescope lid.' },
  // Jewelry
  { id: 'ring-book-box', tag: 'Jewelry', name: 'Ring Book Box', description: 'Tiny magnetic book box in navy velvet', structure: 'book-box', color: '#14213d', innerColor: '#f2e8d5', accentColor: '#c9a96e', material: 'Rigid board, velvet-touch wrap', finish: 'Soft-touch', dimensions: { length: 90, width: 90, height: 40 }, surface: { texture: 'velvet', strength: .55 }, typography: { fontFamily: 'Cinzel', size: 22, color: '#c9a96e' }, brief: 'A navy ring box.', notes: 'Foam slit insert.' },
  { id: 'necklace-drawer', tag: 'Jewelry', name: 'Necklace Drawer', description: 'Pearlescent slide drawer with ribbon pull', structure: 'drawer', color: '#f5ece4', innerColor: '#2b2b2b', material: 'Rigid board, pearl paper', finish: 'Gloss', dimensions: { length: 160, width: 120, height: 30 }, surface: { texture: 'pearlescent', strength: .5 }, typography: { fontFamily: 'Playfair Display', size: 24 }, brief: 'A pearl necklace drawer.', notes: 'Ribbon pull.' },
  // Electronics
  { id: 'earbuds-telescope', tag: 'Electronics', name: 'Earbuds Box', description: 'Clean white telescope box, deep lid', structure: 'telescope', color: '#f5f5f5', innerColor: '#d9d9d9', material: 'Rigid board, white wrap', finish: 'Soft-touch', dimensions: { length: 110, width: 110, height: 50 }, typography: { fontFamily: 'Inter', size: 18 }, brief: 'A minimal earbuds box.', notes: 'Moulded pulp insert.' },
  { id: 'gadget-mailer', tag: 'Electronics', name: 'Gadget Mailer', description: 'Carbon-fibre look mailer', structure: 'mailer', color: '#1a1a1a', innerColor: '#00e0a4', material: 'E-flute corrugated', finish: 'Matte', dimensions: { length: 260, width: 180, height: 80 }, surface: { texture: 'carbon-fiber', strength: .4 }, typography: { fontFamily: 'Space Grotesk', size: 24, color: '#00e0a4' }, brief: 'A techy gadget mailer.', notes: 'Bright interior print.' },
  { id: 'cable-snap-lock', tag: 'Electronics', name: 'Accessory Carton', description: 'Snap-lock carton for cables and chargers', structure: 'snap-lock', color: '#e8edf2', material: 'FSC paperboard', finish: 'Matte', dimensions: { length: 90, width: 40, height: 140 }, surface: { texture: 'grid', strength: .3 }, typography: { fontFamily: 'IBM Plex Sans', size: 22 }, brief: 'A tidy accessory carton.', notes: 'Hang tab optional.' },
  // Bakery
  { id: 'cake-window-box', tag: 'Bakery', name: 'Cake Box With Window', description: 'One-piece cake box with clear window lid', structure: 'cake-box', color: '#f7d6dc', material: 'Food-safe paperboard', finish: 'Matte', dimensions: { length: 250, width: 250, height: 120 }, typography: { fontFamily: 'Pacifico', size: 26, fontWeight: 400 }, brief: 'A pink bakery cake box.', notes: 'Window film inside lid.' },
  { id: 'pastry-briefcase', tag: 'Bakery', name: 'Pastry Carry Box', description: 'Briefcase handle box in kraft', structure: 'briefcase', color: '#d9b48f', material: 'Kraft paperboard', finish: 'Matte', materialPreset: 'kraft', dimensions: { length: 240, width: 100, height: 180 }, surface: { texture: 'kraft', strength: .6 }, typography: { fontFamily: 'Caveat', size: 30 }, brief: 'A carry box for pastries.', notes: 'Handle plates interlock.' },
  { id: 'macaron-sleeve', tag: 'Bakery', name: 'Macaron Sleeve', description: 'Long sleeve box for a macaron row', structure: 'sleeve', color: '#c9e4de', innerColor: '#f7d6dc', material: 'FSC paperboard', finish: 'Soft-touch', dimensions: { length: 200, width: 50, height: 50 }, typography: { fontFamily: 'Quicksand', size: 26 }, brief: 'A pastel macaron sleeve.', notes: 'Sleeve and tray.' },
  // Wine & spirits
  { id: 'wine-carton', tag: 'Wine & Spirits', name: 'Wine Carton', description: 'Tall tuck carton with neck insert', structure: 'wine-box', color: '#3b0f1a', accentColor: '#c9a96e', material: 'FSC paperboard 450 gsm', finish: 'Matte', dimensions: { length: 95, width: 95, height: 350 }, surface: { texture: 'linen', strength: .5 }, typography: { fontFamily: 'Cinzel', size: 22, color: '#e8d6a8' }, brief: 'A burgundy wine carton.', notes: 'Neck insert holds the bottle.' },
  { id: 'whisky-tube', tag: 'Wine & Spirits', name: 'Whisky Tube', description: 'Croc-embossed tube with metal end cap', structure: 'tube', color: '#1b1b1b', accentColor: '#c9a96e', material: 'Rigid paper tube, embossed wrap', finish: 'Soft-touch', dimensions: { length: 100, width: 100, height: 330 }, surface: { texture: 'croc-leather', strength: .5 }, typography: { fontFamily: 'Playfair Display', size: 24, color: '#c9a96e' }, brief: 'A premium whisky tube.', notes: 'Metal end cap.' },
  { id: 'two-bottle-bag', tag: 'Wine & Spirits', name: 'Wine Gift Bag', description: 'Tall gift bag with rope handles', structure: 'standard', category: 'Bag', icon: 'bag', color: '#5b1a28', accentColor: '#c9a96e', material: 'Coated art paper 210 gsm', finish: 'Matte', dimensions: { length: 200, width: 100, height: 380 }, openTop: true, hasHandles: true, typography: { fontFamily: 'Cormorant Garamond', size: 26, color: '#e8d6a8' }, brief: 'A wine gift bag.', notes: 'Gusseted with rope handles.' },
  // Pharma
  { id: 'pharma-carton', tag: 'Pharma', name: 'Medicine Carton', description: 'Clinical reverse-tuck carton with info panel', structure: 'reverse-tuck', color: '#ffffff', accentColor: '#0077b6', material: 'GC1 folding boxboard', finish: 'Matte', dimensions: { length: 60, width: 25, height: 110 }, typography: { fontFamily: 'IBM Plex Sans', size: 20, color: '#0077b6', align: 'left' }, brief: 'A clear, legible medicine carton.', notes: 'Braille and leaflet per regulation (supplied by client).' },
  { id: 'supplement-snap', tag: 'Pharma', name: 'Supplement Carton', description: 'Snap-lock carton for a vitamin bottle', structure: 'snap-lock', color: '#e9f5ef', accentColor: '#2e7d5b', material: 'FSC paperboard', finish: 'Matte', dimensions: { length: 70, width: 70, height: 130 }, typography: { fontFamily: 'Lexend', size: 22, color: '#2e7d5b' }, brief: 'A fresh supplement carton.', notes: 'Snap-lock bottom.' },
  { id: 'sample-foil-sachet', tag: 'Pharma', name: 'Foil Sample Sachet', description: 'Three-side-seal foil sachet', structure: 'sachet', color: '#eaf2fb', material: 'Foil laminate', finish: 'Gloss', materialPreset: 'foil', dimensions: { length: 60, width: 8, height: 90 }, typography: { fontFamily: 'Figtree', size: 20 }, brief: 'A sample sachet.', notes: 'Tear notch.' },
  // Apparel
  { id: 'tshirt-mailer', tag: 'Apparel', name: 'T-shirt Mailer', description: 'Flat mailer for folded apparel', structure: 'mailer', color: '#222222', innerColor: '#f4d35e', material: 'E-flute corrugated', finish: 'Matte', dimensions: { length: 300, width: 250, height: 60 }, typography: { fontFamily: 'Montserrat', size: 22, transform: 'uppercase', letterSpacing: .1 }, brief: 'A streetwear mailer.', notes: 'Printed inside.' },
  { id: 'shoe-telescope', tag: 'Apparel', name: 'Shoe Box', description: 'Full telescope shoe box in kraft', structure: 'telescope', color: '#e86f3b', innerColor: '#d9b48f', material: 'Kraft-backed greyboard', finish: 'Matte', dimensions: { length: 330, width: 200, height: 120 }, surface: { texture: 'recycled', strength: .4 }, typography: { fontFamily: 'Oswald', size: 28, transform: 'uppercase' }, brief: 'A sneaker shoe box.', notes: 'Deep lid.' },
  { id: 'boutique-linen-bag', tag: 'Apparel', name: 'Boutique Linen Bag', description: 'Linen-embossed shopping bag', structure: 'standard', category: 'Bag', icon: 'bag', color: '#f1e9df', accentColor: '#3d3d3d', material: 'Embossed art paper', finish: 'Matte', dimensions: { length: 300, width: 120, height: 380 }, openTop: true, hasHandles: true, surface: { texture: 'linen', strength: .5 }, typography: { fontFamily: 'Josefin Sans', size: 24, transform: 'uppercase', letterSpacing: .14 }, brief: 'A boutique shopping bag.', notes: 'Rope handles.' },
  // Gifts & cultural
  { id: 'mithai-box', tag: 'Gifts', name: 'Mithai Box (Urdu)', description: 'Rigid sweets box with Islamic star lattice and Urdu lettering', structure: 'rigid-box', color: '#b5283b', innerColor: '#f5e6c8', accentColor: '#d4af37', material: 'Rigid board, foil accents', finish: 'Soft-touch', dimensions: { length: 250, width: 200, height: 60 }, surface: { texture: 'girih', strength: .45 }, typography: { fontFamily: 'Noto Nastaliq Urdu', fontWeight: 400, size: 26, letterSpacing: 0, text: 'مٹھائی', color: '#f5e6c8' }, brief: 'A festive mithai box with Urdu lettering.', notes: 'Fitted tray insert.' },
  { id: 'eid-octagon', tag: 'Gifts', name: 'Eid Gift Octagon (Arabic)', description: 'Octagonal gift box with Arabic greeting', structure: 'octagon', color: '#0f3d3e', innerColor: '#f2e3c6', accentColor: '#d4af37', material: 'Rigid board', finish: 'Soft-touch', dimensions: { length: 200, width: 200, height: 90 }, surface: { texture: 'girih', strength: .4 }, typography: { fontFamily: 'Noto Sans Arabic', fontWeight: 700, size: 26, letterSpacing: 0, text: 'عيد مبارك', color: '#d4af37' }, brief: 'An Eid gift box.', notes: 'Lift-off lid.' },
  { id: 'valentine-heart', tag: 'Gifts', name: 'Valentine Heart Box', description: 'Heart box in red velvet-touch', structure: 'heart', color: '#c2273d', innerColor: '#f5d5da', material: 'Rigid board, velvet-touch wrap', finish: 'Soft-touch', dimensions: { length: 180, width: 170, height: 70 }, surface: { texture: 'velvet', strength: .5 }, typography: { fontFamily: 'Dancing Script', size: 30, fontWeight: 700 }, brief: 'A red heart gift box.', notes: 'Lift-off heart lid.' },
]
const iconFor = (t: T): Template['icon'] => t.icon ?? (t.category === 'Bag' ? 'bag' : t.category === 'Canister' ? 'canister' : ['snap-lock', 'crash-lock', 'reverse-tuck', 'wine-box', 'briefcase', 'triangle', 'tetra'].includes(t.structure || '') ? 'carton' : ['hat-box', 'cone', 'tube', 'canister'].includes(t.structure || '') ? 'canister' : ['pouch', 'sachet'].includes(t.structure || '') ? 'bag' : 'box')

export const templates: Template[] = [
  ...CORE_TEMPLATES,
  ...SECTOR_TEMPLATES.map(t => {
    const category = t.category ?? (isShapeId(t.structure) ? shapeInfo(t.structure).category : 'Box')
    return { ...t, category, icon: iconFor({ ...t, category }) }
  }),
]
export const TEMPLATE_SECTORS = [...new Set(templates.map(t => t.tag || 'Boxes'))]

// ---------------------------------------------------------------------------------------------
// Design style presets: restyle colour, finish, texture and typography while keeping the shape,
// dimensions and printed copy.
// ---------------------------------------------------------------------------------------------
export type StylePreset = {
  id: string
  name: string
  description: string
  color: string
  innerColor?: string
  accentColor?: string
  finish: 'Matte' | 'Soft-touch' | 'Gloss'
  materialPreset?: MaterialPreset
  material?: string
  surface: Partial<Surface>
  typography: Partial<Typography>
  /** Optional editable print starter from PRINT_STARTERS. */
  print?: string
}
export const STYLE_PRESETS: StylePreset[] = [
  { id: 'minimal', name: 'Minimal', description: 'Quiet off-white, generous space, light sans.', color: '#f4f2ee', innerColor: '#d9d6cf', finish: 'Matte', materialPreset: 'auto', surface: { texture: 'fine-paper', strength: .3 }, typography: { fontFamily: 'Inter', fontWeight: 400, size: 14, letterSpacing: .04, transform: 'lowercase', align: 'center', color: 'auto', background: 'none' } },
  { id: 'luxury', name: 'Luxury', description: 'Black velvet-touch with gold serif capitals.', color: '#151515', innerColor: '#c9b38b', accentColor: '#c9a96e', finish: 'Soft-touch', materialPreset: 'soft-touch', surface: { texture: 'velvet', strength: .5 }, typography: { fontFamily: 'Cinzel', fontWeight: 700, size: 18, letterSpacing: .14, transform: 'uppercase', color: '#c9a96e', background: 'none' } },
  { id: 'kraft-eco', name: 'Kraft / eco', description: 'Unbleached kraft, recycled fibres, honest type.', color: '#c9a27a', innerColor: '#b48d66', finish: 'Matte', materialPreset: 'kraft', material: 'Recycled kraft paperboard', surface: { texture: 'recycled', strength: .6 }, typography: { fontFamily: 'DM Sans', fontWeight: 700, size: 20, letterSpacing: .02, transform: 'original', color: '#2b2118', background: 'none' } },
  { id: 'retro', name: 'Retro 70s', description: 'Mustard and burnt orange with chunky display type.', color: '#e0a526', innerColor: '#c4572b', accentColor: '#5c3d2e', finish: 'Matte', surface: { texture: 'chevron', strength: .35, scale: 1.5 }, typography: { fontFamily: 'Righteous', fontWeight: 400, size: 26, letterSpacing: 0, transform: 'original', color: '#5c3d2e', background: 'none' } },
  { id: 'bold-pop', name: 'Bold pop', description: 'Saturated colour, gloss and big condensed caps.', color: '#ff3d7f', innerColor: '#ffd23f', accentColor: '#1b1b1b', finish: 'Gloss', materialPreset: 'gloss', surface: { texture: 'polka', strength: .35 }, typography: { fontFamily: 'Anton', fontWeight: 400, size: 34, letterSpacing: .01, transform: 'uppercase', color: '#ffffff', background: 'none' } },
  { id: 'japanese', name: 'Japanese', description: 'Washi paper, seigaiha waves, restrained vermilion.', color: '#efe6d6', innerColor: '#b7472a', accentColor: '#b7472a', finish: 'Matte', surface: { texture: 'washi', strength: .7 }, typography: { fontFamily: 'Noto Serif', fontWeight: 400, size: 18, letterSpacing: .12, transform: 'original', color: '#b7472a', background: 'none' } },
  { id: 'arabic-urdu', name: 'Arabic / Urdu', description: 'Emerald and gold, Islamic star lattice, Arabic-script type (no added tracking).', color: '#0f3d3e', innerColor: '#f2e3c6', accentColor: '#d4af37', finish: 'Soft-touch', surface: { texture: 'girih', strength: .4 }, typography: { fontFamily: 'Noto Nastaliq Urdu', fontWeight: 400, size: 24, letterSpacing: 0, transform: 'original', color: '#d4af37', background: 'none' } },
  { id: 'scandinavian', name: 'Scandinavian', description: 'Pale birch, soft grey and friendly geometric sans.', color: '#e9e4da', innerColor: '#bfc7c4', finish: 'Matte', surface: { texture: 'wood', strength: .25 }, typography: { fontFamily: 'Karla', fontWeight: 700, size: 18, letterSpacing: .03, transform: 'lowercase', color: '#3d4a4a', background: 'none' } },
  { id: 'botanical', name: 'Botanical', description: 'Sage linen with a floral print and gentle serif.', color: '#b8c9ac', innerColor: '#f5eedf', finish: 'Matte', surface: { texture: 'linen', strength: .45 }, typography: { fontFamily: 'Lora', fontWeight: 700, size: 20, letterSpacing: .02, transform: 'original', color: '#2f3d2b', background: '#f5eedf', blockScale: .55 }, print: 'garden' },
  { id: 'tech', name: 'Tech', description: 'Graphite carbon fibre with neon accent and grotesk type.', color: '#1d1f22', innerColor: '#00e0a4', accentColor: '#00e0a4', finish: 'Matte', surface: { texture: 'carbon-fiber', strength: .35 }, typography: { fontFamily: 'Space Grotesk', fontWeight: 700, size: 18, letterSpacing: .06, transform: 'uppercase', color: '#00e0a4', background: 'none' } },
  { id: 'apothecary', name: 'Clinical / apothecary', description: 'White board, blue accents and highly legible sans.', color: '#ffffff', innerColor: '#e6f0f7', accentColor: '#0077b6', finish: 'Matte', surface: { texture: 'none' }, typography: { fontFamily: 'IBM Plex Sans', fontWeight: 700, size: 16, letterSpacing: .01, transform: 'original', align: 'left', color: '#0b3d5c', background: 'none' } },
  { id: 'playful', name: 'Playful kids', description: 'Gingham, candy colours and rounded type.', color: '#ffd6e0', innerColor: '#a0e7e5', accentColor: '#ff6f91', finish: 'Gloss', surface: { texture: 'gingham', strength: .3 }, typography: { fontFamily: 'Quicksand', fontWeight: 700, size: 26, letterSpacing: .01, transform: 'original', color: '#ff3d7f', background: 'none' } },
  { id: 'art-deco', name: 'Art deco', description: 'Deep teal, gold fans and elegant capitals.', color: '#243e3b', innerColor: '#caac70', accentColor: '#caac70', finish: 'Soft-touch', surface: { texture: 'none' }, typography: { fontFamily: 'Cinzel', fontWeight: 700, size: 18, letterSpacing: .16, transform: 'uppercase', color: '#e7d29f', background: '#243e3b', blockScale: .5 }, print: 'deco' },
  { id: 'holographic', name: 'Holographic Y2K', description: 'Iridescent foil and clean futuristic sans.', color: '#e7e3f5', innerColor: '#c8f0ff', finish: 'Gloss', materialPreset: 'foil', surface: { texture: 'holographic', strength: .7 }, typography: { fontFamily: 'Sora', fontWeight: 700, size: 22, letterSpacing: .04, transform: 'lowercase', color: '#2a1f4d', background: 'none' } },
  { id: 'heritage', name: 'Heritage craft', description: 'Cotton stock, deep ink and classic old-style serif.', color: '#f1ead9', innerColor: '#2c3e50', accentColor: '#8b2e2e', finish: 'Matte', surface: { texture: 'cotton-paper', strength: .55 }, typography: { fontFamily: 'Libre Caslon Text', fontWeight: 700, size: 20, letterSpacing: .03, transform: 'original', color: '#2c3e50', background: 'none' } },
]


/** Patch that applies a template's physical starting point (shape, size, colours, material, finish, texture). */
export function templatePatch(template: Template, design: Design): Partial<Design> {
  return {
    category: template.category, structure: template.structure ?? 'standard', shapeParams: template.shapeParams || {}, materialPreset: template.materialPreset || 'auto',
    color: template.color, innerColor: template.innerColor, accentColor: template.accentColor, modelParts: template.modelParts || [],
    material: template.material, finish: template.finish, dimensions: { ...template.dimensions }, openTop: template.openTop ?? false, hasHandles: template.hasHandles ?? false,
    notes: template.notes, ...(template.surface ? { surface: { ...design.surface, ...template.surface } } : {}),
    ...(!design.typography ? { typography: template.typography } : {}),
  }
}

/** Patch that restyles a design: colours, finish, texture and type, keeping shape, size and copy. */
export function stylePatch(style: StylePreset, design: Design): Partial<Design> {
  const { text, subtitle } = design.typography || {}
  const starter = style.print ? PRINT_STARTERS.find(p => p.id === style.print) : undefined
  return {
    color: style.color, innerColor: style.innerColor, accentColor: style.accentColor, finish: style.finish,
    ...(style.materialPreset ? { materialPreset: style.materialPreset } : {}), ...(style.material ? { material: style.material } : {}),
    surface: { scale: 1, strength: .5, rotation: 0, ...style.surface },
    typography: { ...design.typography, blockScale: 1, ...style.typography, ...(text !== undefined ? { text } : {}), ...(subtitle !== undefined ? { subtitle } : {}) },
    artwork: starter ? { ...starter.artwork, layers: starter.artwork.layers.map(l => ({ ...l })) } : { ...getArtwork(design), enabled: false },
  }
}
