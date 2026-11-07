import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Check, Maximize2, RotateCcw, X } from 'lucide-react'
import type { ToolActivity } from '../lib/types'

const ease = [0.22, 1, 0.36, 1] as const
const STEPS = ['Reading your idea', 'Planning the structure', 'Choosing board and finish', 'Setting the typography', 'Folding the dieline', 'Rendering in 3D']

export type BuildPhase = 'building' | 'shooting' | 'gallery' | 'error'
export type Shot = { view: string; label: string; src: string }

type Props = {
  phase: BuildPhase
  name: string
  prompt: string
  progress: string
  tools: ToolActivity[]
  shots: Shot[]
  error?: string
  sceneRef: RefObject<HTMLDivElement | null>
  value: string
  onChange: (v: string) => void
  onSend: (text: string) => void
  onStop: () => void
  onPreview: () => void
  onRetry: () => void
}

/** Live build screen: cursor + step feed + a blurred live render that sharpens; ends in a render gallery. */
export function BuildView({ phase, name, prompt, progress, tools, shots, error, sceneRef, value, onChange, onSend, onStop, onPreview, onRetry }: Props) {
  const building = phase === 'building' || phase === 'shooting'
  const [pct, setPct] = useState(0)
  const [lightbox, setLightbox] = useState<Shot | null>(null)
  const mirror = useRef<HTMLCanvasElement>(null)
  const feed = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0, click: 0 })

  // creeping progress that never claims 100% until done
  useEffect(() => {
    if (!building) { setPct(100); return }
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const s = (performance.now() - t0) / 1000
      setPct(p => Math.max(p, Math.min(phase === 'shooting' ? 97 : 92, Math.round(100 * (1 - Math.exp(-s / 14))) + tools.length * 3)))
    }, 150)
    return () => window.clearInterval(id)
  }, [building, phase, tools.length])

  // mirror the live (hidden) 3D canvas into the stage
  useEffect(() => {
    if (!building) return
    let raf = 0, last = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (t - last < 140) return
      last = t
      const src = sceneRef.current?.querySelector('canvas'); const dst = mirror.current
      if (!src || !dst || !src.width) return
      if (dst.width !== src.width) { dst.width = src.width; dst.height = src.height }
      const ctx = dst.getContext('2d'); if (!ctx) return
      ctx.clearRect(0, 0, dst.width, dst.height); ctx.drawImage(src, 0, 0)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [building, sceneRef])

  // cursor glides to the newest step and clicks
  useEffect(() => {
    const host = feed.current; if (!host) return
    const rows = host.querySelectorAll<HTMLElement>('.bv-step')
    const target = rows[rows.length - 1]
    const box = host.getBoundingClientRect()
    if (!target) { setCursor(c => ({ ...c, x: box.width * .7, y: 10 })); return }
    const r = (target.lastElementChild as HTMLElement | null ?? target).getBoundingClientRect()
    const id = window.setTimeout(() => setCursor(c => ({ x: r.right - box.left + 10, y: r.top - box.top + r.height / 2, click: c.click + 1 })), 120)
    return () => window.clearTimeout(id)
  }, [tools.length, progress])

  const live = tools.length ? tools : []
  const stepIdx = Math.min(STEPS.length - 1, Math.floor(pct / (100 / STEPS.length)))
  const blur = building ? Math.max(4, 26 - pct * .24) : 0

  return (
    <motion.div className="bv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(12px)', transition: { duration: .6, ease } }}>
      <div className="bp-field" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="bp-grain" aria-hidden="true" />

      <header className="bv-top">
        <span className="bv-name">{name}</span>
        <span className={`bv-state ${building ? 'busy' : phase}`}><i />{phase === 'shooting' ? 'Developing renders' : building ? `Building · ${pct}%` : phase === 'error' ? 'Needs another try' : 'Ready'}</span>
      </header>

      <AnimatePresence mode="wait">
        {building && (
          <motion.main key="build" className="bv-build" exit={{ opacity: 0, y: -20, filter: 'blur(10px)', transition: { duration: .5, ease } }}>
            <motion.div className="bv-stage" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease, delay: .15 }}>
              <canvas ref={mirror} style={{ filter: `blur(${blur}px) saturate(${.6 + pct / 250})`, transform: `scale(${.9 + pct / 1000})` }} />
              <div className="bv-scan" />
              <div className="bv-grid" aria-hidden="true">{Array.from({ length: 96 }, (_, i) => <i key={i} style={{ animationDelay: `${((i * 7919) % 2400) / 1000}s` }} />)}</div>
              <div className="bv-pct">{pct}<small>%</small></div>
            </motion.div>

            <div className="bv-side" ref={feed}>
              <motion.p className="bv-prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease, delay: .3 }}>“{prompt}”</motion.p>
              <div className="bv-steps">
                <AnimatePresence initial={false}>
                  {(live.length ? live.map(t => ({ id: t.id, text: t.summary, done: t.status === 'complete', err: t.status === 'error' })) : STEPS.slice(0, stepIdx + 1).map((s, i) => ({ id: s, text: s, done: i < stepIdx, err: false }))).map(s => (
                    <motion.div key={s.id} className={`bv-step ${s.done ? 'done' : ''} ${s.err ? 'err' : ''}`} layout
                      initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ duration: .55, ease }}>
                      <span className="bv-tick">{s.done ? <Check size={11} strokeWidth={3} /> : s.err ? <X size={11} strokeWidth={3} /> : <b />}</span>
                      <span>{s.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="bv-step live"><span className="bv-tick"><b /></span><span className="bv-shimmer">{phase === 'shooting' ? 'Shooting the renders' : progress || 'Thinking'}</span></div>
              </div>
              <motion.div className="bv-cursor" animate={{ x: cursor.x, y: cursor.y }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
                <svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="var(--ink)" stroke="var(--bg)" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                <span key={cursor.click} className="bv-click" />
                <em>minal</em>
              </motion.div>
            </div>
          </motion.main>
        )}

        {phase === 'gallery' && (
          <motion.main key="gallery" className="bv-gallery" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: .12 } } }}>
            {shots.map((s, i) => (
              <motion.button key={s.view} className={`bv-shot ${i === 0 ? 'hero' : ''}`} onClick={() => setLightbox(s)}
                variants={{ h: { opacity: 0, y: 30, filter: 'blur(18px)', scale: .96 }, s: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 1, ease } } }}>
                <img src={s.src} alt={`${name}, ${s.label} view`} />
                <span>{s.label}</span>
                <Maximize2 size={14} />
              </motion.button>
            ))}
            <motion.div className="bv-actions" variants={{ h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0, transition: { duration: .8, ease } } }}>
              <button className="bv-primary" onClick={onPreview}>Preview in studio</button>
            </motion.div>
          </motion.main>
        )}

        {phase === 'error' && (
          <motion.main key="error" className="bv-error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h2>That one didn't land.</h2>
            <p>{error || 'The AI request failed.'}</p>
            <div className="bv-actions"><button className="bv-primary" onClick={onRetry}><RotateCcw size={15} /> Try again</button><button className="bv-ghost" onClick={onPreview}>Open studio</button></div>
          </motion.main>
        )}
      </AnimatePresence>

      <motion.form className="bv-bar" onSubmit={e => { e.preventDefault(); if (!building && value.trim()) onSend(value.trim()) }}
        initial={{ y: '-34vh', scale: 1.06 }} animate={{ y: 0, scale: 1 }} transition={{ duration: 1.1, ease }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={building ? 'minal is building…' : 'Refine it: “make it navy”, “add a ribbon”…'} disabled={building} aria-label="Refine the design" />
        {building
          ? <button type="button" className="bv-send stop" onClick={onStop} aria-label="Stop"><span /></button>
          : <button type="submit" className="bv-send" disabled={!value.trim()} aria-label="Send"><ArrowUp size={17} /></button>}
      </motion.form>

      <AnimatePresence>{lightbox && (
        <motion.div className="bv-lightbox" onClick={() => setLightbox(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.img src={lightbox.src} alt="" initial={{ scale: .92 }} animate={{ scale: 1 }} exit={{ scale: .95 }} transition={{ duration: .5, ease }} />
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  )
}
