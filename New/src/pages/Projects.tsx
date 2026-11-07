import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, memo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ArrowUpRight, Search, Box, FileText, Copy, Trash2, PackageCheck, ArrowRight, X, ArrowDownUp, Sparkles, Ruler } from 'lucide-react'
import { Header } from '../components/Header'
import { DesignThumb } from '../components/DesignThumb'
import { FoldingBox } from '../components/LoadingScreen'
import { useStore } from '../lib/store'
import { uid, type Design } from '../lib/types'

const STATUSES = ['All', 'Draft', 'Ready', 'Archived'] as const
const SORTS = { recent: 'Recently edited', oldest: 'Oldest first', name: 'Name A–Z' } as const
type Sort = keyof typeof SORTS

const ease = [0.22, 1, 0.36, 1] as const

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (Number.isNaN(min)) return ''
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function Projects() {
  const { designs, orders, deleteDesign, saveDesign, notify } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'orders' ? 'orders' : 'designs'
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All')
  const [sort, setSort] = useState<Sort>('recent')
  const [deleteTarget, setDeleteTarget] = useState<Design | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses search, Escape clears it / closes the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setDeleteTarget(null); if (document.activeElement === searchRef.current) setQuery('') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const counts = useMemo(() => ({
    All: designs.length,
    Draft: designs.filter(d => d.status === 'Draft').length,
    Ready: designs.filter(d => d.status === 'Ready').length,
    Archived: designs.filter(d => d.status === 'Archived').length,
  }), [designs])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const list = designs.filter(d => (!q || `${d.name} ${d.category} ${d.material} ${d.finish}`.toLowerCase().includes(q)) && (status === 'All' || d.status === status))
    return list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'oldest' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt))
  }, [designs, deferredQuery, status, sort])

  const filteredOrders = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return orders.filter(order => `${order.designName} ${order.id}`.toLowerCase().includes(q))
  }, [orders, deferredQuery])

  const duplicate = useCallback((design: Design) => {
    const now = new Date().toISOString()
    saveDesign({ ...design, id: uid(), name: `${design.name.slice(0, 52)} (copy)`, status: 'Draft', createdAt: now, updatedAt: now })
    notify('A fresh copy, ready for a new direction.')
  }, [saveDesign, notify])

  const filtering = !!query || status !== 'All'
  const clearFilters = () => { setQuery(''); setStatus('All') }

  return (
    <div className="workspace-page projects-shell">
      <Header workspace />
      <main className="projects-page page-width">
        <div className="projects-ambient" aria-hidden="true" />
        <motion.section className="projects-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease }}>
          <div>
            <span className="eyebrow"><Sparkles size={12} /> Your design library</span>
            <h1>Good things, <em>in progress.</em></h1>
            <p>Every box, carton and canister you’ve imagined — ready to pick up exactly where you left off.</p>
          </div>
          <div className="projects-hero-side">
            <dl className="projects-stats">
              <div><dt>Designs</dt><dd>{designs.length}</dd></div>
              <div><dt>Ready</dt><dd>{counts.Ready}</dd></div>
              <div><dt>Requests</dt><dd>{orders.length}</dd></div>
            </dl>
            <Link to="/studio" className="button button-lime glow-button"><Plus size={18} /> New design</Link>
          </div>
        </motion.section>

        <motion.div className="projects-toolbar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .08, ease }}>
          <div className="workspace-tabs" role="tablist" aria-label="Library sections">
            {([['designs', 'Designs', designs.length, Box], ['orders', 'Order requests', orders.length, PackageCheck]] as const).map(([key, text, count, Icon]) => (
              <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setParams(key === 'orders' ? { tab: 'orders' } : {})}>
                {tab === key && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Icon size={15} /> {text} <span className="tab-count">{count}</span>
              </button>
            ))}
          </div>
          <div className="projects-filters">
            <label className="search-input">
              <Search size={16} />
              <input ref={searchRef} aria-label="Search projects" placeholder={tab === 'designs' ? 'Search designs, materials…' : 'Search requests…'} value={query} onChange={e => setQuery(e.target.value)} />
              {query ? <button aria-label="Clear search" onClick={() => setQuery('')}><X size={13} /></button> : <kbd>/</kbd>}
            </label>
            {tab === 'designs' && (
              <label className="filter-select">
                <ArrowDownUp size={14} />
                <select aria-label="Sort projects" value={sort} onChange={e => setSort(e.target.value as Sort)}>
                  {Object.entries(SORTS).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
                </select>
              </label>
            )}
          </div>
        </motion.div>

        {tab === 'designs' && designs.length > 0 && (
          <div className="status-chips" role="group" aria-label="Filter by status">
            {STATUSES.map(item => (
              <button key={item} className={status === item ? 'active' : ''} aria-pressed={status === item} onClick={() => setStatus(item)}>
                {status === item && <motion.span layoutId="chip-pill" className="chip-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span>{item === 'All' ? 'All designs' : item}</span><small>{counts[item]}</small>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {tab === 'designs' ? (
            <motion.div key="designs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3, ease }}>
              {filtered.length ? (
                <div className="project-grid">
                  <AnimatePresence>
                    {filtered.map((design, index) => <ProjectCard key={design.id} design={design} index={index} onDuplicate={duplicate} onDelete={setDeleteTarget} />)}
                    {!filtering && (
                      <motion.div key="new-card" layout initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }} transition={{ duration: .4, ease }}>
                        <Link className="new-project-card" to="/studio">
                          <span className="new-project-plus"><Plus size={24} /></span>
                          <h3>Start something new.</h3>
                          <p>Describe an idea and watch it fold into 3D.</p>
                          <b>New design <ArrowUpRight size={15} /></b>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  title={filtering ? 'Nothing matches that — yet.' : 'Your next good thing starts here.'}
                  text={filtering ? 'Try another word, or clear the filters to see everything.' : 'A box for a spoon. A new daily ritual. That thing you can’t stop thinking about. Let’s give it shape.'}
                  action={filtering
                    ? <button className="button button-outline" onClick={clearFilters}>Clear filters</button>
                    : <><Link to="/studio" className="button button-lime glow-button">Start a design <ArrowRight size={17} /></Link><Link to="/#explore" className="text-arrow-link">Or borrow some inspiration <ArrowUpRight size={15} /></Link></>}
                />
              )}
            </motion.div>
          ) : (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3, ease }}>
              {filteredOrders.length ? (
                <div className="orders-list">
                  {filteredOrders.map((order, index) => (
                    <motion.article className="order-request-card" key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .04, .3), duration: .4, ease }}>
                      <span className="order-list-icon"><PackageCheck size={22} strokeWidth={1.5} /></span>
                      <div>
                        <span className="eyebrow">{order.id}</span>
                        <h2>{order.designName}</h2>
                        <p>{order.quantity} units · {order.fullName} · {order.city}, {order.country}</p>
                        <small>Requested {new Date(order.createdAt).toLocaleDateString()} · Stored on this device</small>
                      </div>
                      <span className="status-tag status-ready">{order.status}</span>
                      <Link className="button button-outline button-sm" to={`/studio/${order.designId}`}>View design <ArrowUpRight size={14} /></Link>
                    </motion.article>
                  ))}
                  <div className="demo-notice">These are local demo requests. No payment or production order has been sent. Statuses can be managed in the Admin workspace.</div>
                </div>
              ) : (
                <EmptyState
                  icon={<PackageCheck size={30} strokeWidth={1.4} />}
                  title={query ? 'No requests match that search.' : 'No requests. Plenty of possibility.'}
                  text="When a design feels just right, open it in the studio and choose “Order this design”."
                  action={<button className="button button-lime glow-button" onClick={() => setParams({})}>Browse my designs <ArrowRight size={17} /></button>}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="workspace-bottom-note"><FileText size={14} /> Projects are stored in this browser. Export a plan from the studio to keep a copy.</div>
      </main>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="modal-backdrop" onClick={() => setDeleteTarget(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-heading" onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
              <span className="confirm-icon"><Trash2 size={22} /></span>
              <h2 id="delete-heading">Let this idea go?</h2>
              <p>“{deleteTarget.name}” will be permanently deleted from this browser. Any existing order request will remain.</p>
              <div>
                <button className="button button-outline" autoFocus onClick={() => setDeleteTarget(null)}>Keep it</button>
                <button className="button button-danger" onClick={() => { deleteDesign(deleteTarget.id); setDeleteTarget(null); notify('Project deleted.') }}>Delete project</button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type CardProps = { design: Design; index: number; onDuplicate: (d: Design) => void; onDelete: (d: Design) => void }

const ProjectCard = memo(function ProjectCard({ design, index, onDuplicate, onDelete }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  // Pointer tilt writes CSS vars directly — zero React re-renders while hovering.
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${px * 26}deg`)
      el.style.setProperty('--rx', `${-py * 16}deg`)
      el.style.setProperty('--mx', `${(px + .5) * 100}%`)
      el.style.setProperty('--my', `${(py + .5) * 100}%`)
    })
  }
  const onLeave = () => { cancelAnimationFrame(frame.current); const el = ref.current; if (!el) return; el.style.removeProperty('--ry'); el.style.removeProperty('--rx') }
  const { length, width, height } = design.dimensions

  return (
    <motion.article
      ref={ref}
      layout
      className="project-card"
      style={{ '--product-color': design.color } as React.CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, y: 22, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: .94, transition: { duration: .2 } }}
      transition={{ duration: .5, delay: Math.min(index * .045, .36), ease }}
    >
      <Link className="project-image" to={`/studio/${design.id}`} aria-label={`Open ${design.name} in the studio`}>
        <span className="project-image-glow" aria-hidden="true" />
        <DesignThumb design={design} />
        <span className={`status-tag status-${design.status.toLowerCase()}`}>{design.status}</span>
        <span className="project-open"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="project-card-body">
        <div className="project-card-title">
          <Link to={`/studio/${design.id}`}><h2>{design.name}</h2></Link>
          <span className="project-swatch" style={{ background: design.color }} aria-hidden="true" />
        </div>
        <span className="project-meta">{design.category} · {design.finish}</span>
        <div className="project-card-footer">
          <small><Ruler size={12} /> {length}×{width}×{height} mm · {relativeTime(design.updatedAt)}</small>
          <div className="project-actions">
            <button className="icon-button" onClick={() => onDuplicate(design)} title="Duplicate" aria-label={`Duplicate ${design.name}`}><Copy size={15} /></button>
            <button className="icon-button danger-button" onClick={() => onDelete(design)} title="Delete" aria-label={`Delete ${design.name}`}><Trash2 size={15} /></button>
          </div>
        </div>
      </div>
    </motion.article>
  )
})

function EmptyState({ title, text, action, icon }: { title: string; text: string; action: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <motion.div className="empty-state" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease }}>
      <div className="empty-state-art">{icon ? <span className="empty-icon">{icon}</span> : <FoldingBox size={60} />}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="empty-actions">{action}</div>
    </motion.div>
  )
}
