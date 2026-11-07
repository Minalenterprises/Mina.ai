import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * "AI cursor" overlay for the Studio 3D canvas.
 *
 * While the assistant is generating, a stylised cursor glides across the
 * canvas, clicks, and a ghost box assembles part-by-part under it — so the
 * wait feels like watching someone build, not staring at a spinner.
 *
 * It is a pure overlay (pointer-events: none) and never touches the 3D engine.
 *
 * ── Engine hook point ────────────────────────────────────────────────────
 * TODO(engine): when ProductScene / the AI harness exposes real build or
 * assemble events, dispatch them and the cursor will click in sync:
 *
 *   window.dispatchEvent(new CustomEvent(BUILD_STEP_EVENT, {
 *     detail: { part: 'lid', label: 'Adding the lid' }
 *   }))
 *
 * Optionally pass `detail.x` / `detail.y` (0..1, canvas-relative) to steer
 * the cursor to the exact on-screen location of the part being built.
 * Until then, Studio drives `pulse` from completed AI tool calls.
 */
export const BUILD_STEP_EVENT = 'mina:build-step'
export type BuildStepDetail = { part?: string; label?: string; x?: number; y?: number }

type Pt = [number, number]
const S = 46, H = 0.72
// Isometric projection into a 200×200 viewBox.
const iso = (x: number, y: number, z: number): Pt => [100 + (x - z) * 0.866 * S * 1.5, 118 + (x + z) * 0.5 * S * 1.5 - y * S * 1.5]
const poly = (pts: Pt[]) => pts.map(p => p.join(',')).join(' ')
const center = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]

const PARTS = (() => {
  const a = -0.5, b = 0.5
  const faces: { id: string; label: string; pts: Pt[]; from: Pt }[] = [
    { id: 'base', label: 'Laying the base panel', pts: [iso(a, 0, a), iso(b, 0, a), iso(b, 0, b), iso(a, 0, b)], from: [0, 14] },
    { id: 'back', label: 'Raising the back wall', pts: [iso(a, 0, a), iso(b, 0, a), iso(b, H, a), iso(a, H, a)], from: [10, -10] },
    { id: 'left', label: 'Folding the side flap', pts: [iso(a, 0, a), iso(a, 0, b), iso(a, H, b), iso(a, H, a)], from: [-14, -6] },
    { id: 'right', label: 'Folding the opposite flap', pts: [iso(b, 0, a), iso(b, 0, b), iso(b, H, b), iso(b, H, a)], from: [14, -6] },
    { id: 'front', label: 'Closing the front panel', pts: [iso(a, 0, b), iso(b, 0, b), iso(b, H, b), iso(a, H, b)], from: [0, 16] },
    { id: 'lid', label: 'Setting the lid & artwork', pts: [iso(a - .04, H + .02, a - .04), iso(b + .04, H + .02, a - .04), iso(b + .04, H + .02, b + .04), iso(a - .04, H + .02, b + .04)], from: [0, -26] },
  ]
  return faces.map(face => ({ ...face, anchor: center(face.pts) }))
})()
const CYCLE = PARTS.length + 1 // last beat = "done" shimmer before rebuilding
const BEAT_MS = 1050

type Props = { active: boolean; label?: string; pulse?: number }

export const AnimatedCursor = memo(function AnimatedCursor({ active, label, pulse = 0 }: Props) {
  return <AnimatePresence>{active && <CursorStage key="ai-cursor" label={label} pulse={pulse} />}</AnimatePresence>
})

