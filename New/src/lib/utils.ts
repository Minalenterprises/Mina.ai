export function downloadFile(content: string | Blob, filename: string, type = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function safeName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'minal-design' }
export async function readImage(file: File): Promise<{ image: string; palette: string[] }> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Please choose a PNG, JPEG, or WebP image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image under 10 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image(); image.src = url; await image.decode()
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 600 / Math.max(image.width, image.height)); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const resized = canvas.toDataURL('image/png')
    const sample = document.createElement('canvas'); sample.width = 64; sample.height = 64
    const sc = sample.getContext('2d')!; sc.drawImage(image, 0, 0, 64, 64)
    const data = sc.getImageData(0, 0, 64, 64).data
    const buckets = new Map<string, number>()
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const r = Math.min(240, Math.round(data[i] / 24) * 24), g = Math.min(240, Math.round(data[i + 1] / 24) * 24), b = Math.min(240, Math.round(data[i + 2] / 24) * 24)
      const key = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }
    const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]); const palette: string[] = []
    const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
    for (const [color] of sorted) { if (palette.every(existing => rgb(existing).reduce((sum, v, i) => sum + Math.abs(v - rgb(color)[i]), 0) > 90)) palette.push(color); if (palette.length === 5) break }
    return { image: resized, palette: palette.length ? palette : ['#b8c9ac'] }
  } finally { URL.revokeObjectURL(url) }
}
