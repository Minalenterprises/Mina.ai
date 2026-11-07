import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X, Plus } from 'lucide-react'
import { Brand } from './Brand'
export function Header({ workspace = false }: { workspace?: boolean }) {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  return <header className={`site-header ${workspace ? 'workspace-header' : ''}`}><div className="header-inner"><Brand />
    <nav className={menu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
      {workspace ? <><Link className={pathname === '/projects' ? 'active' : ''} to="/projects" onClick={() => setMenu(false)}>My projects</Link><Link to="/#explore" onClick={() => setMenu(false)}>Explore designs</Link><Link className={pathname === '/admin' ? 'active' : ''} to="/admin" onClick={() => setMenu(false)}>Admin workspace</Link></> : <><a href="#how-it-works" onClick={() => setMenu(false)}>How it works</a><a href="#explore" onClick={() => setMenu(false)}>Made with minal <span className="nav-new">NEW</span></a><a href="#why-minal" onClick={() => setMenu(false)}>Why minal?</a></>}
    </nav>
    <div className="header-actions">{!workspace && <Link className="text-link projects-nav" to="/projects">My projects</Link>}<Link className="button button-dark button-sm" to="/studio" onClick={() => setMenu(false)}>{workspace ? <><Plus size={16} /> New project</> : <>Let's create <ArrowUpRight size={16} /></>}</Link><button className="mobile-menu icon-button" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button></div>
  </div></header>
}
