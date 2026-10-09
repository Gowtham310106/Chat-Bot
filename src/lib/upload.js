import { api, getToken } from './api'

const MAIN_WIDTH = 2000
const SMALL_WIDTH = 800
export const MAX_VIDEO_MB = 80

const randomId = () => 'img' + [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('')

let modePromise
const uploadMode = () => (modePromise ||= api('/admin/session', { admin: true }).then((r) => r.uploads).catch((e) => { modePromise = null; throw e }))

// Resize + re-encode in the browser so the server never spends CPU on images
// and visitors download far fewer bytes.
async function toWebp(file, maxWidth) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8))
  if (!blob || blob.type !== 'image/webp') throw new Error('This browser cannot compress images. Try Chrome, Edge or Firefox.')
  return blob
}

async function send(name, blob) {
  if ((await uploadMode()) === 'blob') {
    const { upload } = await import('@vercel/blob/client')
    const result = await upload(`media/${name}`, blob, {
      access: 'public',
      contentType: blob.type,
      handleUploadUrl: '/api/admin/blob-upload',
      headers: { Authorization: `Bearer ${getToken()}` },
      multipart: blob.size > 8 * 1024 * 1024,
    })
    return result.url
  }
  return api('/admin/upload', { method: 'POST', body: blob, admin: true, headers: { 'Content-Type': blob.type, 'X-Filename': name } }).then((r) => r.url)
}

export async function uploadFile(file) {
  if (file.type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`Videos must be under ${MAX_VIDEO_MB} MB. Export at 720p or compress it first.`)
    const ext = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[file.type] || 'mp4'
    return send(`${randomId().replace('img', 'vid')}.${ext}`, file)
  }
  if (file.type === 'image/gif') return send(`${randomId()}.gif`, file)
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image or video file.')

  const id = randomId()
  const [main, small] = await Promise.all([toWebp(file, MAIN_WIDTH), toWebp(file, SMALL_WIDTH)])
  const [url] = await Promise.all([send(`${id}.webp`, main), send(`${id}-800.webp`, small)])
  return url
}
