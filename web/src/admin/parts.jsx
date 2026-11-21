// Page parts for the full-page admin screens of the Part2 designs (images/Part2): breadcrumbs, panels with an
// icon heading, label/value lists, the "selected item" strip, notices, reason forms and activity history.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { FormError } from '../components/forms.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin } from './Admin.jsx';
import { DataTable, FilterBar, StatCard, matches, withinDays, DATE_RANGES } from './ui.jsx';

// Page title with breadcrumbs (last one is the current page) and a back button / actions on the right.
// crumbs: [[text, hash?], ...]
export function Page({ crumbs = [], title, sub, back, actions, children }) {
  return (
    <>
      <div className="page-head">
        <div>
          {crumbs.length > 0 && (
            <nav className="a-crumbs" aria-label="Breadcrumb">
              {crumbs.map(([t, hash], i) => (
                <span key={t}>
                  {i > 0 && <Icon name="chevron-right" />}
                  {hash && i < crumbs.length - 1 ? <a href={`#${hash}`}>{t}</a> : <b>{t}</b>}
                </span>
              ))}
            </nav>
          )}
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {(back || actions) && (
          <div className="page-actions">
            {actions}
            {back && <a className="btn btn-outline" href={`#${back[1]}`}><Icon name="arrow-left" /> {back[0]}</a>}
          </div>
        )}
      </div>
      {children}
    </>
  );
}

