import { MinalMark } from './Brand'

/**
 * A pure-CSS 3D box built from a flat net. Its shape is driven entirely by
 * CSS custom properties set on any ancestor:
 *   --fold  0 → 1   walls rise from the flat net
 *   --lid   0 → 1   lid closes
 *   --tilt  deg     camera tilt (≈ -88 top-down, ≈ -22 three-quarter)
 *   --spin  deg     rotation around the vertical axis
 *   --box   colour of the board
 */
export function FoldBox({ w = 220, d = 150, h = 120, label = 'a little better.' }: { w?: number; d?: number; h?: number; label?: string }) {
  const s = { '--w': `${w}px`, '--d': `${d}px`, '--h': `${h}px` } as React.CSSProperties
  return <div className="fb-scene" style={s} aria-hidden="true">
    <div className="fb-world">
      <div className="fb-base fb-face">
        <span className="fb-crease" />
        <div className="fb-wall fb-front fb-face"><span className="fb-label">{label}</span></div>
        <div className="fb-wall fb-left fb-face" />
        <div className="fb-wall fb-right fb-face" />
        <div className="fb-wall fb-back fb-face">
          <div className="fb-lid fb-face"><MinalMark size={30} /><div className="fb-flap fb-face" /></div>
        </div>
      </div>
      <div className="fb-shadow" />
    </div>
  </div>
}
