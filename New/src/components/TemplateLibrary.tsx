import { memo, useDeferredValue, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Box, Layers3, Palette, Search, ShoppingBag, X } from 'lucide-react'
import type { Design, Template } from '../lib/types'
import { STYLE_PRESETS, TEMPLATE_SECTORS, stylePatch, templatePatch, templates, type StylePreset } from '../lib/template-library'
import { textureName } from '../lib/textures'
import { shapeInfo, isShapeId } from '../lib/shapes'

type Props = {
  design: Design
  onApply: (patch: Partial<Design>, label: string, template?: Template) => void
  onClose: () => void
}

const TemplateCard = memo(function TemplateCard({ t, onPick }: { t: Template; onPick: (t: Template) => void }) {
  return <button className="template-card" onClick={() => onPick(t)}>
    <div className="template-card-icon" style={{ background: t.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
      {t.icon === 'bag' ? <ShoppingBag size={20} /> : t.icon === 'canister' ? <Layers3 size={20} /> : <Box size={20} />}
    </div>
    <div className="template-card-info">
      <strong>{t.name}</strong>
      <span className="template-card-dims">{t.dimensions.length} × {t.dimensions.width} × {t.dimensions.height} mm</span>
      <p>{t.description}</p>
      <div className="template-card-tags">
        <span className="badge">{t.tag || t.category}</span>
        {t.structure && isShapeId(t.structure) && <span className="badge badge-subtle">{shapeInfo(t.structure).name.split(' (')[0]}</span>}
        {t.surface?.texture && t.surface.texture !== 'none' && <span className="badge badge-subtle">{textureName(t.surface.texture)}</span>}
        {t.openTop && <span className="badge badge-subtle">Open Top</span>}
        {t.hasHandles && <span className="badge badge-subtle">Handles</span>}
      </div>
    </div>
  </button>
})

const StyleCard = memo(function StyleCard({ s, onPick }: { s: StylePreset; onPick: (s: StylePreset) => void }) {
  return <button className="template-card style-card" onClick={() => onPick(s)}>
    <div className="style-swatch" aria-hidden>
      <i style={{ background: s.color }} /><i style={{ background: s.innerColor || s.color }} /><i style={{ background: s.accentColor || s.typography.color || '#333' }} />
    </div>
    <div className="template-card-info">
      <strong style={{ fontFamily: `"${s.typography.fontFamily}", sans-serif` }}>{s.name}</strong>
      <p>{s.description}</p>
      <div className="template-card-tags">
        <span className="badge">{s.typography.fontFamily}</span>
        <span className="badge badge-subtle">{s.finish}</span>
        {s.surface.texture && s.surface.texture !== 'none' && <span className="badge badge-subtle">{textureName(s.surface.texture)}</span>}
      </div>
    </div>
  </button>
})

/** Lazily loaded template + style library (keeps ~70 templates and presets out of the Studio chunk). */
export default function TemplateLibrary({ design, onApply, onClose }: Props) {
  const [tab, setTab] = useState<'templates' | 'styles'>('templates')
  const [sector, setSector] = useState('All')
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim().toLowerCase())
  const visible = useMemo(() => templates.filter(t => (sector === 'All' || (t.tag || 'Boxes') === sector) && (!deferred || `${t.name} ${t.description} ${t.tag} ${t.structure}`.toLowerCase().includes(deferred))), [sector, deferred])
  const styles = useMemo(() => STYLE_PRESETS.filter(s => !deferred || `${s.name} ${s.description}`.toLowerCase().includes(deferred)), [deferred])
  const pickTemplate = (t: Template) => onApply(templatePatch(t, design), `Loaded ${t.name} template`, t)
  const pickStyle = (s: StylePreset) => onApply(stylePatch(s, design), `Applied ${s.name} style`)
  return <div className="modal-backdrop" onClick={onClose}>
    <motion.div className="templates-modal" role="dialog" aria-modal="true" aria-label="Templates and styles" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} onClick={e => e.stopPropagation()}>
      <div className="templates-modal-header">
        <div>
          <span className="eyebrow">PACKAGING TEMPLATES & STYLES</span>
          <h2>{tab === 'templates' ? 'Choose a starting template' : 'Restyle your design'}</h2>
          <p>{tab === 'templates' ? `${templates.length} ready structures across ${TEMPLATE_SECTORS.length} sectors. Your copy and typography are kept.` : `${STYLE_PRESETS.length} style presets change colour, finish, texture and type, and keep your shape, size and copy.`}</p>
        </div>
        <button className="icon-button" aria-label="Close templates" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="templates-filter-bar templates-tabs">
        <button className={`filter-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}><Box size={13} /> Templates</button>
        <button className={`filter-btn ${tab === 'styles' ? 'active' : ''}`} onClick={() => setTab('styles')}><Palette size={13} /> Styles</button>
        <label className="templates-search"><Search size={14} /><input value={query} placeholder="Search…" aria-label="Search templates and styles" onChange={e => setQuery(e.target.value)} /></label>
      </div>
      {tab === 'templates' && <div className="templates-filter-bar templates-sectors">
        {['All', ...TEMPLATE_SECTORS].map(cat => <button key={cat} className={`filter-btn ${sector === cat ? 'active' : ''}`} onClick={() => setSector(cat)}>{cat}</button>)}
      </div>}
      <div className="templates-grid-modal">
        {tab === 'templates' ? visible.map(t => <TemplateCard key={t.id} t={t} onPick={pickTemplate} />) : styles.map(s => <StyleCard key={s.id} s={s} onPick={pickStyle} />)}
        {tab === 'templates' && !visible.length && <p className="panel-description">No templates match.</p>}
      </div>
    </motion.div>
  </div>
}
