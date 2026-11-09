// Admin workflows from the Part2 designs (images/Part2): registration approve / reject / cancel, enquiry assignment,
// responses and close / reopen, success-story publish / archive, event publishing, reports and export history.
// Mounted inside routes/admin.js after sign-in is checked, so req.admin is the signed-in account.
const express = require('express');
const { query } = require('../db');
const activity = require('../activity');
const mail = require('../mail');
const C = require('../constants');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, error, errors) => res.status(400).json({ error, ...(errors ? { errors } : {}) });
const notFound = (res) => res.status(404).json({ error: 'Not found' });
const text = (v, max = 2000) => (v == null ? '' : String(v).trim().slice(0, max));
const asDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(text(v)) ? text(v) : null);
const asBool = (v) => v === true || v === 'true' || v === 'on' || v === 1;
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const noToken = ({ token: _t, ...row }) => row;

// Email to a participant / enquirer. Returns true when sent; a mail problem never fails the action.
async function notify(to, subject, title, message) {
  const lines = String(message || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (!to || !mail.enabled || !lines.length) return false;
  try {
    await mail.send(to, subject, { title, lines });
    return true;
  } catch (err) {
    console.error(new Date().toISOString(), 'notification email failed', err.message);
    return false;
  }
}

// ---------- Activity history and admin accounts ----------

router.get('/activity', wrap(async (req, res) => {
  res.json({ items: await activity.list({ module: req.query.module, id: req.query.id, limit: req.query.limit }) });
}));

// Accounts an enquiry can be assigned to.
router.get('/admins', wrap(async (req, res) => {
  const { rows } = await query('SELECT id, username, email FROM admin_users ORDER BY lower(username)');
  res.json({ items: rows });
}));

// ---------- Registrations ----------

const REGISTRATION = `
  SELECT r.*, e.title AS event_title, e.slug AS event_slug, e.category AS event_category, e.event_date, e.start_time, e.end_time,
    e.venue_name, e.city AS event_city, e.capacity, e.approval_mode, e.members_only, e.registration_open, e.published AS event_published,
    (SELECT count(*)::int FROM event_registrations x WHERE x.event_id = r.event_id AND x.status IN ('confirmed', 'attended')) AS confirmed_count,
    m.id AS member_id, m.status AS member_status, m.full_name AS member_name, m.member_types
  FROM event_registrations r
  JOIN events e ON e.id = r.event_id
  LEFT JOIN members m ON lower(m.member_code) = lower(r.membership_id)
  WHERE r.id = $1`;

async function getRegistration(id) {
  const { rows } = await query(REGISTRATION, [id]);
  return rows[0] ? noToken(rows[0]) : null;
}

router.get('/registrations/:id(\\d+)', wrap(async (req, res) => {
  const r = await getRegistration(req.params.id);
  if (!r) return notFound(res);
  res.json({ ...r, activity: await activity.list({ module: 'registrations', id: r.id, limit: 50 }) });
}));

// Change a registration's status; `from` lists the statuses it may change from.
async function changeRegistration(req, res, { from, to, action, reasonRequired, defaultMessage }) {
  const r = await getRegistration(req.params.id);
  if (!r) return notFound(res);
  if (!from.includes(r.status)) return bad(res, `This registration is ${r.status.replace('_', ' ')}, so it can’t be ${action.toLowerCase()}.`);
  const b = req.body || {};
  const reason = text(b.reason, 200);
  const remarks = text(b.remarks, 500);
  if (reasonRequired && !reason) return bad(res, 'Please check the highlighted fields.', { reason: 'Select a reason.' });
  if (to === 'confirmed' && r.capacity && r.confirmed_count >= r.capacity) {
    return bad(res, `This event is full (${r.capacity} participants). Increase the capacity in the event settings to approve more.`);
  }
  await query(
    `UPDATE event_registrations SET status = $2, status_reason = $3, admin_notes = CASE WHEN $4 = '' THEN admin_notes ELSE $4 END, updated_at = now()
     WHERE id = $1`,
    [r.id, to, reason, remarks],
  );
  // Members who registered from the portal also see it there.
  if (r.member_id) {
    await require('./member').notify(r.member_id, 'event', `Registration ${action}`, `${eventLine(r)}${reason ? ` – ${reason}` : ''}`, `events/registrations/${r.ref}`);
  }
  const send = b.notify === undefined ? true : asBool(b.notify);
  const message = text(b.message, 3000) || defaultMessage(r, reason);
  const mailed = send && (await notify(r.email, `${action}: ${r.event_title}`, `Registration ${action.toLowerCase()}`, message));
  await activity.log(req, 'registrations', `Registration ${action}`, {
    id: r.id, ref: r.ref,
    details: [`${r.full_name} – ${r.event_title}`, reason && `Reason: ${reason}`, remarks && `Remarks: ${remarks}`, mailed && 'Participant notified by email'].filter(Boolean).join('. '),
  });
  res.json({ ...(await getRegistration(r.id)), mailed });
}

const eventLine = (r) => `${r.event_title}${r.event_date ? ` on ${r.event_date}` : ''}`;

router.post('/registrations/:id(\\d+)/approve', wrap((req, res) => changeRegistration(req, res, {
  from: ['pending'], to: 'confirmed', action: 'Approved',
  defaultMessage: (r) => `Dear ${r.full_name},\n\nYour registration ${r.ref} for ${eventLine(r)} has been approved. We look forward to welcoming you.\n\nRegards,\nHEH Events Team`,
})));

router.post('/registrations/:id(\\d+)/reject', wrap((req, res) => changeRegistration(req, res, {
  from: ['pending'], to: 'rejected', action: 'Rejected', reasonRequired: true,
  defaultMessage: (r) => `Dear ${r.full_name},\n\nThank you for your interest in ${r.event_title}. We regret to inform you that your registration ${r.ref} could not be confirmed.\n\nRegards,\nHEH Events Team`,
})));

router.post('/registrations/:id(\\d+)/cancel', wrap((req, res) => changeRegistration(req, res, {
  from: ['pending', 'confirmed'], to: 'cancelled', action: 'Cancelled', reasonRequired: true,
  defaultMessage: (r) => `Dear ${r.full_name},\n\nThis is to confirm that your registration ${r.ref} for ${eventLine(r)} has been cancelled.\n\nRegards,\nHEH Events Team`,
})));

router.post('/registrations/:id(\\d+)/attended', wrap(async (req, res) => {
  const r = await getRegistration(req.params.id);
  if (!r) return notFound(res);
  if (r.status !== 'confirmed') return bad(res, 'Only confirmed registrations can be marked as attended.');
  await query(`UPDATE event_registrations SET status = 'attended', checked_in_at = coalesce(checked_in_at, now()), updated_at = now() WHERE id = $1`, [r.id]);
  await activity.log(req, 'registrations', 'Marked as Attended', { id: r.id, ref: r.ref, details: `${r.full_name} – ${r.event_title}` });
  res.json(await getRegistration(r.id));
}));

// ---------- Enquiries ----------

const ENQUIRY = `
  SELECT q.*, m.full_name AS member_name, a.username AS assigned_name
  FROM enquiries q LEFT JOIN members m ON m.id = q.member_id LEFT JOIN admin_users a ON a.id = q.assigned_to
  WHERE q.id = $1`;

async function getEnquiry(id) {
  const { rows } = await query(ENQUIRY, [id]);
  return rows[0] ? noToken(rows[0]) : null;
}

router.get('/enquiries/:id(\\d+)', wrap(async (req, res) => {
  const q = await getEnquiry(req.params.id);
  if (!q) return notFound(res);
  const responses = await query('SELECT * FROM enquiry_responses WHERE enquiry_id = $1 ORDER BY contacted_at DESC, id DESC', [q.id]);
  res.json({ ...q, responses: responses.rows, activity: await activity.list({ module: 'enquiries', id: q.id, limit: 50 }) });
}));

router.post('/enquiries/:id(\\d+)/assign', wrap(async (req, res) => {
  const q = await getEnquiry(req.params.id);
  if (!q) return notFound(res);
  if (q.status === 'closed') return bad(res, 'This enquiry is closed. Reopen it before assigning it.');
  const b = req.body || {};
  const admin = (await query('SELECT id, username FROM admin_users WHERE id = $1', [Number(b.assigned_to) || 0])).rows[0];
  const errors = {};
  if (!admin) errors.assigned_to = 'Select an administrator.';
  if (!C.enquiryPriorities.includes(b.priority)) errors.priority = 'Select a priority.';
  if (Object.keys(errors).length) return bad(res, 'Please check the highlighted fields.', errors);
  await query(
    `UPDATE enquiries SET assigned_to = $2, assigned_at = now(), priority = $3, follow_up_date = $4, follow_up_notes = $5,
       status = CASE WHEN status = 'received' THEN 'in_progress' ELSE status END, updated_at = now()
     WHERE id = $1`,
    [q.id, admin.id, b.priority, asDate(b.follow_up_date), text(b.instructions, 500)],
  );
  await activity.log(req, 'enquiries', q.assigned_to ? 'Enquiry Reassigned' : 'Enquiry Assigned', {
    id: q.id, ref: q.ref, details: `Assigned to ${admin.username} (${b.priority} priority)${asDate(b.follow_up_date) ? `, follow up on ${b.follow_up_date}` : ''}`,
  });
  res.json(await getEnquiry(q.id));
}));

// datetime-local value ("2026-10-29T11:30") entered in India time.
const asIndiaTime = (v) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text(v)) ? `${text(v)}:00+05:30` : null);

