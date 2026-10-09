// Local-disk storage for development (and any host with a persistent disk).
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Conflict } from './errors.js';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CATALOG = path.join(DATA_DIR, 'catalog.json');
const ORDERS = path.join(DATA_DIR, 'orders');

await fs.mkdir(UPLOAD_DIR, { recursive: true });
await fs.mkdir(ORDERS, { recursive: true });

const etagOf = (text) => crypto.createHash('sha1').update(text).digest('hex');

async function writeJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export async function readCatalog() {
  try {
    const text = await fs.readFile(CATALOG, 'utf8');
    return { data: JSON.parse(text), etag: etagOf(text) };
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function writeCatalog(data, etag) {
  if (etag !== undefined) {
    const current = await readCatalog();
    if ((current?.etag ?? null) !== etag) throw new Conflict();
  }
  await writeJson(CATALOG, data);
}

export async function listOrders() {
  const files = (await fs.readdir(ORDERS)).filter((f) => f.endsWith('.json'));
  const orders = await Promise.all(files.map(async (f) => JSON.parse(await fs.readFile(path.join(ORDERS, f), 'utf8'))));
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readOrder(id) {
  try {
    return JSON.parse(await fs.readFile(path.join(ORDERS, `${id}.json`), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export const writeOrder = (order) => writeJson(path.join(ORDERS, `${order.id}.json`), order);

export async function clearOrders() {
  await fs.rm(ORDERS, { recursive: true, force: true });
  await fs.mkdir(ORDERS, { recursive: true });
}

export async function saveUpload(name, buffer) {
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}
