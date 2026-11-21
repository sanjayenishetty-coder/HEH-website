// Member Portal API, mounted at /api/member (designs: images/Member Login Web Application/Part 1).
// Screens: web/src/portal/. A member signs in (at /login) with their email address once an administrator has
// turned on portal access (routes/admin.js: /members/:id/portal).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { query, tx, nextCounter } = require('../db');
const { validate, rules } = require('../validate');
const auth = require('../memberauth');
const mail = require('../mail');
const config = require('../config');
const C = require('../constants');
const { isPast, registrationClosed, todayIST } = require('../eventrules');
const approval = require('../eventapproval');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, error, errors) => res.status(400).json({ error, ...(errors ? { errors } : {}) });
const notFound = (res, what = 'Not found') => res.status(404).json({ error: what });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const limiter = (limit, error) => rateLimit({
  windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { error },
});
const loginLimiter = limiter(10, 'Too many sign-in attempts. Try again in 15 minutes.');
const resetLimiter = limiter(20, 'Too many attempts. Try again in 15 minutes.');

// ---------- Settings defaults ----------

const PRIVACY = {
  show_in_directory: true, email_visibility: 'connections', mobile_visibility: 'private',
  show_company: true, show_expertise: true, show_interests: true, allow_requests: true, show_activity: false,
};
const VISIBILITY = ['members', 'connections', 'private'];
const NOTIFY = { events: true, connections: true, announcements: true, stories: false, in_app: true, email: true, whatsapp: false };
const privacyOf = (m) => ({ ...PRIVACY, ...(m.privacy || {}) });
const prefsOf = (a) => ({ ...NOTIFY, ...(a.notify_prefs || {}) });

// ---------- Sign in / out, password reset ----------

router.get('/auth-options', (req, res) => res.json({ google: null, mail: mail.enabled }));

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const { account, error } = await auth.checkCredentials(username, password);
  if (!account) return res.status(401).json({ error });
  await query('UPDATE member_accounts SET last_login_at = now() WHERE id = $1', [account.account_id]);
  auth.issue(res, req, account);
  res.json({ ok: true });
}));

router.post('/logout', (req, res) => {
  auth.clear(res);
  res.json({ ok: true });
});

router.post('/password/forgot', loginLimiter, wrap(async (req, res) => {
  const email = String((req.body || {}).email || '').trim();
  if (!EMAIL_RE.test(email)) return bad(res, 'Enter a valid email address.', { email: 'Enter a valid email address.' });
  if (!mail.enabled) return res.status(503).json({ error: 'Password reset by email is not set up yet. Please contact HEH to reset your password.' });
  const acc = await auth.findAccount(email);
  // Same answer whether or not the address has an account, so this can't be used to find members.
  if (acc && !acc.disabled && acc.status === 'active' && String(acc.email).toLowerCase() === email.toLowerCase()) {
    const token = await auth.createResetToken(acc.account_id);
    mail.send(acc.email, 'Reset your HEH Member Portal password', {
      title: 'Reset your password',
      lines: [
        'We received a request to reset the password for your HEH Member Portal account. Use the button below to choose a new password:',
        'This link expires in 30 minutes and can be used once. If you did not ask for this, you can ignore this email.',
      ],
      button: { text: 'Reset Password', url: `${config.siteUrl}/portal/?reset=${encodeURIComponent(token)}` },
    }).catch((err) => console.error(new Date().toISOString(), 'member reset email failed', err.message));
  }
  res.json({ ok: true, email: email.replace(/^(.{2}).*@/, '$1***@') });
}));

router.post('/password/reset/check', resetLimiter, wrap(async (req, res) => {
  if (!(await auth.findResetToken((req.body || {}).token))) {
    return bad(res, 'This reset link has expired or has already been used. Please request a new one.');
  }
  res.json({ ok: true });
}));

router.post('/password/reset', resetLimiter, wrap(async (req, res) => {
  const row = await auth.findResetToken((req.body || {}).token);
  if (!row) return bad(res, 'This reset link has expired or has already been used. Please request a new one.');
  const password = String((req.body || {}).password || '').trim();
  const confirm = String((req.body || {}).confirm || '').trim();
  const problem = auth.passwordProblem(password);
  if (problem) return bad(res, 'Please check the highlighted fields.', { password: problem });
  if (confirm !== password) return bad(res, 'Please check the highlighted fields.', { confirm: 'The passwords do not match.' });
  await auth.setPassword(row.account_id, password);
  res.json({ ok: true });
}));

router.use(auth.requireMember);

// ---------- Shared helpers ----------

const me = (req) => req.member.id;

// Card fields for lists; never email/phone (contact details go through contactFor).
const CARD = `m.id, m.slug, m.member_code, m.full_name, m.designation, m.company, m.industry, m.location, m.city, m.state,
  m.photo_url, m.expertise, m.expertise_tags, m.business_interests, m.collaboration_interests, m.privacy, m.created_at`;

// Expertise chips: the portal tags, or the short "Expertise" text from the admin profile split at commas.
const expertiseOf = (m) => ((m.expertise_tags || []).length ? m.expertise_tags
  : String(m.expertise || '').split(/[,;]/).map((s) => s.trim()).filter((s) => s && s.length <= 40));

function card(m, conn) {
  const p = privacyOf(m);
  return {
    id: m.id, slug: m.slug, full_name: m.full_name, designation: m.designation,
    company: p.show_company ? m.company : '', industry: p.show_company ? m.industry : '',
    location: m.location || [m.city, m.state].filter(Boolean).join(', '), photo_url: m.photo_url,
    expertise: p.show_expertise ? expertiseOf(m) : [],
    interests: p.show_interests ? m.collaboration_interests || [] : [],
    business_interests: p.show_interests ? m.business_interests || [] : [],
    allow_requests: p.allow_requests,
    connection: conn || null,
  };
}

// Open connections between me and others: Map(otherId -> {id, state: connected|sent|received, since})
async function connectionMap(memberId, otherIds = null) {
  const { rows } = await query(
    `SELECT id, requester_id, recipient_id, status, created_at, responded_at FROM member_connections
     WHERE status IN ('pending', 'accepted') AND $1 IN (requester_id, recipient_id)
       ${otherIds ? 'AND (requester_id = ANY($2) OR recipient_id = ANY($2))' : ''}`,
    otherIds ? [memberId, otherIds] : [memberId],
  );
  const map = new Map();
  for (const c of rows) {
    const other = c.requester_id === memberId ? c.recipient_id : c.requester_id;
    const state = c.status === 'accepted' ? 'connected' : c.requester_id === memberId ? 'sent' : 'received';
    map.set(other, { id: c.id, state, since: c.responded_at || c.created_at, requested: c.created_at });
  }
  return map;
}

async function connectedIds(memberId) {
  const { rows } = await query(
    `SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END AS id
     FROM member_connections WHERE status = 'accepted' AND $1 IN (requester_id, recipient_id)`,
    [memberId],
  );
  return new Set(rows.map((r) => r.id));
}

