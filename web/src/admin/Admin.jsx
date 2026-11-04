// HEH admin panel: submissions (applications, enquiries, registrations) and content (events, members, stories).
// Pages live in the URL hash (#applications?status=received&q=rahul) so lists can be bookmarked and linked;
// full-page screens add a path (#registrations/12/approve, #stories/new, #reports/events).
// Layout from images/Admin Login/.../Part1: navy sidebar, top bar with search, notifications and the admin menu.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import './admin.css';
import { api } from '../lib/api.js';
import { Icon } from '../components/Icon.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Submissions from './Submissions.jsx';
import Content from './Content.jsx';
import RegistrationPages from './Registrations.jsx';
import EnquiryPages from './Enquiries.jsx';
import StoryPages from './Stories.jsx';
import EventPages from './EventWizard.jsx';
import ReportPages from './Reports.jsx';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

// Sidebar menu, in the order of the designs: [hash, menu text, icon, page title]
const TABS = [
  ['dashboard', 'Dashboard', 'home', 'Dashboard'],
  ['applications', 'Membership Applications', 'file', 'Membership Applications'],
  ['members', 'Members', 'users', 'Member Directory'],
  ['events', 'Events', 'calendar', 'Events Management'],
  ['registrations', 'Registrations', 'user-check', 'Event Registrations'],
  ['stories', 'Success Stories', 'star', 'Success Stories'],
  ['enquiries', 'Enquiries', 'chat', 'Enquiry Management'],
  ['reports', 'Reports', 'chart', 'Reports & Analytics'],
];

// Full-page screens under a menu item: #<tab>/<path...>
const PAGES = { registrations: RegistrationPages, enquiries: EnquiryPages, stories: StoryPages, events: EventPages, reports: ReportPages };

const readHash = () => {
  const [where, query = ''] = window.location.hash.slice(1).split('?');
  const [tab, ...path] = where.split('/').map(decodeURIComponent);
  const known = TABS.some(([k]) => k === tab);
  return { tab: known ? tab : 'dashboard', path: known ? path.filter(Boolean) : [], query: new URLSearchParams(query) };
};


