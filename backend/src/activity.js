// Admin activity history (table admin_activity): every admin action is recorded here and shown on the
// "Activity History" screens. Logging never fails the request it belongs to.
const { query } = require('./db');

async function log(req, module, action, { id = null, ref = '', details = '' } = {}) {
  try {
    await query(
      `INSERT INTO admin_activity (admin_id, admin_name, module, entity_id, entity_ref, action, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.admin?.id || null, req.admin?.username || '', module, id, String(ref || '').slice(0, 200), action, String(details || '').slice(0, 1000)],
    );
  } catch (err) {
    console.error(new Date().toISOString(), 'activity log failed', err.message);
  }
}

// Newest first. module and id are optional filters.
async function list({ module, id, limit = 500 } = {}) {
  const where = [];
  const params = [];
  if (module) { params.push(String(module).split(',')); where.push(`module = ANY($${params.length})`); }
  if (id) { params.push(Number(id)); where.push(`entity_id = $${params.length}`); }
  params.push(Math.min(Number(limit) || 500, 2000));
  const { rows } = await query(
    `SELECT id, admin_id, admin_name, module, entity_id, entity_ref, action, details, created_at FROM admin_activity
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  return rows;
}

module.exports = { log, list };
