import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { Design } from './types'
import type { PackagingMaterials } from './materials'
import { getShapeParams, resolveShape, roundLayout, ROUND_LABEL_ARC, shapeFootprint, shapeProfile, type ShapeId } from './shapes'

export type LabelFace = 'front' | 'lid' | 'info'
export type LabelOptions = { fill?: string; side?: THREE.Side }
export type BuildContext = {
  design: Design
  /** Scene-unit sizes: x (length), y (height), z (width / depth). */
  w: number
  h: number
  d: number
  /** Scene units per millimetre. */
  scale: number
  /** Wall / board thickness in scene units. */
  t: number
  mats: PackagingMaterials
  /** Creates a lit print material whose canvas has the physical aspect width:height. */
  label: (face: LabelFace, width: number, height: number, options?: LabelOptions) => THREE.Material
}
export type BuiltModel = {
  root: THREE.Group
  /** 0 = closed, 1 = fully open. Called every frame while animating. */
  setOpen: (t: number) => void
  /** Whether the shape has something to open (lid, flaps, drawer, cap). */
  opens: boolean
  /** Where a bottom / back information print can go. */
  info: { bottomY?: number; bottom?: { width: number; depth: number }; back?: { kind: 'flat'; z: number; width: number; height: number; y: number } | { kind: 'round'; radius: number; height: number; y: number } }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, v: number) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x) }
const lerp = THREE.MathUtils.lerp

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], name = '') {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = true
  m.receiveShadow = true
  m.name = name
  return m
}
function roundedBox(x: number, y: number, z: number, radius: number, material: THREE.Material | THREE.Material[], name = '') {
  const r = Math.max(0.0005, Math.min(radius, x / 2.05, y / 2.05, z / 2.05))
  return mesh(new RoundedBoxGeometry(x, y, z, 3, r), material, name)
}
/** Material array for a box whose `outward` face is printed, opposite face is lining, others show board edge. */
function panelMats(mats: PackagingMaterials, outward: '+x' | '-x' | '+y' | '-y' | '+z' | '-z') {
  const order = ['+x', '-x', '+y', '-y', '+z', '-z'] as const
  const opposite = { '+x': '-x', '-x': '+x', '+y': '-y', '-y': '+y', '+z': '-z', '-z': '+z' }[outward]
  return order.map(face => face === outward ? mats.main : face === opposite ? mats.inner : mats.edge)
}
function labelPlane(ctx: BuildContext, face: LabelFace, width: number, height: number, options?: LabelOptions) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), ctx.label(face, width, height, options))
  m.name = `${face} print`
  m.renderOrder = 2
  return m
}
function roundLabel(ctx: BuildContext, face: LabelFace, radius: number, height: number, arc: number, center = 0, options?: LabelOptions) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true, center - arc / 2, arc), ctx.label(face, radius * arc, height, options))
  m.name = `${face} print`
  m.renderOrder = 2
  return m
}
function cornerRadius(ctx: BuildContext, fallback: number) {
  return ctx.design.cornerRadius === undefined ? fallback : Math.max(.0005, ctx.design.cornerRadius * ctx.scale)
}

/** Open-top hollow box: floor plus four walls, printed outside and lined inside. */
function hollowBox(ctx: BuildContext, parent: THREE.Object3D, w: number, h: number, d: number, t: number, opts: { floor?: boolean; name?: string; materials?: PackagingMaterials } = {}) {
  const mats = opts.materials || ctx.mats, r = Math.min(cornerRadius(ctx, .012), t / 2.1)
  const group = new THREE.Group()
  group.name = opts.name || 'walls'
  if (opts.floor !== false) { const floor = roundedBox(w, t, d, r, panelMats(mats, '-y'), 'floor'); floor.position.y = t / 2; group.add(floor) }
  for (const s of [1, -1]) {
    const wall = roundedBox(w, h, t, r, panelMats(mats, s > 0 ? '+z' : '-z'), s > 0 ? 'front wall' : 'back wall')
    wall.position.set(0, h / 2, s * (d / 2 - t / 2)); group.add(wall)
    const side = roundedBox(t, h, d - 2 * t, r, panelMats(mats, s > 0 ? '+x' : '-x'), s > 0 ? 'right wall' : 'left wall')
    side.position.set(s * (w / 2 - t / 2), h / 2, 0); group.add(side)
  }
  parent.add(group)
  return group
}

export function addRopeHandles(ctx: BuildContext, parent: THREE.Object3D, w: number, h: number, d: number) {
  const s = ctx.scale
  const spread = Math.min(w * .23, 75 * s), rise = Math.min(w * .25, Math.max(h * .25, 28 * s))
  const anchorY = h - Math.min(h * .14, 12 * s), cord = Math.max(.006, Math.min(w * .009, 2.4 * s))
  for (const sign of [-1, 1]) {
    const z = sign * (d / 2 + cord * 1.8)
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-spread, anchorY, z), new THREE.Vector3(-spread * 1.25, h + rise * 1.4, z + sign * rise * .25), new THREE.Vector3(spread * 1.25, h + rise * 1.4, z + sign * rise * .25), new THREE.Vector3(spread, anchorY, z))
    parent.add(mesh(new THREE.TubeGeometry(curve, 64, cord, 12, false), ctx.mats.accent, 'rope handle'))
    for (const x of [-spread, spread]) {
      const eyelet = mesh(new THREE.TorusGeometry(cord * 2.2, cord * .55, 12, 28), ctx.mats.metal, 'eyelet')
      eyelet.position.set(x, anchorY, sign * (d / 2 + cord * 1.3))
      parent.add(eyelet)
    }
  }
}

/** Lift-off lid motion: rises, swings behind the base and tilts. */
function liftLid(lid: THREE.Object3D, closedY: number, h: number, d: number) {
  return (t: number) => {
    const up = smooth(0, .55, t), back = smooth(.3, 1, t)
    lid.position.set(0, closedY + up * (h * .45 + .35) - back * .05, -back * d * .7)
    lid.rotation.set(-back * .28, 0, 0)
  }
}

// ---------------------------------------------------------------------------------------------
// Rectangular families
// ---------------------------------------------------------------------------------------------

