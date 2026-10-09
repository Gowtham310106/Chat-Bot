import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { InstagramIcon } from './Icons'

export default function Footer() {
  const { settings } = useStore()
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">{settings?.storeName}</span>
          <p>{settings?.tagline}</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Shop</h4>
            <Link to="/shop">All shirts</Link>
            <Link to="/shop?category=Essentials">Essentials</Link>
            <Link to="/shop?category=Oversized">Oversized</Link>
          </div>
          <div>
            <h4>Info</h4>
            <Link to="/about">About</Link>
            {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}>Contact</a>}
          </div>
          <div>
            <h4>Follow</h4>
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="inline-icon"><InstagramIcon width={16} height={16} /> Instagram</a>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {settings?.storeName}</span>
        <Link to="/admin">Admin</Link>
      </div>
    </footer>
  )
}
