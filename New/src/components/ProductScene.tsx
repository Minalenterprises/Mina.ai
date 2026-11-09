import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Box } from 'lucide-react'
import { paintLabel, paintProductInfo, prepareLabel } from '../lib/label-renderer'
import { applySurface } from '../lib/material-surface'
import { getProductInfo } from '../lib/product-info'
import { previewKey } from '../lib/design-tools'
import { createPackagingMaterials, physicalMaterial } from '../lib/materials'
import { addInfoPrint, addRopeHandles, buildShapeModel, type BuildContext, type BuiltModel, type LabelFace, type LabelOptions } from '../lib/scene-builders'
import { resolveShape } from '../lib/shapes'
import { emitScene, subscribeScene, type BuildOptions, type BuildProgress } from '../lib/scene-api'
import type { Design, PreviewSettings } from '../lib/types'

type Props = {
  design: Design
  openBox?: boolean
  autoRotate?: boolean
  resetKey?: number
  cameraView?: PreviewSettings['camera']
  projection?: 'perspective' | 'orthographic'
  /** Identifies this scene for `playBuild({ sceneId })` / `setLidOpen(open, sceneId)`. */
  sceneId?: string
  /** Changing this number plays the assemble animation (alternative to `playBuild`). */
  buildKey?: number
  /** Per-frame progress of the assemble animation, including the screen point of the part being placed. */
  onBuildProgress?: (progress: BuildProgress) => void
  /** Decorative props (sphere / cylinder) beside the product. Default true. */
  showProps?: boolean
}

type Label = { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; face: LabelFace; fill?: string }
type Part = { wrapper: THREE.Group; offset: THREE.Vector3; center: THREE.Vector3; name: string }
type Model = { key: string; built: BuiltModel; root: THREE.Group; parts: Part[]; labelsReady: boolean; bounds: THREE.Box3; dispose: () => void }
type BuildRun = { id?: number; start: number; duration: number; closeAtEnd?: boolean; settleTarget: number }
type Engine = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  perspective: THREE.PerspectiveCamera
  orthographic: THREE.OrthographicCamera
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  controls: OrbitControls
  sun: THREE.DirectionalLight
  ground: THREE.Mesh
  props: THREE.Object3D[]
  model?: Model
  open: { current: number; target: number }
  build?: BuildRun
  view: { cameraView: PreviewSettings['camera']; projection: 'perspective' | 'orthographic' }
  needsRender: boolean
  /** Only the camera moved (orbit, zoom, auto-rotate): redraw the frame but reuse the cached shadow map. */
  cameraDirty?: boolean
  resize: () => void
}

const easeOutBack = (x: number) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }

