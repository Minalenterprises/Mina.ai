import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowUpRight, ArrowRight, Check, PackageCheck, LockKeyhole } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Design } from '../lib/types'
import { uid } from '../lib/types'
import { useStore } from '../lib/store'
export function OrderModal({ design, onClose }: { design: Design; onClose: () => void }) {
  const { addOrder } = useStore()
  const navigate = useNavigate()
  const [done, setDone] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', country: 'United States', quantity: design.quantity, notes: '' })
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLInputElement>('input')?.focus()
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') { const elements = dialog.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]'); if (!elements?.length) return; const first = elements[0], last = elements[elements.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() } }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = previousOverflow; previous?.focus() }
  }, [onClose])
  const field = (key: keyof typeof form, value: string | number) => setForm(previous => ({ ...previous, [key]: value }))
  return <div className="modal-backdrop" onClick={onClose}><motion.div className="order-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="order-heading" initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={onClose} aria-label="Close order form"><X size={21} /></button>{done ? <div className="order-success"><span className="success-orbit"><PackageCheck size={38} /></span><span className="eyebrow">ONE STEP CLOSER TO REAL</span><h2 id="order-heading">Your idea is on the list.</h2><p>Your order request for <strong>{design.name}</strong> has been saved in this browser.</p><div className="request-id"><span>REQUEST REFERENCE</span><strong>{done}</strong><small>{form.quantity} units · {form.fullName}</small></div><p className="demo-notice">This is a demo request. No payment was taken and nothing was sent to a manufacturer. You can review and update its status in the Admin workspace.</p><button className="button button-dark" onClick={() => { onClose(); navigate('/projects?tab=orders') }}>View my order requests <ArrowUpRight size={17} /></button><button className="text-link" onClick={onClose}>Back to my design</button></div> : <><span className="eyebrow">FROM A LITTLE IDEA TO YOUR DOOR</span><h2 id="order-heading">Let’s make it yours.</h2><p className="panel-description">A few details to take the next step. No payment needed.</p><div className="order-design-summary"><span className="order-swatch" style={{ background: design.color }}><PackageCheck size={26} strokeWidth={1.4} /></span><div><strong>{design.name}</strong><span>{design.material} · {design.finish}</span><small>{design.dimensions.length} × {design.dimensions.width} × {design.dimensions.height} mm</small></div><Check size={17} /></div><form onSubmit={e => { e.preventDefault(); const id = `MN-${uid().slice(0, 6).toUpperCase()}`; addOrder({ ...form, id, designId: design.id, designName: design.name, status: 'Requested', createdAt: new Date().toISOString() }); setDone(id) }}>
      <div className="field-row"><label className="field">Full name<input required autoComplete="name" placeholder="Alex Morgan" value={form.fullName} onChange={e => field('fullName', e.target.value)} maxLength={100} /></label><label className="field">Email address<input required type="email" autoComplete="email" placeholder="alex@example.com" value={form.email} onChange={e => field('email', e.target.value)} /></label></div>
      <div className="field-row"><label className="field">Phone <small>Optional</small><input type="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={e => field('phone', e.target.value)} /></label><label className="field">Quantity<input required type="number" min={1} max={100000} value={form.quantity} onChange={e => field('quantity', +e.target.value)} /></label></div>
      <label className="field">Street address<input required autoComplete="street-address" placeholder="123 Good Things Lane, Apt 4" value={form.address} onChange={e => field('address', e.target.value)} /></label>
      <div className="field-row"><label className="field">City<input required autoComplete="address-level2" placeholder="Portland" value={form.city} onChange={e => field('city', e.target.value)} /></label><label className="field">Postal code<input required autoComplete="postal-code" placeholder="97201" value={form.postalCode} onChange={e => field('postalCode', e.target.value)} /></label></div>
      <label className="field">Country<select value={form.country} onChange={e => field('country', e.target.value)}>{['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Netherlands', 'Singapore', 'United Arab Emirates', 'New Zealand', 'Japan', 'Other'].map(country => <option key={country}>{country}</option>)}</select></label>
      <label className="field">Anything else? <small>Optional</small><textarea rows={2} placeholder="Tell us about your timeline, delivery needs, or any little details." value={form.notes} onChange={e => field('notes', e.target.value)} maxLength={1200} /></label>
      <div className="demo-notice"><LockKeyhole size={15} /><span>Demo workspace: your request stays in this browser. No payment, email, or production order will be sent.</span></div><button className="button button-lime full-width" type="submit">Save order request <ArrowRight size={17} /></button></form></>}</motion.div></div>
}
