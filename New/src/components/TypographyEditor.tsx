import { useEffect, useState } from 'react'
import { FONTS, FONT_GROUPS, loadFont } from '../lib/fonts'
import { getTypography, printedText, textColor } from '../lib/typography'
import type { Design, Typography } from '../lib/types'

export function TypographyEditor({ design, onChange }: { design: Design; onChange: (patch: Partial<Design>) => void }) {
  const t = getTypography(design)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [limit, setLimit] = useState(12)
  const [fontError, setFontError] = useState('')
  const fonts = FONTS.filter(font => font.family.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || font.category === category))
  const visible = fonts.slice(0, limit)
  const families = visible.map(font => font.family).join('|')
  useEffect(() => {
    let active = true
    Promise.all(families.split('|').filter(Boolean).map(loadFont)).catch(() => { if (active) setFontError('A font could not load. Please refresh the page.') })
    return () => { active = false }
  }, [families])
  const update = (patch: Partial<Typography>) => onChange({ typography: { ...t, ...patch } })
  return <section className="typography-editor">
    <div className="typography-heading"><strong>Printed text</strong><span>72 installed fonts</span></div>
    <label className="field">Main copy<textarea rows={3} maxLength={240} value={t.text} placeholder={design.name === 'Untitled idea' ? 'Your brand' : design.name} onChange={e => update({ text: e.target.value })} /><small>Leave empty to use the product name. Line breaks are preserved.</small></label>
    <label className="field">Subtitle<input value={t.subtitle} maxLength={160} placeholder="Optional supporting text" onChange={e => update({ subtitle: e.target.value })} /></label>
    <div className="type-preview" style={{ background: design.color, color: textColor(design), fontFamily: t.fontFamily, fontWeight: t.fontWeight, textAlign: t.align, letterSpacing: `${t.letterSpacing}em`, lineHeight: t.lineHeight }}><div>{printedText(design)}</div>{t.subtitle && <small>{t.subtitle}</small>}</div>
    <div className="font-search"><input aria-label="Search fonts" placeholder="Search 72 fonts…" value={query} onChange={e => { setQuery(e.target.value); setLimit(12) }} /><select aria-label="Font category" value={category} onChange={e => { setCategory(e.target.value); setLimit(12) }}><option>All</option>{FONT_GROUPS.map(group => <option key={group}>{group}</option>)}</select></div>
    <div className="font-grid">{visible.map(font => <button type="button" key={font.family} className={font.family === t.fontFamily ? 'selected' : ''} aria-pressed={font.family === t.fontFamily} onClick={() => { update({ fontFamily: font.family }); loadFont(font.family).catch(() => setFontError('This font could not load.')) }}><span style={{ fontFamily: font.family }}>{font.category === 'Arabic & Urdu' ? 'خوبصورت' : 'Aa — Good things'}</span><small>{font.family}</small></button>)}</div>
    {!fonts.length && <p>No fonts match your search.</p>}{fonts.length > limit && <button type="button" className="button button-outline button-sm" onClick={() => setLimit(limit + 12)}>Show more fonts ({fonts.length - limit})</button>}
    {fontError && <p role="alert">{fontError}</p>}
    <p className="selected-font">Selected: {t.fontFamily} · Fonts are bundled with the app.</p>
    <div className="field-row"><label className="field">Weight<select value={t.fontWeight} onChange={e => update({ fontWeight: Number(e.target.value) as 400 | 700 })}><option value={400}>Regular</option><option value={700}>Bold</option></select></label><label className="field">Alignment<select value={t.align} onChange={e => update({ align: e.target.value as Typography['align'] })}>{['left', 'center', 'right'].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="field-row"><label className="field">Print on<select value={t.placement} onChange={e => update({ placement: e.target.value as Typography['placement'] })}>{['both', 'front', 'lid'].map(value => <option key={value}>{value}</option>)}</select></label><label className="field">Letter case<select value={t.transform} onChange={e => update({ transform: e.target.value as Typography['transform'] })}>{['original', 'uppercase', 'lowercase'].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <label className="field">Type size · {t.size}%<input type="range" min={5} max={60} value={t.size} onChange={e => update({ size: Number(e.target.value) })} /><small>Automatically fits each printed face without stretching.</small></label>
    <div className="field-row"><label className="field">Line height<input type="number" min={1} max={2} step={.05} value={t.lineHeight} onChange={e => { const value = Number(e.target.value); if (value >= 1 && value <= 2) update({ lineHeight: value }) }} /></label><label className="field">Letter spacing<input type="number" min={-.02} max={.2} step={.01} value={t.letterSpacing} onChange={e => { const value = Number(e.target.value); if (value >= -.02 && value <= .2) update({ letterSpacing: value }) }} /></label></div>
    <label className="type-check"><input type="checkbox" checked={t.color === 'auto'} onChange={e => update({ color: e.target.checked ? 'auto' : textColor(design) })} /> Automatic contrasting text color</label>
    {t.color !== 'auto' && <label className="field">Text color<input type="color" value={t.color} onChange={e => update({ color: e.target.value })} /></label>}
    <label className="type-check"><input type="checkbox" checked={t.visible} onChange={e => update({ visible: e.target.checked })} /> Show printed text and logo</label>
    <label className="type-check"><input type="checkbox" checked={t.background !== 'none'} onChange={e => update({ background: e.target.checked ? '#f7f1e5' : 'none' })} /> Solid brand plaque over artwork</label>
    {t.background !== 'none' && <label className="field">Plaque color<input type="color" value={t.background} onChange={e => update({ background: e.target.value })} /></label>}
    <label className="field">Brand block size · {Math.round(t.blockScale * 100)}%<input type="range" min={.25} max={1} step={.05} value={t.blockScale} onChange={e => update({ blockScale: Number(e.target.value) })} /></label>
  </section>
}
