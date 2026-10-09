import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'

const SORTS = {
  featured: { label: 'Featured', fn: (a, b) => Number(b.featured) - Number(a.featured) },
  newest: { label: 'Newest', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
}

export default function Shop() {
  const { products } = useStore()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'All'
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'featured'

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products])
  const list = useMemo(() => products
    .filter((p) => category === 'All' || p.category === category)
    .sort(SORTS[sort].fn), [products, category, sort])

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'All' || value === 'featured') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>{category === 'All' ? 'Shop all' : category}</h1>
        <span className="muted">{list.length} {list.length === 1 ? 'shirt' : 'shirts'}</span>
      </div>
      <div className="toolbar">
        <div className="chips" role="tablist">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={c === category} className={`chip ${c === category ? 'is-active' : ''}`} onClick={() => set('category', c)}>{c}</button>
          ))}
        </div>
        <label className="sort">
          <span className="muted">Sort</span>
          <select value={sort} onChange={(e) => set('sort', e.target.value)}>
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
      </div>
      {list.length ? (
        <div className="product-grid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <p className="empty-state">No shirts in this category yet.</p>
      )}
    </div>
  )
}
