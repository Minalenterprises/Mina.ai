import type { Design, MaterialPreset } from './types'

export const MATERIAL_PRESETS: { id: Exclude<MaterialPreset, 'auto'>; name: string; description: string }[] = [
  { id: 'paper', name: 'Coated paper', description: 'Smooth printed paperboard with a soft sheen.' },
  { id: 'kraft', name: 'Kraft', description: 'Unbleached fibrous kraft, very matte.' },
  { id: 'matte', name: 'Matte laminate', description: 'Flat, even matte lamination.' },
  { id: 'soft-touch', name: 'Soft-touch', description: 'Velvety, ultra-matte with a faint sheen.' },
  { id: 'gloss', name: 'Gloss / UV', description: 'High-gloss clear-coated print.' },
  { id: 'foil', name: 'Metallic foil', description: 'Mirror-like metallised foil in the package colour.' },
  { id: 'metal', name: 'Brushed metal / tin', description: 'Satin metal, e.g. tin or aluminium.' },
  { id: 'clear', name: 'Clear film / PET', description: 'Transparent plastic or acetate.' },
  { id: 'glass', name: 'Glass', description: 'Transmissive glass tinted by the package colour.' },
  { id: 'plastic', name: 'Plastic', description: 'Opaque moulded plastic with satin sheen.' },
]

/** Infers a physical preset from free-text material and finish when the design does not pick one. */
export function resolveMaterialPreset(design: Pick<Design, 'materialPreset' | 'material' | 'finish'>): Exclude<MaterialPreset, 'auto'> {
  if (design.materialPreset && design.materialPreset !== 'auto') return design.materialPreset
  const m = `${design.material || ''}`.toLowerCase()
  if (/glass/.test(m)) return 'glass'
  if (/clear|acetate|\bpet\b|transparent|pvc/.test(m)) return 'clear'
  if (/foil|metalli[sz]ed|holograph/.test(m)) return 'foil'
  if (/\btin\b|alumin|steel|metal/.test(m)) return 'metal'
  if (/plastic|\bpp\b|\bhdpe\b|acrylic/.test(m)) return 'plastic'
  if (/kraft|pulp|recycled paper/.test(m)) return 'kraft'
  if (design.finish === 'Gloss') return 'gloss'
  if (design.finish === 'Soft-touch') return 'soft-touch'
  if (/film|laminat/.test(m)) return 'matte'
  return 'paper'
}