// Notices in the portal (and by email when the member allows it and email is set up).
async function notify(memberId, kind, title, body = '', link = '', refKey = null) {
  const { rows } = await query(
    `INSERT INTO member_notifications (member_id, kind, title, body, link, ref_key) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING RETURNING id`,
    [memberId, kind, title, body, link, refKey],
  );
  if (!rows[0] || !mail.enabled) return;
  const acc = await query(
    `SELECT a.notify_prefs, m.email FROM member_accounts a JOIN members m ON m.id = a.member_id WHERE a.member_id = $1 AND NOT a.disabled`,
    [memberId],
  );
  const a = acc.rows[0];
  const prefs = a && prefsOf(a);
  const topic = { connection: 'connections', event: 'events', announcement: 'announcements', story: 'stories' }[kind];
  if (!a || !a.email || !prefs.email || (topic && !prefs[topic])) return;
  mail.send(a.email, `${title} – HEH Member Portal`, {
    title, lines: [body || title, 'Sign in to the HEH Member Portal to see the details.'],
    button: { text: 'Open Member Portal', url: `${config.siteUrl}/portal/${link ? `#${link}` : ''}` },
  }).catch((err) => console.error(new Date().toISOString(), 'member notice email failed', err.message));
}

const fmtDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Announcements are generated from what's happening: events open for registration and new success stories.
async function announcements(limit = 20) {
  const today = todayIST();
  const { rows: events } = await query(
    `SELECT id, slug, title, short_description, event_date, start_time, venue_name, created_at FROM events
     WHERE published AND registration_open AND (event_date >= $1 OR event_date IS NULL)
     ORDER BY created_at DESC LIMIT $2`,
    [today, limit],
  );
  const { rows: stories } = await query(
    `SELECT id, slug, title, summary, published_on FROM stories
     WHERE published AND NOT archived ORDER BY published_on DESC, id DESC LIMIT $1`,
    [limit],
  );
  return [
    ...events.map((e) => ({
      key: `event:${e.id}`, kind: 'event', title: `${e.title} – Registrations Open`,
      text: e.short_description || `Join us on ${fmtDate(e.event_date)}${e.venue_name ? ` at ${e.venue_name}` : ''}.`,
      date: new Date(e.created_at).toISOString().slice(0, 10), link: `events/${e.slug}`,
    })),
    ...stories.map((s) => ({
      key: `story:${s.id}`, kind: 'story', title: s.title, text: s.summary, date: s.published_on, link: `stories/${s.slug}`,
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, limit);
}

// Create reminders and announcement notices that are due (each once, by ref_key).
async function syncNotifications(req) {
  const id = me(req);
  const { rows } = await query('SELECT notify_prefs, created_at FROM member_accounts WHERE member_id = $1', [id]);
  const prefs = prefsOf(rows[0] || {});
  const since = new Date(new Date(rows[0]?.created_at || Date.now()).getTime() - 30 * 86400000);
  if (prefs.events) {
    const today = todayIST();
    const soon = new Date(Date.now() + (5.5 + 48) * 3600000).toISOString().slice(0, 10);
    const { rows: regs } = await query(
      `SELECT r.id, r.ref, e.title, e.event_date, e.start_time, e.venue_name FROM event_registrations r JOIN events e ON e.id = r.event_id
       WHERE r.member_id = $1 AND r.status = 'confirmed' AND e.event_date BETWEEN $2 AND $3`,
      [id, today, soon],
    );
    for (const r of regs) {
      await notify(id, 'event', 'Event Reminder',
        `${r.title} is on ${fmtDate(r.event_date)}${r.start_time ? ` at ${fmtTime(r.start_time)}` : ''}${r.venue_name ? `, ${r.venue_name}` : ''}.`,
        `events/registrations/${r.ref}`, `reminder:${r.id}`);
    }
  }
  for (const a of await announcements(10)) {
    if (new Date(a.date) < since) continue;
    if (a.kind === 'event' && prefs.announcements) await notify(id, 'announcement', 'New Announcement', a.title, a.link, a.key);
    if (a.kind === 'story' && prefs.stories) await notify(id, 'story', 'Success Story', a.title, a.link, a.key);
  }
}

// Profile completion: five sections, as in the "Profile Completion" screen.
async function completion(m) {
  const docs = await query(`SELECT count(*)::int AS n FROM member_documents WHERE member_id = $1 AND status <> 'rejected'`, [m.id]);
  const sections = [
    ['personal', 'Personal Information', 'Basic details and contact information', Boolean(m.full_name && m.designation && m.email && m.phone)],
    ['company', 'Company Information', 'Company details and business contact', Boolean(m.company && m.industry && (m.company_about || m.business_type))],
    ['expertise', 'Expertise & Interests', 'Business expertise and collaboration preferences',
      Boolean(expertiseOf(m).length && ((m.collaboration_interests || []).length || (m.business_interests || []).length))],
    ['documents', 'Documents & Verification', 'Required documents and verification', docs.rows[0].n > 0],
    ['intro', 'Professional Introduction', 'Member biography and networking introduction', Boolean(m.bio)],
  ].map(([key, title, text, done]) => ({ key, title, text, done }));
  const done = sections.filter((s) => s.done).length;
  return { percent: Math.round((done / sections.length) * 100), done, total: sections.length, sections };
}

// ---------- Me, meta, dashboard ----------

router.get('/me', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT m.id, m.slug, m.member_code, m.full_name, m.designation, m.company, m.photo_url, m.member_types, a.temporary_password
     FROM members m JOIN member_accounts a ON a.member_id = m.id WHERE m.id = $1`,
    [me(req)],
  );
  await syncNotifications(req);
  const unread = await query('SELECT count(*)::int AS n FROM member_notifications WHERE member_id = $1 AND read_at IS NULL', [me(req)]);
  const { member_types: types = [], ...m } = rows[0];
  // Working Committee members add events; Executive Council members approve them (see event-submissions below).
  const council = types.includes('core_team');
  const waiting = council
    ? (await query(`SELECT count(*)::int AS n FROM events WHERE approval_status = 'pending' AND submitted_by IS NOT NULL AND submitted_by <> $1`, [me(req)])).rows[0].n
    : 0;
  res.json({ ...m, unread: unread.rows[0].n, can_submit_events: types.includes('working_committee'), can_approve_events: council,
    events_awaiting_approval: waiting });
}));

router.get('/meta', (req, res) => {
  res.json({
    industries: C.industries, expertiseAreas: C.expertiseAreas, collaborationPreferences: C.collaborationPreferences,
    businessInterests: C.businessInterests, businessTypes: C.businessTypes, documentTypes: C.documentTypes,
    connectionPurposes: C.connectionPurposes, cancelReasons: C.memberCancelReasons, mail: mail.enabled,
  });
});

router.get('/dashboard', wrap(async (req, res) => {
  const id = me(req);
  const today = todayIST();
  const [conns, regs, events, received, recent, acts] = await Promise.all([
    query(`SELECT count(*) FILTER (WHERE status = 'accepted')::int AS connections,
             count(*) FILTER (WHERE status = 'pending' AND recipient_id = $1)::int AS received,
             count(*) FILTER (WHERE status = 'pending' AND requester_id = $1)::int AS sent,
             count(*) FILTER (WHERE status = 'accepted' AND responded_at > now() - interval '30 days')::int AS new_month
           FROM member_connections WHERE $1 IN (requester_id, recipient_id)`, [id]),
    query(`SELECT count(*) FILTER (WHERE r.status IN ('pending', 'confirmed') AND e.event_date >= $2)::int AS upcoming,
             count(*) FILTER (WHERE r.status = 'attended')::int AS attended
           FROM event_registrations r JOIN events e ON e.id = r.event_id WHERE r.member_id = $1`, [id, today]),
    memberEvents(id, { when: 'upcoming', limit: 4 }),
    query(`SELECT c.id AS cid, c.created_at AS requested_at, ${CARD} FROM member_connections c JOIN members m ON m.id = c.requester_id
           WHERE c.recipient_id = $1 AND c.status = 'pending' ORDER BY c.created_at DESC LIMIT 3`, [id]),
    query(`SELECT c.id AS cid, coalesce(c.responded_at, c.created_at) AS since, ${CARD} FROM member_connections c
           JOIN members m ON m.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
           WHERE c.status = 'accepted' AND $1 IN (c.requester_id, c.recipient_id) ORDER BY since DESC LIMIT 3`, [id]),
    activities(id, 3),
  ]);
  const { rows: openEvents } = await query(
    `SELECT count(*)::int AS n FROM events WHERE published AND event_date >= $1`, [today]);
  const mine = events.find((e) => e.my_status && ['pending', 'confirmed'].includes(e.my_status));
  const news = await announcements(3);
  const story = news.find((a) => a.kind === 'story') || null;
  res.json({
    counts: {
      upcoming_events: openEvents[0].n, my_registrations: regs.rows[0].upcoming, events_attended: regs.rows[0].attended,
      ...conns.rows[0], recent_activities: acts.total,
    },
    events,
    next_event: mine || events[0] || null,
    announcements: news.filter((a) => a.kind === 'event').slice(0, 2),
    highlight: story,
    received: received.rows.map((r) => ({ id: r.cid, created_at: r.requested_at, member: card(r) })),
    recent_connections: recent.rows.map((r) => ({ id: r.cid, since: r.since, member: card(r) })),
    activities: acts.items,
  });
}));

// ---------- My profile ----------

const PROFILE_COLS = `m.*, a.temporary_password, a.last_login_at, a.created_at AS portal_since`;

router.get('/profile', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${PROFILE_COLS} FROM members m JOIN member_accounts a ON a.member_id = m.id WHERE m.id = $1`, [me(req)]);
  const m = rows[0];
  const docs = await query(
    `SELECT id, category, doc_type, file_name, mime, size, status, remarks, reviewed_at, created_at FROM member_documents
     WHERE member_id = $1 ORDER BY created_at DESC`, [m.id]);
  res.json({
    ...m, expertise_list: expertiseOf(m), privacy: privacyOf(m),
    completion: await completion(m), documents: docs.rows,
  });
}));

const listOf = (allowed, label) => (v) => {
  const list = Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
  if (list.length > 20) throw `Choose at most 20 ${label}.`;
  if (list.some((x) => x.length > 60)) throw `Each of the ${label} must be at most 60 characters.`;
  if (allowed && list.some((x) => !allowed.includes(x))) throw `Choose valid ${label}.`;
  return [...new Set(list)];
};

async function saveProfile(req, res, data) {
  if (data.city !== undefined || data.state !== undefined) {
    const { rows } = await query('SELECT city, state FROM members WHERE id = $1', [me(req)]);
    const city = data.city ?? rows[0].city;
    const state = data.state ?? rows[0].state;
    if (city || state) data.location = [city, state].filter(Boolean).join(', ');
  }
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => (Array.isArray(data[k]) || (data[k] && typeof data[k] === 'object') ? JSON.stringify(data[k]) : data[k]));
  await query(`UPDATE members SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, [me(req), ...values]);
  res.json({ ok: true });
}

router.put('/profile/personal', wrap(async (req, res) => {
  const data = validate(req.body, {
    full_name: rules.text({ required: true, max: 120, label: 'Full name' }),
    designation: rules.text({ max: 120, label: 'Designation' }),
    city: rules.text({ max: 80, label: 'City' }),
    state: rules.text({ max: 80, label: 'State' }),
    email: rules.email({ required: true }),
    phone: rules.mobile({ required: false }),
    bio: rules.text({ max: 1500, label: 'Professional introduction' }),
  });
  await saveProfile(req, res, data);
}));

router.put('/profile/company', wrap(async (req, res) => {
  const data = validate(req.body, {
    company: rules.text({ required: true, max: 160, label: 'Company name' }),
    industry: rules.oneOf(C.industries, { required: true, label: 'Industry' }),
    business_type: rules.oneOf(C.businessTypes, { required: false, label: 'Business type' }),
    city: rules.text({ max: 80, label: 'City' }),
    state: rules.text({ max: 80, label: 'State' }),
    website: rules.url({ label: 'Website' }),
    business_email: rules.email(),
    company_about: rules.text({ max: 1500, label: 'About the business' }),
    services: listOf(null, 'services'),
    collaboration_interests: listOf(C.collaborationPreferences, 'collaboration interests'),
  });
  await saveProfile(req, res, data);
}));

router.put('/profile/expertise', wrap(async (req, res) => {
  const data = validate(req.body, {
    expertise_tags: listOf(null, 'expertise areas'),
    business_interests: listOf(null, 'business interests'),
    collaboration_interests: listOf(C.collaborationPreferences, 'collaboration preferences'),
  });
  await saveProfile(req, res, data);
}));

router.put('/profile/privacy', wrap(async (req, res) => {
  const b = req.body || {};
  const p = {};
  for (const [k, def] of Object.entries(PRIVACY)) {
    if (typeof def === 'boolean') p[k] = b[k] === undefined ? def : Boolean(b[k]);
    else p[k] = VISIBILITY.includes(b[k]) ? b[k] : def;
  }
  await query('UPDATE members SET privacy = $2, updated_at = now() WHERE id = $1', [me(req), JSON.stringify(p)]);
  res.json({ ok: true, privacy: p });
}));

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype])),
});

router.post('/profile/photo', photoUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) return bad(res, 'Upload a JPG, PNG or WebP image up to 5 MB.');
  const url = `/uploads/${req.file.filename}`;
  await query('UPDATE members SET photo_url = $2, updated_at = now() WHERE id = $1', [me(req), url]);
  res.status(201).json({ url });
}));

// ---------- Documents (private files) ----------

const DOC_TYPES = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
const docUpload = multer({
  storage: multer.diskStorage({
    // created on first upload, so a missing folder never stops the API from starting
    destination: (req, file, cb) => fs.mkdir(config.docDir, { recursive: true }, (err) => cb(err, config.docDir)),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(10).toString('hex')}${DOC_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(DOC_TYPES[file.mimetype])),
});

router.post('/documents', docUpload.single('file'), wrap(async (req, res) => {
  const drop = () => req.file && fs.promises.unlink(req.file.path).catch(() => {});
  const b = req.body || {};
  const group = C.documentTypes.find(([cat]) => cat === b.category);
  const errors = {};
  if (!group) errors.category = 'Choose a document category.';
  else if (!group[1].includes(b.doc_type)) errors.doc_type = 'Choose a document type.';
  if (!req.file) errors.file = 'Choose a PDF, JPG or PNG file up to 5 MB.';
  if (b.confirm !== 'true' && b.confirm !== 'on') errors.confirm = 'Please confirm the document is accurate.';
  if (Object.keys(errors).length) { drop(); return bad(res, 'Please check the highlighted fields.', errors); }
  const name = path.basename(String(req.file.originalname || 'document')).replace(/[^\w.\-() ]+/g, '_').slice(0, 120);
  const { rows } = await query(
    `INSERT INTO member_documents (member_id, category, doc_type, file_name, stored_name, mime, size)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [me(req), b.category, b.doc_type, name, req.file.filename, req.file.mimetype, req.file.size],
  );
  res.status(201).json({ id: rows[0].id });
}));

