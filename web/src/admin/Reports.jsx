// Reports & Analytics (designs: images/Part2): overview, membership & applications, events & registrations,
// enquiries performance, and report export & download history.
// Routes: #reports, #reports/membership | events | enquiries | exports   (?from=YYYY-MM-DD&to=YYYY-MM-DD)
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import { exportAs } from './exporters.js';
import { REG_COLUMNS } from './Registrations.jsx';
import { Empty, F, KV, Options, Page, Panel } from './parts.jsx';
import { DataTable, StatCard, StatusPill, TypePill, statusLabel } from './ui.jsx';

const isoIndia = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const shift = (days) => isoIndia(new Date(Date.now() - days * 86400000));
function presetRange(p) {
  const t = isoIndia();
  const [y, m] = t.split('-').map(Number);
  if (p === 'month') return [`${t.slice(0, 7)}-01`, t];
  if (p === '30') return [shift(29), t];
  if (p === 'quarter') return [`${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, '0')}-01`, t];
  if (p === 'year') return [`${y}-01-01`, t];
  if (p === '12m') return [`${y - 1}-${String(m).padStart(2, '0')}-01`, t];
  return null;
}
const PRESETS = [['month', 'This Month'], ['30', 'Last 30 Days'], ['quarter', 'This Quarter'], ['year', 'This Year'], ['12m', 'Last 12 Months'], ['custom', 'Custom Range']];
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const MONTH = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
const COLORS = ['#2f6fd6', '#f26a1b', '#1f9d55', '#6b4fd8', '#d93a2b', '#8b95a5'];

export default function ReportPages({ path, query }) {
  const [page] = path;
  if (page === 'exports') return <Exports />;
  return <WithData page={page} query={query} />;
}

function Period({ value, onChange }) {
  const [preset, setPreset] = useState(value.preset);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  return (
    <span className="a-filters" style={{ margin: 0, padding: 0, border: 0, background: 'none', boxShadow: 'none' }}>
      <label className="a-select with-icon"><Icon name="calendar" />
        <select value={preset} onChange={(e) => {
          setPreset(e.target.value);
          const r = presetRange(e.target.value);
          if (r) onChange({ preset: e.target.value, from: r[0], to: r[1] });
        }} aria-label="Report period">
          {PRESETS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
      </label>
      {preset === 'custom' && <>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" style={{ width: 160 }} />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" style={{ width: 160 }} />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => onChange({ preset, from, to })}>Apply</button>
      </>}
    </span>
  );
}

function WithData({ page, query }) {
  const { call } = useAdmin();
  const initial = query.get('from') && query.get('to')
    ? { preset: 'custom', from: query.get('from'), to: query.get('to') }
    : { preset: 'month', ...Object.fromEntries([['from', presetRange('month')[0]], ['to', presetRange('month')[1]]]) };
  const [period, setPeriod] = useState(initial);
  const state = useLoad(() => call(`/reports?from=${initial.from}&to=${initial.to}`));
  const [data, setData] = useState(null);
  async function change(p) {
    setPeriod(p);
    try { setData(await call(`/reports?from=${p.from}&to=${p.to}`)); } catch { /* keeps the previous numbers */ }
  }
  return (
    <ViewState state={state}>
      {(first) => {
        const d = data || first;
        const picker = <Period value={period} onChange={change} />;
        if (page === 'membership') return <Membership d={d} picker={picker} />;
        if (page === 'events') return <Events d={d} picker={picker} />;
        if (page === 'enquiries') return <EnquiriesReport d={d} picker={picker} />;
        return <Overview d={d} picker={picker} />;
      }}
    </ViewState>
  );
}

// ---------- Charts ----------

function LineChart({ points, empty }) {
  const max = Math.max(...points.map(([, v]) => v), 0);
  if (!max) return <Empty icon="chart" title={empty || 'No data for this period'} />;
  const W = 520; const H = 170; const L = 30; const B = 24; const T = 10;
  const step = points.length > 1 ? (W - L - 10) / (points.length - 1) : 0;
  const xy = points.map(([, v], i) => [L + i * step, T + (H - T - B) * (1 - v / max)]);
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart">
      {ticks.map((t) => { const y = T + (H - T - B) * (1 - t / max); return <g key={t}><line x1={L} x2={W - 10} y1={y} y2={y} stroke="#e3e8ef" /><text x={L - 6} y={y + 4} textAnchor="end">{t}</text></g>; })}
      <path d={`M${xy.map((p) => p.join(',')).join(' L')} L${xy[xy.length - 1][0]},${H - B} L${L},${H - B} Z`} fill="rgba(242,106,27,.12)" />
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="#f26a1b" strokeWidth="2.5" strokeLinejoin="round" />
      {xy.map(([x, y], i) => <g key={points[i][0]}><circle cx={x} cy={y} r="3.5" fill="#f26a1b" /><text x={x} y={H - 6} textAnchor="middle">{MONTH(points[i][0])}</text></g>)}
    </svg>
  );
}

