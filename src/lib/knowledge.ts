// Minal AI — Packaging Design Knowledge Base
// Real materials, folds, finishes, and specifications the AI references
// to produce grounded, non-templated designs.

export interface MaterialSpec {
  name: string;
  weight: string; // gsm or pt
  use: string[]; // box types it works for
  feel: string;
  eco: "high" | "medium" | "low";
  cost: "$" | "$$" | "$$$";
  printable: boolean;
  notes: string;
}

export const MATERIALS: MaterialSpec[] = [
  { name: "Kraft (Brown)", weight: "250-400 gsm", use: ["Bag", "Pouch", "Folding Carton", "Sleeve"], feel: "Natural, matte, fibrous", eco: "high", cost: "$", printable: true, notes: "Best for organic/eco brands. Limited color fidelity due to brown base — use opaque white underprint for vivid colors." },
  { name: "SBS (Solid Bleached Sulfate)", weight: "200-400 gsm", use: ["Folding Carton", "Box", "Sleeve", "Label"], feel: "Smooth, bright white", eco: "low", cost: "$$", printable: true, notes: "Premium white substrate. Excellent color reproduction. Industry standard for retail boxes." },
  { name: "CCNB (Clay Coated Newsback)", weight: "200-350 gsm", use: ["Folding Carton", "Box"], feel: "Smooth front, gray back", eco: "medium", cost: "$", printable: true, notes: "Cheaper alternative to SBS. Good for non-food retail." },
  { name: "Corrugated E-Flute", weight: "1.5mm thick", use: ["Pizza Box", "Shipping Box", "Mailer"], feel: "Rigid, fluted", eco: "high", cost: "$", printable: true, notes: "E-flute (1.5mm) for small shippers. B-flute (3mm) for standard boxes. Double-wall for heavy items." },
  { name: "Corrugated B-Flute", weight: "3mm thick", use: ["Shipping Box", "Pizza Box", "Mailer"], feel: "Rigid, thick", eco: "high", cost: "$", printable: true, notes: "Standard shipping boxes. Good crush resistance." },
  { name: "Art Board (C1S)", weight: "250-350 gsm", use: ["Label", "Card", "Sticker", "Wedding Card"], feel: "Glossy coated one side", eco: "low", cost: "$$", printable: true, notes: "Excellent for labels and cards. Coated side takes gloss/foil well." },
  { name: "Textured Cotton", weight: "300 gsm", use: ["Wedding Card", "Invite", "Card"], feel: "Soft, tactile, premium", eco: "medium", cost: "$$$", printable: true, notes: "Letterpress-friendly. Used for luxury invitations." },
  { name: "Metallic Board", weight: "300 gsm", use: ["Label", "Card", "Box"], feel: "Shimmering, reflective", eco: "low", cost: "$$$", printable: true, notes: "Gold/silver/holographic. Best with dark ink overlays." },
  { name: "Clear PET", weight: "0.2mm", use: ["Window", "Sleeve", "Label"], feel: "Transparent, plastic", eco: "low", cost: "$$", printable: false, notes: "For box windows and clear labels. Recyclable but not biodegradable." },
  { name: "Glassine", weight: "60-90 gsm", use: ["Inner Wrap", "Pouch", "Label"], feel: "Smooth, translucent", eco: "medium", cost: "$", printable: true, notes: "Grease-resistant. Used for food inner packaging." },
  { name: "Tinplate", weight: "0.23mm", use: ["Tin", "Container"], feel: "Metallic, rigid, cold", eco: "medium", cost: "$$$", printable: true, notes: "For premium tins (tea, mints, cookies). Lithograph-printed." },
  { name: "Leatherette", weight: "1.2mm", use: ["Box (Rigid)", "Folder"], feel: "Soft, leather-like", eco: "low", cost: "$$$", printable: false, notes: "Wrapped rigid boxes for luxury goods. Foil-stamp friendly." },
];

export interface FinishSpec {
  name: string;
  description: string;
  bestFor: string[];
  cost: "$" | "$$" | "$$$";
  effect: string;
}