router.get('/documents/:id(\\d+)/file', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM member_documents WHERE id = $1 AND member_id = $2', [req.params.id, me(req)]);
  if (!rows[0]) return notFound(res, 'Document not found');
  sendDocument(res, rows[0], req.query.download === '1');
}));

function sendDocument(res, d, download) {
  res.setHeader('Content-Type', d.mime);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${d.file_name.replace(/"/g, '')}"`);
  res.sendFile(path.join(config.docDir, d.stored_name), (err) => { if (err && !res.headersSent) res.status(404).end(); });
}

// ---------- Member directory ----------

async function directory(req) {
  const { rows } = await query(
    `SELECT ${CARD} FROM members m WHERE m.status = 'active' AND m.id <> $1
       AND (m.privacy->>'show_in_directory') IS DISTINCT FROM 'false'
     ORDER BY m.sort_order, m.full_name`,
    [me(req)],
  );
  const conns = await connectionMap(me(req));
  return rows.map((m) => card(m, conns.get(m.id)));
}

const textMatch = (q, ...parts) => !q || parts.flat().some((p) => String(p || '').toLowerCase().includes(q));
const count = (list, get) => {
  const map = new Map();
  for (const m of list) for (const v of [].concat(get(m))) if (v) map.set(v, (map.get(v) || 0) + 1);
  return [...map].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

router.get('/members', wrap(async (req, res) => {
  const all = await directory(req);
  const q = String(req.query.q || '').trim().toLowerCase();
  const { industry, expertise, interest, location } = req.query;
  const connection = String(req.query.connection || '');
  let items = all.filter((m) => textMatch(q, m.full_name, m.company, m.industry, m.designation, m.expertise, m.interests, m.location)
    && (!industry || m.industry === industry)
    && (!expertise || m.expertise.includes(expertise))
    && (!interest || m.interests.includes(interest) || m.business_interests.includes(interest))
    && (!location || String(m.location).toLowerCase().includes(String(location).toLowerCase()))
    && (!connection || (connection === 'connected' ? m.connection?.state === 'connected' : m.connection?.state !== 'connected')));
  if (req.query.sort === 'name') items = [...items].sort((a, b) => a.full_name.localeCompare(b.full_name));
  res.json({
    items, total: items.length,
    facets: {
      members: all.length,
      industries: count(all, (m) => m.industry),
      expertise: count(all, (m) => m.expertise),
      interests: count(all, (m) => m.interests),
    },
  });
}));

// Who can see my email / mobile.
const canSee = (vis, connected) => vis === 'members' || (vis === 'connections' && connected);

router.get('/members/:slug', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${CARD}, m.email, m.phone, m.website, m.business_email, m.business_type, m.bio, m.company_about,
       m.company_tagline, m.products_services, m.services, m.experience, m.passion, m.offers, m.opportunities
     FROM members m WHERE m.slug = $1 AND m.status = 'active'`,
    [req.params.slug],
  );
  const m = rows[0];
  if (!m || (m.id !== me(req) && privacyOf(m).show_in_directory === false
    && !(await connectedIds(me(req))).has(m.id))) return notFound(res, 'Member not found');
  const conn = (await connectionMap(me(req), [m.id])).get(m.id);
  const p = privacyOf(m);
  const connected = conn?.state === 'connected';
  const mutual = await mutualConnections(me(req), m.id);
  res.json({
    ...card(m, conn),
    member_code: m.member_code, bio: m.bio, experience: m.experience, passion: m.passion,
    company_about: p.show_company ? m.company_about : '', company_tagline: p.show_company ? m.company_tagline : '',
    products_services: p.show_company ? m.products_services : '', services: p.show_company ? m.services : [],
    business_type: p.show_company ? m.business_type : '', website: p.show_company ? m.website : '',
    offers: m.offers, opportunities: m.opportunities,
    contact: {
      email: canSee(p.email_visibility, connected) ? m.email : '',
      email_visibility: p.email_visibility,
      mobile: canSee(p.mobile_visibility, connected) ? m.phone : '',
      mobile_visibility: p.mobile_visibility,
      business_email: p.show_company && connected ? m.business_email : '',
    },
    mutual: mutual.slice(0, 10), mutual_count: mutual.length,
    member_since: m.created_at,
  });
}));