function buildRigidBox(ctx: BuildContext, shape: 'rigid-box' | 'window' | 'divider'): BuiltModel {
  const { w, h, d, t, mats, design } = ctx, root = new THREE.Group()
  hollowBox(ctx, root, w, h, d, t, { name: 'tray' })
  const front = labelPlane(ctx, 'front', w * .85, h * .7); front.position.set(0, h / 2, d / 2 + .003); root.add(front)
  if (shape === 'rigid-box') {
    const insert = roundedBox(w - t * 2.4, h * .5, d - t * 2.4, .02, mats.inner, 'insert'); insert.position.y = t + h * .25; root.add(insert)
  } else if (shape === 'divider') {
    const across = roundedBox(w - t * 2, h * .72, t * .6, .004, mats.inner, 'divider'); across.position.y = h * .36; root.add(across)
    const along = roundedBox(t * .6, h * .72, d - t * 2, .004, mats.inner, 'divider'); along.position.y = h * .36; root.add(along)
  }
  let setOpen: (t: number) => void = () => {}
  if (!design.openTop) {
    const lid = new THREE.Group(); lid.name = 'lid'
    const lidH = Math.max(.08, Math.min(h * .28, 20 * ctx.scale + .04)), c = t * 1.2
    const lw = w + 2 * c, ld = d + 2 * c
    if (shape === 'window') {
      const fw = w * .15, fd = d * .19, top = new THREE.Group()
      for (const x of [-1, 1]) { const strip = roundedBox(fw, t, ld, .004, mats.main, 'lid frame'); strip.position.set(x * (lw / 2 - fw / 2), lidH / 2 - t / 2, 0); top.add(strip) }
      for (const z of [-1, 1]) { const strip = roundedBox(lw - 2 * fw, t, fd, .004, mats.main, 'lid frame'); strip.position.set(0, lidH / 2 - t / 2, z * (ld / 2 - fd / 2)); top.add(strip) }
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(lw - 2 * fw + .01, ld - 2 * fd + .01), mats.clear); pane.rotation.x = -Math.PI / 2; pane.position.y = lidH / 2 - t * .3; pane.name = 'window film'; top.add(pane)
      const print = labelPlane(ctx, 'lid', w * .7, d * .16); print.rotation.x = -Math.PI / 2; print.position.set(0, lidH / 2 + .002, ld / 2 - fd / 2); top.add(print)
      lid.add(top)
      for (const s of [1, -1]) {
        const skirt = roundedBox(lw, lidH, t, .004, panelMats(mats, s > 0 ? '+z' : '-z')); skirt.position.z = s * (ld / 2 - t / 2); lid.add(skirt)
        const side = roundedBox(t, lidH, ld - 2 * t, .004, panelMats(mats, s > 0 ? '+x' : '-x')); side.position.x = s * (lw / 2 - t / 2); lid.add(side)
      }
    } else {
      // Telescoping lid: closed top plus four skirts, so the underside reads as a real cap when it is lifted.
      const top = roundedBox(lw, t, ld, cornerRadius(ctx, .01), panelMats(mats, '+y'), 'lid top'); top.position.y = lidH / 2 - t / 2; lid.add(top)
      for (const s of [1, -1]) {
        const skirt = roundedBox(lw, lidH, t, .006, panelMats(mats, s > 0 ? '+z' : '-z'), 'lid skirt'); skirt.position.z = s * (ld / 2 - t / 2); lid.add(skirt)
        const side = roundedBox(t, lidH, ld - 2 * t, .006, panelMats(mats, s > 0 ? '+x' : '-x'), 'lid skirt'); side.position.x = s * (lw / 2 - t / 2); lid.add(side)
      }
      const print = labelPlane(ctx, 'lid', w * .93, d * .9); print.rotation.x = -Math.PI / 2; print.position.y = lidH / 2 + .002; lid.add(print)
    }
    const closedY = h + lidH / 2 - lidH * .62
    root.add(lid)
    setOpen = liftLid(lid, closedY, h, d)
  }
  if (design.hasHandles) addRopeHandles(ctx, root, w, h, d)
  return { root, setOpen, opens: !design.openTop, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2, width: w * .86, height: h * .8, y: h / 2 } } }
}

function buildCarton(ctx: BuildContext): BuiltModel {
  const { w, h, d, mats, design } = ctx, t = Math.min(ctx.t, .03), root = new THREE.Group()
  hollowBox(ctx, root, w, h, d, t, { name: 'carton body' })
  const front = labelPlane(ctx, 'front', w * .94, h * .63); front.position.set(0, h * .55, d / 2 + .003); root.add(front)
  let setOpen: (t: number) => void = () => {}
  if (!design.openTop) {
    // Hinged tuck flap at the back top edge with a tuck tongue, plus two dust flaps.
    const hinge = new THREE.Group(); hinge.position.set(0, h, -d / 2); hinge.name = 'top flap'
    const flap = roundedBox(w, t, d, .004, panelMats(mats, '+y'), 'top flap'); flap.position.set(0, t / 2, d / 2); hinge.add(flap)
    const print = labelPlane(ctx, 'lid', w * .744, d * .72); print.rotation.x = -Math.PI / 2; print.position.set(0, t + .002, d / 2); hinge.add(print)
    const tongueHinge = new THREE.Group(); tongueHinge.position.set(0, t / 2, d - t * 1.2); hinge.add(tongueHinge)
    const tongueLen = Math.min(d * .45, h * .25)
    const tongue = roundedBox(w * .96, t * .8, tongueLen, .004, panelMats(mats, '+y'), 'tuck tongue'); tongue.position.z = tongueLen / 2; tongueHinge.add(tongue)
    root.add(hinge)
    const dust: THREE.Group[] = []
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.set(s * (w / 2 - t), h - t * 1.2, 0)
      const len = Math.min(w * .35, d * .6)
      const p = roundedBox(len, t * .7, d * .9, .003, mats.inner, 'dust flap'); p.position.x = -s * len / 2; g.add(p)
      g.userData.sign = s
      dust.push(g); root.add(g)
    }
    setOpen = v => {
      const lidT = smooth(0, .65, v), dustT = smooth(.45, 1, v)
      hinge.rotation.x = -lidT * 1.95
      tongueHinge.rotation.x = lerp(Math.PI / 2 - .04, .25, lidT)
      for (const g of dust) g.rotation.z = (g.userData.sign as number) * dustT * 1.75
    }
  }
  if (design.hasHandles) addRopeHandles(ctx, root, w, h, d)
  return { root, setOpen, opens: !design.openTop, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2, width: w * .86, height: h * .8, y: h / 2 } } }
}

