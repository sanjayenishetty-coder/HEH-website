const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const auth = require('../auth');
const mail = require('../mail');
const config = require('../config');
const { uploadDir } = config;
const C = require('../constants');
const activity = require('../activity');
const approval = require('../eventapproval');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, error) => res.status(400).json({ error });

// ---------- Sign-in, security codes, password reset, Google ----------
// Screens: web/src/admin/Login.jsx (designs in images/Admin Login/.../Modified Login Page Designs).

const limiter = (limit, error) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error },
});
const loginLimiter = limiter(10, 'Too many sign-in attempts. Try again in 15 minutes.');
const codeLimiter = limiter(20, 'Too many attempts. Try again in 15 minutes.');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function sendCode(email, kind, code) {
  const verify = kind === 'verify';
  await mail.send(email, verify ? 'Verify your email – HEH Portal' : 'Your HEH Portal security code', {
    title: verify ? 'Verify your email' : 'Security verification',
    lines: [
      `Enter this 6-digit code to ${verify ? 'verify your email address and ' : ''}finish signing in to the HEH Portal:`,
      'The code expires in 10 minutes. If you did not try to sign in, change your password.',
    ],
    code,
  });
}

// Which sign-in options this server has set up (the login page hides the rest).
router.get('/auth-options', (req, res) => {
  res.json({ google: config.googleClientId || null, mail: mail.enabled });
});

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const admin = await auth.checkCredentials(username, password);
  if (!admin) return res.status(401).json({ error: 'Incorrect username or password.' });

  // With email set up: verify the address once, then (if ADMIN_LOGIN_CODE=1) a code at every sign-in.
  const step = mail.enabled && admin.email
    ? (!admin.email_verified_at ? 'verify' : config.adminLoginCode ? 'login' : null)
    : null;
  if (step) {
    const { token, code } = await auth.createToken(admin.id, step);
    try {
      await sendCode(admin.email, step, code);
      return res.json({ step, token, email: auth.maskEmail(admin.email) });
    } catch (err) {
      console.error(new Date().toISOString(), 'admin code email failed', err.message);
      // Verifying the address is not a security gate, so a mail problem must not lock the admin out.
      if (step === 'login') return res.status(502).json({ error: 'Could not send the security code. Please try again shortly.' });
    }
  }
  auth.issue(res, req, admin);
  res.json({ ok: true });
}));

router.post('/login/code', codeLimiter, wrap(async (req, res) => {
  const { token, code } = req.body || {};
  const row = await auth.findToken(token, ['login', 'verify']);
  if (!row) return res.status(400).json({ error: 'This code has expired. Please sign in again.', expired: true });
  const result = await auth.checkCode(row, String(code || '').replace(/\D/g, ''));
  if (result === 'locked') return res.status(400).json({ error: 'Too many incorrect codes. Please sign in again.', expired: true });
  if (result === 'wrong') return res.status(400).json({ error: 'Incorrect code. Please check the code and try again.' });
  if (row.kind === 'verify') await query('UPDATE admin_users SET email_verified_at = now(), updated_at = now() WHERE id = $1', [row.admin_id]);
  auth.issue(res, req, { id: row.admin_id, username: row.username });
  res.json({ ok: true });
}));

router.post('/login/resend', codeLimiter, wrap(async (req, res) => {
  const row = await auth.findToken((req.body || {}).token, ['login', 'verify']);
  if (!row) return res.status(400).json({ error: 'This code has expired. Please sign in again.', expired: true });
  if (Date.now() - new Date(row.sent_at).getTime() < 30 * 1000) {
    return res.status(429).json({ error: 'Please wait 30 seconds before asking for another code.' });
  }
  await sendCode(row.email, row.kind, await auth.renewCode(row));
  res.json({ ok: true, email: auth.maskEmail(row.email) });
}));

