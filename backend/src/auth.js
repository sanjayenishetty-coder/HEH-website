// Admin session: an HMAC-signed cookie, no server-side session store needed.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { adminUser, adminPasswordHash, sessionSecret } = require('./config');

const COOKIE = 'heh_admin';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const sign = (data) => crypto.createHmac('sha256', sessionSecret).update(data).digest('base64url');

function issue(res, req) {
  const payload = Buffer.from(JSON.stringify({ u: adminUser, exp: Date.now() + MAX_AGE_MS })).toString('base64url');
  res.cookie(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure,
    maxAge: MAX_AGE_MS,
    path: '/api/admin',
  });
}

function read(req) {
  const raw = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function clear(res) {
  res.clearCookie(COOKIE, { path: '/api/admin' });
}

async function checkCredentials(user, password) {
  // Trim so a password copied with stray spaces/newlines still works.
  const userOk = typeof user === 'string' && user.trim().toLowerCase() === adminUser.toLowerCase();
  const passOk = typeof password === 'string' && (await bcrypt.compare(password.trim(), adminPasswordHash));
  return userOk && passOk;
}

function requireAdmin(req, res, next) {
  if (!read(req)) return res.status(401).json({ error: 'Please sign in.' });
  next();
}

module.exports = { issue, read, clear, checkCredentials, requireAdmin };