function buildMailer(ctx: BuildContext): BuiltModel {
  const { w, h, d, t, mats, design } = ctx, root = new THREE.Group()
  hollowBox(ctx, root, w, h, d, t, { name: 'mailer base' })
  const front = labelPlane(ctx, 'front', w * .8, h * .6); front.position.set(0, h / 2, d / 2 + .003); root.add(front)
  let setOpen: (t: number) => void = () => {}
  if (!design.openTop) {
    const hinge = new THREE.Group(); hinge.position.set(0, h, -d / 2); hinge.name = 'mailer lid'
    const lid = roundedBox(w, t, d, cornerRadius(ctx, .006), panelMats(mats, '+y'), 'lid'); lid.position.set(0, t / 2, d / 2); hinge.add(lid)
    const print = labelPlane(ctx, 'lid', w * .86, d * .82); print.rotation.x = -Math.PI / 2; print.position.set(0, t + .002, d / 2); hinge.add(print)
    const flapHinge = new THREE.Group(); flapHinge.position.set(0, 0, d - t * 1.6); hinge.add(flapHinge)
    const flapH = h * .82
    const flap = roundedBox(w - t * 2.4, flapH, t, .004, panelMats(mats, '+z'), 'tuck front'); flap.position.y = -flapH / 2; flapHinge.add(flap)
    root.add(hinge)
    setOpen = v => {
      const lt = smooth(0, .85, v)
      hinge.rotation.x = -lt * 1.95
      flapHinge.rotation.x = -smooth(0, .5, v) * 1.2
    }
  }
  if (design.hasHandles) addRopeHandles(ctx, root, w, h, d)
  return { root, setOpen, opens: !design.openTop, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2, width: w * .86, height: h * .8, y: h / 2 } } }
}

function buildDrawer(ctx: BuildContext, sleeveOnly = false): BuiltModel {
  const { w, h, d, mats } = ctx, t = Math.max(ctx.t, .02), root = new THREE.Group()
  const sleeveW = sleeveOnly ? w * .66 : w + t
  const sleeve = new THREE.Group(); sleeve.name = 'sleeve'
  const top = roundedBox(sleeveW, t, d + t, .006, panelMats(mats, '+y'), 'sleeve top'); top.position.y = h + t / 2; sleeve.add(top)
  const bottom = roundedBox(sleeveW, t, d + t, .006, panelMats(mats, '-y'), 'sleeve bottom'); bottom.position.y = -t / 2 + t; sleeve.add(bottom)
  for (const s of [1, -1]) { const wall = roundedBox(sleeveW, h, t, .006, panelMats(mats, s > 0 ? '+z' : '-z'), 'sleeve wall'); wall.position.set(0, h / 2 + t / 2, s * (d / 2)); sleeve.add(wall) }
  const front = labelPlane(ctx, 'front', sleeveW * .86, h * .7); front.position.set(0, h / 2 + t / 2, d / 2 + t / 2 + .003); sleeve.add(front)
  const lidPrint = labelPlane(ctx, 'lid', sleeveOnly ? sleeveW * .8 : w * .78, d * .72); lidPrint.rotation.x = -Math.PI / 2; lidPrint.position.y = h + t + .002; sleeve.add(lidPrint)
  root.add(sleeve)
  const tray = new THREE.Group(); tray.name = 'tray'
  const trayMats = { ...mats, main: mats.inner } as PackagingMaterials
  hollowBox(ctx, tray, w - t * 1.5, h * (sleeveOnly ? .96 : .8), d - t * 1.5, t * .8, { name: 'tray', materials: trayMats })
  tray.position.y = t
  if (!sleeveOnly) { const ring = Math.min(.09, h * .25); const pull = mesh(new THREE.TorusGeometry(ring, Math.min(.018, h * .05), 12, 32), mats.accent, 'pull loop'); pull.rotation.y = Math.PI / 2; pull.position.set((w - t * 1.5) / 2 + ring * .2, h * .4, 0); tray.add(pull) }
  root.add(tray)
  const setOpen = (v: number) => {
    const e = smooth(0, 1, v)
    if (sleeveOnly) { sleeve.position.x = e * w * .78; tray.position.x = 0 }
    else tray.position.x = e * w * .58
  }
  return { root, setOpen, opens: true, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2 + t / 2, width: sleeveW * .86, height: h * .8, y: h / 2 } } }
}

function buildDisplay(ctx: BuildContext): BuiltModel {
  const { w, h, d, t, mats } = ctx, root = new THREE.Group()
  const floor = roundedBox(w, t, d, .006, panelMats(mats, '-y'), 'floor'); floor.position.y = t / 2; root.add(floor)
  const back = roundedBox(w, h, t, .006, panelMats(mats, '-z'), 'back wall'); back.position.set(0, h / 2, -d / 2 + t / 2); root.add(back)
  const headerH = h * .65
  const header = roundedBox(w, headerH, t, cornerRadius(ctx, .02), panelMats(mats, '+z'), 'header card'); header.position.set(0, h + headerH / 2 - t, -d / 2 + t * 1.5); root.add(header)
  const headerPrint = labelPlane(ctx, 'front', w * .9, headerH * .82); headerPrint.position.set(0, h + headerH / 2 - t, -d / 2 + t * 2 + .003); root.add(headerPrint)
  const lip = h * .32
  const front = roundedBox(w, lip, t, .006, panelMats(mats, '+z'), 'front lip'); front.position.set(0, lip / 2, d / 2 - t / 2); root.add(front)
  const lipPrint = labelPlane(ctx, 'lid', w * .9, lip * .75); lipPrint.position.set(0, lip / 2, d / 2 + .003); root.add(lipPrint)
  for (const s of [1, -1]) {
    const shape = new THREE.Shape([new THREE.Vector2(d / 2, 0), new THREE.Vector2(-d / 2, 0), new THREE.Vector2(-d / 2, h), new THREE.Vector2(d / 2, lip)].map(p => new THREE.Vector2(-p.x, p.y)))
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false })
    const side = mesh(geo, [mats.main, mats.edge], 'side wall'); side.rotation.y = Math.PI / 2; side.position.x = s > 0 ? w / 2 - t : -w / 2
    root.add(side)
  }
  return { root, setOpen: () => {}, opens: false, info: { bottom: { width: w, depth: d } } }
}