async function mutualConnections(a, b) {
  const { rows } = await query(
    `WITH mine AS (SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END AS id FROM member_connections
                   WHERE status = 'accepted' AND $1 IN (requester_id, recipient_id)),
          theirs AS (SELECT CASE WHEN requester_id = $2 THEN recipient_id ELSE requester_id END AS id FROM member_connections
                   WHERE status = 'accepted' AND $2 IN (requester_id, recipient_id))
     SELECT ${CARD} FROM members m WHERE m.status = 'active' AND m.id IN (SELECT id FROM mine INTERSECT SELECT id FROM theirs)
     ORDER BY m.full_name`,
    [a, b],
  );
  return rows.map((m) => card(m, { state: 'connected' }));
}

// ---------- Connections ----------

router.get('/connections', wrap(async (req, res) => {
  const id = me(req);
  const { rows } = await query(
    `SELECT c.id AS connection_id, coalesce(c.responded_at, c.created_at) AS since, ${CARD} FROM member_connections c
     JOIN members m ON m.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
     WHERE c.status = 'accepted' AND $1 IN (c.requester_id, c.recipient_id) AND m.status = 'active'
     ORDER BY since DESC`,
    [id],
  );
  const counts = await query(
    `SELECT count(*) FILTER (WHERE status = 'pending' AND recipient_id = $1)::int AS received,
            count(*) FILTER (WHERE status = 'pending' AND requester_id = $1)::int AS sent,
            count(*) FILTER (WHERE status = 'accepted' AND coalesce(responded_at, created_at) > now() - interval '30 days')::int AS new_month
     FROM member_connections WHERE $1 IN (requester_id, recipient_id)`,
    [id],
  );
  res.json({
    items: rows.map((r) => ({ ...card(r, { id: r.connection_id, state: 'connected', since: r.since }), since: r.since })),
    counts: { connections: rows.length, ...counts.rows[0] },
  });
}));

router.get('/connections/requests', wrap(async (req, res) => {
  const sent = req.query.dir === 'sent';
  const { rows } = await query(
    `SELECT c.id AS cid, c.status AS cstatus, c.purpose, c.message, c.created_at AS requested_at, c.responded_at, ${CARD} FROM member_connections c
     JOIN members m ON m.id = ${sent ? 'c.recipient_id' : 'c.requester_id'}
     WHERE ${sent ? 'c.requester_id' : 'c.recipient_id'} = $1 AND c.status IN ('pending', 'accepted', 'declined')
     ORDER BY (c.status = 'pending') DESC, c.created_at DESC LIMIT 100`,
    [me(req)],
  );
  res.json({ items: rows.map((r) => ({ id: r.cid, status: r.cstatus, purpose: r.purpose, message: r.message,
    created_at: r.requested_at, responded_at: r.responded_at, member: card(r) })) });
}));

router.get('/connections/:id(\\d+)', wrap(async (req, res) => {
  const id = me(req);
  const { rows } = await query(
    `SELECT * FROM member_connections WHERE id = $1 AND $2 IN (requester_id, recipient_id)`, [req.params.id, id]);
  const c = rows[0];
  if (!c) return notFound(res, 'Connection not found');
  const otherId = c.requester_id === id ? c.recipient_id : c.requester_id;
  const other = await query(`SELECT ${CARD} FROM members m WHERE m.id = $1`, [otherId]);
  const timeline = [{ at: c.created_at, title: 'Connection Request Sent',
    text: c.requester_id === id ? `A connection request was sent to ${other.rows[0].full_name}.` : `${other.rows[0].full_name} sent you a connection request.` }];
  if (c.responded_at) {
    const words = { accepted: 'Connection Accepted', declined: 'Request Declined', withdrawn: 'Request Withdrawn', removed: 'Connection Removed' };
    timeline.unshift({ at: c.responded_at, title: words[c.status] || 'Updated',
      text: c.status === 'accepted' ? `You and ${other.rows[0].full_name} became connected.` : '' });
  }
  res.json({
    id: c.id, status: c.status, direction: c.requester_id === id ? 'sent' : 'received', purpose: c.purpose, message: c.message,
    created_at: c.created_at, responded_at: c.responded_at, member: card(other.rows[0]), timeline,
  });
}));

router.get('/members/:id(\\d+)/mutual', wrap(async (req, res) => {
  res.json({ items: await mutualConnections(me(req), Number(req.params.id)) });
}));

