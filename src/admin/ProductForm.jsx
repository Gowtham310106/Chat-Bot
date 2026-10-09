import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { uploadFile } from '../lib/upload'
import { useStore } from '../context/StoreContext'
import Img from '../components/Img'

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const EMPTY = {
  name: '', slug: '', price: '', compareAtPrice: '', color: 'Black', category: 'Graphic', description: '',
  details: ['220 GSM heavyweight cotton', 'Screen-printed graphic'], images: [],
  sizes: ['S', 'M', 'L', 'XL', 'XXL'], stock: { S: 10, M: 10, L: 10, XL: 10, XXL: 10 }, featured: false, active: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { refresh, products: liveProducts } = useStore()
  const [form, setForm] = useState(isNew ? EMPTY : null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isNew) return
    api('/admin/products', { admin: true })
      .then((list) => {
        const p = list.find((x) => x.id === id)
        if (p) setForm({ ...p, compareAtPrice: p.compareAtPrice ?? '' })
        else setError('Product not found.')
      })
      .catch((e) => setError(e.message))
  }, [id, isNew])

  if (!form) return <div className="admin-page">{error ? <p className="form-error">{error}</p> : <span className="loader" />}</div>

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(false) }
  const categories = [...new Set(['Essentials', 'Graphic', 'Typography', 'Oversized', ...liveProducts.map((p) => p.category)])]

  const toggleSize = (s) => {
    const sizes = form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : DEFAULT_SIZES.filter((x) => x === s || form.sizes.includes(x))
    set({ sizes, stock: { ...form.stock, [s]: form.stock[s] ?? 0 } })
  }

  const addImages = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (const f of files) urls.push(await uploadFile(f))
      set({ images: [...form.images, ...urls] })
    } catch (err) { setError(err.message) } finally { setUploading(false) }
  }

  const moveImage = (i, dir) => {
    const images = [...form.images]
    const j = i + dir
    if (j < 0 || j >= images.length) return
    ;[images[i], images[j]] = [images[j], images[i]]
    set({ images })
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { ...form, details: form.details.filter(Boolean) }
      const saved = isNew
        ? await api('/admin/products', { method: 'POST', body, admin: true })
        : await api(`/admin/products/${id}`, { method: 'PUT', body, admin: true })
      refresh()
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true })
      else { setForm({ ...saved, compareAtPrice: saved.compareAtPrice ?? '' }); setSaved(true) }
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <form className="admin-page" onSubmit={submit}>
      <div className="admin-head">
        <div>
          <Link to="/admin/products" className="muted small">← Products</Link>
          <h1>{isNew ? 'New product' : form.name || 'Edit product'}</h1>
        </div>
        <div className="btn-row">
          {!isNew && form.active && <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline">View</a>}
          <button className="btn" disabled={saving || uploading}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}</button>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="admin-two wide-left">
        <div className="stack">
          <section className="panel">
            <h2>Details</h2>
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => set({ name: e.target.value })} required /></label>
            <label className="field"><span>Description</span><textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></label>
            <label className="field">
              <span>Bullet points <em>(one per line)</em></span>
              <textarea rows={4} value={form.details.join('\n')} onChange={(e) => set({ details: e.target.value.split('\n') })} />
            </label>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Images</h2>
              <label className="btn btn-sm">
                {uploading ? 'Uploading…' : 'Upload images'}
                <input type="file" accept="image/*" multiple hidden onChange={addImages} disabled={uploading} />
              </label>
            </div>
            <p className="muted small">The first image is the main shot; the second shows on hover in the shop.</p>
            <div className="image-grid">
              {form.images.map((img, i) => (
                <div key={img + i} className="image-tile">
                  <Img src={img} sizes="160px" />
                  {i === 0 && <span className="tag">Main</span>}
                  <div className="image-tile-actions">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move left">←</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Move right">→</button>
                    <button type="button" onClick={() => set({ images: form.images.filter((_, k) => k !== i) })} aria-label="Remove">✕</button>
                  </div>
                </div>
              ))}
              {!form.images.length && <p className="muted">No images yet.</p>}
            </div>
          </section>

          <section className="panel">
            <h2>Sizes & stock</h2>
            <div className="chips">
              {DEFAULT_SIZES.map((s) => (
                <button type="button" key={s} className={`chip ${form.sizes.includes(s) ? 'is-active' : ''}`} onClick={() => toggleSize(s)}>{s}</button>
              ))}
            </div>
            <div className="stock-grid">
              {form.sizes.map((s) => (
                <label key={s} className="field">
                  <span>{s}</span>
                  <input type="number" min="0" value={form.stock[s] ?? 0} onChange={(e) => set({ stock: { ...form.stock, [s]: e.target.value } })} />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <h2>Visibility</h2>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Visible in store</label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} /> Featured on homepage</label>
          </section>
          <section className="panel">
            <h2>Pricing</h2>
            <label className="field"><span>Price</span><input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} required /></label>
            <label className="field"><span>Compare-at price <em>(shows as sale)</em></span><input type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} /></label>
          </section>
          <section className="panel">
            <h2>Organisation</h2>
            <label className="field">
              <span>Category</span>
              <input list="categories" value={form.category} onChange={(e) => set({ category: e.target.value })} />
              <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="field"><span>Colour</span><input value={form.color} onChange={(e) => set({ color: e.target.value })} /></label>
            <label className="field"><span>URL handle</span><input value={form.slug} placeholder="auto from name" onChange={(e) => set({ slug: e.target.value })} /></label>
          </section>
        </div>
      </div>
    </form>
  )
}
