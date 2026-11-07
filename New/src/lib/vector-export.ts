import type { Design, PrintLayer } from './types'
import { buildDieline, COLOR_BAR, cutBounds, hexToCmyk, mm, outerCuts, PRINT_SPEC, safeOutline, sheetMarks, type FlatLayout, type Panel, type Point } from './dieline-layout'
import { artworkFrame } from './artwork-frame'
import { fitText, getTypography, printedText, textColor } from './typography'
import { loadFont } from './fonts'
import { getArtwork, MOTIF_PATHS } from './print-artwork'
import { getSurface, textureName, TINTED_TEXTURES } from './textures'
import { textureCanvas } from './texture-canvas'
import { barcodeBits, getProductInfo, infoCopy, validBarcode } from './product-info'

/**
 * Fully editable vector SVG of the flat artwork, built for CorelDRAW / Illustrator / Inkscape:
 *  - one top-level group per production layer (Bleed, Artwork, Texture, Images, Text, Glue, Safe, Cut,
 *    Crease, Perforation, Marks, Dimensions), named with id + inkscape:label so editors list them as layers;
 *  - printed copy and product information as live <text> (font family, size, weight, colour, alignment,
 *    letter spacing) — never outlined or rasterised;
 *  - every print motif expanded into individual vector shapes, clipped to its panel (PowerClip in Corel);
 *  - logos / generated art as separate embedded <image> objects; barcodes as vector bars;
 *  - colours as hex fills with CMYK estimates in data-cmyk attributes and a swatch legend.
 * Units: 1 user unit = 1 mm (width/height in mm).
 */
export type EditableSvgOptions = { marks?: boolean; guides?: boolean; dimensions?: boolean; maxMotifs?: number }
export type EditableSvgResult = { svg: string; colors: string[]; fonts: string[]; stats: { motifs: number; texts: number; layers: string[]; patternFallback: boolean } }

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const n = (value: number) => mm(value)
const pts = (list: Point[]) => list.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')
const isArabic = (text: string) => /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/.test(text)

/** Outward miter offset of a simple polygon (bevelled at very sharp corners). */
export function offsetPolygon(poly: Point[], d: number): Point[] {
  const count = poly.length
  if (count < 3) return poly
  const signed = poly.reduce((s, p, i) => { const q = poly[(i + 1) % count]; return s + p[0] * q[1] - q[0] * p[1] }, 0)
  const dir = signed > 0 ? -1 : 1 // y-down screen space: positive area = clockwise on screen
  const out: Point[] = []
  for (let i = 0; i < count; i++) {
    const prev = poly[(i - 1 + count) % count], cur = poly[i], next = poly[(i + 1) % count]
    const e1 = [cur[0] - prev[0], cur[1] - prev[1]], e2 = [next[0] - cur[0], next[1] - cur[1]]
    const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1
    const n1 = [dir * e1[1] / l1, -dir * e1[0] / l1], n2 = [dir * e2[1] / l2, -dir * e2[0] / l2]
    const bis = [n1[0] + n2[0], n1[1] + n2[1]], bl = Math.hypot(bis[0], bis[1])
    const cos = bl / 2
    if (bl < 1e-6 || cos < .3) { out.push([cur[0] + n1[0] * d, cur[1] + n1[1] * d], [cur[0] + n2[0] * d, cur[1] + n2[1] * d]); continue }
    const k = d / cos
    out.push([cur[0] + bis[0] / bl * k, cur[1] + bis[1] / bl * k])
  }
  return out
}

type Measure = { width: (text: string, size: number, weight?: number) => number; baseline: (size: number) => number }
function measurer(family: string, letterSpacing: number): Measure {
  const ctx = document.createElement('canvas').getContext('2d')!
  const set = (size: number, weight: number) => { ctx.font = `${weight} ${size * 10}px "${family}"`; ctx.letterSpacing = `${letterSpacing * size * 10}px`; ctx.textBaseline = 'alphabetic' }
  return {
    width: (text, size, weight = 700) => { set(size, weight); return ctx.measureText(text).width / 10 },
    // Offset from the em-box middle (canvas 'middle' baseline) to the alphabetic baseline.
    baseline: size => { set(size, 400); const m = ctx.measureText('Hg'); return ((m.fontBoundingBoxAscent ?? size * 8) - (m.fontBoundingBoxDescent ?? size * 2)) / 20 },
  }
}

