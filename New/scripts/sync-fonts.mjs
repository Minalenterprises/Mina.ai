import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const groups = JSON.parse(await readFile('src/lib/font-catalog.json', 'utf8'))
const families = Object.values(groups).flat()
const singleWeight = new Set(['Anton', 'Bebas Neue', 'Abril Fatface', 'Righteous', 'Pacifico', 'Lobster'])
const destination = 'public/fonts'
await mkdir(`${destination}/licenses`, { recursive: true })
const manifest = {}
const headers = { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
const get = async (url) => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`${response.status}: ${url}`)
  return response
}
let next = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < families.length) {
    const family = families[next++]
    const slug = family.toLowerCase().replace(/[^a-z0-9]/g, '')
    const weights = singleWeight.has(family) ? [400] : [400, 700]
    const css = await (await get(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`)).text()
    const blocks = [...css.matchAll(/\/\* ([^*]+) \*\/\s*@font-face\s*\{([^}]+)\}/g)]
      .filter(match => ['latin', 'latin-ext', ...(family.startsWith('Noto ') ? ['arabic'] : [])].includes(match[1].trim()))
    if (!blocks.length) throw new Error(`No font data for ${family}`)
    const files = new Map()
    manifest[family] = []
    for (const block of blocks) {
      const url = block[2].match(/url\(([^)]+)\)/)?.[1]
      const weight = block[2].match(/font-weight:\s*([^;]+)/)?.[1]?.trim()
      const unicodeRange = block[2].match(/unicode-range:\s*([^;]+)/)?.[1]?.trim()
      if (!url || !weight) throw new Error(`Missing source for ${family}`)
      const filename = `${slug}-${createHash('sha256').update(url).digest('hex').slice(0, 12)}.woff2`
      if (!files.has(url)) {
        await writeFile(`${destination}/${filename}`, Buffer.from(await (await get(url)).arrayBuffer()))
        files.set(url, filename)
      }
      manifest[family].push({ file: `/fonts/${filename}`, weight, unicodeRange })
    }
    let licenseText = ''
    for (const path of [`ofl/${slug}/OFL.txt`, `apache/${slug}/LICENSE.txt`, `ufl/${slug}/UFL.txt`]) {
      const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/${path}`, { headers, signal: AbortSignal.timeout(30000) })
      if (license.ok) { licenseText = await license.text(); break }
    }
    if (!licenseText) throw new Error(`No distribution license found for ${family}`)
    await writeFile(`${destination}/licenses/${slug}.txt`, licenseText)
    console.log(`Bundled ${family}`)
  }
}))
await writeFile('src/lib/font-manifest.json', JSON.stringify(manifest, null, 2))
await writeFile(`${destination}/README.txt`, 'Fonts distributed under their individually bundled licenses (SIL OFL, Apache, or Ubuntu Font License). Sources: Google Fonts CSS API and github.com/google/fonts. Font data is served locally and loaded on demand.\n')
console.log(`Bundled ${families.length} font families with licenses.`)
