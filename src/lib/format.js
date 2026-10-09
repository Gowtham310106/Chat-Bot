export const formatMoney = (amount, symbol = '$') =>
  `${symbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

export const formatDate = (iso, opts = { dateStyle: 'medium', timeStyle: 'short' }) =>
  new Date(iso).toLocaleString(undefined, opts)

export const totalStock = (p) => Object.values(p.stock || {}).reduce((a, b) => a + b, 0)

export const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const PAYMENT_LABELS = {
  cod: 'Cash on delivery',
  'bank-transfer': 'Bank transfer',
}
