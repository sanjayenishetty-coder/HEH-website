// My Connections: Overview, My Network, Received Requests, Sent Requests; request details, connection profile,
// management, activity, mutual connections and privacy (designs 4, 6, 16, 17, 26, 27, 28, 36, 38, 41, 46, 59, 61, 63,
// 72, 75, 76, 77, 78, 94).
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { usePortal } from './Portal.jsx';
import { Privacy } from './Profile.jsx';
import {
  Avatar, Card, Chips, Dialog, Empty, Head, KV, Load, Pager, Pill, Select, Stat, StatusPill, Tabs, ViewAll, day, useAction, useData, usePaged,
} from './parts.jsx';

const TABS = [['', 'Overview'], ['network', 'My Network'], ['received', 'Received Requests'], ['sent', 'Sent Requests']];

export default function Connections({ path, query }) {
  const [a, b] = path;
  if (a === 'privacy') return <ConnectionPrivacy />;
  if (a === 'requests' && /^\d+$/.test(b || '')) return <Details id={b} />;
  if (/^\d+$/.test(a || '')) {
    if (b === 'manage') return <Manage id={a} />;
    if (b === 'mutual') return <Mutual id={a} />;
    return <Details id={a} tab={query.get('tab')} />;
  }
  const tab = TABS.some(([k]) => k === a) ? a || '' : '';
  return (
    <>
      <Head title="My Connections" sub="Manage your HEH professional network" back="dashboard">
        <a className="p-btn" href="#directory"><Icon name="user-plus" /> Find Members</a>
      </Head>
      <Tabs items={TABS} value={tab} base="connections" />
      {tab === '' && <Overview />}
      {tab === 'network' && <Network query={query} />}
      {tab === 'received' && <Requests dir="received" />}
      {tab === 'sent' && <Requests dir="sent" />}
    </>
  );
}

function Overview() {
  const state = useData('/connections');
  return (
    <Load state={state}>
      {(d) => (
        <>
          <div className="p-stats four">
            <Stat icon="users" tone="orange" label="My Connections" value={d.counts.connections} href="#connections/network" />
            <Stat icon="user-plus" tone="blue" label="Received Requests" value={d.counts.received} href="#connections/received" />
            <Stat icon="send" tone="purple" label="Sent Requests" value={d.counts.sent} href="#connections/sent" />
            <Stat icon="user-check" tone="green" label="New This Month" value={d.counts.new_month} href="#connections/network?sort=recent" />
          </div>
          <Card title="Recent Connections" bar action={<ViewAll href="#connections/network" />}>
            <ConnTable rows={d.items.slice(0, 5)} compact />
          </Card>
          {d.counts.received > 0 && (
            <div className="p-banner">
              <Icon name="user-plus" />
              <span><b>Pending Connection Requests</b>You have {d.counts.received} request{d.counts.received === 1 ? '' : 's'} awaiting your response.</span>
              <a className="p-btn outline" href="#connections/received">View Requests <Icon name="arrow-right" /></a>
            </div>
          )}
          <div className="p-links-row">
            <a className="p-btn outline" href="#connections/privacy"><Icon name="shield" /> Privacy & Permissions</a>
          </div>
        </>
      )}
    </Load>
  );
}