export default function ProductScene({ design, openBox = true, autoRotate = false, resetKey = 0, cameraView = 'perspective', projection = 'perspective', sceneId, buildKey, onBuildProgress, showProps = true }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const designRef = useRef(design)
  const progressRef = useRef(onBuildProgress)
  const sceneIdRef = useRef(sceneId)
  const buildRef = useRef<((options: BuildOptions & { id?: number }) => void) | null>(null)
  const [failed, setFailed] = useState(false)
  const modelKey = useMemo(() => previewKey(design), [design])
  const geometryKey = useMemo(() => JSON.stringify([resolveShape(design), design.dimensions, design.openTop, design.shapeParams, design.wallThickness, design.cornerRadius, design.hasHandles, !!design.customCode, design.modelParts?.length || 0]), [design])

  useEffect(() => { designRef.current = design; progressRef.current = onBuildProgress; sceneIdRef.current = sceneId })

  // ------------------------------------------------------------------ renderer (created once)
  useEffect(() => {
    const container = host.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    } catch {
      requestAnimationFrame(() => setFailed(true))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // The light is fixed to the product, so the shadow map only changes when the model or its animation does.
    // Re-rendering it on every orbit frame was the biggest cost while dragging.
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('role', 'img')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, .04)
    scene.environment = env.texture
    scene.environmentIntensity = .85

    const sun = new THREE.DirectionalLight(0xfff6ea, 2.1)
    sun.position.set(-3.2, 7, 4.6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.bias = -.0003
    sun.shadow.normalBias = .02
    sun.shadow.radius = 6
    scene.add(sun, sun.target)
    const fill = new THREE.DirectionalLight(0xe9eaff, .55); fill.position.set(4, 3, -4); scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, .7); rim.position.set(0, 4, -7); scene.add(rim)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .2 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -.002
    ground.receiveShadow = true
    scene.add(ground)

    const propMat = (color: string) => physicalMaterial({ color, preset: 'soft-touch' })
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.3, 48, 32), propMat('#d0c3df')); ball.position.set(-2.5, .3, .85)
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .45, 48), propMat('#edd0b6')); cyl.position.set(2.1, .225, -1.1)
    for (const prop of [ball, cyl]) { prop.castShadow = true; prop.receiveShadow = true; scene.add(prop) }

    const perspective = new THREE.PerspectiveCamera(32, 1, .05, 100)
    perspective.position.set(5.5, 5.8, 7.1)
    const orthographic = new THREE.OrthographicCamera(-4, 4, 4, -4, .01, 100)
    const controls = new OrbitControls(perspective, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = .07
    controls.enablePan = false
    controls.autoRotateSpeed = .6
    controls.target.set(0, .65, 0)

    const engine: Engine = {
      renderer, scene, perspective, orthographic, camera: perspective, controls, sun, ground, props: [ball, cyl],
      open: { current: 1, target: 1 }, view: { cameraView: 'perspective', projection: 'perspective' }, needsRender: true,
      resize: () => {
        const width = container.clientWidth, height = container.clientHeight
        if (!width || !height) return
        renderer.setSize(width, height)
        perspective.aspect = width / height
        perspective.updateProjectionMatrix()
        const size = engine.model ? engine.model.bounds.getSize(new THREE.Vector3()) : new THREE.Vector3(4, 4, 4)
        const top = engine.view.cameraView === 'top' || engine.view.cameraView === 'bottom'
        const vertical = top ? size.z : size.y
        const horizontal = engine.view.cameraView === 'front' || engine.view.cameraView === 'back' || top ? size.x : Math.max(size.x, size.z)
        const half = Math.max(vertical / 2, horizontal / (width / height) / 2, .2) * 1.18
        orthographic.left = -half * width / height; orthographic.right = half * width / height
        orthographic.top = half; orthographic.bottom = -half
        orthographic.updateProjectionMatrix()
        engine.needsRender = true
      },
    }
    engineRef.current = engine
    controls.addEventListener('change', () => { engine.cameraDirty = true })
    // Render at lower resolution while orbiting, then restore full sharpness once the model is still.
    const fullRatio = Math.min(window.devicePixelRatio || 1, 2)
    let restoreTimer = 0
    const setRatio = (ratio: number) => {
      if (renderer.getPixelRatio() === ratio) return
      renderer.setPixelRatio(ratio)
      engine.resize()
    }
    controls.addEventListener('start', () => { window.clearTimeout(restoreTimer); if (fullRatio > 1) setRatio(1) })
    controls.addEventListener('end', () => { window.clearTimeout(restoreTimer); restoreTimer = window.setTimeout(() => setRatio(fullRatio), 350) })
    const observer = new ResizeObserver(engine.resize)
    observer.observe(container)
    engine.resize()

    let visible = true
    const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; engine.needsRender = true })
    intersection.observe(container)
    const onLost = (event: Event) => event.preventDefault()
    const onRestored = () => { engine.needsRender = true }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.domElement.addEventListener('webglcontextrestored', onRestored)

    const startBuild = (options: BuildOptions & { id?: number }) => {
      if (!engine.model) return
      engine.build = { id: options.id, start: performance.now(), duration: Math.max(400, options.duration ?? 2200), closeAtEnd: options.closeAtEnd, settleTarget: options.closeAtEnd ? 0 : engine.open.target }
      engine.open.current = engine.model.built.opens ? 1 : engine.open.target
      engine.model.built.setOpen(engine.open.current)
      engine.needsRender = true
    }
    const offBuild = subscribeScene('build', detail => { if (!detail.sceneId || detail.sceneId === sceneIdRef.current) startBuild(detail as BuildOptions & { id?: number }) })
    const offLid = subscribeScene('lid', detail => { if (!detail.sceneId || detail.sceneId === sceneIdRef.current) { engine.open.target = detail.open ? 1 : 0; engine.needsRender = true } })
    buildRef.current = startBuild

    const projectPart = (part: Part) => {
      const world = part.center.clone().applyMatrix4(part.wrapper.matrixWorld)
      const ndc = world.project(engine.camera)
      const rect = renderer.domElement.getBoundingClientRect()
      return { x: rect.left + (ndc.x + 1) / 2 * rect.width, y: rect.top + (1 - ndc.y) / 2 * rect.height }
    }

    let frame = 0, last = performance.now()
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(.05, (now - last) / 1000); last = now
      if (!visible) return
      const model = engine.model
      let animating = false
      if (model && engine.build) {
        const run = engine.build
        const raw = (now - run.start) / run.duration
        const assembleEnd = model.built.opens ? .72 : 1
        const p = Math.min(1, raw / assembleEnd)
        const n = model.parts.length, span = Math.min(.55, 2.2 / Math.max(1, n))
        let current = 0
        if (raw < assembleEnd && model.built.opens) engine.open.target = 1
        model.parts.forEach((part, i) => {
          const start = n > 1 ? (i / (n - 1)) * (1 - span) : 0
          const q = Math.min(1, Math.max(0, (p - start) / span))
          if (q > 0) current = i
          part.wrapper.visible = q > 0
          const e = easeOutBack(q)
          part.wrapper.position.copy(part.offset).multiplyScalar(1 - Math.min(1, e))
          part.wrapper.scale.setScalar(Math.max(.001, Math.min(1.05, .35 + .65 * e)))
        })
        if (raw >= assembleEnd) engine.open.target = run.settleTarget
        const phase: BuildProgress['phase'] = raw >= 1 ? 'done' : raw >= assembleEnd ? 'fold' : 'assemble'
        const part = model.parts[Math.min(current, n - 1)]
        if (part) {
          const detail: BuildProgress = { sceneId: sceneIdRef.current, progress: Math.min(1, raw), part: current, parts: n, partName: part.name, screen: projectPart(part), phase }
          progressRef.current?.(detail)
          emitScene('progress', detail)
        }
        if (raw >= 1 && Math.abs(engine.open.current - engine.open.target) < .002) {
          model.parts.forEach(part => { part.wrapper.visible = true; part.wrapper.position.set(0, 0, 0); part.wrapper.scale.setScalar(1) })
          emitScene('done', { id: run.id, sceneId: sceneIdRef.current })
          engine.build = undefined
        }
        animating = true
      }
      const open = engine.open
      if (Math.abs(open.current - open.target) > .0005) {
        open.current += (open.target - open.current) * (1 - Math.exp(-dt * (engine.build ? 4.5 : 6)))
        if (Math.abs(open.current - open.target) < .002) open.current = open.target
        model?.built.setOpen(open.current)
        animating = true
      }
      const moved = controls.update()
      if (moved || animating || engine.needsRender || engine.cameraDirty) {
        if (animating || engine.needsRender) renderer.shadowMap.needsUpdate = true
        engine.needsRender = false
        engine.cameraDirty = false
        renderer.render(scene, engine.camera)
        const canvas = renderer.domElement
        if (model?.labelsReady) canvas.dataset.designKey = model.key
        canvas.dataset.cameraView = engine.view.cameraView
        if (open.current === open.target) canvas.dataset.openBox = String(open.target === 1)
        else delete canvas.dataset.openBox
      }
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      offBuild(); offLid()
      window.clearTimeout(restoreTimer); observer.disconnect(); intersection.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored)
      controls.dispose()
      engine.model?.dispose()
      engine.model = undefined
      ground.geometry.dispose(); (ground.material as THREE.Material).dispose()
      for (const prop of [ball, cyl]) { prop.geometry.dispose(); (prop.material as THREE.Material).dispose() }
      env.dispose(); room.dispose(); pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      engineRef.current = null
    }
  }, [])

  // ------------------------------------------------------------------ model (rebuilt when the design changes)
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const design = designRef.current
    const { renderer, scene } = engine
    const longest = Math.max(design.dimensions.length, design.dimensions.width, design.dimensions.height)
    const scale = 3.6 / longest
    const mats = createPackagingMaterials(design)
    const surfaceTexture = applySurface(mats.main, design, scale)
    const labels: Label[] = []
    const labelMaterials: THREE.Material[] = []
    const ctx: BuildContext = {
      design, scale, mats,
      w: design.dimensions.length * scale, h: design.dimensions.height * scale, d: design.dimensions.width * scale,
      t: Math.max(.012, (design.wallThickness ?? 2) * scale),
      label: (face, width, height, options?: LabelOptions) => {
        const canvas = document.createElement('canvas')
        const max = face === 'front' ? 2048 : 1024, ratio = Math.max(.05, Math.min(20, width / Math.max(height, 1e-6)))
        canvas.width = Math.max(16, Math.round(ratio >= 1 ? max : max * ratio))
        canvas.height = Math.max(16, Math.round(ratio >= 1 ? max / ratio : max))
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        labels.push({ canvas, texture, face, fill: options?.fill })
        const material = new THREE.MeshPhysicalMaterial({ map: texture, transparent: !options?.fill, roughness: Math.max(.25, mats.main.roughness), clearcoat: mats.main.clearcoat, clearcoatRoughness: .2, depthWrite: !!options?.fill, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: options?.side ?? THREE.FrontSide })
        labelMaterials.push(material)
        return material
      },
    }

    let built: BuiltModel
    let root = new THREE.Group()
    if (design.customCode && design.customCode.trim().length > 15) {
      try {
        const product = new THREE.Group()
        const rounded = (x: number, y: number, z: number, material: THREE.Material, radius = .035) => { const m = new THREE.Mesh(new RoundedBoxGeometry(x, y, z, 3, Math.min(radius, x / 2.1, y / 2.1, z / 2.1)), material); m.castShadow = m.receiveShadow = true; return m }
        const labelMaterial = ctx.label('front', ctx.w * .85, ctx.h * .7)
        const addTopLabel = (parent: THREE.Object3D, width: number, depth: number, y: number) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(width * .93, depth * .9), ctx.label('lid', width * .93, depth * .9)); l.rotation.x = -Math.PI / 2; l.position.y = y; parent.add(l) }
        new Function('THREE', 'product', 'context', `"use strict";\n${design.customCode}`)(THREE, product, {
          w: ctx.w, h: ctx.h, d: ctx.d, scale, color: new THREE.Color(design.color), mainMaterial: mats.main, innerMaterial: mats.inner, edgeMaterial: mats.edge, handleMaterial: mats.accent, metalGrommet: mats.metal, labelMaterial, rounded,
          openBox: engine.open.target === 1, isOpenTop: !!design.openTop, hasHandles: !!design.hasHandles, addBagHandles: (parent: THREE.Object3D, bw: number, bh: number, bd: number) => addRopeHandles(ctx, parent, bw, bh, bd), addTopLabel, scene, camera: engine.camera, controls: engine.controls,
        })
        product.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true } })
        root = product
        built = { root, setOpen: () => {}, opens: false, info: { bottom: { width: ctx.w, depth: ctx.d } } }
      } catch (error) {
        console.warn('Custom 3D code failed; falling back to the procedural engine.', error)
        root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
        built = buildShapeModel(ctx)
        root = built.root
      }
    } else {
      built = buildShapeModel(ctx)
      root = built.root
    }

    for (const part of design.modelParts || []) {
      const { x, y, z } = part.size
      const geometry = part.shape === 'box' ? new RoundedBoxGeometry(x * scale, y * scale, z * scale, 2, Math.min(x, y, z) * scale * .06) : part.shape === 'cylinder' ? new THREE.CylinderGeometry(x * scale / 2, x * scale / 2, y * scale, 64) : new THREE.SphereGeometry(.5, 48, 32)
      const material = physicalMaterial({ color: part.color, preset: part.material === 'glass' ? 'glass' : part.material === 'metal' ? 'metal' : 'paper', finish: design.finish, side: part.material === 'glass' ? THREE.DoubleSide : THREE.FrontSide })
      const m = new THREE.Mesh(geometry, material)
      if (part.shape === 'sphere') m.scale.set(x * scale, y * scale, z * scale)
      if (part.shape === 'cylinder') m.scale.z = z / x
      m.position.set(part.position.x * scale, part.position.y * scale, part.position.z * scale)
      if (part.rotation) m.rotation.set(THREE.MathUtils.degToRad(part.rotation.x), THREE.MathUtils.degToRad(part.rotation.y), THREE.MathUtils.degToRad(part.rotation.z))
      m.name = part.name
      m.castShadow = m.receiveShadow = true
      root.add(m)
    }
    const info = getProductInfo(design)
    if (info.visible) addInfoPrint(ctx, built, info.placement)

    // Bounds cover both the open and closed state so the camera never clips a moving lid.
    built.setOpen(1); root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(root)
    built.setOpen(0); root.updateMatrixWorld(true)
    bounds.union(new THREE.Box3().setFromObject(root))
    built.setOpen(engine.open.current)

    // Every top-level part gets an identity wrapper the assemble animation can move freely.
    const center = bounds.getCenter(new THREE.Vector3())
    const parts: Part[] = root.children.slice().map(child => {
      const wrapper = new THREE.Group()
      root.remove(child); wrapper.add(child); root.add(wrapper)
      const box = new THREE.Box3().setFromObject(child)
      const partCenter = box.isEmpty() ? center.clone() : box.getCenter(new THREE.Vector3())
      const away = partCenter.clone().sub(center); away.y = Math.max(0, away.y)
      const offset = (away.lengthSq() > 1e-6 ? away.normalize() : new THREE.Vector3(0, 0, 1)).multiplyScalar(1.1).add(new THREE.Vector3(0, 1.6, 0))
      return { part: { wrapper, offset, center: partCenter, name: child.name || 'part' }, minY: box.isEmpty() ? 0 : box.min.y }
    }).sort((a, b) => a.minY - b.minY).map(entry => entry.part)
    root.rotation.y = engine.view.cameraView === 'perspective' && engine.view.projection === 'perspective' ? -.24 : 0

    scene.add(root)
    let disposed = false
    const model: Model = {
      key: previewKey(design), built, root, parts, labelsReady: false, bounds,
      dispose: () => {
        disposed = true
        scene.remove(root)
        const materials = new Set<THREE.Material>()
        root.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)) } })
        materials.forEach(m => m.dispose())
        labelMaterials.forEach(m => m.dispose())
        labels.forEach(l => l.texture.dispose())
        surfaceTexture?.dispose()
        mats.dispose()
      },
    }
    const previous = engine.model
    engine.model = model
    previous?.dispose()
    renderer.domElement.setAttribute('aria-label', `Interactive 3D preview of ${design.name}. Drag to rotate and scroll to zoom.`)
    delete renderer.domElement.dataset.labelError
    engine.needsRender = true

    const paint = (logo?: HTMLImageElement) => {
      for (const label of labels) {
        if (label.face === 'info') paintProductInfo(label.canvas, design)
        else if (label.fill) {
          const art = document.createElement('canvas'); art.width = label.canvas.width; art.height = label.canvas.height
          paintLabel(art, { ...design, color: label.fill }, label.face, logo)
          const g = label.canvas.getContext('2d')!
          g.fillStyle = label.fill; g.fillRect(0, 0, label.canvas.width, label.canvas.height); g.drawImage(art, 0, 0)
        } else paintLabel(label.canvas, design, label.face, logo)
        label.texture.needsUpdate = true
      }
      model.labelsReady = true
      engine.needsRender = true
    }
    Promise.all([prepareLabel(design), surfaceTexture?.userData.ready]).then(([logo]) => { if (!disposed) paint(logo) }).catch(error => {
      if (disposed) return
      renderer.domElement.dataset.labelError = error instanceof Error ? error.message : 'The selected font or print artwork could not load.'
      paint()
    })
    return () => { if (engine.model === model) { model.dispose(); engine.model = undefined } }
  }, [modelKey])

  // ------------------------------------------------------------------ camera framing
  useEffect(() => {
    const engine = engineRef.current
    if (!engine?.model) return
    const { controls, perspective, orthographic, sun, ground, props } = engine
    engine.view = { cameraView, projection }
    const camera = projection === 'orthographic' ? orthographic : perspective
    engine.camera = camera
    controls.object = camera
    const bounds = engine.model.bounds
    const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z)
    const distance = Math.max(3.3, radius * 1.55)
    const offset = cameraView === 'front' ? new THREE.Vector3(0, 0, distance * 1.35) : cameraView === 'back' ? new THREE.Vector3(0, 0, -distance * 1.35) : cameraView === 'bottom' ? new THREE.Vector3(0, -distance * 1.35, .001) : cameraView === 'top' ? new THREE.Vector3(0, distance * 1.35, .001) : new THREE.Vector3(distance * .78, distance * .72, distance)
    controls.target.copy(center)
    camera.position.copy(center).add(offset)
    camera.lookAt(center)
    controls.minDistance = Math.max(1.2, radius * .6)
    controls.maxDistance = distance * 4
    controls.maxPolarAngle = cameraView === 'bottom' ? Math.PI : Math.PI / 2 - .02
    controls.enableRotate = projection === 'perspective'
    engine.model.root.rotation.y = cameraView === 'perspective' && projection === 'perspective' ? -.24 : 0
    const s = radius * 1.4 + 1
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s
    sun.shadow.camera.far = 40
    sun.position.copy(center).add(new THREE.Vector3(-3.2, 7, 4.6))
    sun.target.position.copy(center)
    sun.shadow.camera.updateProjectionMatrix()
    const decorative = projection === 'perspective' && cameraView !== 'bottom'
    ground.visible = decorative
    props.forEach((p, i) => { p.visible = decorative && showProps; p.position.x = (i ? 1 : -1) * Math.max(i ? 2.1 : 2.5, size.x / 2 + .7) })
    controls.update()
    engine.resize()
  }, [geometryKey, cameraView, projection, resetKey, showProps])

  const firstOpen = useRef(true)
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.open.target = openBox ? 1 : 0
    // The first render starts in the requested state instead of animating into it.
    if (firstOpen.current) { firstOpen.current = false; engine.open.current = engine.open.target; engine.model?.built.setOpen(engine.open.current) }
    engine.needsRender = true
  }, [openBox])
  useEffect(() => { const engine = engineRef.current; if (engine) { engine.controls.autoRotate = projection === 'perspective' && autoRotate; engine.cameraDirty = true } }, [autoRotate, projection])
  useEffect(() => {
    if (!buildKey) return
    buildRef.current?.({})
  }, [buildKey])

  return (
    <div className="product-scene" ref={host} data-shape={resolveShape(design)}>
      {failed && (
        <div className="scene-fallback">
          <Box size={50} strokeWidth={1} />
          <h3>A different perspective.</h3>
          <p>This device couldn’t start WebGL. Your design is safe — switch to the 2D view to explore it.</p>
        </div>
      )}
    </div>
  )
}
