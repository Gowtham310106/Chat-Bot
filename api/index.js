// Vercel Function entry: vercel.json rewrites every /api/* request here; the original path is kept,
// so the shared Express app routes it as usual.
import { createApp } from '../server/app.js'

export default createApp()
