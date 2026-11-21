// Events: Upcoming, Past, My Registrations, Event Calendar; event details, registration form and confirmation,
// registration details / cancel, attendance details, registration history
// (designs 9, 15, 21, 24, 25, 37, 40, 52, 54, 56, 57, 60, 62, 67, 84, 89, 91, 96).
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';
import {
  Card, DateBox, Dialog, Empty, EventMeta, Field, Head, KV, Load, Pill, Select, Stat, StatusPill, Tabs, day, eventState, useAction, useData,
} from './parts.jsx';
import { Approvals, ApprovalDetails, MySubmissions, SubmissionDetails, SubmitEvent } from './EventSubmit.jsx';

const TABS = [['', 'Upcoming Events'], ['past', 'Past Events'], ['registrations', 'My Registrations'], ['calendar', 'Event Calendar']];
const TYPES = [['spotlight', 'Networking'], ['workshop', 'Workshop']];

// Working Committee members also get "My Event Submissions" (they add events) and Executive Council members
// "Event Approvals" (they approve them before they show on the website): EventSubmit.jsx.
const EXTRA = ['submissions', 'approvals', 'submit'];

export default function Events({ path, query }) {
  const { me } = usePortal();
  const [a, b] = path;
  if (a === 'registrations' && b) return <Registration refId={b} fresh={query.get('new') === '1'} />;
  if (a === 'history') return <History />;
  if (a === 'submit') return <SubmitEvent id={b} />;
  if (a === 'submissions' && b) return <SubmissionDetails id={b} />;
  if (a === 'approvals' && b) return <ApprovalDetails id={b} />;
  if (a && !TABS.some(([k]) => k === a) && !EXTRA.includes(a)) return b === 'register' ? <Register slug={a} /> : <EventDetails slug={a} />;
  const tab = a || '';
  const tabs = [...TABS,
    ...(me.can_submit_events ? [['submissions', 'My Event Submissions']] : []),
    ...(me.can_approve_events ? [['approvals', 'Event Approvals', null, me.events_awaiting_approval || null]] : [])];
  const titles = {
    calendar: ['Event Calendar', 'Explore upcoming events and manage your participation'],
    past: ['Past Events', 'Explore previous HEH events and your participation'],
    registrations: ['My Registrations', 'Manage your HEH event registrations and participation'],
    submissions: ['My Event Submissions', 'Events you added and their approval by the Executive Council'],
    approvals: ['Event Approvals', 'Approve events added by the Working Committee before they appear on the website'],
  };
  const [title, sub] = titles[tab] || ['Events Overview', 'Discover, register and participate in HEH events'];
  return (
    <>
      <Head title={title} sub={sub} back="dashboard">
        {me.can_submit_events && tab !== 'submissions' && <a className="p-btn" href="#events/submit"><Icon name="plus" /> Add Event</a>}
      </Head>
      <Tabs items={tabs} value={tab} base="events" />
      {(tab === '' || tab === 'past') && <EventList when={tab === 'past' ? 'past' : 'upcoming'} query={query} />}
      {tab === 'registrations' && <MyRegistrations />}
      {tab === 'calendar' && <Calendar query={query} />}
      {tab === 'submissions' && <MySubmissions />}
      {tab === 'approvals' && <Approvals query={query} />}
    </>
  );
}

