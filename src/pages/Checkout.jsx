import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { PAYMENT_LABELS } from '../lib/format'
import Img from '../components/Img'

const FIELDS = [
  ['name', 'Full name', 'text', 'name', true],
  ['email', 'Email', 'email', 'email', true],
  ['phone', 'Phone', 'tel', 'tel', true],
  ['address', 'Address', 'text', 'street-address', true],
  ['city', 'City', 'text', 'address-level2', true],
  ['postalCode', 'Postal code', 'text', 'postal-code', false],
  ['country', 'Country', 'text', 'country-name', false],
]

export default function Checkout() {
  const { cart, money, clearCart, refresh } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ notes: '' })
  const [payment, setPayment] = useState('cod')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!cart.lines.length) {
    return (
      <div className="container narrow center empty-state">
        <h1>Your bag is empty</h1>
        <Link to="/shop" className="btn">Continue shopping</Link>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          customer: form,
          paymentMethod: payment,
          items: cart.lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
        },
      })
      clearCart()
      refresh()
      navigate(`/order/${order.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container checkout">
      <form className="checkout-form" onSubmit={submit}>
        <h1>Checkout</h1>
        <fieldset>
          <legend>Contact & delivery</legend>
          <div className="form-grid">
            {FIELDS.map(([key, label, type, auto, required]) => (
              <label key={key} className={`field ${key === 'address' ? 'span-2' : ''}`}>
                <span>{label}{!required && <em> (optional)</em>}</span>
                <input type={type} autoComplete={auto} required={required} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </label>
            ))}
            <label className="field span-2">
              <span>Order notes <em>(optional)</em></span>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Payment</legend>
          <div className="radio-cards">
            {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
              <label key={key} className={`radio-card ${payment === key ? 'is-active' : ''}`}>
                <input type="radio" name="payment" value={key} checked={payment === key} onChange={() => setPayment(key)} />
                <span>
                  <strong>{label}</strong>
                  <small className="muted">{key === 'cod' ? 'Pay when your order arrives.' : 'We email bank details after you order.'}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-block btn-lg" disabled={submitting}>{submitting ? 'Placing order…' : `Place order — ${money(cart.total)}`}</button>
      </form>

      <aside className="summary">
        <h2>Order summary</h2>
        {cart.lines.map(({ product, size, qty }) => (
          <div className="summary-line" key={`${product.id}-${size}`}>
            <div className="summary-img"><Img src={product.images[0]} sizes="64px" /><span>{qty}</span></div>
            <div><strong>{product.name}</strong><p className="muted small">{product.color} / {size}</p></div>
            <span>{money(product.price * qty)}</span>
          </div>
        ))}
        <div className="summary-totals">
          <div className="row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
          <div className="row"><span>Shipping</span><span>{cart.shipping ? money(cart.shipping) : 'Free'}</span></div>
          <div className="row total"><span>Total</span><span>{money(cart.total)}</span></div>
        </div>
      </aside>
    </div>
  )
}
