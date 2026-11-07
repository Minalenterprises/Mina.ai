# Minal.ai - Packaging Box & Bag Templates Guide

The maintained catalog, including the newest built-in 3D templates, is [templates.md](templates.md).

This document defines the structural templates, 3D geometry parameters, manufacturing specifications, and AI prompts available in the Minal.ai Realtime 3D Packaging Studio.

---

## 1. Retail Shopping Bags & Shopping Boxes

### 1.1 Classic Eurotote Shopping Bag
- **Category:** `Bag`
- **Default Dimensions:** 250 x 120 x 330 mm (Length x Depth x Height)
- **Structure:** 4-panel vertical body with top turn-over reinforcement, side gussets, sealed bottom envelope, and dual knotted rope handles.
- **Top Style:** Open-top (`openTop: true`)
- **Handles:** Dual braided cotton or satin ribbon rope handles with brass or silver eyelet grommets (`hasHandles: true`).
- **Recommended Materials:** 200-300 GSM Coated art paper, White kraft, or Natural unbleached kraft.
- **Finishes:** Matte lamination, Soft-touch velvet, Hot foil stamping, Embossed logo.
- **Best For:** Fashion boutiques, luxury jewelry, department store retail, cosmetic sets.
- **AI Prompt Example:** *"I need a luxury matte black shopping bag for Minal Enterprises with gold rope handles and an open top, 250x120x330mm"*

### 1.2 Open-Top Retail Shopping Box
- **Category:** `Carton` or `Box`
- **Default Dimensions:** 260 x 140 x 280 mm
- **Structure:** Rigid or heavy-gauge folding tray with completely open top, reinforced upper perimeter, and side ribbon or cut-out handles.
- **Top Style:** Completely open top (`openTop: true`)
- **Handles:** Side ribbon loops or reinforced rope (`hasHandles: true`).
- **Recommended Materials:** 800-1200 GSM Recycled rigid chipboard or 400 GSM FSC folding boxboard.
- **Finishes:** Soft-touch matte, Anti-scratch matte, Spot UV on typography.
- **Best For:** Gourmet food hampers, seasonal gifting, luxury apparel presentation, beauty bundles.
- **AI Prompt Example:** *"Make an open-top shopping box in dark charcoal with side ribbon handles and soft-touch finish"*

### 1.3 Kraft Boutique Shopping Bag
- **Category:** `Bag`
- **Default Dimensions:** 200 x 100 x 280 mm
- **Structure:** Natural ribbed kraft paper with serrated edge cut, twisted paper handles, side gussets.
- **Top Style:** Open-top (`openTop: true`)
- **Handles:** Twisted natural paper handles (`hasHandles: true`).
- **Recommended Materials:** 100% Recycled post-consumer kraft paperboard (120-180 GSM).
- **Finishes:** Natural unvarnished matte, water-based flexo ink.
- **Best For:** Organic groceries, artisan bakeries, eco-friendly lifestyle brands, bookstores.

---

## 2. Presentation & Rigid Gift Boxes

### 2.1 Two-Piece Lid & Base (Telescoping Box)
- **Category:** `Box`
- **Default Dimensions:** 240 x 90 x 40 mm (Spoon/Cutlery/Watch) or 200 x 200 x 80 mm (Square Gift)
- **Structure:** Heavy rigid bottom tray with a telescoping lift-off lid. Fitted die-cut insert for product immobilization.
- **Top Style:** Lift-off lid (can be opened or removed with `openTop: true`).
- **Recommended Materials:** 1.5mm-2.5mm Recycled greyboard wrapped in 157 GSM art paper.
- **Finishes:** Matte lamination, Foil stamping, Debossed branding, EVA foam or card insert.
- **Best For:** Luxury cutlery, watches, jewelry, tech gadgets, stationery collections.
- **AI Prompt Example:** *"A minimal sage green presentation box with a fitted insert for a stainless steel spoon, 240x90x40mm"*

### 2.2 Luxury Magnetic Closure Box
- **Category:** `Box`
- **Default Dimensions:** 280 x 200 x 90 mm
- **Structure:** Book-style folding box with front magnetic flap. The lid wraps around from the back to the front and clicks shut with concealed neodymium magnets.
- **Recommended Materials:** 1200 GSM Greyboard with 157 GSM coated paper wrap.
- **Finishes:** Soft-touch lamination, Gold/Silver metallic foil, Embossed front logo.
- **Best For:** High-end cosmetics, VIP influencer kits, wine accessories, luxury gifts.

### 2.3 Slide Drawer / Matchbox
- **Category:** `Box`
- **Default Dimensions:** 180 x 120 x 50 mm
- **Structure:** Outer open-ended sleeve (sheath) with an inner slide-out tray featuring a ribbon pull tab.
- **Recommended Materials:** 350 GSM Folding board for sleeve + 1.5mm rigid tray.
- **Finishes:** Contrast exterior/interior color story (e.g. black exterior, terracotta interior).
- **Best For:** Confectionery, artisanal chocolates, fine jewelry, tech accessories.

---

## 3. Folding Cartons & Product Boxes

### 3.1 Straight Tuck End (STE) Carton
- **Category:** `Carton`
- **Default Dimensions:** 60 x 45 x 150 mm
- **Structure:** Both top and bottom flaps hinge from the front panel and tuck straight into the back panel, providing a smooth, clean front display.
- **Recommended Materials:** 300-400 GSM FSC SBS (Solid Bleached Sulfate) paperboard.
- **Finishes:** Soft-touch matte, Spot UV gloss over product title, blind debossing.
- **Best For:** Skincare bottles, serums, perfume bottles, cosmetic tubes.
- **AI Prompt Example:** *"Skincare carton in warm coral with soft-touch finish and clean minimal branding, 60x45x150mm"*

