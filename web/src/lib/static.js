// Website-only build (no API, no database): `VITE_STATIC_SITE=1 npm run build`.
// Used for hosting just the public pages on a static host such as Vercel. In this mode:
//  - GET /api/members..., /api/members/<slug>, /api/events..., /api/events/<slug> and /api/meta are answered
//    from src/static-data/*.json
//    (refresh them with `node scripts/export-static-data.mjs`, see that file);
//  - the membership application is emailed to APPLICATIONS_EMAIL (sendApplication below);
//  - everything else (event registration, stories, other forms, login, admin, portal) is switched off:
//    Contact, "Connect Through HEH" and "Register for Event" use WhatsApp and email instead.
// The normal build (no VITE_STATIC_SITE) is unchanged and still uses the Node API.
export const STATIC = import.meta.env.VITE_STATIC_SITE === '1';

// Membership applications are emailed here (no database in this build), through FormSubmit (formsubmit.co).
// The first submission sends this mailbox a one-time "Activate form" email; applications arrive once it is confirmed.
export const APPLICATIONS_EMAIL = 'naresh@entrepreneurhub.in';
export const WHATSAPP = '916300799266';
export const EMAIL = 'heh@entrepreneurhub.in';
export const whatsappLink = (text) => `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

let data;
const load = () => (data = data || Promise.all([
  import('../static-data/members.json'),
  import('../static-data/member-profiles.json'),
  import('../static-data/meta.json'),
  import('../static-data/events.json'),
]).then(([m, p, meta, ev]) => ({ members: m.default, profiles: p.default, meta: meta.default, events: ev.default })));

function unavailable(status = 404) {
  const err = new Error(status === 404 ? 'Not found' : 'This feature is not available on this website.');
  err.status = status;
  return err;
}

// Mirrors GET /api/members in backend/src/routes/public.js (filters, paging, totals).
function listMembers({ members }, params) {
  let rows = members.items;
  const industry = params.get('industry');
  if (industry && Object.hasOwn(members.industries, industry)) rows = rows.filter((m) => m.industry === industry);
  const q = (params.get('q') || '').slice(0, 60).toLowerCase();
  if (q) rows = rows.filter((m) => `${m.full_name}\n${m.company || ''}`.toLowerCase().includes(q));
  const limit = Math.min(Number(params.get('limit')) || 8, 40);
  const offset = Math.max(Number(params.get('offset')) || 0, 0);
  return { items: rows.slice(offset, offset + limit), total: rows.length, industries: members.industries };
}

// Events, as in GET /api/events and /api/events/<slug> (backend/src/routes/public.js, eventrules.js).
// Upcoming/past and registration are worked out from today's date in India, so an event moves to
// Past Events by itself once its date has gone by.
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const LIST_COLS = ['id', 'slug', 'title', 'category', 'short_description', 'event_date', 'start_time', 'end_time',
  'venue_name', 'image_url', 'members_only', 'registration_open'];

function withStatus(e) {
  const isPast = Boolean(e.event_date && e.event_date < todayIST());
  const open = Boolean(e.registration_open) && !isPast;
  return { ...e, is_past: isPast, registration_open: open, registration_note: open ? '' : 'Registration for this event is closed.' };
}

function listEvents({ events }, params) {
  const past = params.get('when') === 'past';
  const today = todayIST();
  let rows = events.filter((e) => (past ? e.event_date && e.event_date < today : !e.event_date || e.event_date >= today));
  const category = params.get('category');
  if (['spotlight', 'workshop'].includes(category)) rows = rows.filter((e) => e.category === category);
  const year = Number(params.get('year'));
  if (Number.isInteger(year) && year > 2000) rows = rows.filter((e) => e.event_date && Number(e.event_date.slice(0, 4)) === year);
  const month = Number(params.get('month'));
  if (Number.isInteger(month) && month >= 1 && month <= 12) rows = rows.filter((e) => e.event_date && Number(e.event_date.slice(5, 7)) === month);
  rows = [...rows].sort((a, b) => {
    if (a.event_date !== b.event_date) {
      if (!a.event_date) return 1; // no date yet: last
      if (!b.event_date) return -1;
      return past ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date);
    }
    return b.id - a.id;
  });
  const limit = Math.min(Number(params.get('limit')) || 6, 30);
  const offset = Math.max(Number(params.get('offset')) || 0, 0);
  const years = [...new Set(events.filter((e) => e.event_date).map((e) => Number(e.event_date.slice(0, 4))))].sort((a, b) => b - a);
  const items = rows.slice(offset, offset + limit).map((e) => {
    const s = withStatus(e);
    return Object.fromEntries(LIST_COLS.map((k) => [k, s[k]]));
  });
  return { items, total: rows.length, years };
}

export async function staticApi(path, opts = {}) {
  if ((opts.method || 'GET') !== 'GET') throw unavailable(503);
  const url = new URL(path, 'https://local');
  const d = await load();
  if (url.pathname === '/meta') return d.meta;
  if (url.pathname === '/members') return listMembers(d, url.searchParams);
  if (url.pathname === '/events') return listEvents(d, url.searchParams);
  const ev = url.pathname.match(/^\/events\/([^/]+)$/);
  if (ev) {
    const e = d.events.find((x) => x.slug === decodeURIComponent(ev[1]));
    if (e) return withStatus(e);
  }
  const m = url.pathname.match(/^\/members\/([^/]+)$/);
  if (m) {
    const profile = d.profiles[decodeURIComponent(m[1])];
    if (profile) return profile;
  }
  throw unavailable(404);
}

// Website-only build: email a membership application. Returns the confirmation shown on /membership-submitted.
export async function sendApplication(fields) {
  const ref = `HEH-APP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const labels = {
    full_name: 'Full name', mobile: 'Mobile', email: 'Email', designation: 'Designation', linkedin: 'LinkedIn',
    company_name: 'Company', business_category: 'Business category', year_established: 'Year established',
    business_location: 'Business location', website: 'Website', turnover_range: 'Annual turnover',
    business_description: 'Business description',
  };
  const body = { _subject: `HEH membership application: ${fields.full_name} (${fields.company_name})`, _template: 'table', 'Application reference': ref };
  for (const [k, label] of Object.entries(labels)) if (fields[k]) body[label] = k === 'mobile' ? `+91 ${String(fields[k]).replace(/^\+?91\s?/, '')}` : fields[k];
  body._replyto = fields.email; // replying to the email answers the applicant
  const res = await fetch(`https://formsubmit.co/ajax/${APPLICATIONS_EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || String(data.success) !== 'true') {
    throw new Error(`Your application could not be sent right now. Please try again, or email it to ${APPLICATIONS_EMAIL}.`);
  }
  return {
    ref, full_name: fields.full_name, company_name: fields.company_name,
    business_category: fields.business_category, created_at: new Date().toISOString(), status: 'received',
  };
}