// ---------------------------------------------------------------------------------------------
// Polygon / extruded families
// ---------------------------------------------------------------------------------------------

function taperGeometry(geometry: THREE.BufferGeometry, height: number, taper: number) {
  if (taper === 1) return geometry
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) { const k = lerp(1, taper, clamp01(p.getY(i) / height)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k) }
  p.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}
function footprintShape(points: [number, number][], sx: number, sz: number, inset = 0) {
  // Shape lives in XY; after rotateX(-90°) shape y becomes -z, so store -z.
  const cx = points.reduce((a, p) => a + p[0], 0) / points.length, cz = points.reduce((a, p) => a + p[1], 0) / points.length
  const k = (r: number) => Math.max(.05, (r - inset) / Math.max(r, 1e-6))
  const pts = points.map(([x, z]) => new THREE.Vector2(cx * sx + (x - cx) * sx * k(sx), -(cz * sz + (z - cz) * sz * k(sz))))
  if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse()
  return pts
}
function extrudeUp(shape: THREE.Shape, height: number, bevel: number) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.001, height - bevel * 2), bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 24 })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bevel, 0)
  return geo
}
/** The most front-facing straight edge of a footprint, for placing a flat front print. */
function frontEdge(points: [number, number][], sx: number, sz: number) {
  const cx = points.reduce((a, p) => a + p[0] * sx, 0) / points.length, cz = points.reduce((a, p) => a + p[1] * sz, 0) / points.length
  let best: { cx: number; cz: number; len: number; angle: number; score: number } | undefined
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    const ax = a[0] * sx, az = a[1] * sz, bx = b[0] * sx, bz = b[1] * sz
    const len = Math.hypot(bx - ax, bz - az)
    if (len < 1e-6) continue
    let nx = (bz - az) / len, nz = -(bx - ax) / len
    const mx = (ax + bx) / 2, mz = (az + bz) / 2
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz }
    const score = nz * len
    if (nz > .7 && (!best || score > best.score)) best = { cx: mx, cz: mz, len, angle: Math.atan2(nx, nz), score }
  }
  return best
}

/** A print ribbon that follows the front-facing run of any outline (for curved custom shapes). */
function outlineRibbon(ctx: BuildContext, points: [number, number][], sx: number, sz: number, h: number, taper: number, bevel: number) {
  const pts = points.map(([x, z]) => new THREE.Vector2(x * sx, z * sz))
  const n = pts.length, cx = pts.reduce((a, p) => a + p.x, 0) / n, cz = pts.reduce((a, p) => a + p.y, 0) / n
  const normal = (i: number) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]
    const nv = new THREE.Vector2(b.y - a.y, -(b.x - a.x)).normalize()
    if (nv.dot(new THREE.Vector2(pts[i].x - cx, pts[i].y - cz)) < 0) nv.negate()
    return nv
  }
  const facing = pts.map((_, i) => normal(i).y > .25)
  // Longest contiguous front-facing run (wrapping around the end of the list).
  let best: number[] = []
  for (let start = 0; start < n; start++) {
    if (!facing[start] || facing[(start - 1 + n) % n]) continue
    const run: number[] = []
    for (let k = 0; k < n && facing[(start + k) % n]; k++) run.push((start + k) % n)
    if (run.length > best.length) best = run
  }
  if (!best.length && facing.every(Boolean)) best = pts.map((_, i) => i).filter(i => pts[i].y >= cz)
  if (best.length < 2) return undefined
  // Order the run left → right as seen from the front.
  if (pts[best[0]].x > pts[best[best.length - 1]].x) best.reverse()
  const y0 = h * .18, y1 = h * .82
  const lengths = [0]
  for (let i = 1; i < best.length; i++) lengths.push(lengths[i - 1] + pts[best[i]].distanceTo(pts[best[i - 1]]))
  const total = lengths[lengths.length - 1]
  if (total < sx * .3) return undefined
  const positions: number[] = [], uvs: number[] = [], index: number[] = []
  best.forEach((pi, i) => {
    const p = pts[pi], nv = normal(pi).multiplyScalar(bevel + .004)
    for (const [y, v] of [[y0, 0], [y1, 1]] as const) {
      const k = lerp(1, taper, y / h)
      positions.push((p.x + nv.x) * k, y, (p.y + nv.y) * k)
      uvs.push(lengths[i] / total, v)
    }
    if (i) { const a = (i - 1) * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  const ribbon = new THREE.Mesh(geo, ctx.label('front', total * .92, (y1 - y0) * .92, { side: THREE.DoubleSide }))
  ribbon.name = 'front print'
  ribbon.renderOrder = 2
  return ribbon
}

function buildPolygon(ctx: BuildContext, shape: ShapeId): BuiltModel {
  const { w, h, d, t, mats, design } = ctx, root = new THREE.Group()
  const params = getShapeParams(design)
  const isTray = shape === 'tray'
  const taper = isTray ? (design.shapeParams?.taper ?? 1.12) : params.taper
  const points = isTray ? roundedRectFootprint(.16) : shapeFootprint(design)
  const sx = w / 2, sz = d / 2, bevel = Math.min(cornerRadius(ctx, .006), t * .45)
  const outer = new THREE.Shape(footprintShape(points, sx, sz))
  outer.holes.push(new THREE.Path(footprintShape(points, sx, sz, t).reverse()))
  // ExtrudeGeometry groups: 0 = caps (board edge), 1 = side walls (printed outside).
  const walls = mesh(taperGeometry(extrudeUp(outer, h, bevel), h, taper), [mats.edge, mats.main], 'walls')
  root.add(walls)
  // A closed lining prism just inside the walls, rendered from the inside only (BackSide).
  const liningMat = mats.inner.clone(); liningMat.side = THREE.BackSide
  const liningGeo = taperGeometry(extrudeUp(new THREE.Shape(footprintShape(points, sx, sz, t * 1.02)), h - t * .5, 0), h - t * .5, taper)
  liningGeo.clearGroups()
  const lining = mesh(liningGeo, liningMat, 'lining')
  lining.castShadow = false
  lining.position.y = t * .5
  root.add(lining)
  const floor = mesh(extrudeUp(new THREE.Shape(footprintShape(points, sx, sz, t * .5)), t, 0), mats.inner, 'floor'); root.add(floor)
  if (isTray) {
    const rim = new THREE.Shape(footprintShape(points, sx * taper + t * 1.6, sz * taper + t * 1.6))
    rim.holes.push(new THREE.Path(footprintShape(points, sx * taper, sz * taper, t * .5).reverse()))
    const flange = mesh(extrudeUp(rim, t * .8, 0), [mats.edge, mats.main], 'rim'); flange.position.y = h - t * .8; root.add(flange)
  }
  const edge = frontEdge(points, sx, sz)
  if (edge && edge.len > w * .2 && h > .05) {
    const midK = lerp(1, taper, .5), tilt = Math.atan2(edge.cz * (1 - taper), h)
    const print = labelPlane(ctx, 'front', edge.len * midK * .86, h * .7 / Math.cos(tilt))
    // Sit just outside the bevelled wall surface, along the panel normal.
    const out = bevel + .004
    print.position.set(edge.cx * midK + Math.sin(edge.angle) * out, h / 2, edge.cz * midK + Math.cos(edge.angle) * out)
    print.rotation.set(-tilt, edge.angle, 0, 'YXZ')
    root.add(print)
  } else {
    const ribbon = outlineRibbon(ctx, points, sx, sz, h, taper, bevel)
    if (ribbon) root.add(ribbon)
  }
  let setOpen: (t: number) => void = () => {}
  const lidAllowed = !isTray && !design.openTop
  if (lidAllowed) {
    const lid = new THREE.Group(); lid.name = 'lid'
    const lidH = Math.max(.07, Math.min(h * .22, .3)), grow = t * 1.3
    const lidShape = new THREE.Shape(footprintShape(points, sx * taper + grow, sz * taper + grow))
    const cap = mesh(extrudeUp(lidShape, lidH, bevel * 1.2), [mats.main, mats.main], 'lid')
    cap.position.y = -lidH / 2; lid.add(cap)
    const top = labelPlane(ctx, 'lid', w * taper * .58, d * taper * .56)
    top.rotation.x = -Math.PI / 2; top.position.y = lidH / 2 + .003; lid.add(top)
    const closedY = h + lidH / 2 - lidH * .45
    root.add(lid)
    setOpen = liftLid(lid, closedY, h, d)
  }
  if (design.hasHandles) addRopeHandles(ctx, root, w, h, d)
  const backEdge = frontEdge(points.map(([x, z]) => [x, -z]), sx, sz)
  return { root, setOpen, opens: lidAllowed, info: { bottom: { width: w * .62, depth: d * .5 }, ...(backEdge && backEdge.len > w * .2 ? { back: { kind: 'flat' as const, z: Math.abs(backEdge.cz), width: backEdge.len * .8, height: h * .7, y: h / 2 } } : {}) } }
}
function roundedRectFootprint(r: number): [number, number][] {
  const pts: [number, number][] = []
  const corners: [number, number, number][] = [[1 - r, 1 - r, 0], [-(1 - r), 1 - r, Math.PI / 2], [-(1 - r), -(1 - r), Math.PI], [1 - r, -(1 - r), Math.PI * 1.5]]
  for (const [cx, cz, start] of corners) for (let i = 0; i <= 6; i++) { const a = start + (i / 6) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]) }
  return pts
}

