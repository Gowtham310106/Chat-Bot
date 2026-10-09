import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container narrow center empty-state">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <Link to="/shop" className="btn">Go to shop</Link>
    </div>
  )
}
