import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { totalStock } from '../lib/format'

export default function ProductCard({ product }) {
  const { money } = useStore()
  const soldOut = totalStock(product) === 0
  const [front, back] = product.images
  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className={`product-card-media ${back ? 'has-alt' : ''}`}>
        {front ? <img src={front} alt={product.name} loading="lazy" /> : <div className="img-placeholder" />}
        {back && <img src={back} alt="" loading="lazy" className="alt" />}
        {soldOut ? <span className="tag">Sold out</span> : product.compareAtPrice ? <span className="tag">Sale</span> : null}
      </div>
      <div className="product-card-info">
        <div>
          <h3>{product.name}</h3>
          <span className="muted">{product.color}</span>
        </div>
        <div className="price">
          {product.compareAtPrice && <s className="muted">{money(product.compareAtPrice)}</s>}
          <span>{money(product.price)}</span>
        </div>
      </div>
    </Link>
  )
}
