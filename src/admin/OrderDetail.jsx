import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, formatMoney, PAYMENT_LABELS, STATUS_LABELS } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function OrderDetail() {
  const { id } = useParams()
  const { refresh } = useStore()
  const [order, setOrder] = useState(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/admin/orders', { admin: true })
      .then((list) => {
        const o = list.find((x) => x.id === id)
        if (!o) throw new Error('Order not found.')
        setOrder(o)
        setNote(o.internalNote || '')
      })
      .catch((e) => setError(e.message))
  }, [id])

  if (!order) return <div className="admin-page">{error ? <p className="form-error">{error}</p> : <span className="loader" />}</div>

  const money = (n) => formatMoney(n, order.currencySymbol)
  const update = async (patch) => {
    setBusy(true)
    setError('')
    try {
      setOrder(await api(`/admin/orders/${order.id}`, { method: 'PATCH', admin: true, body: { status: order.status, ...patch } }))
      refresh()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const c = order.customer

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <Link to="/admin/orders" className="muted small">← Orders</Link>
          <h1>Order {order.id}</h1>
          <p className="muted small">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`status s-${order.status}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-two wide-left">
        <div className="stack">
          <section className="panel">
            <h2>Items</h2>
            {order.items.map((i) => (
              <div className="summary-line" key={`${i.productId}-${i.size}`}>
                <div className="summary-img"><img src={i.image} alt="" /><span>{i.qty}</span></div>
                <div><strong>{i.name}</strong><p className="muted small">{i.color} / {i.size} · {money(i.price)} each</p></div>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="summary-totals">
              <div className="row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              <div className="row"><span>Shipping</span><span>{order.shipping ? money(order.shipping) : 'Free'}</span></div>
              <div className="row total"><span>Total</span><span>{money(order.total)}</span></div>
            </div>
            <p className="muted small">Payment: {PAYMENT_LABELS[order.paymentMethod]}</p>
          </section>
          <section className="panel">
            <h2>Internal note</h2>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only visible to admins" />
            <div className="btn-row"><button className="btn btn-sm" disabled={busy || note === (order.internalNote || '')} onClick={() => update({ internalNote: note })}>Save note</button></div>
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <h2>Status</h2>
            <div className="status-steps">
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <button key={k} disabled={busy} className={`chip ${order.status === k ? 'is-active' : ''}`} onClick={() => update({ status: k })}>{label}</button>
              ))}
            </div>
            <p className="muted small">Cancelling an order returns its items to stock.</p>
          </section>
          <section className="panel">
            <h2>Customer</h2>
            <p><strong>{c.name}</strong></p>
            <p><a href={`mailto:${c.email}`}>{c.email}</a><br /><a href={`tel:${c.phone}`}>{c.phone}</a></p>
            <h3 className="field-label">Shipping address</h3>
            <p>{c.address}<br />{c.city} {c.postalCode}<br />{c.country}</p>
            {c.notes && (<><h3 className="field-label">Customer note</h3><p>{c.notes}</p></>)}
          </section>
        </div>
      </div>
    </div>
  )
}