function EventList({ when, query }) {
  const { go } = usePortal();
  const [q, setQ] = useState(query.get('q') || '');
  const [type, setType] = useState(query.get('category') || '');
  const [month, setMonth] = useState(query.get('month') || '');
  const params = new URLSearchParams({ when, ...(query.get('q') ? { q: query.get('q') } : {}), ...(type ? { category: type } : {}), ...(month ? { month } : {}) });
  const state = useData(`/events?${params}`);
  const [preview, setPreview] = useState(null);
  const search = (e) => { e.preventDefault(); go(`events${when === 'past' ? '/past' : ''}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); };
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + (when === 'past' ? -i : i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return [key, d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })];
  });
  return (
    <Load state={state}>
      {(d) => (
        <>
          <form className="p-searchbar" onSubmit={search}>
            <label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${when} events by name, venue or keyword…`} aria-label="Search events" />
              {q && <button type="button" aria-label="Clear" onClick={() => { setQ(''); go(`events${when === 'past' ? '/past' : ''}`); }}><Icon name="x" /></button>}</label>
            <Select all="All Event Types" options={TYPES} value={type} onChange={setType} aria-label="Event type" />
            <Select all="All Months" options={months} value={month} onChange={setMonth} aria-label="Month" />
            <button className="p-btn" type="submit"><Icon name="search" /> Search</button>
          </form>
          {when === 'upcoming' && !query.get('q') && (
            <div className="p-stats">
              <Stat icon="calendar" tone="orange" label="Upcoming Events" value={d.counts.upcoming} />
              <Stat icon="ticket" tone="blue" label="My Registrations" value={d.counts.registrations} href="#events/registrations" />
              <Stat icon="check-circle" tone="green" label="Events Attended" value={d.counts.attended} href="#events/history" />
            </div>
          )}
          <div className={preview ? 'p-grid-2 wide-left' : ''}>
            <Card title={query.get('q') ? `${d.items.length} Event${d.items.length === 1 ? '' : 's'} Found` : `${when === 'past' ? 'Past' : 'Upcoming'} Events (${d.items.length})`}
              sub={query.get('q') ? `Results for “${query.get('q')}”` : null} bar
              action={(type || month) && <button type="button" className="p-btn outline sm" onClick={() => { setType(''); setMonth(''); }}><Icon name="refresh" /> Clear Filters</button>}>
              {d.items.length ? d.items.map((e) => <EventRow key={e.id} e={e} onPreview={when === 'upcoming' ? () => setPreview(e) : null} />)
                : <Empty icon="calendar" title="No events found">{when === 'past' ? 'Past HEH events will appear here.' : 'New events are announced regularly. Please check back soon.'}</Empty>}
            </Card>
            {preview && <QuickPreview e={preview} onClose={() => setPreview(null)} />}
          </div>
        </>
      )}
    </Load>
  );
}

function EventRow({ e, onPreview }) {
  const [st, label] = eventState(e);
  const attended = e.my_status === 'attended';
  return (
    <div className="p-event-row">
      <DateBox date={e.event_date} small />
      <a className="body" href={`#events/${e.slug}`}><b>{e.title}</b><EventMeta e={e} /></a>
      {attended ? <StatusPill status="attended" /> : <StatusPill status={st}>{label}</StatusPill>}
      {onPreview && <button type="button" className="p-btn outline sm hide-sm" onClick={onPreview}>Quick View</button>}
      <a className="p-btn outline sm" href={attended ? `#events/registrations/${e.my_ref}` : `#events/${e.slug}`}>View Details</a>
    </div>
  );
}

function QuickPreview({ e, onClose }) {
  return (
    <Card title="Event Quick Preview" action={<button type="button" className="p-x static" aria-label="Close preview" onClick={onClose}><Icon name="x" /></button>}>
      <div className="p-preview-event"><DateBox date={e.event_date} /><b>{e.title}</b></div>
      <KV rows={[['Time', fmt.timeRange(e.start_time, e.end_time)], ['Venue', e.venue_name || e.city], ['Type', e.category === 'workshop' ? 'Workshop' : 'Networking']]} />
      <p>{e.can_register ? <Pill tone="green" icon="check-circle">Registration Open</Pill> : <Pill tone="grey">{e.registration_note || 'Registration closed'}</Pill>}</p>
      <p className="p-text">{e.short_description}</p>
      <a className="p-btn block" href={`#events/${e.slug}`}>View Full Details <Icon name="arrow-right" /></a>
    </Card>
  );
}

