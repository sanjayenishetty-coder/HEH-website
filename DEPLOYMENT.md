# Deploying the HEH website to your own server

This guide sets up the Hyderabad Entrepreneurs Hub website, admin panel and Member Portal on a server you
control and puts it live at **https://www.entrepreneurhub.in**. Follow the steps in order; each one ends with a
check so you know it worked before moving on. Allow about 2–3 hours for the first setup.

Commands are for **Ubuntu 22.04 / 24.04**, run as a user with `sudo`. Lines starting with `#` are comments.

---

## What you are deploying

| Part | Folder in this repo | What runs it |
|---|---|---|
| Website, admin panel (`/admin/`), Member Portal (`/portal/`) | `web/` | Built once into static files (`web/dist`) and served by **nginx** |
| API (`/api/...`) | `backend/` | **Node.js** service on `127.0.0.1:1502`, behind nginx |
| Database | `backend/migrations/` | **PostgreSQL** (not MySQL: the schema uses PostgreSQL-only features such as `jsonb`) |
| Uploaded images | – | A folder on disk, served by nginx at `/uploads/` |
| Member verification documents | – | A **private** folder on disk; only the API reads it, nginx must never serve it |

Static hosts (Vercel, Netlify, shared cPanel hosting) **cannot** run this: the API and database need a
server that is always on.

## 0. Before you start

You need:

1. **A Linux server (VPS)**: Ubuntu 22.04 or 24.04, at least 2 GB RAM, 1–2 vCPU, 25 GB disk, with a public IP
   address and SSH access. Any provider works (DigitalOcean, AWS Lightsail, Hostinger VPS, GoDaddy VPS, ...).
2. **Access to the DNS of entrepreneurhub.in** (it is managed at GoDaddy) for step 8.
3. **From the HEH developers (sent privately, never committed to Git):**
   - the **database export** (`heh.dump`) with the current members, events, registrations, applications,
     enquiries, stories and Member Portal accounts;
   - the **uploads** archive (`uploads.tgz`) and the **member documents** archive (`uploads-documents.tgz`);
   - optionally the current **email (SMTP) settings**.

   If you want to start with an empty site instead, skip those; step 5 explains both options.

Throughout this guide everything lives under `/srv/heh/prod`:

```
/srv/heh/prod/
  backend/            API code (from backend/ in this repo) + .env
  frontend/           built website (from web/dist)
  uploads/            uploaded images (public, served at /uploads/)
  uploads-documents/  member verification documents (PRIVATE)
  logs/               API logs
  backups/            database and file backups
```

---

## 1. Prepare the server

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install nginx postgresql git curl ufw

# Node.js 20 LTS (22 also works)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
node -v        # v20.x or v22.x
which node     # note this path; it is used in step 6 (usually /usr/bin/node)

# Firewall: SSH + web only. The API (1502) and PostgreSQL (5432) stay private.
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# A system user that runs the API, and the folders
sudo useradd --system --home /srv/heh --shell /usr/sbin/nologin heh
sudo mkdir -p /srv/heh/prod/{backend,frontend,uploads,uploads-documents,logs,backups}
sudo chown -R heh:heh /srv/heh/prod/uploads /srv/heh/prod/uploads-documents /srv/heh/prod/logs
sudo chmod 750 /srv/heh/prod/uploads-documents
```

**Check:** `node -v`, `psql --version` (14 or newer) and `nginx -v` all print versions.

## 2. Create the database

```bash
# Pick a strong password and keep it for step 4
sudo -u postgres psql -c "CREATE ROLE heh LOGIN PASSWORD 'CHOOSE-A-STRONG-PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE heh OWNER heh;"
```

**Check:** `psql "postgres://heh:CHOOSE-A-STRONG-PASSWORD@127.0.0.1:5432/heh" -c 'select 1'` prints `1`.

## 3. Get the code

```bash
cd /srv/heh
sudo git clone <repository-url> repo        # the Git repository you were given access to
sudo chown -R $USER /srv/heh/repo

# API code
sudo cp -r /srv/heh/repo/backend/src /srv/heh/repo/backend/migrations \
           /srv/heh/repo/backend/package.json /srv/heh/repo/backend/package-lock.json /srv/heh/prod/backend/
