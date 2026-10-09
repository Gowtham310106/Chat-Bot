// Picks Vercel Blob when a Blob token is configured, otherwise local disk.
export const driver = process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : process.env.VERCEL ? 'missing' : 'fs';

// On Vercel the filesystem is read-only and per-instance, so a Blob store is required.
const missing = () => {
  const err = new Error('Storage is not set up: connect a Vercel Blob store to this project and redeploy.');
  err.status = 503;
  err.expose = true;
  throw err;
};
const store = driver === 'blob' ? await import('./blob.js')
  : driver === 'fs' ? await import('./fs.js')
  : { readCatalog: missing, writeCatalog: missing, listOrders: missing, readOrder: missing, writeOrder: missing, clearOrders: missing };

export const { readCatalog, writeCatalog, listOrders, readOrder, writeOrder, clearOrders } = store;
export const saveUpload = store.saveUpload;
export const UPLOAD_DIR = store.UPLOAD_DIR;
export { Conflict } from './errors.js';
