const TOKEN_KEY = 'shop.adminToken'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (token) => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
}

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export async function api(path, { method = 'GET', body, admin = false, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } }
  if (admin) opts.headers.Authorization = `Bearer ${getToken()}`
  if (body instanceof Blob) {
    opts.body = body
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`/api${path}`, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && admin) {
      setToken(null)
      window.dispatchEvent(new Event('shop:logout'))
    }
    throw new ApiError(res.status, data.error || 'Request failed.')
  }
  return data
}

export const uploadFile = (file) =>
  api('/admin/upload', { method: 'POST', body: file, admin: true, headers: { 'Content-Type': file.type } }).then((r) => r.url)
