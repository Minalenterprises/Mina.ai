# Mina 3D packaging engine

The 3D preview (`src/components/ProductScene.tsx`) renders any shape in `src/lib/shapes.ts` with physically based materials, soft shadows, room-environment lighting and ACES tone mapping. The same shape catalogue drives the 2D dieline (`src/lib/dieline-layout.ts`) and the AI tools (`src/lib/design-tools.ts`).

## Shapes

`design.structure` holds the shape id (legacy `category` + `structure` designs still resolve through `resolveShape`).

| id | shape | parameters (`design.shapeParams`) |
|---|---|---|
| rigid-box | lid & base gift box | |
| carton | tuck-end folding carton (`openTop` → open shopping box) | |
| mailer | roll-end tuck-front mailer | |
| drawer | slide drawer / matchbox | |
| sleeve | tray with printed sleeve | |
| window | window lid box | |
| divider | four-compartment box | |
| hexagon, octagon | polygon rigid boxes | |
| prism | any regular polygon box | `sides` 3–12, `taper` |
| pyramid | square pyramid, petal opening | |
| pillow | pillow box | |
| gable | gable carry box | |
| tray | open flared tray | `taper` |
| display | counter display with header | |
| bag | gusseted shopping bag | |
| pouch | stand-up pouch | |
| sachet | flat sachet | |
| canister | paper canister | |
| tube | tube with cap and end cap | `capHeight` |
| bottle | bottle with neck and cap | `neckRatio`, `shoulder`, `capHeight` |
| jar | wide-mouth jar | `capHeight` |
| lathe | **any round object** | `profile`: `[radius 0–1, height 0–1]` points |
| extrude | **any outline** | `footprint`: `[x, z]` points in −1..1, `taper` |

`design.materialPreset`: `auto | paper | kraft | matte | soft-touch | gloss | foil | metal | clear | glass | plastic` (auto infers from `material` + `finish`).

## UI API (`src/lib/scene-api.ts`)

```ts
import { playBuild, onBuildProgress, setLidOpen } from '../lib/scene-api'

// Animated "build" of the model: parts fly in one by one, then lids/flaps fold shut.
const stop = onBuildProgress(p => cursor.moveTo(p.screen.x, p.screen.y)) // client px of the part being placed
await playBuild({ duration: 2400 })   // resolves when finished; { sceneId } targets one scene
stop()

setLidOpen(true)                      // smooth open/close without rebuilding
```

`BuildProgress` = `{ progress 0–1, part, parts, partName, screen: { x, y }, phase: 'assemble' | 'fold' | 'done', sceneId? }`.
Window events `mina:build`, `mina:build-progress`, `mina:build-done`, `mina:lid` mirror the same data.
React alternative: `<ProductScene buildKey={n} onBuildProgress={fn} sceneId="studio" />` (changing `buildKey` replays the build).

## Checks

`npm run check:ai` (tools, validation, dielines for every shape, Gemini harness), `npm run check:shapes` (headless three.js build of every shape × variant: finite geometry, sane bounds, unobstructed front print, working open/close).