router.post('/connections', wrap(async (req, res) => {
  const id = me(req);
  const data = validate(req.body, {
    member_id: rules.int({ min: 1, label: 'Member' }),
    purpose: rules.oneOf(C.connectionPurposes, { required: true, label: 'Networking purpose' }),
    message: rules.text({ max: 300, label: 'Personal message' }),
  });
  const { rows } = await query(`SELECT id, full_name, privacy, status FROM members WHERE id = $1`, [data.member_id]);
  const other = rows[0];
  if (!other || other.status !== 'active' || other.id === id) return notFound(res, 'Member not found');
  if (!privacyOf(other).allow_requests) return bad(res, `${other.full_name} is not accepting connection requests right now.`);
  const open = (await connectionMap(id, [other.id])).get(other.id);
  if (open?.state === 'connected') return bad(res, `You are already connected with ${other.full_name}.`);
  if (open?.state === 'sent') return bad(res, `You have already sent ${other.full_name} a request.`);
  if (open?.state === 'received') return bad(res, `${other.full_name} has already sent you a request. Accept it from Received Requests.`);
  const ins = await query(
    `INSERT INTO member_connections (requester_id, recipient_id, purpose, message) VALUES ($1, $2, $3, $4) RETURNING id`,
    [id, other.id, data.purpose, data.message],
  );
  await notify(other.id, 'connection', 'Connection Request',
    `${req.member.full_name} sent you a connection request.`, `connections/requests/${ins.rows[0].id}`);
  res.status(201).json({ id: ins.rows[0].id });
}));

// accept / decline: the recipient; withdraw: the requester; remove: either side of an accepted connection.
const MOVES = {
  accept: { from: 'pending', to: 'accepted', who: 'recipient' },
  decline: { from: 'pending', to: 'declined', who: 'recipient' },
  withdraw: { from: 'pending', to: 'withdrawn', who: 'requester' },
  remove: { from: 'accepted', to: 'removed', who: 'either' },
};
router.post('/connections/:id(\\d+)/:move(accept|decline|withdraw|remove)', wrap(async (req, res) => {
  const id = me(req);
  const move = MOVES[req.params.move];
  const { rows } = await query('SELECT * FROM member_connections WHERE id = $1', [req.params.id]);
  const c = rows[0];
  const allowed = c && (move.who === 'either' ? [c.requester_id, c.recipient_id].includes(id) : c[`${move.who}_id`] === id);
  if (!allowed) return notFound(res, 'Connection not found');
  if (c.status !== move.from) return bad(res, 'This request has already been answered.');
  await query('UPDATE member_connections SET status = $2, responded_at = now(), updated_at = now() WHERE id = $1', [c.id, move.to]);
  if (move.to === 'accepted') {
    await notify(c.requester_id, 'connection', 'Connection Accepted',
      `${req.member.full_name} accepted your connection request.`, `connections/${c.id}`);
  }
  res.json({ ok: true, status: move.to });
}));

// ---------- Events ----------

const EVENT_COLS = `e.id, e.slug, e.title, e.category, e.short_description, e.event_date, e.start_time, e.end_time,
  e.venue_name, e.venue_address, e.city, e.image_url, e.members_only, e.registration_open, e.registration_opens,
  e.registration_closes, e.capacity`;

async function memberEvents(memberId, { when = 'upcoming', q = '', category = '', month = '', limit = 50 } = {}) {
  const today = todayIST();
  const where = ['e.published'];
  const params = [memberId, today];
  if (when === 'upcoming') where.push('(e.event_date >= $2 OR e.event_date IS NULL)');
  if (when === 'past') where.push('e.event_date < $2');
  if (when === 'all') where.push('$2::date IS NOT NULL'); // keeps $2 typed
  if (q) { params.push(`%${q}%`); where.push(`(e.title ILIKE $${params.length} OR e.venue_name ILIKE $${params.length} OR e.short_description ILIKE $${params.length})`); }
  if (C.eventCategories.includes(category)) { params.push(category); where.push(`e.category = $${params.length}`); }
  if (/^\d{4}-\d{2}$/.test(month)) { params.push(month); where.push(`to_char(e.event_date, 'YYYY-MM') = $${params.length}`); }
  const { rows } = await query(
    `SELECT ${EVENT_COLS}, r.ref AS my_ref, r.status AS my_status,
       (SELECT count(*)::int FROM event_registrations x WHERE x.event_id = e.id AND x.status IN ('pending', 'confirmed', 'attended')) AS taken
     FROM events e LEFT JOIN LATERAL (
       SELECT ref, status FROM event_registrations r WHERE r.event_id = e.id AND r.member_id = $1 ORDER BY r.id DESC LIMIT 1
     ) r ON true
     WHERE ${where.join(' AND ')}
     ORDER BY ${when === 'past' ? 'e.event_date DESC' : 'e.event_date ASC NULLS LAST'}, e.id DESC LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    params,
  );
  return Promise.all(rows.map(async (e) => {
    const closed = await registrationClosed(e);
    return { ...e, is_past: isPast(e), registration_note: closed, can_register: !closed,
      seats_left: e.capacity ? Math.max(e.capacity - e.taken, 0) : null };
  }));
}

router.get('/events', wrap(async (req, res) => {
  const when = ['upcoming', 'past', 'all'].includes(req.query.when) ? req.query.when : 'upcoming';
  const items = await memberEvents(me(req), { when, q: String(req.query.q || '').trim(), category: req.query.category,
    month: String(req.query.month || ''), limit: req.query.limit });
  const counts = await query(
    `SELECT count(*) FILTER (WHERE r.status IN ('pending', 'confirmed') AND e.event_date >= $2)::int AS registrations,
            count(*) FILTER (WHERE r.status = 'attended')::int AS attended
     FROM event_registrations r JOIN events e ON e.id = r.event_id WHERE r.member_id = $1`,
    [me(req), todayIST()],
  );
  const upcoming = await query(`SELECT count(*)::int AS n FROM events WHERE published AND event_date >= $1`, [todayIST()]);
  res.json({ items, counts: { upcoming: upcoming.rows[0].n, ...counts.rows[0] } });
}));

router.get('/events/:slug', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE slug = $1 AND published', [req.params.slug]);
  const e = rows[0];
  if (!e) return notFound(res, 'Event not found');
  const reg = await query(
    `SELECT ref, status, status_reason, created_at FROM event_registrations WHERE event_id = $1 AND member_id = $2 ORDER BY id DESC LIMIT 1`,
    [e.id, me(req)]);
  const taken = await query(
    `SELECT count(*)::int AS n FROM event_registrations WHERE event_id = $1 AND status IN ('pending', 'confirmed', 'attended')`, [e.id]);
  const closed = await registrationClosed(e);
  delete e.created_at;
  delete e.updated_at;
  res.json({ ...e, is_past: isPast(e), registration_note: closed, can_register: !closed,
    seats_left: e.capacity ? Math.max(e.capacity - taken.rows[0].n, 0) : null, registration: reg.rows[0] || null });
}));

router.post('/events/:slug/register', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE slug = $1 AND published', [req.params.slug]);
  const event = rows[0];
  if (!event) return notFound(res, 'Event not found');
  const closed = await registrationClosed(event);
  if (closed) return res.status(409).json({ error: closed, full: /full/.test(closed) });
  const data = validate(req.body, {
    company: rules.text({ required: true, max: 160, label: 'Company / organisation' }),
    mobile: rules.mobile(),
    email: rules.email({ required: true }),
    notes: rules.text({ max: 500, label: 'Additional notes' }),
    consent: rules.checked('Please agree to the event registration terms.'),
  });
  const m = (await query('SELECT id, full_name, member_code FROM members WHERE id = $1', [me(req)])).rows[0];
  const status = event.approval_mode === 'manual' ? 'pending' : 'confirmed';
  const result = await tx(async (client) => {
    const dup = await client.query(
      `SELECT id, ref, status FROM event_registrations WHERE event_id = $1 AND (member_id = $2 OR lower(membership_id) = lower($3))`,
      [event.id, m.id, m.member_code]);
    const d = dup.rows[0];
    if (d && d.status !== 'cancelled' && d.status !== 'rejected') return { duplicate: d.ref };
    if (d) { // registering again after cancelling
      await client.query(
        `UPDATE event_registrations SET status = $2, status_reason = '', full_name = $3, company = $4, mobile = $5, email = $6,
           notes = $7, member_id = $8, updated_at = now() WHERE id = $1`,
        [d.id, status, m.full_name, data.company, data.mobile, data.email, data.notes, m.id]);
      return { ref: d.ref, status };
    }
    const dateKey = (event.event_date || todayIST()).replace(/-/g, '');
    const n = await nextCounter(client, `REG-${event.id}`);
    const ref = `HEH-${dateKey}-${String(n).padStart(4, '0')}`;
    await client.query(
      `INSERT INTO event_registrations (ref, token, event_id, full_name, mobile, company, membership_id, email, status, member_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [ref, crypto.randomBytes(16).toString('hex'), event.id, m.full_name, data.mobile, data.company, m.member_code.toUpperCase(),
        data.email, status, m.id, data.notes]);
    return { ref, status };
  });
  if (result.duplicate) return res.status(409).json({ error: 'You are already registered for this event.', ref: result.duplicate });
  await notify(m.id, 'event', status === 'pending' ? 'Registration Received' : 'Registration Confirmed',
    `${event.title} on ${fmtDate(event.event_date)}${status === 'pending' ? ' – waiting for approval.' : '.'}`,
    `events/registrations/${result.ref}`, `registered:${result.ref}:${Date.now()}`);
  res.status(201).json(result);
}));

