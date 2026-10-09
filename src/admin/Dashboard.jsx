import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, STATUS_LABELS } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function Dashboard() {
  const { money } = useStore()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api('/admin/summary', { admin: true }).then(setData).catch((e) => setError(e.message)) }, [])

  if (error) return <div className="admin-page"><p className="form-error">{error}</p></div>
  if (!data) return <div className="admin-page"><span className="loader" /></div>

  const max = Math.max(1, ...data.sales.map((d) => d.revenue))
  const last14 = data.sales.reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="admin-page">
      <div className="admin-head"><h1>Dashboard</h1></div>
      <div className="kpis">
        <div className="kpi"><span>Revenue</span><strong>{money(data.revenue)}</strong></div>
        <div className="kpi"><span>Orders</span><strong>{data.orders}</strong></div>
        <div className="kpi"><span>Awaiting action</span><strong>{data.pending}</strong></div>
        <div className="kpi"><span>Units sold</span><strong>{data.unitsSold}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Last 14 days</h2><span className="muted">{money(last14)}</span></div>
        <div className="bars" role="img" aria-label="Daily revenue for the last 14 days">
          {data.sales.map((d) => (
            <div key={d.date} className="bar-col" title={`${d.date}: ${money(d.revenue)} · ${d.orders} orders`}>
              <div className="bar-fill" style={{ height: `${(d.revenue / max) * 100}%` }} />
              <span>{new Date(d.date + 'T00:00').getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-two">
        <div className="panel">
          <div className="panel-head"><h2>Recent orders</h2><Link to="/admin/orders" className="text-link">All orders</Link></div>
          {data.recentOrders.length ? (
            <table className="table">
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`}>{o.id}</Link><div className="muted small">{o.customer.name}</div></td>
                    <td className="muted small">{formatDate(o.createdAt)}</td>
                    <td><span className={`status s-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td className="num">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="muted">No orders yet. They'll appear here as soon as customers check out.</p>}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Low stock</h2><Link to="/admin/products" className="text-link">Products</Link></div>
          {data.lowStock.length ? (
            <ul className="plain-list">
              {data.lowStock.slice(0, 10).map((l) => (
                <li key={l.productId + l.size}>
                  <Link to={`/admin/products/${l.productId}`}>{l.name}</Link>
                  <span className="muted">{l.size}</span>
                  <strong className={l.stock === 0 ? 'warn' : ''}>{l.stock === 0 ? 'Out' : `${l.stock} left`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="muted">All sizes are well stocked.</p>}
        </div>
      </div>
    </div>
  )
}
