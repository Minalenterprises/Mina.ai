import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { Box } from 'lucide-react'
import { paintLabel, paintProductInfo, prepareLabel } from '../lib/label-renderer'
import { applySurface } from '../lib/material-surface'
import { getProductInfo } from '../lib/product-info'
import { previewKey } from '../lib/design-tools'
import type { Design, PreviewSettings } from '../lib/types'

type Props = { design: Design; openBox?: boolean; autoRotate?: boolean; resetKey?: number; cameraView?: PreviewSettings['camera']; projection?: 'perspective' | 'orthographic' }

export default function ProductScene({ design, openBox = true, autoRotate = false, resetKey = 0, cameraView = 'perspective', projection = 'perspective' }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!host.current) return
    const container = host.current
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      requestAnimationFrame(() => setFailed(true))
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.85
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-label', `Interactive 3D preview of ${design.name}. Drag to rotate and scroll to zoom.`)
    renderer.domElement.setAttribute('role', 'img')

    const scene = new THREE.Scene()
    const camera = projection === 'orthographic' ? new THREE.OrthographicCamera(-4, 4, 4, -4, .01, 100) : new THREE.PerspectiveCamera(33, 1, .1, 100)
    camera.position.set(5.5, 5.8, 7.1)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.minDistance = 3.2
    controls.maxDistance = 18
    controls.maxPolarAngle = cameraView === 'bottom' ? Math.PI : Math.PI / 2
    controls.enablePan = false
    controls.enableRotate = projection === 'perspective'
    controls.autoRotate = projection === 'perspective' && autoRotate
    controls.autoRotateSpeed = 0.55
    controls.target.set(0, 0.65, 0)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04)
    scene.environment = env.texture

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const sun = new THREE.DirectionalLight(0xfffaf0, 1.8)
    sun.position.set(-3, 7, 5)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -6
    sun.shadow.camera.right = 6
    sun.shadow.camera.top = 6
    sun.shadow.camera.bottom = -6
    sun.shadow.bias = -0.0002
    sun.shadow.normalBias = 0.035
    sun.shadow.radius = 4
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0xe7e4ff, 0.9)
    fill.position.set(4, 3, -5)
    scene.add(fill)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#eeefe8', roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.035
    ground.receiveShadow = true
    ground.visible = cameraView !== 'bottom' && projection !== 'orthographic'
    scene.add(ground)
    scene.fog = new THREE.Fog('#eeefe8', 12, 28)

    const product = new THREE.Group()
    product.rotation.y = cameraView === 'perspective' && projection !== 'orthographic' ? -.24 : 0
    scene.add(product)

    const color = new THREE.Color(design.color)
    const mainMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: design.finish === 'Gloss' ? 0.22 : design.finish === 'Soft-touch' ? 0.92 : 0.72,
      metalness: 0.01,
      side: THREE.DoubleSide
    })
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: design.innerColor ? new THREE.Color(design.innerColor) : color.clone().lerp(new THREE.Color('#ffffff'), 0.32),
      roughness: 0.95,
      side: THREE.DoubleSide
    })
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.89),
      roughness: 0.8
    })
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: design.accentColor ? new THREE.Color(design.accentColor) : color.clone().multiplyScalar(0.4).lerp(new THREE.Color('#222222'), 0.5),
      roughness: 0.7,
      metalness: 0.1
    })
    const metalGrommet = new THREE.MeshStandardMaterial({
      color: '#d4af37', // Gold / brass grommet
      metalness: 0.85,
      roughness: 0.25
    })

    const longest = Math.max(design.dimensions.length, design.dimensions.width, design.dimensions.height)
    const scale = 3.6 / longest
    const w = design.dimensions.length * scale
    const d = design.dimensions.width * scale
    const h = design.dimensions.height * scale

    const surfaceTexture = applySurface(mainMaterial, design, scale)

    const rounded = (x: number, y: number, z: number, material: THREE.Material, radius = 0.035) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(x, y, z, 3, Math.min(design.cornerRadius === undefined ? radius : design.cornerRadius * scale, x / 5, y / 5, z / 5)), material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    // Each printed face has its own physical aspect ratio, never a stretched shared texture.
    let disposed = false
    let labelReady = false
    let logo: HTMLImageElement | undefined
    const labels: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; face: 'front' | 'lid' | 'info' }[] = []
    const makeLabelMaterial = (width: number, height: number, face: 'front' | 'lid' | 'info' = 'front') => {
      const canvas = document.createElement('canvas')
      const ratio = width / height
      canvas.width = Math.round(ratio >= 1 ? 2048 : 2048 * ratio)
      canvas.height = Math.round(ratio >= 1 ? 2048 / ratio : 2048)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy())
      labels.push({ canvas, texture, face })
      return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1 })
    }
    const labelMaterial = makeLabelMaterial(w * .85, h * .7)
    Promise.all([prepareLabel(design), surfaceTexture?.userData.ready]).then(([image]) => {
      if (disposed) return
      logo = image
      labels.forEach(label => { if (label.face === 'info') paintProductInfo(label.canvas, design); else paintLabel(label.canvas, design, label.face, logo); label.texture.needsUpdate = true })
      labelReady = true
    }).catch(error => {
      if (disposed) return
      renderer.domElement.dataset.labelError = error instanceof Error ? error.message : 'The selected font or print artwork could not load.'
      labels.forEach(label => { if (label.face === 'info') paintProductInfo(label.canvas, design); else paintLabel(label.canvas, design, label.face); label.texture.needsUpdate = true })
      labelReady = true
    })

    const addTopLabel = (parent: THREE.Object3D, width: number, depth: number, y: number) => {
      const label = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.93, depth * 0.9), makeLabelMaterial(width * .93, depth * .9, 'lid'))
      label.rotation.x = -Math.PI / 2
      label.position.y = y
      parent.add(label)
    }

    // Explicit design properties control geometry.
    const isOpenTop = design.openTop ?? false
    const isBag = design.category === 'Bag'
    const hasHandles = design.hasHandles ?? isBag

    const addBagHandles = (parent: THREE.Object3D, bagW: number, bagH: number, bagD: number) => {
      const spread = Math.min(bagW * .23, 75 * scale)
      const rise = Math.min(bagW * .25, Math.max(bagH * .25, 28 * scale))
      const anchorY = bagH - Math.min(bagH * .14, 12 * scale)
      const cord = Math.min(bagW * .009, 2 * scale)
      for (const sign of [-1, 1]) {
        const faceZ = sign * (bagD / 2 + cord * 1.8)
        const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-spread, anchorY, faceZ), new THREE.Vector3(-spread * 1.25, bagH + rise * 1.4, faceZ + sign * rise * .25), new THREE.Vector3(spread * 1.25, bagH + rise * 1.4, faceZ + sign * rise * .25), new THREE.Vector3(spread, anchorY, faceZ))
        const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, cord, 10, false), handleMaterial)
        rope.castShadow = true
        parent.add(rope)
        for (const x of [-spread, spread]) {
          const eyelet = new THREE.Mesh(new THREE.TorusGeometry(cord * 2.2, cord * .55, 12, 24), metalGrommet)
          eyelet.position.set(x, anchorY, sign * (bagD / 2 + cord * 1.3))
          parent.add(eyelet)
        }
      }
    }

    // Custom AI 3D Code Execution
    let customRendered = false
    if (design.customCode && design.customCode.trim().length > 15) {
      try {
        const customBuilder = new Function(
          'THREE',
          'product',
          'context',
          `"use strict";\n${design.customCode}`
        )
        customBuilder(THREE, product, {
          w,
          h,
          d,
          scale,
          color,
          mainMaterial,
          innerMaterial,
          edgeMaterial,
          handleMaterial,
          metalGrommet,
          labelMaterial,
          rounded,
          openBox,
          isOpenTop,
          hasHandles,
          addBagHandles,
          addTopLabel,
          controls,
          scene,
          camera
        })
        customRendered = true
      } catch (err) {
        console.warn('Custom 3D code execution error, falling back to procedural engine:', err)
        product.traverse(object => {
          if (object instanceof THREE.Mesh) object.geometry.dispose()
        })
        product.clear()
        customRendered = false
      }
    }

    if (!customRendered) {
      const structure = design.category === 'Box' ? design.structure : 'standard'
      if (structure === 'hexagon') {
        const radius = Math.min(w, d) * 0.5
        const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 6, 1, true), mainMaterial)
        body.position.y = h / 2
        body.rotation.y = Math.PI / 6
        body.castShadow = true
        product.add(body)
        const liner = new THREE.Mesh(new THREE.CylinderGeometry(radius - (design.wallThickness ?? 2) * scale, radius - (design.wallThickness ?? 2) * scale, h - .02, 6, 1, true), innerMaterial)
        liner.position.y = h / 2
        liner.rotation.y = Math.PI / 6
        product.add(liner)
        const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.05, 6), innerMaterial)
        floor.position.y = 0.03
        floor.rotation.y = Math.PI / 6
        product.add(floor)
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.01, radius * 1.01, 0.045, 6, 1, true), edgeMaterial)
        rim.position.y = h - 0.02
        rim.rotation.y = Math.PI / 6
        product.add(rim)
        const frontPrint = new THREE.Mesh(new THREE.PlaneGeometry(radius * .86, h * .7), makeLabelMaterial(radius * .86, h * .7))
        frontPrint.position.set(0, h / 2, radius * Math.cos(Math.PI / 6) + .005)
        product.add(frontPrint)
        if (!isOpenTop) {
          const lid = new THREE.Group()
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.055, radius * 1.055, 0.14, 6), mainMaterial)
          cap.castShadow = true
          cap.rotation.y = Math.PI / 6
          lid.add(cap)
          addTopLabel(lid, radius * 1.25, radius * 1.25, 0.077)
          lid.position.set(0, openBox ? h + 0.55 : h + 0.07, openBox ? -d * 0.35 : 0)
          product.add(lid)
        }
      } else if (structure === 'drawer') {
        const thick = design.wallThickness === undefined ? 0.05 : design.wallThickness * scale
        const addPanel = (x: number, y: number, z: number, px: number, py: number, pz: number, material: THREE.Material, parent = product) => {
          const mesh = rounded(x, y, z, material, 0.012)
          mesh.position.set(px, py, pz)
          parent.add(mesh)
        }
        addPanel(w + thick, thick, d + thick, 0, h + thick / 2, 0, mainMaterial)
        addPanel(w + thick, thick, d + thick, 0, -thick / 2, 0, mainMaterial)
        for (const z of [-d / 2, d / 2]) addPanel(w + thick, h, thick, 0, h / 2, z, mainMaterial)
        const frontPrint = new THREE.Mesh(new THREE.PlaneGeometry(w * .85, h * .7), makeLabelMaterial(w * .85, h * .7))
        frontPrint.position.set(0, h / 2, d / 2 + thick / 2 + .006)
        product.add(frontPrint)
        const drawer = new THREE.Group()
        addPanel(w - thick, thick, d - thick, 0, thick / 2, 0, innerMaterial, drawer)
        for (const z of [-d / 2 + thick, d / 2 - thick]) addPanel(w - thick, h * 0.75, thick, 0, h * 0.375, z, innerMaterial, drawer)
        for (const x of [-w / 2 + thick, w / 2 - thick]) addPanel(thick, h * 0.75, d - thick, x, h * 0.375, 0, innerMaterial, drawer)
        drawer.position.x = openBox ? w * 0.55 : 0
        product.add(drawer)
        const pull = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 12, 32), handleMaterial)
        pull.rotation.y = Math.PI / 2
        pull.position.set(w / 2 + drawer.position.x + 0.04, h * 0.4, 0)
        product.add(pull)
        const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, d * 0.72), makeLabelMaterial(w * 0.78, d * 0.72, 'lid'))
        label.rotation.x = -Math.PI / 2
        label.position.y = h + thick + 0.006
        product.add(label)
      } else if (structure === 'window' || structure === 'divider') {
        const thick = design.wallThickness === undefined ? 0.045 : design.wallThickness * scale
        const base = rounded(w, thick, d, edgeMaterial)
        base.position.y = thick / 2
        product.add(base)
        const frontPrint = new THREE.Mesh(new THREE.PlaneGeometry(w * .85, h * .7), makeLabelMaterial(w * .85, h * .7))
        frontPrint.position.set(0, h / 2, d / 2 + .006)
        product.add(frontPrint)
        for (const z of [-d / 2 + thick / 2, d / 2 - thick / 2]) {
          const wall = rounded(w, h, thick, mainMaterial)
          wall.position.set(0, h / 2, z)
          product.add(wall)
        }
        for (const x of [-w / 2 + thick / 2, w / 2 - thick / 2]) {
          const wall = rounded(thick, h, d - thick * 2, mainMaterial)
          wall.position.set(x, h / 2, 0)
          product.add(wall)
        }
        if (structure === 'divider') {
          const across = rounded(w - thick * 2, h * 0.7, 0.025, innerMaterial)
          across.position.y = h * 0.35
          product.add(across)
          const along = rounded(0.025, h * 0.7, d - thick * 2, innerMaterial)
          along.position.y = h * 0.35
          product.add(along)
        }
        if (!isOpenTop) {
          const lid = new THREE.Group()
          if (structure === 'window') {
            const frameWidth = w * 0.15
            const frameDepth = d * 0.19
            for (const x of [-w / 2 + frameWidth / 2, w / 2 - frameWidth / 2]) {
              const strip = rounded(frameWidth, 0.08, d + 0.06, mainMaterial)
              strip.position.x = x
              lid.add(strip)
            }
            for (const z of [-d / 2 + frameDepth / 2, d / 2 - frameDepth / 2]) {
              const strip = rounded(w - frameWidth * 2, 0.08, frameDepth, mainMaterial)
              strip.position.z = z
              lid.add(strip)
            }
            const pane = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, d * 0.62), new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.08, transparent: true, opacity: 0.27, depthWrite: false, side: THREE.DoubleSide }))
            pane.rotation.x = -Math.PI / 2
            pane.position.y = 0.002
            lid.add(pane)
            const lidPrint = new THREE.Mesh(new THREE.PlaneGeometry(w * .7, d * .16), makeLabelMaterial(w * .7, d * .16, 'lid'))
            lidPrint.rotation.x = -Math.PI / 2
            lidPrint.position.set(0, .045, d * .405)
            lid.add(lidPrint)
          } else {
            lid.add(rounded(w + 0.06, 0.08, d + 0.06, mainMaterial))
            addTopLabel(lid, w, d, 0.044)
          }
          lid.position.set(0, openBox ? h + 0.65 : h + 0.055, openBox ? -d * 0.65 : 0)
          product.add(lid)
        }
        if (hasHandles) addBagHandles(product, w, h, d)
      } else if (isBag) {
        // Shopping Bag: Open top with hollow interior, side gusset crease, and handles
        const thick = design.wallThickness === undefined ? 0.032 : design.wallThickness * scale
        // Base plate
        const base = rounded(w, thick, d, edgeMaterial, 0.012)
        base.position.y = thick / 2
        product.add(base)

      // Front wall
      const front = rounded(w, h, thick, mainMaterial, 0.012)
      front.position.set(0, h / 2, d / 2 - thick / 2)
      product.add(front)

      // Back wall
      const back = rounded(w, h, thick, mainMaterial, 0.012)
      back.position.set(0, h / 2, -d / 2 + thick / 2)
      product.add(back)

      // Left side wall (with subtle gusset inset)
      const left = rounded(thick, h, d - thick * 2, mainMaterial, 0.012)
      left.position.set(-w / 2 + thick / 2, h / 2, 0)
      product.add(left)

      // Right side wall
      const right = rounded(thick, h, d - thick * 2, mainMaterial, 0.012)
      right.position.set(w / 2 - thick / 2, h / 2, 0)
      product.add(right)

      // Printed outer walls have a separate unprinted lining on the inside.
      for (const z of [-1, 1]) {
        const lining = new THREE.Mesh(new THREE.PlaneGeometry(w - thick * 2, h - thick), innerMaterial)
        lining.position.set(0, (h + thick) / 2, z * (d / 2 - thick - .001))
        product.add(lining)
      }
      for (const x of [-1, 1]) {
        const lining = new THREE.Mesh(new THREE.PlaneGeometry(d - thick * 2, h - thick), innerMaterial)
        lining.rotation.y = Math.PI / 2
        lining.position.set(x * (w / 2 - thick - .001), (h + thick) / 2, 0)
        product.add(lining)
      }

      // Interior bottom floor
      const innerFloor = rounded(w - thick * 2.2, thick * 0.6, d - thick * 2.2, innerMaterial, 0.01)
      innerFloor.position.y = thick + 0.01
      product.add(innerFloor)

      // Front brand label
      const frontLabel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, h * 0.65), makeLabelMaterial(w * 0.88, h * 0.65, 'front'))
      frontLabel.position.set(0, h * 0.52, d / 2 + 0.005)
      product.add(frontLabel)

      // Bag handles
      if (hasHandles) addBagHandles(product, w, h, d)

      controls.target.set(0, h * 0.55, 0)
      camera.position.set(4.8, 4.6, 6.8)
    } else if (design.category === 'Box') {
      // Presentation Box
      const thick = design.wallThickness === undefined ? 0.055 : design.wallThickness * scale
      const base = rounded(w, thick, d, edgeMaterial)
      base.position.y = thick / 2
      product.add(base)

      for (const z of [-d / 2 + thick / 2, d / 2 - thick / 2]) {
        const side = rounded(w, h, thick, mainMaterial, 0.016)
        side.position.set(0, h / 2, z)
        product.add(side)
      }
      for (const x of [-w / 2 + thick / 2, w / 2 - thick / 2]) {
        const side = rounded(thick, h, d - thick * 2, mainMaterial, 0.016)
        side.position.set(x, h / 2, 0)
        product.add(side)
      }

      const insert = rounded(w - thick * 2.2, h * 0.55, d - thick * 2.2, innerMaterial, 0.025)
      insert.position.y = h * 0.36
      product.add(insert)

      // Front label on the box wall
      const boxSideLabel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, h * 0.7), makeLabelMaterial(w * 0.85, h * 0.7, 'front'))
      boxSideLabel.position.set(0, h / 2, d / 2 + 0.006)
      product.add(boxSideLabel)

      // If NOT openTop, add the lid!
      if (!isOpenTop) {
        const lid = new THREE.Group()
        const lidShape = rounded(w + 0.055, Math.max(0.10, h * 0.15), d + 0.055, mainMaterial, 0.033)
        lid.add(lidShape)
        addTopLabel(lid, w, d, Math.max(0.10, h * 0.15) / 2 + 0.005)
        lid.position.set(0, openBox ? h + 0.65 : h + 0.06, openBox ? -d * 0.68 : 0)
        lid.rotation.x = openBox ? 0.1 : 0
        product.add(lid)
      }

      if (hasHandles) {
        addBagHandles(product, w, h, d)
      }

      controls.target.set(0, h * 0.5, 0)
    } else if (design.category === 'Canister') {
      // Cylindrical Canister
      const radius = Math.min(w, d) / 2
      const thickness = (design.wallThickness ?? 2) * scale
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 96, 1, true), mainMaterial)
      body.position.y = h / 2
      body.castShadow = true
      body.receiveShadow = true
      product.add(body)

      const lining = new THREE.Mesh(new THREE.CylinderGeometry(radius - thickness, radius - thickness, h - thickness, 96, 1, true), innerMaterial)
      lining.position.y = h / 2
      product.add(lining)
      const bottom = new THREE.Mesh(new THREE.CylinderGeometry(radius - thickness / 2, radius - thickness / 2, thickness, 96), innerMaterial)
      bottom.position.y = thickness / 2
      product.add(bottom)

      if (!isOpenTop) {
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.026, radius + 0.026, 0.16, 96), mainMaterial)
        lid.position.set(openBox ? -0.12 : 0, h + (openBox ? 0.42 : 0.075), openBox ? -0.12 : 0)
        lid.castShadow = true
        addTopLabel(lid, radius * 1.5, radius * 1.5, .084)
        product.add(lid)
      }

      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - thickness / 2, thickness / 2, 12, 96), edgeMaterial)
      rim.rotation.x = Math.PI / 2
      rim.position.y = h + 0.009
      product.add(rim)

      const label = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.003, radius + 0.003, h * 0.64, 80, 1, true, -0.78, 1.56), makeLabelMaterial((radius + .003) * 1.56, h * .64))
      label.position.y = h * 0.55
      product.add(label)

      controls.target.set(0, h * 0.53, 0)
      camera.position.set(5, 4.8, 7)
    } else {
      // Folding Carton or Open Shopping Box
      const thick = design.wallThickness === undefined ? 0.038 : design.wallThickness * scale

      if (isOpenTop) {
        // Hollow Open Shopping Box: 4 walls + base + open interior
        const base = rounded(w, thick, d, edgeMaterial, 0.012)
        base.position.y = thick / 2
        product.add(base)

        const front = rounded(w, h, thick, mainMaterial, 0.012)
        front.position.set(0, h / 2, d / 2 - thick / 2)
        product.add(front)

        const back = rounded(w, h, thick, mainMaterial, 0.012)
        back.position.set(0, h / 2, -d / 2 + thick / 2)
        product.add(back)

        const left = rounded(thick, h, d - thick * 2, mainMaterial, 0.012)
        left.position.set(-w / 2 + thick / 2, h / 2, 0)
        product.add(left)

        const right = rounded(thick, h, d - thick * 2, mainMaterial, 0.012)
        right.position.set(w / 2 - thick / 2, h / 2, 0)
        product.add(right)

        const innerFloor = rounded(w - thick * 2.2, thick * 0.6, d - thick * 2.2, innerMaterial, 0.01)
        innerFloor.position.y = thick + 0.01
        product.add(innerFloor)

        const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.63), makeLabelMaterial(w * 0.94, h * 0.63, 'front'))
        label.position.set(0, h * 0.6, d / 2 + 0.006)
        product.add(label)

        if (hasHandles) {
          addBagHandles(product, w, h, d)
        }
      } else {
        // Standard closed folding carton
        const carton = rounded(w, h, d, mainMaterial, 0.022)
        carton.position.y = h / 2
        product.add(carton)

        const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.63), makeLabelMaterial(w * 0.94, h * 0.63, 'front'))
        label.position.set(0, h * 0.6, d / 2 + 0.006)
        product.add(label)

        const top = rounded(w - 0.015, 0.025, d - 0.015, edgeMaterial, 0.007)
        top.position.y = h + 0.015
        addTopLabel(top, w * .8, d * .8, .016)
        product.add(top)

        if (openBox) {
          const flap = rounded(w, d * 0.65, 0.025, mainMaterial, 0.007)
          flap.position.set(0, h + d * 0.29, -d / 2)
          flap.rotation.x = -0.32
          product.add(flap)
        }

        if (hasHandles) {
          addBagHandles(product, w, h, d)
        }
      }
      controls.target.set(0, h * 0.53, 0)
      camera.position.set(5, 4.8, 7)
    }
  }

    for (const part of design.modelParts || []) {
      const { x, y, z } = part.size
      const geometry = part.shape === 'box' ? new THREE.BoxGeometry(x * scale, y * scale, z * scale) : part.shape === 'cylinder' ? new THREE.CylinderGeometry(x * scale / 2, x * scale / 2, y * scale, 64) : new THREE.SphereGeometry(.5, 40, 32)
      const material = part.material === 'glass' ? new THREE.MeshPhysicalMaterial({ color: part.color, transparent: true, opacity: .4, roughness: .08, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: part.color, metalness: part.material === 'metal' ? .9 : 0, roughness: part.material === 'metal' ? .25 : .8 })
      const mesh = new THREE.Mesh(geometry, material)
      if (part.shape === 'sphere') mesh.scale.set(x * scale, y * scale, z * scale)
      if (part.shape === 'cylinder') mesh.scale.z = z / x
      mesh.position.set(part.position.x * scale, part.position.y * scale, part.position.z * scale)
      if (part.rotation) mesh.rotation.set(THREE.MathUtils.degToRad(part.rotation.x), THREE.MathUtils.degToRad(part.rotation.y), THREE.MathUtils.degToRad(part.rotation.z))
      mesh.name = part.name
      mesh.castShadow = true
      mesh.receiveShadow = true
      product.add(mesh)
    }

    const info = getProductInfo(design)
    if (info.visible) {
      const back = info.placement === 'back'
      const roundBase = design.category === 'Canister' || design.structure === 'hexagon'
      const infoWidth = roundBase && !back ? Math.min(w, d) * .66 : w * .86
      const infoHeight = roundBase && !back ? Math.min(w, d) * .66 : (back ? h : d) * .84
      const print = new THREE.Mesh(new THREE.PlaneGeometry(infoWidth, infoHeight), makeLabelMaterial(infoWidth, infoHeight, 'info'))
      if (back) { print.rotation.y = Math.PI; print.position.set(0, h / 2, -(design.structure === 'hexagon' ? Math.min(w, d) * .5 * Math.cos(Math.PI / 6) : d / 2) - .007) }
      else { print.rotation.x = Math.PI / 2; print.position.y = design.structure === 'drawer' ? -(design.wallThickness === undefined ? .05 : design.wallThickness * scale) - .007 : -.007 }
      product.add(print)
    }

    // Fit the camera to the complete model, including open lids and drawer trays.
    const bounds = new THREE.Box3().setFromObject(product)
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const distance = Math.max(3.3, Math.max(size.x, size.y, size.z) * 1.55)
      controls.target.copy(center)
      camera.position.copy(center).add(cameraView === 'front' ? new THREE.Vector3(0, 0, distance * 1.35) : cameraView === 'back' ? new THREE.Vector3(0, 0, -distance * 1.35) : cameraView === 'bottom' ? new THREE.Vector3(0, -distance * 1.35, .001) : cameraView === 'top' ? new THREE.Vector3(0, distance * 1.35, .001) : new THREE.Vector3(distance * .78, distance * .72, distance))
      controls.maxDistance = distance * 4
      controls.update()
    }

    // Floating aesthetic props
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 40), new THREE.MeshStandardMaterial({ color: '#d0c3df', roughness: 0.8 }))
    ball.position.set(-2.5, 0.3, 0.85)
    ball.castShadow = true
    ball.visible = projection !== 'orthographic' && cameraView !== 'bottom'
    scene.add(ball)

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.45, 48), new THREE.MeshStandardMaterial({ color: '#edd0b6', roughness: 0.8 }))
    cylinder.position.set(2.1, 0.225, -1.1)
    cylinder.castShadow = true
    cylinder.visible = projection !== 'orthographic' && cameraView !== 'bottom'
    scene.add(cylinder)

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      if (camera instanceof THREE.PerspectiveCamera) camera.aspect = width / height
      else {
        const dimensions = bounds.getSize(new THREE.Vector3())
        const vertical = cameraView === 'top' || cameraView === 'bottom' ? dimensions.z : dimensions.y
        const half = Math.max(vertical / 2, dimensions.x / (width / height) / 2) * 1.18
        camera.left = -half * width / height; camera.right = half * width / height
        camera.top = half; camera.bottom = -half
      }
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    let frame = 0
    let visible = true
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting
    })
    intersection.observe(container)

    const tick = () => {
      frame = requestAnimationFrame(tick)
      if (visible) {
        controls.update()
        renderer.render(scene, camera)
        if (labelReady) renderer.domElement.dataset.designKey = previewKey(design)
        renderer.domElement.dataset.cameraView = cameraView
        renderer.domElement.dataset.openBox = String(openBox)
      }
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      controls.dispose()
      const materials = new Set<THREE.Material>()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          ;(Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m))
        }
      })
      materials.forEach(m => m.dispose())
      ;[mainMaterial, innerMaterial, edgeMaterial, handleMaterial, metalGrommet, labelMaterial].forEach(m => m.dispose())
      labels.forEach(label => label.texture.dispose())
      surfaceTexture?.dispose()
      env.dispose()
      room.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [design, openBox, autoRotate, resetKey, cameraView, projection])

  return (
    <div className="product-scene" ref={host}>
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
