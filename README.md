# Mina.ai - AI 3D Packaging Design Studio

Real-time 3D packaging design, procedural CAD dieline generation, and AI-assisted packaging engineering suite.

## Features

- Real-Time 3D Studio: Interactive Three.js procedural packaging engine with live 3D viewing, camera controls, dynamic material shaders, and custom Three.js code execution sandbox.
- Multi-Category Structural Packaging: Support for folding cartons, rigid boxes, canisters, shopping bags with handles, slide drawer boxes, and custom structures.
- CorelDRAW Export (.cdr): Native binary PKZIP CorelDRAW dielines with 1:1 millimeter scale, Red (#FF0000) 0.076mm hairline cut rules, and Cyan (#00AEEF) crease rules.
- AutoCAD / Laser Die Export (.dxf): Industry-standard DXF R12 dielines for CNC laser cutters, steel-rule die makers, and CAD software.
- AI Packaging Partner: Google Gemini API integration with tool use for structural adjustments, dimension calculations, colorways, and custom code generation.
- Production Templates: Built-in library of retail bags, folding cartons, luxury presentation boxes, and mailers.

## Project Structure

- `New/`: Vite + React + TypeScript 3D Packaging Studio application.
  - `New/src/pages/Studio.tsx`: Real-time studio workspace.
  - `New/src/components/ProductScene.tsx`: 3D procedural Three.js rendering engine and code sandbox.
  - `New/src/lib/gemini.ts`: Google Gemini AI assistant with tool-use.
  - `New/src/lib/cdr-export.ts`: CorelDRAW export pipeline.
  - `New/src/lib/dxf-export.ts`: AutoCAD DXF packaging CAD exporter.
  - `New/scripts/generate-cdr.ps1`: CorelDRAW COM automation engine for native binary .cdr files.
  - `New/SKILL.md`: Technical reference for Three.js packaging modeling and custom code generation.
  - `New/templets.md`: Structural dieline formulas and dimensions guide.
- `src/`: Next.js packaging platform components and routes.

## Getting Started

### 3D Packaging Studio (New)

```bash
cd New
npm install
npm run dev
```

The studio will be available at `http://localhost:5173`.

### Main Platform

```bash
npm install
npm run dev
```

Available at `http://localhost:3000`.

## Roadmap: Next Upgrades

Planned work, in rough priority order. Items get checked off as they ship.

### 1. Performance and bug fixes (first)
- [ ] Fix lag in the 3D Studio (heavy re-renders, large 3D bundle ~725 kB, slow model switching)
- [ ] Smooth, instant switching between pages, shapes and projects (no long loading)
- [ ] Fix UI bugs across the website (layout glitches, broken states, mobile issues)
- [ ] Remove third-party session-recording / tracking scripts from `New/index.html` and fix the light `theme-color`
- [ ] Visual QA pass on Home, Projects, Studio, Admin and all editor drawers

### 2. Animations and colors
- [ ] Rework transition, loading and switching animations so they feel smooth and premium
- [ ] Refresh the color palette (better contrast, nicer gradients, consistent accents)
- [ ] Wire the animated AI cursor (`mina:build-step`) to the engine's `playBuild` / `onBuildProgress` so the cursor really builds the model

### 3. Texture library (100+ textures)
- [ ] Built-in library of 100+ textures and patterns: solid colors, gradients, florals/flowers, marble, wood, kraft, linen, leather, foil, glitter, geometric, abstract, seasonal, wedding
- [ ] Import textures from free texture websites (CC0 sources such as Poly Haven, ambientCG) with search inside the Studio
- [ ] Upload your own texture or image and map it on any face
- [ ] Texture controls: scale, rotate, offset, tint, roughness, metallic

### 4. Full design editing + CorelDRAW editable export
- [ ] Every part of the design is editable: text, fonts, colors, logos, images, shapes, patterns, per-panel artwork
- [ ] Text stays real editable text in CorelDRAW (not flattened), with fonts embedded or listed
- [ ] Layers kept in the export: Cut, Crease, Bleed, Artwork, Text, so everything can be customized in CorelDRAW
- [ ] Also export editable SVG and PDF (vector) alongside .cdr and .dxf

### 5. New product categories
- [ ] 3 more box styles (e.g. magnetic closure gift box, cake/bakery box with window, shoulder-and-neck rigid box)
- [ ] Wedding cards and invitations (flat, folded, gatefold, with envelope and pocket)
- [ ] Business cards (standard, square, rounded corners, foil and emboss preview)
- [ ] Labels and stickers (round, rectangle, die-cut, bottle and jar wraps)
- [ ] More print items: hang tags, thank-you cards, flyers, box sleeves and belly bands

### 6. More features
- [ ] AI design generator: describe a product and get full artwork, colors and texture picks
- [ ] Template marketplace with ready-made designs for every category
- [ ] Photo-real mockup renders (PNG / high-res) for sharing and marketing
- [ ] Undo/redo history and autosave for every edit
- [ ] Instant price quote based on size, material, quantity and finish

### Ongoing
This roadmap is updated daily with new features and enhancements as work continues.
