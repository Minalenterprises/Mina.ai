import * as THREE from 'three'
import { getSurface, textureCanvas } from './textures'
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
  material.bumpScale = worldScale * .6 * surface.strength
  if (artwork.enabled) {
    material.color.set('#ffffff')
    map.userData.ready = printTile(design).then(canvas => { map.image = canvas; map.needsUpdate = true })
  }
  if (['foil', 'hammered', 'brushed-metal'].includes(surface.texture)) { material.metalness = .7; material.roughness = design.finish === 'Gloss' ? .18 : .42 }
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
