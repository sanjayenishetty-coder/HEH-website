// Membership applications, enquiries and event registrations (designs: Part1 list screens):
// summary cards, filters, sortable/paged table, CSV export, and a detail view to change status and notes.
// Hash options: ?status=<status> (or "open" = still needs action), ?q=<search>, ?event_id=<id>, ?open=<row id>.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import {
  Avatar, DATE_RANGES, DataTable, FilterBar, PageHead, RowButton, StatCard, StatusPill, matches, statusLabel, withinDays,
} from './ui.jsx';

const day = (ts) => fmt.stamp(ts).slice(0, 11);
const Who = ({ name, sub }) => <span className="a-who"><Avatar name={name} size={32} /><span>{name}{sub && <small>{sub}</small>}</span></span>;

const SUB = {
  applications: {
    title: 'Membership Applications',
    table: 'Membership Applications',
    sub: 'Review and manage new membership requests.',
    single: 'Application',
    noun: 'applications',
    open: ['received', 'under_review', 'interaction'],
    stats: (rows) => [
      ['file', 'blue', 'New Applications', rows.filter((r) => r.status === 'received').length, 'Awaiting initial review', 'received'],
      ['user', 'orange', 'Under Review', rows.filter((r) => ['under_review', 'interaction'].includes(r.status)).length, 'Being evaluated by committee', 'under_review'],
      ['check-circle', 'green', 'Approved Applications', rows.filter((r) => r.status === 'approved').length, 'Members approved', 'approved'],
    ],
    search: 'Search by applicant name or company…',
    text: (r) => [r.ref, r.full_name, r.company_name, r.email, r.mobile],
    category: { label: 'All Categories', get: (r) => r.business_category },
    dateLabel: 'Application Date',
    columns: [
      { key: 'ref', label: 'Application ID', sort: (r) => r.ref, render: (r) => <b className="ref">{r.ref}</b> },
      { key: 'name', label: 'Applicant', sort: (r) => r.full_name, render: (r) => <Who name={r.full_name} sub={r.email} /> },
      { key: 'company', label: 'Company', sort: (r) => r.company_name, render: (r) => r.company_name },
      { key: 'cat', label: 'Business Category', sort: (r) => r.business_category, render: (r) => r.business_category },
      { key: 'date', label: 'Applied On', sort: (r) => r.created_at, render: (r) => <span className="nowrap">{day(r.created_at)}</span> },
    ],
    detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Designation', r.designation], ['LinkedIn', r.linkedin],
      ['Company', r.company_name], ['Business category', r.business_category], ['Year established', r.year_established], ['Business location', r.business_location],
      ['Website', r.website], ['Annual turnover', r.turnover_range], ['Business description', r.business_description], ['Submitted', fmt.stamp(r.created_at)]],
    notes: true,
  },
  enquiries: {
    title: 'Enquiry Management',
    table: 'Enquiries',
    sub: 'Track and manage HEH community enquiries.',
    single: 'Enquiry',
    noun: 'enquiries',
    open: ['received', 'in_progress'],
    stats: (rows) => [
      ['chat', 'blue', 'New Enquiries', rows.filter((r) => r.status === 'received').length, 'Awaiting a response', 'received'],
      ['clock', 'orange', 'In Progress', rows.filter((r) => r.status === 'in_progress').length, 'Currently being handled', 'in_progress'],
      ['check-circle', 'green', 'Resolved', rows.filter((r) => r.status === 'closed').length, 'Successfully closed', 'closed'],
    ],
    search: 'Search by name, company or message…',
    text: (r) => [r.ref, r.full_name, r.company, r.email, r.mobile, r.message, r.member_name, r.assigned_name],
    category: { label: 'All Enquiry Types', get: (r) => r.enquiry_type },
    dateLabel: 'Received Date',
    columns: [
      { key: 'ref', label: 'Enquiry ID', sort: (r) => r.ref, render: (r) => <b className="ref">{r.ref}</b> },
      { key: 'name', label: 'Name', sort: (r) => r.full_name, render: (r) => <Who name={r.full_name} sub={r.mobile} /> },
      { key: 'company', label: 'Company', sort: (r) => r.company, render: (r) => r.company || '—' },
      { key: 'type', label: 'Enquiry Type', sort: (r) => r.enquiry_type, render: (r) => <>{r.enquiry_type}{r.member_name && <small className="sub">For {r.member_name}</small>}</> },
      { key: 'date', label: 'Received On', sort: (r) => r.created_at, render: (r) => <span className="nowrap">{day(r.created_at)}</span> },
      { key: 'who', label: 'Assigned To', sort: (r) => r.assigned_name, render: (r) => r.assigned_name || <span className="sub">Unassigned</span> },
    ],
    detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Company', r.company], ['Enquiry type', r.enquiry_type],
      ['For member', r.member_name], ['Message', r.message], ['Submitted', fmt.stamp(r.created_at)]],
    notes: true,
  },
  registrations: {
    title: 'Event Registrations',
    table: 'Registered Participants',
    sub: 'Manage event participants, registrations and attendance.',
    single: 'Registration',
    noun: 'registrations',
    open: ['pending'],
    stats: (rows) => [
      ['users', 'blue', 'Total Registrations', rows.filter((r) => !['cancelled', 'rejected'].includes(r.status)).length, 'All active registrations', ''],
      ['clock', 'orange', 'Pending Approval', rows.filter((r) => r.status === 'pending').length, 'Waiting for an administrator', 'pending'],
      ['check-circle', 'green', 'Confirmed Registrations', rows.filter((r) => ['confirmed', 'attended'].includes(r.status)).length, 'Confirmed and attended', 'confirmed'],
    ],
    search: 'Search participant name or company…',
    text: (r) => [r.ref, r.full_name, r.company, r.email, r.mobile, r.membership_id],
    dateLabel: 'Registration Date',
    columns: [
      { key: 'ref', label: 'Registration ID', sort: (r) => r.ref, render: (r) => <b className="ref">{r.ref}</b> },
      { key: 'name', label: 'Participant', sort: (r) => r.full_name, render: (r) => <Who name={r.full_name} sub={r.mobile} /> },
      { key: 'company', label: 'Company', sort: (r) => r.company, render: (r) => r.company },
      { key: 'mid', label: 'Membership ID', sort: (r) => r.membership_id, render: (r) => r.membership_id },
      { key: 'event', label: 'Event', sort: (r) => r.event_date, render: (r) => <>{r.event_title}<small className="sub">{fmt.date(r.event_date)}</small></> },
      { key: 'date', label: 'Registered On', sort: (r) => r.created_at, render: (r) => <span className="nowrap">{day(r.created_at)}</span> },
    ],
    detail: (r) => [['Registration ID', r.ref], ['Participant', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Company', r.company], ['Membership ID', r.membership_id],
      ['Event', `${r.event_title} (${fmt.date(r.event_date)})`], ['Registered', fmt.stamp(r.created_at)]],
    notes: false,
  },
};