### 3.2 Auto-Lock Bottom (Crash Bottom) Carton
- **Category:** `Carton`
- **Default Dimensions:** 120 x 90 x 200 mm
- **Structure:** Tuck-top with a pre-glued bottom that automatically pops into a locked base when erected. Supports heavier contents without bottom blowout.
- **Recommended Materials:** 350-450 GSM Kraft or White paperboard.
- **Best For:** Candle jars, ceramic mugs, heavy personal care bottles, vitamins.

### 3.3 Pillow Gift Box
- **Category:** `Carton`
- **Default Dimensions:** 160 x 110 x 45 mm
- **Structure:** Curved interlocking elliptical crease lines that snap into a pillow cushion shape.
- **Recommended Materials:** 300 GSM Metallized or kraft cardstock.
- **Best For:** Scarves, ties, gift cards, soap bars, delicate craft items.

---

## 4. Cylindrical Canisters & Tubes

### 4.1 Spiral-Wound Canister with Reusable Lid
- **Category:** `Canister`
- **Default Dimensions:** 90 x 90 x 140 mm (Diameter 90mm, Height 140mm)
- **Structure:** Multi-ply spiral wound paperboard cylinder with rolled rim or metal plug bottom and friction-fit lid.
- **Lining:** Optional food-safe aluminum foil or greaseproof parchment lining.
- **Recommended Materials:** Recycled kraft tube wall + food-safe inner barrier + printed outer label wrap.
- **Finishes:** Matte wrap label, gold foil stamping, rolled metal or paper curl top.
- **Best For:** Matcha powder, loose leaf tea, specialty coffee beans, spices, dry cosmetics.
- **AI Prompt Example:** *"Lavender cylindrical canister for matcha tea with a clean label and reusable lid, 90x90x140mm"*

---

## 5. E-Commerce & Subscription Mailer Boxes

### 5.1 Roll-End Tuck Front (RETF) Mailer
- **Category:** `Box`
- **Default Dimensions:** 300 x 220 x 100 mm
- **Structure:** Single sheet die-cut corrugated board with self-locking side walls and a roll-over top lid with dual front tuck tabs. No tape required for closure.
- **Recommended Materials:** E-Flute or B-Flute corrugated board with kraft or white testliner.
- **Interior:** Can be fully flood-coated with interior messaging, geometric patterns, or unboxing greetings.
- **Best For:** Direct-to-consumer e-commerce, subscription boxes, apparel shipping.

---

## 6. Realtime 3D Parameter Mapping Reference

In Minal.ai, the AI and user interact with these parameters:

| Parameter | Type | Allowed Values | Effect on 3D Scene |
|---|---|---|---|
| `category` | string | `'Box'`, `'Canister'`, `'Carton'`, `'Bag'` | Selects structural 3D geometry engine |
| `openTop` | boolean | `true`, `false` | When `true`, removes the lid/cover completely so user can inspect inside |
| `hasHandles` | boolean | `true`, `false` | When `true`, generates arched handles with metallic eyelet grommets |
| `dimensions` | object | `{ length, width, height }` (mm) | Real-world mm mapped to 3D Three.js units |
| `color` | string | Hex code (e.g. `#1e293b`) | Main packaging surface color |
| `material` | string | Rigid board, FSC paper, Kraft, etc. | Sets PBR roughness, grain, and edge highlights |
| `finish` | string | `'Matte'`, `'Soft-touch'`, `'Gloss'` | Modulates specular reflection, roughness, and metalness |
| `name` | string | Brand / Product title | Rendered directly on front and top canvas label textures |
| `logo` | string | Image data URL | Drawn onto 3D surface with aspect-ratio preservation |

---

## 7. Fast Template Switching Guide

To quickly switch between templates in the studio:
1. Click the **"Templates"** button in the studio toolbar.
2. Select any template (e.g., **Shopping Bag**, **Open Shopping Box**, **Gift Box**, **Matcha Canister**).
3. The 3D scene immediately updates in real time with the selected geometry, dimensions, and texture.
4. You can continue refining with the Gemini AI assistant (e.g. *"Make it navy blue and add Minal Enterprises in gold"*).

---

## 8. CorelDRAW (.cdr) Dieline Export Specifications

Minal.ai supports native **CorelDRAW (.cdr)** package export for professional packaging production, die-makers, and offset/flexo printers:

| Property | CorelDRAW Specification | Purpose |
|---|---|---|
| **File Format** | PKZIP 2.0 CorelDRAW Package (`.cdr`) | Compatible with CorelDRAW X4, X8, 2020-2024 |
| **Units** | 1:1 Scale Millimeters (`mm`) | Direct CAD and laser-die compatibility |
| **DieCut Layer** | Red Hairline (`#FF0000`, 0.076 mm / 0.216 pt) | Steel rule laser cutting path |
| **Crease Layer** | Cyan Dashed (`#00AEEF`, 0.076 mm, dashed) | Matrix scoring and folding rules |
| **Artwork Layer** | Full CMYK / Hex vector fills & typography | Brand graphics, titles, and logos |
| **Dimensions Layer** | Callout arrows with exact millimeter labels | Inspection and quality assurance |

### How to Export:
1. In the studio, click the **Export** button at the bottom of the workspace.
2. Select **CorelDRAW Dieline (.cdr)**.
3. The `.cdr` file downloads immediately, ready to open in CorelDRAW or send to your packaging printer.
