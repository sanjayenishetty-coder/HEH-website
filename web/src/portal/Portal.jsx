// HEH Member Portal at /portal/ (designs: images/Member Login Web Application/Part 1).
// Navy sidebar with the ten menu items from the designs, top bar with search, notifications and the member menu.
// Screens live in the URL hash (#events/registrations/HEH-20261114-0001) so every screen can be linked and reloaded.
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import './portal.css';
import { api } from '../lib/api.js';
import { Icon } from '../components/Icon.jsx';
import { toLogin } from '../admin/toLogin.js';

const Dashboard = lazy(() => import('./Dashboard.jsx'));
const Profile = lazy(() => import('./Profile.jsx'));
const Directory = lazy(() => import('./Directory.jsx'));
const Connections = lazy(() => import('./Connections.jsx'));
const Events = lazy(() => import('./Events.jsx'));
const Gallery = lazy(() => import('./Gallery.jsx'));
const Feed = lazy(() => import('./Feed.jsx'));

const Ctx = createContext(null);
export const usePortal = () => useContext(Ctx);

// [hash, menu text, icon]
const MENU = [
  ['dashboard', 'Dashboard', 'home'],
  ['profile', 'My Profile', 'user'],
  ['directory', 'Member Directory', 'users'],
  ['events', 'Events', 'calendar'],
  ['connections', 'My Connections', 'share'],
  ['gallery', 'Event Gallery', 'image'],
  ['stories', 'Success Stories', 'trophy'],
  ['announcements', 'Announcements', 'megaphone'],
  ['activities', 'My Activities', 'chart'],
  ['settings', 'Settings', 'gear'],
];
const SCREENS = {
  dashboard: Dashboard, profile: Profile, directory: Directory, events: Events, connections: Connections, gallery: Gallery,
  stories: Feed, announcements: Feed, activities: Feed, settings: Feed, notifications: Feed, search: Feed,
};

const readHash = () => {
  const [where, q = ''] = window.location.hash.slice(1).split('?');
  const [tab, ...path] = where.split('/').map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  const known = Boolean(SCREENS[tab]);
  return { tab: known ? tab : 'dashboard', path: known ? path.filter(Boolean) : [], query: new URLSearchParams(q) };
};


