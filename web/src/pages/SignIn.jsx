// /login: the one sign-in page for members and admins (the website's Login button; /admin/ and /portal/ send
// signed-out visitors here, see admin/toLogin.js). Already signed in? Go straight on.
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Login from '../admin/Login.jsx';

export default function SignIn() {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    document.title = 'Login | Hyderabad Entrepreneurs Hub';
    let live = true;
    const q = new URLSearchParams(window.location.search);
    if (q.get('reset')) { setChecked(true); return undefined; }
    const next = q.get('next') || '';
    const go = (app) => window.location.replace(next.startsWith(app) ? next : app);
    const [a, b] = q.get('for') === 'admin' ? [['/admin', '/admin/'], ['/member', '/portal/']] : [['/member', '/portal/'], ['/admin', '/admin/']];
    api(`${a[0]}/me`).then(() => go(a[1]), () => api(`${b[0]}/me`).then(
      () => go(b[1]),
      () => { if (live) setChecked(true); },
    ));
    return () => { live = false; };
  }, []);
  return checked ? <Login home={null} onSignedIn={() => {}} /> : null;
}
