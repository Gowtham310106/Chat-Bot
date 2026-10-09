// REST API for the storefront and admin panel. Mounted into Vite in dev and served by index.js in production.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { load, save, reset, UPLOAD_DIR } from './db.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['cod', 'bank-transfer'];
const UPLOAD_TYPES = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
};

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[shop] ADMIN_PASSWORD not set — using the demo password "admin123". Set it before going live.');
}

const sessions = new Map();

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const money = (v) => Math.round(num(v) * 100) / 100;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

function requireAdmin(req, _res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer /, '');
  const expires = sessions.get(token);
  if (!token || !expires || expires < Date.now()) {
    sessions.delete(token);
    throw new HttpError(401, 'Please sign in again.');
  }
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

function uniqueSlug(db, slug, ignoreId) {
  let candidate = slug;
  for (let n = 2; db.products.some((p) => p.slug === candidate && p.id !== ignoreId); n++) candidate = `${slug}-${n}`;
  return candidate;
}

function adjustStock(db, items, direction) {
  for (const item of items) {
    const p = db.products.find((x) => x.id === item.productId);
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

  api.use(express.json({ limit: '1mb' }));

  // ---------- Public ----------
  api.get('/store', (_req, res) => {
    const db = load();
    res.json({ settings: db.settings, products: db.products.filter((p) => p.active) });
  });

  api.post('/orders', (req, res) => {
    const db = load();
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

    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rawItems.length) throw new HttpError(400, 'Your bag is empty.');
    const items = rawItems.map((raw) => {
      const p = db.products.find((x) => x.id === raw.productId && x.active);
      const size = str(raw.size, 10);
      const qty = Math.floor(num(raw.qty));
      if (!p) throw new HttpError(400, 'One of the products in your bag is no longer available.');
      if (!p.sizes.includes(size)) throw new HttpError(400, `${p.name} is not available in size ${size}.`);
      if (qty < 1 || qty > 20) throw new HttpError(400, 'Invalid quantity.');
      if ((p.stock[size] ?? 0) < qty) throw new HttpError(409, `Only ${p.stock[size] ?? 0} left of ${p.name} (${size}).`);
      return { productId: p.id, name: p.name, slug: p.slug, image: p.images[0] || '', color: p.color, size, qty, price: p.price };
    });

    const paymentMethod = PAYMENT_METHODS.includes(req.body?.paymentMethod) ? req.body.paymentMethod : 'cod';
    const order = {
      id: newId('EL'),
      createdAt: new Date().toISOString(),
      status: 'pending',
      paymentMethod,
      customer,
      items,
      ...orderTotals(db.settings, items.reduce((sum, i) => sum + i.price * i.qty, 0)),
      currencySymbol: db.settings.currencySymbol,
    };
    adjustStock(db, items, -1);
    db.orders.unshift(order);
    save();
    res.status(201).json(order);
  });

  api.get('/orders/:id', (req, res) => {
    const order = load().orders.find((o) => o.id === req.params.id);
    if (!order) throw new HttpError(404, 'Order not found.');
    res.json(order);
  });

  // ---------- Admin ----------
  api.post('/admin/login', (req, res) => {
    const given = Buffer.from(str(req.body?.password, 200));
    const expected = Buffer.from(ADMIN_PASSWORD);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      throw new HttpError(401, 'Incorrect password.');
    }
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    res.json({ token });
  });

  api.use('/admin', requireAdmin);

  api.post('/admin/logout', (req, res) => {
    sessions.delete((req.get('authorization') || '').replace(/^Bearer /, ''));
    res.json({ ok: true });
  });

  api.get('/admin/summary', (_req, res) => {
    const db = load();
    const live = db.orders.filter((o) => o.status !== 'cancelled');
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
    const lowStock = db.products.flatMap((p) => Object.entries(p.stock)
      .filter(([, n]) => n <= 3)
      .map(([size, n]) => ({ productId: p.id, name: p.name, size, stock: n })));
    res.json({
      revenue: money(live.reduce((s, o) => s + o.total, 0)),
      orders: db.orders.length,
      pending: db.orders.filter((o) => o.status === 'pending').length,
      unitsSold: live.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
      products: db.products.length,
      sales,
      lowStock,
      recentOrders: db.orders.slice(0, 6),
    });
  });

  api.get('/admin/products', (_req, res) => res.json(load().products));

  api.post('/admin/products', (req, res) => {
    const db = load();
    const p = sanitizeProduct(req.body || {});
    p.id = newId('P').toLowerCase();
    p.slug = uniqueSlug(db, p.slug);
    p.createdAt = new Date().toISOString();
    db.products.unshift(p);
    save();
    res.status(201).json(p);
  });

  api.put('/admin/products/:id', (req, res) => {
    const db = load();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx < 0) throw new HttpError(404, 'Product not found.');
    const p = sanitizeProduct(req.body || {}, db.products[idx]);
    p.slug = uniqueSlug(db, p.slug, p.id);
    db.products[idx] = p;
    save();
    res.json(p);
  });

  api.delete('/admin/products/:id', (req, res) => {
    const db = load();
    db.products = db.products.filter((p) => p.id !== req.params.id);
    save();
    res.json({ ok: true });
  });

  api.get('/admin/orders', (_req, res) => res.json(load().orders));

  api.patch('/admin/orders/:id', (req, res) => {
    const db = load();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) throw new HttpError(404, 'Order not found.');
    const status = req.body?.status;
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.');
    if (status === 'cancelled' && order.status !== 'cancelled') adjustStock(db, order.items, +1);
    if (status !== 'cancelled' && order.status === 'cancelled') adjustStock(db, order.items, -1);
    order.status = status;
    if (typeof req.body?.internalNote === 'string') order.internalNote = str(req.body.internalNote, 2000);
    order.updatedAt = new Date().toISOString();
    save();
    res.json(order);
  });

  api.get('/admin/settings', (_req, res) => res.json(load().settings));

  api.put('/admin/settings', (req, res) => {
    const db = load();
    const b = req.body || {};
    const s = db.settings;
    const pick = (src, keys, max) => Object.fromEntries(keys.filter((k) => k in (src || {})).map((k) => [k, str(src[k], max)]));
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
    save();
    res.json(s);
  });

  api.post('/admin/reset', (_req, res) => res.json(reset()));

  api.post('/admin/upload', express.raw({ type: () => true, limit: '250mb' }), (req, res) => {
    const ext = UPLOAD_TYPES[(req.get('content-type') || '').split(';')[0]];
    if (!ext) throw new HttpError(415, 'Upload a JPG, PNG, WEBP, GIF, MP4, WEBM or MOV file.');
    if (!req.body?.length) throw new HttpError(400, 'The file is empty.');
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
    res.status(201).json({ url: `/uploads/${name}` });
  });

  api.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));

  // eslint-disable-next-line no-unused-vars
  api.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Something went wrong.' : err.message });
  });

  app.use('/api', api);
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
  return app;
}
