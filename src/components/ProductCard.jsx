import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { totalStock } from '../lib/format'
import Img from './Img'

const SIZES = '(max-width: 860px) 50vw, (max-width: 1100px) 33vw, 25vw'

export default function ProductCard({ product }) {
  const { money } = useStore()
  const soldOut = totalStock(product) === 0
  const [front, back] = product.images
  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className={`product-card-media ${back ? 'has-alt' : ''}`}>
        {front ? <Img src={front} alt={product.name} sizes={SIZES} /> : <div className="img-placeholder" />}
        {back && <Img src={back} sizes={SIZES} className="alt" />}
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
