// /login: one sign-in page for members and admins (the website's Login button). Already signed in? Go straight on.
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Login from '../admin/Login.jsx';

export default function SignIn() {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    document.title = 'Login | Hyderabad Entrepreneurs Hub';
    let live = true;
    api('/member/me').then(() => window.location.replace('/portal/'), () => api('/admin/me').then(
      () => window.location.replace('/admin/'),
      () => { if (live) setChecked(true); },
    ));
    return () => { live = false; };
  }, []);
  return checked ? <Login home={null} onSignedIn={() => {}} /> : null;
}
