import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, STATUS_LABELS } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function Orders() {
  const { money } = useStore()
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/admin/orders', { admin: true }).then(setOrders).catch((e) => setError(e.message)) }, [])

  const counts = (orders || []).reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {})
  const list = (orders || [])
    .filter((o) => status === 'all' || o.status === status)
    .filter((o) => `${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="admin-page">
      <div className="admin-head"><h1>Orders</h1></div>
      <div className="chips">
        <button className={`chip ${status === 'all' ? 'is-active' : ''}`} onClick={() => setStatus('all')}>All {orders && `(${orders.length})`}</button>
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <button key={k} className={`chip ${status === k ? 'is-active' : ''}`} onClick={() => setStatus(k)}>{label} {counts[k] ? `(${counts[k]})` : ''}</button>
        ))}
      </div>
      <input className="search" type="search" placeholder="Search by order, name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      {!orders ? <span className="loader" /> : (
        <div className="panel flush">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`} className="strong">{o.id}</Link></td>
                  <td className="muted small">{formatDate(o.createdAt)}</td>
                  <td>{o.customer.name}<div className="muted small">{o.customer.email}</div></td>
                  <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td><span className={`status s-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                  <td className="num">{money(o.total)}</td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} className="muted center">{orders.length ? 'No matching orders.' : 'No orders yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
