import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const bundle = await build({ stdin: { contents: `export * from './src/lib/gemini'; export * from './src/lib/design-tools'; export * from './src/lib/typography'; export * from './src/lib/fonts'; export * from './src/lib/types'; export * from './src/lib/ai-settings'; export * from './src/lib/textures'; export * from './src/lib/product-info'; export * from './src/lib/surface-validation'; export * from './src/lib/dieline-layout'; export * from './src/lib/dxf-export'; export * from './src/lib/artwork-frame'; export * from './src/lib/print-artwork'; export * from './src/lib/image-generation'`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm', plugins: [{ name: 'runtime-skill', setup(builder) { builder.onResolve({ filter: /SKILL\.md\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace('?raw', '')), namespace: 'skill' })); builder.onLoad({ filter: /.*/, namespace: 'skill' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' })) } }] })
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const initial = api.newDesign('Typography regression test')
const preview = { camera: 'front', openBox: false, autoRotate: false }
assert.equal(api.TEXTURES.length, 28)
assert.equal(api.DESIGN_TOOL_DECLARATIONS.length, 17)
assert.throws(() => api.validateSurface({ texture: 'Imaginary Material' }))
assert.throws(() => api.validateSurface({ scale: 0 }))
assert.throws(() => api.validateProductInfo({ barcode: '4006381333932' }))
assert.ok(api.validBarcode('4006381333931'))
assert.equal(api.barcodeBits('4006381333931').length, 95)
assert.equal((await api.executeDesignTool('update_surface', { texture: 'linen' }, initial, preview)).design.surface.texture, 'linen')
const information = await api.executeDesignTool('update_product_info', { visible: true, showSpecs: true, description: 'Document storage.', barcode: '4006381333931' }, initial, preview)
assert.ok(api.infoCopy(information.design).includes('240 × 90 × 40 mm'))
assert.equal((await api.executeDesignTool('set_preview', { camera: 'bottom' }, initial, preview)).preview.camera, 'bottom')
assert.equal(api.FONTS.length, 72)
const manifest = JSON.parse(await readFile('src/lib/font-manifest.json', 'utf8'))
for (const font of api.FONTS) {
  assert.ok(manifest[font.family]?.length, `${font.family} needs actual font assets`)
  for (const source of manifest[font.family]) await access(`public${source.file}`)
  await access(`public/fonts/licenses/${font.family.toLowerCase().replaceAll(' ', '')}.txt`)
}
assert.throws(() => api.validateDesignPatch({ color: 'red' }))
assert.throws(() => api.validateDesignPatch({ customCode: 'alert(1)' }))
assert.throws(() => api.validateDesignPatch({ dimensions: { width: 900 } }))
assert.throws(() => api.validateTypography({ fontFamily: 'Imaginary Font' }))
assert.throws(() => api.validateModelParts(Array(25).fill({})))
const next = api.mergeDesign(initial, api.validateDesignPatch({ dimensions: { height: 75 } }))
assert.deepEqual(next.dimensions, { length: 240, width: 90, height: 75 })
assert.equal(api.reviewDesign({ ...initial, color: '#000000', typography: { color: '#000000' } }).warnings.length, 1)
const long = 'Bill Storage Box\nAll your important documents, organized beautifully.'
const layout = api.fitText(long, 220, 90, 40, 1.18, (text, size) => text.length * size * .55)
assert.equal(layout.lines.join(' ').replaceAll(/\s+/g, ' '), long.replaceAll(/\s+/g, ' '))
assert.ok(layout.height <= 90)
assert.ok(layout.lines.every(line => line.length * layout.size * .55 <= 221))
const narrowPlaque = api.fitText('BOTANICAL\nCOLLECTION', 100, 160, 30, 1.18, (text, size) => text.length * size * .55)
assert.deepEqual(narrowPlaque.lines, ['BOTANICAL', 'COLLECTION'])
const part = { name: 'Insert', shape: 'box', size: { x: 100, y: 8, z: 50 }, position: { x: 0, y: 6, z: 0 }, color: '#fff', material: 'paper' }
assert.equal((await api.executeDesignTool('set_model_parts', { parts: [part] }, initial, preview)).design.modelParts[0].color, '#ffffff')

