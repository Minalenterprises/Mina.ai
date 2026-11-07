import { HeroRenders } from '../components/HeroRenders'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring, type MotionValue } from 'framer-motion'
import { Header } from '../components/Header'
import { Brand } from '../components/Brand'
import { PixelSky } from '../components/PixelSky'
import { Composer } from '../components/Composer'
import { FoldBox } from '../components/FoldBox'
import { PixelArrow } from '../components/PixelIcons'

const ease = [0.22, 1, 0.36, 1] as const
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mixHex = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], t))).join(',')})` }

export function Home() {
  const navigate = useNavigate()
  const [idea, setIdea] = useState('')
  const start = () => navigate(`/studio${idea.trim() ? `?idea=${encodeURIComponent(idea.trim())}` : ''}`)

  return <div className="home-page hz">
    <Cursor />
    <Header />
    <main>
      <section className="sky-hero hz-hero">
        <PixelSky />
        <HeroRenders />
        <div className="sky-hero-inner">
          <h1 className="hz-title"><SplitWords text="Your little idea," delay={0.1} /><br /><em><SplitWords text="made real." delay={0.35} /></em></h1>
          <motion.p className="hero-description" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .6, ease }}>Describe it in a sentence. minal plans it, designs it and builds it in 3D.</motion.p>
          <motion.div className="sky-hero-form" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, delay: .75, ease }}>
            <Composer value={idea} onChange={setIdea} onSubmit={start} />
          </motion.div>
        </div>
        <motion.a href="#story" className="hz-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}><span>Scroll</span><i /></motion.a>
      </section>

      <Story />
      <Colours />
      <Statement />

      <section className="hz-final">
        <PixelSky skyline cell={20} />
        <div className="hz-final-inner">
          <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .5 }} transition={{ duration: 1, ease }}>Got a<br /><em>what if?</em></motion.h2>
          <Magnetic><Link className="hz-btn" to="/studio">Start with your idea <PixelArrow size={13} /></Link></Magnetic>
        </div>
        <footer className="hz-foot"><Brand /><nav><a href="#story">How it works</a><Link to="/projects">My projects</Link><Link to="/admin">Admin</Link></nav><span>© {new Date().getFullYear()} minal.ai</span></footer>
      </section>
    </main>
  </div>
}

/* ─── Hero words rise out of a mask ─── */
function SplitWords({ text, delay = 0 }: { text: string; delay?: number }) {
  return <>{text.split(' ').map((w, i) => <span key={i} className="hz-mask"><motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: delay + i * .08, ease }}>{w}</motion.span></span>).flatMap((el, i) => i ? [' ', el] : [el])}</>
}

/* ─── 1. The pinned story: a prompt becomes a box ─── */
const PROMPT = 'A gift box for a silver spoon. Soft, calm, blue.'
const CHAPTERS = [
  { n: '01', t: 'Say it.', b: 'One sentence. That’s the whole brief.' },
  { n: '02', t: 'Plan it.', b: 'Size, board, finish and type, worked out for you.' },
  { n: '03', t: 'Fold it.', b: 'A real dieline that folds into a real box.' },
  { n: '04', t: 'Hold it.', b: 'Spin it in 3D. Then send it to print.' },
]
function Story() {
  const ref = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: .4 })
  const [typed, setTyped] = useState(0)
  const [chapter, setChapter] = useState(0)
  const [specs, setSpecs] = useState(0)

  useMotionValueEvent(p, 'change', v => {
    const el = stage.current; if (!el) return
    const fold = smooth(seg(v, .34, .6)), lid = smooth(seg(v, .6, .74)), tilt = mix(0, 62, smooth(seg(v, .3, .62)))
    const spin = mix(0, -28, smooth(seg(v, .3, .62))) + mix(0, -360, smooth(seg(v, .74, 1)))
    el.style.setProperty('--fold', fold.toFixed(4)); el.style.setProperty('--lid', lid.toFixed(4))
    el.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`); el.style.setProperty('--spin', `${spin.toFixed(2)}deg`)
    el.style.setProperty('--net', smooth(seg(v, .04, .18)).toFixed(3))
    el.style.setProperty('--box', mixHex('#1463ff', '#0b1a3a', smooth(seg(v, .82, 1))))
    setTyped(Math.round(PROMPT.length * seg(v, .02, .16)))
    setSpecs(seg(v, .18, .32))
    setChapter(v < .2 ? 0 : v < .34 ? 1 : v < .7 ? 2 : 3)
  })

  return <section ref={ref} className="hz-story" id="story">
    <div className="hz-sticky" ref={stage}>
      <div className="hz-grid-bg" />
      <div className="hz-chapters">
        {CHAPTERS.map((c, i) => <div key={c.n} className={`hz-chapter ${i === chapter ? 'on' : ''} ${i < chapter ? 'past' : ''}`}><span>{c.n}</span><h2>{c.t}</h2><p>{c.b}</p></div>)}
        <div className="hz-progress"><motion.i style={{ scaleY: p }} /></div>
      </div>
      <div className="hz-stage">
        <div className="hz-prompt" style={{ opacity: chapter < 2 ? 1 : 0, transform: `translateY(${chapter < 2 ? 0 : -20}px)` }}>
          <span className="hz-prompt-dot" />{PROMPT.slice(0, typed)}<i className="hz-caret" />
        </div>
        <div className="hz-boxwrap"><FoldBox w={280} d={180} h={140} /></div>
        <div className="hz-specs" style={{ opacity: chapter === 1 || chapter === 2 ? specs : 0 }}>
          {[['Size', '280 × 180 × 140 mm'], ['Board', '2 mm rigid greyboard'], ['Finish', 'Soft-touch matte'], ['Type', 'Instrument Serif']].map(([k, v], i) => <div key={k} style={{ opacity: clamp(specs * 4 - i), transform: `translateX(${(1 - clamp(specs * 4 - i)) * 16}px)` }}><span>{k}</span><b>{v}</b></div>)}
        </div>
      </div>
    </div>
  </section>
}