function MyRegistrations() {
  const state = useData('/registrations');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [when, setWhen] = useState('');
  return (
    <Load state={state}>
      {(d) => {
        const n = (s) => d.items.filter((r) => r.status === s).length;
        const rows = d.items.filter((r) => (!status || r.status === status) && (!when || (when === 'past' ? r.is_past : !r.is_past))
          && (!q || `${r.title} ${r.ref}`.toLowerCase().includes(q.toLowerCase())));
        return (
          <>
            <div className="p-searchbar">
              <label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my registrations (event name or registration ID)…" aria-label="Search registrations" /></label>
              <Select all="All Statuses" options={[['confirmed', 'Confirmed'], ['pending', 'Pending'], ['attended', 'Attended'], ['cancelled', 'Cancelled'], ['rejected', 'Rejected']]} value={status} onChange={setStatus} aria-label="Status" />
              <Select all="All Events" options={[['upcoming', 'Upcoming'], ['past', 'Past']]} value={when} onChange={setWhen} aria-label="When" />
            </div>
            <div className="p-stats">
              <Stat icon="calendar" tone="green" label="Confirmed" value={n('confirmed')} />
              <Stat icon="clock" tone="orange" label="Pending" value={n('pending')} />
              <Stat icon="x" tone="grey" label="Cancelled" value={n('cancelled')} />
            </div>
            <Card title={`My Registrations (${rows.length})`} bar action={<a className="p-viewall" href="#events/history">Registration History <Icon name="arrow-right" /></a>}>
              {rows.length ? rows.map((r) => (
                <div key={r.ref} className="p-event-row">
                  <DateBox date={r.event_date} small />
                  <a className="body" href={`#events/registrations/${r.ref}`}><b>{r.title}</b>
                    <span className="p-meta"><span><Icon name="clock" /> {fmt.timeRange(r.start_time, r.end_time)}</span>{r.venue_name && <span><Icon name="pin" /> {r.venue_name}</span>}<span><Icon name="ticket" /> Registration ID: {r.ref}</span></span></a>
                  <StatusPill status={r.status} />
                  <a className="p-btn outline sm" href={`#events/registrations/${r.ref}`}>View Registration</a>
                </div>
              )) : <Empty icon="ticket" title="No registrations">Register for an upcoming event and it will appear here.</Empty>}
            </Card>
          </>
        );
      }}
    </Load>
  );
}

function History() {
  const state = useData('/registrations');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  return (
    <>
      <Head title="Registration History" sub="View your previous event registrations and participation" back="events/registrations" />
      <Load state={state}>
        {(d) => {
          const years = [...new Set(d.items.map((r) => String(r.event_date || '').slice(0, 4)).filter(Boolean))];
          const rows = d.items.filter((r) => (!status || r.status === status) && (!year || String(r.event_date).startsWith(year))
            && (!q || `${r.title} ${r.ref}`.toLowerCase().includes(q.toLowerCase())));
          return (
            <Card title="Registration Records" bar action={<Pill tone="orange">{rows.length} Records</Pill>}>
              <div className="p-filters">
                <label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event or registration ID…" aria-label="Search history" /></label>
                <Select all="All Statuses" options={[['confirmed', 'Confirmed'], ['attended', 'Attended'], ['cancelled', 'Cancelled'], ['pending', 'Pending'], ['rejected', 'Rejected']]} value={status} onChange={setStatus} aria-label="Status" />
                <Select all="All Years" options={years} value={year} onChange={setYear} aria-label="Year" />
              </div>
              {rows.length ? (
                <div className="p-table-wrap"><table className="p-table">
                  <thead><tr><th>Registration ID</th><th>Event Name</th><th>Event Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{rows.map((r) => (
                    <tr key={r.ref}><td>{r.ref}</td><td data-label="Event"><b>{r.title}</b></td><td data-label="Date">{fmt.date(r.event_date)}</td>
                      <td data-label="Status"><StatusPill status={r.status} /></td>
                      <td className="p-row-acts"><a className="p-btn outline sm" href={`#events/registrations/${r.ref}`}>View</a></td></tr>
                  ))}</tbody>
                </table></div>
              ) : <Empty icon="ticket">No registration records.</Empty>}
            </Card>
          );
        }}
      </Load>
    </>
  );
}

// ---------- Calendar ----------

