// Vercel Blob storage for production on Vercel.
// Product catalog + settings live in one JSON document (cheap to read, cached at the edge by the API);
// each order is its own document so concurrent checkouts never overwrite each other.
// Data files sit under a secret, unguessable prefix and are always read with useCache: false.
import { BlobNotFoundError, BlobPreconditionFailedError, get, list, put, del } from '@vercel/blob';
import crypto from 'node:crypto';
import { Conflict } from './errors.js';

// Secret folder for data files; derived from the Blob token unless DATA_PREFIX is set. Never change it
// after launch, or the store will start from the demo catalog again.
const PREFIX = (process.env.DATA_PREFIX
  || `store-data-${crypto.createHash('sha256').update(`data:${process.env.BLOB_READ_WRITE_TOKEN}`).digest('hex').slice(0, 24)}`)
  .replace(/\/+$/, '') + '/';
const CATALOG = `${PREFIX}catalog.json`;
const ORDERS = `${PREFIX}orders/`;
const JSON_OPTS = { access: 'public', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };

async function readJson(pathname) {
  try {
    const res = await get(pathname, { access: 'public', useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return { data: JSON.parse(await new Response(res.stream).text()), etag: res.blob.etag };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

export const readCatalog = () => readJson(CATALOG);

export async function writeCatalog(data, etag) {
  try {
    await put(CATALOG, JSON.stringify(data), { ...JSON_OPTS, allowOverwrite: true, ...(etag ? { ifMatch: etag } : {}) });
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError) throw new Conflict();
    throw e;
  }
}

async function listOrderBlobs() {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: ORDERS, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function listOrders() {
  const blobs = await listOrderBlobs();
  const orders = await Promise.all(blobs.map((b) => readJson(b.pathname).then((r) => r?.data)));
  return orders.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const readOrder = async (id) => (await readJson(`${ORDERS}${id}.json`))?.data ?? null;

export async function writeOrder(order) {
  await put(`${ORDERS}${order.id}.json`, JSON.stringify(order), { ...JSON_OPTS, allowOverwrite: true });
}

export async function clearOrders() {
  const blobs = await listOrderBlobs();
  if (blobs.length) await del(blobs.map((b) => b.url));
}
