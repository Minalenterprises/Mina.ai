import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PixelMark } from './LoadingScreen'

const PHASES = ['Reading your idea', 'Planning the structure', 'Choosing board & finish', 'Setting the type', 'Folding the dieline', 'Rendering in 3D']
const COLS = 28, ROWS = 16

/**
 * Shown over the (blurred) product while the AI generates: a pixel field
 * that sparkles and fills, a scan line, a self-assembling pixel mark and a
 * live status. When generation ends it fades and the product sharpens.
 */
export const GenerateOverlay = memo(function GenerateOverlay({ active, label }: { active: boolean; label?: string }) {
  const [phase, setPhase] = useState(0)
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (!active) { setPhase(0); setPct(0); return }
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const s = (performance.now() - t0) / 1000
      setPct(Math.min(96, Math.round(100 * (1 - Math.exp(-s / 9)))))
      setPhase(Math.min(PHASES.length - 1, Math.floor(s / 2.4)))
    }, 120)
    return () => window.clearInterval(id)
  }, [active])
  return <AnimatePresence>{active && <motion.div className="gx" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .6 } }} aria-live="polite">
    <div className="gx-field" aria-hidden="true">{Array.from({ length: COLS * ROWS }, (_, i) => <i key={i} style={{ animationDelay: `${((i * 7919) % 2600) / 1000}s`, animationDuration: `${2 + ((i * 31) % 17) / 10}s` }} />)}</div>
    <div className="gx-scan" aria-hidden="true" />
    <div className="gx-card">
      <PixelMark size={52} />
      <div className="gx-copy">
        <AnimatePresence mode="wait"><motion.strong key={label || PHASES[phase]} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}>{label || PHASES[phase]}</motion.strong></AnimatePresence>
        <span>{pct}%</span>
      </div>
      <div className="gx-bar"><motion.i animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut', duration: .4 }} /></div>
      <div className="gx-steps">{PHASES.map((p, i) => <b key={p} className={i < phase ? 'done' : i === phase ? 'on' : ''} />)}</div>
    </div>
  </motion.div>}</AnimatePresence>
})
