import { lazy, Suspense, useRef, useState } from 'react'
import { resolveShape, shapeInfo, shapePatch, SHAPES, type ShapeId } from '../lib/shapes'
import { ArrowRight, Download, Upload, X, Check, FileText, Leaf } from 'lucide-react'
import type { Design } from '../lib/types'
import { downloadFile, readImage, safeName } from '../lib/utils'
import { TypographyEditor } from './TypographyEditor'
import { useStore } from '../lib/store'
import { NumberField } from './NumberField'
import { getTypography, printedText } from '../lib/typography'
import { getSurface, TEXTURES } from '../lib/textures'
import { getProductInfo, infoCopy } from '../lib/product-info'

const SurfaceEditor = lazy(() => import('./SurfaceEditor').then(m => ({ default: m.SurfaceEditor })))
const ProductInfoEditor = lazy(() => import('./SurfaceEditor').then(m => ({ default: m.ProductInfoEditor })))
const ArtworkEditor = lazy(() => import('./ArtworkEditor').then(m => ({ default: m.ArtworkEditor })))
const colors = ['#b8c9ac', '#c9bade', '#e2a18b', '#a9c3df', '#edda91', '#e6ddc5', '#393b36']
// This helper is also used by the studio export menu.
// eslint-disable-next-line react-refresh/only-export-components
export function downloadPlan(design: Design) {
  const text = `MINAL.AI — PRODUCT PLAN\n\n${design.name}\n${'─'.repeat(45)}\n\nTHE IDEA\n${design.brief}\n\nSTRUCTURE\n${design.category}\n\nDIMENSIONS\n${design.dimensions.length} × ${design.dimensions.width} × ${design.dimensions.height} mm\n\nMATERIAL & FINISH\n${design.material} · ${design.finish}\n\nCOLOR\n${design.color}\n\nQUANTITY\n${design.quantity} units\n\nDESIGN NOTES\n${design.notes}\n\nBRANDING\n${design.logo ? 'User-supplied logo included in the design.' : 'No logo supplied. Keep the design logo-free.'}\n\nThis is a concept plan. Dimensions, structural tolerances, materials, and print colors need manufacturer approval before production.\n\nCreated with minal.ai`
  const type = getTypography(design), surface = getSurface(design)
  const details = `\n\nPRINTED COPY\n${printedText(design)}\n${type.subtitle}\nFont: ${type.fontFamily} ${type.fontWeight}\nPlacement: ${type.placement}\n\nSURFACE\n${TEXTURES.find(texture => texture.id === surface.texture)?.name || 'Smooth'}; scale ${surface.scale}; strength ${surface.strength}; rotation ${surface.rotation}\n\nASSEMBLY\n${design.structure || 'standard'}; ${design.openTop ? 'open top' : 'with lid'}; ${design.hasHandles ? 'rope handles' : 'no handles'}\nBoard thickness: ${design.wallThickness ?? 2} mm\n\nPRINTED INFORMATION (${getProductInfo(design).placement})\n${getProductInfo(design).visible ? infoCopy(design) : 'Hidden'}\n\nACCESSORIES\n${design.modelParts?.map(part => `${part.name}: ${part.size.x} x ${part.size.y} x ${part.size.z} mm; ${part.color}`).join('\n') || 'None'}`
  const artwork = design.artwork?.enabled ? `\n\nPRINT ARTWORK\n${design.artwork.name || 'Custom print'}; repeat ${design.artwork.tileSize || 80} mm; rotation ${design.artwork.rotation || 0} degrees\n${design.artwork.layers?.length || 0} editable motifs; ${design.artwork.image ? 'Image artwork included' : 'Vector motif composition'}\n${design.artwork.prompt || ''}` : ''
  downloadFile(text + details + artwork, `${safeName(design.name)}-product-plan.txt`)
}
export function PlanEditor({ design, onChange, onGenerate }: { design: Design; onChange: (patch: Partial<Design>) => void; onGenerate: () => void }) {
  const file = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { notify } = useStore()
  return <div className="plan-editor"><div className="panel-heading"><div className="panel-icon"><FileText size={19} /></div><div><span className="eyebrow">THE LITTLE MASTER PLAN</span><h2>Good things start here.</h2></div><button className="icon-button" aria-label="Download product plan" title="Download product plan" onClick={() => { downloadPlan(design); notify('Your product plan is downloaded.') }}><Download size={18} /></button></div><p className="panel-description">A starting point, not a set of rules. Make every detail yours.</p>
    <form onSubmit={e => { e.preventDefault(); onGenerate() }}>
      <label className="field">Product name<input value={design.name} onChange={e => onChange({ name: e.target.value })} required maxLength={80} placeholder="Give your idea a name" /></label>
      <label className="field">The idea<textarea value={design.brief} onChange={e => onChange({ brief: e.target.value })} required rows={3} placeholder="What are we making, and who is it for?" /></label>
      <div className="field-row"><label className="field">Packaging structure<select value={design.category} onChange={e => onChange({ category: e.target.value as Design['category'], structure: 'standard' })}><option value="Box">Rigid presentation box</option><option value="Canister">Cylindrical canister</option><option value="Carton">Folding carton</option><option value="Bag">Shopping bag</option></select></label><label className="field">Finish<select value={design.finish} onChange={e => onChange({ finish: e.target.value })}><option>Matte</option><option>Soft-touch</option><option>Gloss</option></select></label></div>
      <label className="field">Shape<select value={resolveShape(design)} onChange={e => { const id = e.target.value as ShapeId; onChange({ ...shapePatch(id), shapeParams: {}, dimensions: { ...shapeInfo(id).dimensions } }) }}>{SHAPES.map(shape => <option key={shape.id} value={shape.id}>{shape.name}</option>)}</select></label>
      <label className="field">Material<select value={design.material} onChange={e => onChange({ material: e.target.value })}><option>Recycled rigid board</option><option>FSC paperboard</option><option>Kraft paperboard</option><option>Paperboard with food-safe lining</option></select></label>
      <div className="field"><span>Color story <small>Just the right shade of you.</small></span><div className="color-picker-row">{[...new Set([...(design.palette || []), ...colors])].slice(0, 10).map(color => <button type="button" key={color} aria-label={`Use color ${color}`} aria-pressed={design.color.toLowerCase() === color.toLowerCase()} className={`color-swatch ${design.color === color ? 'active' : ''}`} style={{ background: color }} onClick={() => onChange({ color })}>{design.color === color && <Check size={15} />}</button>)}<label className="custom-color" title="Choose a custom color"><input type="color" value={design.color} onChange={e => onChange({ color: e.target.value })} aria-label="Custom product color" /><span>+</span></label><code>{design.color.toUpperCase()}</code></div></div>
      <fieldset className="dimension-field"><legend>Dimensions <span>Millimeters</span></legend><div className="field-row dimension-inputs">{(['length', 'width', 'height'] as const).map(dimension => <label className="field" key={dimension}><span>{dimension}</span><div className="unit-input"><NumberField min={20} max={600} value={design.dimensions[dimension]} onChange={value => onChange({ dimensions: { ...design.dimensions, [dimension]: value } })} /><span>mm</span></div></label>)}</div></fieldset>
      <div className="field-row"><label className="field">Quantity<div className="unit-input"><NumberField min={1} max={100000} value={design.quantity} onChange={value => onChange({ quantity: value })} /><span>units</span></div></label><div className="field"><span>Your logo <small>Completely optional</small></span><div className="logo-upload-row">{design.logo ? <><img src={design.logo} alt="Your supplied logo" /><button type="button" className="icon-button" aria-label="Remove logo" onClick={() => onChange({ logo: undefined })}><X size={16} /></button></> : <button type="button" className="upload-logo" onClick={() => file.current?.click()} disabled={uploading}><Upload size={15} />{uploading ? 'Uploading…' : 'Upload logo'}</button>}</div><input className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" ref={file} onChange={async e => { const imageFile = e.target.files?.[0]; if (!imageFile) return; setUploading(true); try { const result = await readImage(imageFile); onChange({ logo: result.image }); notify('Your logo is added to the design.') } catch (error) { notify(error instanceof Error ? error.message : 'Couldn’t read that image.', 'info') } finally { setUploading(false); e.target.value = '' } }} /></div></div>
      <div className="field-row"><label className="field">Inside color<input type="color" value={design.innerColor || design.color} onChange={e => onChange({ innerColor: e.target.value })} /></label><label className="field">Accent color<input type="color" value={design.accentColor || design.color} onChange={e => onChange({ accentColor: e.target.value })} /></label></div>
      <div className="field-row"><label className="field">Wall thickness (mm)<NumberField min={.5} max={6} step={.5} value={design.wallThickness ?? 2} onChange={value => onChange({ wallThickness: value })} /></label><label className="field">Corner radius (mm)<NumberField min={0} max={20} value={design.cornerRadius ?? 2} onChange={value => onChange({ cornerRadius: value })} /></label></div>
      <TypographyEditor design={design} onChange={onChange} />
      <Suspense fallback={<p className="panel-description">Loading editors…</p>}>
        <ArtworkEditor design={design} onChange={onChange} />
        <SurfaceEditor design={design} onChange={onChange} />
        <ProductInfoEditor design={design} onChange={onChange} />
      </Suspense>
      <label className="field">The little details<textarea value={design.notes} onChange={e => onChange({ notes: e.target.value })} rows={3} placeholder="What should make this feel special?" /></label>
      <div className="plan-note"><Leaf size={16} /><span>A thoughtful concept, ready to explore. Final material and structural details need a manufacturer's approval.</span></div>
      <div className="plan-footer"><span><Check size={13} /> Changes saved as you go</span><button type="submit" className="button button-dark">Bring it into 3D <ArrowRight size={17} /></button></div>
    </form>
  </div>
}
