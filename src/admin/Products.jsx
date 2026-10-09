import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { totalStock } from '../lib/format'
import { useStore } from '../context/StoreContext'
import Img from '../components/Img'

export default function Products() {
  const { money, refresh } = useStore()
  const [products, setProducts] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/admin/products', { admin: true }).then(setProducts).catch((e) => setError(e.message)) }, [])

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can't be undone.`)) return
    await api(`/admin/products/${p.id}`, { method: 'DELETE', admin: true })
    setProducts((list) => list.filter((x) => x.id !== p.id))
    refresh()
  }

  const list = (products || []).filter((p) => `${p.name} ${p.category} ${p.color}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn">Add product</Link>
      </div>
      <input className="search" type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      {!products ? <span className="loader" /> : (
        <div className="panel flush">
          <table className="table products-table">
            <thead><tr><th></th><th>Product</th><th>Category</th><th>Stock</th><th className="num">Price</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => {
                const stock = totalStock(p)
                return (
                  <tr key={p.id}>
                    <td className="thumb-cell">{p.images[0] ? <Img src={p.images[0]} sizes="48px" /> : <div className="img-placeholder" />}</td>
                    <td><Link to={`/admin/products/${p.id}`} className="strong">{p.name}</Link><div className="muted small">{p.color}{p.featured && ' · Featured'}</div></td>
                    <td>{p.category}</td>
                    <td className={stock === 0 ? 'warn' : ''}>{stock === 0 ? 'Sold out' : stock}</td>
                    <td className="num">{money(p.price)}</td>
                    <td><span className={`status ${p.active ? 's-delivered' : 's-cancelled'}`}>{p.active ? 'Active' : 'Hidden'}</span></td>
                    <td className="actions">
                      <Link to={`/admin/products/${p.id}`} className="link">Edit</Link>
                      <button className="link danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
              {!list.length && <tr><td colSpan={7} className="muted center">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
