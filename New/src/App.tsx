import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { StoreProvider } from './lib/store'
import { SupportChat } from './components/SupportChat'
import { LoadingScreen, RouteLoader } from './components/LoadingScreen'
import { PixelSky } from './components/PixelSky'

// Route-level code splitting: the 3D studio (three.js) never loads on Home/Projects.
// Each loader is shared by `lazy` and the prefetcher, so a prefetched chunk is reused instantly.
const loaders = {
  home: () => import('./pages/Home'),
  studio: () => import('./pages/Studio'),
  projects: () => import('./pages/Projects'),
  login: () => import('./pages/Login'),
  admin: () => import('./pages/Admin'),
}
const Home = lazy(() => loaders.home().then(m => ({ default: m.Home })))
const Studio = lazy(() => loaders.studio().then(m => ({ default: m.Studio })))
const Projects = lazy(() => loaders.projects().then(m => ({ default: m.Projects })))
const Login = lazy(() => loaders.login().then(m => ({ default: m.Login })))
const Admin = lazy(() => loaders.admin().then(m => ({ default: m.Admin })))

const prefetched = new Set<string>()
function prefetch(section: string) {
  if (prefetched.has(section)) return
  prefetched.add(section)
  const load = section === 'studio'
    // The studio's 3D engine (three.js) is the heavy part, so warm it together with the page.
    ? () => Promise.all([loaders.studio(), import('./components/ProductScene')])
    : section === '' ? loaders.home
      : section === 'signup' || section === 'forgot' ? loaders.login
        : loaders[section as keyof typeof loaders]
  if (!load) return
  void load().catch(() => prefetched.delete(section))
}

/** Warms route chunks so switching pages is instant: on hover/focus of a link, and the studio when the browser is idle. */
function RoutePrefetcher() {
  useEffect(() => {
    const onIntent = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]')
      const href = link?.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      prefetch(href.split(/[/?#]/)[1] ?? '')
    }
    document.addEventListener('pointerover', onIntent, { passive: true })
    document.addEventListener('focusin', onIntent)
    document.addEventListener('touchstart', onIntent, { passive: true })
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = saveData ? 0 : idle(() => { prefetch('studio'); prefetch('projects') })
    return () => {
      document.removeEventListener('pointerover', onIntent)
      document.removeEventListener('focusin', onIntent)
      document.removeEventListener('touchstart', onIntent)
      if (id) cancel(id)
    }
  }, [])
  return null
}

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
  return <main className="not-found"><PixelSky skyline /><div className="not-found-card"><span className="eyebrow">ERROR 404 · A LITTLE DETOUR</span><h1>This page hasn’t<br /><em>been imagined yet.</em></h1><p>Move your mouse, the sky is still here. Or head back and make something.</p><div className="not-found-actions"><Link className="button button-lime" to="/"><ArrowLeft size={18} /> Back home</Link><Link className="button button-outline" to="/studio">Open the studio</Link></div></div></main>
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
        // A quick exit and a slightly longer enter: with mode="wait" the two play back to back,
        // so a long exit made every page switch feel slow.
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, y: -4, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/:id" element={<Studio />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/forgot" element={<Login />} />
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
          {!booting && <RoutePrefetcher />}
          <SupportChat />
          <AnimatePresence>{booting && <LoadingScreen key="boot" label="Warming up the studio" done={done} />}</AnimatePresence>
        </StoreProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
