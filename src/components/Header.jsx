import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { BagIcon, CloseIcon, MenuIcon } from './Icons'

export default function Header() {
  const { settings, cart, setCartOpen } = useStore()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const overHero = pathname === '/' && !scrolled && !menuOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <header className={`site-header ${overHero ? 'is-transparent' : ''}`}>
      {settings?.announcement && <div className="announcement">{settings.announcement}</div>}
      <div className="header-bar">
        <nav className="header-nav" aria-label="Main">
          <button className="icon-btn only-mobile" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <Link to="/shop">Shop all</Link>
            <Link to="/shop?category=Typography">Typography</Link>
            <Link to="/shop?category=Graphic">Graphic</Link>
            <Link to="/about">About</Link>
          </div>
        </nav>
        <Link to="/" className="logo">{settings?.storeName || 'STORE'}</Link>
        <div className="header-actions">
          <button className="bag-btn" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${cart.count} items`}>
            <BagIcon />
            <span className="bag-label">Bag</span>
            <span className="bag-count">{cart.count}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