cd /srv/heh/prod/backend && sudo npm ci --omit=dev

# Website: build it, then copy the result
cd /srv/heh/repo/web && npm ci && npm run build
sudo cp -r /srv/heh/repo/web/dist/. /srv/heh/prod/frontend/
```

**Check:** `/srv/heh/prod/frontend` contains `index.html`, `about.html`, `admin/index.html`,
`portal/index.html` and an `assets/` folder.

## 4. Configure the API (`.env`)

Create `/srv/heh/prod/backend/.env` from the template `backend/.env.example`:

```bash
sudo cp /srv/heh/repo/backend/.env.example /srv/heh/prod/backend/.env
sudo nano /srv/heh/prod/backend/.env
```

Set these values:

| Setting | Value |
|---|---|
| `DATABASE_URL` | `postgres://heh:CHOOSE-A-STRONG-PASSWORD@127.0.0.1:5432/heh` (from step 2) |
| `SESSION_SECRET` | a long random string: run `openssl rand -hex 32` and paste the output |
| `SITE_URL` | `https://www.entrepreneurhub.in` (used in emailed links) |
| `UPLOAD_DIR` | `/srv/heh/prod/uploads` |
| `DOC_DIR` | `/srv/heh/prod/uploads-documents` (remove the `#` in front) |
| `ADMIN_USER`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | the **first admin account**; see below |
| `SMTP_*`, `MAIL_FROM` | outgoing email; optional, see "Email" below |
| `GOOGLE_CLIENT_ID` | leave empty unless you set up Google sign-in |
| `NODE_ENV`, `PORT`, `HOST`, `SERVE_STATIC` | keep `production`, `1502`, `127.0.0.1`, `0` |

**First admin account.** It is created from `ADMIN_*` only when the database has **no** admin yet (a fresh
database, step 5 option B). With the database export (option A) the existing admin account comes with it and
these values are not used, but `ADMIN_PASSWORD_HASH` must still be filled in or the API will not start.
Make the hash like this (the password must be at least 10 characters):

```bash
cd /srv/heh/prod/backend && node src/hash-password.js 'Your-Admin-Password'
```

Paste the output as `ADMIN_PASSWORD_HASH=...` and set `ADMIN_EMAIL` to the email the admin will sign in with
(everyone signs in with an email address). Edit the file with `nano`: the hash contains `$` characters,
which a shell command such as `echo` would change.

Then lock the file down:

```bash
sudo chown heh:heh /srv/heh/prod/backend/.env && sudo chmod 600 /srv/heh/prod/backend/.env
```

**Email (optional but recommended).** Without SMTP the site works, but "Forgot Password?" cannot send reset
links and members get notices only inside the portal. With Google Workspace (entrepreneurhub.in uses Google
for email) create an *App password* for the sending mailbox and set:
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=0`, `SMTP_USER=<mailbox>`, `SMTP_PASS=<app password>`,
`MAIL_FROM="HEH Portal <heh@entrepreneurhub.in>"`.

## 5. Load the data

Choose **one** option.

### Option A (recommended): move the existing data

```bash
# Copy heh.dump, uploads.tgz and uploads-documents.tgz to the server first (e.g. with scp), then:
sudo -u postgres pg_restore --no-owner --role=heh -d heh /path/to/heh.dump
sudo tar -xzf /path/to/uploads.tgz -C /srv/heh/prod/uploads
sudo tar -xzf /path/to/uploads-documents.tgz -C /srv/heh/prod/uploads-documents
sudo chown -R heh:heh /srv/heh/prod/uploads /srv/heh/prod/uploads-documents

