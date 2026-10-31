# CLAUDE.md

Website + API for Hyderabad Entrepreneurs Hub (HEH). See README.md for structure, local run and deploy details.

## Key facts

- `htmls/` is the website (static HTML/CSS/vanilla JS, no build, no framework). `backend/` is a small Node/Express API on PostgreSQL. Keep both framework-free unless asked.
- `images/` (and `images/Website/`) hold the design screenshots; match them when changing layout or copy.
- Header, footer and icons come from `htmls/js/site.js`; pages set the active nav with `<body data-nav="...">`. Don't paste header/footer markup into pages.
- Use the CSS variables in `:root` of `styles.css` for colours/fonts rather than new hex values.
- Pages must work at phone width. Breakpoints in `styles.css`: 1080px (tighter header), 960px (header button hidden, 4-up grids go 2-up), 860px (phone menu, single column), 520px (small phones). Check desktop at 1024px too, since the designs are 1024 wide.
- Icons: `<i data-i="name"></i>` in HTML or `HEH.icon('name')` in JS. Inside a round badge (`.ic`) site.js swaps in the solid version automatically (`FILLED` in site.js), matching the designs; add a solid version there when you add a badge icon.
- CSS/JS links carry a version (`styles.css?v=20261031b`). Bump it in every page (and `admin/index.html`) whenever you change CSS or JS.
- Dynamic content (events, members, stories) is managed in `/admin/`; `backend/src/seed.js` only holds sample content.
- Admin login: `ADMIN_USER` + bcrypt `ADMIN_PASSWORD_HASH` in backend `.env`. Bcrypt hashes contain `$`, so never write the hash through an unquoted shell heredoc/variable (it gets mangled); write `.env` with node or a quoted heredoc. Login trims spaces; 10 failed tries per 15 min locks it.
- Form option lists (industries, turnover ranges, enquiry types, story categories) live in `backend/src/constants.js` and are served by `GET /api/meta`.

## Verifying changes

Run the API locally with `SERVE_STATIC=1` (see README) so pages can call `/api`. Screenshot pages with headless Edge before reporting done (Edge enforces ~500px min window width; for phone width, render the page inside a 390px iframe served from the same origin, because the API sends `X-Frame-Options: SAMEORIGIN`):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --virtual-time-budget=5000 --screenshot=<scratchpad>\index.png "http://localhost:1502/index.html"
```

## Deploying

- Server `root@169.58.149.137`, key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`, use `ssh -o BatchMode=yes`.
- Frontend: `scp -i <key> -r htmls/* root@169.58.149.137:/srv/heh/prod/frontend/` — no reload needed. Both nginx sites send `Cache-Control: no-cache` for pages and assets so browsers pick up changes.
- Git-bash `tar` needs `--force-local` with Windows paths (`C:` is read as a remote host).
- API: `/srv/heh/prod/backend`, `systemctl restart heh-api` after backend changes; DB `heh_test` (PostgreSQL 16).
- Served on port 1501 (`/etc/nginx/sites-available/heh-prod`) and https://heh.visuprojects.in (`heh-domain`, certbot-managed SSL); both proxy `/api/` to 127.0.0.1:1502.
- **Shared production server.** Do not modify other projects' files, services, databases, nginx configs, ports or firewall rules. Run `nginx -t` before any reload. Ask the user before changes outside `/srv/heh`, `heh-api.service`, `heh_test` and the `heh-*` nginx files.
- After deploying, check `https://heh.visuprojects.in/`, `/about`, `/membership`, `/events`, `/community`, `/contact`, `/admin/` return 200 and `/api/health` returns `{"ok":true}`. If local DNS fails, use `curl --resolve heh.visuprojects.in:443:169.58.149.137`.
