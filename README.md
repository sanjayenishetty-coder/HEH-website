# heh — Hyderabad Entrepreneurs Hub website

Website for **Hyderabad Entrepreneurs Hub (HEH)**, built from the design screenshots in `images/` (latest set in `images/Website/`).

**Live:** https://heh.visuprojects.in  (also http://169.58.149.137:1501)

## Structure

```
images/                    Design screenshots (source of truth for layout/content)
web/                       The website + admin panel: React 18 + react-router, built with Vite
  index.html               HTML shell (fonts, favicon)
  public/assets/           Static files: brand/ (logo, white-text logo-light for the footer, favicons),
                           team/ (core team photos), charminar.jpg (home hero)
  src/main.jsx             Routes (one per page) and the lazy-loaded admin
  src/pages.js             Page names; the build writes dist/<name>.html for each (see below)
  src/styles.css           Shared styles (colours/fonts are CSS variables in :root; breakpoints 1080/960/860/520px)
  src/components/          Layout (header/footer), Icon/Ic (icons), ui (Media, badges), forms (useSubmit, Field...)
  src/lib/                 api (fetch /api), format (dates in India time), hooks (useTitle, useParam, useApi), icons
  src/pages/               One component per page (Home, About, Membership, MembershipApply, Contact, Events,
                           Event, EventRegister, Community, Members, Member, SuccessStories, Story, Faqs,
                           OurMembers, WhyHeh, WhoCanJoin, MemberVoices, MembershipPlan, ...)
                           The header "About HEH" drop-down list is ABOUT_MENU in components/Layout.jsx;
                           its "Members" item is OurMembers (/our-members, grouped by member type), separate
                           from the Community section's member directory (/members)
  src/admin/               Admin panel (/admin/): Login, Dashboard, Submissions, Content editors
  src/portal/              Member Portal (/portal/): dashboard, profile, directory, connections, events, gallery
  scripts/route-pages.js   Post-build: copies dist/index.html to about.html, events.html, admin/index.html ...
backend/                   Node/Express API (PostgreSQL) — deployed to /srv/heh/prod/backend
  migrations/              Versioned SQL migrations (NNNN_name.sql), applied by src/migrate.js
  src/seed.js              Sample events/stories from the designs (npm run db:seed; only fills empty tables)
  src/routes/public.js     /api/... used by the website
  src/routes/admin.js      /api/admin/... used by the admin panel
  src/routes/member.js     /api/member/... used by the Member Portal (portal-admin.js: admin side of it)
deploy/                    systemd unit and nginx location blocks used on the server
```

URLs are clean (`/about`, `/event?e=<slug>`, `/member?m=<slug>`); old `*.html` addresses still work and
redirect. nginx serves files with `try_files $uri $uri.html`, so the build writes one copy of the app's
`index.html` per page name: no nginx change is needed, and an unknown path is a real 404.

Icons: `<Icon name="calendar" />`; round badges `<Ic name="users" tone="blue" />` use the solid glyph from
`FILLED` in `src/lib/icons.js` (add one there when you add a badge icon). Built JS/CSS have hashed file
names, so browsers always load the new version after a deploy.

## Run locally

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD_HASH
npm run hash-password -- 'your-admin-password'   # -> ADMIN_PASSWORD_HASH
npm run db:migrate && npm run db:seed
npm run dev               # API on http://localhost:1502