/* ─── 2. Colour washes ─── */
const COLOURS = [
  { name: 'Cobalt', bg: '#1463ff', ink: '#ffffff', box: '#0b1a3a' },
  { name: 'Glacier', bg: '#d6e6ff', ink: '#0a1a3d', box: '#1463ff' },
  { name: 'Midnight', bg: '#071230', ink: '#cfe0ff', box: '#3b7bff' },
  { name: 'Ultramarine', bg: '#2a2ae0', ink: '#e8ecff', box: '#f4f7fb' },
  { name: 'Mist', bg: '#eef2f6', ink: '#121821', box: '#121821' },
]
function Colours() {
  const ref = useRef<HTMLElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [idx, setIdx] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', v => {
    const f = clamp(v) * (COLOURS.length - 1), i = Math.floor(f), t = smooth(f - i), a = COLOURS[i], b = COLOURS[Math.min(i + 1, COLOURS.length - 1)]
    const el = inner.current; if (!el) return
    el.style.setProperty('--wash', mixHex(a.bg, b.bg, t)); el.style.setProperty('--wash-ink', mixHex(a.ink, b.ink, t)); el.style.setProperty('--box', mixHex(a.box, b.box, t))
    el.style.setProperty('--spin', `${-30 - v * 300}deg`)
    setIdx(Math.round(f))
  })
  return <section ref={ref} className="hz-colours">
    <div className="hz-wash" ref={inner}>
      <div className="hz-wash-top"><span>Any colour you can imagine</span><span>{String(idx + 1).padStart(2, '0')} / {String(COLOURS.length).padStart(2, '0')}</span></div>
      <div className="hz-names">{COLOURS.map((c, i) => <h2 key={c.name} className={i === idx ? 'on' : i < idx ? 'up' : ''}>{c.name}</h2>)}</div>
      <div className="hz-wash-box"><FoldBox w={200} d={140} h={110} label="minal" /></div>
      <p className="hz-wash-foot">Pick a swatch, type a hex, or pull a palette from a photo.</p>
    </div>
  </section>
}

/* ─── 3. Words light up as you read ─── */
const STATEMENT = 'You bring the little idea. minal brings the plan, the dieline and the 3D. You end up holding something real.'
function Statement() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.6'] })
  const words = STATEMENT.split(' ')
  return <section ref={ref} className="hz-statement page-width"><p>{words.map((w, i) => <Word key={i} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} accent={['minal', 'real.'].includes(w)}>{w}</Word>)}</p></section>
}
function Word({ p, range, children, accent }: { p: MotionValue<number>; range: [number, number]; children: string; accent?: boolean }) {
  const o = useTransform(p, range, [0.12, 1])
  return <motion.span className={accent ? 'accent' : ''} style={{ opacity: o }}>{children} </motion.span>
}

/* ─── Custom cursor ─── */
function Cursor() {
  const dot = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('hz-cursor-on')
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; const t = e.target as HTMLElement; ring.current?.classList.toggle('hover', !!t.closest('a,button,textarea,input,[role=button]')) }
    const loop = () => { rx += (x - rx) * .18; ry += (y - ry) * .18; if (dot.current) dot.current.style.transform = `translate(${x}px,${y}px)`; if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`; raf = requestAnimationFrame(loop) }
    addEventListener('pointermove', move); loop()
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); document.documentElement.classList.remove('hz-cursor-on') }
  }, [])
  return <><div ref={ring} className="hz-cur-ring" /><div ref={dot} className="hz-cur-dot" /></>
}

/* ─── Magnetic wrapper ─── */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => { const el = ref.current!, r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .4}px)` }
  return <div ref={ref} className="hz-magnetic" onPointerMove={onMove} onPointerLeave={() => { if (ref.current) ref.current.style.transform = '' }}>{children}</div>
}
