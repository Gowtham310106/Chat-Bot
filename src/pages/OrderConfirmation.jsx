import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, PAYMENT_LABELS, STATUS_LABELS } from '../lib/format'
import Img from '../components/Img'

export default function OrderConfirmation() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message)) }, [id])

  if (error) return <div className="container narrow center empty-state"><h1>Order not found</h1><Link to="/" className="btn">Back home</Link></div>
  if (!order) return <div className="fullscreen-msg"><span className="loader" /></div>

  const money = (n) => formatMoney(n, order.currencySymbol)
  return (
    <div className="container narrow confirmation">
      <p className="eyebrow">Order {order.id}</p>
      <h1>Thank you, {order.customer.name.split(' ')[0]}.</h1>
      <p className="lead">Your order is in. We'll send updates to <strong>{order.customer.email}</strong>.</p>
      <div className="confirm-grid">
        <div><h4>Status</h4><p>{STATUS_LABELS[order.status]}</p></div>
        <div><h4>Payment</h4><p>{PAYMENT_LABELS[order.paymentMethod]}</p></div>
        <div><h4>Ship to</h4><p>{order.customer.address}<br />{order.customer.city} {order.customer.postalCode}</p></div>
      </div>
      <div className="summary">
        {order.items.map((i) => (
          <div className="summary-line" key={`${i.productId}-${i.size}`}>
            <div className="summary-img"><Img src={i.image} sizes="64px" /><span>{i.qty}</span></div>
            <div><strong>{i.name}</strong><p className="muted small">{i.color} / {i.size}</p></div>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="summary-totals">
          <div className="row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          <div className="row"><span>Shipping</span><span>{order.shipping ? money(order.shipping) : 'Free'}</span></div>
          <div className="row total"><span>Total</span><span>{money(order.total)}</span></div>
        </div>
      </div>
      <Link to="/shop" className="btn">Continue shopping</Link>
    </div>
  )
}
