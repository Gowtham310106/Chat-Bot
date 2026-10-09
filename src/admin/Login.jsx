import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../lib/api'
import './admin.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { state } = useLocation()

  if (getToken()) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { token } = await api('/admin/login', { method: 'POST', body: { username, password } })
      setToken(token)
      navigate(state?.from?.startsWith('/admin') && state.from !== '/admin/login' ? state.from : '/admin', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={submit} className="login-card">
        <h1>Admin</h1>
        <p className="muted">Sign in to manage products, orders and content.</p>
        <label className="field">
          <span>Username</span>
          <input type="text" autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/" className="muted small center">← Back to store</Link>
      </form>
    </div>
  )
}
