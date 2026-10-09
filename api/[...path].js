// Vercel Function entry: every /api/* request is handled by the shared Express app.
import { createApp } from '../server/app.js'

export default createApp()
