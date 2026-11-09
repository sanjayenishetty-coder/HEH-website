// Admin side of the Member Portal: turn a member's portal access on/off, set a temporary password, and verify
// the documents members upload. Mounted inside routes/admin.js after sign-in is checked.
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const memberAuth = require('../memberauth');
const activity = require('../activity');
const { sendDocument, notify } = require('./member');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const notFound = (res) => res.status(404).json({ error: 'Not found' });

async function portalInfo(memberId) {
  const { rows } = await query(
    `SELECT m.id, m.full_name, m.member_code, m.email, m.status,
       a.id AS account_id, a.disabled, a.temporary_password, a.last_login_at, a.created_at AS enabled_at
     FROM members m LEFT JOIN member_accounts a ON a.member_id = m.id WHERE m.id = $1`,
    [memberId],
  );
  if (!rows[0]) return null;
  const docs = await query(
    `SELECT id, category, doc_type, file_name, mime, size, status, remarks, reviewed_at, created_at FROM member_documents
     WHERE member_id = $1 ORDER BY created_at DESC`,
    [memberId],
  );
  return { ...rows[0], documents: docs.rows };
}

router.get('/members/:id(\\d+)/portal', wrap(async (req, res) => {
  const info = await portalInfo(req.params.id);
  if (!info) return notFound(res);
  res.json(info);
}));

// Turn access on (or reset the password): a new temporary password, shown once to the administrator.
router.post('/members/:id(\\d+)/portal', wrap(async (req, res) => {
  const info = await portalInfo(req.params.id);
  if (!info) return notFound(res);
  if (!info.member_code) return res.status(400).json({ error: 'Give this member an HEH Membership ID first.' });
  const password = memberAuth.temporaryPassword();
  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO member_accounts (member_id, password_hash) VALUES ($1, $2)
     ON CONFLICT (member_id) DO UPDATE SET password_hash = $2, temporary_password = true, disabled = false,
       sessions_valid_after = now(), updated_at = now()`,
    [info.id, hash],
  );
  await activity.log(req, 'members', info.account_id ? 'Portal Password Reset' : 'Portal Access Enabled',
    { id: info.id, ref: info.full_name });
  res.json({ ...(await portalInfo(info.id)), password });
}));

router.post('/members/:id(\\d+)/portal/:what(disable|enable)', wrap(async (req, res) => {
  const off = req.params.what === 'disable';
  const { rows } = await query(
    `UPDATE member_accounts SET disabled = $2, sessions_valid_after = CASE WHEN $2 THEN now() ELSE sessions_valid_after END,
       updated_at = now() WHERE member_id = $1 RETURNING member_id`,
    [req.params.id, off],
  );
  if (!rows[0]) return notFound(res);
  const info = await portalInfo(req.params.id);
  await activity.log(req, 'members', off ? 'Portal Access Disabled' : 'Portal Access Enabled', { id: info.id, ref: info.full_name });
  res.json(info);
}));

router.get('/member-documents/:id(\\d+)/file', wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM member_documents WHERE id = $1', [req.params.id]);
  if (!rows[0]) return notFound(res);
  sendDocument(res, rows[0], req.query.download === '1');
}));

router.post('/member-documents/:id(\\d+)/:what(verify|reject)', wrap(async (req, res) => {
  const verified = req.params.what === 'verify';
  const remarks = String((req.body || {}).remarks || '').trim().slice(0, 300)
    || (verified ? 'Document reviewed and approved.' : 'Document could not be verified.');
  const { rows } = await query(
    `UPDATE member_documents SET status = $2, remarks = $3, reviewed_at = now() WHERE id = $1
     RETURNING id, member_id, doc_type`,
    [req.params.id, verified ? 'verified' : 'rejected', remarks],
  );
  if (!rows[0]) return notFound(res);
  const d = rows[0];
  await notify(d.member_id, 'update', verified ? 'Document Verified' : 'Document Not Verified',
    `${d.doc_type}: ${remarks}`, 'profile/documents');
  const info = await portalInfo(d.member_id);
  await activity.log(req, 'members', verified ? 'Document Verified' : 'Document Rejected', { id: d.member_id, ref: info.full_name, details: d.doc_type });
  res.json(info);
}));

module.exports = router;
