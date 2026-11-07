import { memo, useCallback, useMemo, useState } from 'react'
import { TEXTURES, getSurface } from '../lib/textures'
import { textureCanvas } from '../lib/texture-canvas'
import { getProductInfo, validBarcode } from '../lib/product-info'
import type { Design, ProductInfo, Surface } from '../lib/types'

const thumbs = new Map<string, string>()
const thumbnail = (id: string) => { let url = thumbs.get(id); if (!url) { url = textureCanvas(id, .9, 128).toDataURL(); thumbs.set(id, url) } return url }
const TextureCard = memo(function TextureCard({ id, name, selected, onSelect }: { id: string; name: string; selected: boolean; onSelect: (id: string) => void }) {
  const preview = useMemo(() => thumbnail(id), [id])
  return <button type="button" className={`texture-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(id)}><img src={preview} alt="" loading="lazy" /><span>{name}</span></button>
})
export function SurfaceEditor({ design, onChange }: { design: Design; onChange: (patch: Partial<Design>) => void }) {
  const surface = getSurface(design)
  const [category, setCategory] = useState('All')
  const [limit, setLimit] = useState(12)
  const update = (patch: Partial<Surface>) => onChange({ surface: { ...surface, ...patch } })
  const selectTexture = useCallback((texture: string) => onChange({ surface: { ...surface, texture } }), [onChange, surface])
  const textures = TEXTURES.filter(texture => category === 'All' || texture.category === category)
  return <section className="surface-editor"><div className="typography-heading"><strong>Surface & texture</strong><span>{TEXTURES.length} finishes</span></div><p>Paper grains, washi and handmade stocks, woven fabrics and velvet, wood, marble and leather, metallic, holographic and pearlescent foils, and embossed patterns. The AI can apply these same textures.</p>
    <select aria-label="Texture category" value={category} onChange={e => { setCategory(e.target.value); setLimit(12) }}><option>All</option>{[...new Set(TEXTURES.map(texture => texture.category))].map(group => <option key={group}>{group}</option>)}</select>
    <div className="texture-grid">{textures.slice(0, limit).map(texture => <TextureCard key={texture.id} {...texture} selected={surface.texture === texture.id} onSelect={selectTexture} />)}</div>
    {textures.length > limit && <button type="button" className="button button-outline button-sm" onClick={() => setLimit(limit + 12)}>More textures</button>}
    <p>Selected: <strong>{TEXTURES.find(texture => texture.id === surface.texture)?.name || 'Smooth'}</strong></p>
    <label className="field">Pattern size · {surface.scale}×<input type="range" min={.25} max={4} step={.25} value={surface.scale} onChange={e => update({ scale: Number(e.target.value) })} /></label>
    <label className="field">Texture strength · {Math.round(surface.strength * 100)}%<input type="range" min={0} max={1} step={.05} value={surface.strength} onChange={e => update({ strength: Number(e.target.value) })} /></label>
    <label className="field">Pattern angle · {surface.rotation}°<input type="range" min={-180} max={180} step={15} value={surface.rotation} onChange={e => update({ rotation: Number(e.target.value) })} /></label>
    <p className="panel-description">Concept material appearances; choose a real substrate with your manufacturer before printing.</p>
  </section>
}

export function ProductInfoEditor({ design, onChange }: { design: Design; onChange: (patch: Partial<Design>) => void }) {
  const info = getProductInfo(design)
  const update = (patch: Partial<ProductInfo>) => onChange({ productInfo: { ...info, ...patch } })
  return <section className="surface-editor"><div className="typography-heading"><strong>Product information</strong><span>Bottom or back</span></div>
    <label className="type-check"><input type="checkbox" checked={info.visible} onChange={e => update({ visible: e.target.checked })} /> Print a product information panel</label>
    <label className="field">Placement<select value={info.placement} onChange={e => update({ placement: e.target.value as ProductInfo['placement'] })}><option value="bottom">Underside</option><option value="back">Back panel</option></select></label>
    <label className="type-check"><input type="checkbox" checked={info.showSpecs} onChange={e => update({ showSpecs: e.target.checked })} /> Include actual dimensions, material, and finish</label>
    {(['description', 'contents', 'care', 'warnings'] as const).map(field => <label className="field" key={field}>{({ description: 'Product description', contents: 'Contents / ingredients', care: 'Care & use', warnings: 'Warnings' })[field]}<textarea rows={2} maxLength={400} value={info[field]} onChange={e => update({ [field]: e.target.value })} /></label>)}
    {(['origin', 'website', 'sku', 'barcode'] as const).map(field => <label className="field" key={field}>{({ origin: 'Origin / maker', website: 'Contact / website', sku: 'SKU / reference', barcode: 'EAN-13 barcode (optional)' })[field]}<input maxLength={field === 'barcode' ? 13 : field === 'website' ? 160 : 80} value={info[field]} inputMode={field === 'barcode' ? 'numeric' : 'text'} onChange={e => update({ [field]: e.target.value })} />{field === 'barcode' && info.barcode && !validBarcode(info.barcode) && <small className="tool-error">Enter 13 digits including the correct check digit. Invalid codes are not printed.</small>}</label>)}
    <p className="panel-description">Use Bottom or Back view to inspect this panel. Only include accurate product facts and an assigned barcode.</p>
  </section>
}
