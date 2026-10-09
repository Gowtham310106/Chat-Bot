import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mount the Express API inside the Vite dev server so `pnpm dev` runs the whole shop.
const api = () => ({
  name: 'shop-api',
  async configureServer(server) {
    const { createApp } = await import('./server/app.js')
    const app = createApp()
    server.middlewares.use((req, res, next) =>
      req.url.startsWith('/api/') || req.url.startsWith('/uploads/') ? app(req, res, next) : next(),
    )
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), api()],
})
