import { PixelChat } from './PixelIcons'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, ArrowUp, CheckCheck, ChevronDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MinalMark } from './Brand'
import { useStore } from '../lib/store'
import { supportReply } from '../lib/assistant'
import { uid } from '../lib/types'
export function SupportChat() {
  const { supportOpen, openSupport, closeSupport, threads, saveThread } = useStore()
  const [tab, setTab] = useState<'guide' | 'team'>('guide')
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<{ id: string; role: 'assistant' | 'user'; text: string; time: string }[]>([{ id: 'welcome', role: 'assistant', text: 'Hey, you.\nGot a little question? I’m here to help with your plan, colors, 3D preview, or next steps.', time: '' }])
  const end = useRef<HTMLDivElement>(null)
  const messagesContainer = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()
  const thread = threads.find(item => item.id === 'local-visitor')
  useEffect(() => { if (supportOpen && messagesContainer.current) messagesContainer.current.scrollTop = messagesContainer.current.scrollHeight }, [messages.length, thread?.messages.length, supportOpen, typing, tab])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') closeSupport() }; if (supportOpen) { document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key) } }, [supportOpen, closeSupport])
  const send = (value = text) => {
    if (!value.trim() || typing) return
    const now = new Date().toISOString(); setText('')
    if (tab === 'team') { saveThread({ id: 'local-visitor', name: 'Your design conversation', status: 'Open', messages: [...(thread?.messages || []), { id: uid(), role: 'user', text: value.trim(), createdAt: now }] }); return }
    setMessages(old => [...old, { id: uid(), role: 'user', text: value.trim(), time: now }]); setTyping(true)
    timer.current = setTimeout(() => { setMessages(old => [...old, { id: uid(), role: 'assistant', text: supportReply(value), time: new Date().toISOString() }]); setTyping(false) }, 600)
  }
  const isWorkspace = location.pathname !== '/'
  return <div className={`support-widget ${isWorkspace ? 'workspace-support' : ''}`}><AnimatePresence>{supportOpen && <motion.section className="support-panel" role="dialog" aria-label="Minal support chat" initial={{ opacity: 0, y: 15, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .97 }}><header className="support-header"><span className="assistant-avatar"><MinalMark size={24} /></span><div><h2>A little help?</h2><span>Good questions deserve good answers.</span></div><button onClick={closeSupport} aria-label="Close support chat"><X size={18} /></button></header><div className="support-tabs"><button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}><MinalMark size={12} /> Minal guide</button><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}><MessageCircle size={13} /> Design team {thread?.messages.some(message => message.role === 'admin') && <span className="unread-dot" />}</button></div><div className="support-messages" ref={messagesContainer} role="log" aria-live="polite"><div className="support-date">{tab === 'guide' ? 'YOUR BUILT-IN PRODUCT GUIDE' : 'LOCAL DEMO · TEAM INBOX'}</div>{tab === 'guide' ? <>{messages.map(message => <div key={message.id} className={`support-bubble ${message.role === 'user' ? 'outgoing' : 'incoming'}`}><p>{message.text}</p>{message.time && <span>{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.role === 'user' && <CheckCheck size={12} />}</span>}</div>)}{typing && <div className="typing-bubble"><i /><i /><i /></div>}{messages.length === 1 && <div className="support-suggestions">{['How does it work?', 'Can I upload my logo?', 'How do I order?'].map(value => <button key={value} onClick={() => send(value)}>{value} <ArrowUp size={12} /></button>)}</div>}</> : <><div className="support-info">This is a local demo inbox, not live support. Messages appear in the Admin workspace in this browser.<Link to="/admin?tab=inbox" onClick={closeSupport}>Try the admin inbox <ExternalLink size={11} /></Link></div>{thread?.messages.map(message => <div key={message.id} className={`support-bubble ${message.role === 'user' ? 'outgoing' : 'incoming'}`}>{message.role === 'admin' && <strong className="reply-author">Minal design team</strong>}<p>{message.text}</p><span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.role === 'user' && <CheckCheck size={12} />}</span></div>)}{!thread?.messages.length && <div className="team-empty"><MessageCircle size={30} strokeWidth={1.2} /><h3>Your idea has company.</h3><p>Leave a question about your design. You can try the team’s side of the conversation in Admin.</p></div>}</>}<div ref={end} /></div><form className="support-compose" onSubmit={e => { e.preventDefault(); send() }}><input aria-label="Support message" placeholder={tab === 'guide' ? 'Ask a little question…' : 'Message the design team…'} value={text} onChange={e => setText(e.target.value)} maxLength={2000} /><button type="submit" disabled={!text.trim() || typing} aria-label="Send support message"><ArrowUp size={18} /></button></form><div className="support-fineprint">{tab === 'guide' ? 'Built-in help · no live AI connection' : 'Messages are saved only on this device'}</div></motion.section>}</AnimatePresence><button className={`support-launcher ${supportOpen ? 'is-open' : ''}`} onClick={supportOpen ? closeSupport : openSupport} aria-label={supportOpen ? 'Minimize support chat' : 'Chat with minal'} aria-expanded={supportOpen}>{supportOpen ? <ChevronDown size={22} /> : <><PixelChat size={20} /><span className="launcher-label">Ask minal</span></>}</button></div>
}