function Donut({ parts, label }) {
  const total = parts.reduce((n, [, v]) => n + v, 0);
  let acc = 0;
  const R = 15.915;
  return (
    <div className="a-donut">
      <svg viewBox="0 0 42 42" role="img" aria-label={label}>
        <circle cx="21" cy="21" r={R} fill="none" stroke="#eef1f5" strokeWidth="6" />
        {total > 0 && parts.map(([k, v], i) => {
          const seg = (v / total) * 100;
          const el = <circle key={k} cx="21" cy="21" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="6" strokeDasharray={`${seg} ${100 - seg}`} strokeDashoffset={25 - acc} />;
          acc += seg;
          return el;
        })}
        <text x="21" y="21" textAnchor="middle" style={{ font: '600 7px var(--serif)', fill: 'var(--navy)' }}>{total}</text>
        <text x="21" y="27" textAnchor="middle" style={{ font: '3px var(--sans)', fill: 'var(--muted)' }}>{label}</text>
      </svg>
      <ul className="a-legend">{parts.map(([k, v], i) => <li key={k}><i style={{ background: COLORS[i % COLORS.length] }} />{k}<b>{v}</b></li>)}</ul>
    </div>
  );
}

const statusParts = (counts, order) => order.map((s) => [statusLabel(s), counts[s] || 0]);
const rangeText = (d) => `${fmt.date(d.from)} – ${fmt.date(d.to)}`;

function ReportHead({ title, sub, crumb, picker, onExport }) {
  return (
    <Page crumbs={[['Reports', 'reports'], [crumb]]} title={title} sub={sub}
      actions={<>{picker}{onExport && <button className="btn btn-outline" type="button" onClick={onExport}><Icon name="download" /> Export Report</button>}</>} />
  );
}

// ---------- Overview ----------

function Overview({ d, picker }) {
  const q = `?from=${d.from}&to=${d.to}`;
  return (
    <>
      <ReportHead title="Reports & Analytics" sub="Monitor HEH performance and organisational activities." crumb="Overview" picker={picker} />
      <div className="a-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <StatCard icon="users" tone="orange" title="Total Members" value={d.active_members} sub="Active HEH members" />
        <StatCard icon="file" tone="blue" title="New Applications" value={d.applications} sub={rangeText(d)} />
        <StatCard icon="calendar" tone="purple" title="Events Conducted" value={d.events_conducted} sub={rangeText(d)} />
        <StatCard icon="user-check" tone="green" title="Event Registrations" value={d.registrations} sub={rangeText(d)} />
      </div>
      <div className="a-cols even">
        <Panel icon="chart" title="Membership Growth" sub="New members over the selected period.">
          <LineChart points={d.months.map((m) => [m.month, m.members])} empty="Membership data will appear here." />
          <div className="a-foot" style={{ justifyContent: 'center' }}><a className="btn btn-outline btn-sm" href={`#reports/membership${q}`}>View Membership Report <Icon name="arrow-right" /></a></div>
        </Panel>
        <Panel icon="calendar" title="Event Participation" sub="Registrations over the selected period.">
          <LineChart points={d.months.map((m) => [m.month, m.registrations])} empty="Event participation data will appear here." />
          <div className="a-foot" style={{ justifyContent: 'center' }}><a className="btn btn-outline btn-sm" href={`#reports/events${q}`}>View Event Report <Icon name="arrow-right" /></a></div>
        </Panel>
      </div>
      <Panel className="a-gap" icon="file" title="Detailed Reports">
        <div className="a-report-links">
          {[['users', 'Membership Report', 'Membership and application analysis.', `reports/membership${q}`],
            ['calendar', 'Events Report', 'Registrations and attendance analysis.', `reports/events${q}`],
            ['chat', 'Enquiries Report', 'Enquiry status and resolution analysis.', `reports/enquiries${q}`],
            ['download', 'Export & Download History', 'Generate reports and access previous downloads.', 'reports/exports']].map(([icon, t, s, h]) => (
            <a key={t} className="a-card a-report-link" href={`#${h}`}><span className="a-ic sm orange"><Icon name={icon} /></span><b>{t}</b><span>{s}</span><em>View Report →</em></a>
          ))}
        </div>
      </Panel>
    </>
  );
}

