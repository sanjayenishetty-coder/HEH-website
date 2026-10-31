# CLAUDE.md

Website + API for Hyderabad Entrepreneurs Hub (HEH). See README.md for structure, local run and deploy details.

## Key facts

- `web/` is the website and admin panel: React 18 + react-router, built with Vite (`npm run build` -> `web/dist`). `backend/` is a small Node/Express API on PostgreSQL. No other frameworks/UI libraries unless asked.
- `images/` (and `images/Website/`) hold the design screenshots; match them when changing layout or copy.
- Header and footer are in `web/src/components/Layout.jsx`; pages are in `web/src/pages/` and routed in `src/main.jsx`. A new page also needs its name in `src/pages.js` (the build writes `dist/<name>.html` because nginx uses `try_files $uri $uri.html`; no SPA fallback, no nginx change).
- Logo and favicon (from entrepreneurhub.in) are in `web/public/assets/brand/`: `logo.png` (transparent) for light backgrounds, `logo-light.png` (white text) for the navy footer. Core team photos (About page, entrepreneurhub.in/team) are in `public/assets/team/`.
- Use the CSS variables in `:root` of `web/src/styles.css` for colours/fonts rather than new hex values.
- Pages must work at phone width. Breakpoints in `styles.css`: 1080px (tighter header), 960px (header button hidden, 4-up grids go 2-up), 860px (phone menu, single column), 520px (small phones). Check desktop at 1024px too, since the designs are 1024 wide.
- Icons: `<Icon name="..." />`; round badges `<Ic name="..." tone="blue" />` use the solid glyph from `FILLED` in `src/lib/icons.js` (matching the designs); add a solid version there when you add a badge icon.
- Built assets have hashed names, so no manual cache-busting is needed.
- Write `useEffect` bodies with braces (`useEffect(() => { window.scrollTo(0, 0); }, ...)`). A concise arrow returns its value, and React calls a non-function return as cleanup; `window.scrollTo` returns a Promise in current Chrome/Edge, which crashed every page change until a refresh.
- Dynamic content (events, members, stories) is managed in `/admin/`; `backend/src/seed.js` only holds sample content.
- Database changes go in a new `backend/migrations/NNNN_name.sql` (`npm run db:migrate:new -- name`), never by editing an applied migration (the runner checks checksums). Run `npm run db:migrate` locally and on the server.
- Admin login: `ADMIN_USER` + bcrypt `ADMIN_PASSWORD_HASH` in backend `.env`. Bcrypt hashes contain `$`, so never write the hash through an unquoted shell heredoc/variable (it gets mangled); write `.env` with node or a quoted heredoc. Login trims spaces; 10 failed tries per 15 min locks it.
- Form option lists (industries, turnover ranges, enquiry types, story categories) live in `backend/src/constants.js` and are served by `GET /api/meta`.

## Verifying changes

Build `web/` and run the API locally with `SERVE_STATIC=1` (serves `web/dist` on :1502), or run `npm run dev` in `web/` (port 5173, proxies `/api`). Screenshot pages with headless Edge before reporting done (Edge enforces ~500px min window width; for phone width, render the page inside a 390px iframe served from the same origin, because the API sends `X-Frame-Options: SAMEORIGIN`):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --virtual-time-budget=5000 --screenshot=<scratchpad>\index.png "http://localhost:1502/"
```

## Deploying

- Server `root@169.58.149.137`, key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`, use `ssh -o BatchMode=yes`.
- Frontend: `npm run build` in `web/`, upload `dist` to a new folder under `/srv/heh/prod`, swap it in for `frontend/` (move the old one to `backups/`). No reload needed; pages are sent with `Cache-Control: no-cache` and assets are hashed.
- Git-bash `tar` needs `--force-local` with Windows paths (`C:` is read as a remote host).
- API: `/srv/heh/prod/backend` (copy `src/` and `migrations/`), `sudo -u heh node src/migrate.js`, then `systemctl restart heh-api`; DB `heh_test` (PostgreSQL 16).
- Served on port 1501 (`/etc/nginx/sites-available/heh-prod`) and https://heh.visuprojects.in (`heh-domain`, certbot-managed SSL); both proxy `/api/` to 127.0.0.1:1502.
- **Shared production server.** Do not modify other projects' files, services, databases, nginx configs, ports or firewall rules. Run `nginx -t` before any reload. Ask the user before changes outside `/srv/heh`, `heh-api.service`, `heh_test` and the `heh-*` nginx files.
- After deploying, check `https://heh.visuprojects.in/`, `/about`, `/membership`, `/events`, `/community`, `/contact`, `/admin/` return 200 and `/api/health` returns `{"ok":true}`. If local DNS fails, use `curl --resolve heh.visuprojects.in:443:169.58.149.137`.
