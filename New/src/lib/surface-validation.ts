import type { Surface, ProductInfo } from './types'
import { TEXTURES } from './textures'
import { validBarcode } from './product-info'
const record = (value: unknown) => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Supply an object.'); return value as Record<string, unknown> }
export function validateSurface(value: unknown): Partial<Surface> {
  const input = record(value), output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (key === 'texture') { if (!TEXTURES.some(texture => texture.id === value)) throw new Error('Choose an installed texture using list_textures.'); output[key] = value }
    else if (['scale', 'strength', 'rotation'].includes(key)) {
      const [min, max] = key === 'scale' ? [.25, 4] : key === 'strength' ? [0, 1] : [-180, 180]
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be ${min}–${max}.`)
      output[key] = value
    } else throw new Error(`Unknown surface field: ${key}`)
  }
  if (!Object.keys(output).length) throw new Error('Supply a surface change.')
  return output as Partial<Surface>
}
export function validateProductInfo(value: unknown): Partial<ProductInfo> {
  const input = record(value), output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (key === 'visible' || key === 'showSpecs') { if (typeof value !== 'boolean') throw new Error(`${key} must be boolean.`); output[key] = value }
    else if (key === 'placement') { if (value !== 'bottom' && value !== 'back') throw new Error('Placement must be bottom or back.'); output[key] = value }
    else if (key === 'barcode') { if (typeof value !== 'string' || (value && !validBarcode(value))) throw new Error('Supply a valid EAN-13 barcode with its correct check digit, or empty to remove.'); output[key] = value }
    else if (['description', 'contents', 'care', 'warnings', 'origin', 'website', 'sku'].includes(key)) {
      const max = ['origin', 'sku'].includes(key) ? 80 : key === 'website' ? 160 : 400
      if (typeof value !== 'string' || value.length > max) throw new Error(`${key} must be text up to ${max} characters.`)
      output[key] = value
    } else throw new Error(`Unknown information field: ${key}`)
  }
  if (!Object.keys(output).length) throw new Error('Supply a product information change.')
  return output as Partial<ProductInfo>
}