// ---------- Membership ----------

function Membership({ d, picker }) {
  const { call, toast } = useAdmin();
  const exp = () => runExport(call, toast, 'applications', 'xlsx', d.from, d.to);
  return (
    <>
      <ReportHead title="Membership & Applications Report" sub="Track membership growth and application performance." crumb="Membership & Applications" picker={picker} onExport={exp} />
      <div className="a-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <StatCard icon="users" tone="orange" title="Active Members" value={d.active_members} />
        <StatCard icon="user" tone="blue" title="New Members" value={d.new_members} />
        <StatCard icon="file" tone="purple" title="Applications Received" value={d.applications} />
        <StatCard icon="check-circle" tone="green" title="Applications Approved" value={d.applications_approved} />
      </div>
      <div className="a-cols even">
        <Panel icon="chart" title="Membership Growth" sub="New memberships over the selected period."><LineChart points={d.months.map((m) => [m.month, m.members])} empty="Membership data will appear here." /></Panel>
        <Panel icon="file" title="Application Status" sub="Distribution of membership applications.">
          <Donut label="Applications" parts={statusParts(d.application_status, ['received', 'under_review', 'interaction', 'approved', 'rejected'])} />
        </Panel>
      </div>
      <div className="a-gap">
        <DataTable title="Recent Applications" noun="applications" rows={d.recent_applications} empty="No applications in this period."
          columns={[
            { key: 'ref', label: 'Application ID', render: (r) => <a className="ref" href={`#applications?open=${r.id}`}>{r.ref}</a> },
            { key: 'name', label: 'Applicant', render: (r) => r.full_name },
            { key: 'co', label: 'Company', render: (r) => r.company_name },
            { key: 'on', label: 'Submitted On', render: (r) => fmt.stamp(r.created_at) },
            { key: 'st', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]} />
      </div>
    </>
  );
}

// ---------- Events ----------

function Events({ d, picker }) {
  const { call, toast } = useAdmin();
  const exp = () => runExport(call, toast, 'registrations', 'xlsx', d.from, d.to);
  const notAttended = Math.max(0, d.expected - d.attended);
  return (
    <>
      <ReportHead title="Events & Registrations Report" sub="Performance and participation insights for HEH events." crumb="Events & Registrations Report" picker={picker} onExport={exp} />
      <div className="a-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <StatCard icon="calendar" tone="orange" title="Events Conducted" value={d.events_conducted} />
        <StatCard icon="users" tone="blue" title="Total Registrations" value={d.registrations} />
        <StatCard icon="check-circle" tone="green" title="Total Attendance" value={d.attended} />
        <StatCard icon="chart" tone="purple" title="Attendance Rate" value={pct(d.attended, d.expected)} />
      </div>
      <div className="a-cols even">
        <Panel icon="chart" title="Registration Trends" sub="Event registrations over time."><LineChart points={d.months.map((m) => [m.month, m.registrations])} empty="Registration data will appear here." /></Panel>
        <Panel icon="user-check" title="Attendance Overview" sub="Past events in the selected period.">
          <Donut label="Registrations" parts={[['Attended', d.attended], ['Not Attended', notAttended]]} />
        </Panel>
      </div>
      <div className="a-gap">
        <DataTable title="Event Performance" noun="events" rows={d.events} empty="No events in this period."
          columns={[
            { key: 't', label: 'Event Name', sort: (e) => e.title, render: (e) => <a href={`#registrations?event_id=${e.id}`}><b>{e.title}</b></a> },
            { key: 'c', label: 'Type', render: (e) => <TypePill type={e.category} /> },
            { key: 'd', label: 'Event Date', sort: (e) => e.event_date, render: (e) => fmt.date(e.event_date) },
            { key: 'r', label: 'Registrations', className: 'num', sort: (e) => e.registrations, render: (e) => `${e.registrations}${e.capacity ? ` / ${e.capacity}` : ''}` },
            { key: 'a', label: 'Attendance', className: 'num', sort: (e) => e.attended, render: (e) => e.attended },
            { key: 'p', label: 'Attendance Rate', className: 'num', render: (e) => (e.event_date < d.today ? pct(e.attended, e.registrations) : '—') },
            { key: 's', label: 'Status', render: (e) => <StatusPill status={!e.published ? 'draft' : e.event_date < d.today ? 'completed' : 'upcoming'} /> },
          ]} />
      </div>
    </>
  );
}

// ---------- Enquiries ----------

function EnquiriesReport({ d, picker }) {
  const { call, toast } = useAdmin();
  const exp = () => runExport(call, toast, 'enquiries', 'xlsx', d.from, d.to);
  return (
    <>
      <ReportHead title="Enquiries Performance Report" sub="Monitor enquiry activity and resolution performance." crumb="Enquiries Performance" picker={picker} onExport={exp} />
      <div className="a-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <StatCard icon="mail" tone="orange" title="Enquiries Received" value={d.enquiries} />
        <StatCard icon="clock" tone="blue" title="Open Enquiries" value={d.enquiries_open} />
        <StatCard icon="check-circle" tone="green" title="Resolved Enquiries" value={d.enquiries_resolved} />
        <StatCard icon="chart" tone="purple" title="Resolution Rate" value={pct(d.enquiries_resolved, d.enquiries)} />
      </div>
      <div className="a-cols even">
        <Panel icon="chart" title="Enquiry Trends" sub="Enquiries received over the selected period."><LineChart points={d.months.map((m) => [m.month, m.enquiries])} empty="Enquiry data will appear here." /></Panel>
        <Panel icon="chat" title="Enquiry Status" sub="Current distribution of enquiry statuses.">
          <Donut label="Enquiries" parts={statusParts(d.enquiry_status, ['received', 'in_progress', 'closed'])} />
        </Panel>
      </div>
      <div className="a-gap">
        <DataTable title="Enquiry Performance" noun="enquiry types" rows={d.enquiry_types.map((t) => ({ ...t, id: t.enquiry_type }))} empty="No enquiry records available."
          columns={[
            { key: 't', label: 'Enquiry Type', render: (t) => <a href="#enquiries"><b>{t.enquiry_type}</b></a> },
            { key: 'r', label: 'Received', className: 'num', render: (t) => t.received },
            { key: 's', label: 'Resolved', className: 'num', render: (t) => t.resolved },
            { key: 'o', label: 'Open', className: 'num', render: (t) => t.open },
            { key: 'p', label: 'Resolution Rate', className: 'num', render: (t) => pct(t.resolved, t.received) },
          ]} />
      </div>
    </>
  );
}

// ---------- Export & download history ----------

// Columns and rows for each report type, filtered to the date range.
const REPORTS = {
  registrations: { path: '/registrations', date: (r) => r.created_at, columns: () => [...REG_COLUMNS.participant, ...REG_COLUMNS.event, ...REG_COLUMNS.status] },
  members: { path: '/members', date: (r) => r.created_at, columns: () => [['Membership ID', (m) => m.member_code], ['Name', (m) => m.full_name], ['Designation', (m) => m.designation],
    ['Company', (m) => m.company], ['Industry', (m) => m.industry], ['Status', (m) => statusLabel(m.status)], ['Joined On', (m) => fmt.date(String(m.created_at).slice(0, 10))]] },
  applications: { path: '/applications', date: (r) => r.created_at, columns: () => [['Application ID', (a) => a.ref], ['Applicant', (a) => a.full_name], ['Mobile', (a) => a.mobile], ['Email', (a) => a.email],
    ['Company', (a) => a.company_name], ['Business Category', (a) => a.business_category], ['Turnover', (a) => a.turnover_range], ['Status', (a) => statusLabel(a.status)], ['Applied On', (a) => fmt.stamp(a.created_at)]] },
  events: { path: '/events', date: (e) => e.event_date, columns: () => [['Event', (e) => e.title], ['Type', (e) => (e.category === 'workshop' ? 'Workshop' : 'Spotlight')], ['Date', (e) => fmt.date(e.event_date)],
    ['Time', (e) => fmt.timeRange(e.start_time, e.end_time)], ['Venue', (e) => e.venue_name], ['Capacity', (e) => e.capacity || ''], ['Registrations', (e) => e.registrations], ['Published', (e) => (e.published ? 'Yes' : 'No')]] },
  enquiries: { path: '/enquiries', date: (r) => r.created_at, columns: () => [['Enquiry ID', (q) => q.ref], ['Name', (q) => q.full_name], ['Mobile', (q) => q.mobile], ['Email', (q) => q.email], ['Company', (q) => q.company],
    ['Type', (q) => q.enquiry_type], ['Message', (q) => q.message], ['Status', (q) => statusLabel(q.status)], ['Assigned To', (q) => q.assigned_name], ['Received On', (q) => fmt.stamp(q.created_at)]] },
};

const inRange = (v, from, to) => {
  if (!from && !to) return true;
  if (!v) return false;
  const d = String(v).length > 10 ? isoIndia(new Date(v)) : String(v).slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};

async function runExport(call, toast, report, format, from, to, meta, params = {}) {
  try {
    const def = REPORTS[report];
    const { items } = await call(def.path);
    const rows = items.filter((r) => inRange(def.date(r), from, to)
      && (!params.event || String(r.event_id) === String(params.event)) && (!params.status || r.status === params.status));
    if (!rows.length) { toast('No records in this period.', true); return; }
    const label = (meta?.reportTypes || []).find(([k]) => k === report)?.[1] || report[0].toUpperCase() + report.slice(1);
    const name = `${label} – ${from ? fmt.date(from) : 'all'} to ${to ? fmt.date(to) : 'today'}`;
    exportAs(format, def.columns(), rows, { name: report, title: name });
    await call('/reports/exports', { method: 'POST', body: { report, name, format, row_count: rows.length, params: { from, to } } });
    toast('Report generated');
  } catch (err) { toast(err.message, true); }
}

function Exports() {
  const { call, toast, meta, reload } = useAdmin();
  const state = useLoad(() => call('/reports/exports'));
  const [range, setRange] = useState('month');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  async function generate(e) {
    e.preventDefault();
    const f = e.currentTarget.elements;
    const r = range === 'all' ? ['', ''] : presetRange(range) || [f.from.value, f.to.value];
    setBusy(true);
    await runExport(call, toast, f.report.value, f.format.value, r[0], r[1], meta);
    setBusy(false);
    reload();
  }
  return (
    <Page crumbs={[['Reports', 'reports'], ['Export & Download History']]} title="Report Export & Download History"
      sub="Generate reports and access previous downloads." back={['Back to Reports', 'reports']}>
      <div className="a-cols">
        <Panel icon="download" title="Generate Report" sub="Select the report and preferred export options.">
          <form className="a-form" onSubmit={generate}>
            <div className="form-grid three">
              <F label="Report Type" htmlFor="report"><select className="input" id="report" name="report"><Options list={meta.reportTypes || []} /></select></F>
              <F label="Date Range" htmlFor="range">
                <select className="input" id="range" value={range} onChange={(e) => setRange(e.target.value)}><Options list={[...PRESETS, ['all', 'All Time']]} /></select>
              </F>
              <F label="Export Format" htmlFor="format"><select className="input" id="format" name="format"><Options list={[['xlsx', 'Excel (.xlsx)'], ['csv', 'CSV (.csv)'], ['pdf', 'PDF (.pdf)']]} /></select></F>
              {range === 'custom' && <>
                <F label="From" htmlFor="from"><input className="input" type="date" id="from" name="from" /></F>
                <F label="To" htmlFor="to"><input className="input" type="date" id="to" name="to" /></F>
              </>}
            </div>
            <div className="a-foot"><button className="btn btn-primary" type="submit" disabled={busy}><Icon name="download" /> Generate Report</button></div>
          </form>
        </Panel>
        <Panel icon="info" title="Export Information">
          <KV rows={[['Available Formats', 'PDF, Excel, CSV'], ['Reporting Period', 'Based on the selected dates'], ['Access', 'Authorised administrators only']]} />
          <p className="a-muted-sm" style={{ marginTop: 12 }}><Icon name="info" /> Generated reports reflect the records available for the selected period.</p>
        </Panel>
      </div>
      <ViewState state={state}>
        {({ items }) => (
          <div className="a-gap">
            <Panel icon="file" title="Download History" sub="Previously generated reports."
              aside={<label className="a-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exported reports…" /></label>}>
              <History items={items.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()))} />
            </Panel>
          </div>
        )}
      </ViewState>
    </Page>
  );
}

function History({ items }) {
  const { call, toast, meta } = useAdmin();
  const rows = items;
  if (!rows.length) return <Empty icon="file" title="No Reports Generated Yet">Your generated reports will appear here.</Empty>;
  return (
    <DataTable noun="reports" rows={rows} columns={[
      { key: 'n', label: 'Report Name', sort: (x) => x.name, render: (x) => <b>{x.name}</b> },
      { key: 'g', label: 'Generated On', sort: (x) => x.created_at, render: (x) => <span className="nowrap">{fmt.stamp(x.created_at)}</span> },
      { key: 'f', label: 'Format', render: (x) => x.format.toUpperCase() },
      { key: 'c', label: 'Records', className: 'num', render: (x) => x.row_count },
      { key: 'b', label: 'Generated By', render: (x) => x.admin_name },
      { key: 'a', label: 'Action', className: 'act', render: (x) => (
        <button className="a-row-btn" type="button" onClick={() => runExport(call, toast, x.report, x.format, x.params.from, x.params.to, meta, x.params)}>Download <Icon name="download" /></button>
      ) },
    ]} />
  );
}
