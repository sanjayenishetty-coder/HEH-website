// The site is one React app, but nginx serves files (try_files $uri $uri.html).
// Copy dist/index.html to one file per route so /about, /about.html, /admin/ etc. all load the app.
import { copyFileSync, mkdirSync } from 'node:fs';
import { PAGES } from '../src/pages.js';

const dist = new URL('../dist/', import.meta.url);
for (const p of PAGES) if (p !== 'index') copyFileSync(new URL('index.html', dist), new URL(`${p}.html`, dist));
for (const app of ['admin', 'portal']) { // /admin/ and the Member Portal at /portal/
  mkdirSync(new URL(`${app}/`, dist), { recursive: true });
  copyFileSync(new URL('index.html', dist), new URL(`${app}/index.html`, dist));
}
console.log(`route pages: ${PAGES.length} + admin + portal`);
