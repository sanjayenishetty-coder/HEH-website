// Website-only build (no API, no database): `VITE_STATIC_SITE=1 npm run build`.
// Used for hosting just the public pages on a static host such as Vercel. In this mode:
//  - GET /api/members..., /api/members/<slug> and /api/meta are answered from src/static-data/*.json
//    (refresh them with `node scripts/export-static-data.mjs`, see that file);
//  - everything else (events, stories, forms, login, admin, portal) is switched off: forms point to
//    the Google application form, WhatsApp and email instead.
// The normal build (no VITE_STATIC_SITE) is unchanged and still uses the Node API.
export const STATIC = import.meta.env.VITE_STATIC_SITE === '1';

export const APPLY_URL = 'https://forms.gle/nCFCD5x5aGdHeBPk6';
export const WHATSAPP = '916300799266';
export const EMAIL = 'heh@entrepreneurhub.in';
export const whatsappLink = (text) => `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

let data;
const load = () => (data = data || Promise.all([
  import('../static-data/members.json'),
  import('../static-data/member-profiles.json'),
  import('../static-data/meta.json'),
]).then(([m, p, meta]) => ({ members: m.default, profiles: p.default, meta: meta.default })));

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

export async function staticApi(path, opts = {}) {
  if ((opts.method || 'GET') !== 'GET') throw unavailable(503);
  const url = new URL(path, 'https://local');
  const d = await load();
  if (url.pathname === '/meta') return d.meta;
  if (url.pathname === '/members') return listMembers(d, url.searchParams);
  const m = url.pathname.match(/^\/members\/([^/]+)$/);
  if (m) {
    const profile = d.profiles[decodeURIComponent(m[1])];
    if (profile) return profile;
  }
  throw unavailable(404);
}