function Calendar({ query }) {
  const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  const month = /^\d{4}-\d{2}$/.test(query.get('month') || '') ? query.get('month') : today.slice(0, 7);
  const [type, setType] = useState('');
  const [view, setView] = useState('month');
  const state = useData(`/events?when=all&month=${month}${type ? `&category=${type}` : ''}`);
  const [sel, setSel] = useState(null);
  const [y, m] = month.split('-').map(Number);
  const shift = (n) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    window.location.hash = `events/calendar?month=${d.toISOString().slice(0, 7)}`;
  };
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  while (cells.length % 7) cells.push(null);
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <Load state={state}>
      {(d) => {
        const byDay = (dd) => d.items.filter((e) => e.event_date === dd);
        const e = sel ? d.items.find((x) => x.id === sel) : d.items.find((x) => x.event_date >= today) || d.items[0];
        return (
          <div className="p-grid-2 wide-left">
            <Card>
              <div className="p-cal-bar">
                <button type="button" className="p-btn outline sm" aria-label="Previous month" onClick={() => shift(-1)}><Icon name="arrow-left" /></button>
                <b>{label}</b>
                <button type="button" className="p-btn outline sm" aria-label="Next month" onClick={() => shift(1)}><Icon name="arrow-right" /></button>
                <Select all="All Event Types" options={TYPES} value={type} onChange={setType} aria-label="Event type" />
                <div className="p-seg"><button type="button" className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}><Icon name="calendar" /> Month</button>
                  <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><Icon name="list" /> List</button></div>
              </div>
              {view === 'month' ? (
                <div className="p-cal">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => <b key={w}>{w}</b>)}
                  {cells.map((c, i) => {
                    const evs = c ? byDay(c) : [];
                    return (
                      <div key={c || `x${i}`} className={`${c ? '' : 'out'}${c === today ? ' today' : ''}${evs.some((x) => x.id === e?.id) ? ' sel' : ''}`}>
                        {c && <span>{Number(c.slice(8))}</span>}
                        {evs.map((x) => <button key={x.id} type="button" className={`p-cal-ev ${x.category}`} onClick={() => setSel(x.id)}>{x.title}</button>)}
                      </div>
                    );
                  })}
                </div>
              ) : (d.items.length ? d.items.map((x) => <EventRow key={x.id} e={x} />) : <Empty icon="calendar">No events this month.</Empty>)}
              <div className="p-legend"><span className="sel">Selected Date</span><span className="spotlight">Networking</span><span className="workshop">Workshop</span></div>
            </Card>
            <div className="p-stack">
              <Card title="Event Preview" icon="calendar">
                {e ? (
                  <>
                    <div className="p-preview-event"><DateBox date={e.event_date} /><b>{e.title}</b></div>
                    <KV rows={[['Time', fmt.timeRange(e.start_time, e.end_time)], ['Venue', e.venue_name || e.city], ['Type', e.category === 'workshop' ? 'Workshop' : 'Networking']]} />
                    <p>{e.is_past ? <Pill>Completed</Pill> : e.can_register ? <Pill tone="green" icon="check-circle">Registration Open</Pill> : <StatusPill status={eventState(e)[0]}>{eventState(e)[1]}</StatusPill>}</p>
                    <a className="p-btn block" href={`#events/${e.slug}`}>View Event Details <Icon name="arrow-right" /></a>
                  </>
                ) : <Empty icon="calendar">No events in {label}.</Empty>}
              </Card>
              <Card title="This Month at a Glance">
                <div className="p-glance">
                  <span><b>{d.items.length}</b>Total Events</span>
                  <span><b>{d.items.filter((x) => x.can_register).length}</b>Open for Registration</span>
                  <span><b>{d.items.filter((x) => x.my_status && x.my_status !== 'cancelled').length}</b>Registered</span>
                </div>
              </Card>
            </div>
          </div>
        );
      }}
    </Load>
  );
}

// ---------- Event details & registration ----------

