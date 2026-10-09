// Production server: API + uploaded media + the built storefront (run `pnpm build` first).
import path from 'node:path';
import express from 'express';
import { createApp } from './app.js';

const app = createApp();
const dist = path.resolve(process.cwd(), 'dist');

app.use(express.static(dist, { index: false, maxAge: '1h' }));
app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`[shop] listening on http://localhost:${port}`));
