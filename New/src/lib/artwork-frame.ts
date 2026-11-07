import type { Design } from './types'
import type { Panel } from './dieline-layout'

/** Physical print area shared with the per-face sizes used by the 3D preview. */
export function artworkFrame(design: Design, p: Panel) {
  const { length: L, width: W, height: H } = design.dimensions
  let width = p.width, height = p.height, cy = p.y + p.height / 2
  if (p.artwork === 'front') {
    if (design.category === 'Canister') { width = Math.min(L, W) * .78; height = H * .64 }
    else if (design.category === 'Bag') { width *= .88; height *= .65; cy = p.y + p.height * .48 }
    else if (design.category === 'Carton') { width *= .94; height *= .63; cy = p.y + p.height * .4 }
    else if (design.structure === 'hexagon') { width *= .86; height *= .7 }
    else { width *= .85; height *= .7 }
  } else if (p.artwork === 'lid') {
    if (p.id === 'sleeve-0') { width = L * .78; height = W * .72 }
    else if (design.category === 'Carton') { width = L * .8 * .93; height = W * .8 * .9 }
    else if (design.category === 'Canister') { width = Math.min(L, W) * .76 * .93; height = Math.min(L, W) * .76 * .9 }
    else if (design.structure === 'hexagon') { width = Math.min(L, W) * .625 * .93; height = Math.min(L, W) * .625 * .9 }
    else if (design.structure === 'window') { width = L * .7; height = W * .16; cy = p.y + p.height / 2 + W * .405 }
    else { width = L * .93; height = W * .9 }
  } else if (p.artwork === 'info') {
    if (p.circle || p.polygon) { width = height = Math.min(L, W) * .66 }
    else { width = Math.min(L, p.width) * .86; height = p.height * .84 }
  }
  return { x: p.x + (p.width - width) / 2, y: cy - height / 2, width, height }
}
