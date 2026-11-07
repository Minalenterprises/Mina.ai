import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Brand } from './Brand'

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold)
  useEffect(() => {
    let frame = 0
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setScrolled(window.scrollY > threshold)) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll) }
  }, [threshold])
  return scrolled
}

function NavLink({ to, pathname, onClick, children }: { to: string; pathname: string; onClick: () => void; children: React.ReactNode }) {
  const active = pathname === to
  return <Link className={active ? 'active' : ''} to={to} onClick={onClick} aria-current={active ? 'page' : undefined}>{children}{active && <motion.span layoutId="nav-underline" className="nav-underline" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}</Link>
}

export function Header({ workspace = false }: { workspace?: boolean }) {
  const { pathname } = useLocation()
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const menu = menuFor === pathname // auto-closes on navigation, no effect needed
  const setMenu = (open: boolean) => setMenuFor(open ? pathname : null)
  const scrolled = useScrolled()
  const close = () => setMenu(false)
  return (
    <header className={`site-header ${workspace ? 'workspace-header' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <Brand />
        <nav className={menu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          {workspace ? (
            <>
              <NavLink to="/projects" pathname={pathname} onClick={close}>My projects</NavLink>
              <Link to="/#explore" onClick={close}>Explore designs</Link>
              <NavLink to="/admin" pathname={pathname} onClick={close}>Admin workspace</NavLink>
            </>
          ) : (
            <>
              <a href="#how-it-works" onClick={close}>How it works</a>
              <a href="#explore" onClick={close}>Made with minal <span className="nav-new">NEW</span></a>
              <a href="#why-minal" onClick={close}>Why minal?</a>
            </>
          )}
        </nav>
        <div className="header-actions">
          {!workspace && <Link className="text-link projects-nav" to="/projects">My projects</Link>}
          <Link className="button button-lime button-sm glow-button" to="/studio" onClick={close}>{workspace ? <><Plus size={16} /> New project</> : <>Let's create <ArrowUpRight size={16} /></>}</Link>
          <button className="mobile-menu icon-button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
    </header>
  )
}