# Apply any database changes made after the export (normally reports nothing to do)
cd /srv/heh/prod/backend && sudo -u heh node src/migrate.js
```

Restore **into the empty database from step 2** and do not run `migrate.js` before restoring.

### Option B: start with an empty site

```bash
cd /srv/heh/prod/backend && sudo -u heh node src/migrate.js
```

This creates all tables and loads the HEH member list. Events, stories and everything else are then added
in the admin panel. (`node src/seed.js` would add the sample events and stories from the designs; do not use
it for the live site.)

**Check (both options):** `sudo -u heh node src/migrate.js status` lists every migration as applied.

## 6. Run the API as a service

```bash
sudo cp /srv/heh/repo/deploy/heh-api.service /etc/systemd/system/heh-api.service
sudo nano /etc/systemd/system/heh-api.service
#   - ExecStart: use the node path from step 1, e.g.  ExecStart=/usr/bin/node src/server.js
#   - ReadWritePaths: add /srv/heh/prod/uploads-documents to the end of that line
sudo systemctl daemon-reload
sudo systemctl enable --now heh-api
```

**Check:**

```bash
systemctl status heh-api                 # active (running)
curl http://127.0.0.1:1502/api/health    # {"ok":true}
```

If it is not running, see `/srv/heh/prod/logs/api-error.log` (a missing `.env` value is reported there).

## 7. Set up nginx

```bash
sudo cp /srv/heh/repo/deploy/nginx-entrepreneurhub.conf /etc/nginx/sites-available/heh
sudo ln -s /etc/nginx/sites-available/heh /etc/nginx/sites-enabled/heh
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**Check before switching the domain:** from your own computer, test with the server IP while the domain still
points at the old site:

```bash
curl -H "Host: www.entrepreneurhub.in" http://<SERVER-IP>/              # the home page HTML
curl -H "Host: www.entrepreneurhub.in" http://<SERVER-IP>/api/health    # {"ok":true}
```

To click through it in a browser, add `<SERVER-IP> www.entrepreneurhub.in` to your computer's `hosts` file,
open `http://www.entrepreneurhub.in`, test the pages and sign in at `/login`, then remove the line again.

## 8. Switch the domain (GoDaddy DNS)

If you used option A, first ask the HEH team to stop changing anything in the admin panel, take a **fresh**
export of the database and uploads, and load it again as in step 5 (drop and recreate the empty database from
step 2 first). That way nothing entered after the first export is lost.

In GoDaddy > **entrepreneurhub.in** > **DNS**, about a day before, lower the TTL of the two records below to
600 seconds. Then, at the switch:

| Type | Name | Value |
|---|---|---|
| A | `@` | `<SERVER-IP>` (replaces the current Vercel record) |
| A | `www` | `<SERVER-IP>` (replaces the current `www` CNAME to Vercel) |

> **Do not change or delete the MX and TXT records.** They carry the Google email for entrepreneurhub.in
> (and its verification). Changing them stops email.

Wait until both names point at the new server: `nslookup www.entrepreneurhub.in` and
`nslookup entrepreneurhub.in` show `<SERVER-IP>` (usually within minutes, at most a few hours).

## 9. Turn on HTTPS

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d www.entrepreneurhub.in -d entrepreneurhub.in --redirect -m <your-email> --agree-tos
sudo certbot renew --dry-run      # confirms the automatic renewal works
```

**Check:** https://www.entrepreneurhub.in opens with a padlock; http:// and https://entrepreneurhub.in end up
on https://www.entrepreneurhub.in.

## 10. Final checks

| Check | Expected |
|---|---|
| `https://www.entrepreneurhub.in/`, `/about`, `/membership`, `/events`, `/community`, `/contact`, `/our-members` | the pages open |
| `https://www.entrepreneurhub.in/admin/` and `/portal/` | redirect to `/login` when signed out |
| `https://www.entrepreneurhub.in/api/health` | `{"ok":true}` |
| `https://www.entrepreneurhub.in/api/member/me` | `401` when signed out |
| Sign in at `/login` with the admin email | the admin dashboard opens |
| Submit the Contact form and a membership application | they appear in the admin panel |
| Upload an image in the admin panel (e.g. an event photo) | it shows on the website |
| Send an email to `heh@entrepreneurhub.in` | it still arrives (MX records untouched) |

Keep the old site (Vercel) for a week or two. If something goes wrong, putting the two DNS records from step 8
back restores it.

---

## Updating the site later

When the repository has new changes:

