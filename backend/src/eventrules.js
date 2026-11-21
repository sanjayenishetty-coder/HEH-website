// Event registration rules shared by the website (routes/public.js) and the Member Portal (routes/member.js).
const { query } = require('./db');

// Today's date in India (YYYY-MM-DD); event dates are Hyderabad dates.
function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

const isPast = (e) => Boolean(e.event_date && e.event_date < todayIST());

// Why registration is closed (admin switch, before/after the registration window, or full); '' when open.
async function registrationClosed(e) {
  const today = todayIST();
  if (isPast(e) || !e.registration_open) return 'Registration for this event is closed.';
  if (e.registration_opens && today < e.registration_opens) return `Registration for this event opens on ${e.registration_opens}.`;
  if (e.registration_closes && today > e.registration_closes) return 'Registration for this event is closed.';
  if (e.capacity) {
    const { rows } = await query(
      `SELECT count(*)::int AS n FROM event_registrations WHERE event_id = $1 AND status IN ('pending', 'confirmed', 'attended')`,
      [e.id]
    );
    if (rows[0].n >= e.capacity) return 'This event is full. Registration is closed.';
  }
  return '';
}

module.exports = { todayIST, isPast, registrationClosed };