// ---------- Event submissions (Working Committee) and approvals (Executive Council) ----------
// Only Working Committee members add events here. They stay off the website (published = false, approval_status
// 'pending') until an Executive Council member (below) or an admin approves them; see src/eventapproval.js.

async function rolesOf(memberId) {
  const { rows } = await query('SELECT member_types FROM members WHERE id = $1', [memberId]);
  const types = rows[0]?.member_types || [];
  return { committee: types.includes('working_committee'), council: types.includes('core_team') };
}
const needRole = (role, error) => wrap(async (req, res, next) => {
  if (!(await rolesOf(me(req)))[role]) return res.status(403).json({ error });
  next();
});
const committeeOnly = needRole('committee', 'Only Working Committee members can add events.');
const councilOnly = needRole('council', 'Only Executive Council members can approve events.');

const SUB_COLS = `e.id, e.slug, e.title, e.category, e.short_description, e.description, e.event_date, e.start_time, e.end_time,
  e.venue_name, e.venue_address, e.city, e.map_url, e.image_url, e.members_only, e.capacity, e.coordinator, e.published,
  e.approval_status, e.submitted_by, e.submitted_at, e.reviewed_by, e.reviewed_at, e.review_note,
  s.full_name AS submitted_by_name, s.designation AS submitted_by_designation, s.company AS submitted_by_company, s.photo_url AS submitted_by_photo`;
const SUB_FROM = 'FROM events e LEFT JOIN members s ON s.id = e.submitted_by';

const eventSlug = async (title, excludeId = 0) => {
  const base = String(title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'event';
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const { rows } = await query('SELECT 1 FROM events WHERE slug = $1 AND id <> $2', [slug, excludeId]);
    if (!rows[0]) return slug;
  }
};

// The fields a member fills in; returns { data } or { errors }.
function eventInput(b = {}) {
  const t = (k, max) => String(b[k] ?? '').trim().slice(0, max);
  const data = {
    title: t('title', 160), category: C.eventCategories.includes(b.category) ? b.category : 'spotlight',
    short_description: t('short_description', 300), description: t('description', 5000),
    event_date: t('event_date', 10), start_time: t('start_time', 5), end_time: t('end_time', 5) || null,
    venue_name: t('venue_name', 160), venue_address: t('venue_address', 400), city: t('city', 80) || 'Hyderabad',
    map_url: t('map_url', 500), image_url: t('image_url', 300), coordinator: t('coordinator', 160),
    members_only: b.members_only === true || b.members_only === 'true' || b.members_only === 'on',
    capacity: /^\d{1,5}$/.test(String(b.capacity ?? '').trim()) && Number(b.capacity) > 0 ? Number(b.capacity) : null,
  };
  const errors = {};
  if (!data.title) errors.title = 'Enter the event name.';
  if (!data.short_description) errors.short_description = 'Add a short description.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) errors.event_date = 'Choose the event date.';
  else if (data.event_date < todayIST()) errors.event_date = 'The event date cannot be in the past.';
  if (!/^\d{2}:\d{2}$/.test(data.start_time)) errors.start_time = 'Choose the start time.';
  if (data.end_time && !/^\d{2}:\d{2}$/.test(data.end_time)) errors.end_time = 'Choose a valid end time.';
  else if (data.end_time && data.start_time && data.end_time <= data.start_time) errors.end_time = 'The end time must be after the start time.';
  if (!data.venue_name) errors.venue_name = 'Enter the venue.';
  if (data.map_url && !/^https:\/\/\S+$/i.test(data.map_url)) errors.map_url = 'Paste the full link, starting with https://';
  if (data.image_url && !data.image_url.startsWith('/uploads/')) data.image_url = '';
  if (String(b.capacity ?? '').trim() && data.capacity == null) errors.capacity = 'Enter a number, or leave it blank for no limit.';
  return Object.keys(errors).length ? { errors } : { data };
}

// Tell the Executive Council members who can use the portal that an event is waiting for them.
async function tellCouncil(e, submitterId, again = false) {
  const { rows } = await query(
    `SELECT m.id FROM members m JOIN member_accounts a ON a.member_id = m.id
     WHERE m.member_types ? 'core_team' AND m.status = 'active' AND NOT a.disabled AND m.id <> $1`, [submitterId]);
  for (const r of rows) {
    await notify(r.id, 'event', `Event ${again ? 'sent again' : 'waiting'} for approval: ${e.title}`,
      `${e.submitted_by_name || 'A Working Committee member'} added this event. Review it and approve or reject it.`,
      `events/approvals/${e.id}`);
  }
}
const subById = async (id) => (await query(`SELECT ${SUB_COLS} ${SUB_FROM} WHERE e.id = $1`, [id])).rows[0];

router.get('/event-submissions', wrap(async (req, res) => {
  const { rows } = await query(`SELECT ${SUB_COLS} ${SUB_FROM} WHERE e.submitted_by = $1 ORDER BY e.submitted_at DESC NULLS LAST, e.id DESC`, [me(req)]);
  res.json({ items: rows, can_submit: (await rolesOf(me(req))).committee });
}));

router.get('/event-submissions/:id(\\d+)', wrap(async (req, res) => {
  const e = await subById(req.params.id);
  if (!e || e.submitted_by !== me(req)) return notFound(res, 'Event not found');
  res.json(e);
}));

router.post('/event-submissions/image', committeeOnly, photoUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) return bad(res, 'Upload a JPG, PNG or WebP image up to 5 MB.');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}));

router.post('/event-submissions', committeeOnly, wrap(async (req, res) => {
  const { data, errors } = eventInput(req.body);
  if (errors) return bad(res, 'Please check the highlighted fields.', errors);
  data.slug = await eventSlug(data.title);
  const cols = Object.keys(data);
  const { rows } = await query(
    `INSERT INTO events (${cols.join(', ')}, published, approval_status, submitted_by, submitted_at, registration_open)
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}, false, 'pending', $${cols.length + 1}, now(), true) RETURNING id`,
    [...Object.values(data), me(req)]);
  const e = await subById(rows[0].id);
  await tellCouncil(e, me(req));
  res.status(201).json(e);
}));

