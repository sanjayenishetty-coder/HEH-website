// The site is one React app, but nginx serves files (try_files $uri $uri.html).
// Copy dist/index.html to one file per route so /about, /about.html, /admin/ etc. all load the app.
import { copyFileSync, mkdirSync } from 'node:fs';
import { PAGES } from '../src/pages.js';

const dist = new URL('../dist/', import.meta.url);
for (const p of PAGES) if (p !== 'index') copyFileSync(new URL('index.html', dist), new URL(`${p}.html`, dist));
mkdirSync(new URL('admin/', dist), { recursive: true });
copyFileSync(new URL('index.html', dist), new URL('admin/index.html', dist));
console.log(`route pages: ${PAGES.length} + admin`);