function exportCsv(name, rows) {
  const keys = Object.keys(rows[0] || {}).filter((k) => !['id', 'token'].includes(k));
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' }));
  a.download = `heh-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function Detail({ name, def, row, statuses, onSaved }) {
  const { call, toast, closeModal } = useAdmin();
  const notes = useRef();
  const status = useRef();
  const [busy, setBusy] = useState(false);
  async function save() {
    const body = { status: status.current.value };
    if (def.notes) body.admin_notes = notes.current.value;
    setBusy(true);
    try {
      await call(`/${name}/${row.id}`, { method: 'PATCH', body });
      onSaved(body);
      toast(`${def.single} updated`);
      closeModal();
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <div className="editor detail">
      <div className="detail-head">
        <div><span className="eyebrow-sm">{def.single}</span><h2>{row.full_name}</h2><span className="muted">{row.ref}</span></div>
        <StatusPill status={row.status} />
      </div>
      <dl>
        {def.detail(row).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [<dt key={`t${k}`}>{k}</dt>, <dd key={`d${k}`}>{v}</dd>])}
      </dl>
      <div className="form-grid" style={{ marginTop: 20 }}>
        <div className="field">
          <label htmlFor="d_status">Status</label>
          <select className="input" id="d_status" ref={status} defaultValue={row.status}>
            {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        {def.notes && (
          <div className="field full">
            <label htmlFor="notes">Internal notes (not visible to the {name === 'enquiries' ? 'sender' : 'applicant'})</label>
            <textarea className="input" id="notes" ref={notes} defaultValue={row.admin_notes || ''} />
          </div>
        )}
      </div>
      <div className="actions">
        <button className="btn btn-outline btn-sm" type="button" onClick={closeModal}>Close</button>
        <button className="btn btn-primary btn-sm" type="button" onClick={save} disabled={busy}>Save Changes</button>
      </div>
    </div>
  );
}

export default function Submissions({ name, query }) {
  const { call } = useAdmin();
  const state = useLoad(async () => {
    const [data, events] = await Promise.all([
      call(`/${name}`),
      name === 'registrations' ? call('/events') : Promise.resolve(null),
    ]);
    return { data, events };
  });
  return (
    <ViewState state={state}>
      {({ data, events }) => <List name={name} query={query} data={data} events={events} />}
    </ViewState>
  );
}

function List({ name, query, data, events }) {
  const { openModal, go } = useAdmin();
  const def = SUB[name];
  const [rows, setRows] = useState(data.items);
  const [filter, setFilter] = useState(() => ({
    q: query.get('q') || '', status: query.get('status') || '', cat: '', days: '', event: query.get('event_id') || '',
  }));

  const page = ['registrations', 'enquiries'].includes(name); // full-page details (Part2 designs)
  const show = (r) => (page ? go(`${name}/${r.id}`) : openModal(
    <Detail key={r.id} name={name} def={def} row={r} statuses={data.statuses}
      onSaved={(changes) => setRows((list) => list.map((x) => (x.id === r.id ? { ...x, ...changes } : x)))} />,
  ));
  // #applications?open=12 (from the dashboard) opens that row.
  useEffect(() => {
    const id = Number(query.get('open'));
    const r = id && rows.find((x) => x.id === id);
    if (r) show(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => rows.filter((r) => (
    matches(filter.q, ...def.text(r))
    && (!filter.status || (filter.status === 'open' ? def.open.includes(r.status) : r.status === filter.status))
    && (!filter.cat || def.category?.get(r) === filter.cat)
    && (!filter.event || String(r.event_id) === String(filter.event))
    && withinDays(r.created_at, filter.days)
  )), [rows, filter, def]);

  const cats = def.category ? [...new Set(rows.map(def.category.get).filter(Boolean))].sort() : [];
  const fields = [
    { name: 'q', type: 'search', placeholder: def.search },
    ...(events ? [{ name: 'event', all: 'All Events', options: events.items.map((e) => [String(e.id), `${e.title} – ${fmt.date(e.event_date)}`]) }] : []),
    { name: 'status', all: 'All Status', options: [['open', name === 'registrations' ? 'Pending approval' : 'Needs action'], ...data.statuses.map((s) => [s, statusLabel(s)])].filter(([v], i, a) => a.findIndex(([w]) => w === v) === i) },
    ...(def.category ? [{ name: 'cat', all: def.category.label, options: cats.map((c) => [c, c]) }] : []),
    { name: 'days', all: def.dateLabel, icon: 'calendar', options: DATE_RANGES },
  ];

  const columns = [
    ...def.columns,
    { key: 'status', label: 'Status', sort: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
    { key: 'act', label: 'Action', className: 'act', render: (r) => <RowButton onClick={() => show(r)}>{page ? 'View Details' : 'View'}</RowButton> },
  ];

  return (
    <>
      <PageHead title={def.title} sub={def.sub}>
        {name === 'registrations' && <>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => go('registrations?status=pending')}><Icon name="clock" /> Pending Approvals</button>
          <a className="btn btn-outline btn-sm" href="#registrations/activity">Activity History</a>
          <a className="btn btn-primary" href="#registrations/export"><Icon name="download" /> Export Registrations</a>
        </>}
        {name !== 'registrations' && (
          <button className="btn btn-primary" type="button" onClick={() => exportCsv(name, shown)} disabled={!shown.length}>
            <Icon name="download" /> Export {def.noun[0].toUpperCase() + def.noun.slice(1)}
          </button>
        )}
      </PageHead>
      <div className="a-stats">
        {def.stats(rows).map(([icon, tone, title, n, sub, status]) => (
          <StatCard key={title} icon={icon} tone={tone} title={title} value={n} sub={sub}
            onClick={() => go(`${name}${status ? `?status=${status}` : ''}`)} />
        ))}
      </div>
      <FilterBar fields={fields} value={filter} onApply={setFilter} />
      <DataTable title={def.table} columns={columns} rows={shown} noun={def.noun} onRow={show}
        empty={rows.length ? 'Nothing matches these filters.' : `No ${def.noun} yet.`} />
    </>
  );
}
