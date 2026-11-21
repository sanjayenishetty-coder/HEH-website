// Refresh the data used by the website-only build (VITE_STATIC_SITE=1, see src/lib/static.js).
// Reads the public API and writes src/static-data/*.json; commit the result.
//
//   node scripts/export-static-data.mjs                                  # live site
//   API=http://127.0.0.1:1502/api node scripts/export-static-data.mjs    # local API
//
// Only public API responses are saved (the same fields the website already shows); no contact details.
import { mkdirSync, writeFileSync } from 'node:fs';

const API = (process.env.API || 'https://heh.visuprojects.in/api').replace(/\/+$/, '');
const OUT = new URL('../src/static-data/', import.meta.url);

async function get(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const items = [];
let industries = {};
for (let offset = 0; ; offset += 40) {
  const page = await get(`/members?limit=40&offset=${offset}`);
  industries = page.industries;
  items.push(...page.items);
  if (!page.items.length || items.length >= page.total) break;
}
const profiles = {};
for (const m of items) profiles[m.slug] = await get(`/members/${encodeURIComponent(m.slug)}`);
const meta = await get('/meta');

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('members.json', OUT), JSON.stringify({ items, industries }));
writeFileSync(new URL('member-profiles.json', OUT), JSON.stringify(profiles));
writeFileSync(new URL('meta.json', OUT), JSON.stringify(meta));
console.log(`static data: ${items.length} members, ${Object.keys(profiles).length} profiles from ${API}`);