cd ../web
npm install
npm run dev               # http://localhost:5173, proxies /api and /uploads to :1502
npm run build             # -> web/dist (with SERVE_STATIC=1 the API also serves it on :1502)
```

To use the server's database from your machine, tunnel it:
`ssh -i <key> -N -L 15432:127.0.0.1:5432 root@169.58.149.137` and use port 15432 in `DATABASE_URL`.

## Database migrations

Schema and data changes are SQL files in `backend/migrations/`, applied in order, each once, in a
transaction, and recorded in the `schema_migrations` table (with a checksum).

```bash
npm run db:migrate                     # apply pending migrations
npm run db:migrate:status              # list applied / pending
npm run db:migrate:new -- add_x_column # create migrations/NNNN_add_x_column.sql
```

Never edit a migration that has been applied (the runner refuses: "Already-applied migrations were
edited"); add a new one. `0001` is the initial schema, `0002` loads the HEH member list, `0003` adds member
types (Executive Council (key core_team) / Working Committee / Advisory Board, list in `backend/src/constants.js`) shown on `/our-members`.

## Admin

`/admin/` — sign in with `ADMIN_USER` / the password whose hash is in `ADMIN_PASSWORD_HASH`.
Manage events (agenda, speaker, photos, highlights), members (profiles; the Membership ID is what members
enter to register for events), success stories, and follow up membership applications, enquiries and
event registrations (status, internal notes, CSV export). Uploaded images go to `/srv/heh/prod/uploads`.

To change the admin password: `npm run hash-password -- 'new-password'`, put the result in
`/srv/heh/prod/backend/.env` (edit the file directly; the hash contains `$` characters that a shell
will mangle if you pass it through a variable), then `systemctl restart heh-api`.
Sign-in ignores surrounding spaces; 10 failed attempts lock it for 15 minutes.

## Member Portal

`/portal/` — for HEH members. In `/admin/`, open a member (Members > the member) and use **Member Portal access >
Turn on portal access**; this creates a temporary password, shown once, to give the member. They sign in with
their email or HEH Membership ID and are asked to choose their own password. From the same box you can reset the
password, turn access off, and verify the documents the member uploads. Members can reset a forgotten password
by email once `SMTP_*` is set up. Event videos for the portal gallery are added in the event editor.

## Deploy

Server: Ubuntu VPS `169.58.149.137`, user `root`, SSH key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`.

| Item | Value |
|---|---|
| Website files | `/srv/heh/prod/frontend` |
| API | `/srv/heh/prod/backend`, systemd `heh-api.service`, listens on `127.0.0.1:1502` (runs as user `heh`) |
| Database | PostgreSQL 16, database `heh_test`, role `heh` (password in backend `.env`) |
| Uploads | `/srv/heh/prod/uploads` (served at `/uploads/`) |
| Member documents | `/srv/heh/prod/uploads-documents` (private: not served by nginx; owned by `heh`) |
| Logs | `/srv/heh/prod/logs/api*.log`, `/var/log/nginx/heh-*.log` |
| nginx (port 1501) | `/etc/nginx/sites-available/heh-prod` |
| nginx (domain + HTTPS) | `/etc/nginx/sites-available/heh-domain` (certbot SSL) |
| Backups made before changes | `/srv/heh/prod/backups/` |
| DNS | A record `heh` → `169.58.149.137` (GoDaddy, visuprojects.in) |

Both nginx sites proxy `/api/` to `127.0.0.1:1502`, serve `/uploads/`, and send `Cache-Control: no-cache`
for the site so browsers always re-check for new versions (see `deploy/nginx-heh-locations.conf`).

Frontend change (no restart needed): `cd web && npm run build`, then replace the contents of
`/srv/heh/prod/frontend` with `web/dist` (upload to a new folder on the server and swap it in, keeping the
old one in `backups/`).

Backend change: copy `backend/src`, `backend/migrations` (and `package*.json` if dependencies changed) to
`/srv/heh/prod/backend`, run `npm ci --omit=dev` there if needed, then `sudo -u heh node src/migrate.js`
and `systemctl restart heh-api`. Migrations are applied through `0018_member_portal.sql` (Member Portal).
The private folder for member documents must exist and belong to `heh`
(`mkdir -p /srv/heh/prod/uploads-documents && chown heh:heh /srv/heh/prod/uploads-documents && chmod 750 ...`;
created on 9 Nov 2026). Never put it under `uploads/`, which nginx serves publicly.

Check it:

```bash
curl -I https://heh.visuprojects.in/
curl -I https://heh.visuprojects.in/portal/
curl https://heh.visuprojects.in/api/health          # {"ok":true}
curl -I https://heh.visuprojects.in/api/member/me     # 401 when signed out
```

On Windows git-bash, use `tar --force-local` when packing files from a `C:` path.

## Before launch

- Replace the sample events and success stories (seeded from the designs) in `/admin/`; add member photos and profiles.
- Member Portal: turn on portal access for each member in `/admin/` (Members > member > Member Portal access) and
  share the temporary password; set up `SMTP_*` so members can reset forgotten passwords and get email notices.
- Contact details (email, phone/WhatsApp, address, LinkedIn, Facebook) come from entrepreneurhub.in: `web/src/pages/Contact.jsx` and the footer in `web/src/components/Layout.jsx`.

> The server hosts other projects (kvgc, yoga, stock360, zoofilings, batterydukaan, whatsapp, ...).
> Only touch `/srv/heh`, `heh-api.service`, the `heh_test` database and the two `heh-*` nginx files.
> Always run `nginx -t` before `systemctl reload nginx`.
