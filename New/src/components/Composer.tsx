import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, ImagePlus, Box, Cylinder, Package, ChevronDown, Sparkles } from 'lucide-react'

const IDEAS = ['a gift box for a silver spoon', 'a minimal skincare carton', 'a matcha tea canister', 'a candle box that feels like a hug', 'packaging for handmade soap']
const TYPES = [{ id: 'Box', icon: Box }, { id: 'Carton', icon: Package }, { id: 'Canister', icon: Cylinder }] as const

/** Typewriter placeholder that cycles through example ideas. */
function useTypewriter(paused: boolean) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (paused) return
    let i = 0, c = 0, deleting = false, timer = 0
    const tick = () => {
      const word = IDEAS[i]
      c += deleting ? -1 : 1
      setText(word.slice(0, c))
      let wait = deleting ? 28 : 55
      if (!deleting && c === word.length) { deleting = true; wait = 1600 }
      else if (deleting && c === 0) { deleting = false; i = (i + 1) % IDEAS.length; wait = 350 }
      timer = window.setTimeout(tick, wait)
    }
    timer = window.setTimeout(tick, 500)
    return () => window.clearTimeout(timer)
  }, [paused])
  return text
}

type Props = { value: string; onChange: (v: string) => void; onSubmit: () => void }

export function Composer({ value, onChange, onSubmit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('Box')
  const [open, setOpen] = useState(false)
  const typed = useTypewriter(focused || value.length > 0)
  const TypeIcon = TYPES.find(t => t.id === type)!.icon

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const submit = () => { if (value.trim()) onSubmit(); else ref.current?.focus() }

  return (
    <form className={`composer ${focused ? 'is-focused' : ''}`} onSubmit={e => { e.preventDefault(); submit() }}>
      <div className="composer-field">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={600}
          aria-label="Describe your product idea"
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
        />
        {!value && <span className="composer-placeholder" aria-hidden="true">{focused ? 'Describe your product…' : <>I need {typed}<i className="composer-caret" /></>}</span>}
      </div>
      <div className="composer-bar">
        <div className="composer-tools">
          <div className="composer-type">
            <button type="button" className="composer-chip" onClick={() => setOpen(o => !o)} aria-expanded={open}><TypeIcon size={15} /> {type} <ChevronDown size={14} /></button>
            <AnimatePresence>{open && (
              <motion.div className="composer-menu" initial={{ opacity: 0, y: 6, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .97 }} transition={{ duration: .15 }}>
                {TYPES.map(t => <button type="button" key={t.id} className={t.id === type ? 'active' : ''} onClick={() => { setType(t.id); setOpen(false) }}><t.icon size={15} /> {t.id}</button>)}
              </motion.div>
            )}</AnimatePresence>
          </div>
          <button type="button" className="composer-chip composer-icon" aria-label="Add a reference image" title="Add a reference image"><ImagePlus size={16} /></button>
          <span className="composer-hint"><Sparkles size={13} /> AI plans, designs & builds it in 3D</span>
        </div>
        <motion.button type="submit" className="composer-send" aria-label="Start creating" whileTap={{ scale: .92 }} data-ready={value.trim().length > 0}><ArrowUp size={19} strokeWidth={2.4} /></motion.button>
      </div>
    </form>
  )
}