function buildPyramid(ctx: BuildContext): BuiltModel {
  const { w, h, d, t, mats } = ctx, root = new THREE.Group()
  const base = roundedBox(w, t, d, .004, panelMats(mats, '-y'), 'base'); base.position.y = t / 2; root.add(base)
  const pivots: { pivot: THREE.Group; closed: number }[] = []
  for (let i = 0; i < 4; i++) {
    const even = i % 2 === 0, len = even ? w : d, inward = even ? d / 2 : w / 2
    const slant = Math.hypot(h, inward), closed = -Math.atan2(inward, h)
    const pivot = new THREE.Group(); pivot.name = `panel ${i + 1}`
    pivot.rotation.order = 'YXZ'; pivot.rotation.y = i * Math.PI / 2
    pivot.position.set(Math.sin(i * Math.PI / 2) * inward, t, Math.cos(i * Math.PI / 2) * inward)
    const tri = new THREE.Shape([new THREE.Vector2(-len / 2, 0), new THREE.Vector2(len / 2, 0), new THREE.Vector2(0, slant)])
    const outside = mesh(new THREE.ShapeGeometry(tri), mats.main, 'panel'); pivot.add(outside)
    const insideMat = mats.inner
    const inside = new THREE.Mesh(new THREE.ShapeGeometry(tri), insideMat); inside.position.z = -.002; inside.scale.x = -1; pivot.add(inside)
    if (i === 0) { const print = labelPlane(ctx, 'front', len * .5, slant * .34); print.position.set(0, slant * .26, .003); pivot.add(print) }
    root.add(pivot); pivots.push({ pivot, closed })
  }
  const setOpen = (v: number) => pivots.forEach(({ pivot, closed }, i) => { pivot.rotation.x = lerp(closed, 1.32, smooth(i * .12, .64 + i * .12, v)) })
  return { root, setOpen, opens: true, info: { bottom: { width: w, depth: d } } }
}

