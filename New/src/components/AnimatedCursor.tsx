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

  const done = phase === PARTS.length
  const bbox = useMemo(() => {
    const xs = current.pts.map(p => p[0]), ys = current.pts.map(p => p[1])
    const pad = 5
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 }
  }, [current])
  const dims = ['240 × 90', '240 × 40', '90 × 40', '90 × 40', '240 × 40', '244 × 94'][Math.min(phase, PARTS.length - 1)]
  const shade = (id: string) => id === 'lid' || id === 'base' ? 'var(--cur-top)' : id === 'left' || id === 'front' ? 'var(--cur-side-a)' : 'var(--cur-side-b)'

  return (
    <motion.div ref={host} className="ai-cursor-stage" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .4 } }}>
      <svg className="ai-cursor-grid" width="100%" height="100%"><defs><pattern id="aiDots" width="18" height="18" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="2" height="2" fill="var(--cur-dot)" /></pattern></defs><rect width="100%" height="100%" fill="url(#aiDots)" /></svg>
      {side > 0 && (
        <svg className="ai-ghost-box" viewBox="0 0 200 200" style={{ left: ox, top: oy, width: side, height: side }}>
          <g key={cycleId}>
            {PARTS.slice(0, reduce ? PARTS.length : visible).map(part => (
              <motion.polygon
                key={part.id}
                points={poly(part.pts)}
                fill={shade(part.id)}
                stroke="var(--cur-ink)"
                strokeWidth={1.1}
                strokeLinejoin="round"
                initial={reduce ? false : { opacity: 0, x: part.from[0], y: part.from[1] }}
                animate={{ opacity: part.id === 'lid' ? .96 : 1, x: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 210, damping: 20 }}
              />
            ))}
          </g>
          {!reduce && !done && (
            <motion.g key={`sel-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35, duration: .2 }}>
              <rect x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h} fill="none" stroke="var(--cur-blue)" strokeWidth={.9} />
              {[[bbox.x, bbox.y], [bbox.x + bbox.w, bbox.y], [bbox.x, bbox.y + bbox.h], [bbox.x + bbox.w, bbox.y + bbox.h]].map(([hx, hy], i) => <rect key={i} x={hx - 2.4} y={hy - 2.4} width={4.8} height={4.8} fill="var(--cur-surface)" stroke="var(--cur-blue)" strokeWidth={.9} />)}
              <g transform={`translate(${bbox.x + bbox.w / 2} ${bbox.y + bbox.h + 10})`}><rect x={-19} y={-6} width={38} height={12} rx={3} fill="var(--cur-blue)" /><text x={0} y={2.6} textAnchor="middle" fontSize={7} fontWeight={700} fill="#fff" fontFamily="Plus Jakarta Sans, system-ui">{dims}</text></g>
            </motion.g>
          )}
          {done && !reduce && <motion.g key={`done-${cycleId}`} initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '160px', originY: '40px' }}><rect x={140} y={30} width={44} height={16} rx={8} fill="var(--cur-ink)" /><text x={162} y={41} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="var(--cur-surface)" fontFamily="Plus Jakarta Sans, system-ui">✓ Ready</text></motion.g>}
        </svg>
      )}

      {!reduce && side > 0 && (
        <motion.div className="ai-cursor" initial={{ x: box.w * 0.15, y: box.h * 0.85, opacity: 0 }} animate={{ x: target.x, y: target.y, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, damping: 15, mass: .8 }}>
          <AnimatePresence>
            <motion.span key={`ripple-${step}`} className="ai-cursor-ripple" initial={{ scale: .3, opacity: .9 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ delay: .62, duration: .55, ease: 'easeOut' }} />
          </AnimatePresence>
          <motion.svg className="ai-cursor-arrow" width="22" height="22" viewBox="0 0 22 22" key={`press-${step}`} animate={{ scale: [1, 1, .82, 1] }} transition={{ duration: .9, times: [0, .66, .74, .9] }}>
            <path d="M2 1.5 L19.5 9.2 L11.6 11.4 L8.3 19.6 Z" fill="var(--cur-blue)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          </motion.svg>
          <span className="ai-cursor-chip"><b>minal</b><AnimatePresence mode="wait"><motion.span key={chip} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .18 }}>{chip}</motion.span></AnimatePresence></span>
        </motion.div>
      )}
      <div className="ai-cursor-progress">{PARTS.map((part, i) => <i key={part.id} className={i < visible ? 'on' : ''} />)}<span>{done ? 'Ready' : `Step ${phase + 1} of ${PARTS.length}`}</span></div>
      {reduce && <span className="ai-cursor-chip ai-cursor-chip-static"><b>minal</b>{chip}</span>}
    </motion.div>
  )
}
