const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { query, tx, nextCounter } = require('../db');
const { validate, rules } = require('../validate');
const C = require('../constants');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const notFound = (res, what = 'Not found') => res.status(404).json({ error: what });
const pad = (n, len = 4) => String(n).padStart(len, '0');
const newToken = () => crypto.randomBytes(16).toString('hex');

// Form submissions: generous for real people, tight enough to stop floods.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again in a few minutes.' },
});

// Fields the public site may see. Never select email/phone of members here.
const EVENT_LIST_COLS = `id, slug, title, category, short_description, event_date, start_time, end_time,
  venue_name, image_url, members_only, registration_open`;
const MEMBER_CARD_COLS = `id, slug, full_name, designation, company, industry, location, photo_url`;
const MEMBER_PROFILE_COLS = `${MEMBER_CARD_COLS}, company_image_url, company_tagline, bio, experience, expertise,
  passion, company_about, products_services, website, offers, opportunities, collaboration_interests`;
const STORY_CARD_COLS = `id, slug, title, category, summary, image_url, members_involved, companies,
  business_category, featured, published_on`;

const isPast = (e) => e.event_date && e.event_date < todayIST();
function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

router.get('/health', wrap(async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
}));

router.get('/meta', (req, res) => {
  res.json({
    industries: C.industries,
    turnoverRanges: C.turnoverRanges,
    enquiryTypes: C.enquiryTypes,
    storyCategories: C.storyCategories,
  });
});

// ---------- Events ----------

router.get('/events', wrap(async (req, res) => {
  const when = req.query.when === 'past' ? 'past' : 'upcoming';
  const where = ['published'];
  const params = [todayIST()];
  where.push(when === 'past' ? 'event_date < $1' : '(event_date >= $1 OR event_date IS NULL)');
  if (C.eventCategories.includes(req.query.category)) {
    params.push(req.query.category);
    where.push(`category = $${params.length}`);
  }
  const year = Number(req.query.year);
  if (Number.isInteger(year) && year > 2000) {
    params.push(year);
    where.push(`extract(year FROM event_date) = $${params.length}`);
  }
  const month = Number(req.query.month);
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    params.push(month);
    where.push(`extract(month FROM event_date) = $${params.length}`);
  }
  const limit = Math.min(Number(req.query.limit) || 6, 30);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const order = when === 'past' ? 'event_date DESC' : 'event_date ASC NULLS LAST';
  const { rows } = await query(
    `SELECT ${EVENT_LIST_COLS}, count(*) OVER () AS total FROM events
     WHERE ${where.join(' AND ')} ORDER BY ${order}, id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const total = rows.length ? Number(rows[0].total) : 0;
  const years = await query(
    `SELECT DISTINCT extract(year FROM event_date)::int AS y FROM events
     WHERE published AND event_date IS NOT NULL ORDER BY y DESC`
  );
  res.json({
    items: rows.map(({ total: _t, ...e }) => e),
    total,
    years: years.rows.map((r) => r.y),
  });
}));

router.get('/events/:slug', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE slug = $1 AND published', [req.params.slug]);
  if (!rows[0]) return notFound(res, 'Event not found');
  const e = rows[0];
  delete e.created_at;
  delete e.updated_at;
  res.json({ ...e, is_past: isPast(e) });
}));

router.post('/events/:slug/register', submitLimiter, wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE slug = $1 AND published', [req.params.slug]);
  const event = rows[0];
  if (!event) return notFound(res, 'Event not found');
  if (isPast(event) || !event.registration_open) {
    return res.status(409).json({ error: 'Registration for this event is closed.' });
  }
  const data = validate(req.body, {
    full_name: rules.text({ required: true, max: 120, label: 'Full name' }),
    mobile: rules.mobile(),
    company: rules.text({ required: true, max: 160, label: 'Company name' }),
    membership_id: rules.text({ required: true, max: 40, label: 'Membership ID' }),
    email: rules.email(),
    consent: rules.checked('Please confirm your participation.'),
  });

  if (event.members_only) {
    const m = await query(
      `SELECT 1 FROM members WHERE lower(member_code) = lower($1) AND status = 'active'`,
      [data.membership_id]
    );
    if (!m.rows[0]) {
      return res.status(400).json({
        error: 'Please check the highlighted fields.',
        errors: { membership_id: 'We could not find an active HEH membership with this ID.' },
      });
    }
  }

  const result = await tx(async (client) => {
    const dup = await client.query(
      'SELECT ref FROM event_registrations WHERE event_id = $1 AND lower(membership_id) = lower($2)',
      [event.id, data.membership_id]
    );
    if (dup.rows[0]) return { duplicate: true };
    const dateKey = (event.event_date || todayIST()).replace(/-/g, '');
    const n = await nextCounter(client, `REG-${event.id}`);
    const ref = `HEH-${dateKey}-${pad(n)}`;
    const token = newToken();
    await client.query(
      `INSERT INTO event_registrations (ref, token, event_id, full_name, mobile, company, membership_id, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ref, token, event.id, data.full_name, data.mobile, data.company, data.membership_id.toUpperCase(), data.email]
    );
    return { ref, token };
  });
  if (result.duplicate) {
    return res.status(409).json({
      error: 'This membership ID is already registered for this event.',
      errors: { membership_id: 'Already registered for this event.' },
    });
  }
  res.status(201).json(result);
}));

