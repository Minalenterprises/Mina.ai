import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { MinalMark } from '../components/Brand'
import { PixelSky } from '../components/PixelSky'
import { sendReset, signIn, signInWith, signUp } from '../lib/auth'

type Mode = 'signin' | 'signup' | 'reset' | 'sent'
const ease = [0.22, 1, 0.36, 1] as const
const COPY: Record<Mode, [string, string, string]> = {
  signin: ['Welcome', 'back.', 'Sign in to pick up where you left off.'],
  signup: ['Make your', 'first thing.', 'Free to start. Your projects follow you everywhere.'],
  reset: ['Forgot it?', 'No stress.', 'We’ll send a link to set a new password.'],
  sent: ['Check your', 'inbox.', ''],
}
const RENDERS = ['/renders/hero-r1.webp', '/renders/hero-r2.webp', '/renders/hero-r3.webp', '/renders/hero-r4.webp']

export function Login() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(pathname === '/signup' ? 'signup' : pathname === '/forgot' ? 'reset' : 'signin')
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [show, setShow] = useState(false), [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState<'' | 'form' | 'google' | 'apple'>(''), [error, setError] = useState('')
  const [slide, setSlide] = useState(0)

  useEffect(() => { const id = setInterval(() => setSlide(s => (s + 1) % RENDERS.length), 3800); return () => clearInterval(id) }, [])
  const go = (m: Mode) => { setMode(m); setError(''); const path = m === 'signup' ? '/signup' : m === 'reset' ? '/forgot' : '/login'; if (m !== 'sent') window.history.replaceState(null, '', path) }

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy('form')
    try {
      if (mode === 'signin') { await signIn(email, password); navigate('/projects') }
      else if (mode === 'signup') { await signUp(name, email, password); navigate('/studio') }
      else { await sendReset(email); setMode('sent') }
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy('') }
  }
  const social = async (p: 'google' | 'apple') => { setError(''); setBusy(p); try { await signInWith(p); navigate('/projects') } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.') } finally { setBusy('') } }
  const strength = Math.min(4, [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length)
  const [t1, t2, sub] = COPY[mode]

  return <main className="auth">
    <section className="auth-art" aria-hidden="true">
      <PixelSky />
      <div className="auth-art-inner">
        <Link to="/" className="auth-brand"><MinalMark size={22} /><b>minal<span>.ai</span></b></Link>
        <div className="auth-stage">
          {RENDERS.map((src, i) => {
            const d = (i - slide + RENDERS.length) % RENDERS.length
            return <motion.div key={src} className="auth-render" animate={{ x: d * 34, y: d * -26, scale: 1 - d * .08, opacity: d > 2 ? 0 : 1 - d * .22, rotate: d * 3, zIndex: 10 - d, filter: `blur(${d * 1.5}px)` }} transition={{ duration: 1.1, ease }}>
              <img src={src} alt="" /><span><i />Rendered by minal</span>
            </motion.div>
          })}
        </div>
        <blockquote>“I typed one sentence and had a box I could send to the printer by lunch.”<cite>Ayesha, candle studio owner</cite></blockquote>
      </div>
    </section>

    <section className="auth-panel">
      <Link to="/" className="auth-back"><ArrowLeft size={16} /> Home</Link>
      <AnimatePresence mode="wait">
        <motion.div key={mode} className="auth-card" initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: .55, ease }}>
          {mode === 'sent' ? <>
            <div className="auth-sent-icon"><Mail size={22} /></div>
            <h1>{t1}<br /><em>{t2}</em></h1>
            <p className="auth-sub">We sent a reset link to <b>{email}</b>. It expires in 30 minutes.</p>
            <button className="auth-primary" onClick={() => go('signin')}>Back to sign in <ArrowRight size={16} /></button>
            <p className="auth-switch">Didn’t get it? <button onClick={() => go('reset')}>Send again</button></p>
          </> : <>
            <h1>{t1}<br /><em>{t2}</em></h1>
            <p className="auth-sub">{sub}</p>

            {mode !== 'reset' && <>
              <div className="auth-social">
                <button type="button" onClick={() => social('google')} disabled={!!busy}>{busy === 'google' ? <Loader2 size={17} className="spin" /> : <GoogleIcon />} Continue with Google</button>
                <button type="button" onClick={() => social('apple')} disabled={!!busy}>{busy === 'apple' ? <Loader2 size={17} className="spin" /> : <AppleIcon />} Continue with Apple</button>
              </div>
              <div className="auth-or"><span>or with email</span></div>
            </>}

            <form onSubmit={submit} noValidate>
              <AnimatePresence initial={false}>
                {mode === 'signup' && <motion.label key="name" className="auth-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <span>Name</span><input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </motion.label>}
              </AnimatePresence>
              <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" autoFocus /></label>
              {mode !== 'reset' && <label className="auth-field">
                <span>Password {mode === 'signin' && <button type="button" className="auth-link" onClick={() => go('reset')}>Forgot?</button>}</span>
                <div className="auth-pass">
                  <input type={show ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} />
                  <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {mode === 'signup' && password && <div className={`auth-strength s${strength}`}><i /><i /><i /><i /><em>{['Too short', 'Weak', 'Okay', 'Good', 'Strong'][strength]}</em></div>}
              </label>}
              {mode === 'signin' && <label className="auth-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /><span className="box">{remember && <Check size={11} strokeWidth={3} />}</span>Keep me signed in</label>}

              <AnimatePresence>{error && <motion.p className="auth-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>

              <button className="auth-primary" disabled={!!busy}>
                {busy === 'form' ? <Loader2 size={17} className="spin" /> : <>{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'} <ArrowRight size={16} /></>}
              </button>
            </form>

            {mode === 'signup' && <p className="auth-terms">By creating an account you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>}
            <p className="auth-switch">
              {mode === 'signin' ? <>New to minal? <button onClick={() => go('signup')}>Create an account</button></> : <>Already have an account? <button onClick={() => go('signin')}>Sign in</button></>}
            </p>
          </>}
        </motion.div>
      </AnimatePresence>
    </section>
  </main>
}

const GoogleIcon = () => <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>
const AppleIcon = () => <svg width="16" height="17" viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9A5 5 0 0 0 1.1 7.3c-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.2-4.1zM11.6 3a4.4 4.4 0 0 0 1-3.2 4.5 4.5 0 0 0-2.9 1.5 4.2 4.2 0 0 0-1.1 3.1A3.7 3.7 0 0 0 11.6 3z"/></svg>
