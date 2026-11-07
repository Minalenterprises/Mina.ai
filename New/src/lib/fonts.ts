import catalog from './font-catalog.json'

export const FONT_GROUPS = Object.keys(catalog)
export const FONTS = Object.entries(catalog).flatMap(([category, families]) => families.map(family => ({ family, category })))
export const fontExists = (family: string) => FONTS.some(font => font.family === family)
const loaded = new Map<string, Promise<void>>()

/** Real font files are local; only the selected family is loaded into the browser. */
export function loadFont(family: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  const existing = loaded.get(family)
  if (existing) return existing
  // The 74 kB file manifest is fetched only when the first font is actually loaded.
  const task = import('./font-manifest.json').then(module => {
    const sources = (module.default as Record<string, { file: string; weight: string; unicodeRange?: string }[]>)[family]
    if (!sources) throw new Error(`Unknown font: ${family}`)
    return sources
  }).then(sources => Promise.all(sources.map(async source => {
    const face = new FontFace(family, `url("${source.file}")`, { weight: source.weight, style: 'normal', ...(source.unicodeRange ? { unicodeRange: source.unicodeRange } : {}) })
    await face.load()
    document.fonts.add(face)
  }))).then(() => undefined).catch(error => { loaded.delete(family); throw error })
  loaded.set(family, task)
  return task
}