function buildGable(ctx: BuildContext): BuiltModel {
  const { w, h, d, mats, design } = ctx, t = Math.min(ctx.t, .03), root = new THREE.Group()
  const body = h * .7, handleH = h * .12, rise = h - body - handleH
  hollowBox(ctx, root, w, body, d, t, { name: 'gable body' })
  const front = labelPlane(ctx, 'front', w * .9, body * .66); front.position.set(0, body * .5, d / 2 + .003); root.add(front)
  const roofLen = Math.hypot(rise, d / 2 - t), closed = -Math.atan2(d / 2 - t, rise)
  const roofs: THREE.Group[] = []
  for (const s of [1, -1]) {
    const pivot = new THREE.Group(); pivot.position.set(0, body, s * (d / 2 - t / 2)); pivot.rotation.order = 'YXZ'; pivot.rotation.y = s > 0 ? 0 : Math.PI
    const roof = roundedBox(w, roofLen, t, .004, panelMats(mats, '+z'), 'gable roof'); roof.position.y = roofLen / 2; pivot.add(roof)
    const plate = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, handleH), new THREE.Vector2(-w / 2, handleH)])
    const hw = Math.min(w * .32, 50 * ctx.scale), hh = handleH * .36, hy = handleH * .5
    const hole = new THREE.Path(); hole.absarc(-hw / 2, hy, hh / 2, Math.PI / 2, Math.PI * 1.5, false); hole.absarc(hw / 2, hy, hh / 2, Math.PI * 1.5, Math.PI / 2, false)
    plate.holes.push(hole)
    const handle = mesh(new THREE.ExtrudeGeometry(plate, { depth: t, bevelEnabled: false }), [mats.main, mats.edge], 'handle plate')
    const handleHinge = new THREE.Group(); handleHinge.position.y = roofLen; handleHinge.add(handle); handle.position.z = -t / 2
    pivot.add(handleHinge)
    pivot.userData = { s, handleHinge }
    if (s > 0) { const print = labelPlane(ctx, 'lid', w * .7, roofLen * .62); print.position.set(0, roofLen / 2, t / 2 + .003); pivot.add(print) }
    roofs.push(pivot); root.add(pivot)
  }
  const gussets: THREE.Mesh[] = []
  for (const s of [1, -1]) {
    const tri = new THREE.Shape([new THREE.Vector2(-(d / 2 - t), 0), new THREE.Vector2(d / 2 - t, 0), new THREE.Vector2(0, rise)])
    const g = mesh(new THREE.ShapeGeometry(tri), mats.main, 'gable gusset'); g.material = mats.main.clone(); (g.material as THREE.Material).side = THREE.DoubleSide
    g.rotation.y = s * Math.PI / 2; g.position.set(s * (w / 2 - t * .6), body, 0)
    gussets.push(g); root.add(g)
  }
  const setOpen = (v: number) => {
    const e = smooth(0, 1, v)
    for (const r of roofs) { r.rotation.x = lerp(closed, .55, e); (r.userData.handleHinge as THREE.Group).rotation.x = lerp(-closed, 0, e) }
    for (const g of gussets) g.scale.y = Math.max(.001, 1 - e)
  }
  if (design.hasHandles) addRopeHandles(ctx, root, w, body, d)
  return { root, setOpen, opens: true, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2, width: w * .86, height: body * .8, y: body / 2 } } }
}

// ---------------------------------------------------------------------------------------------
// Soft goods: bags, pouches, sachets, pillow boxes
// ---------------------------------------------------------------------------------------------

function buildBag(ctx: BuildContext): BuiltModel {
  const { w, h, d, mats, design } = ctx, t = Math.min(ctx.t, .025), root = new THREE.Group()
  hollowBox(ctx, root, w, h, d, t, { name: 'bag body' })
  // Gusset creases and a turnover band give the paper bag its construction.
  for (const s of [1, -1]) {
    const crease = mesh(new THREE.BoxGeometry(.004, h * .985, .004), mats.edge, 'gusset crease'); crease.position.set(s * (w / 2 + .001), h / 2, 0); root.add(crease)
  }
  const turnover = Math.min(h * .12, 30 * ctx.scale)
  for (const s of [1, -1]) { const band = mesh(new THREE.BoxGeometry(w - t * 2.2, turnover, .003), mats.main, 'turnover'); band.position.set(0, h - turnover / 2, s * (d / 2 - t - .002)); band.castShadow = false; root.add(band) }
  const front = labelPlane(ctx, 'front', w * .88, h * .65); front.position.set(0, h * .48, d / 2 + .003); root.add(front)
  if (design.hasHandles ?? true) addRopeHandles(ctx, root, w, h, d)
  return { root, setOpen: () => {}, opens: false, info: { bottom: { width: w, depth: d }, back: { kind: 'flat', z: d / 2, width: w * .86, height: h * .7, y: h / 2 } } }
}