export const FINISHES: FinishSpec[] = [
  { name: "Matte", description: "Non-reflective, soft feel", bestFor: ["Premium", "Minimal", "Eco"], cost: "$", effect: "Subdued colors, elegant" },
  { name: "Gloss", description: "High-shine reflective coating", bestFor: ["Vibrant", "Food", "Retail"], cost: "$", effect: "Colors pop, modern" },
  { name: "Soft-touch", description: "Velvety, suede-like feel", bestFor: ["Luxury", "Cosmetics", "Premium"], cost: "$$", effect: "Tactile, sophisticated" },
  { name: "Spot-UV", description: "Selective gloss on matte background", bestFor: ["Premium", "Tech", "Nightlife"], cost: "$$", effect: "Dramatic contrast, highlights logos" },
  { name: "Foil (Gold)", description: "Hot-stamped gold metallic", bestFor: ["Luxury", "Wedding", "Gifting"], cost: "$$$", effect: "Opulent, reflective accents" },
  { name: "Foil (Silver)", description: "Hot-stamped silver metallic", bestFor: ["Tech", "Premium", "Minimal"], cost: "$$$", effect: "Modern, cool, premium" },
  { name: "Foil (Holographic)", description: "Rainbow-shifting foil", bestFor: ["Streetwear", "Youth", "Candy"], cost: "$$$", effect: "Playful, eye-catching" },
  { name: "Embossing", description: "Raised relief pressing", bestFor: ["Luxury", "Wedding", "Spirits"], cost: "$$", effect: "Tactile depth, blind or registered" },
  { name: "Debossing", description: "Sunken impression", bestFor: ["Minimal", "Luxury", "Leatherette"], cost: "$$", effect: "Subtle, sophisticated" },
  { name: "Letterpress", description: "Deep impression with ink", bestFor: ["Wedding", "Artisan", "Cotton"], cost: "$$$", effect: "Hand-crafted, textured" },
  { name: "Aqueous", description: "Water-based protective coating", bestFor: ["Food", "Retail"], cost: "$", effect: "Durable, eco-friendly" },
  { name: "Lamination (Matte)", description: "Plastic film overlay", bestFor: ["Shipping", "Reusable"], cost: "$$", effect: "Tear-resistant, water-resistant" },
];

export interface BoxStyle {
  kind: string;
  description: string;
  typicalSizes: string;
  complexity: "simple" | "medium" | "complex";
  bestFor: string[];
  foldType: string;
}

export const BOX_STYLES: BoxStyle[] = [
  { kind: "Folding Carton (Straight Tuck)", description: "Top and bottom flaps tuck into the same side", typicalSizes: "2-12 inches", complexity: "simple", bestFor: ["Retail", "Cosmetics", "Food"], foldType: "Tuck-end" },
  { kind: "Folding Carton (Reverse Tuck)", description: "Top tucks back, bottom tucks front (or vice versa)", typicalSizes: "2-12 inches", complexity: "simple", bestFor: ["Retail", "Pharma", "Food"], foldType: "Tuck-end" },
  { kind: "Folding Carton (Auto-lock Bottom)", description: "Bottom auto-assembles when popped open", typicalSizes: "3-14 inches", complexity: "medium", bestFor: ["Heavy items", "Retail", "Bottles"], foldType: "Auto-bottom" },
  { kind: "Folding Carton (Window)", description: "Die-cut window with PET insert", typicalSizes: "3-12 inches", complexity: "medium", bestFor: ["Candy", "Bakery", "Toys"], foldType: "Tuck-end + window" },
  { kind: "Rigid Box (Lift-off Lid)", description: "Two-piece set, base + lid, rigid board", typicalSizes: "3-16 inches", complexity: "complex", bestFor: ["Luxury", "Gifting", "Electronics"], foldType: "Rigid (wrapped)" },
  { kind: "Rigid Box (Hinged)", description: "Lid attached with hinge, rigid board", typicalSizes: "3-14 inches", complexity: "complex", bestFor: ["Jewelry", "Spirits", "Premium"], foldType: "Rigid + hinge" },
  { kind: "Sleeve", description: "Open-ended tube that slides over a tray or box", typicalSizes: "3-12 inches", complexity: "simple", bestFor: ["Premium", "Tea", "Cosmetics"], foldType: "Sleeve (glued or locked)" },
  { kind: "Pillow Box", description: "Curved die-cut ends, pillow shape when filled", typicalSizes: "2-8 inches", complexity: "simple", bestFor: ["Gift cards", "Candy", "Apparel"], foldType: "Pillow (die-cut)" },
  { kind: "Gable Box", description: "Roof-shaped handle, folds flat", typicalSizes: "4-10 inches", complexity: "medium", bestFor: ["Food", "Gifts", "Takeaway"], foldType: "Gable (locked handle)" },
  { kind: "Pizza Box (Corrugated)", description: "Single-piece corrugated, fold-over lid", typicalSizes: "8-18 inches", complexity: "simple", bestFor: ["Pizza", "Food delivery"], foldType: "Pizza (4-panel lid)" },
  { kind: "Mailer ( corrugated)", description: "Self-locking corrugated shipper", typicalSizes: "4-14 inches", complexity: "simple", bestFor: ["E-commerce", "Shipping"], foldType: "Mailer (auto-lock)" },
  { kind: "Bag (Pasted Valve)", description: "Valve at top for filling, pasted seams", typicalSizes: "6-20 inches", complexity: "medium", bestFor: ["Coffee", "Flour", "Bulk food"], foldType: "Valve bag" },
  { kind: "Pouch (Stand-up)", description: "Bottom gusset allows standing", typicalSizes: "4-12 inches", complexity: "medium", bestFor: ["Snacks", "Coffee", "Pet food"], foldType: "Stand-up pouch" },
  { kind: "Tin (Hinged)", description: "Metal tin with hinged lid", typicalSizes: "2-6 inches", complexity: "complex", bestFor: ["Mints", "Tea", "Cookies"], foldType: "Tin (lithographed)" },
  { kind: "Tube (Paper)", description: "Cylindrical paper tube with metal/plastic ends", typicalSizes: "2-12 inches", complexity: "complex", bestFor: ["Posters", "Cosmetics", "Tea"], foldType: "Tube (rolled)" },
];

