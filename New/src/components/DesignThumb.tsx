import { memo } from 'react'
import type { Design } from '../lib/types'

/** Readable ink for text printed on the product colour. */
function inkFor(hex: string) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return '#1b1b1b'
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? 'rgba(20,18,16,.86)' : 'rgba(255,250,244,.92)'
}

const SLATS = 18

/**
 * Lightweight true-3D thumbnail (CSS preserve-3d, no WebGL context per card).
 * Proportions follow the design's real dimensions; colour, name and logo are
 * printed on the faces. Tilt is driven by the `--rx/--ry` CSS vars set by the
 * parent card on pointer move (no React re-render).
 */
export const DesignThumb = memo(function DesignThumb({ design }: { design: Design }) {
  const { length = 200, width = 120, height = 60 } = design.dimensions || {}
  const max = Math.max(length, width, height, 1)
  const scale = 118 / max
  const L = Math.max(34, length * scale), W = Math.max(26, width * scale), H = Math.max(18, height * scale)
  const category = String(design.category || 'Box').toLowerCase()
  const canister = category.includes('canister') || category.includes('tube') || category.includes('cylinder')
  const bag = category.includes('bag')
  const ink = inkFor(design.color || '#b8c9ac')
  const title = design.name === 'Untitled idea' ? 'your next good thing.' : design.name
  const vars = { '--product-color': design.color || '#b8c9ac', '--inner-color': design.innerColor || design.color || '#d9d2c3', '--accent-color': design.accentColor || '#ff6b00', '--ink-on': ink, '--L': `${L}px`, '--W': `${W}px`, '--H': `${H}px`, '--D': `${Math.max(L, W)}px` } as React.CSSProperties
  const label = <div className="thumb-label"><strong>{title}</strong>{design.logo && <img src={design.logo} alt="" loading="lazy" decoding="async" />}<small>THOUGHTFULLY MADE</small></div>

  return (
    <div className={`design-thumb3d ${canister ? 'is-canister' : bag ? 'is-bag' : 'is-box'}`} style={vars} aria-hidden="true">
      <div className="thumb3d-floor" />
      <div className="thumb3d-rig">
        {canister ? (
          <div className="thumb3d-cyl">
            {Array.from({ length: SLATS }, (_, i) => <span key={i} className="cyl-slat" style={{ '--i': i, '--n': SLATS } as React.CSSProperties} />)}
            <span className="cyl-cap" />
            <div className="cyl-label">{label}</div>
          </div>
        ) : (
          <div className="thumb3d-box">
            <div className="f f-front">{label}</div>
            <div className="f f-back" />
            <div className="f f-right" />
            <div className="f f-left" />
            {!bag && !design.openTop && <div className="f f-top" />}
            {bag && <div className="bag-handle" />}
            <div className="f f-bottom" />
          </div>
        )}
      </div>
    </div>
  )
})
