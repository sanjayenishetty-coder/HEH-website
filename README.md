# heh — Hyderabad Entrepreneurs Hub website

Website for **Hyderabad Entrepreneurs Hub (HEH)**, built from the design screenshots in `images/` (latest set in `images/Website/`).

**Live:** https://heh.visuprojects.in  (also http://169.58.149.137:1501)

## Structure

```
images/                    Design screenshots (source of truth for layout/content)
htmls/                     The website (static HTML/CSS/JS) — deployed to /srv/heh/prod/frontend
  styles.css               Shared styles (colours/fonts are CSS variables in :root; breakpoints 1080/860/520px)
  js/site.js               Shared header, footer, icon sprite and helpers (api, formatting, form errors)
  index.html               Home
  about.html               About HEH
  membership.html          Membership benefits
  membership-apply.html    3-step application (js/apply.js) -> membership-submitted.html
  contact.html             Contact form -> enquiry-submitted.html
  events.html / past-events.html   Event lists (js/events-list.js)
  event.html?e=<slug>      Event details (upcoming) or highlights (past) (js/event.js)
  event-register.html?e=<slug> -> registration-confirmed.html
  community.html, members.html, member.html?m=<slug>, success-stories.html, story.html?s=<slug>
  admin/                   Admin panel (sign in at /admin/)
backend/                   Node/Express API (PostgreSQL) — deployed to /srv/heh/prod/backend
  src/schema.sql           Database schema (npm run db:migrate)
  src/seed.js              Sample content from the designs (npm run db:seed; only fills empty tables)
  src/routes/public.js     /api/... used by the website
  src/routes/admin.js      /api/admin/... used by the admin panel
deploy/                    systemd unit and nginx location blocks used on the server
```

The header/footer are rendered by `js/site.js`: each page has an empty `<header class="site-header">` /
`<footer class="site-footer">` and sets the active nav item with `<body data-nav="...">`.
Icons: `<i data-i="calendar"></i>` in HTML or `HEH.icon('calendar')` in JS (list in `js/site.js`).

## Run locally

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD_HASH; set SERVE_STATIC=1
npm run hash-password -- 'your-admin-password'   # -> ADMIN_PASSWORD_HASH
npm run db:migrate && npm run db:seed
npm run dev               # http://localhost:1502 serves the site and the API
```

To use the server's database from your machine, tunnel it:
`ssh -i <key> -N -L 15432:127.0.0.1:5432 root@169.58.149.137` and use port 15432 in `DATABASE_URL`.

## Admin

`/admin/` — sign in with `ADMIN_USER` / the password whose hash is in `ADMIN_PASSWORD_HASH`.
Manage events (agenda, speaker, photos, highlights), members (profiles; the Membership ID is what members
enter to register for events), success stories, and follow up membership applications, enquiries and
event registrations (status, internal notes, CSV export). Uploaded images go to `/srv/heh/prod/uploads`.

To change the admin password: `npm run hash-password -- 'new-password'`, put the result in
`/srv/heh/prod/backend/.env`, then `systemctl restart heh-api`.

## Deploy

Server: Ubuntu VPS `169.58.149.137`, user `root`, SSH key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`.

| Item | Value |
|---|---|
| Website files | `/srv/heh/prod/frontend` |
| API | `/srv/heh/prod/backend`, systemd `heh-api.service`, listens on `127.0.0.1:1502` (runs as user `heh`) |
| Database | PostgreSQL 16, database `heh_test`, role `heh` (password in backend `.env`) |
| Uploads | `/srv/heh/prod/uploads` (served at `/uploads/`) |
| Logs | `/srv/heh/prod/logs/api*.log`, `/var/log/nginx/heh-*.log` |
| nginx (port 1501) | `/etc/nginx/sites-available/heh-prod` |
| nginx (domain + HTTPS) | `/etc/nginx/sites-available/heh-domain` (certbot SSL) |
| Backups made before changes | `/srv/heh/prod/backups/` |
| DNS | A record `heh` → `169.58.149.137` (GoDaddy, visuprojects.in) |

Both nginx sites proxy `/api/` to `127.0.0.1:1502` and serve `/uploads/` (see `deploy/nginx-heh-locations.conf`).

Frontend-only change (no restart needed):

```bash
scp -i "E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem" -r htmls/* root@169.58.149.137:/srv/heh/prod/frontend/
```

Backend change: copy `backend/src` (and `package*.json` if dependencies changed) to `/srv/heh/prod/backend`,
run `npm ci --omit=dev` there if needed, `sudo -u heh node src/migrate.js` if the schema changed, then
`systemctl restart heh-api`.

Check it:

```bash
curl -I https://heh.visuprojects.in/
curl https://heh.visuprojects.in/api/health
```

> The server hosts other projects (kvgc, yoga, stock360, zoofilings, batterydukaan, whatsapp, ...).
> Only touch `/srv/heh`, `heh-api.service`, the `heh_test` database and the two `heh-*` nginx files.
> Always run `nginx -t` before `systemctl reload nginx`.