// Physical layout regressions: no arbitrary size clamps or invented handle holes.
const flat = api.buildDieline(initial)
const base = flat.panels.find(panel => panel.id === 'tray-base')
assert.equal(base.width, 240)
assert.equal(base.height, 90)
assert.equal(flat.panels.find(panel => panel.id === 'tray-front').height, 40)
assert.equal(flat.holes.length, 0)
const tall = api.buildDieline({ ...initial, dimensions: { length: 60, width: 30, height: 500 } })
assert.equal(tall.panels.find(panel => panel.id === 'tray-front').height, 500)
const bag = api.buildDieline({ ...initial, category: 'Bag', hasHandles: true })
assert.equal(bag.holes.length, 4)
assert.equal(api.buildDieline({ ...initial, category: 'Bag', hasHandles: false }).holes.length, 0)
for (const template of api.templates) {
  const model = { ...initial, ...template }
  const sheet = api.buildDieline(model)
  assert.ok(sheet.width > 0 && sheet.height > 0)
  for (const rule of sheet.rules) for (const [x, y] of rule.points) assert.ok(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x < sheet.width && y < sheet.height)
  for (const panel of sheet.panels.filter(p => p.artwork)) {
    const area = api.artworkFrame(model, panel)
    assert.ok(area.width > 0 && area.height > 0)
  }
}
const dxf = await api.exportToDxf(initial).text()
assert.ok(dxf.includes('$INSUNITS\\r\\n70\\r\\n4'.replaceAll('\\r', '\r').replaceAll('\\n', '\n')))
assert.ok(dxf.includes('DIECUT') && dxf.includes('CREASE') && dxf.includes('240'))
const wrongCategory = api.buildDieline({ ...initial, name: 'Bag storage box' })
assert.equal(wrongCategory.title, flat.title)

globalThis.window = {}
globalThis.localStorage = { getItem: () => JSON.stringify({ ...api.DEFAULT_SETTINGS, apiKey: 'test-key' }) }
const requests = []
const response = parts => ({ ok: true, json: async () => ({ candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }] }) })
const queue = [
  response([{ functionCall: { name: 'list_fonts', args: { query: 'Lora' } }, thoughtSignature: 'keep-this' }, { functionCall: { name: 'update_design', args: { dimensions: { height: 75 } } } }]),
  response([{ functionCall: { name: 'update_typography', args: { fontFamily: 'Imaginary Font' } } }]),
  response([{ functionCall: { name: 'update_typography', args: { fontFamily: 'Lora', text: 'Bill Storage Box', subtitle: '', align: 'center' } } }, { functionCall: { name: 'inspect_preview', args: {} } }]),
  response([{ text: 'Applied Lora and made the box deeper.' }])
]
globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return queue.shift() }
const staged = []
const result = await api.chatWithGemini([{ role: 'user', text: 'Do not make it red or black. Improve this label.' }], initial, { preview, onDesign: design => staged.push(design), capturePreview: async () => 'data:image/png;base64,dGVzdA==' })
assert.equal(result.design.color, initial.color)
assert.equal(result.design.typography.fontFamily, 'Lora')
assert.deepEqual(result.design.dimensions, next.dimensions)
assert.equal(result.tools.find(tool => tool.name === 'update_typography').status, 'error')
assert.equal(result.tools.at(-1).name, 'inspect_preview')
assert.ok(requests[0].systemInstruction.parts[0].text.includes('72 locally bundled fonts'))
assert.equal(requests[1].contents[1].parts[0].thoughtSignature, 'keep-this')
assert.ok(requests[1].contents[2].parts[0].functionResponse.response.result.length)
assert.ok(requests[3].contents.at(-1).parts.some(part => part.functionResponse?.parts?.some(image => image.inlineData) || part.inlineData))
assert.equal(requests[0].generationConfig.temperature, undefined)
assert.equal(staged.length, 2)

