import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider } from './lib/store'
import { Home } from './pages/Home'
import { Studio } from './pages/Studio'
import { Projects } from './pages/Projects'
import { Admin } from './pages/Admin'
import { SupportChat } from './components/SupportChat'
import { ArrowLeft } from 'lucide-react'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/:id" element={<Studio />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<main className="not-found"><span className="eyebrow">A LITTLE DETOUR</span><h1>Let's get back to creating.</h1><p>This page hasn't been imagined yet.</p><Link className="button button-dark" to="/"><ArrowLeft size={18} /> Back to minal</Link></main>} />
        </Routes>
        <SupportChat />
      </StoreProvider>
    </BrowserRouter>
  )
}

export default App
