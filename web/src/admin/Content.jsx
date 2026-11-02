// Events, members and success stories: list + editor.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { FormError, showErrors } from '../components/forms.jsx';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import {
  Avatar, DATE_RANGES, DataTable, FilterBar, PageHead, RowButton, StatCard, StatusPill, TypePill, When, eventStatus, matches, withinDays,
} from './ui.jsx';

// Field spec: [name, label, type, extra]. Types: text, textarea, date, time, url, image, select, check, lines, pairs, triples, photos, group
const CONTENT = {
  events: {
    title: 'Events',
    single: 'Event',
    publicUrl: (e) => `/event?e=${encodeURIComponent(e.slug)}`,
    defaults: { category: 'spotlight', members_only: true, registration_open: true, published: true, agenda: [], takeaways: [], photos: [] },
    fields: (meta) => [
      ['title', 'Title *', 'text'],
      ['category', 'Category', 'select', meta.eventCategories.map((c) => [c, c === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight'])],
      ['event_date', 'Date', 'date'], ['start_time', 'Start time', 'time'], ['end_time', 'End time', 'time'],
      ['short_description', 'Short description (cards & registration page)', 'text'],
      ['description', 'About the event (upcoming page)', 'textarea'],
      ['image_url', 'Event image', 'image'],
      ['venue_name', 'Venue name', 'text'], ['venue_address', 'Venue address', 'text'],
      ['map_url', 'Google Maps link (optional, for “Get Directions”)', 'url'],
      ['members_only', 'Members only (registration requires a valid HEH Membership ID)', 'check'],
      ['registration_open', 'Registration open', 'check'],
      ['published', 'Published on website', 'check'],
      ['agenda', 'Agenda — one item per line: time | title | details', 'triples', ['time', 'title', 'details']],
      ['speaker', 'Speaker', 'group', [['name', 'Name'], ['designation', 'Designation'], ['company', 'Company'], ['bio', 'Introduction', 'textarea'], ['photo_url', 'Photo', 'image']]],
      ['summary', 'About this gathering (shown after the event)', 'textarea'],
      ['photos', 'Event photos (shown after the event)', 'photos'],
      ['featured', 'Featured entrepreneur (after the event)', 'group', [['name', 'Name'], ['designation', 'Designation'], ['company', 'Company'], ['topic', 'Talk / topic'], ['photo_url', 'Photo', 'image']]],
      ['takeaways', 'Key takeaways — one per line: title | text', 'pairs', ['title', 'text']],
    ],
  },
  members: {
    title: 'Members',
    single: 'Member',
    publicUrl: (m) => `/member?m=${encodeURIComponent(m.slug)}`,
    defaults: { status: 'active', location: 'Hyderabad, Telangana', offers: [], opportunities: [], collaboration_interests: [], member_types: [], team_order: 0, sort_order: 0 },
    fields: (meta) => [
      ['full_name', 'Full name *', 'text'], ['member_code', 'HEH Membership ID * (used for event registration)', 'text'],
      ['designation', 'Designation', 'text'], ['company', 'Company', 'text'],
      ['industry', 'Industry', 'select', meta.industries.map((i) => [i, i])], ['location', 'Business location', 'text'],
      ['photo_url', 'Profile photo', 'image'],
      ['member_types', 'Member type (groups on the About HEH > Members page)', 'checks', meta.memberTypes || []],
      ['team_role', 'Role on the Members page (e.g. Marketing Head; blank = designation). First line is the role; extra lines show below it in smaller text', 'textarea'],
      ['team_order', 'Order on the Members page (1, 2, 3… within the group; 0 = after those)', 'text'],
      ['bio', 'About the entrepreneur', 'textarea'],
      ['experience', 'Experience (short)', 'text'], ['expertise', 'Expertise (short)', 'text'], ['passion', 'Passion (short)', 'text'],
      ['company_tagline', 'Company tagline', 'text'], ['company_image_url', 'Company image / logo', 'image'],
      ['company_about', 'About the company', 'textarea'], ['products_services', 'Products / services', 'textarea'],
      ['website', 'Company website', 'url'],
      ['offers', 'What we offer — one per line: title | text', 'pairs', ['title', 'text']],
      ['opportunities', 'Business opportunities — one per line', 'lines'],
      ['collaboration_interests', 'Collaboration interests — one per line', 'lines'],
      ['email', 'Email (private, admin only)', 'text'], ['phone', 'Phone (private, admin only)', 'text'],
      ['status', 'Status', 'select', [['active', 'Active (shown on website)'], ['inactive', 'Inactive (hidden)']]],
      ['sort_order', 'Sort order (lower shows first)', 'text'],
    ],
  },
  stories: {
    title: 'Success Stories',
    single: 'Story',
    publicUrl: (s) => `/story?s=${encodeURIComponent(s.slug)}`,
    defaults: { category: 'Business Collaboration', published: true, featured: false, members_involved: [], companies: [] },
    fields: (meta) => [
      ['title', 'Title *', 'text'], ['category', 'Category', 'select', meta.storyCategories.map((c) => [c, c])],
      ['summary', 'Summary (cards)', 'textarea'], ['body', 'Full story (blank line between paragraphs)', 'textarea'],
      ['image_url', 'Photo', 'image'],
      ['members_involved', 'Members involved — one per line', 'lines'], ['companies', 'Companies — one per line', 'lines'],
      ['business_category', 'Business category', 'text'], ['published_on', 'Published on', 'date'],
      ['featured', 'Featured story (shown at the top of Success Stories)', 'check'], ['published', 'Published on website', 'check'],
    ],
  },
};

const toLines = (arr) => (arr || []).join('\n');
const toRows = (arr, keys) => (arr || []).map((o) => keys.map((k) => o[k] || '').join(' | ')).join('\n');
const fromLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const fromRows = (s, keys) => fromLines(s).map((line) => {
  const parts = line.split('|').map((x) => x.trim());
  // Extra "|" characters stay in the last field.
  const o = {};
  keys.forEach((k, i) => (o[k] = i === keys.length - 1 ? parts.slice(i).join(' | ') : parts[i] || ''));
  return o;
});

async function uploadFile(file, showLogin) {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) showLogin(true);
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

function ImageField({ id, n, text, value, error }) {
  const { toast, showLogin } = useAdmin();
  const [url, setUrl] = useState(value || '');
  async function onFile(e) {
    const inp = e.currentTarget;
    if (!inp.files[0]) return;
    try {
      setUrl(await uploadFile(inp.files[0], showLogin));
      toast('Image uploaded');
    } catch (err) { toast(err.message, true); }
    inp.value = '';
  }
  return (
    <div className={`field full${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{text}</label>
      <div className="img-field">
        <span className="thumb" style={url ? { backgroundImage: `url('${url}')` } : undefined} />
        <input className="input" id={id} name={n} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Upload an image or paste an https:// link" />
        <span className="btn btn-outline btn-sm upload-btn">Upload<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} /></span>
      </div>
      {error && <span className="err">{error}</span>}
    </div>
  );
}

function PhotosField({ n, text, value }) {
  const { toast, showLogin } = useAdmin();
  const [list, setList] = useState(value || []);
  async function onFiles(e) {
    const inp = e.currentTarget;
    for (const file of [...inp.files]) {
      try {
        const url = await uploadFile(file, showLogin);
        setList((l) => [...l, url]);
      } catch (err) { toast(err.message, true); }
    }
    inp.value = '';
  }
  return (
    <div className="field full">
      <label>{text}</label>
      <input type="hidden" name={n} data-kind="json" value={JSON.stringify(list)} />
      <div className="photo-list">
        {list.map((u, i) => (
          <span className="p" key={`${i}${u}`} style={{ backgroundImage: `url('${u}')` }}>
            <button type="button" aria-label="Remove" onClick={() => setList(list.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
      </div>
      <span className="btn btn-outline btn-sm upload-btn" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onFiles} />
      </span>
    </div>
  );
}

function FieldInput({ spec: [name, text, type, extra], value, errors, prefix = '' }) {
  const id = `f_${prefix}${name}`;
  const n = `${prefix}${name}`;
  const v = value ?? '';
  const error = errors[n];
  const wrap = (cls, input) => (
    <div className={`field${cls}${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{text}</label>
      {input}
      {error && <span className="err">{error}</span>}
    </div>
  );
  switch (type) {
    case 'textarea': return wrap(' full', <textarea className="input" id={id} name={n} defaultValue={v} />);
    case 'date': return wrap('', <input className="input" type="date" id={id} name={n} defaultValue={v} />);
    case 'time': return wrap('', <input className="input" type="time" id={id} name={n} defaultValue={String(v).slice(0, 5)} />);
    case 'select': return wrap('', (
      <select className="input" id={id} name={n} defaultValue={v}>
        {extra.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
      </select>
    ));
    case 'check': return <label className="check full"><input type="checkbox" name={n} defaultChecked={!!v} /> {text}</label>;
    case 'checks': return ( // several options, saved as a list of the checked keys
      <fieldset className="full">
        <legend>{text}</legend>
        <div className="checks-row">
          {extra.map(([key, lab]) => (
            <label className="check" key={key}>
              <input type="checkbox" name={n} value={key} data-kind="multi" defaultChecked={(v || []).includes(key)} /> {lab}
            </label>
          ))}
        </div>
      </fieldset>
    );
    case 'image': return <ImageField id={id} n={n} text={text} value={v} error={error} />;
    case 'lines': return wrap(' full', <textarea className="input" id={id} name={n} data-kind="lines" defaultValue={toLines(v)} />);
    case 'pairs':
    case 'triples': return wrap(' full', <textarea className="input" id={id} name={n} data-kind="rows" data-keys={extra.join(',')} defaultValue={toRows(v, extra)} />);
    case 'photos': return <PhotosField n={n} text={text} value={v || []} />;
    case 'group': return (
      <fieldset className="full">
        <legend>{text}</legend>
        <div className="form-grid">
          {extra.map(([k, l, t]) => <FieldInput key={k} spec={[k, l, t || 'text']} value={(v || {})[k]} errors={errors} prefix={`${name}.`} />)}
        </div>
        <p className="hint" style={{ marginTop: 8 }}>Leave all fields empty to hide this section.</p>
      </fieldset>
    );
    case 'url':
    default: return wrap('', <input className="input" id={id} name={n} defaultValue={v} />);
  }
}

function Editor({ name, item, onSaved }) {
  const { call, toast, closeModal, meta } = useAdmin();
  const def = CONTENT[name];
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = {};
    for (const el of form.elements) {
      if (!el.name || el.type === 'file') continue;
      if (el.dataset.kind === 'multi') {
        body[el.name] = body[el.name] || [];
        if (el.checked) body[el.name].push(el.value);
        continue;
      }
      let val = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.dataset.kind === 'lines') val = fromLines(val);
      if (el.dataset.kind === 'rows') val = fromRows(val, el.dataset.keys.split(','));
      if (el.dataset.kind === 'json') val = JSON.parse(val || '[]');
      if (el.name.includes('.')) {
        const [group, key] = el.name.split('.');
        body[group] = body[group] || {};
        body[group][key] = val;
      } else body[el.name] = val;
    }
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      await call(item.id ? `/${name}/${item.id}` : `/${name}`, { method: item.id ? 'PUT' : 'POST', body });
      toast(`${def.single} saved`);
      closeModal();
      onSaved();
    } catch (err) {
      showErrors(form, err, setErrors, setFormError);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const extra = name === 'events' ? ' All registrations for this event will also be deleted.' : '';
    if (!window.confirm(`Delete this ${def.single.toLowerCase()}?${extra} This cannot be undone.`)) return;
    try {
      await call(`/${name}/${item.id}`, { method: 'DELETE' });
      toast(`${def.single} deleted`);
      closeModal();
      onSaved();
    } catch (err) { toast(err.message, true); }
  }

  return (
    <form className="editor" noValidate onSubmit={save}>
      <h2>{item.id ? `Edit ${def.single}` : `New ${def.single}`}</h2>
      <div className="form-grid">
        {def.fields(meta).map((f) => <FieldInput key={f[0]} spec={f} value={item[f[0]]} errors={errors} />)}
      </div>
      <FormError message={formError} style={{ marginTop: 14 }} />
      <div className="actions">
        {item.id && <button type="button" className="btn btn-sm danger" onClick={remove}>Delete</button>}
        <button type="button" className="btn btn-outline btn-sm" onClick={closeModal}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>Save</button>
      </div>
    </form>
  );
}

// ---------- List screens (designs: Part1 Events Management, Member Directory, Success Stories) ----------
// Hash options: ?new=1 opens a blank editor, ?open=<id> opens that item, ?status=…, ?q=…

const todayIst = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const Thumb = ({ url }) => <span className="a-thumb" style={url ? { backgroundImage: `url('${url}')` } : undefined} />;

const LISTS = {
  events: {
    title: 'Events Management',
    sub: 'Manage HEH Spotlight, Workshop and community events.',
    add: 'Create Event',
    table: null, // tabs instead of a title
    noun: 'events',
    status: eventStatus,
    stats: (items) => [
      ['calendar', 'blue', 'Upcoming Events', items.filter((e) => eventStatus(e) === 'upcoming').length, 'Scheduled future events', 'upcoming'],
      ['check-circle', 'green', 'Completed Events', items.filter((e) => eventStatus(e) === 'completed').length, 'Events already conducted', 'completed'],
      ['users', 'orange', 'Total Registrations', items.reduce((n, e) => n + (e.registrations || 0), 0), 'Registrations across all events', null, 'registrations'],
    ],
    tabs: (items) => [['', 'All Events', items.length], ['spotlight', 'Spotlight', items.filter((e) => e.category !== 'workshop').length],
      ['workshop', 'Workshop', items.filter((e) => e.category === 'workshop').length]],
    tabMatch: (e, t) => !t || (t === 'workshop' ? e.category === 'workshop' : e.category !== 'workshop'),
    search: 'Search event name…',
    text: (e) => [e.title, e.venue_name, e.short_description],
    statuses: [['upcoming', 'Upcoming'], ['completed', 'Completed'], ['draft', 'Draft']],
    dates: { label: 'All Dates', options: [['future', 'Upcoming dates'], ['30', 'Next 30 days'], ['past', 'Past events']],
      match: (e, v) => {
        const d = String(e.event_date || '').slice(0, 10);
        if (!v) return true;
        if (!d) return false;
        if (v === 'past') return d < todayIst();
        if (v === 'future') return d >= todayIst();
        return d >= todayIst() && d <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      } },
    action: 'Manage',
    columns: [
      { key: 'title', label: 'Event', sort: (e) => e.title, render: (e) => (
        <span className="a-item"><Thumb url={e.image_url} /><span><b>{e.title}</b><small>{e.short_description}</small></span></span>
      ) },
      { key: 'type', label: 'Type', sort: (e) => e.category, render: (e) => <TypePill type={e.category} /> },
      { key: 'date', label: 'Date & Time', sort: (e) => `${e.event_date}${e.start_time}`, render: (e) => <When date={e.event_date} start={e.start_time} end={e.end_time} /> },
      { key: 'venue', label: 'Venue', sort: (e) => e.venue_name, render: (e) => (e.venue_name ? <span className="a-venue"><Icon name="pin" /> {e.venue_name}</span> : '—') },
      { key: 'regs', label: 'Registrations', className: 'num', sort: (e) => e.registrations, render: (e) => (
        <a href={`#registrations?event_id=${e.id}`} onClick={(ev) => ev.stopPropagation()}>{e.registrations}</a>
      ) },
    ],
  },
  members: {
    title: 'Member Directory',
    sub: 'Manage HEH members and their business profiles.',
    add: 'Add Member',
    table: 'Members',
    noun: 'members',
    status: (m) => (m.status === 'inactive' ? 'inactive' : 'active'),
    stats: (items) => [
      ['users', 'blue', 'Total Members', items.length, 'All registered members', ''],
      ['users', 'green', 'Active Members', items.filter((m) => m.status !== 'inactive').length, 'Shown on the website', 'active'],
      ['users', 'red', 'Inactive Members', items.filter((m) => m.status === 'inactive').length, 'Hidden from the website', 'inactive'],
    ],
    search: 'Search by member name or company…',
    text: (m) => [m.full_name, m.company, m.member_code, m.designation],
    statuses: [['active', 'Active'], ['inactive', 'Inactive']],
    category: { label: 'All Categories', get: (m) => m.industry },
    dates: { label: 'Join Date', options: DATE_RANGES, match: (m, v) => withinDays(m.created_at, v) },
    action: 'View Profile',
    columns: [
      { key: 'name', label: 'Member', sort: (m) => m.full_name, render: (m) => (
        <span className="a-who"><Avatar name={m.full_name} photo={m.photo_url} size={36} /><span>{m.full_name}<small>{m.member_code}</small></span></span>
      ) },
      { key: 'company', label: 'Company', sort: (m) => m.company, render: (m) => m.company },
      { key: 'cat', label: 'Category', sort: (m) => m.industry, render: (m) => m.industry },
      { key: 'des', label: 'Designation', sort: (m) => m.designation, render: (m) => m.designation },
      { key: 'type', label: 'Member Type', sort: (m) => (m.member_types || []).join(), render: (m, meta) => (m.member_types || [])
        .map((k) => (meta?.memberTypes || []).find(([key]) => key === k)?.[1] || k).join(', ') || '—' },
      { key: 'joined', label: 'Joined On', sort: (m) => m.created_at, render: (m) => <span className="nowrap">{fmt.stamp(m.created_at).slice(0, 11)}</span> },
    ],
  },
  stories: {
    title: 'Success Stories',
    sub: 'Showcase and manage member success stories.',
    add: 'Add Success Story',
    table: 'Success Stories',
    noun: 'stories',
    status: (s) => (s.published ? 'published' : 'draft'),
    stats: (items) => [
      ['star', 'blue', 'Total Stories', items.length, 'All success stories', ''],
      ['check-circle', 'green', 'Published Stories', items.filter((s) => s.published).length, 'Visible on the website', 'published'],
      ['file-edit', 'orange', 'Draft Stories', items.filter((s) => !s.published).length, 'Not yet published', 'draft'],
    ],
    search: 'Search story title or member…',
    text: (s) => [s.title, s.category, ...(s.members_involved || [])],
    statuses: [['published', 'Published'], ['draft', 'Draft']],
    category: { label: 'All Categories', get: (s) => s.category },
    action: 'Manage',
    columns: [
      { key: 'title', label: 'Story', sort: (s) => s.title, render: (s) => (
        <span className="a-item"><Thumb url={s.image_url} /><span><b>{s.title}</b>{s.featured && <small className="feat"><Icon name="star" /> Featured</small>}</span></span>
      ) },
      { key: 'members', label: 'Members', sort: (s) => (s.members_involved || []).join(), render: (s) => (s.members_involved || []).join(', ') || '—' },
      { key: 'cat', label: 'Category', sort: (s) => s.category, render: (s) => s.category },
      { key: 'date', label: 'Published On', sort: (s) => s.published_on, render: (s) => <span className="nowrap">{fmt.date(s.published_on)}</span> },
    ],
  },
};

export default function Content({ name, query }) {
  const { call } = useAdmin();
  const state = useLoad(() => call(`/${name}`));
  return <ViewState state={state}>{({ items }) => <ContentList name={name} query={query} items={items} />}</ViewState>;
}

function ContentList({ name, query, items }) {
  const { call, toast, openModal, reload, meta, go } = useAdmin();
  const def = CONTENT[name];
  const list = LISTS[name];
  const [tab, setTab] = useState('');
  const [filter, setFilter] = useState(() => ({ q: query.get('q') || '', status: query.get('status') || '', cat: '', dates: '' }));

  const edit = (item) => openModal(<Editor key={`${name}-${item.id || 'new'}-${Date.now()}`} name={name} item={item} onSaved={reload} />);
  const open = async (it) => {
    try { edit(await call(`/${name}/${it.id}`)); } catch (err) { toast(err.message, true); }
  };

  // ?new=1 / ?open=<id> from the dashboard; drop them from the address so a reload after saving doesn't reopen.
  useEffect(() => {
    const id = Number(query.get('open'));
    if (query.get('new')) edit({ ...def.defaults });
    else if (id) open({ id });
    if (query.get('new') || id) {
      const p = new URLSearchParams(query);
      p.delete('new');
      p.delete('open');
      window.history.replaceState(null, '', `#${name}${p.toString() ? `?${p}` : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => items.filter((it) => (
    (!list.tabMatch || list.tabMatch(it, tab))
    && matches(filter.q, ...list.text(it))
    && (!filter.status || list.status(it) === filter.status)
    && (!filter.cat || list.category?.get(it) === filter.cat)
    && (!list.dates || list.dates.match(it, filter.dates))
  )), [items, list, tab, filter]);

  const cats = list.category ? [...new Set(items.map(list.category.get).filter(Boolean))].sort() : [];
  const fields = [
    { name: 'q', type: 'search', placeholder: list.search },
    { name: 'status', all: 'All Status', options: list.statuses },
    ...(list.category ? [{ name: 'cat', all: list.category.label, options: cats.map((c) => [c, c]) }] : []),
    ...(list.dates ? [{ name: 'dates', all: list.dates.label, icon: 'calendar', options: list.dates.options }] : []),
  ];
  const columns = [
    ...list.columns.map((c) => ({ ...c, render: (r) => c.render(r, meta) })),
    { key: 'status', label: 'Status', sort: list.status, render: (r) => <StatusPill status={list.status(r)} /> },
    { key: 'act', label: 'Action', className: 'act', render: (r) => (
      <span className="a-acts">
        <RowButton onClick={() => open(r)}>{list.action}</RowButton>
        <a className="a-ext" href={def.publicUrl(r)} target="_blank" rel="noopener" title="Open on the website" onClick={(e) => e.stopPropagation()}><Icon name="external" /></a>
      </span>
    ) },
  ];
  const tabs = list.tabs && (
    <div className="a-tabs" role="tablist">
      {list.tabs(items).map(([k, text, n]) => (
        <button key={text} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{text} ({n})</button>
      ))}
    </div>
  );

  return (
    <>
      <PageHead title={list.title} sub={list.sub}>
        <button className="btn btn-primary" type="button" onClick={() => edit({ ...def.defaults })}><Icon name="plus" /> {list.add}</button>
      </PageHead>
      <div className="a-stats">
        {list.stats(items).map(([icon, tone, title, n, sub, status, hash]) => (
          <StatCard key={title} icon={icon} tone={tone} title={title} value={n} sub={sub}
            onClick={() => go(hash || `${name}${status ? `?status=${status}` : ''}`)} />
        ))}
      </div>
      {tabs ? (
        <section className="a-card a-tabbed">
          {tabs}
          <FilterBar fields={fields} value={filter} onApply={setFilter} />
        </section>
      ) : <FilterBar fields={fields} value={filter} onApply={setFilter} />}
      <DataTable title={list.table} columns={columns} rows={shown} noun={list.noun} onRow={open}
        empty={items.length ? 'Nothing matches these filters.' : `Nothing yet. Click “${list.add}”.`} />
    </>
  );
}
