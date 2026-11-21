// Approval of events that Working Committee members add in the Member Portal (migration 0019).
// Reviewers: Executive Council members (portal, routes/member.js) and admins (routes/admin.js, workflows.js).
// Approving publishes the event on the website; rejecting keeps it hidden and tells the member why.
const { query } = require('./db');

// Notice for the member who added the event (portal, and email when set up), linking to their submission.
async function tellSubmitter(e, title, body) {
  if (!e.submitted_by) return;
  const { notify } = require('./routes/member'); // required here: routes/member.js also requires this file
  await notify(e.submitted_by, 'event', title, body, `events/submissions/${e.id}`);
}

// Returns the updated event, or null when it is not waiting for approval.
async function approve(id, by, note = '') {
  const { rows } = await query(
    `UPDATE events SET approval_status = 'approved', published = true, reviewed_by = $2, reviewed_at = now(),
       review_note = $3, updated_at = now()
     WHERE id = $1 AND approval_status <> 'approved' RETURNING *`,
    [id, by, String(note || '').trim().slice(0, 1000)],
  );
  const e = rows[0];
  if (e) {
    await tellSubmitter(e, `Event approved: ${e.title}`,
      `Your event was approved by ${by} and is now published on the HEH website.${e.review_note ? ` Remarks: ${e.review_note}` : ''}`);
  }
  return e || null;
}

async function reject(id, by, note) {
  const { rows } = await query(
    `UPDATE events SET approval_status = 'rejected', published = false, reviewed_by = $2, reviewed_at = now(),
       review_note = $3, updated_at = now()
     WHERE id = $1 AND approval_status = 'pending' RETURNING *`,
    [id, by, String(note || '').trim().slice(0, 1000)],
  );
  const e = rows[0];
  if (e) {
    await tellSubmitter(e, `Event not approved: ${e.title}`,
      `${by} did not approve your event. Reason: ${e.review_note} You can change the event and send it again.`);
  }
  return e || null;
}

module.exports = { approve, reject };