```bash
cd /srv/heh/repo && git pull

# Website (no restart needed)
cd web && npm ci && npm run build
sudo mkdir /srv/heh/prod/frontend-new
sudo cp -r dist/. /srv/heh/prod/frontend-new/
sudo cp -n /srv/heh/prod/frontend/assets/* /srv/heh/prod/frontend-new/assets/   # keep old files for open tabs
sudo mv /srv/heh/prod/frontend /srv/heh/prod/backups/frontend-$(date +%Y%m%d%H%M)
sudo mv /srv/heh/prod/frontend-new /srv/heh/prod/frontend

# API and database (only when backend/ changed)
sudo cp -r /srv/heh/repo/backend/src /srv/heh/repo/backend/migrations \
           /srv/heh/repo/backend/package.json /srv/heh/repo/backend/package-lock.json /srv/heh/prod/backend/
cd /srv/heh/prod/backend && sudo npm ci --omit=dev
sudo -u heh node src/migrate.js        # applies new database changes, if any
sudo systemctl restart heh-api
curl http://127.0.0.1:1502/api/health
```

The `cp -n` line matters: browser tabs opened before the update still ask for the previous version's files,
and without them those tabs show a blank page until refreshed.

**Database changes** are files in `backend/migrations/` (`0001_...sql`, `0002_...sql`, ...), applied in order by
`node src/migrate.js`, which remembers what it has applied. Never edit a migration that has already been
applied; the runner checks and refuses. Add a new file instead (`npm run db:migrate:new -- <name>`).

## Backups

Set up a nightly backup of the database and the two upload folders, and copy the files off the server
(another server, cloud storage, or your computer) regularly:

```bash
sudo tee /etc/cron.d/heh-backup > /dev/null <<'EOF'
30 2 * * * postgres pg_dump -Fc heh > /srv/heh/prod/backups/heh-$(date +\%a).dump
45 2 * * * root tar -czf /srv/heh/prod/backups/uploads-$(date +\%a).tgz -C /srv/heh/prod uploads uploads-documents
EOF
sudo chown postgres /srv/heh/prod/backups
```

This keeps one backup per weekday (seven in total, overwritten each week). To restore a database backup, use
`pg_restore` into an empty database as in step 5.

## Useful commands

| Task | Command |
|---|---|
| API status / restart | `systemctl status heh-api` / `sudo systemctl restart heh-api` |
| API logs | `tail -f /srv/heh/prod/logs/api.log /srv/heh/prod/logs/api-error.log` |
| nginx logs | `tail -f /var/log/nginx/heh-access.log /var/log/nginx/heh-error.log` |
| Test and reload nginx | `sudo nginx -t && sudo systemctl reload nginx` |
| Database prompt | `sudo -u postgres psql heh` |
| Migration status | `cd /srv/heh/prod/backend && sudo -u heh node src/migrate.js status` |

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `502 Bad Gateway` | The API is not running: `systemctl status heh-api`, then read `logs/api-error.log`. |
| API exits with "Missing required env var" | Fill in that value in `backend/.env` and restart. |
| Pages show `404` but the home page works | nginx is missing `try_files $uri $uri.html $uri/ =404;` in `location /`. |
| Signed in, but sent back to `/login` | nginx must pass `X-Forwarded-Proto` and the API must run on the same server (it trusts only a local proxy); use the nginx file from step 7 unchanged. |
| Image uploads fail | `uploads/` must belong to `heh`; nginx `client_max_body_size` must be at least `6m`. |
| Member documents fail to upload | `uploads-documents/` must belong to `heh` and be listed in `ReadWritePaths` (step 6). |
| "Too many sign-in attempts" | Sign-in allows 10 tries per 15 minutes per address; wait, or restart the API. |
| "Forgot Password?" says email is not set up | Fill in the `SMTP_*` settings (step 4) and restart the API. |
| Forgotten admin password with no email set up | Make a hash with `node src/hash-password.js 'New-Password-123'`, then `sudo -u postgres psql heh -c "UPDATE admin_users SET password_hash = '<hash>' WHERE email = '<admin email>';"` (keep the single quotes; the hash contains `$`). |

## Security notes

- Never commit `backend/.env`, database exports or the `uploads-documents` folder to Git.
- `uploads-documents` holds members' private documents: keep it out of nginx and out of public backups.
- Keep the server updated (`sudo apt update && sudo apt -y upgrade`) and allow only ports 22, 80 and 443.
- Use SSH keys rather than passwords for server access.

See `README.md` for how the code is organised and how to run it on a developer computer.
