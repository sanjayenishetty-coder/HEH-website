// HEH admin panel: submissions (applications, enquiries, registrations) and content (events, members, stories).
// Tabs live in the URL hash (#applications?status=received) so lists can be bookmarked and linked.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import './admin.css';
import { api } from '../lib/api.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Submissions from './Submissions.jsx';
import Content from './Content.jsx';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

const TABS = [
  ['dashboard', 'Dashboard'],
  ['applications', 'Applications'],
  ['enquiries', 'Enquiries'],
  ['registrations', 'Registrations'],
  ['events', 'Events'],
  ['members', 'Members'],
  ['stories', 'Stories'],
];

const readHash = () => {
  const [tab, query = ''] = window.location.hash.slice(1).split('?');
  return { tab: TABS.some(([k]) => k === tab) ? tab : 'dashboard', query: new URLSearchParams(query) };
};

export const label = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Admin() {
  const [auth, setAuth] = useState('checking'); // checking | login | app
  const [meta, setMeta] = useState({ industries: [], storyCategories: [], eventCategories: [] });
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

  const showLogin = useCallback(() => { setModal(null); setAuth('login'); }, []);

  const call = useCallback(async (path, opts) => {
    try {
      return await api(`/admin${path}`, opts);
    } catch (err) {
      if (err.status === 401) showLogin();
      throw err;
    }
  }, [showLogin]);

  const showApp = useCallback(async () => {
    setAuth('app');
    try { setMeta(await call('/meta')); } catch { /* 401 handled by call */ }
  }, [call]);

  useEffect(() => { api('/admin/me').then(showApp).catch(showLogin); }, [showApp, showLogin]);

  const go = (hash) => { window.location.hash = hash; };
  const reload = () => setReloadKey((k) => k + 1);

  async function logout() {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  }

  const ctx = { call, toast, openModal: setModal, closeModal, meta, go, reload, showLogin };
  const { tab, query } = route;
  const viewKey = `${window.location.hash}|${reloadKey}`;

  return (
    <Ctx.Provider value={ctx}>
      {auth === 'login' && <Login onSignedIn={showApp} />}

      {auth === 'app' && (
        <div className="app">
          <header className="topbar">
            <div className="brand">
              <img src="/assets/brand/logo.png" alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
              <span className="tag">Admin</span>
            </div>
            <nav className="tabs">
              {TABS.map(([k, text]) => (
                <button key={k} className={k === tab ? 'active' : ''} onClick={() => go(k)}>{text}</button>
              ))}
            </nav>
            <div className="right">
              <a href="/" target="_blank" rel="noopener">View site</a>
              <button className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
            </div>
          </header>
          <main className="workspace">
            {tab === 'dashboard' && <Dashboard key={viewKey} />}
            {['applications', 'enquiries', 'registrations'].includes(tab) && <Submissions key={viewKey} name={tab} query={query} />}
            {['events', 'members', 'stories'].includes(tab) && <Content key={viewKey} name={tab} />}
          </main>
        </div>
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