router.post('/password/forgot', loginLimiter, wrap(async (req, res) => {
  const email = String((req.body || {}).email || '').trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.', errors: { email: 'Enter a valid email address.' } });
  if (!mail.enabled) return res.status(503).json({ error: 'Password reset by email is not set up yet. Please contact the site administrator.' });
  const admin = await auth.findAdmin(email);
  // Same answer whether or not the address belongs to an admin, so this can't be used to find accounts.
  if (admin && admin.email && admin.email.toLowerCase() === email.toLowerCase()) {
    const { token } = await auth.createToken(admin.id, 'reset');
    const url = `${config.siteUrl}/admin/?reset=${encodeURIComponent(token)}`;
    await mail.send(admin.email, 'Reset your HEH Portal password', {
      title: 'Reset your password',
      lines: [
        'We received a request to reset the password for your HEH Portal account. Use the button below to choose a new password:',
        'This link expires in 30 minutes and can be used once. If you did not ask for this, you can ignore this email; your password will not change.',
      ],
      button: { text: 'Reset Password', url },
    }).catch((err) => console.error(new Date().toISOString(), 'reset email failed', err.message));
  }
  res.json({ ok: true, email: auth.maskEmail(email) });
}));

// The reset page checks its link before showing the form.
router.post('/password/reset/check', codeLimiter, wrap(async (req, res) => {
  const row = await auth.findToken((req.body || {}).token, ['reset']);
  if (!row) return res.status(400).json({ error: 'This reset link has expired or has already been used. Please request a new one.' });
  res.json({ ok: true });
}));

router.post('/password/reset', codeLimiter, wrap(async (req, res) => {
  const { token } = req.body || {};
  const password = String((req.body || {}).password || '').trim();
  const confirm = String((req.body || {}).confirm || '').trim();
  const row = await auth.findToken(token, ['reset']);
  if (!row) return res.status(400).json({ error: 'This reset link has expired or has already been used. Please request a new one.' });
  const errors = {};
  if (password.length < 8 || password.length > 200 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
    errors.password = 'Use at least 8 characters with letters and numbers.';
  } else if (confirm !== password) {
    errors.confirm = 'The passwords do not match.';
  }
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
  await auth.setPassword(row.admin_id, password);
  res.json({ ok: true });
}));

// Google: the browser gets an access token from Google's popup; we ask Google which app and account it is for.
router.post('/login/google', loginLimiter, wrap(async (req, res) => {
  if (!config.googleClientId) return res.status(404).json({ error: 'Google sign-in is not set up.' });
  const accessToken = String((req.body || {}).access_token || '');
  if (!accessToken) return bad(res, 'Google sign-in failed. Please try again.');
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  const info = r.ok ? await r.json() : {};
  if (info.aud !== config.googleClientId || String(info.email_verified) !== 'true' || !info.email) {
    return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
  const admin = await auth.findAdmin(info.email);
  if (!admin || String(admin.email || '').toLowerCase() !== info.email.toLowerCase()) {
    return res.status(403).json({ error: `${info.email} is not an HEH admin account.` });
  }
  auth.issue(res, req, admin);
  res.json({ ok: true });
}));

router.post('/logout', (req, res) => {
  auth.clear(res);
  res.json({ ok: true });
});

router.get('/me', wrap(async (req, res) => {
  const admin = await auth.session(req);
  if (!admin) return res.status(401).json({ error: 'Please sign in.' });
  res.json({ user: admin.username });
}));

router.use(auth.requireAdmin);

// ---------- Uploads ----------

fs.mkdirSync(uploadDir, { recursive: true });
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype])),
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return bad(res, 'Upload a JPG, PNG or WebP image up to 5 MB.');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Content CRUD (events, members, stories) ----------

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

