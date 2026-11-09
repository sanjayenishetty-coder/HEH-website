// Success Stories, Announcements, Notifications (list, details, preferences), My Activities, Search (results and
// advanced search) and Settings (designs 3, 12, 14, 23, 53, 68, 81).
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { useApi } from '../lib/hooks.js';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';
import {
  Avatar, Card, Empty, Field, Head, KV, Load, Pill, Select, Stat, StatusPill, Tabs, Toggle, day, eventState,
  useAction, useData, when,
} from './parts.jsx';

export default function Feed({ tab, path, query }) {
  if (tab === 'stories') return path[0] ? <Story slug={path[0]} /> : <Stories />;
  if (tab === 'announcements') return <Announcements />;
  if (tab === 'activities') return <Activities />;
  if (tab === 'search') return path[0] === 'advanced' ? <AdvancedSearch query={query} /> : <SearchResults query={query} />;
  if (tab === 'settings') return <Settings section={path[0]} />;
  if (path[0] === 'preferences') return <Preferences back="notifications" />;
  if (/^\d+$/.test(path[0] || '')) return <Notification id={path[0]} />;
  return <Notifications query={query} />;
}

// ---------- Success stories (the published stories from the website) ----------

function Stories() {
  const state = useApi('/stories?limit=30');
  const [cat, setCat] = useState('');
  return (
    <>
      <Head title="Success Stories" sub="Real connections and business impact from the HEH community" back="dashboard" />
      <Load state={state}>
        {(d) => {
          const cats = [...new Set(d.items.map((s) => s.category))];
          const rows = d.items.filter((s) => !cat || s.category === cat);
          return (
            <Card title={`Member Success Stories (${rows.length})`} bar action={cats.length > 1 && <Select all="All Categories" options={cats} value={cat} onChange={setCat} aria-label="Category" />}>
              {rows.length ? (
                <div className="p-story-grid">
                  {rows.map((s) => (
                    <a key={s.id} className="p-story" href={`#stories/${s.slug}`}>
                      <span className={`p-thumb${s.image_url ? '' : ' empty'}`} style={s.image_url ? { backgroundImage: `url('${s.image_url}')` } : undefined}>{!s.image_url && <Icon name="trophy" />}</span>
                      <Pill tone="orange">{s.category}</Pill>
                      <b>{s.title}</b>
                      <small>{s.summary}</small>
                      <span className="p-link">Read Story <Icon name="arrow-right" /></span>
                    </a>
                  ))}
                </div>
              ) : <Empty icon="trophy" title="No stories yet">Member success stories will appear here.</Empty>}
            </Card>
          );
        }}
      </Load>
    </>
  );
}

function Story({ slug }) {
  const state = useApi(`/stories/${encodeURIComponent(slug)}`);
  return (
    <Load state={state}>
      {(s) => (
        <>
          <Head title="Success Story" crumbs={[['Success Stories', 'stories'], [s.title]]} back="stories" />
          <section className="p-card p-article">
            {s.image_url && <img src={s.image_url} alt="" />}
            <Pill tone="orange">{s.category}</Pill>
            <h2>{s.title}</h2>
            <p className="p-muted">{fmt.date(s.published_on)}{s.business_category ? ` · ${s.business_category}` : ''}</p>
            {String(s.body || s.summary).split(/\n\s*\n/).map((para) => <p key={para.slice(0, 40)} className="p-text">{para}</p>)}
            {(s.members_involved || []).length > 0 && <KV rows={[['Members Involved', s.members_involved.join(', ')], (s.companies || []).length > 0 && ['Companies', s.companies.join(', ')]]} />}
            <div className="p-form-acts"><a className="p-btn outline" href="#stories"><Icon name="arrow-left" /> All Stories</a>
              <a className="p-btn outline" href={`/story?s=${encodeURIComponent(s.slug)}`} target="_blank" rel="noopener">Open on Website <Icon name="external" /></a></div>
          </section>
        </>
      )}
    </Load>
  );
}

// ---------- Announcements ----------