function EventDetails({ slug }) {
  const state = useData(`/events/${encodeURIComponent(slug)}`);
  const { openModal, closeModal, go } = usePortal();
  const full = (e) => openModal(
    <Dialog icon="calendar" tone="red" title="Event Registration Full"
      actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Close</button>
        <button type="button" className="p-btn" onClick={() => { closeModal(); go('events'); }}>Explore Events <Icon name="arrow-right" /></button></>}>
      <p>All available seats for this event have been filled. Registration is currently unavailable.</p>
      <KV rows={[['Event', e.title], ['Event Date', fmt.date(e.event_date)], ['Registration', <Pill key="f" tone="red">Event Full</Pill>]]} />
    </Dialog>,
  );
  return (
    <Load state={state}>
      {(e) => {
        const reg = e.registration && !['cancelled', 'rejected'].includes(e.registration.status) ? e.registration : null;
        const isFull = /full/i.test(e.registration_note);
        const highlights = (e.takeaways || []).map((t) => t.title).filter(Boolean);
        return (
          <>
            <Head title="Event Details" crumbs={[['Events', 'events'], [e.is_past ? 'Past Events' : 'Upcoming Events', e.is_past ? 'events/past' : 'events'], ['Event Details']]} back={e.is_past ? 'events/past' : 'events'} />
            <section className="p-card p-event-head">
              <DateBox date={e.event_date} />
              <div><h2>{e.title}</h2>{e.short_description && <p className="p-muted">{e.short_description}</p>}
                <p className="p-chips"><Pill tone="blue" icon="tag">{e.category === 'workshop' ? 'Workshop' : 'Networking'}</Pill>
                  {e.can_register && <Pill tone="green" icon="check-circle">Registration Open</Pill>}</p></div>
              <div className="side">{reg ? <StatusPill status={reg.status}>{reg.status === 'confirmed' ? 'Registered' : undefined}</StatusPill>
                : e.is_past ? <Pill>Completed</Pill> : e.can_register ? <Pill tone="green" icon="check-circle">Open for Registration</Pill>
                  : <Pill tone={isFull ? 'red' : 'grey'}>{isFull ? 'Registration Full' : 'Registration Closed'}</Pill>}</div>
            </section>
            <div className="p-strip">
              <span><Icon name="calendar" /><small>Date</small><b>{fmt.weekday(e.event_date)}, {fmt.date(e.event_date)}</b></span>
              <span><Icon name="clock" /><small>Time</small><b>{fmt.timeRange(e.start_time, e.end_time)}</b></span>
              <span><Icon name="pin" /><small>Location</small><b>{e.venue_name || e.city || 'To be announced'}</b></span>
              <span><Icon name="users" /><small>Organized By</small><b>Hyderabad EntrepreneurHub</b></span>
            </div>
            <div className="p-grid-2 wide-left">
              <div className="p-stack">
                <Card title="About This Event" bar>
                  <p className="p-text">{e.is_past && e.summary ? e.summary : e.description || e.short_description || 'Details will be shared soon.'}</p>
                  {highlights.length > 0 && <><h3 className="p-sec">Event Highlights</h3><ul className="p-ticks">{highlights.map((h) => <li key={h}><Icon name="check-circle" /> {h}</li>)}</ul></>}
                  {(e.agenda || []).length > 0 && <><h3 className="p-sec">Agenda</h3><KV rows={e.agenda.map((a) => [a.time, a.title])} /></>}
                </Card>
                {e.venue_address && <Card title="Venue" bar><p className="p-text">{e.venue_name}<br />{e.venue_address}</p>
                  {e.map_url && <a className="p-link" href={e.map_url} target="_blank" rel="noopener">Get Directions <Icon name="external" /></a>}</Card>}
              </div>
              <Card title="Registration" bar>
                <KV rows={[['Eligibility', e.members_only ? 'HEH Members' : 'Open to all'], ['Availability', e.is_past ? 'Event completed'
                  : e.can_register ? (e.seats_left != null ? `${e.seats_left} seats left` : 'Open') : e.registration_note],
                ['Approval', e.approval_mode === 'manual' ? 'Reviewed by HEH' : 'Instant confirmation']]} />
                {reg ? <a className="p-btn block" href={`#events/registrations/${reg.ref}`}>View My Registration <Icon name="arrow-right" /></a>
                  : e.can_register ? <a className="p-btn block" href={`#events/${e.slug}/register`}>Register Now <Icon name="arrow-right" /></a>
                    : !e.is_past && <button type="button" className="p-btn block" disabled={!isFull} onClick={() => full(e)}>{isFull ? 'Registration Full' : 'Registration Closed'}</button>}
                {e.registration?.status === 'cancelled' && <p className="p-muted small">You cancelled an earlier registration for this event.</p>}
                <p className="p-muted small center"><Icon name="info" /> Registration subject to availability</p>
              </Card>
            </div>
          </>
        );
      }}
    </Load>
  );
}

