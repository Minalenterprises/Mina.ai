import * as THREE from 'three'
import type { Design, MaterialPreset } from './types'
import { resolveMaterialPreset } from './materials-catalog'
export { MATERIAL_PRESETS, resolveMaterialPreset } from './materials-catalog'

type Options = { color: THREE.ColorRepresentation; finish?: string; preset: Exclude<MaterialPreset, 'auto'>; side?: THREE.Side }

/** A MeshPhysicalMaterial tuned for one packaging substrate. */
export function physicalMaterial({ color, finish, preset, side = THREE.FrontSide }: Options) {
  const m = new THREE.MeshPhysicalMaterial({ color, side, roughness: .7, metalness: 0 })
  const gloss = finish === 'Gloss', soft = finish === 'Soft-touch'
  switch (preset) {
    case 'kraft': m.roughness = .96; m.sheen = .25; m.sheenRoughness = .9; m.sheenColor.set('#fff5e6'); break
    case 'matte': m.roughness = .82; break
    case 'soft-touch': m.roughness = .95; m.sheen = .6; m.sheenRoughness = .7; m.sheenColor.set('#ffffff'); break
    case 'gloss': m.roughness = .22; m.clearcoat = 1; m.clearcoatRoughness = .06; break
    case 'foil': m.metalness = 1; m.roughness = gloss ? .12 : soft ? .45 : .26; m.clearcoat = .4; m.clearcoatRoughness = .1; break
    case 'metal': m.metalness = .92; m.roughness = gloss ? .22 : .38; break
    // Opacity-based transparency (not transmission): transmission samples the canvas behind the object,
    // which is transparent in this app and would render glass almost black.
    case 'clear': m.roughness = .04; m.transparent = true; m.opacity = .22; m.depthWrite = false; m.clearcoat = 1; m.clearcoatRoughness = .02; m.envMapIntensity = 1.4; m.color.lerp(new THREE.Color('#ffffff'), .7); break
    case 'glass': m.roughness = soft ? .38 : .05; m.transparent = true; m.opacity = soft ? .78 : .55; m.depthWrite = false; m.clearcoat = 1; m.clearcoatRoughness = .03; m.envMapIntensity = 1.5; m.specularIntensity = 1; break
    case 'plastic': m.roughness = gloss ? .18 : .42; m.clearcoat = gloss ? .6 : .15; m.clearcoatRoughness = .2; break
    default: m.roughness = gloss ? .3 : soft ? .9 : .62; m.clearcoat = gloss ? .7 : .08; m.clearcoatRoughness = .25
  }
  if (preset === 'paper' && gloss) m.clearcoat = 1
  return m
}

export type PackagingMaterials = {
  main: THREE.MeshPhysicalMaterial
  inner: THREE.MeshPhysicalMaterial
  edge: THREE.MeshPhysicalMaterial
  accent: THREE.MeshPhysicalMaterial
  metal: THREE.MeshPhysicalMaterial
  clear: THREE.MeshPhysicalMaterial
  board: THREE.MeshPhysicalMaterial
  preset: Exclude<MaterialPreset, 'auto'>
  dispose: () => void
}

export function createPackagingMaterials(design: Design): PackagingMaterials {
  const preset = resolveMaterialPreset(design)
  const color = new THREE.Color(design.color)
  const see = preset === 'clear' || preset === 'glass'
  const main = physicalMaterial({ color, finish: design.finish, preset, side: see ? THREE.DoubleSide : THREE.FrontSide })
  const inner = physicalMaterial({ color: design.innerColor ? new THREE.Color(design.innerColor) : color.clone().lerp(new THREE.Color('#ffffff'), .35), preset: preset === 'kraft' ? 'kraft' : 'matte', side: THREE.DoubleSide })
  // Board edges show the raw core of the substrate.
  const edge = physicalMaterial({ color: preset === 'kraft' ? color.clone().multiplyScalar(.82) : color.clone().multiplyScalar(.9), preset: 'matte' })
  const board = physicalMaterial({ color: '#d9cdb8', preset: 'kraft' })
  const accentColor = design.accentColor ? new THREE.Color(design.accentColor) : color.clone().multiplyScalar(.4).lerp(new THREE.Color('#222222'), .5)
  const accent = physicalMaterial({ color: accentColor, finish: 'Gloss', preset: 'plastic' })
  const metal = physicalMaterial({ color: design.accentColor || '#d4af37', finish: 'Gloss', preset: 'metal' })
  const clear = physicalMaterial({ color: '#ffffff', preset: 'clear', side: THREE.DoubleSide })
  const all = [main, inner, edge, board, accent, metal, clear]
  return { main, inner, edge, accent, metal, clear, board, preset, dispose: () => all.forEach(material => material.dispose()) }
}
