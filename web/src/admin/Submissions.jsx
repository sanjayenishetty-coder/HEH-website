// Membership applications, enquiries and event registrations: filter, change status, view details, notes, CSV.
import { useRef, useState } from 'react';
import { fmt } from '../lib/format.js';
import { label, useAdmin, useLoad, ViewState } from './Admin.jsx';

export const Pill = ({ status, text }) => <span className={`pill ${status}`}>{text ?? label(status)}</span>;
export const YesNo = ({ value }) => <Pill status={value ? 'yes' : 'no'} text={value ? 'Yes' : 'No'} />;

const Sub = ({ children }) => <div className="sub">{children}</div>;

const SUB = {
  applications: {
    title: 'Membership Applications',
    head: ['Reference', 'Applicant', 'Company', 'Category', 'Submitted', 'Status'],
    row: (r) => [<b>{r.ref}</b>, <>{r.full_name}<Sub>{r.mobile} · {r.email}</Sub></>, r.company_name, r.business_category, fmt.stamp(r.created_at)],
    detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Designation', r.designation], ['LinkedIn', r.linkedin],
      ['Company', r.company_name], ['Business category', r.business_category], ['Year established', r.year_established], ['Business location', r.business_location],
      ['Website', r.website], ['Annual turnover', r.turnover_range], ['Business description', r.business_description], ['Submitted', fmt.stamp(r.created_at)]],
    notes: true,
  },
  enquiries: {
    title: 'Enquiries',
    head: ['Reference', 'From', 'Type', 'Message', 'Submitted', 'Status'],
    row: (r) => [<b>{r.ref}</b>, <>{r.full_name}<Sub>{r.mobile} · {r.email}{r.company ? ` · ${r.company}` : ''}</Sub></>,
      <>{r.enquiry_type}{r.member_name && <Sub>For member: {r.member_name}</Sub>}</>,
      <div style={{ maxWidth: 320 }}>{r.message.slice(0, 140)}{r.message.length > 140 ? '…' : ''}</div>, fmt.stamp(r.created_at)],
    detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Company', r.company], ['Enquiry type', r.enquiry_type],
      ['For member', r.member_name], ['Message', r.message], ['Submitted', fmt.stamp(r.created_at)]],
    notes: true,
  },
  registrations: {
    title: 'Event Registrations',
    head: ['Registration ID', 'Participant', 'Membership ID', 'Event', 'Registered', 'Status'],
    row: (r) => [<b>{r.ref}</b>, <>{r.full_name}<Sub>{r.mobile}{r.email ? ` · ${r.email}` : ''} · {r.company}</Sub></>, r.membership_id,
      <>{r.event_title}<Sub>{fmt.date(r.event_date)}</Sub></>, fmt.stamp(r.created_at)],
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

function Detail({ name, def, row, onNotesSaved }) {
  const { call, toast, closeModal } = useAdmin();
  const notes = useRef();
  async function saveNotes() {
    try {
      const admin_notes = notes.current.value;
      await call(`/${name}/${row.id}`, { method: 'PATCH', body: { admin_notes } });
      onNotesSaved(admin_notes);
      toast('Notes saved');
      closeModal();
    } catch (err) { toast(err.message, true); }
  }
  return (
    <div className="editor detail">
      <h2>{def.title.replace(/s$/, '')} {row.ref}</h2>
      <dl>
        {def.detail(row).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [<dt key={`t${k}`}>{k}</dt>, <dd key={`d${k}`}>{v}</dd>])}
        <dt>Status</dt><dd><Pill status={row.status} /></dd>
      </dl>
      {def.notes && (
        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="notes">Internal notes (not visible to the applicant)</label>
          <textarea className="input" id="notes" ref={notes} defaultValue={row.admin_notes || ''} />
        </div>
      )}
      <div className="actions">
        {def.notes && <button className="btn btn-primary btn-sm" onClick={saveNotes}>Save notes</button>}
        <button className="btn btn-outline btn-sm" onClick={closeModal}>Close</button>
      </div>
    </div>
  );
}

export default function Submissions({ name, query }) {
  const { call, toast, openModal, go } = useAdmin();
  const def = SUB[name];
  const state = useLoad(async () => {
    const params = new URLSearchParams();
    if (query.get('status')) params.set('status', query.get('status'));
    if (query.get('event_id')) params.set('event_id', query.get('event_id'));
    const [data, events] = await Promise.all([
      call(`/${name}?${params}`),
      name === 'registrations' ? call('/events') : Promise.resolve(null),
    ]);
    return { data, events };
  });
  const [, force] = useState(0);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(query);
    if (value) p.set(key, value); else p.delete(key);
    go(`${name}${p.toString() ? `?${p}` : ''}`);
  };

  async function changeStatus(row, status) {
    try {
      await call(`/${name}/${row.id}`, { method: 'PATCH', body: { status } });
      row.status = status;
      force((n) => n + 1);
      toast('Status updated');
    } catch (err) { toast(err.message, true); }
  }

  return (
    <ViewState state={state}>
      {({ data, events }) => {
        const rows = data.items;
        return (
          <>
            <div className="bar">
              <h1>{def.title} <span className="muted" style={{ fontSize: 18 }}>({rows.length})</span></h1>
              <div className="filters">
                {events && (
                  <select className="input" value={query.get('event_id') || ''} onChange={(e) => setFilter('event_id', e.target.value)}>
                    <option value="">All events</option>
                    {events.items.map((e) => <option key={e.id} value={e.id}>{e.title} – {fmt.date(e.event_date)}</option>)}
                  </select>
                )}
                <select className="input" value={query.get('status') || ''} onChange={(e) => setFilter('status', e.target.value)}>
                  <option value="">All statuses</option>
                  {data.statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => exportCsv(name, rows)}>Export CSV</button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr>{def.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.length ? rows.map((r) => (
                    <tr key={r.id} className="clickable"
                      onClick={() => openModal(<Detail name={name} def={def} row={r} onNotesSaved={(n) => { r.admin_notes = n; }} />)}>
                      {def.row(r).map((c, i) => <td key={i}>{c}</td>)}
                      <td>
                        <select className="input" value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => changeStatus(r, e.target.value)}>
                          {data.statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                        </select>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={def.head.length} className="muted" style={{ textAlign: 'center', padding: 30 }}>Nothing here yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      }}
    </ViewState>
  );
}
