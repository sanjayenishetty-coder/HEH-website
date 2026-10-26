# CLAUDE.md

Static marketing site for Hyderabad Entrepreneurs Hub (HEH). See README.md for structure, local run and deploy details.

## Key facts

- `htmls/` is the site and the only thing deployed. `images/` holds the original design screenshots; match them when changing layout or copy.
- Plain HTML + one shared `htmls/styles.css`. No build, no JS framework. Keep it that way unless asked.
- Header/nav is duplicated in `index.html`, `about.html`, `membership.html`; edit all three together and keep `class="active"` on the current page's link.
- Use the CSS variables in `:root` of `styles.css` for colours/fonts rather than new hex values.
- Pages must work at phone width (breakpoints at 1080px, 860px, 520px in `styles.css`).

## Verifying changes

Screenshot pages with headless Edge before reporting done (Edge enforces ~500px min window width; for phone width, render the page inside a 390px iframe):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --screenshot=<scratchpad>\index.png "file:///E:/Personal/vishnu/projects/heh/heh/htmls/index.html"
```

## Deploying

- Server `root@169.58.149.137`, key `E:\Personal\vishnu\projects\servers\kvgc_key_pair.pem`, use `ssh -o BatchMode=yes`.
- Upload: `scp -i <key> -r htmls/* root@169.58.149.137:/srv/heh/prod/frontend/` — content changes need no nginx reload.
- Served on port 1501 (`/etc/nginx/sites-available/heh-prod`) and https://heh.visuprojects.in (`heh-domain`, certbot-managed SSL).
- **Shared production server.** Do not modify other projects' files, nginx configs, ports or firewall rules. Run `nginx -t` before any reload. Ask the user before changes outside `/srv/heh` and the `heh-*` nginx files.
- After deploying, check `https://heh.visuprojects.in/`, `/about`, `/membership` return 200. If local DNS fails, use `curl --resolve heh.visuprojects.in:443:169.58.149.137`.
