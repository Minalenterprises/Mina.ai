import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUp, Moon, Paperclip, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

const AGENT_KEY = 'minal-agent-mode'
const IDEAS = ['A rigid gift box for a silver spoon', 'A kraft mailer for scented candles', 'A tall tea canister in matte navy']
const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  name: string
  onRename: (name: string) => void
  value: string
  onChange: (v: string) => void
  onSubmit: (text: string, agent: boolean) => void
  onSkip: () => void
  onAttach?: () => void
}

/** New-project screen: soft blurred field, project name, one prompt box. */
export function BlankProject({ name, onRename, value, onChange, onSubmit, onSkip, onAttach }: Props) {
  const { theme, toggle } = useTheme()
  const [agent, setAgent] = useState(() => localStorage.getItem(AGENT_KEY) !== 'off')
  const [title, setTitle] = useState(name)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { localStorage.setItem(AGENT_KEY, agent ? 'on' : 'off') }, [agent])
  useEffect(() => { const t = window.setTimeout(() => ref.current?.focus(), 700); return () => window.clearTimeout(t) }, [])
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = '0px'; el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [value])
  const submit = () => { const t = value.trim(); if (t) onSubmit(t, agent) }
  const commitTitle = () => { const t = title.trim() || 'Untitled project'; setTitle(t); if (t !== name) onRename(t) }

  return (
    <div className="bp">
      <div className="bp-field" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="bp-grain" aria-hidden="true" />

      <motion.header className="bp-top" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease }}>
        <Link to="/projects" className="bp-ghost" aria-label="Back to projects"><ArrowLeft size={16} /></Link>
        <input className="bp-title" value={title} onChange={e => setTitle(e.target.value)} onBlur={commitTitle} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} aria-label="Project name" spellCheck={false} />
        <button className="bp-ghost" onClick={toggle} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      </motion.header>

      <main className="bp-main">
        <motion.h1 className="bp-hello" initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease, delay: .15 }}>
          What should we make?
        </motion.h1>

        <motion.form className={`bp-box ${agent ? 'is-agent' : ''}`} onSubmit={e => { e.preventDefault(); submit() }}
          initial={{ opacity: 0, y: 26, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, ease, delay: .3 }}>
          <textarea ref={ref} rows={1} value={value} onChange={e => onChange(e.target.value)} placeholder="Describe your packaging idea…" maxLength={2000}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} aria-label="Describe your idea" />
          <div className="bp-row">
            {onAttach && <button type="button" className="bp-tool" onClick={onAttach} aria-label="Add a reference image"><Paperclip size={16} /></button>}
            <button type="button" className={`bp-agent ${agent ? 'on' : ''}`} onClick={() => setAgent(a => !a)} aria-pressed={agent}>
              <span className="bp-agent-dot"><i /><i /><i /><i /></span>
              Agent
              <span className="bp-switch"><b /></span>
            </button>
            <span className="bp-hint">{agent ? 'Plans, designs and builds it end to end' : 'Asks before each step'}</span>
            <button type="submit" className="bp-send" disabled={!value.trim()} aria-label="Start"><ArrowUp size={18} /></button>
          </div>
        </motion.form>

        <motion.div className="bp-ideas" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: .08, delayChildren: .6 } } }}>
          {IDEAS.map(idea => (
            <motion.button key={idea} type="button" onClick={() => { onChange(idea); ref.current?.focus() }}
              variants={{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0, transition: { duration: .7, ease } } }}>{idea}</motion.button>
          ))}
        </motion.div>
      </main>

      <motion.button className="bp-skip" onClick={onSkip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: .8 }}>
        Open the empty studio
      </motion.button>
    </div>
  )
}