const asText = (v) => (v == null ? '' : String(v).trim());
const asBool = (v) => v === true || v === 'true' || v === 'on' || v === 1;
const asDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(asText(v)) ? asText(v) : null);
const asTime = (v) => (/^\d{2}:\d{2}(:\d{2})?$/.test(asText(v)) ? asText(v) : null);
const asJsonArray = (v) => JSON.stringify(Array.isArray(v) ? v : []);
const asJsonObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((x) => asText(x)) ? JSON.stringify(v) : null);
const asInt = (v) => (Number.isInteger(Number(v)) ? Number(v) : 0);
const asCapacity = (v) => (asText(v) !== '' && Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const asId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const asImage = (v) => {
  const s = asText(v);
  // /uploads/ = uploaded in admin; /assets/ = shipped with the site (e.g. core team photos)
  return s === '' || s.startsWith('/uploads/') || s.startsWith('/assets/') || /^https:\/\//i.test(s) ? s : '';
};
const asUrl = (v) => {
  const s = asText(v);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const resources = {
  events: {
    table: 'events',
    order: 'event_date DESC NULLS FIRST, id DESC',
    titleField: 'title',
    fields: {
      title: asText, category: (v) => (C.eventCategories.includes(v) ? v : 'spotlight'),
      short_description: asText, description: asText, summary: asText,
      event_date: asDate, start_time: asTime, end_time: asTime,
      venue_name: asText, venue_address: asText, map_url: asUrl, image_url: asImage,
      members_only: asBool, registration_open: asBool,
      agenda: asJsonArray, speaker: asJsonObject, featured: asJsonObject, takeaways: asJsonArray, photos: asJsonArray,
      videos: (v) => JSON.stringify((Array.isArray(v) ? v : []).map((x) => ({ title: asText(x && x.title), url: asUrl(x && x.url) })).filter((x) => x.url)),
      published: asBool,
      coordinator: asText, city: asText, capacity: asCapacity,
      registration_opens: asDate, registration_closes: asDate,
      approval_mode: (v) => (v === 'manual' ? 'manual' : 'auto'),
    },
    // Working Committee events (Member Portal) and who reviewed them, for the approval box in the editor.
    detailCols: '(SELECT full_name FROM members m WHERE m.id = events.submitted_by) AS submitted_by_name',
    listCols: `id, slug, title, category, event_date, start_time, end_time, venue_name, image_url, short_description, published, registration_open,
      capacity, approval_mode, coordinator, approval_status, submitted_by, submitted_at,
      (SELECT full_name FROM members m WHERE m.id = events.submitted_by) AS submitted_by_name,
      (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status = 'pending') AS pending,
      (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status <> 'cancelled') AS registrations`,
  },
  members: {
    table: 'members',
    order: 'sort_order, full_name',
    titleField: 'full_name',
    fields: {
      member_code: (v) => asText(v).toUpperCase(), full_name: asText, designation: asText, company: asText,
      industry: (v) => (C.industries.includes(v) ? v : 'Other Services'), location: asText,
      photo_url: asImage, company_image_url: asImage, company_tagline: asText,
      bio: asText, experience: asText, expertise: asText, passion: asText,
      company_about: asText, products_services: asText, website: asUrl,
      offers: asJsonArray, opportunities: asJsonArray, collaboration_interests: asJsonArray,
      email: asText, phone: asText, status: (v) => (v === 'inactive' ? 'inactive' : 'active'), sort_order: asInt,
      member_types: (v) => JSON.stringify(C.memberTypes.map(([k]) => k).filter((k) => Array.isArray(v) && v.includes(k))),
      team_role: asText, team_order: asInt,
    },
    listCols: 'id, slug, member_code, full_name, designation, company, industry, status, member_types, photo_url, created_at',
  },
  stories: {
    table: 'stories',
    order: 'published_on DESC, id DESC',
    titleField: 'title',
    fields: {
      title: asText, category: (v) => (C.storyCategories.includes(v) ? v : C.storyCategories[0]),
      summary: asText, body: asText, image_url: asImage,
      members_involved: asJsonArray, companies: asJsonArray, business_category: asText,
      featured: asBool, published_on: (v) => asDate(v) || new Date().toISOString().slice(0, 10), published: asBool,
      member_id: asId, publish_permission: asBool,
    },
    listCols: `id, slug, title, category, published_on, featured, published, archived, image_url, members_involved, member_id, created_at, updated_at,
      (SELECT full_name FROM members m WHERE m.id = stories.member_id) AS member_name`,
  },
};

function clean(def, body) {
  const out = {};
  for (const [field, fn] of Object.entries(def.fields)) {
    if (body[field] !== undefined) out[field] = fn(body[field]);
  }
  return out;
}

async function uniqueSlug(table, base, excludeId = 0) {
  let slug = base;
  for (let i = 2; ; i++) {
    const { rows } = await query(`SELECT 1 FROM ${table} WHERE slug = $1 AND id <> $2`, [slug, excludeId]);
    if (!rows[0]) return slug;
    slug = `${base}-${i}`;
  }
}

const SINGLE = { events: 'Event', members: 'Member', stories: 'Story' };

for (const [name, def] of Object.entries(resources)) {
  router.get(`/${name}`, wrap(async (req, res) => {
    const { rows } = await query(`SELECT ${def.listCols} FROM ${def.table} ORDER BY ${def.order}`);
    res.json({ items: rows });
  }));

  router.get(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const { rows } = await query(`SELECT *${def.detailCols ? `, ${def.detailCols}` : ''} FROM ${def.table} WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }));

  router.post(`/${name}`, wrap(async (req, res) => {
    const data = clean(def, req.body || {});
    if (!data[def.titleField]) return bad(res, 'Name / title is required.');
    if (name === 'members' && !data.member_code) return bad(res, 'Membership ID is required.');
    data.slug = await uniqueSlug(def.table, slugify(req.body.slug || data[def.titleField]));
    const cols = Object.keys(data);
    const { rows } = await query(
      `INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      Object.values(data)
    );
    await activity.log(req, name, `${SINGLE[name]} Created`, { id: rows[0].id, ref: rows[0][def.titleField] });
    res.status(201).json(rows[0]);
  }));

  router.put(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const data = clean(def, req.body || {});
    if (def.titleField in data && !data[def.titleField]) return bad(res, 'Name / title is required.');
    if (req.body.slug) data.slug = await uniqueSlug(def.table, slugify(req.body.slug), Number(req.params.id));
    // Publishing an event that is waiting for approval approves it (src/eventapproval.js tells the member).
    if (name === 'events' && data.published) {
      const cur = await query('SELECT approval_status FROM events WHERE id = $1', [req.params.id]);
      if (cur.rows[0] && cur.rows[0].approval_status !== 'approved') {
        await approval.approve(Number(req.params.id), `${req.admin.username} (Admin)`);
        await activity.log(req, 'events', 'Event Approved', { id: Number(req.params.id), ref: data.title || '' });
      }
    }
    const cols = Object.keys(data);
    if (!cols.length) return bad(res, 'Nothing to update.');
    const { rows } = await query(
      `UPDATE ${def.table} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}, updated_at = now()
       WHERE id = $${cols.length + 1} RETURNING *`,
      [...Object.values(data), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await activity.log(req, name, `${SINGLE[name]} Updated`, { id: rows[0].id, ref: rows[0][def.titleField] });
    res.json(rows[0]);
  }));

  router.delete(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const { rows } = await query(`DELETE FROM ${def.table} WHERE id = $1 RETURNING id, ${def.titleField} AS title`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await activity.log(req, name, `${SINGLE[name]} Deleted`, { id: rows[0].id, ref: rows[0].title });
    res.json({ ok: true });
  }));
}

