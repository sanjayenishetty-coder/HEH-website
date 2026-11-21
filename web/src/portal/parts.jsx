// Shared pieces of the Member Portal screens (designs: images/Member Login Web Application/Part 1).
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';

// Load from the member API; reload() fetches again.
export function useData(path) {
  const { call } = usePortal();
  const [state, setState] = useState({ data: null, error: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    let live = true;
    call(path).then((data) => live && setState({ data, error: null }), (error) => live && setState({ data: null, error }));
    return () => { live = false; };
  }, [call, path, n]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { ...state, reload };
}

export function Load({ state, children }) {
  if (state.error) {
    return (
      <div className="p-empty"><Icon name="alert" /><p>{state.error.message}</p>
        <button type="button" className="p-btn outline sm" onClick={() => window.history.back()}><Icon name="arrow-left" /> Go Back</button></div>
    );
  }
  if (!state.data) return <div className="p-loading">Loading…</div>;
  return children(state.data);
}

// Page title row: back arrow, title, subtitle or breadcrumbs, actions on the right.
export function Head({ title, sub, crumbs, back, children }) {
  return (
    <div className="p-head">
      {back !== false && (
        <button type="button" className="p-back" aria-label="Back" onClick={() => (back ? (window.location.hash = back) : window.history.back())}>
          <Icon name="arrow-left" />
        </button>
      )}
      <div className="p-head-text">
        <h1>{title}</h1>
        {crumbs ? (
          <nav className="p-crumbs" aria-label="Breadcrumb">
            {crumbs.map(([label, hash], i) => (
              <span key={label}>{i > 0 && <Icon name="chevron-right" />}{hash ? <a href={`#${hash}`}>{label}</a> : label}</span>
            ))}
          </nav>
        ) : sub && <p>{sub}</p>}
      </div>
      {children && <div className="p-head-acts">{children}</div>}
    </div>
  );
}

// Segmented tabs; items: [key, label, icon?, count?]. With `base`, each tab is a link to #base/key.
export function Tabs({ items, value, onChange, base }) {
  return (
    <div className="p-tabs" role="tablist">
      {items.map(([key, label, icon, count]) => {
        const on = value === key;
        const inner = <>{icon && <Icon name={icon} />}<span>{label}</span>{count != null && <b className="n">{count}</b>}</>;
        return base != null ? (
          <a key={key} role="tab" aria-selected={on} className={on ? 'on' : ''} href={`#${[base, key].filter(Boolean).join('/')}`}>{inner}</a>
        ) : (
          <button key={key} type="button" role="tab" aria-selected={on} className={on ? 'on' : ''} onClick={() => onChange(key)}>{inner}</button>
        );
      })}
    </div>
  );
}

export function Card({ title, icon, tone = 'orange', action, sub, className = '', children, bar = false }) {
  return (
    <section className={`p-card ${className}`}>
      {(title || action) && (
        <header className={`p-card-head${bar ? ' bar' : ''}`}>
          {icon && <span className={`p-ico ${tone}`}><Icon name={icon} /></span>}
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          {action && <div className="p-card-act">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export const ViewAll = ({ href, children = 'View All' }) => <a className="p-viewall" href={href}>{children} <Icon name="arrow-right" /></a>;

export function Stat({ icon, tone = 'blue', label, value, href }) {
  const body = (
    <>
      <span className={`p-stat-ico ${tone}`}><Icon name={icon} /></span>
      <span className="p-stat-text"><small>{label}</small><b>{value}</b></span>
      {href && <span className="p-stat-go"><Icon name="arrow-right" /></span>}
    </>
  );
  return href ? <a className={`p-stat ${tone}`} href={href}>{body}</a> : <div className={`p-stat ${tone}`}>{body}</div>;
}

const initials = (name) => String(name || '?').replace(/\b(Dr|Mr|Mrs|Ms|CA)\.?\s+/gi, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const TONES = ['blue', 'orange', 'green', 'purple', 'red', 'navy'];
export function Avatar({ name, photo, size = 40, className = '' }) {
  const tone = TONES[[...String(name || '')].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
  return photo ? (
    <img className={`p-avatar ${className}`} src={photo} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className={`p-avatar ${tone} ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>{initials(name)}</span>
  );
}

export function Pill({ tone = 'grey', icon, children }) {
  return <span className={`p-pill ${tone}`}>{icon && <Icon name={icon} />}{children}</span>;
}

// Registration / connection / document statuses -> pill
const STATUS = {
  confirmed: ['green', 'check-circle', 'Confirmed'], pending: ['orange', 'clock', 'Pending'], attended: ['green', 'check-circle', 'Attended'],
  cancelled: ['grey', 'x', 'Cancelled'], rejected: ['red', 'x', 'Rejected'], verified: ['green', 'check-circle', 'Verified'],
  accepted: ['green', 'check-circle', 'Accepted'], declined: ['red', 'x', 'Declined'], connected: ['green', 'check-circle', 'Connected'],
  open: ['green', null, 'Open'], registered: ['blue', null, 'Registered'], completed: ['grey', 'check-circle', 'Completed'],
  closed: ['grey', null, 'Closed'], full: ['red', null, 'Full'],
};
export function StatusPill({ status, children }) {
  const [tone, icon, label] = STATUS[status] || ['grey', null, status];
  return <Pill tone={tone} icon={icon}>{children || label}</Pill>;
}

// 14 / NOV 2026 / Saturday
export function DateBox({ date, small = false, weekday = true }) {
  if (!date) return <span className={`p-date${small ? ' sm' : ''}`}><b>–</b><small>TBA</small></span>;
  const [, m, d] = String(date).slice(0, 10).split('-');
  const mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(m) - 1];
  return (
    <span className={`p-date${small ? ' sm' : ''}`}>
      <b>{d}</b><small>{mon} {String(date).slice(0, 4)}</small>{weekday && !small && <i>{fmt.weekday(date)}</i>}
    </span>
  );
}

export function Empty({ icon = 'info', title, children, action }) {
  return (
    <div className="p-empty">
      <span className="p-ico grey"><Icon name={icon} /></span>
      {title && <h3>{title}</h3>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

// Confirm / result dialog content (shown by openModal).
export function Dialog({ icon, tone = 'orange', title, children, actions, onClose, wide = false }) {
  const { closeModal } = usePortal();
  return (
    <div className={`p-dialog${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="p-x" aria-label="Close" onClick={onClose || closeModal}><Icon name="x" /></button>
      {icon && <span className={`p-dialog-ico ${tone}`}><Icon name={icon} /></span>}
      <h2>{title}</h2>
      <div className="p-dialog-body">{children}</div>
      {actions && <div className="p-dialog-acts">{actions}</div>}
    </div>
  );
}

export function Toggle({ name, checked, onChange, label }) {
  return (
    <label className="p-switch">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

// Choose several options as chips; extra values can be typed when `custom`.
export function ChipPicker({ options, value, onChange, custom = false, placeholder = 'Add another' }) {
  const [text, setText] = useState('');
  const all = [...new Set([...options, ...value])];
  const flip = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="p-chips-pick">
      <div className="p-chips">
        {all.map((o) => (
          <button key={o} type="button" className={`p-chip${value.includes(o) ? ' on' : ''}`} aria-pressed={value.includes(o)} onClick={() => flip(o)}>
            {value.includes(o) && <Icon name="check" />}{o}
          </button>
        ))}
      </div>
      {custom && (
        <div className="p-chip-add">
          <input className="p-input" value={text} maxLength={60} placeholder={placeholder}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button type="button" className="p-btn outline sm" onClick={add}>Add</button>
        </div>
      )}
    </div>
  );
}

export const Chips = ({ items, tone = '' }) => (items?.length ? (
  <div className="p-chips">{items.map((x) => <span key={x} className={`p-chip static ${tone}`}>{x}</span>)}</div>
) : <p className="p-muted">Not added yet.</p>);

// Label / value rows
export function KV({ rows }) {
  return (
    <dl className="p-kv">
      {rows.filter(Boolean).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}
    </dl>
  );
}

// group: several controls (e.g. chip buttons), so a <div> instead of a <label> that would forward clicks.
export function Field({ label, error, children, full = false, hint, group = false }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className={`p-field${full ? ' full' : ''}${error ? ' invalid' : ''}`}>
      <span className="p-label">{label}</span>
      {children}
      {hint && !error && <small className="p-hint">{hint}</small>}
      {error && <small className="p-err">{error}</small>}
    </Tag>
  );
}

export function Select({ options, value, onChange, all, ...rest }) {
  return (
    <select className="p-input" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {all && <option value="">{all}</option>}
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
}

export function Pager({ page, pages, onPage, total, shown, noun }) {
  return (
    <div className="p-pager">
      <span>Showing {shown} of {total} {noun}</span>
      {pages > 1 && (
        <div>
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><Icon name="arrow-left" /></button>
          {Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1).map((p, i, arr) => (
            <span key={p}>
              {i > 0 && arr[i - 1] !== p - 1 && <i>…</i>}
              <button type="button" className={p === page ? 'on' : ''} onClick={() => onPage(p)}>{p}</button>
            </span>
          ))}
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><Icon name="arrow-right" /></button>
        </div>
      )}
    </div>
  );
}

export function usePaged(list, size = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages);
  return { rows: list.slice((p - 1) * size, p * size), page: p, pages, setPage };
}

// Run an action with a busy flag and a toast on error. Returns the action's result, or undefined on error.
export function useAction() {
  const { toast } = usePortal();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn) => {
    setBusy(true);
    try { return await fn(); } catch (err) { if (!err.errors) toast(err.message, true); throw err; } finally { setBusy(false); }
  }, [toast]);
  return [busy, run];
}

export const when = (ts) => {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${diff < 7200 ? '' : 's'} ago`;
  if (diff < 172800) return 'Yesterday';
  return fmt.stamp(ts).slice(0, 11);
};
export const day = (ts) => (ts ? fmt.stamp(ts).slice(0, 11) : '—');

export function EventMeta({ e, venue = true }) {
  return (
    <span className="p-meta">
      <span><Icon name="clock" /> {fmt.timeRange(e.start_time, e.end_time)}</span>
      {venue && (e.venue_name || e.city) && <span><Icon name="pin" /> {e.venue_name || e.city}</span>}
      <span><Icon name="tag" /> {e.category === 'workshop' ? 'Workshop' : 'Networking'}</span>
    </span>
  );
}

// Upcoming event state for a member: Registered / Pending / Open / Closed
export function eventState(e) {
  if (e.my_status === 'confirmed' || e.my_status === 'attended') return ['registered', 'Registered'];
  if (e.my_status === 'pending') return ['pending', 'Pending'];
  if (e.is_past) return ['completed', 'Completed'];
  if (e.can_register) return ['open', 'Open'];
  return [/full/i.test(e.registration_note) ? 'full' : 'closed', /full/i.test(e.registration_note) ? 'Full' : 'Closed'];
}