function Announcements() {
  const state = useData('/announcements');
  return (
    <>
      <Head title="Announcements" sub="Latest news, event openings and highlights from HEH" back="dashboard" />
      <Load state={state}>
        {(d) => (
          <Card title="Recent Announcements" icon="megaphone">
            {d.items.length ? (
              <ul className="p-list dots big">
                {d.items.map((a) => (
                  <li key={a.key}><a href={`#${a.link}`}>
                    <span className={`p-ico ${a.kind === 'story' ? 'green' : 'orange'}`}><Icon name={a.kind === 'story' ? 'trophy' : 'megaphone'} /></span>
                    <span><b>{a.title}</b><small>{a.text}</small><small className="p-muted">{fmt.date(a.date)}</small></span>
                    <Pill tone={a.kind === 'story' ? 'green' : 'orange'}>{a.kind === 'story' ? 'Success Story' : 'Event'}</Pill>
                    <Icon name="chevron-right" />
                  </a></li>
                ))}
              </ul>
            ) : <Empty icon="megaphone" title="No announcements">HEH announcements will appear here.</Empty>}
          </Card>
        )}
      </Load>
    </>
  );
}

// ---------- My activities ----------

const ACT = {
  registered: ['ticket', 'blue', (a) => `Registered for ${a.title}`, (a) => `#events/registrations/${a.link_ref}`],
  attended: ['check-circle', 'green', (a) => `Attended ${a.title}`, (a) => `#events/registrations/${a.link_ref}`],
  connected: ['handshake', 'orange', (a) => `Connected with ${a.title}`, (a) => `#connections/${a.link_ref}`],
  request: ['send', 'purple', (a) => `Sent a connection request to ${a.title}`, (a) => `#connections/requests/${a.link_ref}`],
  document: ['file', 'grey', (a) => `Uploaded ${a.title}`, (a) => `#profile/documents/${a.link_ref}`],
};

