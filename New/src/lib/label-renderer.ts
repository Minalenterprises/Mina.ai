import type { Design } from './types'
import { fitText, getTypography, printedText, textColor } from './typography'
import { loadFont } from './fonts'
import { barcodeBits, getProductInfo, infoCopy, validBarcode } from './product-info'

export async function prepareLabel(design: Design) {
  await loadFont(getTypography(design).fontFamily)
  if (!design.logo) return undefined
  return new Promise<HTMLImageElement | undefined>(resolve => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(undefined)
    image.src = design.logo!
  })
}

export function paintLabel(canvas: HTMLCanvasElement, design: Design, face: 'front' | 'lid', logo?: HTMLImageElement) {
  const ctx = canvas.getContext('2d')!
  const t = getTypography(design)
  ctx.resetTransform()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const width = canvas.width * t.blockScale, height = canvas.height * t.blockScale
  if (!t.visible || (t.placement !== 'both' && t.placement !== face)) return
  ctx.translate((canvas.width - width) / 2, (canvas.height - height) / 2)
  if (t.background !== 'none') { ctx.fillStyle = t.background; ctx.fillRect(0, 0, width, height) }
  const pad = Math.min(width, height) * .09
  let top = pad
  if (logo) {
    const ratio = Math.min(width * .32 / logo.width, height * .22 / logo.height)
    const lw = logo.width * ratio, lh = logo.height * ratio
    const lx = t.align === 'left' ? pad : t.align === 'right' ? width - pad - lw : (width - lw) / 2
    ctx.drawImage(logo, lx, top, lw, lh)
    top += lh + pad * .5
  }
  const subtitleHeight = t.subtitle ? height * .2 : 0
  const areaHeight = height - top - pad - subtitleHeight
  const copy = printedText(design)
  const arabic = /[\u0600-\u06ff]/.test(copy + t.subtitle)
  ctx.direction = arabic ? 'rtl' : 'ltr'
  const spacing = arabic ? 0 : t.letterSpacing
  const font = (size: number, weight = t.fontWeight) => { ctx.font = `${weight} ${size}px "${t.fontFamily}"`; ctx.letterSpacing = `${spacing * size}px` }
  const layout = fitText(copy, width - pad * 2, areaHeight, Math.min(width, height) * t.size / 100, t.lineHeight, (value, size) => { font(size); return ctx.measureText(value).width })
  font(layout.size)
  ctx.fillStyle = textColor(design)
  ctx.textAlign = t.align
  ctx.textBaseline = 'middle'
  const x = t.align === 'left' ? pad : t.align === 'right' ? width - pad : width / 2
  const y = top + (areaHeight - layout.height) / 2 + layout.size * t.lineHeight / 2
  layout.lines.forEach((line, index) => ctx.fillText(line, x, y + index * layout.size * t.lineHeight))
  if (t.subtitle) {
    const small = fitText(t.subtitle, width - pad * 2, subtitleHeight, Math.min(width, height) * .07, 1.2, (value, size) => { font(size, 400); return ctx.measureText(value).width })
    font(small.size, 400)
    const sy = height - pad - subtitleHeight / 2 - small.height / 2 + small.size * .6
    small.lines.forEach((line, index) => ctx.fillText(line, x, sy + index * small.size * 1.2))
  }
}

export function paintProductInfo(canvas: HTMLCanvasElement, design: Design) {
  const ctx = canvas.getContext('2d')!, { width, height } = canvas
  ctx.clearRect(0, 0, width, height)
  const info = getProductInfo(design), t = getTypography(design)
  if (!info.visible) return
  if (design.artwork?.enabled) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height) }
  const pad = Math.min(width, height) * .09
  const barcode = validBarcode(info.barcode)
  const available = height - pad * 2 - (barcode ? height * .25 : 0)
  const layout = fitText(infoCopy(design), width - pad * 2, available, Math.min(width, height) * .085, 1.3, (text, size) => { ctx.font = `400 ${size}px "${t.fontFamily}"`; return ctx.measureText(text).width })
  ctx.font = `400 ${layout.size}px "${t.fontFamily}"`
  ctx.fillStyle = design.artwork?.enabled ? '#17231b' : textColor(design); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.direction = /[\u0600-\u06ff]/.test(infoCopy(design)) ? 'rtl' : 'ltr'
  layout.lines.forEach((line, index) => ctx.fillText(line, pad, pad + layout.size * .65 + index * layout.size * 1.3))
  if (barcode) {
    const bits = barcodeBits(info.barcode), bw = Math.min(width * .65, height * 1.8), bh = height * .15
    const x = (width - bw) / 2, y = height - pad - bh - height * .05, module = bw / 115
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, bw, bh + height * .05)
    ctx.fillStyle = '#000000'
    ;[...bits].forEach((bit, index) => { if (bit === '1') ctx.fillRect(x + (index + 10) * module, y, module + .1, bh) })
    ctx.font = `400 ${height * .035}px "Inter"`; ctx.textAlign = 'center'; ctx.direction = 'ltr'
    ctx.fillText(info.barcode, width / 2, y + bh + height * .028)
  }
}
