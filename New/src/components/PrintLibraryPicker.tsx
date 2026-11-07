import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Design, PrintArtwork } from '../lib/types'
import { printTile } from '../lib/print-artwork'
import { clonePrint, PRINT_CATEGORIES, PRINT_LIBRARY, searchPrints, type PrintDesign } from '../lib/print-library'

const thumbs = new Map<string, Promise<string>>()
/** One cached PNG per (design, background, texture): scrolling the library never re-renders tiles. */
function thumbnail(print: PrintDesign, design: Design) {
  const key = `${print.id}|${print.artwork.background === 'auto' ? design.color : ''}|${design.surface?.texture || ''}|${design.logo ? design.logo.length : 0}`
  let hit = thumbs.get(key)
  if (!hit) {
    if (thumbs.size > 400) thumbs.clear()
    hit = printTile({ ...design, artwork: print.artwork }, 160).then(canvas => canvas.toDataURL('image/png'))
    thumbs.set(key, hit)
  }
  return hit
}

const PrintCard = memo(function PrintCard({ print, design, disabled, onPick }: { print: PrintDesign; design: Design; disabled: boolean; onPick: (print: PrintDesign) => void }) {
  const [src, setSrc] = useState('')
  useEffect(() => { let live = true; thumbnail(print, design).then(url => { if (live) setSrc(url) }).catch(() => {}); return () => { live = false } }, [print, design])
  return <button type="button" className="print-starter" disabled={disabled} onClick={() => onPick(print)} title={`${print.name} · ${print.artwork.layers.length} editable motifs · ${print.artwork.tileSize} mm repeat`}>
    {src ? <img src={src} alt="" /> : <span className="print-starter-blank" />}<span>{print.name}</span>
  </button>
})

/** Searchable, categorised library of editable vector print designs. */
export default function PrintLibraryPicker({ design, disabled, onApply }: { design: Design; disabled: boolean; onApply: (artwork: PrintArtwork) => void }) {
  const [category, setCategory] = useState('All'), [query, setQuery] = useState(''), [limit, setLimit] = useState(12)
  const deferred = useDeferredValue(query)
  const prints = useMemo(() => searchPrints(deferred, category), [deferred, category])
  // Thumbnails only depend on what changes their pixels, so editing copy or dimensions does not repaint the grid.
  const thumbDesign = useMemo(() => ({ color: design.color, surface: design.surface, logo: design.logo, dimensions: design.dimensions } as Design), [design.color, design.surface, design.logo, design.dimensions])
  const pick = (print: PrintDesign) => onApply(clonePrint(print))
  return <div className="print-library">
    <div className="print-library-filters">
      <select aria-label="Print category" value={category} onChange={e => { setCategory(e.target.value); setLimit(12) }}><option value="All">All prints ({PRINT_LIBRARY.length})</option>{PRINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label className="print-library-search"><Search size={13} /><input value={query} placeholder="Search prints…" aria-label="Search print designs" onChange={e => { setQuery(e.target.value); setLimit(12) }} /></label>
    </div>
    <div className="print-starters">{prints.slice(0, limit).map(p => <PrintCard key={p.id} print={p} design={thumbDesign} disabled={disabled || (p.artwork.layers.some(l => l.shape === 'logo') && !design.logo)} onPick={pick} />)}</div>
    {!prints.length && <p className="panel-description">No prints match “{query}”.</p>}
    {prints.length > limit && <button type="button" className="button button-outline button-sm" onClick={() => setLimit(limit + 12)}>More prints ({prints.length - limit})</button>}
  </div>
}