export default function Portal() {
  const [auth, setAuth] = useState('checking'); // checking | login (on the way to /login) | app
  const [me, setMe] = useState(null);
  const [meta, setMeta] = useState(null);
  const [route, setRoute] = useState(readHash);
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef();

  useEffect(() => {
    document.body.classList.add('portal');
    const prev = document.title;
    document.title = 'HEH Member Portal';
    return () => { document.body.classList.remove('portal'); document.title = prev; };
  }, []);
  useEffect(() => {
    const onHash = () => { setRoute(readHash()); setModal(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => {
    if (!modal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal, closeModal]);

  const toast = useCallback((msg, error = false) => {
    setToastMsg({ msg, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);
  // Sign-in is on /login (wasExpired: the session ended while working; signedOut: after "Sign out").
  const showLogin = useCallback((wasExpired = false, signedOut = false) => {
    setModal(null);
    setAuth('login');
    toLogin('member', { expired: wasExpired, back: !signedOut });
  }, []);
  const call = useCallback(async (path, opts) => {
    try {
      return await api(`/member${path}`, opts);
    } catch (err) {
      if (err.status === 401) showLogin(true);
      throw err;
    }
  }, [showLogin]);
  const refreshMe = useCallback(() => call('/me').then(setMe, () => {}), [call]);

  const showApp = useCallback(async () => {
    try {
      const [m, x] = await Promise.all([call('/me'), call('/meta')]);
      setMe(m);
      setMeta(x);
      setAuth('app');
    } catch { /* 401 handled by call */ }
  }, [call]);
  useEffect(() => { api('/member/me').then(showApp).catch(() => showLogin()); }, [showApp, showLogin]);

  async function logout() {
    await api('/member/logout', { method: 'POST' }).catch(() => {});
    setMe(null);
    showLogin(false, true);
  }

  const go = useCallback((hash) => { window.location.hash = hash; }, []);
  const ctx = { call, toast, openModal: setModal, closeModal, go, me, refreshMe, meta, logout };
  const Screen = SCREENS[route.tab];

  return (
    <Ctx.Provider value={ctx}>
      {auth === 'app' && me && (
        <Shell route={route} me={me} onLogout={logout}>
          {me.temporary_password && route.tab !== 'settings' && (
            <div className="p-notice">
              <Icon name="lock-key" />
              <span>You are signed in with a temporary password from HEH. Please choose your own password.</span>
              <a className="p-btn sm" href="#settings/password">Change Password</a>
            </div>
          )}
          <Suspense fallback={<div className="p-loading">Loading…</div>}>
            <Screen key={window.location.hash} tab={route.tab} path={route.path} query={route.query} />
          </Suspense>
        </Shell>
      )}
      {modal && (
        <div className="p-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>{modal}</div>
      )}
      {toastMsg && <div className={`p-toast${toastMsg.error ? ' error' : ''}`} role="status">{toastMsg.msg}</div>}
    </Ctx.Provider>
  );
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return [open, setOpen, ref];
}

function Shell({ route, me, onLogout, children }) {
  const [drawer, setDrawer] = useState(false);
  const [userOpen, setUserOpen, userRef] = useDropdown();
  const { tab } = route;
  const menuTab = tab === 'notifications' || tab === 'search' ? 'dashboard' : tab;
  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [tab, route.path.join('/')]);

  function search(e) {
    e.preventDefault();
    const q = e.currentTarget.q.value.trim();
    if (q) window.location.hash = `search?q=${encodeURIComponent(q)}`;
  }
  const initials = String(me.full_name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className={`pt${drawer ? ' drawer-open' : ''}`}>
      <aside className="pt-side">
        <a className="pt-logo" href="#dashboard" aria-label="Member Portal dashboard">
          <img src="/assets/brand/logo-light.png" alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
          <span>HEH – Entrepreneur Community</span>
        </a>
        <span className="pt-badge"><Icon name="users" /> Member Portal</span>
        <nav className="pt-nav">
          {MENU.map(([k, text, icon]) => (
            <a key={k} href={`#${k}`} className={k === menuTab ? 'on' : ''} aria-current={k === menuTab ? 'page' : undefined}>
              <Icon name={icon} /><span>{text}</span>
            </a>
          ))}
        </nav>
        <div className="pt-art" aria-hidden="true" />
      </aside>
      <div className="pt-scrim" onClick={() => setDrawer(false)} />
      <div className="pt-main">
        <header className="pt-top">
          <button type="button" className="pt-burger" onClick={() => setDrawer((d) => !d)} aria-label="Menu"><Icon name="menu" /></button>
          <form className="pt-search" onSubmit={search} role="search">
            <Icon name="search" />
            <input key={route.query.get('q') || ''} name="q" defaultValue={tab === 'search' ? route.query.get('q') || '' : ''}
              placeholder="Search members, events, or announcements…" aria-label="Search members, events, or announcements" />
          </form>
          <a className="pt-bell" href="#notifications" aria-label={`Notifications${me.unread ? ` (${me.unread} unread)` : ''}`}>
            <Icon name="bell" />{me.unread > 0 && <i className="dot" />}
          </a>
          <div className="pt-drop" ref={userRef}>
            <button type="button" className="pt-user" onClick={() => setUserOpen((o) => !o)} aria-expanded={userOpen}>
              {me.photo_url ? <img className="pt-av" src={me.photo_url} alt="" /> : <span className="pt-av">{initials}</span>}
              <span className="pt-name"><b>{me.full_name}</b><small>HEH Member</small></span>
              <Icon name="chevron-down" />
            </button>
            {userOpen && (
              <div className="pt-menu" onClick={() => setUserOpen(false)}>
                <a href="#profile"><Icon name="user" /> My Profile</a>
                <a href="#notifications"><Icon name="bell" /> Notifications</a>
                <a href="#settings"><Icon name="gear" /> Settings</a>
                <a href="/" target="_blank" rel="noopener"><Icon name="external" /> View website</a>
                <button type="button" onClick={onLogout}><Icon name="logout" /> Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="pt-work">{children}</main>
      </div>
    </div>
  );
}