// ---------- Submissions (applications, enquiries, registrations) ----------

const submissions = {
  applications: {
    table: 'membership_applications',
    select: 'SELECT a.* FROM membership_applications a',
    statuses: C.statuses.applications,
  },
  enquiries: {
    table: 'enquiries',
    select: `SELECT q.*, m.full_name AS member_name, a.username AS assigned_name
      FROM enquiries q LEFT JOIN members m ON m.id = q.member_id LEFT JOIN admin_users a ON a.id = q.assigned_to`,
    statuses: C.statuses.enquiries,
  },
  registrations: {
    table: 'event_registrations',
    select: `SELECT r.*, e.title AS event_title, e.event_date, e.category AS event_category FROM event_registrations r JOIN events e ON e.id = r.event_id`,
    statuses: C.statuses.registrations,
  },
};

for (const [name, def] of Object.entries(submissions)) {
  router.get(`/${name}`, wrap(async (req, res) => {
    const params = [];
    const where = [];
    const alias = def.select.match(/FROM \w+ (\w)/)[1];
    if (def.statuses.includes(req.query.status)) {
      params.push(req.query.status);
      where.push(`${alias}.status = $${params.length}`);
    }
    if (name === 'registrations' && Number(req.query.event_id)) {
      params.push(Number(req.query.event_id));
      where.push(`r.event_id = $${params.length}`);
    }
    const { rows } = await query(
      `${def.select} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${alias}.created_at DESC LIMIT 500`,
      params
    );
    res.json({ items: rows.map(({ token: _t, ...r }) => r), statuses: def.statuses });
  }));

  router.patch(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const { status, admin_notes } = req.body || {};
    const sets = [];
    const params = [];
    if (status !== undefined) {
      if (!def.statuses.includes(status)) return bad(res, 'Unknown status.');
      params.push(status);
      sets.push(`status = $${params.length}`);
    }
    if (admin_notes !== undefined) {
      params.push(asText(admin_notes).slice(0, 2000));
      sets.push(`admin_notes = $${params.length}`);
    }
    if (!sets.length) return bad(res, 'Nothing to update.');
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE ${def.table} SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING id, ref, status`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await activity.log(req, name, status !== undefined ? 'Status Changed' : 'Notes Updated', {
      id: rows[0].id, ref: rows[0].ref, details: status !== undefined ? `Status set to ${status.replace('_', ' ')}` : '',
    });
    res.json(rows[0]);
  }));
}

// Dashboard: counts for the cards, upcoming events, latest applications and a recent-activity feed.
router.get('/summary', wrap(async (req, res) => {
  const [counts, events, applications, activity] = await Promise.all([
    query(`
      SELECT
        (SELECT count(*)::int FROM membership_applications WHERE status = 'received') AS new_applications,
        (SELECT count(*)::int FROM membership_applications WHERE status IN ('received', 'under_review', 'interaction')) AS pending_applications,
        (SELECT count(*)::int FROM enquiries WHERE status = 'received') AS new_enquiries,
        (SELECT count(*)::int FROM enquiries WHERE status IN ('received', 'in_progress')) AS open_enquiries,
        (SELECT count(*)::int FROM event_registrations r JOIN events e ON e.id = r.event_id
          WHERE r.status = 'confirmed' AND e.event_date >= current_date) AS upcoming_registrations,
        (SELECT count(*)::int FROM event_registrations WHERE status = 'confirmed' AND created_at > now() - interval '7 days') AS recent_registrations,
        (SELECT count(*)::int FROM event_registrations WHERE status = 'pending') AS pending_registrations,
        (SELECT count(*)::int FROM events WHERE event_date >= current_date) AS upcoming_events,
        (SELECT count(*)::int FROM members WHERE status = 'active') AS active_members,
        (SELECT count(*)::int FROM stories WHERE published) AS published_stories`),
    query(`
      SELECT id, slug, title, category, event_date, start_time, end_time, venue_name, image_url, published,
        (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status <> 'cancelled') AS registrations
      FROM events WHERE event_date >= current_date ORDER BY event_date, start_time LIMIT 3`),
    query(`
      SELECT id, ref, full_name, company_name, business_category, status, created_at
      FROM membership_applications ORDER BY created_at DESC LIMIT 5`),
    query(`
      SELECT * FROM (
        SELECT 'application' AS kind, full_name AS who, company_name AS detail, created_at AS at FROM membership_applications
        UNION ALL SELECT 'enquiry', full_name, enquiry_type, created_at FROM enquiries
        UNION ALL SELECT 'registration', r.full_name, e.title, r.created_at FROM event_registrations r JOIN events e ON e.id = r.event_id
        UNION ALL SELECT 'event', title, venue_name, created_at FROM events
        UNION ALL SELECT 'member', full_name, company, created_at FROM members
      ) a ORDER BY at DESC LIMIT 6`),
  ]);
  res.json({ ...counts.rows[0], events: events.rows, applications: applications.rows, activity: activity.rows });
}));

router.get('/meta', (req, res) => {
  res.json({
    industries: C.industries, storyCategories: C.storyCategories, eventCategories: C.eventCategories, memberTypes: C.memberTypes,
    enquiryTypes: C.enquiryTypes, statuses: C.statuses,
    registrationRejectReasons: C.registrationRejectReasons, registrationCancelReasons: C.registrationCancelReasons,
    enquiryPriorities: C.enquiryPriorities, enquiryChannels: C.enquiryChannels, enquiryOutcomes: C.enquiryOutcomes,
    enquiryCloseReasons: C.enquiryCloseReasons, enquiryReopenReasons: C.enquiryReopenReasons,
    storyArchiveReasons: C.storyArchiveReasons, reportTypes: C.reportTypes, mail: mail.enabled,
  });
});

// Part2 workflows (approve / assign / publish / archive, reports).
router.use(require('./workflows'));
router.use(require('./portal-admin'));

// Remove an uploaded file that is no longer referenced (best effort; only inside uploadDir).
router.delete('/upload', wrap(async (req, res) => {
  const url = asText(req.body?.url);
  if (!url.startsWith('/uploads/')) return bad(res, 'Not an uploaded file.');
  const file = path.join(uploadDir, path.basename(url));
  fs.rm(file, { force: true }, () => res.json({ ok: true }));
}));

module.exports = router;
