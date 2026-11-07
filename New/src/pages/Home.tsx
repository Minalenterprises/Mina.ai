import { useState, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Box, Layers3, ArrowRight } from 'lucide-react'
import { Header } from '../components/Header'
import { Brand, MinalMark } from '../components/Brand'
import { LoadingScreen } from '../components/LoadingScreen'
import { PixelSky } from '../components/PixelSky'
import { Composer } from '../components/Composer'
import { PixelArrow, PixelBox, PixelChat, PixelCheck, PixelMinus, PixelPlus, PixelSpark } from '../components/PixelIcons'
import { examples, newDesign, type Example } from '../lib/types'
import { useStore } from '../lib/store'
const ProductScene = lazy(() => import('../components/ProductScene'))

const ease = [0.22, 1, 0.36, 1] as const
const reveal = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.8, ease } }
const SWATCHES = ['#1463ff', '#0a0d14', '#b8c9ac', '#c9bade', '#e2a18b', '#f3e7d3']
const MARQUEE = ['Gift boxes', 'Folding cartons', 'Tea canisters', 'Skincare', 'Candles', 'Coffee', 'Jewellery', 'Chocolate', 'Soap', 'Mailers']

export function Home() {
  const navigate = useNavigate()
  const { saveDesign, openSupport } = useStore()
  const [idea, setIdea] = useState('')
  const [view, setView] = useState<'render' | '3d' | '2d'>('render')
  const [swatch, setSwatch] = useState(SWATCHES[0])
  const [faq, setFaq] = useState<number | null>(0)
  const [selected, setSelected] = useState<Example | null>(null)
  const demo = { ...newDesign(), name: 'a little better.', color: '#b8c9ac', brief: 'A sage green presentation box for a stainless steel spoon', stage: 'design' as const }
  const start = () => navigate(`/studio${idea.trim() ? `?idea=${encodeURIComponent(idea.trim())}` : ''}`)
  const openExample = (example: Example) => {
    const design = { ...newDesign(example.brief), name: example.name, category: example.type, color: example.color, stage: 'plan' as const, chatStep: 5, dimensions: example.type === 'Canister' ? { length: 90, width: 90, height: 140 } : example.type === 'Carton' ? { length: 60, width: 45, height: 150 } : { length: 240, width: 90, height: 40 }, messages: [{ id: crypto.randomUUID(), role: 'assistant' as const, text: `Let’s make ${example.name} your own. I’ve put together an editable starting plan from this concept. Change any detail, then bring it into 3D.` }] }
    saveDesign(design); navigate(`/studio/${design.id}`)
  }
  const faqs = [
    ['Do I need to know anything about design?', 'Not a thing. Start with an idea, even “I need a box for a spoon.” minal shapes the brief, picks colours and materials, and builds an editable plan with you.'],
    ['Can I use my own colours and branding?', 'Yes. Upload a reference image to pull a palette, pick any custom colour and add your logo. No logo? Your design stays beautifully clean.'],
    ['What can I make with minal?', 'Rigid presentation boxes, folding cartons and cylindrical canisters today. Every dimension, colour, material, finish and typeface is yours to change, in 2D and 3D.'],
    ['How does ordering work?', 'When you love it, send an order request with quantity and delivery details. In this demo nothing is charged and no manufacturing order is placed.'],
    ['Are my projects saved?', 'Yes. Conversations, plans, designs and order requests are saved in this browser, and you can download the plan and a 2D dieline anytime.'],
  ]
  const steps = [
    { n: '01', icon: PixelChat, title: 'Say it in a sentence', body: 'Describe the product and the feeling. minal asks the few questions that matter.' },
    { n: '02', icon: PixelSpark, title: 'Get a real plan', body: 'Size, structure, material, finish and type, laid out as a plan you can edit line by line.' },
    { n: '03', icon: PixelBox, title: 'Hold it in 3D', body: 'Spin it, open it, unfold it. Export the dieline, then send it to production.' },
  ]

  return <div className="home-page hx">
    <Header />
    <main>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="sky-hero">
        <PixelSky />
        <div className="sky-hero-inner">
          <motion.a href="#showcase" className="hx-badge" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease }}><span className="hx-badge-tag">NEW</span><span>Live 3D with print-ready dielines</span><PixelArrow size={12} /></motion.a>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .08, ease }}>Your little idea,<br /><em>made real.</em></motion.h1>
          <motion.p className="hero-description" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .16, ease }}>Describe it in a sentence. minal plans it, designs it and builds it in 3D, ready for the real world.</motion.p>
          <motion.div className="sky-hero-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .24, ease }}>
            <Composer value={idea} onChange={setIdea} onSubmit={start} />
            <div className="idea-suggestions">{['A box for a silver spoon', 'A minimal skincare carton', 'A matcha tea canister'].map(s => <button key={s} onClick={() => setIdea(s)}>{s}</button>)}</div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee ────────────────────────────────────────── */}
      <div className="hx-marquee" aria-hidden="true"><div className="hx-marquee-track">{[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i}>{m}<i><PixelSpark size={10} /></i></span>)}</div></div>

      {/* ── Bento showcase ─────────────────────────────────── */}
      <section className="hx-section page-width" id="showcase">
        <motion.header className="hx-head" {...reveal}><span className="hx-eyebrow"><PixelSpark size={10} /> See it before it exists</span><h2>One sentence in.<br /><em>Three ways to see it.</em></h2></motion.header>
        <div className="hx-bento">
          <motion.article className="hx-card hx-card-hero" {...reveal}>
            <div className="hx-card-top"><span className="hx-pill"><span className="hx-dot" /> a little better.</span><div className="hx-seg">{(['render', '3d', '2d'] as const).map(v => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'render' ? 'Render' : v === '3d' ? '3D' : 'Dieline'}</button>)}</div></div>
            <div className="hx-stage">
              <AnimatePresence mode="wait">
                <motion.div key={view} className="hx-stage-inner" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={{ duration: .35, ease }}>
                  {view === 'render' ? <img src="/images/hero-packaging.webp" alt="Sage green spoon packaging designed with minal" fetchPriority="high" /> : view === '3d' ? <Suspense fallback={<LoadingScreen variant="inline" label="Loading 3D" />}><ProductScene design={demo} openBox autoRotate /></Suspense> : <Dieline />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="hx-card-foot"><span>240 × 90 × 40 mm · Rigid box · Soft-touch matte</span><Link to="/studio" className="hx-link">Make one <PixelArrow size={11} /></Link></div>
          </motion.article>
          <motion.article className="hx-card hx-card-color" {...reveal} transition={{ ...reveal.transition, delay: .08 }}>
            <span className="hx-card-kicker">Any colour</span>
            <div className="hx-color-box" style={{ background: swatch }}><MinalMark size={26} /></div>
            <div className="hx-swatches">{SWATCHES.map(c => <button key={c} aria-label={`Colour ${c}`} className={c === swatch ? 'on' : ''} style={{ background: c }} onClick={() => setSwatch(c)} />)}</div>
            <p>Pick a swatch, or pull a palette from a photo.</p>
          </motion.article>
          <motion.article className="hx-card hx-card-chat" {...reveal} transition={{ ...reveal.transition, delay: .14 }}>
            <span className="hx-card-kicker">It asks, you answer</span>
            <div className="hx-chat">
              <div className="hx-bubble ai"><MinalMark size={12} /> What goes inside?</div>
              <div className="hx-bubble me">A silver spoon, as a gift.</div>
              <div className="hx-bubble ai"><MinalMark size={12} /> Rigid box, velvet insert, soft matte?</div>
              <div className="hx-typing"><i /><i /><i /></div>
            </div>
          </motion.article>
          <motion.article className="hx-card hx-card-stat" {...reveal} transition={{ ...reveal.transition, delay: .2 }}>
            <span className="hx-card-kicker">From idea to 3D</span>
            <b>~60<small>sec</small></b>
            <p>No design tools, no blank canvas.</p>
          </motion.article>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="hx-section page-width" id="how-it-works">
        <motion.header className="hx-head hx-head-split" {...reveal}><div><span className="hx-eyebrow"><PixelSpark size={10} /> How it works</span><h2>A small chat.<br /><em>A real product.</em></h2></div><p>No complicated tools and no blank-canvas panic. Just you, your idea and a little help.</p></motion.header>
        <div className="hx-steps">{steps.map((s, i) => <motion.article key={s.n} className="hx-step" {...reveal} transition={{ ...reveal.transition, delay: i * .08 }}><div className="hx-step-top"><span className="hx-step-icon"><s.icon size={22} /></span><span className="hx-step-n">{s.n}</span></div><h3>{s.title}</h3><p>{s.body}</p></motion.article>)}</div>
      </section>

      {/* ── Gallery ────────────────────────────────────────── */}
      <section className="hx-section page-width" id="explore">
        <motion.header className="hx-head hx-head-split" {...reveal}><div><span className="hx-eyebrow"><PixelSpark size={10} /> Made with minal</span><h2>Little ideas.<br /><em>Lovely things.</em></h2></div><Link to="/studio" className="hx-link">Your idea could be next <PixelArrow size={11} /></Link></motion.header>
        <div className="hx-gallery">{examples.map((item, i) => <motion.button key={item.name} className="hx-shot" onClick={() => setSelected(item)} {...reveal} transition={{ ...reveal.transition, delay: i * .08 }}><div className="hx-shot-img"><img src={item.image} alt={`${item.name} packaging`} loading="lazy" /><span className="hx-shot-tag">{item.label}</span><span className="hx-shot-open"><PixelArrow size={14} /></span></div><div className="hx-shot-cap"><div><h3>{item.name}</h3><p>{item.category}</p></div><i style={{ background: item.color }} /></div></motion.button>)}</div>
      </section>

      {/* ── Night band ─────────────────────────────────────── */}
      <section className="hx-night">
        <PixelSky skyline cell={18} />
        <motion.div className="hx-night-inner" {...reveal}>
          <span className="hx-eyebrow light"><PixelSpark size={10} /> Why minal</span>
          <h2>The best things start<br />with <em>“what if.”</em></h2>
          <ul>{['Your vision, never a template', 'Every detail stays editable', 'A real preview before a real commitment'].map(t => <li key={t}><PixelCheck size={14} /> {t}</li>)}</ul>
          <Link to="/studio" className="hx-btn hx-btn-light">Start with your idea <PixelArrow size={12} /></Link>
        </motion.div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="hx-section page-width hx-faq">
        <motion.header className="hx-head" {...reveal}><span className="hx-eyebrow"><PixelSpark size={10} /> Questions</span><h2>Curious?<br /><em>Good.</em></h2><button onClick={openSupport} className="hx-link">Ask us anything <PixelArrow size={11} /></button></motion.header>
        <div className="hx-faq-list">{faqs.map(([q, a], i) => <div key={q} className={`hx-faq-item ${faq === i ? 'open' : ''}`}><button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}><span>{q}</span>{faq === i ? <PixelMinus size={12} /> : <PixelPlus size={12} />}</button><AnimatePresence initial={false}>{faq === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .3, ease }}><p>{a}</p></motion.div>}</AnimatePresence></div>)}</div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="hx-cta page-width">
        <motion.div className="hx-cta-card" {...reveal}>
          <PixelSky skyline={false} cell={16} />
          <div className="hx-cta-inner"><h2>That idea you keep<br /><em>thinking about?</em></h2><p>You don’t need it all figured out. Just start.</p><Link className="hx-btn" to="/studio">Hello minal, I have an idea <PixelArrow size={12} /></Link></div>
        </motion.div>
      </section>
    </main>

    <footer className="hx-footer page-width">
      <div className="hx-footer-top"><div><Brand /><p>A little imagination. A world of possibility.</p></div><nav><a href="#how-it-works">How it works</a><a href="#explore">Made with minal</a><Link to="/projects">My projects</Link><button onClick={openSupport}>Say hello</button></nav></div>
      <div className="hx-wordmark" aria-hidden="true">minal<span>.</span>ai</div>
      <div className="hx-footer-bottom"><span>© {new Date().getFullYear()} minal.ai</span><span>Made for the what-ifs.</span><Link to="/admin">Admin</Link></div>
    </footer>

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><motion.section className="example-modal" role="dialog" aria-modal="true" aria-label={selected.name} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close design preview" onClick={() => setSelected(null)}><X size={20} /></button><img src={selected.image} alt={selected.name} /><div className="example-modal-copy"><span className="eyebrow">A MINAL CONCEPT · {selected.label}</span><h2>{selected.name}</h2><p>{selected.brief}</p><div className="example-specs"><span><i style={{ background: selected.color }} /> Custom colour</span><span><Box size={15} /> {selected.type}</span><span><Layers3 size={15} /> Editable plan</span></div><button className="button button-lime" onClick={() => openExample(selected)}>Make it your own <ArrowRight size={17} /></button></div></motion.section></div>}
  </div>
}

/** Animated dieline: the flat net draws itself in. */
function Dieline() {
  const paths = ['M60 70h120v60H60z', 'M60 70V30h120v40', 'M60 130v40h120v-40', 'M60 70H20v60h40', 'M180 70h40v60h-40', 'M60 30l10-14h100l10 14']
  return <svg className="hx-dieline" viewBox="0 0 240 190" fill="none">
    {paths.map((d, i) => <motion.path key={i} d={d} stroke="currentColor" strokeWidth={1.2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .9, delay: i * .15, ease }} />)}
    <motion.path d="M60 70h120M60 130h120" stroke="var(--blue)" strokeWidth={1} strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} />
    <text x="120" y="104" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="Instrument Serif, serif" fontStyle="italic">a little better.</text>
    <text x="120" y="184" textAnchor="middle" fontSize="6" fill="var(--ink-mute)" letterSpacing="1">CUT ── FOLD - - -</text>
  </svg>
}