function imageSize(src?: string) {
  if (!src) return Promise.resolve(undefined)
  return new Promise<{ w: number; h: number } | undefined>(resolve => { const img = new Image(); img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 }); img.onerror = () => resolve(undefined); img.src = src })
}

/** Grain tile converted to a transparent PNG (dark grain = opaque), so it overlays correctly even without blend modes. */
function textureOverlay(id: string, strength: number) {
  const source = textureCanvas(id, strength, 256), canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)
  const data = ctx.getImageData(0, 0, 256, 256), tinted = TINTED_TEXTURES.has(id)
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2], lum = .299 * r + .587 * g + .114 * b
    data.data[i + 3] = Math.round(tinted ? Math.min(255, (255 - lum) * 1.4 + 40) : (255 - lum))
    if (!tinted) data.data[i] = data.data[i + 1] = data.data[i + 2] = 20
  }
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL('image/png')
}

export async function buildEditableSvg(design: Design, options: EditableSvgOptions = {}): Promise<EditableSvgResult> {
  const { marks: showMarks = true, guides: showGuides = true, dimensions: showDimensions = true, maxMotifs = 20000 } = options
  const layout: FlatLayout = buildDieline(design)
  const t = getTypography(design), a = getArtwork(design), surface = getSurface(design), info = getProductInfo(design)
  await loadFont(t.fontFamily).catch(() => undefined)
  const measure = measurer(t.fontFamily, t.letterSpacing)
  const logoSize = await imageSize(design.logo), artSize = await imageSize(a.image)
  const colors = new Set<string>(), fonts = new Set<string>([t.fontFamily, 'Arial'])
  const color = (hex: string) => { if (/^#[0-9a-f]{6}$/i.test(hex)) colors.add(hex.toLowerCase()); return hex }
  const cmyk = (hex: string) => /^#[0-9a-f]{6}$/i.test(hex) ? ` data-cmyk="${hexToCmyk(hex).join(',')}"` : ''
  const defs: string[] = [], { width, height, footerY } = layout
  const printBg = color(a.enabled && a.background !== 'auto' ? a.background : design.color)
  const panels = layout.panels
  let motifCount = 0, textCount = 0, patternFallback = false

  // Panel clip paths (become PowerClip containers in CorelDRAW).
  const clipId = (p: Panel) => `clip-${p.id}`
  for (const p of panels) defs.push(`<clipPath id="${clipId(p)}">${p.circle ? `<circle cx="${n(p.x + p.width / 2)}" cy="${n(p.y + p.height / 2)}" r="${n(p.width / 2)}"/>` : p.polygon ? `<polygon points="${pts(p.polygon)}"/>` : `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.width)}" height="${n(p.height)}"/>`}</clipPath>`)
  const outer = outerCuts(layout), bleedPolys = outer.map(poly => offsetPolygon(poly, PRINT_SPEC.bleed))
  defs.push(`<clipPath id="clip-bleed">${bleedPolys.map(poly => `<polygon points="${pts(poly)}"/>`).join('')}</clipPath>`)

  // ── Motif expansion ──────────────────────────────────────────────────────────────────────
  const tile = a.enabled ? a.tileSize : 0
  const vectorLayers = a.layers.filter(l => l.shape !== 'logo' && l.shape !== 'image')
  const rasterLayers = a.layers.filter(l => (l.shape === 'logo' && design.logo) || (l.shape === 'image' && a.image))
  const motif = (l: PrintLayer, ox: number, oy: number) => {
    const T = tile, x = ox + (((l.x % 100) + 100) % 100) * T / 100, y = oy + (((l.y % 100) + 100) % 100) * T / 100
    const w = l.width * T / 100, h = l.height * T / 100, rot = l.rotation ? ` rotate(${n(l.rotation)})` : ''
    const op = l.opacity < 1 ? ` opacity="${n(l.opacity)}"` : ''
    const name = ` data-name="${esc(l.name)}"`
    if (l.shape === 'logo' || l.shape === 'image') {
      const size = l.shape === 'logo' ? logoSize : artSize, src = l.shape === 'logo' ? design.logo! : a.image!
      const k = size ? Math.min(w / size.w, h / size.h) : 1, iw = size ? size.w * k : w, ih = size ? size.h * k : h
      return `<image${name} transform="translate(${n(x)} ${n(y)})${rot}" x="${n(-iw / 2)}" y="${n(-ih / 2)}" width="${n(iw)}" height="${n(ih)}" preserveAspectRatio="xMidYMid meet" xlink:href="${src}"${op}/>`
    }
    const fill = l.fill === 'none' ? 'none' : color(l.fill), stroke = l.stroke !== 'none' && l.strokeWidth ? color(l.stroke) : 'none'
    const paint = ` fill="${fill}"${cmyk(fill)}${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${n(l.strokeWidth * 100 / Math.max(l.width, l.height))}"` : ''}`
    const transform = ` transform="translate(${n(x)} ${n(y)})${rot} scale(${n(w / 100)} ${n(h / 100)})"`
    if (l.shape === 'ellipse') return `<ellipse${name}${transform} cx="0" cy="0" rx="50" ry="50"${paint}${op}/>`
    if (l.shape === 'rect') return `<rect${name}${transform} x="-50" y="-50" width="100" height="100"${paint}${op}/>`
    const d = l.shape === 'leaf' ? MOTIF_PATHS.leaf : l.shape === 'petal' ? MOTIF_PATHS.petal : l.path || ''
    return `<path${name}${transform} d="${esc(d)}"${paint}${op}/>`
  }
  /** Motif instances covering a region, anchored like the on-screen pattern (tile origin at cx, cy). */
  const motifsFor = (layers: PrintLayer[], box: { x: number; y: number; width: number; height: number }, cx: number, cy: number) => {
    if (!tile || !layers.length) return ''
    const rad = -a.rotation * Math.PI / 180, corners = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
    const local = corners.map(([x, y]) => [cx + (x - cx) * Math.cos(rad) - (y - cy) * Math.sin(rad), cy + (x - cx) * Math.sin(rad) + (y - cy) * Math.cos(rad)])
    const i0 = Math.floor((Math.min(...local.map(p => p[0])) - cx) / tile) - 1, i1 = Math.ceil((Math.max(...local.map(p => p[0])) - cx) / tile)
    const j0 = Math.floor((Math.min(...local.map(p => p[1])) - cy) / tile) - 1, j1 = Math.ceil((Math.max(...local.map(p => p[1])) - cy) / tile)
    const parts: string[] = []
    for (const l of layers) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { parts.push(motif(l, cx + i * tile, cy + j * tile)); motifCount++ }
    return a.rotation ? `<g transform="rotate(${n(a.rotation)} ${n(cx)} ${n(cy)})">${parts.join('')}</g>` : parts.join('')
  }
  // Estimate the expansion; huge sheets with tiny repeats fall back to a vector <pattern> (still editable shapes inside).
  const span = (p: Panel) => a.rotation ? [Math.hypot(p.width, p.height), Math.hypot(p.width, p.height)] : [p.width, p.height]
  const estimate = panels.filter(p => p.id !== 'window-hole').reduce((sum, p) => { const [sw, sh] = span(p); return sum + Math.ceil(sw / Math.max(1, tile) + 3) * Math.ceil(sh / Math.max(1, tile) + 3) * vectorLayers.length }, 0)
  if (a.enabled && estimate > maxMotifs) {
    patternFallback = true
    defs.push(`<pattern id="print-motifs" width="${n(tile)}" height="${n(tile)}" patternUnits="userSpaceOnUse"${a.rotation ? ` patternTransform="rotate(${n(a.rotation)})"` : ''}>${vectorLayers.flatMap(l => [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => motif(l, dx * tile, dy * tile)))).join('')}</pattern>`)
  }
  const panelMotifs = (p: Panel, layers: PrintLayer[]) => patternFallback && layers === vectorLayers
    ? `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.width)}" height="${n(p.height)}" fill="url(#print-motifs)"/>`
    : motifsFor(layers, p, p.x + p.width / 2, p.y + p.height / 2)

  // ── Layers ───────────────────────────────────────────────────────────────────────────────
  const layers: [string, string, string][] = []
  const layer = (id: string, label: string, body: string, attrs = '') => { if (body.trim()) layers.push([id, label, `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${esc(label)}"${attrs}>${body}</g>`]) }

  const blank = cutBounds(layout)
  layer('Bleed', `Bleed ${PRINT_SPEC.bleed} mm`, bleedPolys.map(poly => `<polygon points="${pts(poly)}" fill="${printBg}"${cmyk(printBg)}/>`).join('')
    + (a.enabled && vectorLayers.length && !patternFallback ? `<g clip-path="url(#clip-bleed)" data-name="Bleed motifs">${motifsFor(vectorLayers, { x: blank.x - 4, y: blank.y - 4, width: blank.width + 8, height: blank.height + 8 }, blank.x, blank.y)}</g>` : ''))

  const artwork = panels.map(p => {
    if (p.id === 'window-hole') return `<g id="art-${p.id}" data-name="${esc(p.name)}"><rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.width)}" height="${n(p.height)}" fill="#ffffff"/></g>`
    const background = p.circle ? `<circle cx="${n(p.x + p.width / 2)}" cy="${n(p.y + p.height / 2)}" r="${n(p.width / 2)}" fill="${printBg}"${cmyk(printBg)}/>` : p.polygon ? `<polygon points="${pts(p.polygon)}" fill="${printBg}"${cmyk(printBg)}/>` : `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.width)}" height="${n(p.height)}" fill="${printBg}"${cmyk(printBg)}/>`
    const motifs = a.enabled ? panelMotifs(p, vectorLayers) : ''
    return `<g id="art-${p.id}" data-name="${esc(p.name)}">${background}${motifs ? `<g clip-path="url(#${clipId(p)})">${motifs}</g>` : ''}</g>`
  }).join('')
  layer('Artwork', 'Artwork (vector)', artwork)

  if (surface.texture !== 'none') {
    const ts = 64 * surface.scale
    defs.push(`<pattern id="texture-grain" width="${n(ts)}" height="${n(ts)}" patternUnits="userSpaceOnUse"${surface.rotation ? ` patternTransform="rotate(${n(surface.rotation)})"` : ''}><image width="${n(ts)}" height="${n(ts)}" xlink:href="${textureOverlay(surface.texture, surface.strength)}"/></pattern>`)
    layer('Texture', `Texture · ${textureName(surface.texture)} (raster overlay)`, panels.filter(p => p.id !== 'window-hole').map(p => `<rect clip-path="url(#${clipId(p)})" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.width)}" height="${n(p.height)}" fill="url(#texture-grain)"/>`).join(''), ' opacity="0.85"')
  }

  // Printed copy and logos.
  const textParts: string[] = [], imageParts: string[] = []
  const anchorFor = (align: 'left' | 'center' | 'right', rtl: boolean) => align === 'center' ? 'middle' : (align === 'left') !== rtl ? 'start' : 'end'
  const textNode = (lines: string[], x: number, firstMiddle: number, size: number, step: number, weight: number, fill: string, align: 'left' | 'center' | 'right', spacing: number, family: string, name: string) => {
    const rtl = isArabic(lines.join(' ')), base = measure.baseline(size)
    textCount++
    fonts.add(family)
    return `<text data-name="${esc(name)}" font-family="${esc(family)}" font-size="${n(size)}" font-weight="${weight}" fill="${color(fill)}"${cmyk(fill)} text-anchor="${anchorFor(align, rtl)}"${spacing && !rtl ? ` letter-spacing="${n(spacing * size)}"` : ''}${rtl ? ' direction="rtl"' : ''} xml:space="preserve">${lines.map((line, i) => `<tspan x="${n(x)}" y="${n(firstMiddle + i * step + base)}">${esc(line) || ' '}</tspan>`).join('')}</text>`
  }
  for (const p of panels) {
    if (!p.artwork) continue
    const f = artworkFrame(design, p), rotate = p.id === 'sleeve-0' || p.rotate
    const wrap = (body: string) => body ? (rotate ? `<g data-name="${esc(p.name)} (rotated 90°)" transform="rotate(90 ${n(p.x + p.width / 2)} ${n(p.y + p.height / 2)})">${body}</g>` : `<g data-name="${esc(p.name)}">${body}</g>`) : ''
    if (p.artwork === 'info') {
      if (!info.visible) continue
      const pad = Math.min(f.width, f.height) * .09, barcode = validBarcode(info.barcode), copy = infoCopy(design)
      const fit = fitText(copy, f.width - pad * 2, f.height - pad * 2 - (barcode ? f.height * .25 : 0), Math.min(f.width, f.height) * .085, 1.3, (s, size) => measure.width(s, size, 400))
      let body = a.enabled ? `<rect x="${n(f.x)}" y="${n(f.y)}" width="${n(f.width)}" height="${n(f.height)}" fill="#ffffff" data-name="Info panel"/>` : ''
      body += textNode(fit.lines, f.x + pad, f.y + pad + fit.size * .65, fit.size, fit.size * 1.3, 400, a.enabled ? '#17231b' : textColor(design), 'left', 0, t.fontFamily, 'Product information')
      if (barcode) {
        const bits = barcodeBits(info.barcode), bw = Math.min(f.width * .65, f.height * 1.8), bh = f.height * .15, bx = f.x + (f.width - bw) / 2, by = f.y + f.height - pad - bh - f.height * .05, mod = bw / 115
        let bars = `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh + f.height * .05)}" fill="#ffffff"/>`
        for (let i = 0; i < bits.length;) { if (bits[i] !== '1') { i++; continue } let j = i; while (bits[j] === '1') j++; bars += `<rect x="${n(bx + (i + 10) * mod)}" y="${n(by)}" width="${n((j - i) * mod)}" height="${n(bh)}" fill="#000000" data-cmyk="0,0,0,100"/>`; i = j }
        body += `<g data-name="EAN-13 ${info.barcode}">${bars}${textNode([info.barcode], f.x + f.width / 2, by + bh + f.height * .028, f.height * .035, 0, 400, '#000000', 'center', 0, 'Inter', 'Barcode digits')}</g>`
      }
      textParts.push(wrap(body))
      continue
    }
    if (!t.visible || (t.placement !== 'both' && t.placement !== p.artwork)) continue
    const w = f.width * t.blockScale, h = f.height * t.blockScale, ox = f.x + (f.width - w) / 2, oy = f.y + (f.height - h) / 2
    let body = '', images = ''
    if (t.background !== 'none') body += `<rect data-name="Brand plaque" x="${n(ox)}" y="${n(oy)}" width="${n(w)}" height="${n(h)}" fill="${color(t.background)}"${cmyk(t.background)}/>`
    const pad = Math.min(w, h) * .09
    let top = pad
    if (design.logo && logoSize) {
      const k = Math.min(w * .32 / logoSize.w, h * .22 / logoSize.h), lw = logoSize.w * k, lh = logoSize.h * k
      const lx = t.align === 'left' ? pad : t.align === 'right' ? w - pad - lw : (w - lw) / 2
      images += `<image data-name="Logo" x="${n(ox + lx)}" y="${n(oy + top)}" width="${n(lw)}" height="${n(lh)}" preserveAspectRatio="xMidYMid meet" xlink:href="${design.logo}"/>`
      top += lh + pad * .5
    }
    const subtitleHeight = t.subtitle ? h * .2 : 0, areaHeight = h - top - pad - subtitleHeight
    const copy = printedText(design), rtl = isArabic(copy + t.subtitle), spacing = rtl ? 0 : t.letterSpacing
    const fit = fitText(copy, w - pad * 2, areaHeight, Math.min(w, h) * t.size / 100, t.lineHeight, (s, size) => measure.width(s, size, t.fontWeight))
    const x = ox + (t.align === 'left' ? pad : t.align === 'right' ? w - pad : w / 2)
    body += textNode(fit.lines, x, oy + top + (areaHeight - fit.height) / 2 + fit.size * t.lineHeight / 2, fit.size, fit.size * t.lineHeight, t.fontWeight, textColor(design), t.align, spacing, t.fontFamily, p.artwork === 'lid' ? 'Lid title' : 'Front title')
    if (t.subtitle) {
      const small = fitText(t.subtitle, w - pad * 2, subtitleHeight, Math.min(w, h) * .07, 1.2, (s, size) => measure.width(s, size, 400))
      body += textNode(small.lines, x, oy + h - pad - subtitleHeight / 2 - small.height / 2 + small.size * .6, small.size, small.size * 1.2, 400, textColor(design), t.align, spacing, t.fontFamily, 'Subtitle')
    }
    textParts.push(wrap(body))
    if (images) imageParts.push(wrap(images))
  }
  if (a.enabled && rasterLayers.length) for (const p of panels) if (p.id !== 'window-hole') imageParts.push(`<g data-name="${esc(p.name)} logo/image motifs" clip-path="url(#${clipId(p)})">${panelMotifs(p, rasterLayers)}</g>`)
  layer('Images', 'Images (logos, generated art)', imageParts.join(''))
  layer('Text', 'Text (live, editable)', textParts.join(''))

  layer('Glue', 'Glue areas', panels.filter(p => /GLUE/.test(p.name)).map(p => `<g data-name="${esc(p.name)}" clip-path="url(#${clipId(p)})" stroke="#8a8f88" stroke-width="0.3">${Array.from({ length: Math.ceil((p.width + p.height) / 2.5) }, (_, i) => `<line x1="${n(p.x + i * 2.5)}" y1="${n(p.y)}" x2="${n(p.x + i * 2.5 - p.height)}" y2="${n(p.y + p.height)}"/>`).join('')}</g>`).join(''))
  if (showGuides) layer('Safe', `Safe zone ${PRINT_SPEC.safe} mm (non-printing)`, panels.filter(p => p.artwork && p.id !== 'window-hole').map(p => { const s = safeOutline(p); return !s ? '' : Array.isArray(s) ? `<polygon points="${pts(s)}"/>` : `<circle cx="${n(s.cx)}" cy="${n(s.cy)}" r="${n(s.r)}"/>` }).join(''), ' fill="none" stroke="#2fa84f" stroke-width="0.18" stroke-dasharray="1 1"')
  const rule = (layerName: 'cut' | 'fold' | 'perf') => layout.rules.filter(r => r.layer === layerName).map(r => r.closed ? `<polygon points="${pts(r.points)}"/>` : `<polyline points="${pts(r.points)}"/>`).join('')
  layer('Cut', 'Cut (die line)', rule('cut') + layout.holes.map(h => `<circle cx="${n(h.x)}" cy="${n(h.y)}" r="${n(h.radius)}"/>`).join(''), ' fill="none" stroke="#ec008c" stroke-width="0.25" data-cmyk="0,100,0,0"')
  layer('Crease', 'Crease / fold', rule('fold'), ' fill="none" stroke="#00aeef" stroke-width="0.25" stroke-dasharray="2 1.3" data-cmyk="100,0,0,0"')
  layer('Perforation', 'Perforation / tear', rule('perf'), ' fill="none" stroke="#f7941d" stroke-width="0.3" stroke-dasharray="0.6 0.9" data-cmyk="0,50,100,0"')
  if (showMarks) {
    const m = sheetMarks(layout)
    layer('Marks', 'Crop & registration marks', m.crop.map(([p, q]) => `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}"/>`).join('')
      + m.registration.map(r => `<g data-name="Registration"><circle cx="${n(r.x)}" cy="${n(r.y)}" r="${n(r.r)}"/><circle cx="${n(r.x)}" cy="${n(r.y)}" r="${n(r.r * .45)}"/><line x1="${n(r.x - r.r * 1.5)}" y1="${n(r.y)}" x2="${n(r.x + r.r * 1.5)}" y2="${n(r.y)}"/><line x1="${n(r.x)}" y1="${n(r.y - r.r * 1.5)}" x2="${n(r.x)}" y2="${n(r.y + r.r * 1.5)}"/></g>`).join('')
      + `<g data-name="Colour bar" stroke="none">${COLOR_BAR.map((c, i) => `<rect x="${n(width - 24 - (COLOR_BAR.length - i) * 9)}" y="${n(footerY - 3)}" width="8" height="6" fill="${c.hex}" data-cmyk="${c.cmyk.join(',')}"/>`).join('')}</g>`, ' fill="none" stroke="#000000" stroke-width="0.15"')
  }
  if (showDimensions) {
    const dims = layout.dimensions.map(d => {
      const vertical = d.x1 === d.x2, x = (d.x1 + d.x2) / 2, y = (d.y1 + d.y2) / 2
      return `<g data-name="Dimension ${esc(d.label)}"><line x1="${n(d.x1)}" y1="${n(d.y1)}" x2="${n(d.x2)}" y2="${n(d.y2)}" stroke="#68776e" stroke-width="0.2"/><text x="${n(x)}" y="${n(y - 2.5)}" text-anchor="middle"${vertical ? ` transform="rotate(-90 ${n(x)} ${n(y)})"` : ''}>${esc(d.label)}</text></g>`
    }).join('')
    const labels = panels.map(p => `<text data-name="Panel label" x="${n(p.x + 3)}" y="${n(p.y + 5.1)}" font-size="${n(Math.max(.5, Math.min(3, (p.width - 6) / Math.max(1, p.name.length * .6))))}">${esc(p.name)}</text>`).join('')
    const perRow = Math.max(1, Math.floor((width - 48) / 40))
    const swatches = [...colors].slice(0, perRow * 2).map((c, i) => { const sx = 24 + (i % perRow) * 40, sy = footerY + 31 + Math.floor(i / perRow) * 6; return `<g data-name="Swatch ${c}"><rect x="${n(sx)}" y="${n(sy)}" width="4" height="4" fill="${c}"${cmyk(c)}/><text x="${n(sx + 5)}" y="${n(sy + 3.2)}" font-size="2.2">${c.toUpperCase()} · CMYK ${hexToCmyk(c).join('/')}</text></g>` }).join('')
    layer('Dimensions', 'Dimensions & notes (non-printing)', `<text x="24" y="17" font-size="6" font-weight="700">${esc(design.name || 'Packaging design')}</text><text x="24" y="27">${esc(layout.title)}</text><text x="24" y="36">L ${design.dimensions.length} × W ${design.dimensions.width} × H ${design.dimensions.height} mm · scale 1:1 · bleed ${PRINT_SPEC.bleed} mm · safe ${PRINT_SPEC.safe} mm</text>${dims}${labels}<text x="24" y="${n(footerY)}">SHEET ${n(width)} × ${n(height)} mm · ${esc(design.material)} · ${esc(design.finish)} · quantity ${design.quantity}</text><text x="24" y="${n(footerY + 8)}">TYPE ${esc(t.fontFamily)} ${t.fontWeight} · SURFACE ${esc(textureName(surface.texture))}${a.enabled ? ` · PRINT ${esc(a.name)} (${a.tileSize} mm repeat)` : ''}</text>${layout.notes.slice(0, 2).map((note, i) => `<text x="24" y="${n(footerY + 17 + i * 7)}" font-size="3">${esc(note)}</text>`).join('')}${swatches}`, ' font-family="Arial, Helvetica, sans-serif" font-size="3.5" fill="#344039"')
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${n(width)}mm" height="${n(height)}mm" viewBox="0 0 ${n(width)} ${n(height)}" version="1.1">
<title>${esc(design.name || 'Packaging design')} · editable flat artwork</title>
<desc>Mina packaging studio · 1 unit = 1 mm · layers: ${layers.map(l => l[1]).join(' | ')} · live text fonts: ${[...fonts].join(', ')} (install them before opening) · CMYK estimates in data-cmyk (C,M,Y,K %).</desc>
<defs>${defs.join('')}</defs>
<rect id="Paper" width="${n(width)}" height="${n(height)}" fill="#ffffff"/>
${layers.map(l => l[2]).join('\n')}
</svg>`
  return { svg, colors: [...colors], fonts: [...fonts], stats: { motifs: motifCount, texts: textCount, layers: layers.map(l => l[0]), patternFallback } }
}

/** CorelDRAW custom palette (XML) of the design's colours with CMYK estimates. */
export function corelPalette(name: string, colors: string[]) {
  const guid = '{' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c, i) => ((i * 7 + name.length * 13) % 16 | (c === 'y' ? 8 : 0)).toString(16)) + '}'
  return `<?xml version="1.0"?>
<palette guid="${guid}" name="${esc(name)}">
<colors><page>
${colors.map(c => { const [cc, m, y, k] = hexToCmyk(c).map(v => (v / 100).toFixed(3)); return `<color cs="CMYK" tints="${cc},${m},${y},${k}" name="${c.toUpperCase()}"/>` }).join('\n')}
</page></colors>
</palette>`
}
