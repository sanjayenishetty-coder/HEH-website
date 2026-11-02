// Admin accounts and sessions. The session is an HMAC-signed cookie; each request also checks the account
// still exists and that the session was issued after its last password reset ("sign out everywhere").
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('./db');
const { adminUser, adminPasswordHash, adminEmail, sessionSecret } = require('./config');

const COOKIE = 'heh_admin';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const sign = (data) => crypto.createHmac('sha256', sessionSecret).update(data).digest('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const codeHash = (tokenHash, code) => crypto.createHmac('sha256', sessionSecret).update(`${tokenHash}:${code}`).digest('hex');
const sameText = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// The first account comes from .env (ADMIN_USER / ADMIN_PASSWORD_HASH / ADMIN_EMAIL) while the table is empty.
let firstAdmin;
function ensureFirstAdmin() {
  firstAdmin ||= query(
    `INSERT INTO admin_users (username, email, password_hash)
     SELECT $1, NULLIF($2, ''), $3 WHERE NOT EXISTS (SELECT 1 FROM admin_users)`,
    [adminUser, adminEmail, adminPasswordHash],
  ).catch((err) => { firstAdmin = null; throw err; });
  return firstAdmin;
}

// Username or email, any case.
async function findAdmin(login) {
  await ensureFirstAdmin();
  const s = String(login || '').trim().toLowerCase();
  if (!s) return null;
  const { rows } = await query('SELECT * FROM admin_users WHERE lower(username) = $1 OR lower(email) = $1 LIMIT 1', [s]);
  return rows[0] || null;
}

let dummyHash;
async function checkCredentials(login, password) {
  const admin = await findAdmin(login);
  // Trim so a password copied with stray spaces/newlines still works; compare even when there is no such
  // account so the response time doesn't reveal which usernames exist.
  dummyHash ||= await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
  const ok = await bcrypt.compare(String(password || '').trim(), admin?.password_hash || dummyHash);
  return ok && admin ? admin : null;
}

function issue(res, req, admin) {
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({ id: admin.id, u: admin.username, iat: now, exp: now + MAX_AGE_MS })).toString('base64url');
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
  if (!payload || !sig || !sameText(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.id && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

// Signed cookie plus a live account whose password hasn't been reset since the session began.
async function session(req) {
  const s = read(req);
  if (!s) return null;
  const { rows } = await query('SELECT id, username, email, sessions_valid_after FROM admin_users WHERE id = $1', [s.id]);
  const admin = rows[0];
  return admin && s.iat >= new Date(admin.sessions_valid_after).getTime() ? admin : null;
}

function clear(res) {
  res.clearCookie(COOKIE, { path: '/api/admin' });
}

function requireAdmin(req, res, next) {
  session(req).then((admin) => {
    if (!admin) return res.status(401).json({ error: 'Please sign in.' });
    req.admin = admin;
    next();
  }, next);
}

// ---------- One-time tokens: reset links and 6-digit codes ----------

const TTL = { reset: 30 * 60 * 1000, login: 10 * 60 * 1000, verify: 10 * 60 * 1000 };
const MAX_CODE_TRIES = 5;

// Returns { token, code } — the token goes in the link / stays in the browser; the code is emailed.
async function createToken(adminId, kind) {
  const token = crypto.randomBytes(32).toString('base64url');
  const code = kind === 'reset' ? null : String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const th = sha256(token);
  // One live token per account and kind: starting again cancels the previous link/code.
  await query('UPDATE admin_tokens SET used_at = now() WHERE admin_id = $1 AND kind = $2 AND used_at IS NULL', [adminId, kind]);
  await query(
    `INSERT INTO admin_tokens (admin_id, kind, token_hash, code_hash, expires_at) VALUES ($1, $2, $3, $4, now() + $5 * interval '1 millisecond')`,
    [adminId, kind, th, code && codeHash(th, code), TTL[kind]],
  );
  return { token, code };
}

// The live (unused, unexpired) token row with its account, or null.
async function findToken(token, kinds) {
  if (typeof token !== 'string' || token.length < 20) return null;
  const { rows } = await query(
    `SELECT t.*, a.username, a.email FROM admin_tokens t JOIN admin_users a ON a.id = t.admin_id
     WHERE t.token_hash = $1 AND t.kind = ANY($2) AND t.used_at IS NULL AND t.expires_at > now()`,
    [sha256(token), kinds],
  );
  return rows[0] || null;
}

// Check a 6-digit code; wrong codes count, and the token dies after MAX_CODE_TRIES.
async function checkCode(row, code) {
  const ok = /^\d{6}$/.test(String(code || '')) && sameText(codeHash(row.token_hash, String(code)), row.code_hash);
  if (ok) {
    await query('UPDATE admin_tokens SET used_at = now() WHERE id = $1', [row.id]);
    return 'ok';
  }
  const { rows } = await query(
    `UPDATE admin_tokens SET attempts = attempts + 1, used_at = CASE WHEN attempts + 1 >= $2 THEN now() END
     WHERE id = $1 RETURNING attempts`,
    [row.id, MAX_CODE_TRIES],
  );
  return rows[0].attempts >= MAX_CODE_TRIES ? 'locked' : 'wrong';
}

// A fresh code for the same sign-in step (Resend Code); the browser keeps its token.
async function renewCode(row) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await query(
    `UPDATE admin_tokens SET code_hash = $2, attempts = 0, sent_at = now(), expires_at = now() + $3 * interval '1 millisecond' WHERE id = $1`,
    [row.id, codeHash(row.token_hash, code), TTL[row.kind]],
  );
  return code;
}

async function setPassword(adminId, password) {
  const hash = await bcrypt.hash(password, 12);
  await query(
    `UPDATE admin_users SET password_hash = $2, sessions_valid_after = now(), updated_at = now() WHERE id = $1`,
    [adminId, hash],
  );
  await query(`UPDATE admin_tokens SET used_at = now() WHERE admin_id = $1 AND used_at IS NULL`, [adminId]);
}

// "vi***@visutech.com"
function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '';
  return `${user.slice(0, 2)}***@${domain}`;
}

module.exports = {
  issue, read, session, clear, requireAdmin, checkCredentials, findAdmin, ensureFirstAdmin,
  createToken, findToken, checkCode, renewCode, setPassword, maskEmail,
};