function ConnTable({ rows, compact = false }) {
  const { rows: page, ...pg } = usePaged(rows, 10);
  if (!rows.length) return <Empty icon="users" title="No connections yet">Find members in the Member Directory and send a connection request.</Empty>;
  return (
    <>
      <div className="p-table-wrap">
        <table className="p-table">
          <thead><tr><th>Member</th><th>Company</th><th>Industry</th><th>Connected On</th><th>Action</th></tr></thead>
          <tbody>
            {page.map((m) => (
              <tr key={m.id}>
                <td><a className="p-who" href={`#connections/${m.connection.id}`}><Avatar name={m.full_name} photo={m.photo_url} size={34} /><span><b>{m.full_name}</b></span></a></td>
                <td data-label="Company">{m.company || '—'}</td>
                <td data-label="Industry">{m.industry || '—'}</td>
                <td data-label="Connected On">{day(m.since)}</td>
                <td className="p-row-acts">
                  <a className="p-btn outline sm" href={`#connections/${m.connection.id}`}>{compact ? 'View' : <>View Profile <Icon name="external" /></>}</a>
                  {!compact && <a className="p-btn outline sm" href={`#connections/${m.connection.id}/manage`}><Icon name="gear" /> Manage</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && <Pager {...pg} onPage={pg.setPage} total={rows.length} shown={page.length} noun="connections" />}
    </>
  );
}

function Network({ query }) {
  const state = useData('/connections');
  const [q, setQ] = useState(query.get('q') || '');
  const [industry, setIndustry] = useState('');
  const [since, setSince] = useState('');
  const [sort, setSort] = useState(query.get('sort') === 'recent' ? 'recent' : 'name');
  return (
    <Load state={state}>
      {(d) => {
        const industries = [...new Set(d.items.map((m) => m.industry).filter(Boolean))].sort();
        const cutoff = since ? Date.now() - Number(since) * 86400000 : 0;
        const rows = d.items
          .filter((m) => (!q || `${m.full_name} ${m.company}`.toLowerCase().includes(q.toLowerCase()))
            && (!industry || m.industry === industry) && (!cutoff || new Date(m.since).getTime() >= cutoff))
          .sort((x, y) => (sort === 'name' ? x.full_name.localeCompare(y.full_name) : new Date(y.since) - new Date(x.since)));
        const filtered = q || industry || since;
        return (
          <Card title={filtered ? 'Filtered Connections' : 'My Network'} bar
            action={<Pill tone="orange" icon="users">{filtered ? `${rows.length} Result${rows.length === 1 ? '' : 's'}` : `${d.items.length} Connections`}</Pill>}>
            <div className="p-filters">
              <label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by member or company…" aria-label="Search connections" />
                {q && <button type="button" aria-label="Clear" onClick={() => setQ('')}><Icon name="x" /></button>}</label>
              <Select all="All Industries" options={industries} value={industry} onChange={setIndustry} aria-label="Industry" />
              <Select all="All Dates" options={[['30', 'Last 30 Days'], ['90', 'Last 3 Months'], ['365', 'Last Year']]} value={since} onChange={setSince} aria-label="Connected on" />
              <Select options={[['name', 'Name (A–Z)'], ['recent', 'Most Recent']]} value={sort} onChange={setSort} aria-label="Sort by" />
              {filtered && <button type="button" className="p-btn outline sm" onClick={() => { setQ(''); setIndustry(''); setSince(''); }}>Clear Filters</button>}
            </div>
            <ConnTable rows={rows} />
          </Card>
        );
      }}
    </Load>
  );
}

function useAnswer(reload) {
  const { call, toast, openModal, closeModal } = usePortal();
  const [busy, run] = useAction();
  const act = (r, move, done) => run(async () => {
    await call(`/connections/${r.id}/${move}`, { method: 'POST' });
    toast({ accept: 'Connection accepted', decline: 'Request declined', withdraw: 'Request withdrawn', remove: 'Connection removed' }[move]);
    closeModal();
    if (done) done(); else reload();
  }).catch(() => {});
  const COPY = {
    accept: ['user-check', 'green', 'Accept Connection Request?', 'Are you sure you want to connect with this HEH member?',
      'Once accepted, this member will appear in My Network. Shared profile information will follow your privacy settings.', 'Accept Connection', ''],
    decline: ['user-x', 'red', 'Reject Connection Request?', 'Are you sure you want to decline this connection request?',
      'The request will be removed from your pending requests. No connection will be created.', 'Reject Request', 'danger'],
    withdraw: ['alert', 'orange', 'Withdraw Connection Request?', 'Are you sure you want to withdraw the pending connection request sent to this member?',
      'The recipient will no longer see this pending request. You may send a new request later if permitted.', 'Withdraw Request', 'danger'],
    remove: ['user-x', 'red', 'Remove Connection?', 'Are you sure you want to remove this member from your professional network?',
      'This member will be removed from My Network. You can reconnect later by sending a new request, subject to HEH rules.', 'Remove Connection', 'danger'],
  };
  const confirm = (r, move, done) => {
    const [icon, tone, title, text, note, label, cls] = COPY[move];
    openModal(
      <Dialog icon={icon} tone={tone} title={title}
        actions={<><button type="button" className="p-btn outline" onClick={closeModal}>{move === 'withdraw' ? 'Keep Request' : 'Cancel'}</button>
          <button type="button" className={`p-btn ${cls}`} disabled={busy} onClick={() => act(r, move, done)}>{label}</button></>}>
        <p>{text}</p>
        <div className="p-mini-member"><Avatar name={r.member.full_name} photo={r.member.photo_url} size={44} />
          <span><b>{r.member.full_name}</b><small>{[r.member.company, r.member.industry].filter(Boolean).join(' · ')}</small>
            {r.created_at && <small>{move === 'withdraw' ? 'Sent on' : move === 'remove' ? 'Connected since' : 'Requested on'} {day(r.responded_at || r.created_at)}</small>}</span>
          {r.status === 'pending' && <Pill tone="orange">Pending</Pill>}</div>
        <p className="p-note"><Icon name="info" /> {note}</p>
      </Dialog>,
    );
  };
  return { confirm, busy };
}

function Requests({ dir }) {
  const state = useData(`/connections/requests?dir=${dir}`);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const { confirm } = useAnswer(state.reload);
  const sent = dir === 'sent';
  return (
    <Load state={state}>
      {(d) => {
        const pending = d.items.filter((r) => r.status === 'pending').length;
        const rows = d.items.filter((r) => (!status || r.status === status)
          && (!q || `${r.member.full_name} ${r.member.company}`.toLowerCase().includes(q.toLowerCase())));
        return (
          <Card title={sent ? 'Sent Requests' : 'Received Requests'} sub={sent ? 'Track connection invitations you have sent' : 'Review members who want to connect with you'} bar
            action={<Pill tone="orange" icon={sent ? 'send' : 'user-plus'}>{pending} Pending</Pill>}>
            <div className="p-filters">
              <label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search member or company…" aria-label="Search requests" /></label>
              <Select all="All Requests" options={[['pending', 'Pending'], ['accepted', 'Accepted'], ['declined', 'Declined']]} value={status} onChange={setStatus} aria-label="Status" />
            </div>
            {rows.length ? (
              <div className="p-table-wrap">
                <table className="p-table">
                  <thead><tr><th>Member</th><th>Company / Industry</th><th>{sent ? 'Sent On' : 'Requested On'}</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td><a className="p-who" href={`#connections/requests/${r.id}`}><Avatar name={r.member.full_name} photo={r.member.photo_url} size={34} /><span><b>{r.member.full_name}</b><small>{r.purpose}</small></span></a></td>
                        <td data-label="Company">{r.member.company || '—'}<small className="p-muted block">{r.member.industry}</small></td>
                        <td data-label={sent ? 'Sent On' : 'Requested On'}>{day(r.created_at)}</td>
                        <td data-label="Status"><StatusPill status={r.status} /></td>
                        <td className="p-row-acts">
                          {r.status !== 'pending' ? <a className="p-btn outline sm" href={`#connections/requests/${r.id}`}>View</a>
                            : sent ? <button type="button" className="p-btn outline sm" onClick={() => confirm(r, 'withdraw')}>Withdraw</button>
                              : <><button type="button" className="p-btn sm" onClick={() => confirm(r, 'accept')}>Accept</button>
                                <button type="button" className="p-btn outline sm" onClick={() => confirm(r, 'decline')}>Decline</button></>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty icon={sent ? 'send' : 'user-plus'} title={d.items.length ? 'Nothing matches' : 'No requests'}>{sent ? 'Requests you send from the Member Directory appear here.' : 'When members ask to connect with you, their requests appear here.'}</Empty>}
            <p className="p-muted small">Showing {rows.length} of {d.items.length} requests</p>
          </Card>
        );
      }}
    </Load>
  );
}

// Request details (pending / answered) or, for an accepted connection, the connection profile.
function Details({ id, tab }) {
  const state = useData(`/connections/${id}`);
  const { go } = usePortal();
  const { confirm } = useAnswer(state.reload);
  return (
    <Load state={state}>
      {(c) => {
        const m = c.member;
        if (c.status === 'accepted') return <ConnectionProfile c={c} tab={tab} />;
        const sent = c.direction === 'sent';
        const r = { ...c, member: m };
        return (
          <>
            <Head title="Connection Request Details" crumbs={[['My Connections', 'connections'], [sent ? 'Sent Requests' : 'Received Requests', `connections/${sent ? 'sent' : 'received'}`], ['Request Details']]}
              back={`connections/${sent ? 'sent' : 'received'}`} />
            <div className="p-profile-head">
              <Avatar name={m.full_name} photo={m.photo_url} size={72} />
              <div className="who"><small className="p-label">{sent ? 'Request Sent To' : 'Request From'}</small><h2>{m.full_name}</h2>
                <p>{[m.designation, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p><Icon name="pin" /> {m.location}</p>}</div>
              <div className="side"><StatusPill status={c.status}>{c.status === 'pending' ? `${sent ? 'Pending' : 'Pending Request'}` : undefined}</StatusPill><small>HEH Member</small></div>
            </div>
            <div className="p-grid-2">
              <Card title="Request Information" icon="file">
                <KV rows={[['Request Date', day(c.created_at)], ['Networking Purpose', c.purpose], ['Request Type', sent ? 'Outgoing Connection' : 'Incoming Connection'],
                  ['Industry', m.industry], ['Current Status', <StatusPill key="s" status={c.status} />]]} />
              </Card>
              <Card title="Personal Message" icon="chat"><p className="p-quote">{c.message || 'No personal message was added.'}</p></Card>
            </div>
            <Card title="Request Activity" icon="clock"><Timeline items={c.timeline} pending={c.status === 'pending' ? (sent ? 'Awaiting Member Response' : 'Awaiting Your Response') : null} /></Card>
            <div className="p-form-acts">
              <a className="p-btn outline" href={`#directory/${m.slug}`}><Icon name="user" /> View Member Profile</a>
              {c.status === 'pending' && (sent
                ? <button type="button" className="p-btn danger-outline" onClick={() => confirm(r, 'withdraw', () => go('connections/sent'))}><Icon name="x" /> Withdraw Request</button>
                : <><button type="button" className="p-btn outline" onClick={() => confirm(r, 'decline', () => go('connections/received'))}>Decline Request</button>
                  <button type="button" className="p-btn" onClick={() => confirm(r, 'accept', () => go(`connections/${c.id}`))}><Icon name="check" /> Accept Connection</button></>)}
            </div>
          </>
        );
      }}
    </Load>
  );
}

function Timeline({ items, pending }) {
  return (
    <ul className="p-timeline">
      {pending && <li className="wait"><b>{pending}</b><small>The request has not been answered yet.</small></li>}
      {items.map((t) => <li key={t.title + t.at} className="done"><b>{t.title}</b><small>{day(t.at)}{t.text ? ` · ${t.text}` : ''}</small></li>)}
    </ul>
  );
}

const PROFILE_TABS = [['about', 'About'], ['business', 'Business Details'], ['contact', 'Contact Details'], ['activity', 'Connection Activity']];

function ConnectionProfile({ c, tab }) {
  const t = PROFILE_TABS.some(([k]) => k === tab) ? tab : 'about';
  const profile = useData(`/members/${encodeURIComponent(c.member.slug)}`);
  const m = c.member;
  return (
    <>
      <Head title={t === 'activity' ? 'Connection Activity' : 'Connection Profile'} crumbs={[['My Connections', 'connections'], ['My Network', 'connections/network'], [t === 'activity' ? 'Connection Activity' : 'Profile Details']]} back="connections/network" />
      <div className="p-profile-head">
        <Avatar name={m.full_name} photo={m.photo_url} size={72} />
        <div className="who"><h2>{m.full_name}</h2><p>{[m.designation, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p><Icon name="pin" /> {m.location}</p>}</div>
        <div className="side"><StatusPill status="connected" /><a className="p-btn outline sm" href={`#connections/${c.id}/manage`}><Icon name="gear" /> Manage</a></div>
      </div>
      <div className="p-strip">
        <span><Icon name="building" /><small>Company</small><b>{m.company || '—'}</b></span>
        <span><Icon name="tag" /><small>Industry</small><b>{m.industry || '—'}</b></span>
        <span><Icon name="calendar" /><small>Connected Since</small><b>{day(c.responded_at || c.created_at)}</b></span>
      </div>
      <Tabs items={PROFILE_TABS} value={t} onChange={(k) => { window.location.hash = `connections/${c.id}?tab=${k}`; }} />
      <Load state={profile}>
        {(p) => (
          <>
            {t === 'about' && <>
              <Card title="Professional Overview" bar><p className="p-text">{p.bio || 'No introduction yet.'}</p></Card>
              <Card title="Business Interests" bar><Chips items={[...p.interests, ...p.business_interests]} tone="orange" /></Card>
            </>}
            {t === 'business' && <>
              <Card title="Company Details" bar><KV rows={[['Company', p.company], ['Industry', p.industry], ['Business Type', p.business_type], ['Website', p.website]]} /></Card>
              <Card title="About the Business" bar><p className="p-text">{p.company_about || p.products_services || 'Not added yet.'}</p></Card>
              <Card title="Expertise" bar><Chips items={p.expertise} tone="blue" /></Card>
            </>}
            {t === 'contact' && <Card title="Contact Information" bar action={<Pill tone="green" icon="shield-check">Privacy Controlled</Pill>}>
              <KV rows={[['Email', p.contact.email || 'Not shared'], ['Mobile', p.contact.mobile || 'Not shared'], ['Business Email', p.contact.business_email || 'Not shared'], ['Location', p.location]]} />
              <a className="p-link" href={`#directory/${p.slug}/contact`}>Open contact & networking details</a>
            </Card>}
            {t === 'activity' && <Card title="Activity Timeline" sub={`Your connection history with ${m.full_name}`} bar><Timeline items={c.timeline} /></Card>}
          </>
        )}
      </Load>
    </>
  );
}

function Manage({ id }) {
  const state = useData(`/connections/${id}`);
  const { go } = usePortal();
  const { confirm } = useAnswer(state.reload);
  return (
    <Load state={state}>
      {(c) => {
        const m = c.member;
        if (c.status !== 'accepted') return <><Head title="Connection Management" back="connections/network" /><Empty icon="users">This connection is no longer active.</Empty></>;
        const row = (icon, title, text, href, label) => (
          <div className="p-manage-row"><span className="p-ico blue"><Icon name={icon} /></span><span><b>{title}</b><small>{text}</small></span>
            <a className="p-btn outline sm" href={href}>{label} <Icon name="arrow-right" /></a></div>
        );
        return (
          <>
            <Head title="Connection Management" crumbs={[['My Connections', 'connections'], ['My Network', 'connections/network'], ['Manage Connection']]} back="connections/network" />
            <div className="p-profile-head">
              <Avatar name={m.full_name} photo={m.photo_url} size={64} />
              <div className="who"><h2>{m.full_name}</h2><p>{[m.company, m.industry].filter(Boolean).join(' · ')}</p><p><Icon name="calendar" /> Connected since {day(c.responded_at || c.created_at)}</p></div>
              <div className="side"><StatusPill status="connected" /><a className="p-btn outline sm" href={`#directory/${m.slug}`}>View Profile <Icon name="external" /></a></div>
            </div>
            <Card title="Manage Connection" bar>
              {row('user', 'View Member Profile', 'Review professional and business details.', `#connections/${c.id}`, 'View')}
              {row('clock', 'Connection Activity', 'Review your connection history.', `#connections/${c.id}?tab=activity`, 'View')}
              {row('users', 'Mutual Connections', 'Members you are both connected with.', `#connections/${c.id}/mutual`, 'View')}
              {row('shield', 'Privacy & Permissions', 'Manage what your connections can see.', '#connections/privacy', 'Manage')}
            </Card>
            <div className="p-card p-danger-row">
              <span className="p-ico red"><Icon name="user-x" /></span>
              <span><b>Remove Connection</b><small>Removing this connection will end your professional connection with this member. You can send a new connection request later, subject to HEH rules.</small></span>
              <button type="button" className="p-btn danger-outline sm" onClick={() => confirm({ ...c, member: m }, 'remove', () => go('connections/network'))}>Remove Connection</button>
            </div>
          </>
        );
      }}
    </Load>
  );
}

function Mutual({ id }) {
  const state = useData(`/connections/${id}`);
  const [q, setQ] = useState('');
  return (
    <Load state={state}>
      {(c) => <MutualList c={c} q={q} setQ={setQ} />}
    </Load>
  );
}

function MutualList({ c, q, setQ }) {
  const state = useData(`/members/${c.member.id}/mutual`);
  return (
    <>
      <Head title="My Connections" sub="Manage your HEH professional network" back={`connections/${c.id}/manage`} />
      <Tabs items={TABS} value="network" base="connections" />
      <Load state={state}>
        {(d) => {
          const rows = d.items.filter((m) => !q || `${m.full_name} ${m.company}`.toLowerCase().includes(q.toLowerCase()));
          return (
            <Card title="Mutual Connections" sub={`Members connected to both you and ${c.member.full_name}`} bar action={<Pill tone="orange">{d.items.length} Mutual</Pill>}>
              <div className="p-mini-member wide"><Avatar name={c.member.full_name} photo={c.member.photo_url} size={44} /><span><b>{c.member.full_name}</b><small>{[c.member.company, c.member.industry].filter(Boolean).join(' · ')}</small></span>
                <a className="p-btn outline sm" href={`#directory/${c.member.slug}`}>View Profile <Icon name="external" /></a></div>
              <div className="p-filters"><label className="p-search-in"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mutual connections…" aria-label="Search mutual connections" /></label></div>
              {rows.length ? (
                <div className="p-table-wrap"><table className="p-table">
                  <thead><tr><th>Member</th><th>Company</th><th>Industry</th><th>Connection</th><th>Action</th></tr></thead>
                  <tbody>{rows.map((m) => (
                    <tr key={m.id}><td><span className="p-who"><Avatar name={m.full_name} photo={m.photo_url} size={34} /><b>{m.full_name}</b></span></td>
                      <td data-label="Company">{m.company}</td><td data-label="Industry">{m.industry}</td><td><Pill tone="green" icon="users">Mutual</Pill></td>
                      <td className="p-row-acts"><a className="p-btn outline sm" href={`#directory/${m.slug}`}>View Profile <Icon name="external" /></a></td></tr>
                  ))}</tbody>
                </table></div>
              ) : <Empty icon="users">No mutual connections yet.</Empty>}
              <div className="p-form-acts"><a className="p-btn outline" href="#connections/network"><Icon name="arrow-left" /> Back to My Network</a></div>
            </Card>
          );
        }}
      </Load>
    </>
  );
}

function ConnectionPrivacy() {
  const state = useData('/profile');
  return <Load state={state}>{(p) => <Privacy p={p} back="connections" connections />}</Load>;
}

