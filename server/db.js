// Tiny JSON-file database. Fine for a small shop; swap for a real database when traffic grows.
import fs from 'node:fs';
import path from 'node:path';
import { seedDb } from './seed.js';

export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let cache = null;

export function load() {
  if (cache) return cache;
  if (fs.existsSync(DB_FILE)) {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } else {
    cache = seedDb();
    save();
  }
  return cache;
}

export function save() {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export function reset() {
  cache = seedDb();
  save();
  return cache;
}