export const COLOR_PALETTES: { name: string; colors: string[]; mood: string }[] = [
  { name: "Earthy Kraft", colors: ["#7c5e3c", "#d4a574", "#f5ebe0", "#3d2e1e"], mood: "Natural, organic, artisan" },
  { name: "Midnight Luxe", colors: ["#0a0a0b", "#1f1f23", "#c9a96e", "#f5f3ed"], mood: "Premium, sophisticated, night" },
  { name: "Soft Pastel", colors: ["#fde2e4", "#fad2e1", "#c5dedd", "#bee1e6"], mood: "Gentle, feminine, calming" },
  { name: "Bold Candy", colors: ["#ff5b3a", "#ffd166", "#06d6a0", "#118ab2"], mood: "Playful, energetic, youth" },
  { name: "Minimal Mono", colors: ["#0a0a0b", "#3d3d42", "#a0a0a8", "#f5f3ed"], mood: "Clean, modern, Swiss" },
  { name: "Forest Deep", colors: ["#1b3a2b", "#2d5a3d", "#7ba87b", "#e8e6df"], mood: "Eco, premium, grounded" },
  { name: "Sunset Glow", colors: ["#f43f5e", "#fb923c", "#fbbf24", "#fef3c7"], mood: "Warm, vibrant, summer" },
  { name: "Ocean Calm", colors: ["#0c4a6e", "#0891b2", "#67e8f9", "#ecfeff"], mood: "Fresh, clean, cool" },
  { name: "Royal Plum", colors: ["#2e1065", "#7c3aed", "#c4b5fd", "#ede9fe"], mood: "Luxurious, mysterious, evening" },
  { name: "Industrial Steel", colors: ["#1c1c1e", "#48484a", "#8e8e93", "#d1d1d6"], mood: "Tech, urban, industrial" },
];

// Build a knowledge string the AI can reference
export function knowledgeBaseString(): string {
  const mats = MATERIALS.map(
    (m) =>
      `  - ${m.name}: ${m.weight}, feel="${m.feel}", eco=${m.eco}, cost=${m.cost}, use=[${m.use.join(", ")}]. ${m.notes}`
  ).join("\n");
  const fins = FINISHES.map(
    (f) => `  - ${f.name}: ${f.description}. Best for [${f.bestFor.join(", ")}]. ${f.effect}.`
  ).join("\n");
  const styles = BOX_STYLES.map(
    (b) =>
      `  - ${b.kind}: ${b.description}. Sizes ${b.typicalSizes}, complexity=${b.complexity}, best for [${b.bestFor.join(", ")}].`
  ).join("\n");
  const palettes = COLOR_PALETTES.map(
    (p) => `  - ${p.name} (${p.mood}): ${p.colors.join(", ")}`
  ).join("\n");

  return `# PACKAGING KNOWLEDGE BASE

## Materials
${mats}

## Finishes
${fins}

## Box Styles
${styles}

## Color Palette References (use these as inspiration, NOT templates — mix and match, create new combinations)
${palettes}

# DESIGN PRINCIPLES
1. NEVER reuse the same palette or material across variants. Each variant must feel distinct.
2. Match material to product: food = kraft/SBS/glassine; luxury = SBS/leatherette/rigid; eco = kraft/recycled.
3. Match finish to mood: premium = soft-touch/foil; playful = gloss/holographic; minimal = matte/deboss.
4. Color theory: complementary for energy, analogous for harmony, monochrome for sophistication.
5. Dimensions must make physical sense: a 6" candy box is 6×4×2 (W×D×H), not 6×6×6.
6. Back panel info must be REALISTIC: actual ingredient-style copy, real-looking barcodes, plausible addresses.
7. Logo SVG should reflect the brand personality: serif for traditional, sans for modern, geometric for tech.
8. When editing, preserve the brand DNA but change ONLY what the user asked.`;
}