type Bulge = (u: number, v: number) => number
/** A front (+1) or back (-1) skin whose depth at normalised (u, v) ∈ [0,1]² is bulge(u, v). */
function skin(w: number, h: number, bulge: Bulge, side: 1 | -1, u0 = 0, u1 = 1, v0 = 0, v1 = 1, lift = 0) {
  const geo = new THREE.PlaneGeometry(w * (u1 - u0), h * (v1 - v0), 64, 64)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = u0 + (p.getX(i) / (w * (u1 - u0)) + .5) * (u1 - u0), v = v0 + (p.getY(i) / (h * (v1 - v0)) + .5) * (v1 - v0)
    p.setXYZ(i, (u - .5) * w, v * h, side * (bulge(u, v) + lift))
  }
  if (side < 0) { geo.scale(-1, 1, 1) }
  geo.computeVertexNormals()
  return geo
}
function buildSoft(ctx: BuildContext, shape: 'pouch' | 'sachet' | 'pillow'): BuiltModel {
  const { w, h, d, mats } = ctx, root = new THREE.Group()
  const sealTop = shape === 'pouch' ? .09 : shape === 'sachet' ? .08 : 0
  const sealBottom = shape === 'sachet' ? .08 : 0
  const bulge: Bulge = shape === 'pouch'
    ? (u, v) => (d / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 4)), .5) * Math.pow(Math.max(0, Math.cos(Math.PI / 2 * Math.min(1, v / (1 - sealTop)))), .7)
    : shape === 'sachet'
      ? (u, v) => { const vv = (v - sealBottom) / (1 - sealTop - sealBottom); if (vv <= 0 || vv >= 1) return 0; return (d / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 2.5)), .5) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * vv - 1), 4)), .5) }
      : (u, v) => (d / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 2)), .55) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * v - 1), 2.6)), .6)
  root.add(mesh(skin(w, h, bulge, 1), mats.main, 'front skin'))
  root.add(mesh(skin(w, h, bulge, -1), mats.main, 'back skin'))
  if (shape === 'pouch') {
    // Elliptical gusset base so the pouch stands.
    const lens = new THREE.Shape(); const steps = 48
    for (let i = 0; i <= steps; i++) { const u = i / steps; const z = bulge(u, 0); if (i) lens.lineTo((u - .5) * w, z); else lens.moveTo((u - .5) * w, z) }
    for (let i = steps; i >= 0; i--) { const u = i / steps; lens.lineTo((u - .5) * w, -bulge(u, 0)) }
    const base = mesh(new THREE.ShapeGeometry(lens), mats.edge, 'gusset base'); base.rotation.x = Math.PI / 2; base.position.y = .002; root.add(base)
    const notchY = h * (1 - sealTop * .55)
    const zip = mesh(new THREE.BoxGeometry(w * .94, h * .012, .006), mats.edge, 'zipper'); zip.position.set(0, h * (1 - sealTop * 1.25), bulge(.5, 1 - sealTop * 1.25) + .002); root.add(zip)
    const seal = mesh(new THREE.BoxGeometry(w, h * sealTop, .006), mats.main, 'top seal'); seal.position.y = h * (1 - sealTop / 2); root.add(seal)
    const notch = mesh(new THREE.CylinderGeometry(h * .008, h * .008, .01, 12), mats.edge, 'tear notch'); notch.rotation.x = Math.PI / 2; notch.position.set(w / 2 - w * .04, notchY, 0); root.add(notch)
  } else if (shape === 'sachet') {
    for (const [y, size] of [[h * (1 - sealTop / 2), sealTop], [h * sealBottom / 2, sealBottom]] as const) {
      const crimp = mesh(new THREE.BoxGeometry(w, h * size, .005, 1, 12, 1), mats.main, 'crimped seal'); crimp.position.y = y
      const p = crimp.geometry.attributes.position
      for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Math.sin(p.getY(i) / (h * size) * Math.PI * 12) * .002)
      crimp.geometry.computeVertexNormals(); root.add(crimp)
    }
  } else {
    // Pillow end flaps: curved crease lines at top and bottom.
    for (const v of [0, 1]) {
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => { const u = i / 16; return new THREE.Vector3((u - .5) * w, v * h + (v ? -1 : 1) * Math.sin(u * Math.PI) * h * .09, bulge(u, v ? .91 : .09)) }))
      root.add(mesh(new THREE.TubeGeometry(curve, 48, .0025, 6), mats.edge, 'end crease'))
    }
  }
  const frontPrint = new THREE.Mesh(skin(w, h, bulge, 1, .1, .9, sealBottom + .14, 1 - sealTop - .12, .003), ctx.label('front', w * .8, h * (1 - sealTop - sealBottom - .26)))
  frontPrint.name = 'front print'; frontPrint.renderOrder = 2
  root.add(frontPrint)
  if (ctx.design.productInfo?.visible) {
    const back = new THREE.Mesh(skin(w, h, bulge, -1, .12, .88, sealBottom + .16, 1 - sealTop - .16, .003), ctx.label('info', w * .76, h * (1 - sealTop - sealBottom - .32)))
    back.name = 'info print'; back.renderOrder = 2; back.visible = false; back.userData.infoBack = true
    root.add(back)
  }
  return { root, setOpen: () => {}, opens: false, info: {} }
}

// ---------------------------------------------------------------------------------------------
// Round families: canister, tube, bottle, jar, custom lathe
// ---------------------------------------------------------------------------------------------

const V = (x: number, y: number) => new THREE.Vector2(Math.max(0, x), y)
function lathe(points: THREE.Vector2[], material: THREE.Material | THREE.Material[], name: string, segments = 96) {
  return mesh(new THREE.LatheGeometry(points, segments), material, name)
}
/** Wall with real thickness: outer up, rolled rim, inner down. */
function tubeWall(r: number, h: number, t: number) {
  return [V(r, 0), V(r, h - t * .6), V(r - t * .15, h), V(r - t * .85, h), V(r - t, h - t * .6), V(r - t, t), V(0.0001, t)]
}