function Register({ slug }) {
  const { call, openModal, closeModal, go } = usePortal();
  const event = useData(`/events/${encodeURIComponent(slug)}`);
  const profile = useData('/profile');
  const [errors, setErrors] = useState({});
  const [busy, run] = useAction();
  const submit = (e, ev) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body = { company: f.company.value, mobile: f.mobile.value, email: f.email.value, notes: f.notes.value, consent: f.consent.checked };
    run(async () => {
      setErrors({});
      let res;
      try {
        res = await call(`/events/${encodeURIComponent(slug)}/register`, { method: 'POST', body });
      } catch (err) {
        if (err.errors) setErrors(err.errors);
        throw err;
      }
      const pending = res.status === 'pending';
      openModal(
        <Dialog icon={pending ? 'clock' : 'check-circle'} tone={pending ? 'orange' : 'green'} title={pending ? 'Registration Received!' : 'Registration Successful!'}
          actions={<><button type="button" className="p-btn outline" onClick={() => { closeModal(); go('events/registrations'); }}>My Registrations</button>
            <button type="button" className="p-btn" onClick={() => { closeModal(); go(`events/registrations/${res.ref}?new=1`); }}>View Details <Icon name="arrow-right" /></button></>}>
          <p>{pending ? `Your registration for ${ev.title} is waiting for approval by HEH. You will be notified once it is confirmed.`
            : `You have successfully registered for the ${ev.title}.`}</p>
          <p className="center"><StatusPill status={res.status} /></p>
          <KV rows={[['Event', ev.title], ['Date', fmt.date(ev.event_date)], ['Registration ID', res.ref]]} />
        </Dialog>,
      );
    }).catch(() => {});
  };
  return (
    <Load state={event}>
      {(ev) => (
        <Load state={profile}>
          {(p) => (
            <>
              <Head title="Event Registration" crumbs={[['Events', 'events'], ['Event Details', `events/${ev.slug}`], ['Registration']]} back={`events/${ev.slug}`} />
              <p className="p-muted">Complete your registration for the upcoming HEH event</p>
              <section className="p-card p-event-head">
                <DateBox date={ev.event_date} />
                <div><h2>{ev.title}</h2><EventMeta e={ev} /></div>
                <div className="side">{ev.can_register ? <Pill tone="green" icon="check-circle">Registration Open</Pill> : <Pill>{ev.registration_note}</Pill>}</div>
              </section>
              {!ev.can_register ? <Empty icon="calendar" title="Registration unavailable">{ev.registration_note}</Empty> : (
                <div className="p-grid-2 wide-left">
                  <form className="p-card p-form" noValidate onSubmit={(e) => submit(e, ev)}>
                    <h3 className="p-sec">Member Information <Pill tone="blue">Auto-filled from your profile</Pill></h3>
                    <div className="p-form-grid">
                      <Field label="Member Name *"><input className="p-input" value={p.full_name} readOnly /></Field>
                      <Field label="Company / Organization *" error={errors.company}><input className="p-input" name="company" defaultValue={p.company} maxLength={160} /></Field>
                      <Field label="Contact Number *" error={errors.mobile}><input className="p-input" name="mobile" defaultValue={p.phone} maxLength={20} /></Field>
                      <Field label="Email Address *" error={errors.email}><input className="p-input" type="email" name="email" defaultValue={p.email} maxLength={160} /></Field>
                      <Field label="Additional Notes (Optional)" error={errors.notes} full><textarea className="p-input" name="notes" rows={3} maxLength={500} placeholder="Any information for the event organiser…" /></Field>
                    </div>
                    <label className="p-check"><input type="checkbox" name="consent" /> I agree to the event registration terms and participation guidelines.</label>
                    {errors.consent && <small className="p-err">{errors.consent}</small>}
                    <div className="p-form-acts">
                      <a className="p-btn outline" href={`#events/${ev.slug}`}>Cancel</a>
                      <button type="submit" className="p-btn" disabled={busy}>{busy ? 'Submitting…' : <>Confirm Registration <Icon name="arrow-right" /></>}</button>
                    </div>
                  </form>
                  <Card title="Registration Summary" bar>
                    <KV rows={[['Event', ev.title], ['Date', `${fmt.date(ev.event_date)} (${fmt.weekday(ev.event_date)})`], ['Time', fmt.timeRange(ev.start_time, ev.end_time)],
                      ['Location', ev.venue_name || ev.city], ['Attendees', '1 Member'], ['Status', <Pill key="a" tone="green">Available</Pill>]]} />
                    <p className="p-muted small"><Icon name="info" /> Subject to event capacity and registration approval rules.</p>
                  </Card>
                </div>
              )}
            </>
          )}
        </Load>
      )}
    </Load>
  );
}

