// All sign-ins happen on the website's /login page. The admin panel and the Member Portal send the browser there
// when nobody is signed in, after signing out, or when the session ends; /login then comes back to the same screen.
//   app: 'admin' | 'member' (whose account to try first, and which API a reset link belongs to)
//   expired: signed out by a 401 while working (shows "Session Expired")
//   back: return to the current screen after signing in (not after "Sign out")
export function toLogin(app, { expired = false, back = true } = {}) {
  const here = new URLSearchParams(window.location.search);
  const q = new URLSearchParams({ for: app });
  if (here.get('reset')) q.set('reset', here.get('reset')); // reset links in emails open /admin/?reset= or /portal/?reset=
  else {
    if (expired) q.set('expired', '1');
    if (back && window.location.hash.length > 1) q.set('next', window.location.pathname + window.location.hash);
  }
  window.location.replace(`/login?${q}`);
}