// White card with an icon, title and short description (the panels on every Part2 screen).
export function Panel({ icon, tone = 'orange', title, sub, aside, className = '', children }) {
  return (
    <section className={`a-card a-panel ${className}`.trim()}>
      {title && (
        <div className="a-panel-head">
          {icon && <span className={`a-ic sm ${tone}`}><Icon name={icon} /></span>}
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          {aside && <div className="aside">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// Label : value rows. rows: [[label, value], ...]; empty values show "—".
export function KV({ rows, cols = 1 }) {
  return (
    <dl className={`a-kv${cols === 2 ? ' two' : ''}`}>
      {rows.filter(Boolean).map(([k, v]) => [
        <dt key={`t${k}`}>{k}</dt>,
        <dd key={`d${k}`}>{v === '' || v == null ? '—' : v}</dd>,
      ])}
    </dl>
  );
}

// The strip at the top of action screens: the selected record's key facts. items: [[icon, label, value], ...]
export function Strip({ items }) {
  return (
    <section className="a-card a-strip">
      {items.filter(Boolean).map(([icon, label, value]) => (
        <div key={label}>
          <span className="a-ic sm orange"><Icon name={icon} /></span>
          <span><small>{label}</small><b>{value || '—'}</b></span>
        </div>
      ))}
    </section>
  );
}

// "What happens next?" boxes: an orange title and bullet points.
export function Notice({ title, items, icon = 'info', tone = 'orange' }) {
  return (
    <div className={`a-notice ${tone}`}>
      <b><Icon name={icon} /> {title}</b>
      <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

// Checklist rows: [[text, ok, detail?], ...]
export function Checklist({ items }) {
  return (
    <ul className="a-checklist">
      {items.map(([t, ok, detail]) => (
        <li key={t} className={ok ? 'ok' : 'no'}>
          <Icon name={ok ? 'check-circle' : 'alert'} /><span>{t}</span>{detail && <em>{detail}</em>}
        </li>
      ))}
    </ul>
  );
}

// Big empty state with an icon (No Activity Recorded, No Reports Generated Yet...).
export const Empty = ({ icon = 'file', title, children }) => (
  <div className="a-empty-big"><span className="a-ic orange"><Icon name={icon} /></span><b>{title}</b>{children && <p>{children}</p>}</div>
);

// Textarea with a "0 / 500" counter.
export function Counted({ name, max = 500, defaultValue = '', placeholder, rows = 4, id }) {
  const [n, setN] = useState(String(defaultValue || '').length);
  return (
    <div className="a-counted">
      <textarea className="input" id={id || name} name={name} maxLength={max} rows={rows} defaultValue={defaultValue} placeholder={placeholder}
        onChange={(e) => setN(e.target.value.length)} />
      <small>{n} / {max}</small>
    </div>
  );
}

// Labelled form field for the Part2 forms; error shows below.
export function F({ label, req, error, full, hint, htmlFor, children }) {
  return (
    <div className={`field${full ? ' full' : ''}${error ? ' invalid' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}{req && <span className="req"> *</span>}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export const Options = ({ list, placeholder }) => (
  <>
    {placeholder && <option value="">{placeholder}</option>}
    {list.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
  </>
);

// Read a form into an object (checkboxes as booleans).
export function readForm(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.type === 'file') continue;
    if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; continue; }
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  }
  return out;
}

// Submit a Part2 form to the admin API: field errors go next to fields, others in the error box.
// confirm: name of a checkbox that must be ticked first.
export function useAction() {
  const { call, toast } = useAdmin();
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(e, path, { method = 'POST', extra = {}, confirm, done, success } = {}) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = { ...readForm(form), ...extra };
    setErrors({});
    setFormError('');
    if (confirm && !body[confirm]) {
      setErrors({ [confirm]: 'Please tick this box to confirm.' });
      return null;
    }
    setBusy(true);
    try {
      const res = await call(path, { method, body });
      if (success) toast(success);
      if (done) done(res);
      return res;
    } catch (err) {
      const errs = err.errors || {};
      setErrors(errs);
      const first = Object.keys(errs).map((n) => form.elements[n]).find(Boolean);
      if (first?.focus) setTimeout(() => first.focus(), 0);
      if (!Object.keys(errs).length) setFormError(err.message);
      return null;
    } finally { setBusy(false); }
  }
  return { errors, formError, busy, run, setFormError };
}

// Confirmation checkbox + the form error box, above the footer buttons.
export function ConfirmRow({ name = 'confirm', text, error }) {
  return (
    <label className={`a-confirm${error ? ' invalid' : ''}`}>
      <input type="checkbox" name={name} /> <span>{text}</span>
      {error && <em>{error}</em>}
    </label>
  );
}

export const Foot = ({ error, children }) => (
  <div className="a-foot"><FormError message={error} />{children}</div>
);

// ---------- Activity history ----------

const when = (ts) => fmt.stamp(ts);

// Recent activity list (detail pages).
export function Timeline({ items, empty = 'No activity recorded yet.' }) {
  if (!items?.length) return <p className="a-muted-sm">{empty}</p>;
  return (
    <ul className="a-timeline">
      {items.map((a) => (
        <li key={a.id}>
          <span className="dot" />
          <span><b>{a.action}</b>{a.details && <small>{a.details}</small>}<small className="by">{when(a.created_at)}{a.admin_name ? ` · ${a.admin_name}` : ''}</small></span>
        </li>
      ))}
    </ul>
  );
}

// Activity History screens: three counts, filters and a table of actions.
// stats: [[icon, tone, title, (items) => n], ...]
export function ActivityHistory({ items, stats, entityLabel = 'Reference', search = 'Search by reference or details…' }) {
  const [filter, setFilter] = useState({ q: '', action: '', by: '', days: '' });
  const actions = [...new Set(items.map((a) => a.action))].sort();
  const admins = [...new Set(items.map((a) => a.admin_name).filter(Boolean))].sort();
  const shown = useMemo(() => items.filter((a) => (
    matches(filter.q, a.entity_ref, a.details, a.action)
    && (!filter.action || a.action === filter.action)
    && (!filter.by || a.admin_name === filter.by)
    && withinDays(a.created_at, filter.days)
  )), [items, filter]);
  const columns = [
    { key: 'at', label: 'Date & Time', sort: (a) => a.created_at, render: (a) => <span className="nowrap">{when(a.created_at)}</span> },
    { key: 'ref', label: entityLabel, sort: (a) => a.entity_ref, render: (a) => <b className="ref">{a.entity_ref || '—'}</b> },
    { key: 'action', label: 'Activity', sort: (a) => a.action, render: (a) => <span className="a-pill blue soft">{a.action}</span> },
    { key: 'details', label: 'Description', render: (a) => a.details || '—' },
    { key: 'by', label: 'Performed By', sort: (a) => a.admin_name, render: (a) => a.admin_name || 'System' },
  ];
  return (
    <>
      {stats && (
        <div className="a-stats">
          {stats.map(([icon, tone, title, count]) => <StatCard key={title} icon={icon} tone={tone} title={title} value={count(items)} />)}
        </div>
      )}
      <FilterBar value={filter} onApply={setFilter} fields={[
        { name: 'q', type: 'search', placeholder: search },
        { name: 'action', all: 'All Activities', options: actions.map((a) => [a, a]) },
        { name: 'by', all: 'All Administrators', options: admins.map((a) => [a, a]) },
        { name: 'days', all: 'Any Date', icon: 'calendar', options: DATE_RANGES },
      ]} />
      <DataTable title="Activity Records" columns={columns} rows={shown} noun="activities"
        empty={items.length ? 'Nothing matches these filters.' : 'No activity recorded yet. Actions taken in the admin panel will appear here.'} />
    </>
  );
}
