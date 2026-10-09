// REST API for the storefront and admin panel.
// Runs as a Vercel Function (api/index.js), inside Vite in dev, or standalone via server/index.js.
import crypto from 'node:crypto';
import express from 'express';
import { checkCredentials, issueToken, verifyToken } from './auth.js';
import { seedCatalog, upgradeDefaultCopy } from './seed.js';
import * as db from './storage/index.js';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['cod', 'bank-transfer'];
const UPLOAD_TYPES = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
};
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

// The storefront payload is cached at Vercel's CDN, so most visitors never invoke the function.
const PUBLIC_CACHE = 'public, max-age=0, must-revalidate';
const CDN_CACHE = 'max-age=60, stale-while-revalidate=3600';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const money = (v) => Math.round(num(v) * 100) / 100;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

async function getCatalog() {
  const found = await db.readCatalog();
  if (found) {
    upgradeDefaultCopy(found.data.settings);
    return found;
  }
  const data = seedCatalog();
  try {
    await db.writeCatalog(data, null);
  } catch (e) {
    if (!(e instanceof db.Conflict)) throw e;
  }
  return db.readCatalog();
}

// Read-modify-write on the catalog with optimistic concurrency; retries if another request wrote first.
async function mutateCatalog(fn) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, etag } = await getCatalog();
    const result = await fn(data);
    try {
      await db.writeCatalog(data, etag);
      return result;
    } catch (e) {
      if (!(e instanceof db.Conflict)) throw e;
    }
  }
  throw new HttpError(503, 'The store is busy, please try again.');
}

function requireAdmin(req, res, next) {
  if (!verifyToken((req.get('authorization') || '').replace(/^Bearer /, ''))) throw new HttpError(401, 'Please sign in again.');
  res.set('Cache-Control', 'no-store');
  next();
}

function sanitizeProduct(input, existing = {}) {
  const name = str(input.name, 120);
  if (!name) throw new HttpError(400, 'Product name is required.');
  const price = money(input.price);
  if (price <= 0) throw new HttpError(400, 'Price must be greater than 0.');
  const sizes = Array.isArray(input.sizes) ? input.sizes.map((s) => str(s, 10)).filter(Boolean) : [];
  if (!sizes.length) throw new HttpError(400, 'Add at least one size.');
  const stockIn = input.stock && typeof input.stock === 'object' ? input.stock : {};
  const compareAt = money(input.compareAtPrice);
  return {
    ...existing,
    name,
    slug: slugify(str(input.slug, 120) || name),
    price,
    compareAtPrice: compareAt > price ? compareAt : null,
    color: str(input.color, 40),
    category: str(input.category, 40) || 'Uncategorised',
    description: str(input.description, 2000),
    details: Array.isArray(input.details) ? input.details.map((d) => str(d, 200)).filter(Boolean) : [],
    images: Array.isArray(input.images) ? input.images.map((i) => str(i, 1000)).filter(Boolean) : [],
    sizes,
    stock: Object.fromEntries(sizes.map((s) => [s, Math.max(0, Math.floor(num(stockIn[s])))])),
    featured: Boolean(input.featured),
    active: input.active !== false,
  };
}

function uniqueSlug(products, slug, ignoreId) {
  let candidate = slug;
  for (let n = 2; products.some((p) => p.slug === candidate && p.id !== ignoreId); n++) candidate = `${slug}-${n}`;
  return candidate;
}

function adjustStock(products, items, direction) {
  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    if (p && item.size in p.stock) p.stock[item.size] = Math.max(0, p.stock[item.size] + direction * item.qty);
  }
}

function orderTotals(settings, subtotal) {
  const shipping = subtotal >= num(settings.freeShippingThreshold, Infinity) || subtotal === 0 ? 0 : money(settings.shippingFlat);
  return { subtotal: money(subtotal), shipping, total: money(subtotal + shipping) };
}