router.post('/enquiries/:id(\\d+)/responses', wrap(async (req, res) => {
  const q = await getEnquiry(req.params.id);
  if (!q) return notFound(res);
  const b = req.body || {};
  const errors = {};
  if (!C.enquiryChannels.includes(b.channel)) errors.channel = 'Select how the enquirer was contacted.';
  const at = asIndiaTime(b.contacted_at);
  if (!at) errors.contacted_at = 'Enter the date and time.';
  if (!text(b.summary)) errors.summary = 'Enter a short summary of the response.';
  if (!C.enquiryOutcomes.includes(b.outcome)) errors.outcome = 'Select the outcome.';
  const followUp = asBool(b.follow_up_required);
  if (followUp && !asDate(b.next_follow_up)) errors.next_follow_up = 'Select the next follow-up date.';
  if (Object.keys(errors).length) return bad(res, 'Please check the highlighted fields.', errors);
  await query(
    `INSERT INTO enquiry_responses (enquiry_id, channel, contacted_at, summary, outcome, follow_up_required, next_follow_up, instructions, admin_id, admin_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [q.id, b.channel, at, text(b.summary, 1000), b.outcome, followUp, followUp ? asDate(b.next_follow_up) : null, text(b.instructions, 500), req.admin.id, req.admin.username],
  );
  await query(
    `UPDATE enquiries SET status = CASE WHEN status = 'received' THEN 'in_progress' ELSE status END,
       follow_up_date = CASE WHEN $2 THEN $3::date ELSE follow_up_date END, updated_at = now() WHERE id = $1`,
    [q.id, followUp, followUp ? asDate(b.next_follow_up) : null],
  );
  await activity.log(req, 'enquiries', 'Response Recorded', { id: q.id, ref: q.ref, details: `${b.channel}: ${b.outcome}${followUp ? `. Follow up on ${b.next_follow_up}` : ''}` });
  res.status(201).json(await getEnquiry(q.id));
}));

router.post('/enquiries/:id(\\d+)/close', wrap(async (req, res) => {
  const q = await getEnquiry(req.params.id);
  if (!q) return notFound(res);
  if (q.status === 'closed') return bad(res, 'This enquiry is already closed.');
  const b = req.body || {};
  if (!C.enquiryCloseReasons.includes(b.reason)) return bad(res, 'Please check the highlighted fields.', { reason: 'Select a reason.' });
  await query(`UPDATE enquiries SET status = 'closed', close_reason = $2, closed_at = now(), updated_at = now() WHERE id = $1`, [q.id, b.reason]);
  await activity.log(req, 'enquiries', 'Enquiry Closed', { id: q.id, ref: q.ref, details: [`Reason: ${b.reason}`, text(b.remarks) && `Remarks: ${text(b.remarks, 500)}`].filter(Boolean).join('. ') });
  res.json(await getEnquiry(q.id));
}));

router.post('/enquiries/:id(\\d+)/reopen', wrap(async (req, res) => {
  const q = await getEnquiry(req.params.id);
  if (!q) return notFound(res);
  if (q.status !== 'closed') return bad(res, 'Only closed enquiries can be reopened.');
  const b = req.body || {};
  if (!C.enquiryReopenReasons.includes(b.reason)) return bad(res, 'Please check the highlighted fields.', { reason: 'Select a reason.' });
  await query(`UPDATE enquiries SET status = 'in_progress', closed_at = NULL, updated_at = now() WHERE id = $1`, [q.id]);
  await activity.log(req, 'enquiries', 'Enquiry Reopened', { id: q.id, ref: q.ref, details: [`Reason: ${b.reason}`, text(b.remarks) && `Remarks: ${text(b.remarks, 500)}`].filter(Boolean).join('. ') });
  res.json(await getEnquiry(q.id));
}));

// ---------- Success stories ----------

// What a story needs before it can be published (Review & Publication checklist).
function storyReadiness(s) {
  return [
    ['Story title & category', Boolean(s.title && s.category)],
    ['Featured HEH entrepreneur', Boolean(s.member_id || (s.members_involved || []).length)],
    ['Story content (summary & details)', Boolean(s.summary && s.body)],
    ['Featured photograph', Boolean(s.image_url)],
    ['Publication permission', Boolean(s.publish_permission)],
  ];
}

async function getStory(id) {
  const { rows } = await query(
    `SELECT s.*, m.full_name AS member_name, m.company AS member_company, m.designation AS member_designation, m.photo_url AS member_photo
     FROM stories s LEFT JOIN members m ON m.id = s.member_id WHERE s.id = $1`,
    [id],
  );
  return rows[0] ? { ...rows[0], readiness: storyReadiness(rows[0]) } : null;
}

router.get('/stories/:id(\\d+)/full', wrap(async (req, res) => {
  const s = await getStory(req.params.id);
  if (!s) return notFound(res);
  res.json({ ...s, activity: await activity.list({ module: 'stories', id: s.id, limit: 100 }) });
}));

router.post('/stories/:id(\\d+)/publish', wrap(async (req, res) => {
  const s = await getStory(req.params.id);
  if (!s) return notFound(res);
  const missing = s.readiness.filter(([, ok]) => !ok).map(([k]) => k);
  if (missing.length) return bad(res, `Not ready for publication. Still needed: ${missing.join(', ')}.`);
  await query(
    `UPDATE stories SET published = true, archived = false, archived_at = NULL,
       published_on = CASE WHEN published THEN published_on ELSE current_date END, updated_at = now() WHERE id = $1`,
    [s.id],
  );
  await activity.log(req, 'stories', 'Story Published', { id: s.id, ref: s.title, details: 'Published on the HEH website' });
  res.json(await getStory(s.id));
}));

router.post('/stories/:id(\\d+)/unpublish', wrap(async (req, res) => {
  const s = await getStory(req.params.id);
  if (!s) return notFound(res);
  await query('UPDATE stories SET published = false, updated_at = now() WHERE id = $1', [s.id]);
  await activity.log(req, 'stories', 'Story Unpublished', { id: s.id, ref: s.title, details: 'Moved back to draft' });
  res.json(await getStory(s.id));
}));

router.post('/stories/:id(\\d+)/archive', wrap(async (req, res) => {
  const s = await getStory(req.params.id);
  if (!s) return notFound(res);
  if (s.archived) return bad(res, 'This story is already archived.');
  const b = req.body || {};
  if (!C.storyArchiveReasons.includes(b.reason)) return bad(res, 'Please check the highlighted fields.', { reason: 'Select a reason.' });
  await query(
    `UPDATE stories SET archived = true, published = false, archive_reason = $2, archived_at = now(), updated_at = now() WHERE id = $1`,
    [s.id, b.reason],
  );
  await activity.log(req, 'stories', 'Story Archived', { id: s.id, ref: s.title, details: [`Reason: ${b.reason}`, text(b.notes) && `Notes: ${text(b.notes, 500)}`].filter(Boolean).join('. ') });
  res.json(await getStory(s.id));
}));

router.post('/stories/:id(\\d+)/restore', wrap(async (req, res) => {
  const s = await getStory(req.params.id);
  if (!s) return notFound(res);
  await query('UPDATE stories SET archived = false, archived_at = NULL, updated_at = now() WHERE id = $1', [s.id]);
  await activity.log(req, 'stories', 'Story Restored', { id: s.id, ref: s.title, details: 'Restored from the archive as a draft' });
  res.json(await getStory(s.id));
}));

// ---------- Events ----------

for (const [path, published, action] of [['publish', true, 'Event Published'], ['unpublish', false, 'Event Unpublished']]) {
  router.post(`/events/:id(\\d+)/${path}`, wrap(async (req, res) => {
    const { rows } = await query('UPDATE events SET published = $2, updated_at = now() WHERE id = $1 RETURNING *', [req.params.id, published]);
    if (!rows[0]) return notFound(res);
    await activity.log(req, 'events', action, { id: rows[0].id, ref: rows[0].title });
    res.json(rows[0]);
  }));
}

// ---------- Reports ----------

// Counts for Reports & Analytics between ?from and ?to (YYYY-MM-DD, inclusive; default: this month).
// The monthly series always covers at least the last six months so the trend charts have a shape.
router.get('/reports', wrap(async (req, res) => {
  const today = todayIST();
  const from = asDate(req.query.from) || `${today.slice(0, 7)}-01`;
  const to = asDate(req.query.to) || today;
  const p = [from, to];
  const inRange = (col) => `(${col} AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1 AND $2`;
  const [totals, months, appStatus, enqStatus, enqTypes, events, recentApps, recentEnq] = await Promise.all([
    query(`SELECT
      (SELECT count(*)::int FROM members WHERE status = 'active') AS active_members,
      (SELECT count(*)::int FROM members WHERE ${inRange('created_at')}) AS new_members,
      (SELECT count(*)::int FROM membership_applications WHERE ${inRange('created_at')}) AS applications,
      (SELECT count(*)::int FROM membership_applications WHERE status = 'approved' AND ${inRange('created_at')}) AS applications_approved,
      (SELECT count(*)::int FROM events WHERE event_date BETWEEN $1 AND $2 AND event_date < current_date) AS events_conducted,
      (SELECT count(*)::int FROM events WHERE event_date BETWEEN $1 AND $2) AS events_in_range,
      (SELECT count(*)::int FROM event_registrations WHERE status <> 'rejected' AND ${inRange('created_at')}) AS registrations,
      (SELECT count(*)::int FROM event_registrations r JOIN events e ON e.id = r.event_id
        WHERE r.status = 'attended' AND e.event_date BETWEEN $1 AND $2) AS attended,
      (SELECT count(*)::int FROM event_registrations r JOIN events e ON e.id = r.event_id
        WHERE r.status IN ('confirmed', 'attended') AND e.event_date BETWEEN $1 AND $2 AND e.event_date < current_date) AS expected,
      (SELECT count(*)::int FROM enquiries WHERE ${inRange('created_at')}) AS enquiries,
      (SELECT count(*)::int FROM enquiries WHERE status <> 'closed' AND ${inRange('created_at')}) AS enquiries_open,
      (SELECT count(*)::int FROM enquiries WHERE status = 'closed' AND ${inRange('created_at')}) AS enquiries_resolved`, p),
    query(`SELECT to_char(m, 'YYYY-MM') AS month,
      (SELECT count(*)::int FROM members WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Kolkata') = m) AS members,
      (SELECT count(*)::int FROM membership_applications WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Kolkata') = m) AS applications,
      (SELECT count(*)::int FROM event_registrations WHERE status <> 'rejected' AND date_trunc('month', created_at AT TIME ZONE 'Asia/Kolkata') = m) AS registrations,
      (SELECT count(*)::int FROM enquiries WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Kolkata') = m) AS enquiries
      FROM generate_series(date_trunc('month', LEAST($1::date, $2::date - interval '5 months')), date_trunc('month', $2::date), interval '1 month') AS m ORDER BY m`, p),
    query(`SELECT status, count(*)::int AS n FROM membership_applications WHERE ${inRange('created_at')} GROUP BY status`, p),
    query(`SELECT status, count(*)::int AS n FROM enquiries WHERE ${inRange('created_at')} GROUP BY status`, p),
    query(`SELECT enquiry_type, count(*)::int AS received, count(*) FILTER (WHERE status = 'closed')::int AS resolved,
      count(*) FILTER (WHERE status <> 'closed')::int AS open FROM enquiries WHERE ${inRange('created_at')} GROUP BY enquiry_type ORDER BY received DESC`, p),
    query(`SELECT e.id, e.title, e.category, e.event_date, e.published, e.capacity,
      count(r.*) FILTER (WHERE r.status IN ('pending', 'confirmed', 'attended'))::int AS registrations,
      count(r.*) FILTER (WHERE r.status = 'attended')::int AS attended
      FROM events e LEFT JOIN event_registrations r ON r.event_id = e.id
      WHERE e.event_date BETWEEN $1 AND $2 GROUP BY e.id ORDER BY e.event_date DESC`, p),
    query(`SELECT id, ref, full_name, company_name, status, created_at FROM membership_applications
      WHERE ${inRange('created_at')} ORDER BY created_at DESC LIMIT 5`, p),
    query(`SELECT id, ref, full_name, enquiry_type, status, created_at FROM enquiries
      WHERE ${inRange('created_at')} ORDER BY created_at DESC LIMIT 5`, p),
  ]);
  const count = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r.n]));
  res.json({
    from, to, today,
    ...totals.rows[0],
    months: months.rows,
    application_status: count(appStatus.rows, 'status'),
    enquiry_status: count(enqStatus.rows, 'status'),
    enquiry_types: enqTypes.rows,
    events: events.rows,
    recent_applications: recentApps.rows,
    recent_enquiries: recentEnq.rows,
  });
}));

router.get('/reports/exports', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM report_exports ORDER BY created_at DESC LIMIT 200');
  res.json({ items: rows });
}));

// The browser builds the file; this records it in the Export & Download History.
router.post('/reports/exports', wrap(async (req, res) => {
  const b = req.body || {};
  if (!C.reportTypes.some(([k]) => k === b.report)) return bad(res, 'Unknown report.');
  if (!['xlsx', 'csv', 'pdf'].includes(b.format)) return bad(res, 'Unknown format.');
  const params = b.params && typeof b.params === 'object' ? b.params : {};
  const { rows } = await query(
    `INSERT INTO report_exports (report, name, format, params, row_count, admin_id, admin_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [b.report, text(b.name, 200) || b.report, b.format, JSON.stringify(params), Number(b.row_count) || 0, req.admin.id, req.admin.username],
  );
  await activity.log(req, 'reports', 'Report Exported', { id: rows[0].id, ref: rows[0].name, details: `${rows[0].row_count} records, ${b.format.toUpperCase()}` });
  res.status(201).json(rows[0]);
}));

module.exports = router;
