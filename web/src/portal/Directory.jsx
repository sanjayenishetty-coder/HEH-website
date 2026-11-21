// Member Directory: All Members (with quick preview), By Industry, By Expertise, By Interest, search results and
// filters, Advanced Filters, member profile, send connection request, contact & networking
// (designs 1, 2, 7, 8, 10, 11, 13, 31, 33, 39, 42, 43, 45, 50, 70, 83, 86, 88, 93).
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { usePortal } from './Portal.jsx';
import {
  Avatar, Card, Chips, Dialog, Empty, Field, Head, KV, Load, Pager, Pill, Select, StatusPill, Stat, Tabs, day, useAction, useData, usePaged,
} from './parts.jsx';

const TABS = [['all', 'All Members'], ['industry', 'By Industry'], ['expertise', 'By Expertise'], ['interest', 'By Interest']];
const FILTERS = ['q', 'industry', 'expertise', 'interest', 'location', 'connection'];
const FACET = {
  industry: { facet: 'industries', label: 'Industries', one: 'Industry', icon: 'building', explore: 'Explore by Industry', pick: 'Select an industry to view members' },
  expertise: { facet: 'expertise', label: 'Expertise Areas', one: 'Expertise', icon: 'star', explore: 'Explore by Expertise', pick: 'Select a specialization to view members' },
  interest: { facet: 'interests', label: 'Interest Categories', one: 'Interest', icon: 'handshake', explore: 'Explore by Business Interest', pick: 'Select a collaboration interest to view members' },
};

export default function Directory({ path, query }) {
  const [slug, sub] = path;
  if (slug === 'filters') return <AdvancedFilters query={query} />;
  if (slug && sub === 'connect') return <SendRequest slug={slug} />;
  if (slug && sub === 'contact') return <Contact slug={slug} />;
  if (slug) return <MemberProfile slug={slug} />;
  return <List query={query} />;
}

const toHash = (params) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  return `directory${p.toString() ? `?${p}` : ''}`;
};

function List({ query }) {
  const { go } = usePortal();
  const tab = TABS.some(([k]) => k === query.get('tab')) ? query.get('tab') : 'all';
  const filters = Object.fromEntries(FILTERS.map((k) => [k, query.get(k) || '']));
  const apiQuery = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const state = useData(`/members${apiQuery ? `?${apiQuery}` : ''}`);
  const [text, setText] = useState(filters.q);
  const set = (changes) => go(toHash({ tab: tab === 'all' ? '' : tab, ...filters, ...changes }));
  const filtered = FILTERS.some((k) => k !== 'q' && filters[k]) && tab === 'all';
  return (
    <>
      <Head title="Member Directory" sub="Discover and connect with HEH entrepreneurs" back="dashboard" />
      <Tabs items={TABS} value={tab} onChange={(t) => go(toHash({ tab: t === 'all' ? '' : t, q: filters.q }))} />
      <form className="p-searchbar" onSubmit={(e) => { e.preventDefault(); set({ q: text.trim() }); }}>
        <label className="p-search-in"><Icon name="search" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search members by name, company, industry or expertise…" aria-label="Search members" />
          {text && <button type="button" aria-label="Clear" onClick={() => { setText(''); set({ q: '' }); }}><Icon name="x" /></button>}
        </label>
        <a className="p-btn outline" href={`#directory/filters?${apiQuery}`}><Icon name="sliders" /> Advanced Filters</a>
        <button className="p-btn" type="submit"><Icon name="search" /> Search</button>
      </form>
      <Load state={state}>
        {(d) => {
          if (tab !== 'all') return <ByFacet kind={tab} d={d} filters={filters} set={set} />;
          if (filtered) return <Filtered d={d} filters={filters} set={set} />;
          if (filters.q) return <Results d={d} q={filters.q} clear={() => { setText(''); set({ q: '' }); }} />;
          return <AllMembers d={d} />;
        }}
      </Load>
    </>
  );
}

// Connect / Connected / Pending / Respond button for a member card or row.
export function ConnectButton({ m, small = true }) {
  const c = m.connection;
  const cls = `p-btn${small ? ' sm' : ''}`;
  if (c?.state === 'connected') return <StatusPill status="connected" />;
  if (c?.state === 'sent') return <a className={`${cls} soft`} href={`#connections/${c.id}`}><Icon name="clock" /> Pending</a>;
  if (c?.state === 'received') return <a className={`${cls} soft blue`} href="#connections/received"><Icon name="user-check" /> Respond</a>;
  if (m.allow_requests === false) return <span className="p-muted small">Not accepting requests</span>;
  return <a className={`${cls} soft`} href={`#directory/${m.slug}/connect`}><Icon name="user-plus" /> Connect</a>;
}

