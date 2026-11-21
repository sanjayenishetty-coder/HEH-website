// Building blocks shared by the admin screens (designs: images/Admin Login/.../Part1):
// page header, summary cards, filter bar, sortable/paged table, avatars and status pills.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';

export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

// tone: blue | orange | green | purple | red
export function StatCard({ icon, tone = 'blue', title, value, sub, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`a-stat${onClick ? ' link' : ''}`} onClick={onClick}>
      <span className={`a-ic ${tone}`}><Icon name={icon} solid /></span>
      <span className="a-stat-text">
        <b className="t">{title}</b>
        <b className="n">{value ?? '—'}</b>
        {sub && <span className="s">{sub}</span>}
      </span>
      {onClick && <Icon name="chevron-right" className="go" />}
    </Tag>
  );
}

export const Stats = ({ children }) => <div className="a-stats">{children}</div>;

// Filters are edited as a draft and take effect on Apply (or Enter in the search box); Clear resets them.
// fields: [{ name, type: 'search' | 'select', placeholder, options: [[value, label]], all: 'All Status', icon }]
export function FilterBar({ fields, value, onApply }) {
  const [draft, setDraft] = useState(value);
  const set = (name, v) => setDraft((d) => ({ ...d, [name]: v }));
  const empty = Object.fromEntries(fields.map((f) => [f.name, '']));
  return (
    <form className="a-filters" onSubmit={(e) => { e.preventDefault(); onApply(draft); }}>
      {fields.map((f) => (f.type === 'search' ? (
        <label className="a-search" key={f.name}>
          <Icon name="search" />
          <input value={draft[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} aria-label={f.placeholder} />
        </label>
      ) : (
        <label className={`a-select${f.icon ? ' with-icon' : ''}`} key={f.name}>
          {f.icon && <Icon name={f.icon} />}
          <select value={draft[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} aria-label={f.all}>
            <option value="">{f.all}</option>
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )))}
      <button className="btn btn-primary" type="submit">Apply</button>
      <button className="btn btn-outline" type="button" onClick={() => { setDraft(empty); onApply(empty); }}>Clear</button>
    </form>
  );
}

// Date ranges for the filter bars.
export const DATE_RANGES = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months']];
export const withinDays = (ts, days) => !days || Date.now() - new Date(ts).getTime() <= Number(days) * 86400000;
export const matches = (q, ...texts) => !q || texts.some((t) => String(t || '').toLowerCase().includes(q.trim().toLowerCase()));

// columns: [{ key, label, render(row), sort(row) -> value (omit = not sortable), className }]
export function DataTable({ title, columns, rows, noun = 'items', empty = 'Nothing here yet.', onRow, tabs }) {
  const [sort, setSort] = useState(null); // { key, dir }
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r) => { const v = col.sort(r); return typeof v === 'string' ? v.toLowerCase() : v ?? ''; };
    return [...rows].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1));
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / per));
  const p = Math.min(page, pages);
  const shown = sorted.slice((p - 1) * per, p * per);
  const from = sorted.length ? (p - 1) * per + 1 : 0;
  const to = Math.min(p * per, sorted.length);
  const toggle = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  // up to five page buttons around the current page
  const first = Math.max(1, Math.min(p - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);

  const pager = (
    <div className="a-pager">
      <button type="button" disabled={p <= 1} onClick={() => setPage(p - 1)} aria-label="Previous page"><Icon name="arrow-left" /></button>
      {nums.map((n) => <button type="button" key={n} className={n === p ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>)}
      <button type="button" disabled={p >= pages} onClick={() => setPage(p + 1)} aria-label="Next page"><Icon name="arrow-right" /></button>
    </div>
  );

  return (
    <section className="a-card a-table-card">
      {tabs}
      {title && (
        <div className="a-table-head">
          <h2>{title}</h2>
          <div className="a-table-meta">
            <span>Showing {from}–{to} of {sorted.length}</span>
            {pages > 1 && pager}
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="data a-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.className}>
                  {c.sort ? (
                    <button type="button" className={`th-sort${sort?.key === c.key ? ` ${sort.dir}` : ''}`} onClick={() => toggle(c.key)}>
                      {c.label} <Icon name="sort" />
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length ? shown.map((r) => (
              <tr key={r.id} className={onRow ? 'clickable' : ''} onClick={onRow ? () => onRow(r) : undefined}>
                {columns.map((c) => <td key={c.key} className={c.className}>{c.render(r)}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="a-empty">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="a-table-foot">
        <span>Showing {from}–{to} of {sorted.length} {noun}</span>
        <div className="a-table-meta">
          {pages > 1 && pager}
          <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}

// "View →" / "Manage →" buttons in the last column (the row click does the same).
export const RowButton = ({ children = 'View', onClick }) => (
  <button type="button" className="a-row-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>{children} <Icon name="arrow-right" /></button>
);

export function Avatar({ name, photo, size = 34 }) {
  const initials = String(name || '?').replace(/^(dr|ar|mr|ms|mrs)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return photo
    ? <img className="a-avatar" src={photo} alt="" width={size} height={size} style={{ width: size, height: size }} loading="lazy" />
    : <span className="a-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>;
}

// Status labels and colours as in the designs.
const STATUS = {
  received: ['New', 'blue'],
  under_review: ['Under Review', 'orange'],
  interaction: ['Interaction', 'purple'],
  approved: ['Approved', 'green'],
  rejected: ['Rejected', 'red'],
  in_progress: ['In Progress', 'orange'],
  closed: ['Resolved', 'green'],
  confirmed: ['Confirmed', 'green'],
  cancelled: ['Cancelled', 'red'],
  attended: ['Attended', 'blue'],
  active: ['Active', 'green'],
  inactive: ['Inactive', 'grey'],
  upcoming: ['Upcoming', 'blue'],
  completed: ['Completed', 'green'],
  draft: ['Draft', 'grey'],
  published: ['Published', 'green'],
  pending: ['Pending Approval', 'orange'],
  awaiting: ['Awaiting Approval', 'orange'],
  archived: ['Archived', 'grey'],
};
export const statusLabel = (s) => STATUS[s]?.[0] || String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const StatusPill = ({ status }) => <span className={`a-pill ${STATUS[status]?.[1] || 'grey'}`}>{statusLabel(status)}</span>;
export const TypePill = ({ type }) => <span className={`a-pill ${type === 'workshop' ? 'orange' : 'blue'} soft`}>{type === 'workshop' ? 'Workshop' : 'Spotlight'}</span>;

// Event state shown in lists: awaiting approval / rejected (added by the Working Committee in the Member Portal),
// draft (unpublished), upcoming, completed.
export const eventStatus = (e) => {
  if (e.approval_status === 'pending') return 'awaiting';
  if (e.approval_status === 'rejected') return 'rejected';
  if (!e.published) return 'draft';
  const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10); // India date
  return e.event_date && String(e.event_date).slice(0, 10) < today ? 'completed' : 'upcoming';
};

export const When = ({ date, start, end }) => (
  <span className="a-when">
    <span><Icon name="calendar" /> {fmt.date(date)}</span>
    {start && <span><Icon name="clock" /> {fmt.timeRange(start, end)}</span>}
  </span>
);

// Short relative time for activity feeds: "5 minutes ago", "3 hours ago", "12 Oct 2026".
export function ago(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} minute${s < 120 ? '' : 's'} ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hour${s < 7200 ? '' : 's'} ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} day${s < 172800 ? '' : 's'} ago`;
  return fmt.stamp(ts).slice(0, 11);
}
