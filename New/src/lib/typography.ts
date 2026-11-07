import type { Design, Typography } from './types'

export const DEFAULT_TYPOGRAPHY: Typography = {
  text: '', subtitle: '', fontFamily: 'Inter', fontWeight: 700, size: 17,
  lineHeight: 1.18, letterSpacing: 0, align: 'center', color: 'auto', placement: 'both', transform: 'original', visible: true, background: 'none', blockScale: 1
}
export const getTypography = (design: Design): Typography => ({ ...DEFAULT_TYPOGRAPHY, ...design.typography })
export function printedText(design: Design): string {
  const typography = getTypography(design)
  const text = typography.text || (design.name === 'Untitled idea' ? 'Your brand' : design.name)
  return typography.transform === 'uppercase' ? text.toUpperCase() : typography.transform === 'lowercase' ? text.toLowerCase() : text
}
function luminance(hex: string) {
  const normalized = hex.length === 4 ? `#${hex.slice(1).split('').map(c => c + c).join('')}` : hex
  const values = [1, 3, 5].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722
}
export const contrastRatio = (a: string, b: string) => {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05)
}
export function textColor(design: Design) {
  const custom = getTypography(design).color
  if (custom !== 'auto') return custom
  const t = getTypography(design), bg = t.background !== 'none' ? t.background : design.artwork?.enabled && design.artwork.background && design.artwork.background !== 'auto' ? design.artwork.background : design.color
  return contrastRatio(bg, '#17231b') >= contrastRatio(bg, '#ffffff') ? '#17231b' : '#ffffff'
}

/** Wrap without dropping copy or using fillText's horizontal compression. */
export function fitText(text: string, width: number, height: number, startSize: number, lineHeight: number, measure: (text: string, size: number) => number) {
  let size = Math.max(1, startSize)
  // Fit the longest whole word first. A brand name should never lose its last
  // letter to another line merely because character wrapping fits vertically.
  const widestWord = Math.max(1, ...text.split(/\s+/).filter(Boolean).map(word => measure(word, size)))
  if (widestWord > width) size = Math.max(1, size * width * .99 / widestWord)
  let lines: string[] = []
  for (let attempt = 0; attempt < 80; attempt++) {
    lines = []
    for (const paragraph of text.split('\n')) {
      if (!paragraph.trim()) { lines.push(''); continue }
      let line = ''
      for (const word of paragraph.trim().split(/\s+/)) {
        if (measure(word, size) > width) {
          if (line) { lines.push(line); line = '' }
          for (const character of Array.from(word)) {
            if (line && measure(line + character, size) > width) { lines.push(line); line = '' }
            line += character
          }
        } else if (line && measure(`${line} ${word}`, size) > width) { lines.push(line); line = word }
        else line = line ? `${line} ${word}` : word
      }
      if (line) lines.push(line)
    }
    if (lines.length * size * lineHeight <= height && lines.every(line => measure(line, size) <= width + 1)) break
    size *= .93
  }
  return { lines, size, height: lines.length * size * lineHeight }
}
