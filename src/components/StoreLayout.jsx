import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import CartDrawer from './CartDrawer'
import Footer from './Footer'
import Header from './Header'

export default function StoreLayout() {
  const { loading, error, settings } = useStore()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { if (settings?.storeName) document.title = `${settings.storeName} — ${settings.tagline}` }, [settings])

  if (error) return <div className="fullscreen-msg"><p>We couldn't load the store. Please refresh.</p></div>
  if (loading) return <div className="fullscreen-msg"><span className="loader" /></div>

  return (
    <>
      <Header />
      <main className={pathname === '/' ? '' : 'page'}><Outlet /></main>
      <Footer />
      <CartDrawer />
    </>
  )
}