router.get('/registrations/:ref', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT r.ref, r.full_name, r.company, r.status, r.created_at,
            e.slug AS event_slug, e.title AS event_title, e.category AS event_category, e.event_date,
            e.start_time, e.end_time, e.venue_name, e.venue_address, e.map_url
     FROM event_registrations r JOIN events e ON e.id = r.event_id
     WHERE r.ref = $1 AND r.token = $2`,
    [req.params.ref, String(req.query.t || '')]
  );
  if (!rows[0]) return notFound(res, 'Registration not found');
  res.json(rows[0]);
}));

// ---------- Contact enquiries ----------

const enquirySchema = {
  full_name: rules.text({ required: true, max: 120, label: 'Full name' }),
  mobile: rules.mobile(),
  email: rules.email({ required: true }),
  company: rules.text({ max: 160, label: 'Company name' }),
  message: rules.text({ required: true, min: 10, max: 500, label: 'Your message' }),
};

async function createEnquiry(data, memberId = null) {
  return tx(async (client) => {
    const year = todayIST().slice(0, 4);
    const n = await nextCounter(client, `ENQ-${year}`);
    const ref = `HEH-ENQ-${year}-${pad(n)}`;
    const token = newToken();
    await client.query(
      `INSERT INTO enquiries (ref, token, full_name, mobile, email, company, enquiry_type, message, member_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [ref, token, data.full_name, data.mobile, data.email, data.company, data.enquiry_type, data.message, memberId]
    );
    return { ref, token };
  });
}

router.post('/enquiries', submitLimiter, wrap(async (req, res) => {
  const data = validate(req.body, {
    ...enquirySchema,
    enquiry_type: rules.oneOf(C.enquiryTypes, { label: 'Enquiry type' }),
  });
  res.status(201).json(await createEnquiry(data));
}));

router.get('/enquiries/:ref', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT q.ref, q.full_name, q.company, q.enquiry_type, q.status, q.created_at, m.full_name AS member_name
     FROM enquiries q LEFT JOIN members m ON m.id = q.member_id
     WHERE q.ref = $1 AND q.token = $2`,
    [req.params.ref, String(req.query.t || '')]
  );
  if (!rows[0]) return notFound(res, 'Enquiry not found');
  res.json(rows[0]);
}));

// ---------- Membership applications ----------

router.post('/applications', submitLimiter, wrap(async (req, res) => {
  const thisYear = Number(todayIST().slice(0, 4));
  const data = validate(req.body, {
    full_name: rules.text({ required: true, max: 120, label: 'Full name' }),
    mobile: rules.mobile(),
    email: rules.email({ required: true }),
    designation: rules.text({ required: true, max: 120, label: 'Current designation' }),
    linkedin: rules.url({ label: 'LinkedIn profile URL' }),
    company_name: rules.text({ required: true, max: 160, label: 'Company name' }),
    business_category: rules.oneOf(C.industries, { label: 'Business category' }),
    year_established: rules.int({ min: 1900, max: thisYear, label: 'Year established' }),
    business_location: rules.text({ required: true, max: 160, label: 'Business location' }),
    website: rules.url({ label: 'Company website' }),
    turnover_range: rules.oneOf(C.turnoverRanges, { required: false, label: 'Annual turnover range' }),
    business_description: rules.text({ required: true, min: 20, max: 500, label: 'Business description' }),
    consent_accuracy: rules.checked('Please confirm the information is accurate.'),
    consent_terms: rules.checked('Please confirm you understand the membership terms.'),
  });
  const result = await tx(async (client) => {
    const year = todayIST().slice(0, 4);
    const n = await nextCounter(client, `MEM-${year}`);
    const ref = `HEH-MEM-${year}-${pad(n)}`;
    const token = newToken();
    await client.query(
      `INSERT INTO membership_applications (ref, token, full_name, mobile, email, designation, linkedin,
         company_name, business_category, year_established, business_location, website, turnover_range,
         business_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [ref, token, data.full_name, data.mobile, data.email, data.designation, data.linkedin, data.company_name,
        data.business_category, data.year_established, data.business_location, data.website,
        data.turnover_range, data.business_description]
    );
    return { ref, token };
  });
  res.status(201).json(result);
}));

