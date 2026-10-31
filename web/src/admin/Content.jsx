// Events, members and success stories: list + editor.
import { useState } from 'react';
import { fmt } from '../lib/format.js';
import { FormError, showErrors } from '../components/forms.jsx';
import { label, useAdmin, useLoad, ViewState } from './Admin.jsx';
import { Pill, YesNo } from './Submissions.jsx';

// Field spec: [name, label, type, extra]. Types: text, textarea, date, time, url, image, select, check, lines, pairs, triples, photos, group
const CONTENT = {
  events: {
    title: 'Events',
    single: 'Event',
    head: ['Title', 'Date', 'Venue', 'Registrations', 'Registration open', 'Published'],
    row: (e) => [
      <><b>{e.title}</b><div className="sub">{e.category === 'workshop' ? 'Workshop' : 'Spotlight'} · /event?e={e.slug}</div></>,
      fmt.date(e.event_date), e.venue_name,
      <a href={`#registrations?event_id=${e.id}`} onClick={(ev) => ev.stopPropagation()}>{e.registrations}</a>,
      <YesNo value={e.registration_open} />, <YesNo value={e.published} />,
    ],
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
    head: ['Name', 'Membership ID', 'Company', 'Industry', 'Status'],
    row: (m) => [<><b>{m.full_name}</b><div className="sub">{m.designation}</div></>, m.member_code, m.company, m.industry,
      <Pill status={m.status === 'active' ? 'yes' : 'no'} text={label(m.status)} />],
    publicUrl: (m) => `/member?m=${encodeURIComponent(m.slug)}`,
    defaults: { status: 'active', location: 'Hyderabad, Telangana', offers: [], opportunities: [], collaboration_interests: [], sort_order: 0 },
    fields: (meta) => [
      ['full_name', 'Full name *', 'text'], ['member_code', 'HEH Membership ID * (used for event registration)', 'text'],
      ['designation', 'Designation', 'text'], ['company', 'Company', 'text'],
      ['industry', 'Industry', 'select', meta.industries.map((i) => [i, i])], ['location', 'Business location', 'text'],
      ['photo_url', 'Profile photo', 'image'],
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
    head: ['Title', 'Category', 'Published on', 'Featured', 'Published'],
    row: (s) => [<b>{s.title}</b>, s.category, fmt.date(s.published_on), <YesNo value={s.featured} />, <YesNo value={s.published} />],
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
  if (res.status === 401) showLogin();
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

export default function Content({ name }) {
  const { call, toast, openModal, reload } = useAdmin();
  const def = CONTENT[name];
  const state = useLoad(() => call(`/${name}`));

  const edit = (item) => openModal(<Editor key={`${name}-${item.id || 'new'}-${Date.now()}`} name={name} item={item} onSaved={reload} />);

  return (
    <ViewState state={state}>
      {({ items }) => (
        <>
          <div className="bar">
            <h1>{def.title} <span className="muted" style={{ fontSize: 18 }}>({items.length})</span></h1>
            <button className="btn btn-primary btn-sm" onClick={() => edit({ ...def.defaults })}>+ Add {def.single}</button>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr>{def.head.map((h) => <th key={h}>{h}</th>)}<th /></tr></thead>
              <tbody>
                {items.length ? items.map((it) => (
                  <tr key={it.id} className="clickable" onClick={async () => {
                    try { edit(await call(`/${name}/${it.id}`)); } catch (err) { toast(err.message, true); }
                  }}>
                    {def.row(it).map((c, i) => <td key={i}>{c}</td>)}
                    <td><a href={def.publicUrl(it)} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>View</a></td>
                  </tr>
                )) : (
                  <tr><td colSpan={def.head.length + 1} className="muted" style={{ textAlign: 'center', padding: 30 }}>Nothing yet. Click “Add {def.single}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ViewState>
  );
}
