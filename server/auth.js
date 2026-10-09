// Stateless admin sessions: an HMAC-signed token, so any serverless instance can verify it.
import crypto from 'node:crypto';

const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const TTL_MS = 12 * 60 * 60 * 1000;

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[shop] ADMIN_PASSWORD not set — using demo login admin / admin123. Set it before going live.');
}

const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function checkCredentials(username, password) {
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
