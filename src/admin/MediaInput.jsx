import { useRef, useState } from 'react'
import { uploadFile } from '../lib/api'

// Upload a file or paste a URL; shows a preview of the current value.
export default function MediaInput({ label, value, onChange, accept = 'image/*', kind = 'image', hint }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try { onChange(await uploadFile(file)) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="media-input">
      {label && <span className="field-label">{label}</span>}
      <div className="media-input-row">
        <div className={`media-preview ${kind}`}>
          {value ? (kind === 'video' ? <video src={value} muted playsInline preload="metadata" /> : <img src={value} alt="" />) : <span className="muted small">None</span>}
        </div>
        <div className="media-input-controls">
          <input type="text" placeholder="/uploads/… or https://…" value={value || ''} onChange={(e) => onChange(e.target.value)} />
          <div className="btn-row">
            <button type="button" className="btn btn-sm" onClick={() => input.current.click()} disabled={busy}>{busy ? 'Uploading…' : 'Upload file'}</button>
            {value && <button type="button" className="btn btn-sm btn-outline" onClick={() => onChange('')}>Clear</button>}
          </div>
          {hint && <small className="muted">{hint}</small>}
          {error && <small className="warn">{error}</small>}
        </div>
      </div>
      <input ref={input} type="file" accept={accept} hidden onChange={pick} />
    </div>
  )
}
