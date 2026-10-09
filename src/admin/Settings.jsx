import { api } from '../lib/api'
import useSettingsForm from './useSettingsForm'

const TEXT_FIELDS = [
  ['storeName', 'Store name'],
  ['tagline', 'Tagline'],
  ['announcement', 'Announcement bar'],
  ['contactEmail', 'Contact email'],
  ['instagramUrl', 'Instagram URL'],
  ['currency', 'Currency code'],
  ['currencySymbol', 'Currency symbol'],
]

export default function Settings() {
  const { form, update, save, status } = useSettingsForm()
  if (!form) return <div className="admin-page">{status.error ? <p className="form-error">{status.error}</p> : <span className="loader" />}</div>

  const resetDemo = async () => {
    if (!window.confirm('Reset ALL products, orders and settings to the demo data? This cannot be undone.')) return
    await api('/admin/reset', { method: 'POST', admin: true })
    window.location.reload()
  }

  return (
    <form className="admin-page" onSubmit={save}>
      <div className="admin-head">
        <h1>Settings</h1>
        <button className="btn" disabled={status.saving}>{status.saving ? 'Saving…' : status.saved ? 'Saved ✓' : 'Save changes'}</button>
      </div>
      {status.error && <p className="form-error" role="alert">{status.error}</p>}

      <section className="panel">
        <h2>Store</h2>
        <div className="form-grid">
          {TEXT_FIELDS.map(([key, label]) => (
            <label key={key} className="field"><span>{label}</span><input value={form[key] || ''} onChange={(e) => update((f) => { f[key] = e.target.value; return f })} /></label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Shipping</h2>
        <div className="form-grid">
          <label className="field"><span>Flat shipping rate</span><input type="number" min="0" step="0.01" value={form.shippingFlat} onChange={(e) => update((f) => { f.shippingFlat = e.target.value; return f })} /></label>
          <label className="field"><span>Free shipping from</span><input type="number" min="0" step="0.01" value={form.freeShippingThreshold} onChange={(e) => update((f) => { f.freeShippingThreshold = e.target.value; return f })} /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Admin access</h2>
        <p className="muted">The admin username and password are set with the <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> environment variables (Vercel → Project → Settings → Environment Variables). Redeploy after changing them.</p>
      </section>

      <section className="panel danger-zone">
        <h2>Danger zone</h2>
        <p className="muted">Restore the demo catalogue and remove all orders.</p>
        <button type="button" className="btn btn-outline danger" onClick={resetDemo}>Reset demo data</button>
      </section>
    </form>
  )
}
