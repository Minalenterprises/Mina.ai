import { useEffect, useId, useMemo, useState } from 'react'
import type { Design } from '../lib/types'
import { buildDieline, mm } from '../lib/dieline-layout'
import { paintLabel, paintProductInfo, prepareLabel } from '../lib/label-renderer'
import { getSurface, TEXTURES } from '../lib/textures'
import { getArtwork, printTile } from '../lib/print-artwork'
import { getTypography } from '../lib/typography'
import { artworkFrame } from '../lib/artwork-frame'

export function Dieline({ design, showArtwork = true, showDimensions = true }: { design: Design; showArtwork?: boolean; showDimensions?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const layout = useMemo(() => buildDieline(design), [design])
  const key = JSON.stringify({ ...design, messages: undefined, updatedAt: undefined })
  const [assets, setAssets] = useState<{ key: string; images: Record<string, string>; texture: string }>({ key: '', images: {}, texture: '' })
  useEffect(() => {
    let cancelled = false
    Promise.all([prepareLabel(design), printTile(design)]).then(([logo, tile]) => {
      const images: Record<string, string> = {}
      for (const p of layout.panels) {
        if (!p.artwork) continue
        const canvas = document.createElement('canvas')
        const { width: w, height: h } = artworkFrame(design, p)
        const scale = Math.min(8, 2400 / Math.max(w, h))
        canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale))
        if (p.artwork === 'info') paintProductInfo(canvas, design)
        else paintLabel(canvas, design, p.artwork, logo)
        images[p.id] = canvas.toDataURL('image/png')
      }
      if (!cancelled) setAssets({ key, images, texture: tile.toDataURL('image/png') })
    }).catch(() => { if (!cancelled) setAssets({ key: '', images: {}, texture: '' }) })
    return () => { cancelled = true }
  }, [design, layout, key])
  const surface = getSurface(design), a = getArtwork(design), t = getTypography(design), tileSize = a.enabled ? a.tileSize : 64 * surface.scale
  const { width, height, footerY } = layout
  const active = assets.key === key
  return <svg className="dieline" width={`${width}mm`} height={`${height}mm`} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" role="img" aria-label={`Full unfolded packaging design: ${design.name}. ${design.dimensions.length} × ${design.dimensions.width} × ${design.dimensions.height} millimeters.`} data-ready={active} data-design-key={key}>
    <title>{design.name} · dimensioned flat artwork</title>
    <desc>Millimeter layout with separate Artwork, DieCut, Crease, and Dimensions groups. Printed text and material textures are embedded images; structural rules are editable vectors.</desc>
    <defs>
      {layout.panels.map(p => <pattern key={p.id} id={`surface-${uid}-${p.id}`} x={p.x + p.width / 2} y={p.y + p.height / 2} width={tileSize} height={tileSize} viewBox="0 0 512 512" patternUnits="userSpaceOnUse" patternTransform={`rotate(${a.enabled ? a.rotation : surface.rotation} ${p.x + p.width / 2} ${p.y + p.height / 2})`}>
        {active && <image xlinkHref={assets.texture} width="512" height="512" />}
      </pattern>)}
      {layout.panels.filter(p => p.circle || p.polygon).map(p => <clipPath key={p.id} id={`clip-${uid}-${p.id}`}>
        {p.circle ? <circle cx={p.x + p.width / 2} cy={p.y + p.height / 2} r={p.width / 2} /> : <polygon points={p.polygon!.map(v => v.join(',')).join(' ')} />}
      </clipPath>)}
    </defs>
    <g id="Paper"><rect width={width} height={height} fill="white" /></g>
    <g id="Artwork">
      {layout.panels.map(p => <g key={p.id} clipPath={p.circle || p.polygon ? `url(#clip-${uid}-${p.id})` : undefined}>
        <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={p.id === 'window-hole' ? '#ffffff' : showArtwork ? design.color : '#f3f4f0'} />
        {p.id !== 'window-hole' && showArtwork && (a.enabled || surface.texture !== 'none') && active && <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={`url(#surface-${uid}-${p.id})`} />}
        {showArtwork && active && p.artwork && assets.images[p.id] && <image xlinkHref={assets.images[p.id]} preserveAspectRatio="xMidYMid meet" {...(p.id === 'sleeve-0' ? { ...artworkFrame(design, p), transform: `rotate(90 ${p.x + p.width / 2} ${p.y + p.height / 2})` } : artworkFrame(design, p))} />}
      </g>)}
    </g>
    <g id="DieCut" fill="none" stroke="#df2871" strokeWidth="0.25">
      {layout.rules.filter(r => r.layer === 'cut').map((r, i) => r.closed ? <polygon key={i} points={r.points.map(v => v.join(',')).join(' ')} /> : <polyline key={i} points={r.points.map(v => v.join(',')).join(' ')} />)}
      {layout.holes.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.radius} />)}
    </g>
    <g id="Crease" fill="none" stroke="#00a1b7" strokeWidth="0.25" strokeDasharray="2 1.3">
      {layout.rules.filter(r => r.layer === 'fold').map((r, i) => r.closed ? <polygon key={i} points={r.points.map(v => v.join(',')).join(' ')} /> : <polyline key={i} points={r.points.map(v => v.join(',')).join(' ')} />)}
    </g>
    {showDimensions && <g id="Dimensions" fontFamily="Arial, sans-serif" fill="#344039" fontSize="3.5">
      <text x="24" y="17" fontSize="6" fontWeight="700">{design.name || 'Packaging design'}</text>
      <text x="24" y="27">{layout.title}</text>
      <text x="24" y="36">L {design.dimensions.length} × W {design.dimensions.width} × H {design.dimensions.height} mm · actual export scale 1:1</text>
      {layout.dimensions.map((d, i) => {
        const vertical = d.x1 === d.x2, x = (d.x1 + d.x2) / 2, y = (d.y1 + d.y2) / 2
        return <g key={i}>
          <path d={`M${d.x1},${d.y1} L${d.x2},${d.y2}`} stroke="#68776e" strokeWidth=".2" />
          {[0, 1].map(n => { const px = n ? d.x2 : d.x1, py = n ? d.y2 : d.y1; return <line key={n} x1={px - 1.5} y1={py - 1.5} x2={px + 1.5} y2={py + 1.5} stroke="#68776e" strokeWidth=".3" /> })}
          <text x={x} y={y - 2.5} textAnchor="middle" transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}>{d.label}</text>
        </g>
      })}
      {layout.panels.map(p => <g key={p.id}>
        <rect x={p.x + 1.5} y={p.y + 1.5} width={Math.max(1, Math.min(p.width - 3, p.name.length * 1.65 + 4))} height="5" fill="white" opacity=".9" />
        <text x={p.x + 3} y={p.y + 5.1} fontSize={Math.max(.5, Math.min(3, (p.width - 6) / Math.max(1, p.name.length * .6)))}>{p.name}</text>
      </g>)}
      <line x1="24" y1={footerY - 6} x2={width - 24} y2={footerY - 6} stroke="#dce2dc" strokeWidth=".3" />
      <text x="24" y={footerY}>SHEET {mm(width)} × {mm(height)} mm · {design.material} · {design.finish} · quantity {design.quantity}</text>
      <text x="24" y={footerY + 8}>TYPE {t.fontFamily} {t.fontWeight} · SURFACE {TEXTURES.find(v => v.id === surface.texture)?.name ?? 'Smooth'} · {design.color.toUpperCase()}</text>
      <line x1="24" y1={footerY + 17} x2="36" y2={footerY + 17} stroke="#df2871" strokeWidth=".6" /><text x="40" y={footerY + 18}>CUT</text>
      <line x1="70" y1={footerY + 17} x2="82" y2={footerY + 17} stroke="#00a1b7" strokeWidth=".6" strokeDasharray="2 1.3" /><text x="86" y={footerY + 18}>FOLD / SCORE</text>
      {layout.notes.slice(0, 2).map((note, i) => <text key={i} x="24" y={footerY + 27 + i * 7} fontSize="3">{note}</text>)}
      <text x="24" y={footerY + 45} fontSize="3">STRUCTURAL CONCEPT · Manufacturer confirms tolerances, bleed, substrate, and assembly before production.</text>
    </g>}
  </svg>
}

export function FlatDesignView({ design }: { design: Design }) {
  const [zoom, setZoom] = useState(1), [artwork, setArtwork] = useState(true), [dimensions, setDimensions] = useState(true)
  return <div className="flat-design-view">
    <div className="flat-design-toolbar">
      <div><button aria-label="Zoom out 2D design" disabled={zoom <= 1} onClick={() => setZoom(v => Math.max(1, v - .25))}>−</button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in 2D design" disabled={zoom >= 3} onClick={() => setZoom(v => Math.min(3, v + .25))}>+</button><button onClick={() => setZoom(1)}>Fit sheet</button></div>
      <label><input type="checkbox" checked={artwork} onChange={e => setArtwork(e.target.checked)} />Artwork</label>
      <label><input type="checkbox" checked={dimensions} onChange={e => setDimensions(e.target.checked)} />Dimensions</label>
    </div>
    <div className="flat-sheet-scroll"><div className="flat-sheet" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}><Dieline design={design} showArtwork={artwork} showDimensions={dimensions} /></div></div>
  </div>
}