// Change an event that is waiting or was not approved; it goes back to the Executive Council for approval.
router.put('/event-submissions/:id(\\d+)', committeeOnly, wrap(async (req, res) => {
  const old = await subById(req.params.id);
  if (!old || old.submitted_by !== me(req)) return notFound(res, 'Event not found');
  if (old.approval_status === 'approved') return bad(res, 'This event is already approved. Please ask an admin to change it.');
  const { data, errors } = eventInput(req.body);
  if (errors) return bad(res, 'Please check the highlighted fields.', errors);
  if (data.title !== old.title) data.slug = await eventSlug(data.title, old.id);
  const cols = Object.keys(data);
  await query(
    `UPDATE events SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}, approval_status = 'pending', published = false,
       submitted_at = now(), reviewed_by = '', reviewed_at = NULL, review_note = '', updated_at = now()
     WHERE id = $${cols.length + 1} AND approval_status <> 'approved'`,
    [...Object.values(data), old.id]);
  const e = await subById(old.id);
  await tellCouncil(e, me(req), true);
  res.json(e);
}));

// Withdraw an event that is not approved yet.
router.delete('/event-submissions/:id(\\d+)', committeeOnly, wrap(async (req, res) => {
  const { rows } = await query(
    `DELETE FROM events WHERE id = $1 AND submitted_by = $2 AND approval_status <> 'approved' RETURNING id`, [req.params.id, me(req)]);
  if (!rows[0]) return bad(res, 'Only events that are not approved yet can be withdrawn.');
  res.json({ ok: true });
}));

router.get('/event-approvals', councilOnly, wrap(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  const { rows } = await query(
    `SELECT ${SUB_COLS} ${SUB_FROM} WHERE e.submitted_by IS NOT NULL AND e.approval_status = $1
     ORDER BY ${status === 'pending' ? 'e.submitted_at ASC' : 'e.reviewed_at DESC NULLS LAST'}, e.id DESC LIMIT 200`, [status]);
  const counts = await query(
    `SELECT approval_status AS s, count(*)::int AS n FROM events WHERE submitted_by IS NOT NULL GROUP BY approval_status`);
  res.json({ items: rows, counts: Object.fromEntries(counts.rows.map((r) => [r.s, r.n])) });
}));

router.get('/event-approvals/:id(\\d+)', councilOnly, wrap(async (req, res) => {
  const e = await subById(req.params.id);
  if (!e || !e.submitted_by) return notFound(res, 'Event not found');
  res.json({ ...e, own: e.submitted_by === me(req) });
}));

router.post('/event-approvals/:id(\\d+)/:what(approve|reject)', councilOnly, wrap(async (req, res) => {
  const e = await subById(req.params.id);
  if (!e || !e.submitted_by) return notFound(res, 'Event not found');
  if (e.submitted_by === me(req)) return res.status(403).json({ error: 'You cannot approve an event you added yourself.' });
  if (e.approval_status !== 'pending') return bad(res, 'This event has already been reviewed.');
  const note = String((req.body || {}).note || '').trim();
  if (req.params.what === 'reject' && !note) return bad(res, 'Give a reason so the member can fix the event.', { note: 'Enter the reason.' });
  const { rows } = await query('SELECT full_name FROM members WHERE id = $1', [me(req)]);
  const by = `${rows[0].full_name} (Executive Council)`;
  const done = req.params.what === 'approve' ? await approval.approve(e.id, by, note) : await approval.reject(e.id, by, note);
  if (!done) return bad(res, 'This event has already been reviewed.');
  res.json(await subById(e.id));
}));

const REG_COLS = `r.id, r.ref, r.status, r.status_reason, r.full_name, r.company, r.mobile, r.email, r.membership_id, r.notes,
  r.created_at, r.updated_at, r.checked_in_at, ${EVENT_COLS}, e.map_url, e.coordinator, e.summary, e.photos`;

router.get('/registrations', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${REG_COLS} FROM event_registrations r JOIN events e ON e.id = r.event_id
     WHERE r.member_id = $1 ORDER BY e.event_date DESC NULLS LAST, r.id DESC`, [me(req)]);
  res.json({ items: rows.map((r) => ({ ...r, is_past: isPast(r) })) });
}));

router.get('/registrations/:ref', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${REG_COLS} FROM event_registrations r JOIN events e ON e.id = r.event_id WHERE r.ref = $1 AND r.member_id = $2`,
    [req.params.ref, me(req)]);
  if (!rows[0]) return notFound(res, 'Registration not found');
  res.json({ ...rows[0], is_past: isPast(rows[0]), photo_count: (rows[0].photos || []).length });
}));

router.post('/registrations/:ref/cancel', wrap(async (req, res) => {
  const data = validate(req.body, {
    reason: rules.oneOf(C.memberCancelReasons, { required: true, label: 'Reason for cancellation' }),
    confirm: rules.checked('Please confirm that your registration will be cancelled.'),
  });
  const { rows } = await query(
    `SELECT r.id, r.status, e.event_date, e.title FROM event_registrations r JOIN events e ON e.id = r.event_id
     WHERE r.ref = $1 AND r.member_id = $2`, [req.params.ref, me(req)]);
  const r = rows[0];
  if (!r) return notFound(res, 'Registration not found');
  if (!['pending', 'confirmed'].includes(r.status) || isPast(r)) return bad(res, 'This registration can no longer be cancelled.');
  await query(`UPDATE event_registrations SET status = 'cancelled', status_reason = $2, updated_at = now() WHERE id = $1`,
    [r.id, `Cancelled by member: ${data.reason}`]);
  res.json({ ok: true });
}));

// ---------- Event gallery ----------