export function createApp() {
  const app = express();
  const api = express.Router();

  app.disable('x-powered-by');
  api.use(express.json({ limit: '1mb' }));

  // ---------- Public ----------
  api.get('/store', async (_req, res) => {
    const { data } = await getCatalog();
    res.set({ 'Cache-Control': PUBLIC_CACHE, 'Vercel-CDN-Cache-Control': CDN_CACHE });
    res.json({ settings: data.settings, products: data.products.filter((p) => p.active) });
  });

  api.post('/orders', async (req, res) => {
    const c = req.body?.customer || {};
    const customer = {
      name: str(c.name, 120), email: str(c.email, 200), phone: str(c.phone, 40),
      address: str(c.address, 300), city: str(c.city, 100), postalCode: str(c.postalCode, 20),
      country: str(c.country, 80), notes: str(c.notes, 1000),
    };
    for (const field of ['name', 'email', 'phone', 'address', 'city']) {
      if (!customer[field]) throw new HttpError(400, `Please fill in your ${field}.`);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new HttpError(400, 'Please enter a valid email address.');
    const rawItems = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : [];
    if (!rawItems.length) throw new HttpError(400, 'Your bag is empty.');
    const paymentMethod = PAYMENT_METHODS.includes(req.body?.paymentMethod) ? req.body.paymentMethod : 'cod';

    const order = await mutateCatalog(({ products, settings }) => {
      const items = rawItems.map((raw) => {
        const p = products.find((x) => x.id === raw.productId && x.active);
        const size = str(raw.size, 10);
        const qty = Math.floor(num(raw.qty));
        if (!p) throw new HttpError(400, 'One of the products in your bag is no longer available.');
        if (!p.sizes.includes(size)) throw new HttpError(400, `${p.name} is not available in size ${size}.`);
        if (qty < 1 || qty > 20) throw new HttpError(400, 'Invalid quantity.');
        if ((p.stock[size] ?? 0) < qty) throw new HttpError(409, `Only ${p.stock[size] ?? 0} left of ${p.name} (${size}).`);
        return { productId: p.id, name: p.name, slug: p.slug, image: p.images[0] || '', color: p.color, size, qty, price: p.price };
      });
      adjustStock(products, items, -1);
      return {
        id: newId('EL'),
        createdAt: new Date().toISOString(),
        status: 'pending',
        paymentMethod,
        customer,
        items,
        ...orderTotals(settings, items.reduce((sum, i) => sum + i.price * i.qty, 0)),
        currencySymbol: settings.currencySymbol,
      };
    });
    await db.writeOrder(order);
    res.status(201).json(order);
  });

  api.get('/orders/:id', async (req, res) => {
    const order = /^[A-Z0-9]{6,40}$/.test(req.params.id) ? await db.readOrder(req.params.id) : null;
    if (!order) throw new HttpError(404, 'Order not found.');
    res.set('Cache-Control', 'no-store');
    res.json(order);
  });

  // ---------- Admin ----------
  api.post('/admin/login', async (req, res) => {
    if (!checkCredentials(str(req.body?.username, 100), str(req.body?.password, 200))) {
      await new Promise((r) => setTimeout(r, 400));
      throw new HttpError(401, 'Incorrect username or password.');
    }
    res.json({ token: issueToken(), uploads: db.driver });
  });

  api.use('/admin', requireAdmin);

  api.get('/admin/session', (_req, res) => res.json({ ok: true, uploads: db.driver }));

  api.get('/admin/summary', async (_req, res) => {
    const [{ data }, orders] = await Promise.all([getCatalog(), db.listOrders()]);
    const live = orders.filter((o) => o.status !== 'cancelled');
    const days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const sales = days.map((d) => {
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const dayOrders = live.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
      return { date: d.toISOString().slice(0, 10), revenue: money(dayOrders.reduce((s, o) => s + o.total, 0)), orders: dayOrders.length };
    });
    const lowStock = data.products.flatMap((p) => Object.entries(p.stock)
      .filter(([, n]) => n <= 3)
      .map(([size, n]) => ({ productId: p.id, name: p.name, size, stock: n })));
    res.json({
      revenue: money(live.reduce((s, o) => s + o.total, 0)),
      orders: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      unitsSold: live.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
      products: data.products.length,
      sales,
      lowStock,
      recentOrders: orders.slice(0, 6),
    });
  });

  api.get('/admin/products', async (_req, res) => res.json((await getCatalog()).data.products));

  api.post('/admin/products', async (req, res) => {
    const p = await mutateCatalog(({ products }) => {
      const product = sanitizeProduct(req.body || {});
      product.id = newId('P').toLowerCase();
      product.slug = uniqueSlug(products, product.slug);
      product.createdAt = new Date().toISOString();
      products.unshift(product);
      return product;
    });
    res.status(201).json(p);
  });

  api.put('/admin/products/:id', async (req, res) => {
    const p = await mutateCatalog(({ products }) => {
      const idx = products.findIndex((x) => x.id === req.params.id);
      if (idx < 0) throw new HttpError(404, 'Product not found.');
      const product = sanitizeProduct(req.body || {}, products[idx]);
      product.slug = uniqueSlug(products, product.slug, product.id);
      products[idx] = product;
      return product;
    });
    res.json(p);
  });

  api.delete('/admin/products/:id', async (req, res) => {
    await mutateCatalog((data) => { data.products = data.products.filter((p) => p.id !== req.params.id); });
    res.json({ ok: true });
  });

  api.get('/admin/orders', async (_req, res) => res.json(await db.listOrders()));

  api.patch('/admin/orders/:id', async (req, res) => {
    const order = await db.readOrder(req.params.id);
    if (!order) throw new HttpError(404, 'Order not found.');
    const status = req.body?.status;
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.');
    const direction = status === 'cancelled' && order.status !== 'cancelled' ? 1
      : status !== 'cancelled' && order.status === 'cancelled' ? -1 : 0;
    if (direction) await mutateCatalog(({ products }) => adjustStock(products, order.items, direction));
    order.status = status;
    if (typeof req.body?.internalNote === 'string') order.internalNote = str(req.body.internalNote, 2000);
    order.updatedAt = new Date().toISOString();
    await db.writeOrder(order);
    res.json(order);
  });

  api.get('/admin/settings', async (_req, res) => res.json((await getCatalog()).data.settings));

  api.put('/admin/settings', async (req, res) => {
    const b = req.body || {};
    const pick = (src, keys, max) => Object.fromEntries(keys.filter((k) => k in (src || {})).map((k) => [k, str(src[k], max)]));
    const settings = await mutateCatalog(({ settings: s }) => {
      Object.assign(s, pick(b, ['storeName', 'tagline', 'announcement', 'currency', 'currencySymbol', 'contactEmail', 'instagramUrl'], 300));
      if ('shippingFlat' in b) s.shippingFlat = Math.max(0, money(b.shippingFlat));
      if ('freeShippingThreshold' in b) s.freeShippingThreshold = Math.max(0, money(b.freeShippingThreshold));
      if (b.hero) Object.assign(s.hero, pick(b.hero, ['image', 'eyebrow', 'title', 'subtitle', 'ctaLabel', 'ctaLink'], 1000));
      if (b.videosSection) Object.assign(s.videosSection, pick(b.videosSection, ['title', 'subtitle'], 300));
      if (b.about) Object.assign(s.about, pick(b.about, ['title', 'body'], 3000));
      if (Array.isArray(b.videos)) {
        s.videos = b.videos.slice(0, 6).map((v, i) => ({
          id: str(v.id, 20) || `v${i + 1}`,
          ...pick(v, ['title', 'caption', 'src', 'poster'], 1000),
          type: ['none', 'upload', 'url', 'instagram', 'youtube'].includes(v.type) ? v.type : 'none',
        }));
      }
      return s;
    });
    res.json(settings);
  });

  api.post('/admin/reset', async (_req, res) => {
    const { etag } = await getCatalog();
    await db.writeCatalog(seedCatalog(), etag);
    await db.clearOrders();
    res.json({ ok: true });
  });

  // Direct-to-Blob uploads: the browser sends the file straight to Vercel Blob,
  // so large videos never pass through (or bill) the function.
  api.post('/admin/blob-upload', async (req, res) => {
    if (db.driver !== 'blob') throw new HttpError(400, 'Blob uploads are not configured.');
    const { handleUpload } = await import('@vercel/blob/client');
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^media\/[\w.-]+$/.test(pathname)) throw new HttpError(400, 'Invalid upload path.');
        return {
          allowedContentTypes: Object.keys(UPLOAD_TYPES),
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    res.json(result);
  });

  // Local-disk uploads for development.
  api.post('/admin/upload', express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }), async (req, res) => {
    if (db.driver !== 'fs') throw new HttpError(400, 'Use direct uploads.');
    const ext = UPLOAD_TYPES[(req.get('content-type') || '').split(';')[0]];
    if (!ext) throw new HttpError(415, 'Upload a JPG, PNG, WEBP, AVIF, GIF, MP4, WEBM or MOV file.');
    if (!req.body?.length) throw new HttpError(400, 'The file is empty.');
    const requested = str(req.get('x-filename'), 120);
    const name = /^[\w.-]+$/.test(requested) ? requested : `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    res.status(201).json({ url: await db.saveUpload(name, req.body) });
  });

  api.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));

  // eslint-disable-next-line no-unused-vars
  api.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.set('Cache-Control', 'no-store');
    res.status(status).json({ error: status >= 500 && !err.expose ? 'Something went wrong.' : err.message });
  });

  app.use('/api', api);
  if (db.UPLOAD_DIR) app.use('/uploads', express.static(db.UPLOAD_DIR, { maxAge: '30d', immutable: true }));
  return app;
}
