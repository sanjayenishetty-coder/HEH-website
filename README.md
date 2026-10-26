# heh — Hyderabad Entrepreneurs Hub website

Static website for **Hyderabad Entrepreneurs Hub (HEH)**, built from the design screenshots in `images/`.

**Live:** https://heh.visuprojects.in  (also http://169.58.149.137:1501)

## Structure

```
images/                 Original design screenshots (source of truth for layout/content)
htmls/                  The website — this folder is what gets deployed
  index.html            Home
  about.html            About HEH
  membership.html       Membership
  styles.css            Shared styles for all pages (colours, fonts, header, responsive rules)
  assets/charminar.jpg  Home hero photo (cropped from the home screenshot)
```

Plain HTML + CSS, no build step and no framework. Fonts (Inter, Source Serif 4) load from Google Fonts.

## Run locally

Open `htmls/index.html` in a browser, or serve the folder:

```bash
cd htmls
python -m http.server 8000   # then open http://localhost:8000
```

## Editing

- Page text lives directly in each `.html` file.
- Colours and fonts are CSS variables at the top of `htmls/styles.css` (`--navy`, `--orange`, ...).
- The header/nav is repeated in every page. If you change it, change it in all three files and set `class="active"` on the current page's link.
- Placeholder links (`href="#"`): Events, Our Community, Contact Us, "View Upcoming Events", "Enquire About Membership". Point them at real pages when those exist.
- New page: copy an existing page, change `<title>`, content and the active nav link, then add the link to the nav in every page.

## Deploy

Server: Ubuntu VPS `169.58.149.137`, user `root`, SSH key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`.

| Item | Value |
|---|---|
| Files on server | `/srv/heh/prod/frontend` |
| nginx (port 1501) | `/etc/nginx/sites-available/heh-prod` |
| nginx (domain + HTTPS) | `/etc/nginx/sites-available/heh-domain` |
| Logs | `/var/log/nginx/heh-prod-*.log`, `/var/log/nginx/heh-domain-*.log` |
| SSL | Let's Encrypt via certbot, auto-renews |
| DNS | A record `heh` → `169.58.149.137` (GoDaddy, visuprojects.in) |

Upload changed files (content-only changes need no nginx reload):

```bash
scp -i "E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem" -r htmls/* root@169.58.149.137:/srv/heh/prod/frontend/
```

Check it:

```bash
curl -I https://heh.visuprojects.in/
```

> The server hosts other projects (kvgc, yoga, stock360, zoofilings, batterydukaan, whatsapp, ...).
> Only touch `/srv/heh` and the two `heh-*` nginx files. Always run `nginx -t` before `systemctl reload nginx`.