router.get('/gallery', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, category, event_date, venue_name, image_url, photos, videos FROM events
     WHERE published AND (jsonb_array_length(photos) > 0 OR jsonb_array_length(videos) > 0)
     ORDER BY event_date DESC NULLS LAST, id DESC`);
  const saved = await query('SELECT media_key, created_at FROM member_saved_media WHERE member_id = $1 ORDER BY created_at DESC', [me(req)]);
  res.json({ albums: rows, saved: saved.rows });
}));

router.post('/gallery/saved', wrap(async (req, res) => {
  const key = String((req.body || {}).key || '');
  const m = key.match(/^(\d+):([pv])(\d+)$/);
  if (!m) return bad(res, 'This media item is no longer available.');
  const { rows } = await query('SELECT photos, videos FROM events WHERE id = $1 AND published', [m[1]]);
  const list = rows[0] && (m[2] === 'p' ? rows[0].photos : rows[0].videos);
  if (!list || !list[Number(m[3])]) return notFound(res, 'This media item is no longer available.');
  await query('INSERT INTO member_saved_media (member_id, media_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [me(req), key]);
  res.status(201).json({ ok: true });
}));

router.delete('/gallery/saved/:key', wrap(async (req, res) => {
  await query('DELETE FROM member_saved_media WHERE member_id = $1 AND media_key = $2', [me(req), req.params.key]);
  res.json({ ok: true });
}));

// ---------- Announcements, activities, notifications ----------

router.get('/announcements', wrap(async (req, res) => res.json({ items: await announcements(30) })));

async function activities(memberId, limit = 50) {
  const { rows } = await query(
    `SELECT * FROM (
       SELECT 'registered' AS kind, r.created_at AS at, e.title, e.venue_name AS place, r.ref AS link_ref, r.status FROM event_registrations r
         JOIN events e ON e.id = r.event_id WHERE r.member_id = $1
       UNION ALL
       SELECT 'attended', coalesce(r.checked_in_at, e.event_date::timestamptz), e.title, e.venue_name, r.ref, r.status FROM event_registrations r
         JOIN events e ON e.id = r.event_id WHERE r.member_id = $1 AND r.status = 'attended'
       UNION ALL
       SELECT 'connected', c.responded_at, m.full_name, m.company, c.id::text, c.status FROM member_connections c
         JOIN members m ON m.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
         WHERE c.status = 'accepted' AND $1 IN (c.requester_id, c.recipient_id)
       UNION ALL
       SELECT 'request', c.created_at, m.full_name, m.company, c.id::text, c.status FROM member_connections c
         JOIN members m ON m.id = c.recipient_id WHERE c.requester_id = $1
       UNION ALL
       SELECT 'document', d.created_at, d.doc_type, d.category, d.id::text, d.status FROM member_documents d WHERE d.member_id = $1
     ) x WHERE at IS NOT NULL ORDER BY at DESC LIMIT $2`,
    [memberId, limit],
  );
  const total = await query(
    `SELECT (SELECT count(*) FROM event_registrations WHERE member_id = $1 AND created_at > now() - interval '90 days')
          + (SELECT count(*) FROM member_connections WHERE $1 IN (requester_id, recipient_id) AND created_at > now() - interval '90 days')
          + (SELECT count(*) FROM member_documents WHERE member_id = $1 AND created_at > now() - interval '90 days') AS n`,
    [memberId],
  );
  return { items: rows, total: Number(total.rows[0].n) };
}

router.get('/activities', wrap(async (req, res) => {
  const id = me(req);
  const acts = await activities(id, 100);
  const c = await query(
    `SELECT (SELECT count(*)::int FROM event_registrations WHERE member_id = $1 AND status = 'attended') AS attended,
            (SELECT count(*)::int FROM member_connections WHERE status = 'accepted' AND $1 IN (requester_id, recipient_id)) AS connections,
            (SELECT count(*)::int FROM member_connections WHERE $1 IN (requester_id, recipient_id)
               AND coalesce(responded_at, created_at) > now() - interval '30 days') AS networking`,
    [id],
  );
  res.json({ ...acts, counts: { ...c.rows[0], recent: acts.total } });
}));

router.get('/notifications', wrap(async (req, res) => {
  await syncNotifications(req);
  const kinds = { events: ['event'], announcements: ['announcement', 'story'], updates: ['connection', 'update'] };
  const filter = kinds[req.query.kind];
  const { rows } = await query(
    `SELECT id, kind, title, body, link, read_at, created_at FROM member_notifications WHERE member_id = $1
     ${filter ? 'AND kind = ANY($2)' : ''} ORDER BY created_at DESC, id DESC LIMIT 100`,
    filter ? [me(req), filter] : [me(req)]);
  const counts = await query(
    `SELECT count(*)::int AS all, count(*) FILTER (WHERE kind = 'event')::int AS events,
       count(*) FILTER (WHERE kind IN ('announcement', 'story'))::int AS announcements,
       count(*) FILTER (WHERE kind IN ('connection', 'update'))::int AS updates,
       count(*) FILTER (WHERE read_at IS NULL)::int AS unread
     FROM member_notifications WHERE member_id = $1`, [me(req)]);
  res.json({ items: rows, counts: counts.rows[0] });
}));

router.get('/notifications/:id(\\d+)', wrap(async (req, res) => {
  const { rows } = await query(
    `UPDATE member_notifications SET read_at = coalesce(read_at, now()) WHERE id = $1 AND member_id = $2
     RETURNING id, kind, title, body, link, read_at, created_at`, [req.params.id, me(req)]);
  if (!rows[0]) return notFound(res, 'Notification not found');
  const n = rows[0];
  // Event notices show the event / registration alongside.
  let event = null;
  const regRef = (n.link.match(/^events\/registrations\/(.+)$/) || [])[1];
  const slug = (n.link.match(/^events\/([^/]+)$/) || [])[1];
  if (regRef) {
    const r = await query(`SELECT ${REG_COLS} FROM event_registrations r JOIN events e ON e.id = r.event_id WHERE r.ref = $1 AND r.member_id = $2`, [regRef, me(req)]);
    event = r.rows[0] || null;
  } else if (slug) {
    const r = await query(`SELECT ${EVENT_COLS} FROM events e WHERE e.slug = $1 AND e.published`, [slug]);
    event = r.rows[0] || null;
  }
  res.json({ ...n, event });
}));

router.post('/notifications/read-all', wrap(async (req, res) => {
  await query('UPDATE member_notifications SET read_at = now() WHERE member_id = $1 AND read_at IS NULL', [me(req)]);
  res.json({ ok: true });
}));

router.post('/notifications/:id(\\d+)/:what(read|unread)', wrap(async (req, res) => {
  await query(`UPDATE member_notifications SET read_at = ${req.params.what === 'read' ? 'now()' : 'NULL'} WHERE id = $1 AND member_id = $2`,
    [req.params.id, me(req)]);
  res.json({ ok: true });
}));

router.delete('/notifications/:id(\\d+)', wrap(async (req, res) => {
  await query('DELETE FROM member_notifications WHERE id = $1 AND member_id = $2', [req.params.id, me(req)]);
  res.json({ ok: true });
}));

// ---------- Search ----------

router.get('/search', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 80);
  if (!q) return res.json({ q, members: [], events: [], announcements: [], stories: [] });
  const [people, events, news, stories] = await Promise.all([
    directory(req),
    memberEvents(me(req), { when: 'all', q, limit: 20 }),
    announcements(30),
    query(`SELECT id, slug, title, category, summary, image_url, published_on FROM stories
           WHERE published AND NOT archived AND (title ILIKE $1 OR summary ILIKE $1 OR category ILIKE $1)
           ORDER BY published_on DESC LIMIT 20`, [`%${q}%`]),
  ]);
  const location = String(req.query.location || '').toLowerCase();
  const industry = String(req.query.industry || '');
  res.json({
    q,
    members: people.filter((m) => textMatch(q, m.full_name, m.company, m.industry, m.designation, m.expertise)
      && (!industry || m.industry === industry) && (!location || String(m.location).toLowerCase().includes(location))).slice(0, 20),
    events,
    announcements: news.filter((a) => a.kind === 'event' && textMatch(q, a.title, a.text)),
    stories: stories.rows,
  });
}));

// ---------- Settings ----------

router.get('/settings', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT a.notify_prefs, a.temporary_password, a.last_login_at, m.privacy, m.email FROM member_accounts a
     JOIN members m ON m.id = a.member_id WHERE a.member_id = $1`, [me(req)]);
  res.json({ notify: prefsOf(rows[0]), privacy: privacyOf(rows[0]), temporary_password: rows[0].temporary_password,
    last_login_at: rows[0].last_login_at, email: rows[0].email, mail: mail.enabled });
}));

router.put('/settings/notifications', wrap(async (req, res) => {
  const b = req.body || {};
  const p = Object.fromEntries(Object.entries(NOTIFY).map(([k, def]) => [k, b[k] === undefined ? def : Boolean(b[k])]));
  await query('UPDATE member_accounts SET notify_prefs = $2, updated_at = now() WHERE member_id = $1', [me(req), JSON.stringify(p)]);
  res.json({ ok: true, notify: p });
}));

router.post('/password/change', loginLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  const password = String(b.password || '').trim();
  const errors = {};
  if (!(await auth.checkPassword(req.member.account_id, b.current))) errors.current = 'Your current password is not correct.';
  const problem = auth.passwordProblem(password);
  if (problem) errors.password = problem;
  else if (String(b.confirm || '').trim() !== password) errors.confirm = 'The passwords do not match.';
  if (Object.keys(errors).length) return bad(res, 'Please check the highlighted fields.', errors);
  await auth.setPassword(req.member.account_id, password);
  auth.issue(res, req, req.member); // stay signed in here; other devices are signed out
  res.json({ ok: true });
}));

module.exports = router;
module.exports.sendDocument = sendDocument;
module.exports.notify = notify;