export function ActivityList({ items }) {
  if (!items.length) return <Empty icon="chart">Your event registrations, connections and profile updates will appear here.</Empty>;
  return (
    <ul className="p-acts-list">
      {items.map((a) => {
        const [icon, tone, text, link] = ACT[a.kind];
        return (
          <li key={`${a.kind}${a.link_ref}${a.at}`}>
            <a href={link(a)}>
              <span className={`p-ico ${tone}`}><Icon name={icon} /></span>
              <span><b>{text(a)}</b><small><Icon name="calendar" /> {day(a.at)}{a.place ? ` · ${a.place}` : ''}</small></span>
              <Pill tone={tone}>{{ registered: a.status === 'pending' ? 'Pending' : 'Registered', attended: 'Attended', connected: 'Connection', request: a.status === 'accepted' ? 'Accepted' : a.status === 'pending' ? 'Pending' : 'Request', document: 'Document' }[a.kind]}</Pill>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Activities() {
  const state = useData('/activities');
  const [kind, setKind] = useState('');
  return (
    <>
      <Head title="My Activities" sub="Your participation, connections and updates in HEH" back="dashboard" />
      <Load state={state}>
        {(d) => (
          <>
            <div className="p-stats">
              <Stat icon="calendar" tone="blue" label="Events Attended" value={d.counts.attended} href="#events/history" />
              <Stat icon="users" tone="orange" label="Connections Made" value={d.counts.connections} href="#connections/network" />
              <Stat icon="star" tone="green" label="Recent Activities" value={d.counts.recent} />
            </div>
            <Card title="Activity Timeline" icon="bolt" action={<Select all="All Activity" options={[['registered', 'Event Registrations'], ['attended', 'Attendance'], ['connected', 'Connections'], ['request', 'Requests Sent'], ['document', 'Documents']]} value={kind} onChange={setKind} aria-label="Activity type" />}>
              <ActivityList items={d.items.filter((a) => !kind || a.kind === kind)} />
            </Card>
          </>
        )}
      </Load>
    </>
  );
}

// ---------- Notifications ----------

const N_TABS = [['', 'All Notifications', 'bell'], ['events', 'Events', 'calendar'], ['announcements', 'Announcements', 'megaphone'], ['updates', 'My Updates', 'user']];
const N_ICON = { event: ['calendar', 'orange'], announcement: ['megaphone', 'blue'], story: ['trophy', 'purple'], connection: ['user-plus', 'green'], update: ['info', 'blue'] };

function Notifications({ query }) {
  const kind = N_TABS.some(([k]) => k === query.get('kind')) ? query.get('kind') || '' : '';
  const state = useData(`/notifications${kind ? `?kind=${kind}` : ''}`);
  const { call, toast, refreshMe } = usePortal();
  const [menu, setMenu] = useState(null);
  const act = async (path, opts, msg) => {
    try { await call(path, opts); if (msg) toast(msg); state.reload(); refreshMe(); } catch (err) { toast(err.message, true); }
  };
  return (
    <>
      <Head title="Notifications" sub="Stay updated with your HEH activities" back="dashboard">
        <button type="button" className="p-btn outline" onClick={() => act('/notifications/read-all', { method: 'POST' }, 'All notifications marked as read')}><Icon name="check" /> Mark all as read</button>
        <a className="p-btn outline" href="#notifications/preferences"><Icon name="gear" /> Preferences</a>
      </Head>
      <Load state={state}>
        {(d) => (
          <>
            <Tabs items={N_TABS.map(([k, l, i]) => [k, l, i, d.counts[k || 'all']])} value={kind}
              onChange={(k) => { window.location.hash = `notifications${k ? `?kind=${k}` : ''}`; }} />
            <section className="p-card">
              {d.items.length ? (
                <ul className="p-notes">
                  {d.items.map((n) => {
                    const [icon, tone] = N_ICON[n.kind] || N_ICON.update;
                    return (
                      <li key={n.id} className={n.read_at ? '' : 'unread'}>
                        <a href={`#notifications/${n.id}`}>
                          <i className="dot" />
                          <span className={`p-ico ${tone}`}><Icon name={icon} /></span>
                          <span><b>{n.title}</b><small>{n.body}</small></span>
                          <small className="ago">{when(n.created_at)}</small>
                        </a>
                        <div className="p-more">
                          <button type="button" aria-label="More actions" onClick={() => setMenu(menu === n.id ? null : n.id)}><Icon name="more" /></button>
                          {menu === n.id && (
                            <div className="pt-menu" onMouseLeave={() => setMenu(null)}>
                              <button type="button" onClick={() => act(`/notifications/${n.id}/${n.read_at ? 'unread' : 'read'}`, { method: 'POST' })}>
                                <Icon name="check" /> Mark as {n.read_at ? 'unread' : 'read'}</button>
                              <button type="button" onClick={() => act(`/notifications/${n.id}`, { method: 'DELETE' }, 'Notification removed')}><Icon name="trash" /> Remove</button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <Empty icon="bell" title="You’re all caught up">New notifications will appear here.</Empty>}
            </section>
          </>
        )}
      </Load>
    </>
  );
}

function Notification({ id }) {
  const state = useData(`/notifications/${id}`);
  const { refreshMe } = usePortal();
  useEffect(() => { if (state.data) refreshMe(); }, [state.data, refreshMe]); // the bell's unread count
  return (
    <Load state={state}>
      {(n) => {
        const [icon, tone] = N_ICON[n.kind] || N_ICON.update;
        const e = n.event;
        const label = { event: 'Event', announcement: 'Announcement', story: 'Success Story', connection: 'Connection', update: 'Update' }[n.kind];
        return (
          <>
            <Head title="Notification Details" crumbs={[['Notifications', 'notifications'], [n.title]]} back="notifications" />
            <section className="p-card">
              <div className="p-note-head">
                <span className={`p-ico ${tone} big`}><Icon name={icon} /></span>
                <div><h2>{n.title}</h2>{e && <p className="p-muted">{e.title}</p>}</div>
                <div className="side"><Pill tone="blue" icon={icon}>{label}</Pill><Pill tone="green" icon="check">Read</Pill></div>
              </div>
              <p className="p-text">{n.body}</p>
              <p className="p-muted small">{fmt.stamp(n.created_at)}</p>
              {e && (
                <div className="p-sub-card">
                  <KV rows={[['Event Date', `${fmt.date(e.event_date)} (${fmt.shortDay(e.event_date)})`], ['Time', fmt.timeRange(e.start_time, e.end_time)],
                    ['Venue', e.venue_name || e.city], e.status && ['Registration', <StatusPill key="s" status={e.status} />]]} />
                </div>
              )}
              <div className="p-form-acts">
                <a className="p-btn outline" href="#notifications">Back</a>
                {n.link && <a className="p-btn" href={`#${n.link}`}>{n.kind === 'event' || e ? 'View Event' : 'Open'} <Icon name="arrow-right" /></a>}
              </div>
            </section>
          </>
        );
      }}
    </Load>
  );
}

function Preferences({ back }) {
  const state = useData('/settings');
  return <Load state={state}>{(s) => <PrefsForm s={s} back={back} />}</Load>;
}

function PrefsForm({ s, back, embedded = false }) {
  const { call, toast, go } = usePortal();
  const [v, setV] = useState(s.notify);
  const [busy, run] = useAction();
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const row = (k, icon, title, text, disabled) => (
    <div className="p-pref"><span className="p-ico orange"><Icon name={icon} /></span><span><b>{title}</b><small>{text}</small></span>
      {disabled ? <Pill>Coming soon</Pill> : <Toggle checked={v[k]} onChange={set(k)} label={title} />}</div>
  );
  const save = () => run(async () => { await call('/settings/notifications', { method: 'PUT', body: v }); toast('Preferences saved'); if (!embedded) go(back); }).catch(() => {});
  return (
    <>
      {!embedded && <Head title="Notification Preferences" crumbs={[['Notifications', 'notifications'], ['Preferences']]} back={back} />}
      <section className="p-card">
        <h3 className="p-sec"><Icon name="bell" /> Notification Categories <small>Choose the updates you want to receive from HEH.</small></h3>
        {row('events', 'calendar', 'Event Reminders', 'Upcoming events, registrations and schedule updates')}
        {row('connections', 'users', 'Connection Requests', 'New connection requests and networking updates')}
        {row('announcements', 'megaphone', 'Community Announcements', 'Important HEH community information and updates')}
        {row('stories', 'trophy', 'Success Stories', 'Member achievements, milestones and featured stories')}
        <h3 className="p-sec"><Icon name="mail" /> Delivery Channels <small>Select your preferred communication channels.</small></h3>
        {row('in_app', 'bell', 'In-App Notifications', 'Receive alerts within your HEH member portal')}
        {row('email', 'mail', 'Email Notifications', s.mail ? 'Updates to your registered email address' : 'Updates to your registered email address (once HEH turns on email)')}
        {row('whatsapp', 'whatsapp', 'WhatsApp Notifications', 'Opt in for important updates on WhatsApp', true)}
        <div className="p-form-acts">
          {!embedded && <a className="p-btn outline" href={`#${back}`}>Cancel</a>}
          <button type="button" className="p-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Preferences'}</button>
        </div>
      </section>
    </>
  );
}

// ---------- Search ----------

const S_TABS = [['', 'All Results', 'grid'], ['members', 'Members', 'users'], ['events', 'Events', 'calendar'], ['announcements', 'Updates', 'megaphone'], ['stories', 'Stories', 'trophy']];

function SearchResults({ query }) {
  const q = query.get('q') || '';
  const extra = ['industry', 'location'].filter((k) => query.get(k)).map((k) => `&${k}=${encodeURIComponent(query.get(k))}`).join('');
  const state = useData(`/search?q=${encodeURIComponent(q)}${extra}`);
  const [tab, setTab] = useState(query.get('in') || '');
  const [text, setText] = useState(q);
  return (
    <>
      <Head title="Search Results" crumbs={[['Search'], [`Results for “${q}”`]]} back="dashboard">
        <a className="p-btn outline" href={`#search/advanced?q=${encodeURIComponent(q)}`}><Icon name="sliders" /> Modify Search</a>
      </Head>
      <form className="p-searchbar" onSubmit={(e) => { e.preventDefault(); if (text.trim()) window.location.hash = `search?q=${encodeURIComponent(text.trim())}`; }}>
        <label className="p-search-in"><Icon name="search" /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search members, events, or announcements…" aria-label="Search" /></label>
        <button className="p-btn" type="submit"><Icon name="search" /> Search</button>
      </form>
      <Load state={state}>
        {(d) => {
          const counts = { members: d.members.length, events: d.events.length, announcements: d.announcements.length, stories: d.stories.length };
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const show = (k) => !tab || tab === k;
          return (
            <>
              <Tabs items={S_TABS.map(([k, l, i]) => [k, l, i, k ? counts[k] : total])} value={tab} onChange={setTab} />
              <Card title={`${tab ? counts[tab] : total} matching results for “${q}”`}>
                {total === 0 && <Empty icon="search" title="No results">Try a different word, or use Modify Search.</Empty>}
                <ul className="p-results">
                  {show('members') && d.members.map((m) => (
                    <li key={`m${m.id}`}><a href={`#directory/${m.slug}`}><Avatar name={m.full_name} photo={m.photo_url} size={40} />
                      <span><b>{m.full_name}</b><small>{[m.designation, m.company].filter(Boolean).join(' | ')}</small></span><Pill tone="blue">Member</Pill><span className="p-btn outline sm">View Profile</span></a></li>
                  ))}
                  {show('events') && d.events.map((e) => (
                    <li key={`e${e.id}`}><a href={`#events/${e.slug}`}><span className="p-ico orange"><Icon name="calendar" /></span>
                      <span><b>{e.title}</b><small>Event · {fmt.date(e.event_date)}{e.venue_name ? ` · ${e.venue_name}` : ''}</small></span>
                      <StatusPill status={eventState(e)[0]}>{eventState(e)[1]}</StatusPill><span className="p-btn outline sm">View Event</span></a></li>
                  ))}
                  {show('announcements') && d.announcements.map((a) => (
                    <li key={a.key}><a href={`#${a.link}`}><span className="p-ico purple"><Icon name="megaphone" /></span>
                      <span><b>{a.title}</b><small>{a.text}</small></span><Pill tone="purple">Announcement</Pill><span className="p-btn outline sm">Read More</span></a></li>
                  ))}
                  {show('stories') && d.stories.map((s) => (
                    <li key={`s${s.id}`}><a href={`#stories/${s.slug}`}><span className="p-ico green"><Icon name="trophy" /></span>
                      <span><b>{s.title}</b><small>{s.summary}</small></span><Pill tone="green">Success Story</Pill><span className="p-btn outline sm">Read Story</span></a></li>
                  ))}
                </ul>
              </Card>
            </>
          );
        }}
      </Load>
    </>
  );
}

function AdvancedSearch({ query }) {
  const { meta } = usePortal();
  const [q, setQ] = useState(query.get('q') || '');
  const [cat, setCat] = useState(query.get('in') || 'members');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams({ q: q.trim() || ' ', in: cat });
    if (industry && cat === 'members') p.set('industry', industry);
    if (location && cat === 'members') p.set('location', location);
    window.location.hash = `search?${p}`;
  };
  return (
    <>
      <Head title="Advanced Search & Filters" crumbs={[['Search'], ['Advanced Filters']]} back="dashboard" />
      <form className="p-card p-form" onSubmit={submit}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="sliders" /></span><div><h2>Refine Your Search</h2>
          <p className="p-crumbs-text">Find the right members, events, announcements or success stories in HEH.</p></div></div>
        <Field label="Search Keyword" full><input className="p-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter name, company, event or keyword" /></Field>
        <h3 className="p-sec">Search Category</h3>
        <div className="p-seg wide">{S_TABS.slice(1).map(([k, l, i]) => <button key={k} type="button" className={cat === k ? 'on' : ''} onClick={() => setCat(k)}><Icon name={i} /> {l}</button>)}</div>
        {cat === 'members' && (
          <div className="p-form-grid">
            <Field label="Industry"><Select all="All Industries" options={meta.industries} value={industry} onChange={setIndustry} /></Field>
            <Field label="Location"><input className="p-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="All Locations" /></Field>
          </div>
        )}
        <div className="p-form-acts">
          <button type="button" className="p-btn outline" onClick={() => { setQ(''); setIndustry(''); setLocation(''); }}>Clear Filters</button>
          <button type="submit" className="p-btn">Apply Filters <Icon name="arrow-right" /></button>
        </div>
      </form>
    </>
  );
}

// ---------- Settings ----------

const SET_TABS = [['', 'Notifications', 'bell'], ['privacy', 'Privacy', 'shield'], ['password', 'Password', 'lock']];

function Settings({ section }) {
  const state = useData('/settings');
  const tab = SET_TABS.some(([k]) => k === section) ? section || '' : '';
  const { logout } = usePortal();
  return (
    <>
      <Head title="Settings" sub="Manage your notifications, privacy and sign-in" back="dashboard">
        <button type="button" className="p-btn outline" onClick={logout}><Icon name="logout" /> Sign Out</button>
      </Head>
      <Tabs items={SET_TABS} value={tab} base="settings" />
      <Load state={state}>
        {(s) => (
          <>
            {tab === '' && <PrefsForm s={s} back="settings" embedded />}
            {tab === 'privacy' && (
              <Card title="Privacy" icon="shield">
                <KV rows={[['Member Directory', s.privacy.show_in_directory ? 'Visible to HEH members' : 'Hidden'],
                  ['Email', { members: 'All HEH members', connections: 'My connections only', private: 'Private' }[s.privacy.email_visibility]],
                  ['Mobile', { members: 'All HEH members', connections: 'My connections only', private: 'Private' }[s.privacy.mobile_visibility]],
                  ['Connection Requests', s.privacy.allow_requests ? 'Allowed' : 'Not accepting']]} />
                <a className="p-btn" href="#profile/privacy">Manage Privacy <Icon name="arrow-right" /></a>
              </Card>
            )}
            {tab === 'password' && <PasswordForm s={s} reload={state.reload} />}
          </>
        )}
      </Load>
    </>
  );
}

function PasswordForm({ s, reload }) {
  const { call, toast, refreshMe } = usePortal();
  const [errors, setErrors] = useState({});
  const [busy, run] = useAction();
  const submit = (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body = { current: f.current.value, password: f.password.value, confirm: f.confirm.value };
    run(async () => {
      setErrors({});
      try { await call('/password/change', { method: 'POST', body }); } catch (err) { if (err.errors) setErrors(err.errors); throw err; }
      f.reset();
      toast('Password changed');
      refreshMe();
      reload();
    }).catch(() => {});
  };
  return (
    <form className="p-card p-form narrow" noValidate onSubmit={submit}>
      <div className="p-form-head"><span className="p-ico orange"><Icon name="lock-key" /></span>
        <div><h2>Change Password</h2><p className="p-crumbs-text">{s.temporary_password ? 'You are using a temporary password from HEH. Choose your own password.' : `Last sign-in: ${s.last_login_at ? fmt.stamp(s.last_login_at) : '—'}`}</p></div></div>
      <Field label="Current Password *" error={errors.current}><input className="p-input" type="password" name="current" autoComplete="current-password" maxLength={200} /></Field>
      <Field label="New Password *" error={errors.password} hint="At least 8 characters with letters and numbers."><input className="p-input" type="password" name="password" autoComplete="new-password" maxLength={200} /></Field>
      <Field label="Confirm New Password *" error={errors.confirm}><input className="p-input" type="password" name="confirm" autoComplete="new-password" maxLength={200} /></Field>
      <p className="p-muted small"><Icon name="info" /> Changing your password signs you out on other devices.</p>
      <div className="p-form-acts"><button type="submit" className="p-btn" disabled={busy}>{busy ? 'Saving…' : 'Change Password'}</button></div>
    </form>
  );
}