function MemberTable({ rows, cols = ['company', 'industry', 'expertise', 'interests'] }) {
  const { rows: page, ...pg } = usePaged(rows, 10);
  if (!rows.length) return <Empty icon="search" title="No members found">Try a different search or clear the filters.</Empty>;
  return (
    <>
      <div className="p-table-wrap">
        <table className="p-table members">
          <thead><tr><th>Member</th>{cols.includes('company') && <th>Company</th>}{cols.includes('industry') && <th>Industry</th>}
            {cols.includes('expertise') && <th>Expertise</th>}{cols.includes('interests') && <th>Interests</th>}<th>Actions</th></tr></thead>
          <tbody>
            {page.map((m) => (
              <tr key={m.id}>
                <td><a className="p-who" href={`#directory/${m.slug}`}><Avatar name={m.full_name} photo={m.photo_url} size={34} /><span><b>{m.full_name}</b><small>{m.designation}</small></span></a></td>
                {cols.includes('company') && <td data-label="Company">{m.company || '—'}</td>}
                {cols.includes('industry') && <td data-label="Industry">{m.industry || '—'}</td>}
                {cols.includes('expertise') && <td data-label="Expertise">{m.expertise[0] ? <span className="p-chip static blue">{m.expertise[0]}</span> : '—'}</td>}
                {cols.includes('interests') && <td data-label="Interests">{m.interests[0] ? <span className="p-chip static purple">{m.interests[0]}</span> : '—'}</td>}
                <td className="p-row-acts"><a className="p-btn outline sm" href={`#directory/${m.slug}`}>View Profile</a><ConnectButton m={m} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager {...pg} onPage={pg.setPage} total={rows.length} shown={page.length} noun="members" />
    </>
  );
}

function AllMembers({ d }) {
  const [sel, setSel] = useState(d.items[0]?.id);
  const { rows, ...pg } = usePaged(d.items, 8);
  const m = d.items.find((x) => x.id === sel) || rows[0];
  if (!d.items.length) return <Empty icon="users" title="No members yet">Members appear here once they join the portal directory.</Empty>;
  return (
    <div className="p-grid-2 wide-left">
      <Card title="All Members" sub={`${d.total} members`}>
        <div className="p-member-list">
          {rows.map((x) => (
            <button key={x.id} type="button" className={`p-member-item${m?.id === x.id ? ' on' : ''}`} onClick={() => setSel(x.id)}>
              <Avatar name={x.full_name} photo={x.photo_url} size={42} />
              <span><b>{x.full_name}</b><small>{x.company || x.designation}</small></span>
              {x.connection?.state === 'connected' ? <StatusPill status="connected" /> : x.connection?.state === 'sent' ? <Pill tone="orange" icon="clock">Pending</Pill> : <Pill tone="orange" icon="user-plus">Connect</Pill>}
              <Icon name="chevron-right" />
            </button>
          ))}
        </div>
        <Pager {...pg} onPage={pg.setPage} total={d.total} shown={rows.length} noun="members" />
      </Card>
      {m && (
        <Card title="Member Quick Preview" className="p-preview">
          <div className="p-preview-head">
            <Avatar name={m.full_name} photo={m.photo_url} size={64} />
            <div><b>{m.full_name}</b><small>{[m.designation, m.company].filter(Boolean).join(' · ')}</small>
              {m.connection?.state === 'connected' && <StatusPill status="connected" />}</div>
          </div>
          <KV rows={[['Industry', m.industry], ['Expertise', m.expertise.slice(0, 2).join(', ')], ['Location', m.location]]} />
          {m.interests.length > 0 && <div className="p-note"><Icon name="handshake" /><span><b>Networking Interests</b>{m.interests.join(' · ')}</span></div>}
          <div className="p-two-btn">
            <a className="p-btn outline" href={`#directory/${m.slug}`}>Full Profile</a>
            {m.connection?.state === 'connected' ? <a className="p-btn" href={`#directory/${m.slug}/contact`}>View Connection</a> : <ConnectButton m={m} small={false} />}
          </div>
        </Card>
      )}
    </div>
  );
}

function Results({ d, q, clear }) {
  return (
    <Card title="Search Results" sub={`${d.total} matching member${d.total === 1 ? '' : 's'} for “${q}”`}
      action={<button type="button" className="p-btn outline sm" onClick={clear}><Icon name="refresh" /> Clear Search</button>}>
      <MemberTable rows={d.items} />
    </Card>
  );
}

function Filtered({ d, filters, set }) {
  const chips = ['industry', 'expertise', 'interest', 'location', 'connection'].filter((k) => filters[k]);
  return (
    <>
      <div className="p-card p-active-filters">
        <Icon name="filter" /><span><b>Active Filters</b><small>Members must match all selected criteria</small></span>
        <div className="p-chips">{chips.map((k) => (
          <button key={k} type="button" className="p-chip on" onClick={() => set({ [k]: '' })}>
            {k === 'connection' ? (filters[k] === 'connected' ? 'My Connections' : 'Not Connected') : filters[k]} <Icon name="x" />
          </button>
        ))}</div>
        <button type="button" className="p-btn outline sm" onClick={() => set(Object.fromEntries(chips.map((k) => [k, ''])))}><Icon name="refresh" /> Clear All</button>
      </div>
      <Card title="Filtered Members" sub={`${d.total} matching member${d.total === 1 ? '' : 's'}`}><MemberTable rows={d.items} /></Card>
    </>
  );
}

function ByFacet({ kind, d, filters, set }) {
  const f = FACET[kind];
  const list = d.facets[f.facet];
  const param = kind;
  const selected = filters[param] || list[0]?.name || '';
  const [all, setAll] = useState(false);
  const shown = useMemo(() => (selected && !filters[param]
    ? d.items.filter((m) => (kind === 'industry' ? m.industry === selected : kind === 'expertise' ? m.expertise.includes(selected) : m.interests.includes(selected)))
    : d.items), [d.items, selected, filters, param, kind]);
  const cols = kind === 'industry' ? ['company', 'expertise', 'interests'] : kind === 'expertise' ? ['company', 'industry', 'interests'] : ['company', 'industry', 'expertise'];
  return (
    <>
      <div className="p-stats">
        <Stat icon="users" tone="blue" label="Total Members" value={d.facets.members} />
        <Stat icon={f.icon} tone="orange" label={f.label} value={list.length} />
        <Stat icon="check-circle" tone="green" label={`Selected ${f.one}`} value={<span className="p-stat-small">{selected || '—'}</span>} />
      </div>
      {list.length ? (
        <>
          <Card title={f.explore} sub={f.pick} action={list.length > 6 && <button type="button" className="p-viewall" onClick={() => setAll((a) => !a)}>{all ? 'Show Less' : `View All ${f.label}`} <Icon name="arrow-right" /></button>}>
            <div className="p-facets">
              {(all ? list : list.slice(0, 6)).map((x) => (
                <button key={x.name} type="button" className={`p-facet${x.name === selected ? ' on' : ''}`} onClick={() => set({ [param]: x.name })}>
                  {x.name === selected && <span className="tick"><Icon name="check" /></span>}
                  <Icon name={f.icon} /><b>{x.name}</b><small>{x.count} Member{x.count === 1 ? '' : 's'}</small>
                </button>
              ))}
            </div>
          </Card>
          <Card title={`${selected} Members (${shown.length})`} sub={`Members in ${selected}`}
            action={<label className="p-inline-select"><span>Select {f.one}:</span>
              <Select options={list.map((x) => x.name)} value={selected} onChange={(v) => set({ [param]: v })} /></label>}>
            <MemberTable rows={shown} cols={cols} />
          </Card>
        </>
      ) : <Empty icon={f.icon} title={`No ${f.label.toLowerCase()} yet`}>Members add these on their profiles.</Empty>}
    </>
  );
}

function AdvancedFilters({ query }) {
  const { go, meta } = usePortal();
  const [v, setV] = useState(() => Object.fromEntries(FILTERS.map((k) => [k, query.get(k) || ''])));
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const active = FILTERS.filter((k) => v[k]);
  return (
    <>
      <Head title="Advanced Directory Filters" crumbs={[['Member Directory', 'directory'], ['Advanced Filters']]} back="directory" />
      <p className="p-note"><Icon name="info" /> Refine your member search using industry, expertise, location and business interests.</p>
      <form className="p-card p-form" onSubmit={(e) => { e.preventDefault(); go(toHash(v)); }}>
        <h3 className="p-sec"><Icon name="sliders" /> Filter Criteria</h3>
        <div className="p-form-grid">
          <Field label="Industry"><Select all="All Industries" options={meta.industries} value={v.industry} onChange={set('industry')} /></Field>
          <Field label="Professional Expertise"><Select all="All Expertise Areas" options={meta.expertiseAreas} value={v.expertise} onChange={set('expertise')} /></Field>
          <Field label="Location"><input className="p-input" value={v.location} onChange={(e) => set('location')(e.target.value)} placeholder="All Locations (e.g. Hyderabad)" /></Field>
          <Field label="Business Interests"><Select all="All Interests" options={meta.collaborationPreferences} value={v.interest} onChange={set('interest')} /></Field>
          <Field label="Member Name or Company" full><input className="p-input" value={v.q} onChange={(e) => set('q')(e.target.value)} placeholder="Search by member name or company…" /></Field>
        </div>
        <h3 className="p-sec"><Icon name="users" /> Connection Status</h3>
        <div className="p-radios">
          {[['', 'All Members'], ['connected', 'My Connections'], ['not', 'Not Connected']].map(([k, label]) => (
            <label key={k} className="p-check"><input type="radio" name="connection" checked={v.connection === k} onChange={() => set('connection')(k)} /> {label}</label>
          ))}
        </div>
        <h3 className="p-sec"><Icon name="filter" /> Active Filters
          {active.length > 0 && <button type="button" className="p-link" onClick={() => setV(Object.fromEntries(FILTERS.map((k) => [k, ''])))}>Clear All</button>}</h3>
        {active.length ? <div className="p-chips">{active.map((k) => <span key={k} className="p-chip on">{k === 'connection' ? (v[k] === 'connected' ? 'My Connections' : 'Not Connected') : v[k]}</span>)}</div>
          : <p className="p-muted">No filters selected. All discoverable members will be included.</p>}
        <div className="p-form-acts">
          <button type="button" className="p-btn outline" onClick={() => setV(Object.fromEntries(FILTERS.map((k) => [k, ''])))}><Icon name="refresh" /> Reset Filters</button>
          <a className="p-btn outline" href="#directory">Cancel</a>
          <button type="submit" className="p-btn"><Icon name="filter" /> Apply Filters</button>
        </div>
      </form>
    </>
  );
}

// ---------- Member profile ----------

function MemberProfile({ slug }) {
  const state = useData(`/members/${encodeURIComponent(slug)}`);
  return (
    <Load state={state}>
      {(m) => (
        <>
          <Head title="Member Profile Details" crumbs={[['Member Directory', 'directory'], ['Member Profile']]} back="directory" />
          <div className="p-profile-head">
            <Avatar name={m.full_name} photo={m.photo_url} size={78} />
            <div className="who"><h2>{m.full_name}</h2><p>{[m.designation, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p><Icon name="pin" /> {m.location}</p>}</div>
            <div className="side"><StatusPill status="confirmed">HEH Member</StatusPill><ConnectButton m={m} small={false} /></div>
          </div>
          <div className="p-grid-2">
            <Card title="Company Information" icon="building">
              <KV rows={[['Company', m.company], ['Industry', m.industry], ['Business Type', m.business_type], ['Location', m.location],
                m.website && ['Website', <a key="w" className="p-link" href={m.website} target="_blank" rel="noopener">{m.website.replace(/^https?:\/\//, '')}</a>]]} />
            </Card>
            <Card title="About Member" icon="user"><p className="p-text">{m.bio || m.company_about || 'This member has not added an introduction yet.'}</p></Card>
          </div>
          <Card title="Professional Expertise" icon="star"><Chips items={m.expertise} tone="blue" /></Card>
          <Card title="Business & Collaboration Interests" icon="handshake"><Chips items={[...m.interests, ...m.business_interests]} tone="purple" /></Card>
          {m.mutual_count > 0 && (
            <Card title="Mutual Connections" icon="users" sub={`${m.mutual_count} mutual connection${m.mutual_count === 1 ? '' : 's'}`}>
              <div className="p-avatars">{m.mutual.map((x) => <a key={x.id} href={`#directory/${x.slug}`} title={x.full_name}><Avatar name={x.full_name} photo={x.photo_url} size={36} /></a>)}</div>
            </Card>
          )}
          <Card title="Contact Information" icon="phone" action={<Pill tone="blue" icon="lock">Privacy Protected</Pill>}>
            <p className="p-muted">Contact details are displayed according to the member’s privacy settings. {m.connection?.state === 'connected'
              ? <a className="p-link" href={`#directory/${m.slug}/contact`}>View contact & networking details</a> : 'Connect with this member to request further information.'}</p>
          </Card>
          <div className="p-form-acts">
            <a className="p-btn outline" href="#directory"><Icon name="arrow-left" /> Back to Directory</a>
            {m.connection?.state === 'connected' ? <a className="p-btn" href={`#directory/${m.slug}/contact`}>View Connection <Icon name="arrow-right" /></a> : <ConnectButton m={m} small={false} />}
          </div>
        </>
      )}
    </Load>
  );
}

function SendRequest({ slug }) {
  const { call, meta, openModal, closeModal, go } = usePortal();
  const state = useData(`/members/${encodeURIComponent(slug)}`);
  const [purpose, setPurpose] = useState(meta.connectionPurposes[0]);
  const [message, setMessage] = useState('');
  const [busy, run] = useAction();
  const intros = [
    ['Explore Collaboration', 'I would like to connect with you through HEH to explore potential business collaboration opportunities.'],
    ['Business Networking', 'I would like to connect with you through HEH to expand our business networks.'],
    ['Business Referrals', 'I would like to connect with you through HEH to exchange business referrals.'],
  ];
  const send = (m) => run(async () => {
    const res = await call('/connections', { method: 'POST', body: { member_id: m.id, purpose, message } });
    openModal(
      <Dialog icon="check-circle" tone="green" title="Connection Request Sent"
        actions={<><button type="button" className="p-btn outline" onClick={() => { closeModal(); go('directory'); }}>Back to Directory</button>
          <button type="button" className="p-btn" onClick={() => { closeModal(); go(`connections/${res.id}`); }}>View Request</button></>}>
        <p>Your connection request has been successfully sent to the selected HEH member.</p>
        <div className="p-mini-member"><Avatar name={m.full_name} photo={m.photo_url} size={40} /><span><b>{m.full_name}</b><small>{m.company}</small></span><Pill tone="orange" icon="clock">Pending</Pill></div>
        <p className="p-muted small"><Icon name="bell" /> You will be notified when the member responds to your request.</p>
      </Dialog>,
    );
  }).catch(() => {});
  return (
    <Load state={state}>
      {(m) => (
        <>
          <Head title="Send Connection Request" crumbs={[['Member Directory', 'directory'], ['Member Profile', `directory/${m.slug}`], ['Connect']]} back={`directory/${m.slug}`} />
          <section className="p-card p-form">
            <small className="p-label">Connect With</small>
            <div className="p-profile-head flat">
              <Avatar name={m.full_name} photo={m.photo_url} size={64} />
              <div className="who"><h2>{m.full_name}</h2><p>{[m.designation, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p><Icon name="pin" /> {m.location}</p>}</div>
              <div className="side"><Pill tone="blue">HEH Member</Pill></div>
            </div>
            {m.connection ? <p className="p-note"><Icon name="info" /> {m.connection.state === 'connected' ? 'You are already connected with this member.' : 'There is already a pending request between you and this member.'}</p> : (
              <>
                <h3 className="p-sec"><Icon name="target" /> Networking Purpose <small>Select the primary reason for connecting.</small></h3>
                <div className="p-radios">
                  {meta.connectionPurposes.map((x) => <label key={x} className="p-check"><input type="radio" name="purpose" checked={purpose === x} onChange={() => setPurpose(x)} /> {x}</label>)}
                </div>
                <h3 className="p-sec"><Icon name="chat" /> Personal Message <small>(Optional)</small></h3>
                <textarea className="p-input" rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a short note…" />
                <small className="p-count">{message.length} / 300</small>
                <h3 className="p-sec"><Icon name="bolt" /> Quick Introduction <small>Use a ready message or customise your own.</small></h3>
                <div className="p-chips">{intros.map(([label, text]) => <button key={label} type="button" className={`p-chip${message === text ? ' on' : ''}`} onClick={() => setMessage(text)}>{label}</button>)}</div>
                <p className="p-note"><Icon name="info" /><span><b>Before You Send</b> Your name, company, selected networking purpose and introduction will be shared with the recipient. The member can accept or decline your request.</span></p>
              </>
            )}
            <div className="p-form-acts">
              <a className="p-btn outline" href={`#directory/${m.slug}`}>Cancel</a>
              {!m.connection && <button type="button" className="p-btn" disabled={busy} onClick={() => send(m)}><Icon name="send" /> {busy ? 'Sending…' : 'Send Request'}</button>}
            </div>
          </section>
        </>
      )}
    </Load>
  );
}

const VIS_TEXT = { members: 'Visible to HEH members', connections: 'Visible to connections', private: 'Private (Not shared)' };

function Contact({ slug }) {
  const { openModal, closeModal, go } = usePortal();
  const state = useData(`/members/${encodeURIComponent(slug)}`);
  const restricted = (m) => openModal(
    <Dialog icon="lock" tone="blue" title="Contact Information Restricted"
      actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Close</button>
        <button type="button" className="p-btn" onClick={() => { closeModal(); go(`directory/${m.slug}`); }}>View Profile</button></>}>
      <p>This member has chosen to keep certain contact details private.</p>
      <div className="p-mini-member"><Avatar name={m.full_name} photo={m.photo_url} size={40} /><span><b>{m.full_name}</b><small>{m.company}</small></span><Pill tone="orange" icon="lock">Private</Pill></div>
      <KV rows={[['Mobile Number', m.contact.mobile ? 'Shared' : 'Hidden'], ['Personal Email', m.contact.email ? 'Shared' : 'Hidden']]} />
      <p className="p-note"><Icon name="info" /> You can still explore the member’s public profile and connect through HEH.</p>
    </Dialog>,
  );
  return (
    <Load state={state}>
      {(m) => (
        <>
          <Head title="Member Contact & Networking" crumbs={[['Member Directory', 'directory'], ['Member Profile', `directory/${m.slug}`], ['Contact & Networking']]} back={`directory/${m.slug}`} />
          <div className="p-profile-head">
            <Avatar name={m.full_name} photo={m.photo_url} size={72} />
            <div className="who"><h2>{m.full_name}</h2><p>{[m.designation, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p><Icon name="pin" /> {m.location}</p>}</div>
            <div className="side">{m.connection?.state === 'connected' ? <StatusPill status="connected" /> : <ConnectButton m={m} small={false} />}<small>HEH Connection</small></div>
          </div>
          <Card title="Contact Information" icon="mail" action={<Pill tone="green" icon="shield-check">Privacy Controlled</Pill>}>
            <div className="p-contact-grid">
              <ContactItem icon="mail" label="Personal Email" value={m.contact.email} vis={m.contact.email_visibility} onLocked={() => restricted(m)} href={`mailto:${m.contact.email}`} />
              <ContactItem icon="phone" label="Mobile Number" value={m.contact.mobile} vis={m.contact.mobile_visibility} onLocked={() => restricted(m)} href={`tel:${m.contact.mobile}`} />
              <ContactItem icon="mail" label="Business Email" value={m.contact.business_email} vis={m.connection?.state === 'connected' ? 'connections' : 'private'} onLocked={() => restricted(m)} href={`mailto:${m.contact.business_email}`} />
              <ContactItem icon="globe" label="Company Website" value={m.website && m.website.replace(/^https?:\/\//, '')} vis="members" href={m.website} />
              <ContactItem icon="pin" label="Location" value={m.location} vis="members" />
            </div>
          </Card>
          <div className="p-grid-2">
            <Card title="Networking Interests" icon="handshake"><Chips items={m.interests} tone="blue" /></Card>
            <Card title="Business Opportunities" icon="target">
              {(m.opportunities || []).length ? <ul className="p-bullets">{m.opportunities.map((o) => <li key={o}>{o}</li>)}</ul>
                : <p className="p-text">{m.products_services || 'Open to partnerships and business collaborations.'}</p>}
            </Card>
          </div>
          <p className="p-note"><Icon name="shield" /><span><b>Member Privacy</b> Contact details remain protected according to member preferences, even after connecting.</span></p>
          <div className="p-form-acts">
            <a className="p-btn outline" href={`#directory/${m.slug}`}><Icon name="arrow-left" /> Back to Profile</a>
            {m.connection?.id && <a className="p-btn" href={`#connections/${m.connection.id}`}>View Connection <Icon name="arrow-right" /></a>}
          </div>
          <p className="p-muted small center">Member since {day(m.member_since)}</p>
        </>
      )}
    </Load>
  );
}

function ContactItem({ icon, label, value, vis, href, onLocked }) {
  return (
    <div className="p-contact-item">
      <span className="p-ico blue"><Icon name={icon} /></span>
      <span><b>{label}</b>{value ? (href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener">{value}</a> : <small>{value}</small>) : <small>{VIS_TEXT[vis] || 'Not shared'}</small>}</span>
      {!value && onLocked && <button type="button" className="p-lock" onClick={onLocked} aria-label="Why is this hidden?"><Icon name="lock" /></button>}
    </div>
  );
}
