// Stateless admin sessions: an HMAC-signed token, so any serverless instance can verify it.
import crypto from 'node:crypto';

const ON_VERCEL = Boolean(process.env.VERCEL);
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || (ON_VERCEL ? '' : 'admin123');
// Without AUTH_SECRET, derive a stable key from the Blob token + password (so every serverless
// instance agrees, and changing the password signs everyone out).
const SECRET = process.env.AUTH_SECRET
  || (process.env.BLOB_READ_WRITE_TOKEN && PASSWORD
    ? crypto.createHash('sha256').update(`session:${process.env.BLOB_READ_WRITE_TOKEN}:${PASSWORD}`).digest('hex')
    : crypto.randomBytes(32).toString('hex'));
const TTL_MS = 12 * 60 * 60 * 1000;

if (!process.env.ADMIN_PASSWORD) {
  console.warn(ON_VERCEL
    ? '[shop] ADMIN_PASSWORD is not set — admin login is disabled until it is.'
    : '[shop] ADMIN_PASSWORD not set — using demo login admin / admin123.');
}

const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function checkCredentials(username, password) {
  if (!PASSWORD) return false;
  // Evaluate both so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(username.toLowerCase(), USERNAME.toLowerCase());
  const passOk = safeEqual(password, PASSWORD);
  return userOk && passOk;
}

export function issueToken() {
  const payload = Buffer.from(JSON.stringify({ sub: USERNAME, exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}
