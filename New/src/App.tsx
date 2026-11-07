import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { StoreProvider } from './lib/store'
import { SupportChat } from './components/SupportChat'
import { LoadingScreen, RouteLoader } from './components/LoadingScreen'

// Route-level code splitting: the 3D studio (three.js) never loads on Home/Projects.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Studio = lazy(() => import('./pages/Studio').then(m => ({ default: m.Studio })))
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))

const BOOT_KEY = 'mina:booted'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function NotFound() {
  return <main className="not-found"><span className="eyebrow">A LITTLE DETOUR</span><h1>Let's get back to creating.</h1><p>This page hasn't been imagined yet.</p><Link className="button button-lime" to="/"><ArrowLeft size={18} /> Back to minal</Link></main>
}

function AnimatedRoutes() {
  const location = useLocation()
  // Key by top-level section so /studio → /studio/:id (a replace redirect) doesn't re-animate.
  const section = location.pathname.split('/')[1] || 'home'
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={section}
        className="route-frame"
        // Opacity + translate only (no filter): framer resets transform to `none` at rest,
        // so fixed modals and sticky panels inside pages keep their containing block.
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/:id" element={<Studio />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

/** Branded boot screen: waits for fonts + a short minimum so it never flashes. */
function useBoot() {
  const [booting, setBooting] = useState(true)
  const [done, setDone] = useState(false)
  useEffect(() => {
    let cancelled = false
    let seen = false
    try { seen = sessionStorage.getItem(BOOT_KEY) === '1' } catch { /* private mode */ }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const minimum = new Promise(resolve => setTimeout(resolve, seen || reduce ? 350 : 1300))
    const fonts = (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined)
    const cap = new Promise(resolve => setTimeout(resolve, 3500)) // never hold the app hostage
    Promise.race([Promise.all([minimum, fonts]), cap]).then(() => {
      if (cancelled) return
      setDone(true)
      try { sessionStorage.setItem(BOOT_KEY, '1') } catch { /* ignore */ }
      window.setTimeout(() => { if (!cancelled) setBooting(false) }, 260)
    })
    return () => { cancelled = true }
  }, [])
  return { booting, done }
}

function App() {
  const { booting, done } = useBoot()
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <StoreProvider>
          <ScrollManager />
          <AnimatedRoutes />
          <SupportChat />
          <AnimatePresence>{booting && <LoadingScreen key="boot" label="Warming up the studio" done={done} />}</AnimatePresence>
        </StoreProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
