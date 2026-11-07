/**
 * Turns the live Three.js canvas (rendered with preserveDrawingBuffer) into a shareable, watermarked image.
 * The image is cropped to the model's visible pixels with some margin, scaled down and stamped with "Mina.ai".
 */
export type DesignShot = { view: 'perspective' | 'back'; label: string; image: string }

/** Bounding box of non-transparent pixels, so the product fills the shot. */
function contentBounds(source: HTMLCanvasElement) {
  const probe = document.createElement('canvas')
  const scale = Math.min(1, 320 / Math.max(source.width, source.height))
  probe.width = Math.max(1, Math.round(source.width * scale)); probe.height = Math.max(1, Math.round(source.height * scale))
  const ctx = probe.getContext('2d', { willReadFrequently: true })
  if (!ctx) return undefined
  ctx.drawImage(source, 0, 0, probe.width, probe.height)
  const { data } = ctx.getImageData(0, 0, probe.width, probe.height)
  let minX = probe.width, minY = probe.height, maxX = -1, maxY = -1
  for (let y = 0; y < probe.height; y++) for (let x = 0; x < probe.width; x++) {
    if (data[(y * probe.width + x) * 4 + 3] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
  }
  if (maxX < 0) return undefined
  return { x: minX / scale, y: minY / scale, width: (maxX - minX + 1) / scale, height: (maxY - minY + 1) / scale }
}

export function watermarkedShot(source: HTMLCanvasElement, maxSize = 760): string {
  const bounds = contentBounds(source) || { x: 0, y: 0, width: source.width, height: source.height }
  // Square-ish crop around the product with a generous margin.
  const side = Math.min(Math.max(source.width, source.height), Math.max(bounds.width, bounds.height) * 1.32)
  const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2
  const crop = { x: cx - side / 2, y: cy - side / 2, size: side }
  const out = document.createElement('canvas')
  const size = Math.round(Math.min(maxSize, side))
  out.width = size; out.height = size
  const ctx = out.getContext('2d')!
  // Soft studio backdrop so the transparent WebGL background reads well in chat and downloads.
  const backdrop = ctx.createRadialGradient(size / 2, size * .42, size * .05, size / 2, size / 2, size * .75)
  backdrop.addColorStop(0, '#2a2d2b'); backdrop.addColorStop(1, '#121413')
  ctx.fillStyle = backdrop
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(source, crop.x, crop.y, crop.size, crop.size, 0, 0, size, size)
  // Subtle watermark, bottom right.
  const fontSize = Math.max(11, Math.round(size * .032))
  ctx.font = `600 ${fontSize}px Inter, "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = fontSize * .4
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.fillText('Mina.ai', size - fontSize * .9, size - fontSize * .8)
  const webp = out.toDataURL('image/webp', .84)
  return webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/jpeg', .86)
}
