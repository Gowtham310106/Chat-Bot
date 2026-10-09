import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useStore } from '../context/StoreContext'

// Loads store settings for editing and saves them back, refreshing the storefront.
export default function useSettingsForm() {
  const { refresh } = useStore()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState({ saving: false, saved: false, error: '' })

  useEffect(() => {
    api('/admin/settings', { admin: true }).then(setForm).catch((e) => setStatus((s) => ({ ...s, error: e.message })))
  }, [])

  const update = (fn) => { setForm((f) => fn(structuredClone(f)) ?? f); setStatus((s) => ({ ...s, saved: false })) }

  const save = async (e) => {
    e?.preventDefault()
    setStatus({ saving: true, saved: false, error: '' })
    try {
      setForm(await api('/admin/settings', { method: 'PUT', admin: true, body: form }))
      refresh()
      setStatus({ saving: false, saved: true, error: '' })
    } catch (err) {
      setStatus({ saving: false, saved: false, error: err.message })
    }
  }

  return { form, update, save, status }
}
