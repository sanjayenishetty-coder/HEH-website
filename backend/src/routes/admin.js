const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const auth = require('../auth');
const { uploadDir } = require('../config');
const C = require('../constants');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, error) => res.status(400).json({ error });

// ---------- Login ----------

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!(await auth.checkCredentials(username, password))) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  auth.issue(res, req);
  res.json({ ok: true });
}));

router.post('/logout', (req, res) => {
  auth.clear(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const s = auth.read(req);
  if (!s) return res.status(401).json({ error: 'Please sign in.' });
  res.json({ user: s.u });
});

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
      published: asBool,
    },
    listCols: `id, slug, title, category, event_date, start_time, venue_name, published, registration_open,
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
    listCols: 'id, slug, member_code, full_name, designation, company, industry, status, member_types',
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
    },
    listCols: 'id, slug, title, category, published_on, featured, published',
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

for (const [name, def] of Object.entries(resources)) {
  router.get(`/${name}`, wrap(async (req, res) => {
    const { rows } = await query(`SELECT ${def.listCols} FROM ${def.table} ORDER BY ${def.order}`);
    res.json({ items: rows });
  }));

  router.get(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const { rows } = await query(`SELECT * FROM ${def.table} WHERE id = $1`, [req.params.id]);
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
    res.status(201).json(rows[0]);
  }));

  router.put(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const data = clean(def, req.body || {});
    if (def.titleField in data && !data[def.titleField]) return bad(res, 'Name / title is required.');
    if (req.body.slug) data.slug = await uniqueSlug(def.table, slugify(req.body.slug), Number(req.params.id));
    const cols = Object.keys(data);
    if (!cols.length) return bad(res, 'Nothing to update.');
    const { rows } = await query(
      `UPDATE ${def.table} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}, updated_at = now()
       WHERE id = $${cols.length + 1} RETURNING *`,
      [...Object.values(data), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }));

  router.delete(`/${name}/:id(\\d+)`, wrap(async (req, res) => {
    const { rowCount } = await query(`DELETE FROM ${def.table} WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
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
    select: `SELECT q.*, m.full_name AS member_name FROM enquiries q LEFT JOIN members m ON m.id = q.member_id`,
    statuses: C.statuses.enquiries,
  },
  registrations: {
    table: 'event_registrations',
    select: `SELECT r.*, e.title AS event_title, e.event_date FROM event_registrations r JOIN events e ON e.id = r.event_id`,
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
    if (admin_notes !== undefined && name !== 'registrations') {
      params.push(asText(admin_notes).slice(0, 2000));
      sets.push(`admin_notes = $${params.length}`);
    }
    if (!sets.length) return bad(res, 'Nothing to update.');
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE ${def.table} SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING id, status`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }));
}

router.get('/summary', wrap(async (req, res) => {
  const { rows } = await query(`
    SELECT
      (SELECT count(*)::int FROM membership_applications WHERE status = 'received') AS new_applications,
      (SELECT count(*)::int FROM enquiries WHERE status = 'received') AS new_enquiries,
      (SELECT count(*)::int FROM event_registrations r JOIN events e ON e.id = r.event_id
        WHERE r.status = 'confirmed' AND e.event_date >= current_date) AS upcoming_registrations,
      (SELECT count(*)::int FROM events WHERE event_date >= current_date) AS upcoming_events,
      (SELECT count(*)::int FROM members WHERE status = 'active') AS active_members,
      (SELECT count(*)::int FROM stories WHERE published) AS published_stories`);
  res.json(rows[0]);
}));

router.get('/meta', (req, res) => {
  res.json({ industries: C.industries, storyCategories: C.storyCategories, eventCategories: C.eventCategories, memberTypes: C.memberTypes });
});

// Remove an uploaded file that is no longer referenced (best effort; only inside uploadDir).
router.delete('/upload', wrap(async (req, res) => {
  const url = asText(req.body?.url);
  if (!url.startsWith('/uploads/')) return bad(res, 'Not an uploaded file.');
  const file = path.join(uploadDir, path.basename(url));
  fs.rm(file, { force: true }, () => res.json({ ok: true }));
}));

module.exports = router;