// Printable confirmation in a new window.
function printConfirmation(r, name) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const rows = [['Registration ID', r.ref], ['Member', name], ['Company', r.company], ['Event', r.title], ['Date', `${fmt.date(r.event_date)} (${fmt.weekday(r.event_date)})`],
    ['Time', fmt.timeRange(r.start_time, r.end_time)], ['Venue', [r.venue_name, r.venue_address].filter(Boolean).join(', ')], ['Status', r.status[0].toUpperCase() + r.status.slice(1)]];
  w.document.write(`<!doctype html><title>${esc(r.ref)} – HEH Registration</title><style>body{font:15px/1.5 Arial,sans-serif;color:#1d2f4a;margin:40px}
h1{font:bold 24px Georgia,serif;color:#0d2a4f;margin:18px 0 6px}table{border-collapse:collapse;width:100%;margin-top:18px}td{border-bottom:1px solid #e3e8ef;padding:10px 6px}
td:first-child{color:#55657c;width:38%}img{height:52px}p{color:#55657c}</style><img src="/assets/brand/logo.png" alt="Hyderabad Entrepreneurs Hub">
<h1>Event Registration Confirmation</h1><p>Please show this confirmation at the event check-in desk.</p><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>
<script>window.onload=()=>window.print()</script>`);
  w.document.close();
}

function Registration({ refId, fresh }) {
  const state = useData(`/registrations/${encodeURIComponent(refId)}`);
  const { call, openModal, closeModal, toast, meta, me } = usePortal();
  const cancel = (r) => openModal(<CancelDialog r={r} reasons={meta.cancelReasons} onDone={() => { closeModal(); toast('Registration cancelled'); state.reload(); }} call={call} />);
  return (
    <Load state={state}>
      {(r) => {
        if (r.status === 'attended') return <Attendance r={r} />;
        if (fresh && ['confirmed', 'pending'].includes(r.status)) {
          return (
            <>
              <Head title="Registration Confirmation" crumbs={[['Events', 'events'], ['Event Registration', `events/${r.slug}`], ['Confirmation']]} back="events/registrations" />
              <section className="p-card p-confirm">
                <span className={`p-dialog-ico ${r.status === 'pending' ? 'orange' : 'green'}`}><Icon name={r.status === 'pending' ? 'clock' : 'check-circle'} /></span>
                <h2>{r.status === 'pending' ? 'Registration Received' : 'Registration Confirmed'}</h2>
                <p>Your registration for the {r.title} {r.status === 'pending' ? 'is waiting for approval.' : 'has been confirmed.'}</p>
                <StatusPill status={r.status} />
                <KV rows={[['Registration ID', r.ref], ['Event', r.title], ['Date & Time', `${fmt.date(r.event_date)} · ${fmt.timeRange(r.start_time, r.end_time)}`],
                  ['Venue', r.venue_name || r.city], ['Registered Member', r.full_name]]} />
                <div className="p-form-acts center">
                  <a className="p-btn outline" href="#events/registrations">My Registrations</a>
                  <a className="p-btn" href={`#events/registrations/${r.ref}`}>View Registration <Icon name="arrow-right" /></a>
                </div>
              </section>
            </>
          );
        }
        const active = ['confirmed', 'pending'].includes(r.status) && !r.is_past;
        return (
          <>
            <Head title="Registration Details" crumbs={[['Events', 'events'], ['My Registrations', 'events/registrations'], ['Registration Details']]} back="events/registrations" />
            <section className="p-card p-event-head">
              <DateBox date={r.event_date} />
              <div><h2>{r.title}</h2><EventMeta e={r} /></div>
              <div className="side"><StatusPill status={r.status} /></div>
            </section>
            <div className="p-grid-2 wide-left">
              <Card title="Registration Information" bar action={<Pill tone={active ? 'green' : 'grey'}>{active ? 'Active' : r.is_past ? 'Past Event' : 'Inactive'}</Pill>}>
                <KV rows={[['Registration ID', r.ref], ['Registered Member', r.full_name], ['Company', r.company], ['Registration Date', day(r.created_at)],
                  ['Contact Number', r.mobile], ['Email', r.email], ['Attendees', '1 Member'], ['Registration Status', <StatusPill key="s" status={r.status} />],
                  r.status_reason && ['Note', r.status_reason], r.notes && ['Your Notes', r.notes]]} />
              </Card>
              <Card title="Registration Status" bar>
                <div className={`p-status-box ${r.status}`}>
                  <Icon name={r.status === 'confirmed' ? 'check-circle' : r.status === 'pending' ? 'clock' : 'x'} />
                  <b>{{ confirmed: 'Registration Confirmed', pending: 'Awaiting Approval', cancelled: 'Registration Cancelled', rejected: 'Registration Not Approved' }[r.status]}</b>
                  <small>{{ confirmed: 'Your registration is active.', pending: 'HEH will review your registration shortly.', cancelled: 'This registration was cancelled.', rejected: 'This registration could not be confirmed.' }[r.status]}</small>
                </div>
                {['confirmed', 'pending'].includes(r.status) && <button type="button" className="p-btn outline block" onClick={() => printConfirmation(r, me.full_name)}><Icon name="download" /> Download Confirmation</button>}
                {active && <button type="button" className="p-btn danger-outline block" onClick={() => cancel(r)}><Icon name="x" /> Cancel Registration</button>}
                {['cancelled', 'rejected'].includes(r.status) && !r.is_past && <a className="p-btn block" href={`#events/${r.slug}`}>View Event</a>}
                {active && <p className="p-muted small center"><Icon name="info" /> Cancellation subject to event policy.</p>}
              </Card>
            </div>
            <Card title="Event Information" bar>
              <div className="p-strip flat">
                <span><Icon name="pin" /><small>Venue</small><b>{[r.venue_name, r.venue_address].filter(Boolean).join(', ') || r.city || '—'}</b></span>
                <span><Icon name="clock" /><small>Time</small><b>{fmt.timeRange(r.start_time, r.end_time)}</b></span>
                <span><Icon name="users" /><small>Organized By</small><b>Hyderabad EntrepreneurHub</b></span>
              </div>
            </Card>
          </>
        );
      }}
    </Load>
  );
}

