import * as THREE from 'three'
import { getSurface, TEXTURE_FINISHES } from './textures'
import { textureCanvas } from './texture-canvas'
import type { Design } from './types'
import { getArtwork, printTile } from './print-artwork'

export function applySurface(material: THREE.MeshStandardMaterial, design: Design, worldScale: number) {
  const surface = getSurface(design)
  const artwork = getArtwork(design)
  if (surface.texture === 'none' && !artwork.enabled) return undefined
  const map = new THREE.CanvasTexture(textureCanvas(surface.texture, surface.strength))
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  material.map = map
  material.bumpMap = artwork.enabled ? null : map
  const finish = TEXTURE_FINISHES[surface.texture] || {}
  material.bumpScale = worldScale * .6 * surface.strength * (finish.bump ?? 1)
  if (artwork.enabled) {
    material.color.set('#ffffff')
    map.userData.ready = printTile(design).then(canvas => { map.image = canvas; map.needsUpdate = true })
  }
  // Physical finish hints (metallic foils, iridescent holographic/pearl, velvet sheen) on top of the substrate preset.
  if (finish.metalness !== undefined) material.metalness = finish.metalness
  if (finish.roughness !== undefined) material.roughness = design.finish === 'Gloss' ? Math.min(finish.roughness, .2) : finish.roughness
  if (material instanceof THREE.MeshPhysicalMaterial) {
    if (finish.iridescence !== undefined) { material.iridescence = finish.iridescence * Math.max(.4, surface.strength); material.iridescenceIOR = 1.6; material.iridescenceThicknessRange = [180, 520] }
    if (finish.sheen !== undefined) { material.sheen = finish.sheen; material.sheenRoughness = .6; material.sheenColor.set('#ffffff') }
    if (finish.clearcoat !== undefined) { material.clearcoat = Math.max(material.clearcoat, finish.clearcoat); material.clearcoatRoughness = .12 }
  }
  // Object-space triplanar mapping keeps the weave/grain proportionate on every face.
  material.onBeforeCompile = shader => {
    shader.uniforms.surfaceFrequency = { value: 1 / ((artwork.enabled ? artwork.tileSize : 64 * surface.scale) * worldScale) }
    shader.uniforms.surfaceRotation = { value: THREE.MathUtils.degToRad(artwork.enabled ? artwork.rotation : surface.rotation) }
    shader.vertexShader = 'varying vec3 vSurfacePoint; varying vec3 vSurfaceNormal;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePoint = position; vSurfaceNormal = normal;')
    shader.fragmentShader = 'varying vec3 vSurfacePoint; varying vec3 vSurfaceNormal; uniform float surfaceFrequency; uniform float surfaceRotation;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec3 weights = abs(normalize(vSurfaceNormal));
        weights /= max(weights.x + weights.y + weights.z, 0.0001);
        vec3 point = vSurfacePoint * surfaceFrequency;
        float c = cos(surfaceRotation); float s = sin(surfaceRotation);
        mat2 rotation = mat2(c, s, -s, c);
        vec4 tile = texture2D(map, rotation * point.zy) * weights.x + texture2D(map, rotation * point.xz) * weights.y + texture2D(map, rotation * point.xy) * weights.z;
        diffuseColor *= tile;
      #endif
    `)
  }
  material.customProgramCacheKey = () => 'minal-triplanar-v1'
  return map
}
