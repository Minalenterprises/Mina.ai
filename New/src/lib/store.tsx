import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { Check, X, Info } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Design, Order, SupportThread } from './types'

type Toast = { text: string; kind: 'success' | 'info'; id: number }
type Store = {
  designs: Design[]; orders: Order[]; threads: SupportThread[]
  saveDesign: (design: Design) => void; deleteDesign: (id: string) => void
  addOrder: (order: Order) => void; updateOrder: (id: string, status: Order['status']) => void
  saveThread: (thread: SupportThread) => void
  notify: (text: string, kind?: Toast['kind']) => void
  supportOpen: boolean; openSupport: () => void; closeSupport: () => void
  storageAvailable: boolean
}
const StoreContext = createContext<Store | null>(null)
function load<T,>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [designs, setDesigns] = useState<Design[]>(() => load('minal-designs-v1', []))
  const [orders, setOrders] = useState<Order[]>(() => load('minal-orders-v1', []))
  const [threads, setThreads] = useState<SupportThread[]>(() => load('minal-threads-v1', []))
  const [toast, setToast] = useState<Toast | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (!event.newValue) return
      try {
        const items: unknown = JSON.parse(event.newValue)
        if (!Array.isArray(items)) return
        if (event.key === 'minal-designs-v1') setDesigns(items)
        if (event.key === 'minal-orders-v1') setOrders(items)
        if (event.key === 'minal-threads-v1') setThreads(items)
      } catch { /* Ignore malformed external storage updates. */ }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  useEffect(() => {
    let available = true
    try {
      for (const [key, value] of [['minal-designs-v1', designs], ['minal-orders-v1', orders], ['minal-threads-v1', threads]] as const) {
        const serialized = JSON.stringify(value)
        if (localStorage.getItem(key) !== serialized) localStorage.setItem(key, serialized)
      }
    } catch { available = false }
    const timer = window.setTimeout(() => setStorageAvailable(available), 0)
    return () => window.clearTimeout(timer)
  }, [designs, orders, threads])
  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(null), 4200); return () => clearTimeout(timer) } }, [toast])
  const saveDesign = useCallback((design: Design) => setDesigns(previous => {
    // Merge against the latest stored collection so editing another project in a
    // second tab cannot silently replace projects from that tab with stale data.
    const latest = load<Design[]>('minal-designs-v1', previous)
    const found = latest.some(item => item.id === design.id)
    return found ? latest.map(item => item.id === design.id ? design : item) : [design, ...latest]
  }), [])
  const notify = useCallback((text: string, kind: Toast['kind'] = 'success') => setToast({ text, kind, id: Date.now() }), [])
  return <StoreContext.Provider value={{
    designs, orders, threads, saveDesign, storageAvailable,
    deleteDesign: id => setDesigns(items => items.filter(item => item.id !== id)),
    addOrder: order => setOrders(items => [order, ...items]),
    updateOrder: (id, status) => setOrders(items => items.map(item => item.id === id ? { ...item, status } : item)),
    saveThread: thread => setThreads(items => items.some(item => item.id === thread.id) ? items.map(item => item.id === thread.id ? thread : item) : [thread, ...items]),
    notify, supportOpen, openSupport: () => setSupportOpen(true), closeSupport: () => setSupportOpen(false),
  }}>
    {children}
    <AnimatePresence>{toast && <motion.div key={toast.id} className="toast" role="status" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>{toast.kind === 'success' ? <Check size={18} /> : <Info size={18} />}<span>{toast.text}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
  </StoreContext.Provider>
}
// Shared hook lives beside its provider so every page uses the same context.
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error('Store is not available'); return context }