function buildRound(ctx: BuildContext, shape: 'canister' | 'tube' | 'bottle' | 'jar' | 'lathe'): BuiltModel {
  const { mats, design, scale } = ctx, h = ctx.h, root = new THREE.Group()
  const L = roundLayout(design)
  const R = L.R * scale, t = Math.min(ctx.t, R * .12)
  const capH = L.capH * scale
  const see = mats.preset === 'glass' || mats.preset === 'clear'
  const paperBand = design.innerColor || '#f7f3ea'
  const labelOptions = see && shape !== 'lathe' ? { fill: paperBand } : undefined
  let setOpen: (t: number) => void = () => {}
  let opens = false
  const labelBand: [number, number] = [L.band[0] * scale, L.band[1] * scale]
  const labelR = L.labelR * scale
  const capAt = (cap: THREE.Object3D, closedY: number, lift: number) => {
    opens = true
    setOpen = v => { const up = smooth(0, .6, v), side = smooth(.35, 1, v); cap.position.set(-side * R * 1.25, closedY + up * lift - side * lift * .35, -side * R * .5); cap.rotation.set(0, 0, side * .55) }
  }
  if (shape === 'canister' || shape === 'tube') {
    root.add(lathe(tubeWall(R, h, t), mats.main, 'tube wall'))
    const liningMat = mats.inner.clone(); liningMat.side = THREE.BackSide
    root.add(lathe([V(R - t * 1.01, t), V(R - t * 1.01, h - t)], liningMat, 'lining'))
    root.add(lathe([V(0, 0), V(R * .98, 0), V(R, t * .5)], mats.edge, 'base'))
    if (shape === 'tube') {
      const endH = L.endH * scale
      root.add(lathe([V(0, -.001), V(R + t * 1.2, -.001), V(R + t * 1.3, endH * .2), V(R + t * 1.3, endH), V(R, endH)], mats.metal, 'end cap'))
    }
    if (!design.openTop) {
      const cap = new THREE.Group(); cap.name = 'cap'
      const rc = R + t * 1.25
      cap.add(lathe([V(rc, -capH / 2), V(rc, capH / 2 - t * .5), V(rc - t * .5, capH / 2), V(0, capH / 2)], mats.main, 'cap shell'))
      const capLining = mats.inner.clone(); capLining.side = THREE.BackSide
      cap.add(lathe([V(rc - t * .6, -capH / 2), V(rc - t * .6, capH / 2 - t)], capLining, 'cap lining'))
      if (shape === 'tube') cap.add(roundLabel(ctx, 'lid', rc + .003, capH * .55, 1.4))
      else { const print = labelPlane(ctx, 'lid', rc * 1.25, rc * 1.25); print.rotation.x = -Math.PI / 2; print.position.y = capH / 2 + .003; cap.add(print) }
      // Canister lids telescope 65% over the body; tube caps cover their full height.
      const closedY = shape === 'tube' ? h - capH / 2 + capH * .02 : h - capH / 2 + capH * .35
      root.add(cap); capAt(cap, closedY, capH + h * .12)
    }
  } else if (shape === 'bottle' || shape === 'jar') {
    const jar = shape === 'jar'
    const neckR = L.neckR * scale, shoulderH = L.shoulderH * scale, bodyTop = L.bodyTop * scale
    const pts: THREE.Vector2[] = [V(0, 0), V(R * .9, 0), V(R, Math.min(R * .1, bodyTop * .1)), V(R, bodyTop)]
    for (let i = 1; i <= 12; i++) { const k = i / 12; pts.push(V(lerp(R, neckR, jar ? k : 1 - Math.cos(k * Math.PI / 2)), bodyTop + shoulderH * (jar ? Math.sin(k * Math.PI / 2) : k))) }
    const neckTop = h - capH * .55
    pts.push(V(neckR, neckTop), V(neckR * .86, neckTop), V(neckR * .86, bodyTop + shoulderH))
    root.add(lathe(pts, mats.main, jar ? 'jar body' : 'bottle body'))
    if (see && !jar) {
      const fill = Math.max(R * .2, bodyTop * .85)
      const liquid = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(design.color).multiplyScalar(.7), roughness: .15, transparent: true, opacity: .85, clearcoat: .5 })
      root.add(lathe([V(0, R * .06), V(R * .93, R * .06), V(R * .95, R * .14), V(R * .95, fill), V(0, fill)], liquid, 'contents'))
    }
    if (!design.openTop) {
      const cap = new THREE.Group(); cap.name = 'cap'
      const rc = neckR * (jar ? 1.1 : 1.18)
      const capMesh = mesh(new THREE.LatheGeometry([V(rc, -capH / 2), V(rc, capH / 2 - rc * .1), V(rc * .9, capH / 2), V(0, capH / 2)], 96), mats.accent, 'cap')
      const p = capMesh.geometry.attributes.position
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); if (Math.hypot(x, z) > rc * .95) { const k = 1 + .015 * Math.sign(Math.sin(Math.atan2(z, x) * 48)); p.setX(i, x * k); p.setZ(i, z * k) } }
      capMesh.geometry.computeVertexNormals(); cap.add(capMesh)
      const print = labelPlane(ctx, 'lid', rc * 1.2, rc * 1.2); print.rotation.x = -Math.PI / 2; print.position.y = capH / 2 + .003; cap.add(print)
      root.add(cap); capAt(cap, h - capH / 2, capH + h * .1)
    }
  } else {
    const pts = shapeProfile(design).map(([r, y]) => V(r * R, y * h))
    if (pts[0].x > .001) pts.unshift(V(0, pts[0].y))
    const openTop = pts[pts.length - 1].x > .001
    const bodyMat = openTop ? mats.main.clone() : mats.main
    if (openTop) bodyMat.side = THREE.DoubleSide
    root.add(lathe(pts, bodyMat, 'revolved body'))
  }
  const bandH = labelBand[1] - labelBand[0]
  if (bandH > .02) {
    if (labelOptions) {
      const band = mesh(new THREE.CylinderGeometry(labelR + .002, labelR + .002, bandH, 96, 1, true), physicalPaper(paperBand), 'paper label')
      band.position.y = labelBand[0] + bandH / 2; root.add(band)
    }
    const print = roundLabel(ctx, 'front', labelR + .004, bandH * .92, ROUND_LABEL_ARC, 0, labelOptions)
    print.position.y = labelBand[0] + bandH / 2
    root.add(print)
  }
  if (design.hasHandles) addRopeHandles(ctx, root, R * 2, L.bodyTop * scale, R * 2)
  return { root, setOpen, opens, info: { bottom: { width: R * 1.3, depth: R * 1.3 }, ...(bandH > .02 ? { back: { kind: 'round' as const, radius: labelR + .005, height: bandH * .85, y: labelBand[0] + bandH / 2 } } : {}) } }
}
function physicalPaper(color: string) { return new THREE.MeshPhysicalMaterial({ color, roughness: .82, sheen: .3, sheenRoughness: .8 }) }

// ---------------------------------------------------------------------------------------------

export function buildShapeModel(ctx: BuildContext): BuiltModel {
  const shape = resolveShape(ctx.design)
  switch (shape) {
    case 'rigid-box': case 'window': case 'divider': return buildRigidBox(ctx, shape)
    case 'carton': return buildCarton(ctx)
    case 'mailer': return buildMailer(ctx)
    case 'drawer': return buildDrawer(ctx)
    case 'sleeve': return buildDrawer(ctx, true)
    case 'display': return buildDisplay(ctx)
    case 'hexagon': case 'octagon': case 'prism': case 'extrude': case 'tray': return buildPolygon(ctx, shape)
    case 'pyramid': return buildPyramid(ctx)
    case 'gable': return buildGable(ctx)
    case 'bag': return buildBag(ctx)
    case 'pouch': case 'sachet': case 'pillow': return buildSoft(ctx, shape)
    case 'canister': case 'tube': case 'bottle': case 'jar': case 'lathe': return buildRound(ctx, shape)
  }
}

/** Adds the bottom or back product-information print where the shape allows it. */
export function addInfoPrint(ctx: BuildContext, model: BuiltModel, placement: 'bottom' | 'back') {
  const soft = model.root.children.find(c => c.userData.infoBack)
  if (soft) { soft.visible = true; return }
  const { back, bottom } = model.info
  if (placement === 'back' && back) {
    if (back.kind === 'flat') {
      const p = labelPlane(ctx, 'info', back.width, back.height); p.rotation.y = Math.PI; p.position.set(0, back.y, -back.z - .004); model.root.add(p)
    } else {
      const p = roundLabel(ctx, 'info', back.radius, back.height, 1.5, Math.PI); p.position.y = back.y; model.root.add(p)
    }
    return
  }
  if (bottom) {
    const p = labelPlane(ctx, 'info', bottom.width * .86, bottom.depth * .84); p.rotation.x = Math.PI / 2; p.position.y = -.003; model.root.add(p)
  }
}
