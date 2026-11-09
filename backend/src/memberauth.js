// Member Portal accounts and sessions (the admin equivalent is auth.js). The session is an HMAC-signed cookie
// scoped to /api/member; each request also checks the account is still enabled, the member is active and
// the session was issued after the last password change.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('./db');
const { sessionSecret } = require('./config');

const COOKIE = 'heh_member';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

// Separate key from the admin cookie so one can never be passed off as the other.
const sign = (data) => crypto.createHmac('sha256', `member:${sessionSecret}`).update(data).digest('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sameText = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const ACCOUNT_COLS = `a.id AS account_id, a.password_hash, a.temporary_password, a.disabled, a.sessions_valid_after,
  m.id, m.slug, m.member_code, m.full_name, m.email, m.status`;

// Email address or HEH Membership ID, any case. Only members with portal access.
async function findAccount(login) {
  const s = String(login || '').trim().toLowerCase();
  if (!s) return null;
  const { rows } = await query(
    `SELECT ${ACCOUNT_COLS} FROM member_accounts a JOIN members m ON m.id = a.member_id
     WHERE lower(m.member_code) = $1 OR lower(m.email) = $1
     ORDER BY (lower(m.member_code) = $1) DESC, m.status = 'active' DESC LIMIT 1`,
    [s],
  );
  return rows[0] || null;
}

let dummyHash;
// Returns { account } or { error }.
async function checkCredentials(login, password) {
  const acc = await findAccount(login);
  dummyHash ||= await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
  const ok = await bcrypt.compare(String(password || '').trim(), acc?.password_hash || dummyHash);
  if (!ok || !acc) return { error: 'Incorrect email / Membership ID or password.' };
  if (acc.disabled || acc.status !== 'active') return { error: 'Your Member Portal access is not active. Please contact HEH.' };
  return { account: acc };
}

function issue(res, req, acc) {
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({ a: acc.account_id, m: acc.id, iat: now, exp: now + MAX_AGE_MS })).toString('base64url');
  res.cookie(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: MAX_AGE_MS, path: '/api/member',
  });
}

function read(req) {
  const raw = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig || !sameText(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.a && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

async function session(req) {
  const s = read(req);
  if (!s) return null;
  const { rows } = await query(
    `SELECT ${ACCOUNT_COLS} FROM member_accounts a JOIN members m ON m.id = a.member_id WHERE a.id = $1`,
    [s.a],
  );
  const acc = rows[0];
  if (!acc || acc.disabled || acc.status !== 'active') return null;
  return s.iat >= new Date(acc.sessions_valid_after).getTime() ? acc : null;
}

function clear(res) {
  res.clearCookie(COOKIE, { path: '/api/member' });
}

function requireMember(req, res, next) {
  session(req).then((acc) => {
    if (!acc) return res.status(401).json({ error: 'Please sign in.' });
    delete acc.password_hash;
    req.member = acc;
    next();
  }, next);
}

// Signs out every other session too (sessions_valid_after); the caller re-issues the current cookie.
async function setPassword(accountId, password, temporary = false) {
  const hash = await bcrypt.hash(password, 12);
  await query(
    `UPDATE member_accounts SET password_hash = $2, temporary_password = $3, sessions_valid_after = now(), updated_at = now()
     WHERE id = $1`,
    [accountId, hash, temporary],
  );
  await query('UPDATE member_tokens SET used_at = now() WHERE account_id = $1 AND used_at IS NULL', [accountId]);
}

async function checkPassword(accountId, password) {
  const { rows } = await query('SELECT password_hash FROM member_accounts WHERE id = $1', [accountId]);
  return Boolean(rows[0]) && bcrypt.compare(String(password || '').trim(), rows[0].password_hash);
}

// Letters and digits, easy to read out (no 0/O, 1/l/I).
function temporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  while (!(/[a-z]/i.test(s) && /\d/.test(s))) {
    s = Array.from({ length: 10 }, () => chars[crypto.randomInt(chars.length)]).join('');
  }
  return s;
}

const passwordProblem = (p) => (p.length < 8 || p.length > 200 || !/[a-z]/i.test(p) || !/\d/.test(p)
  ? 'Use at least 8 characters with letters and numbers.' : '');

async function createResetToken(accountId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await query('UPDATE member_tokens SET used_at = now() WHERE account_id = $1 AND used_at IS NULL', [accountId]);
  await query(
    `INSERT INTO member_tokens (account_id, kind, token_hash, expires_at) VALUES ($1, 'reset', $2, now() + $3 * interval '1 millisecond')`,
    [accountId, sha256(token), RESET_TTL_MS],
  );
  return token;
}

async function findResetToken(token) {
  if (typeof token !== 'string' || token.length < 20) return null;
  const { rows } = await query(
    `SELECT t.* FROM member_tokens t JOIN member_accounts a ON a.id = t.account_id
     WHERE t.token_hash = $1 AND t.kind = 'reset' AND t.used_at IS NULL AND t.expires_at > now() AND NOT a.disabled`,
    [sha256(token)],
  );
  return rows[0] || null;
}

module.exports = {
  issue, read, session, clear, requireMember, checkCredentials, findAccount, setPassword, checkPassword,
  temporaryPassword, passwordProblem, createResetToken, findResetToken,
};
