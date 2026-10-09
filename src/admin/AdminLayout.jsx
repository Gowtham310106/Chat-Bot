import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../lib/api'
import { useStore } from '../context/StoreContext'
import { CloseIcon, MenuIcon } from '../components/Icons'

const NAV = [
  ['/admin', 'Dashboard', true],
  ['/admin/orders', 'Orders'],
  ['/admin/products', 'Products'],
  ['/admin/content', 'Homepage & videos'],
  ['/admin/settings', 'Settings'],
]

export default function AdminLayout() {
  const [authed, setAuthed] = useState(Boolean(getToken()))
  const [open, setOpen] = useState(false)
  const { settings } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('shop:logout', onLogout)
    return () => window.removeEventListener('shop:logout', onLogout)
  }, [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => { document.title = 'Admin' }, [])

  if (!authed) return <Navigate to="/admin/login" replace state={{ from: pathname }} />

  const logout = async () => {
    await api('/admin/logout', { method: 'POST', admin: true }).catch(() => {})
    setToken(null)
    navigate('/admin/login')
  }

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <Link to="/admin">{settings?.storeName || 'Store'}</Link>
          <span>Admin</span>
        </div>
        <nav>
          {NAV.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}
        </nav>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noreferrer">View store ↗</a>
          <button className="link" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <CloseIcon /> : <MenuIcon />}</button>
          <span>{settings?.storeName} Admin</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
