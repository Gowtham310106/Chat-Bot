import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { CloseIcon, MinusIcon, PlusIcon } from './Icons'
import Img from './Img'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, money } = useStore()
  const navigate = useNavigate()
  const remaining = cart.freeAt - cart.subtotal

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [cartOpen, setCartOpen])

  return (
    <div className={`drawer-root ${cartOpen ? 'is-open' : ''}`} aria-hidden={!cartOpen}>
      <div className="drawer-scrim" onClick={() => setCartOpen(false)} />
      <aside className="drawer" role="dialog" aria-label="Shopping bag">
        <div className="drawer-head">
          <h2>Bag ({cart.count})</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag"><CloseIcon /></button>
        </div>

        {cart.lines.length > 0 && Number.isFinite(cart.freeAt) && (
          <div className="ship-progress">
            <p>{remaining > 0 ? <>You're {money(remaining)} away from free shipping</> : <>You've unlocked free shipping</>}</p>
            <div className="bar"><span style={{ width: `${Math.min(100, (cart.subtotal / cart.freeAt) * 100)}%` }} /></div>
          </div>
        )}

        <div className="drawer-body">
          {cart.lines.length === 0 ? (
            <div className="empty">
              <p>Your bag is empty.</p>
              <Link to="/shop" className="btn" onClick={() => setCartOpen(false)}>Shop shirts</Link>
            </div>
          ) : cart.lines.map(({ product, size, qty }) => {
            const max = product.stock[size] ?? 0
            return (
              <div className="line" key={`${product.id}-${size}`}>
                <Link to={`/product/${product.slug}`} onClick={() => setCartOpen(false)} className="line-img">
                  <Img src={product.images[0]} alt={product.name} sizes="88px" />
                </Link>
                <div className="line-info">
                  <div className="line-top">
                    <h3>{product.name}</h3>
                    <span>{money(product.price * qty)}</span>
                  </div>
                  <p className="muted">{product.color} / {size}</p>
                  {qty > max && <p className="warn">Only {max} left in stock</p>}
                  <div className="line-bottom">
                    <div className="qty">
                      <button onClick={() => updateQty(product.id, size, qty - 1)} aria-label="Decrease quantity"><MinusIcon width={14} /></button>
                      <span>{qty}</span>
                      <button onClick={() => updateQty(product.id, size, qty + 1)} disabled={qty >= max} aria-label="Increase quantity"><PlusIcon width={14} /></button>
                    </div>
                    <button className="link" onClick={() => updateQty(product.id, size, 0)}>Remove</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {cart.lines.length > 0 && (
          <div className="drawer-foot">
            <div className="row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
            <p className="muted small">Shipping calculated at checkout.</p>
            <button className="btn btn-block" onClick={() => { setCartOpen(false); navigate('/checkout') }}>Checkout</button>
          </div>
        )}
      </aside>
    </div>
  )
}
