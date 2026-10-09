import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatMoney } from '../lib/format'

const StoreContext = createContext(null)
const CART_KEY = 'shop.cart'

const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || [] } catch { return [] }
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState({ settings: null, products: [] })
  const [error, setError] = useState(null)
  const [cart, setCart] = useState(readCart)
  const [cartOpen, setCartOpen] = useState(false)

  const refresh = useCallback(() =>
    api('/store').then(setStore).catch((e) => setError(e.message)), [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* storage unavailable */ }
  }, [cart])

  const addToCart = useCallback((productId, size, qty = 1) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === productId && i.size === size)
      if (existing) return c.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i))
      return [...c, { productId, size, qty }]
    })
    setCartOpen(true)
  }, [])

  const updateQty = useCallback((productId, size, qty) => {
    setCart((c) => (qty < 1
      ? c.filter((i) => !(i.productId === productId && i.size === size))
      : c.map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i))))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const value = useMemo(() => {
    const { settings, products } = store
    const lines = cart
      .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
      .filter((l) => l.product)
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0)
    const freeAt = settings?.freeShippingThreshold ?? Infinity
    const shipping = !lines.length || subtotal >= freeAt ? 0 : settings?.shippingFlat ?? 0
    return {
      settings,
      products,
      loading: !settings && !error,
      error,
      refresh,
      money: (n) => formatMoney(n, settings?.currencySymbol),
      cart: { lines, count: lines.reduce((s, l) => s + l.qty, 0), subtotal, shipping, total: subtotal + shipping, freeAt },
      addToCart,
      updateQty,
      clearCart,
      cartOpen,
      setCartOpen,
    }
  }, [store, cart, error, refresh, addToCart, updateQty, clearCart, cartOpen])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext)