function CursorStage({ label, pulse }: { label?: string; pulse: number }) {
  const reduce = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [tick, setTick] = useState(0)
  const [external, setExternal] = useState<{ count: number; detail?: BuildStepDetail }>({ count: 0 })

  useEffect(() => {
    const el = host.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (reduce) return
    const timer = window.setInterval(() => setTick(t => t + 1), BEAT_MS)
    const onStep = (event: Event) => setExternal(prev => ({ count: prev.count + 1, detail: (event as CustomEvent<BuildStepDetail>).detail }))
    window.addEventListener(BUILD_STEP_EVENT, onStep)
    return () => { window.clearInterval(timer); window.removeEventListener(BUILD_STEP_EVENT, onStep) }
  }, [reduce])

  const step = tick + pulse + external.count
  const phase = step % CYCLE
  const visible = phase === PARTS.length ? PARTS.length : phase + 1
  const current = PARTS[Math.min(phase, PARTS.length - 1)]

  // Ghost assembly occupies a centred square; map viewBox coords → pixels.
  const side = Math.min(box.w, box.h) * 0.62
  const ox = (box.w - side) / 2, oy = (box.h - side) / 2
  const target = useMemo(() => {
    const d = external.detail
    if (d && typeof d.x === 'number' && typeof d.y === 'number') return { x: d.x * box.w, y: d.y * box.h }
    if (phase === PARTS.length) return { x: ox + side * 0.86, y: oy + side * 0.18 }
    const [vx, vy] = current.anchor
    return { x: ox + (vx / 200) * side, y: oy + (vy / 200) * side }
  }, [external.detail, phase, current, ox, oy, side, box.w, box.h])

  const chip = label || external.detail?.label || (phase === PARTS.length ? 'Polishing the details' : current.label)
  const cycleId = Math.floor(step / CYCLE)

  return (
    <motion.div ref={host} className="ai-cursor-stage" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .4 } }}>
      <div className="ai-cursor-scrim" />
      {side > 0 && (
        <svg className="ai-ghost-box" viewBox="0 0 200 200" style={{ left: ox, top: oy, width: side, height: side }}>
          <defs>
            <linearGradient id="ghostFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8a3d" stopOpacity=".28" /><stop offset="1" stopColor="#8b5cf6" stopOpacity=".12" /></linearGradient>
            <linearGradient id="ghostStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb36b" /><stop offset=".5" stopColor="#ff6b00" /><stop offset="1" stopColor="#ff4fa3" /></linearGradient>
          </defs>
          <g key={cycleId}>
            {PARTS.slice(0, reduce ? PARTS.length : visible).map(part => (
              <motion.polygon
                key={part.id}
                points={poly(part.pts)}
                fill="url(#ghostFill)"
                stroke="url(#ghostStroke)"
                strokeWidth={1.4}
                strokeLinejoin="round"
                initial={reduce ? false : { opacity: 0, pathLength: 0, x: part.from[0], y: part.from[1] }}
                animate={{ opacity: 1, pathLength: 1, x: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 170, damping: 17, pathLength: { duration: .55, ease: 'easeOut' } }}
              />
            ))}
          </g>
          {phase === PARTS.length && !reduce && <motion.polygon key={`shine-${cycleId}`} points="-40,0 0,0 -40,200 -80,200" fill="rgba(255,255,255,.16)" initial={{ x: 0 }} animate={{ x: 320 }} transition={{ duration: .9, ease: 'easeInOut' }} />}
        </svg>
      )}

      {!reduce && side > 0 && (
        <motion.div className="ai-cursor" initial={{ x: box.w * 0.15, y: box.h * 0.85, opacity: 0 }} animate={{ x: target.x, y: target.y, opacity: 1 }} transition={{ type: 'spring', stiffness: 60, damping: 14, mass: .9 }}>
          <AnimatePresence>
            <motion.span key={`ripple-${step}`} className="ai-cursor-ripple" initial={{ scale: .2, opacity: .9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ delay: .62, duration: .6, ease: 'easeOut' }} />
          </AnimatePresence>
          <motion.svg className="ai-cursor-arrow" width="30" height="30" viewBox="0 0 24 24" key={`press-${step}`} animate={{ scale: [1, 1, .78, 1] }} transition={{ duration: .9, times: [0, .66, .74, .9] }}>
            <defs><linearGradient id="cursorGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3e8" /><stop offset="1" stopColor="#ffc08f" /></linearGradient></defs>
            <path d="M4.2 2.6 19.6 10.3c.8.4.7 1.6-.2 1.8l-6.1 1.5-2.6 5.8c-.4.8-1.6.7-1.8-.2L3 3.9c-.2-.8.5-1.5 1.2-1.3Z" fill="url(#cursorGrad)" stroke="#ff6b00" strokeWidth="1.3" strokeLinejoin="round" />
          </motion.svg>
          <span className="ai-cursor-chip"><span className="ai-cursor-chip-dot" />{chip}</span>
        </motion.div>
      )}
      {reduce && <span className="ai-cursor-chip ai-cursor-chip-static"><span className="ai-cursor-chip-dot" />{chip}</span>}
    </motion.div>
  )
}