router.get('/applications/:ref', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ref, full_name, company_name, business_category, status, created_at
     FROM membership_applications WHERE ref = $1 AND token = $2`,
    [req.params.ref, String(req.query.t || '')]
  );
  if (!rows[0]) return notFound(res, 'Application not found');
  res.json(rows[0]);
}));

// ---------- Members ----------

router.get('/members', wrap(async (req, res) => {
  const params = [];
  const where = [`status = 'active'`];
  if (C.industries.includes(req.query.industry)) {
    params.push(req.query.industry);
    where.push(`industry = $${params.length}`);
  }
  if (req.query.q) {
    params.push(`%${String(req.query.q).slice(0, 60)}%`);
    where.push(`(full_name ILIKE $${params.length} OR company ILIKE $${params.length})`);
  }
  const limit = Math.min(Number(req.query.limit) || 8, 40);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const { rows } = await query(
    `SELECT ${MEMBER_CARD_COLS}, count(*) OVER () AS total FROM members
     WHERE ${where.join(' AND ')} ORDER BY sort_order, full_name LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const counts = await query(
    `SELECT industry, count(*)::int AS n FROM members WHERE status = 'active' GROUP BY industry`
  );
  res.json({
    items: rows.map(({ total: _t, ...m }) => m),
    total: rows.length ? Number(rows[0].total) : 0,
    industries: Object.fromEntries(counts.rows.map((r) => [r.industry, r.n])),
  });
}));

router.get('/members/:slug', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${MEMBER_PROFILE_COLS} FROM members WHERE slug = $1 AND status = 'active'`,
    [req.params.slug]
  );
  if (!rows[0]) return notFound(res, 'Member not found');
  res.json(rows[0]);
}));

// "Send Enquiry" / "Connect Through HEH" on a member profile. HEH forwards it; member contact stays private.
router.post('/members/:slug/enquiry', submitLimiter, wrap(async (req, res) => {
  const { rows } = await query(`SELECT id FROM members WHERE slug = $1 AND status = 'active'`, [req.params.slug]);
  if (!rows[0]) return notFound(res, 'Member not found');
  const data = validate(req.body, enquirySchema);
  data.enquiry_type = 'Business Collaboration';
  res.status(201).json(await createEnquiry(data, rows[0].id));
}));

// ---------- Success stories ----------

router.get('/stories', wrap(async (req, res) => {
  const params = [];
  const where = ['published'];
  if (C.storyCategories.includes(req.query.category)) {
    params.push(req.query.category);
    where.push(`category = $${params.length}`);
  }
  if (req.query.exclude) {
    params.push(String(req.query.exclude));
    where.push(`slug <> $${params.length}`);
  }
  const limit = Math.min(Number(req.query.limit) || 6, 30);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const { rows } = await query(
    `SELECT ${STORY_CARD_COLS}, count(*) OVER () AS total FROM stories
     WHERE ${where.join(' AND ')} ORDER BY published_on DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const featured = await query(
    `SELECT ${STORY_CARD_COLS} FROM stories WHERE published AND featured ORDER BY published_on DESC LIMIT 1`
  );
  res.json({
    items: rows.map(({ total: _t, ...s }) => s),
    total: rows.length ? Number(rows[0].total) : 0,
    featured: featured.rows[0] || null,
  });
}));

router.get('/stories/:slug', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${STORY_CARD_COLS}, body FROM stories WHERE slug = $1 AND published`,
    [req.params.slug]
  );
  if (!rows[0]) return notFound(res, 'Story not found');
  res.json(rows[0]);
}));

module.exports = router;