export default function Admin() {
  const [auth, setAuth] = useState('checking'); // checking | login | app
  const [expired, setExpired] = useState(false); // signed out by a 401 while working
  const [user, setUser] = useState('Admin');
  const [meta, setMeta] = useState({ industries: [], storyCategories: [], eventCategories: [], memberTypes: [] });
  const [route, setRoute] = useState(readHash);
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef();

  useEffect(() => {
    document.body.classList.add('admin');
    const prevTitle = document.title;
    document.title = 'HEH Admin';
    return () => { document.body.classList.remove('admin'); document.title = prevTitle; };
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readHash());
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
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const showLogin = useCallback((wasExpired = false) => { setModal(null); setExpired(wasExpired); setAuth('login'); }, []);

  const call = useCallback(async (path, opts) => {
    try {
      return await api(`/admin${path}`, opts);
    } catch (err) {
      if (err.status === 401) showLogin(true);
      throw err;
    }
  }, [showLogin]);

  const showApp = useCallback(async () => {
    setAuth('app');
    try {
      const [me, m] = await Promise.all([call('/me'), call('/meta')]);
      setUser(me.user || 'Admin');
      setMeta(m);
    } catch { /* 401 handled by call */ }
  }, [call]);

  useEffect(() => { api('/admin/me').then(showApp).catch(() => showLogin()); }, [showApp, showLogin]);

  const go = (hash) => { window.location.hash = hash; };
  const reload = () => setReloadKey((k) => k + 1);

  async function logout() {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  }

  const ctx = { call, toast, openModal: setModal, closeModal, meta, go, reload, showLogin, user };
  const { tab, path, query } = route;
  const Sub = path.length || tab === 'reports' ? PAGES[tab] : null;
  const viewKey = `${window.location.hash}|${reloadKey}`;

  return (
    <Ctx.Provider value={ctx}>
      {auth === 'login' && <Login onSignedIn={showApp} expired={expired} />}

      {auth === 'app' && (
        <Shell tab={tab} path={path.join('/')} query={query} user={user} onLogout={logout} call={call} reloadKey={reloadKey}>
          {Sub && <Sub key={viewKey} path={path} query={query} />}
          {!Sub && tab === 'dashboard' && <Dashboard key={viewKey} />}
          {!Sub && ['applications', 'enquiries', 'registrations'].includes(tab) && <Submissions key={viewKey} name={tab} query={query} />}
          {!Sub && ['events', 'members', 'stories'].includes(tab) && <Content key={viewKey} name={tab} query={query} />}
        </Shell>
      )}

      {modal && (
        <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <ModalBox content={modal} />
        </div>
      )}
      {toastMsg && <div className={`toast${toastMsg.error ? ' error' : ''}`}>{toastMsg.msg}</div>}
    </Ctx.Provider>
  );
}

// Close a dropdown when clicking anywhere else or pressing Escape.
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

function Shell({ tab, path, query, user, onLogout, call, reloadKey, children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('heh-admin-collapsed') === '1');
  const [drawer, setDrawer] = useState(false); // phone/tablet menu
  const [counts, setCounts] = useState(null);
  const [bellOpen, setBellOpen, bellRef] = useDropdown();
  const [userOpen, setUserOpen, userRef] = useDropdown();
  const title = TABS.find(([k]) => k === tab)?.[3] || 'Dashboard';

  // New items for the bell, refreshed on every page change.
  useEffect(() => { call('/summary').then(setCounts, () => {}); }, [call, tab, reloadKey]);
  useEffect(() => { setDrawer(false); }, [tab]);
  // Each new screen starts at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [tab, path]);

  function toggleMenu() {
    if (window.matchMedia('(max-width: 960px)').matches) { setDrawer((d) => !d); return; }
    setCollapsed((c) => { localStorage.setItem('heh-admin-collapsed', c ? '0' : '1'); return !c; });
  }

  // Search the current list; from the dashboard, search members.
  function search(e) {
    e.preventDefault();
    const q = e.currentTarget.q.value.trim();
    const target = ['dashboard', 'reports'].includes(tab) ? 'members' : tab;
    const p = new URLSearchParams(tab === target && !path ? query : '');
    if (q) p.set('q', q); else p.delete('q');
    window.location.hash = `${target}${p.toString() ? `?${p}` : ''}`;
  }

  const notes = counts ? [
    [counts.new_applications, ['new membership application', 'new membership applications'], 'applications?status=received', 'file'],
    [counts.new_enquiries, ['new enquiry', 'new enquiries'], 'enquiries?status=received', 'chat'],
    [counts.pending_registrations, ['registration waiting for approval', 'registrations waiting for approval'], 'registrations?status=pending', 'user-check'],
    [counts.recent_registrations, ['event registration in the last 7 days', 'event registrations in the last 7 days'], 'registrations', 'user-check'],
  ].filter(([n]) => n > 0) : [];

  return (
    <div className={`adm${collapsed ? ' collapsed' : ''}${drawer ? ' drawer-open' : ''}`}>
      <aside className="adm-side">
        <a className="adm-logo" href="#dashboard" aria-label="HEH Admin dashboard">
          {/* same logo as the website header; the icon alone when the sidebar is collapsed */}
          <img className="full" src="/assets/brand/logo.png" alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
          <img className="mark" src="/assets/brand/favicon.png" alt="" width="64" height="64" />
        </a>
        <nav className="adm-nav">
          {TABS.map(([k, text, icon]) => (
            <a key={k} href={`#${k}`} className={k === tab ? 'on' : ''} title={collapsed ? text : undefined} aria-current={k === tab ? 'page' : undefined}>
              <Icon name={icon} solid /><span>{text}</span>
            </a>
          ))}
        </nav>
      </aside>
      <div className="adm-scrim" onClick={() => setDrawer(false)} />

      <div className="adm-main">
        <header className="adm-top">
          <button type="button" className="adm-burger" onClick={toggleMenu} aria-label="Menu"><Icon name="menu" /></button>
          <h1 className="adm-title">{title}</h1>
          <form className="adm-search" onSubmit={search} role="search">
            <Icon name="search" />
            <input key={`${tab}${query.get('q') || ''}`} name="q" defaultValue={query.get('q') || ''} placeholder="Search anything…" aria-label="Search" />
          </form>
          <div className="adm-drop" ref={bellRef}>
            <button type="button" className="adm-bell" onClick={() => setBellOpen((o) => !o)} aria-label={`Notifications${notes.length ? ' (new)' : ''}`} aria-expanded={bellOpen}>
              <Icon name="bell" />{notes.length > 0 && <i className="dot" />}
            </button>
            {bellOpen && (
              <div className="adm-menu wide">
                <b className="adm-menu-head">Notifications</b>
                {notes.length ? notes.map(([n, [one, many], hash, icon]) => (
                  <a key={hash} href={`#${hash}`} onClick={() => setBellOpen(false)}>
                    <Icon name={icon} /> <span><b>{n}</b> {n === 1 ? one : many}</span>
                  </a>
                )) : <p className="adm-menu-empty">You’re all caught up.</p>}
              </div>
            )}
          </div>
          <div className="adm-drop" ref={userRef}>
            <button type="button" className="adm-user" onClick={() => setUserOpen((o) => !o)} aria-expanded={userOpen}>
              <span className="a-avatar">{String(user || 'A')[0].toUpperCase()}</span>
              <span className="name">{user === 'admin' ? 'Admin' : user}</span>
              <Icon name="chevron-down" />
            </button>
            {userOpen && (
              <div className="adm-menu">
                <a href="/" target="_blank" rel="noopener"><Icon name="external" /> View website</a>
                <button type="button" onClick={onLogout}><Icon name="logout" /> Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}

// Each newly opened editor/detail starts scrolled to the top.
function ModalBox({ content }) {
  const box = useRef();
  useEffect(() => { if (box.current) box.current.scrollTop = 0; }, [content]);
  return <div className="box wide" ref={box}>{content}</div>;
}

// Load data for a view: { data, error } — shows the same Loading / error boxes as before.
export function useLoad(loader) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let live = true;
    loader().then((data) => live && setState({ data, error: null }), (error) => live && setState({ data: null, error }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export function ViewState({ state, children }) {
  if (state.error) return <div className="empty">{state.error.message}</div>;
  if (!state.data) return <div className="loading">Loading…</div>;
  return children(state.data);
}
