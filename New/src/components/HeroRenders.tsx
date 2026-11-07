import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const
const CARDS = [
  { src: '/renders/hero-r1.webp', prompt: 'Navy perfume box', time: '38s', pos: 'tl', depth: 26, rot: -6 },
  { src: '/renders/hero-r2.webp', prompt: 'Sky blue tea canister', time: '24s', pos: 'tr', depth: 18, rot: 5 },
  { src: '/renders/hero-r3.webp', prompt: 'Kraft mailer with tissue', time: '31s', pos: 'bl', depth: 14, rot: 4 },
  { src: '/renders/hero-r4.webp', prompt: 'Serum carton and dropper', time: '42s', pos: 'br', depth: 22, rot: -4 },
] as const

/** Floating render previews in the hero corners: each one a finished minal render. */
export function HeroRenders() {
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 18 }), sy = useSpring(my, { stiffness: 50, damping: 18 })
  useEffect(() => {
    const move = (e: PointerEvent) => { mx.set(e.clientX / window.innerWidth - .5); my.set(e.clientY / window.innerHeight - .5) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])
  return <div className="hr-layer" aria-hidden="true">
    {CARDS.map((c, i) => <Card key={c.pos} c={c} i={i} sx={sx} sy={sy} />)}
  </div>
}

function Card({ c, i, sx, sy }: { c: typeof CARDS[number]; i: number; sx: ReturnType<typeof useSpring>; sy: ReturnType<typeof useSpring> }) {
  const x = useTransform(sx, v => v * -c.depth * 2), y = useTransform(sy, v => v * -c.depth * 2)
  const from = { tl: [-80, -60], tr: [80, -60], bl: [-80, 60], br: [80, 60] }[c.pos]
  return <motion.figure className={`hr-card hr-${c.pos}`} style={{ x, y }}
    initial={{ opacity: 0, translateX: from[0], translateY: from[1], rotate: c.rot * 2, filter: 'blur(16px)' }}
    animate={{ opacity: 1, translateX: 0, translateY: 0, rotate: c.rot, filter: 'blur(0px)' }}
    transition={{ duration: 1.4, ease, delay: .9 + i * .14 }}>
    <div className="hr-float" style={{ animationDelay: `${i * -1.7}s` }}>
      <div className="hr-shot"><img src={c.src} alt="" loading="eager" decoding="async" /></div>
      <figcaption><span className="hr-dot" />{c.prompt}<em>{c.time}</em></figcaption>
    </div>
  </motion.figure>
}
