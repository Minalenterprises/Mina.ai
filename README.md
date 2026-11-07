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
