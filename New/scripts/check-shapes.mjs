// Headless geometry smoke test: builds every shape with three.js (no WebGL needed) and checks
// for NaN vertices, sane bounds, a front print facing the viewer, and working open/close motion.
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ stdin: { contents: `export * as THREE from 'three'; export * from './src/lib/scene-builders'; export * from './src/lib/shapes'; export * from './src/lib/materials'; export { newDesign } from './src/lib/types'`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'error' })
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const { THREE } = api

let checked = 0, rays = 0
for (const shape of api.SHAPES) {
  for (const variant of [{}, { openTop: true }, { hasHandles: true, productInfo: { visible: true, placement: 'back' } }, { materialPreset: 'glass' }]) {
    const design = { ...api.newDesign('shape test'), ...api.shapePatch(shape.id), dimensions: { ...shape.dimensions }, ...variant }
    const { length, width, height } = design.dimensions
    const scale = 3.6 / Math.max(length, width, height)
    const mats = api.createPackagingMaterials(design)
    const labels = []
    const ctx = { design, scale, mats, w: length * scale, h: height * scale, d: width * scale, t: Math.max(.012, 2 * scale), label: (face, w, h) => { assert.ok(w > 0 && h > 0, `${shape.id} label size`); labels.push(face); return new THREE.MeshBasicMaterial() } }
    const model = api.buildShapeModel(ctx)
    if (design.productInfo?.visible) api.addInfoPrint(ctx, model, design.productInfo.placement)
    const label = `${shape.id} ${JSON.stringify(variant)}`
    for (const t of [0, .5, 1]) {
      model.setOpen(t)
      model.root.updateMatrixWorld(true)
      model.root.traverse(o => {
        if (!o.isMesh) return
        const p = o.geometry.attributes.position
        for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), `${label}: NaN vertex in ${o.name}`)
      })
      const box = new THREE.Box3().setFromObject(model.root)
      const size = box.getSize(new THREE.Vector3())
      assert.ok(!box.isEmpty(), `${label}: empty`)
      assert.ok(size.x > .05 && size.y > .02 && size.z > .005, `${label}: degenerate ${size.toArray()}`)
      assert.ok(Math.max(size.x, size.y, size.z) < 12, `${label}: exploded bounds ${size.toArray()}`)
      if (t === 0) {
        assert.ok(box.min.y > -.08, `${label}: sinks below the floor (${box.min.y})`)
        assert.ok(box.max.y < ctx.h * 1.35 + .6, `${label}: closed model too tall (${box.max.y} vs ${ctx.h})`)
      }
    }
    // Opening must move something when the shape says it opens.
    if (model.opens) {
      model.setOpen(0); model.root.updateMatrixWorld(true)
      const closed = new THREE.Box3().setFromObject(model.root)
      model.setOpen(1); model.root.updateMatrixWorld(true)
      const open = new THREE.Box3().setFromObject(model.root)
      assert.ok(!closed.equals(open), `${label}: open state identical to closed`)
    }
    // A front print exists (except when a custom footprint has no flat front: then it moves to the lid).
    const front = []
    model.root.traverse(o => { if (o.name === 'front print') front.push(o) })
    assert.ok(front.length || labels.includes('front'), `${label}: no front print`)
    model.setOpen(0); model.root.updateMatrixWorld(true)
    for (const f of front) {
      const c = new THREE.Box3().setFromObject(f).getCenter(new THREE.Vector3())
      assert.ok(c.z > -.05 || c.y > ctx.h * .5, `${label}: front print faces away (${c.toArray()})`)
      // Nothing may hide the print from a viewer straight in front of it (lids closed).
      const ray = new THREE.Raycaster(new THREE.Vector3(c.x, c.y, 50), new THREE.Vector3(0, 0, -1))
      const hits = ray.intersectObject(model.root, true).filter(hit => hit.object.visible)
      assert.ok(hits.length, `${label}: ray missed the model`)
      const first = hits[0]; rays++
      const printHit = hits.find(hit => hit.object === f)
      assert.ok(printHit && (first.object === f || printHit.distance - first.distance < .003), `${label}: front print hidden behind ${first.object.name} (${(printHit?.distance ?? NaN) - first.distance})`)
    }
    mats.dispose()
    checked++
  }
}
console.log(`Passed: ${checked} shape variants (${rays} unobstructed front-print rays) built headlessly with finite geometry, sane bounds, front prints and working open/close.`)
