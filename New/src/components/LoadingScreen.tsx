import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MinalMark } from './Brand'

/**
 * A pure-CSS 3D dieline that folds itself into a box, then spins.
 * No WebGL, no images — cheap enough to render anywhere (app boot, route
 * fallback, 3D canvas fallback, empty states).
 */
export const FoldingBox = memo(function FoldingBox({ size = 64, loop = true }: { size?: number; loop?: boolean }) {
  return (
    <div className={`fold-box ${loop ? 'is-looping' : 'is-once'}`} style={{ '--fold-size': `${size}px` } as React.CSSProperties} aria-hidden="true">
      <div className="fold-box-rig">
        <div className="fold-face fold-base">
          <div className="fold-face fold-flap fold-front" />
          <div className="fold-face fold-flap fold-right" />
          <div className="fold-face fold-flap fold-left" />
          <div className="fold-face fold-flap fold-back">
            <div className="fold-face fold-lid"><MinalMark size={Math.round(size * 0.42)} /></div>
          </div>
        </div>
      </div>
      <div className="fold-box-shadow" />
    </div>
  )
})

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  angle: (i / 18) * 360,
  radius: 92 + ((i * 37) % 60),
  delay: -((i * 0.29) % 3.2),
  size: 2 + (i % 3),
}))

/** Asymptotic fake progress so the bar always moves but never lies about finishing. */
function useCreepingProgress(done: boolean) {
  const [value, setValue] = useState(0.04)
  useEffect(() => {
    if (done) return
    const timer = window.setInterval(() => setValue(v => v + (0.94 - v) * 0.085), 120)
    return () => window.clearInterval(timer)
  }, [done])
  return done ? 1 : value
}

type LoadingScreenProps = {
  /** fullscreen = app boot overlay; inline = fills its (relative) parent, e.g. the 3D canvas. */
  variant?: 'fullscreen' | 'inline'
  label?: string
  /** 0..1. When omitted, a smooth creeping progress is shown. */
  progress?: number
  done?: boolean
}

export function LoadingScreen({ variant = 'fullscreen', label = 'Preparing your studio', progress, done = false }: LoadingScreenProps) {
  const creeping = useCreepingProgress(done)
  const value = Math.max(0, Math.min(1, progress ?? creeping))
  const inline = variant === 'inline'
  return (
    <motion.div
      className={`loading-screen loading-${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: inline ? 1 : 1.03, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="loading-aurora" aria-hidden="true" />
      <div className="loading-core">
        <div className="loading-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span key={i} style={{ '--p-angle': `${p.angle}deg`, '--p-radius': `${inline ? p.radius * 0.7 : p.radius}px`, '--p-delay': `${p.delay}s`, '--p-size': `${p.size}px` } as React.CSSProperties} />
          ))}
        </div>
        <FoldingBox size={inline ? 52 : 70} />
      </div>
      {!inline && <div className="loading-wordmark">minal<span>.</span>ai</div>}
      <div className="loading-meta">
        <span className="loading-label">{label}<i className="loading-ellipsis"><b>.</b><b>.</b><b>.</b></i></span>
        <div className="loading-bar" aria-hidden="true"><span style={{ transform: `scaleX(${value})` }} /></div>
        <span className="loading-percent">{Math.round(value * 100)}%</span>
      </div>
    </motion.div>
  )
}

/** Tiny, non-blocking fallback for lazy routes: a glowing progress hairline. */
export function RouteLoader() {
  return <div className="route-loader" role="status" aria-label="Loading page"><span /></div>
}