globalThis.fetch = async () => response([{ text: 'Red and black are both good options.' }])
const discussion = await api.chatWithGemini([{ role: 'user', text: 'red black remove top shopping bag' }], initial)
assert.equal(discussion.design, initial)
assert.equal(discussion.tools.length, 0)
globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'Rate limit reached' } }) })
await assert.rejects(() => api.chatWithGemini([{ role: 'user', text: 'red' }], initial), /request limit/)
const controller = new AbortController()
controller.abort()
await assert.rejects(() => api.chatWithGemini([{ role: 'user', text: 'black' }], initial, { signal: controller.signal }), /abort/i)
// Original artwork is validated independently from the material library.
const botanical = { enabled: true, name: 'Original vine', tileSize: 45, background: '#f4eadc', layers: [{ shape: 'path', name: 'Curved stem', path: 'M -30 45 C 40 25 -40 -25 30 -45', fill: 'none', stroke: '#53734a', strokeWidth: 1.5 }] }
const art = await api.executeDesignTool('update_artwork', botanical, initial, preview)
assert.equal(art.design.artwork.layers[0].shape, 'path')
assert.equal(art.design.surface.texture, undefined)
const resizedArt = await api.executeDesignTool('update_artwork', { tileSize: 60 }, art.design, preview)
assert.deepEqual(resizedArt.design.artwork.layers, art.design.artwork.layers)
assert.equal(resizedArt.design.color, initial.color)
assert.throws(() => api.validateArtwork({ layers: [{ shape: 'path', path: '<script>alert(1)</script>' }] }))
assert.throws(() => api.validateArtwork({ layers: [{ shape: 'path', path: 'M 1e999 0 L 0 1' }] }))
assert.throws(() => api.validateArtwork({ layers: [{ shape: 'rect', opacity: 2 }] }))
assert.throws(() => api.validateArtwork({ layers: Array(81).fill({ shape: 'leaf' }) }))
assert.throws(() => api.validateArtwork({ image: 'https://untrusted.example/image.png' }))
await assert.rejects(() => api.executeDesignTool('apply_print_design', { id: 'logo-repeat' }, initial, preview), /Upload/)
const logo = 'data:image/png;base64,dGVzdA=='
const branded = await api.executeDesignTool('apply_print_design', { id: 'logo-repeat' }, { ...initial, logo }, preview)
assert.equal(branded.design.logo, logo)
assert.equal(branded.design.artwork.layers[0].shape, 'logo')
for (const starter of api.PRINT_STARTERS) api.validateArtwork(starter.artwork)
assert.equal(api.validateTypography({ background: '#ffffff', blockScale: .4 }).blockScale, .4)
assert.throws(() => api.validateTypography({ blockScale: 0 }))
const imageRequests = []
globalThis.fetch = async (url, options) => { if (url.includes('?pageSize=')) return { ok: true, json: async () => ({ models: [{ name: 'models/gemini-2.5-flash-image', displayName: 'Flash Image', supportedGenerationMethods: ['generateContent'] }, { name: 'models/imagen-3', supportedGenerationMethods: ['predict'] }] }) }; imageRequests.push({ url, body: JSON.parse(options.body) }); return response([{ inlineData: { mimeType: 'image/png', data: 'dGVzdA==' } }]) }
const generated = await api.generateArtworkImage(art.design, { prompt: 'Original watercolor flowers', seamless: true })
assert.equal(generated.artwork.image, logo)
assert.equal(generated.artwork.layers[0].shape, 'image')
assert.equal(generated.artwork.layers[1].name, 'Curved stem')
assert.equal(api.designState(generated).artwork.hasImage, true)
assert.equal(api.designState(generated).artwork.image, undefined)
assert.notEqual(api.previewKey(generated), api.previewKey(art.design))
await api.generateArtworkImage(generated, { prompt: 'Make the petals coral', editCurrent: true })
assert.equal(imageRequests[1].body.contents[0].parts[1].inlineData.data, 'dGVzdA==')
assert.ok(imageRequests[0].url.includes('gemini-2.5-flash-image'))
assert.ok(imageRequests[0].body.contents[0].parts[0].text.includes('not photographs of packaging'))
assert.deepEqual(imageRequests[0].body.generationConfig.responseModalities, ['TEXT', 'IMAGE'])
await assert.rejects(() => api.generateArtworkImage(initial, { prompt: 'Edit it', editCurrent: true }), /missing/)
await assert.rejects(() => api.generateArtworkImage(initial, { prompt: 'Make artwork' }, controller.signal), /abort/i)
globalThis.localStorage = { getItem: () => JSON.stringify({ ...api.DEFAULT_SETTINGS, apiKey: 'test-key', imageModel: 'gemini-2.5-flash-image' }) }
globalThis.fetch = async () => response([{ text: 'No image available.' }])
await assert.rejects(() => api.generateArtworkImage(initial, { prompt: 'Create a tile' }), /no image/)
globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'Image model access denied' } }) })
await assert.rejects(() => api.generateArtworkImage(initial, { prompt: 'Create a tile' }), /model access/)
globalThis.localStorage = { getItem: () => JSON.stringify({ ...api.DEFAULT_SETTINGS, apiKey: 'test-key' }) }
// Image calls run inside the native harness, and the actual pixels are returned to the model.
const imageQueue = [response([{ functionCall: { name: 'generate_artwork_image', id: 'img-1', args: { prompt: 'Original botanical repeat' } } }]), response([{ inlineData: { mimeType: 'image/png', data: 'dGVzdA==' } }]), response([{ text: 'Applied the generated artwork.' }])]
const nativeImageRequests = []
globalThis.fetch = async (_url, options) => { if (_url.includes('?pageSize=')) return { ok: true, json: async () => ({ models: [{ name: 'models/gemini-2.5-flash-image', supportedGenerationMethods: ['generateContent'] }] }) }; nativeImageRequests.push(JSON.parse(options.body)); return imageQueue.shift() }
const imageResult = await api.chatWithGemini([{ role: 'user', text: 'Generate original artwork' }], initial)
assert.equal(imageResult.tools[0].status, 'complete')
assert.equal(imageResult.design.artwork.image, logo)
const nativeReply = nativeImageRequests[2].contents.at(-1).parts[0].functionResponse
assert.equal(nativeReply.id, 'img-1')
assert.equal(nativeReply.parts[0].inlineData.data, 'dGVzdA==')
console.log('Passed: native tools, original motifs, exact logo repeats, real image API routing, image edits/errors/cancellation, signatures, vision, no keyword edits, text fitting, and 72 licensed fonts.')
