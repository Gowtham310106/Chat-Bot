import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import { totalStock } from '../lib/format'
import NotFound from './NotFound'

export default function Product() {
  const { slug } = useParams()
  return <ProductView key={slug} slug={slug} />
}

function ProductView({ slug }) {
  const { products, addToCart, money, settings } = useStore()
  const product = products.find((p) => p.slug === slug)
  const [size, setSize] = useState(null)
  const [active, setActive] = useState(0)
  const [error, setError] = useState('')

  if (!product) return <NotFound />

  const soldOut = totalStock(product) === 0
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).concat(
    products.filter((p) => p.id !== product.id && p.category !== product.category),
  ).slice(0, 4)

  const add = () => {
    if (!size) { setError('Please select a size'); return }
    setError('')
    addToCart(product.id, size, 1)
  }

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/shop">Shop</Link> / <Link to={`/shop?category=${product.category}`}>{product.category}</Link></nav>
      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-main"><img src={product.images[active]} alt={product.name} /></div>
          {product.images.length > 1 && (
            <div className="pdp-thumbs">
              {product.images.map((img, i) => (
                <button key={img + i} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <div className="pdp-price">
            <span>{money(product.price)}</span>
            {product.compareAtPrice && <s className="muted">{money(product.compareAtPrice)}</s>}
          </div>
          {product.color && <p className="muted">Colour — {product.color}</p>}

          <div className="size-picker">
            <div className="size-head"><span>Size</span>{size && <span className="muted">{product.stock[size]} in stock</span>}</div>
            <div className="sizes">
              {product.sizes.map((s) => {
                const out = (product.stock[s] ?? 0) === 0
                return (
                  <button key={s} disabled={out} className={`size ${size === s ? 'is-active' : ''}`} onClick={() => { setSize(s); setError('') }}>
                    {s}
                  </button>
                )
              })}
            </div>
            {error && <p className="warn">{error}</p>}
          </div>

          <button className="btn btn-block btn-lg" onClick={add} disabled={soldOut}>
            {soldOut ? 'Sold out' : 'Add to bag'}
          </button>

          {Number.isFinite(settings.freeShippingThreshold) && settings.freeShippingThreshold > 0 && (
            <p className="muted small center">Free shipping on orders over {money(settings.freeShippingThreshold)}</p>
          )}

          <p className="pdp-desc">{product.description}</p>
          {product.details?.length > 0 && (
            <details className="accordion" open>
              <summary>Details</summary>
              <ul>{product.details.map((d) => <li key={d}>{d}</li>)}</ul>
            </details>
          )}
          <details className="accordion">
            <summary>Shipping & returns</summary>
            <p>Orders ship within 1–3 business days. Unworn items can be returned within 14 days of delivery.</p>
          </details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>You may also like</h2></div>
          <div className="product-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  )
}
