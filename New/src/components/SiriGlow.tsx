import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Siri-style flowing multicolor edge glow. Place inside any element with
 * `position: relative` (and a border-radius — the glow inherits it).
 * Pure CSS (conic-gradient + registered @property angle), GPU friendly,
 * and only mounted while `active` so it costs nothing at rest.
 */
export const SiriGlow = memo(function SiriGlow({ active, variant = 'ring', intensity = 1 }: { active: boolean; variant?: 'ring' | 'edge' | 'soft'; intensity?: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          key="siri"
          className={`siri-glow siri-${variant}`}
          style={{ '--siri-intensity': intensity } as React.CSSProperties}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="siri-glow-ring" />
          <span className="siri-glow-bloom" />
        </motion.span>
      )}
    </AnimatePresence>
  )
})

/** A small liquid orb: idle it breathes softly, active it swirls. */
export const SiriOrb = memo(function SiriOrb({ active, size = 42 }: { active: boolean; size?: number }) {
  return (
    <span className={`siri-orb ${active ? 'is-active' : ''}`} style={{ '--orb-size': `${size}px` } as React.CSSProperties} aria-hidden="true">
      <i /><i /><i />
    </span>
  )
})