function CancelDialog({ r, reasons, onDone, call }) {
  const { closeModal } = usePortal();
  const [reason, setReason] = useState(reasons[0]);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const [busy, run] = useAction();
  const go = () => run(async () => {
    setError('');
    try {
      await call(`/registrations/${encodeURIComponent(r.ref)}/cancel`, { method: 'POST', body: { reason, confirm: ok } });
    } catch (err) { setError(err.errors ? Object.values(err.errors)[0] : err.message); throw err; }
    onDone();
  }).catch(() => {});
  return (
    <Dialog icon="alert" tone="orange" title="Cancel Registration?"
      actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Keep Registration</button>
        <button type="button" className="p-btn danger" disabled={busy || !ok} onClick={go}>Confirm Cancellation</button></>}>
      <p>Please review before proceeding.</p>
      <KV rows={[['Event', r.title], ['Date', `${fmt.date(r.event_date)} · ${fmt.timeRange(r.start_time, r.end_time)}`], ['Registration ID', r.ref]]} />
      <p className="p-muted small">Cancelling will release your registration. Re-registration will depend on event availability.</p>
      <Field label="Reason for Cancellation *"><Select options={reasons} value={reason} onChange={setReason} /></Field>
      <label className="p-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I understand that my registration will be cancelled.</label>
      {error && <small className="p-err">{error}</small>}
    </Dialog>
  );
}

function Attendance({ r }) {
  const time = (ts) => (ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—');
  return (
    <>
      <Head title="Event Attendance Details" crumbs={[['Events', 'events'], ['Past Events', 'events/past'], ['Attendance Details']]} back="events/past" />
      <section className="p-card p-event-head">
        <DateBox date={r.event_date} />
        <div><h2>{r.title}</h2><EventMeta e={r} /></div>
        <div className="side"><StatusPill status="attended" /><small>Completed Event</small></div>
      </section>
      <div className="p-grid-2 wide-left">
        <Card title="Attendance Information" bar action={<StatusPill status="verified" />}>
          <KV rows={[['Member Name', r.full_name], ['Company', r.company], ['Registration ID', r.ref], ['Attendance Status', <Pill key="p" tone="green">Present</Pill>],
            ['Check-in Time', time(r.checked_in_at)], ['Attendance Date', fmt.date(r.event_date)], ['Verification', 'Event Check-in']]} />
        </Card>
        <Card title="Attendance Summary" bar>
          <div className="p-status-box confirmed"><Icon name="check-circle" /><b>Attendance Confirmed</b><small>Your participation is successfully recorded.</small></div>
          <button type="button" className="p-btn outline block" onClick={() => printConfirmation(r, r.full_name)}><Icon name="download" /> Download Record</button>
          <a className="p-btn block" href={`#gallery/album/${r.id}`}>View Event Gallery <Icon name="arrow-right" /></a>
        </Card>
      </div>
      <Card title="Event Participation" bar>
        <p className="p-note"><Icon name="check-circle" /><span><b>Attendance verified by HEH event management.</b> Your participation has been recorded in your member activity history.</span></p>
      </Card>
    </>
  );
}
