// Picks Vercel Blob when a Blob token is configured, otherwise local disk.
export const driver = process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'fs';
const store = driver === 'blob' ? await import('./blob.js') : await import('./fs.js');

export const { readCatalog, writeCatalog, listOrders, readOrder, writeOrder, clearOrders } = store;
export const saveUpload = store.saveUpload;
export const UPLOAD_DIR = store.UPLOAD_DIR;
export { Conflict } from './errors.js';
