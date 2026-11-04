// Event registration screens (designs: images/Part2): details, approve, reject, cancel, export and activity history.
// Routes: #registrations/<id>, #registrations/<id>/approve | reject | cancel, #registrations/export, #registrations/activity
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import { exportAs } from './exporters.js';
import {
  ActivityHistory, Checklist, ConfirmRow, Counted, Empty, F, Foot, KV, Notice, Options, Page, Panel, Strip, Timeline, useAction,
} from './parts.jsx';
import { Avatar, StatusPill, TypePill, statusLabel } from './ui.jsx';

const CRUMB = ['Registrations', 'registrations'];
const day = (ts) => fmt.stamp(ts).slice(0, 11);
const today = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

export default function RegistrationPages({ path }) {
  const [first, action] = path;
  if (first === 'export') return <Export />;
  if (first === 'activity') return <AllActivity />;
  return <Load id={first} action={action} />;
}

function Load({ id, action }) {
  const { call } = useAdmin();
  const state = useLoad(() => call(`/registrations/${id}`));
  return (
    <ViewState state={state}>
      {(r) => {
        if (action === 'approve') return <Approve r={r} />;
        if (action === 'reject') return <Decline r={r} kind="reject" />;
        if (action === 'cancel') return <Decline r={r} kind="cancel" />;
        return <Details r={r} />;
      }}
    </ViewState>
  );
}

// Checks shown on the details and approve screens.
function checks(r) {
  const isMember = r.member_status === 'active';
  const past = r.event_date && String(r.event_date).slice(0, 10) < today();
  const full = r.capacity && r.confirmed_count >= r.capacity;
  return {
    membership: [isMember ? 'Active' : r.member_id ? 'Inactive' : 'Not found', isMember],
    eligibility: [past ? 'Event is over' : !r.event_published ? 'Event not published' : r.members_only && !isMember ? 'Members only' : 'Eligible',
      !past && r.event_published && (!r.members_only || isMember)],
    capacity: [r.capacity ? (full ? `Full (${r.confirmed_count}/${r.capacity})` : `${r.capacity - r.confirmed_count} of ${r.capacity} left`) : 'No limit', !full],
  };
}

const memberType = (r) => (r.member_status ? 'HEH Member' : 'Guest');

function RegStrip({ r }) {
  return (
    <Strip items={[
      ['ticket', 'Registration ID', r.ref],
      ['user', 'Participant', r.full_name],
      ['calendar', 'Event', r.event_title],
      ['clock', 'Registration Date', day(r.created_at)],
      ['info', 'Status', <StatusPill key="s" status={r.status} />],
    ]} />
  );
}

function Summary({ r }) {
  return (
    <Panel icon="user" title="Registration Summary" sub="Participant and event details.">
      <div className="a-who" style={{ alignItems: 'flex-start', gap: 16 }}>
        <Avatar name={r.full_name} size={56} />
        <KV cols={2} rows={[
          ['Participant Name', r.full_name], ['Event Name', r.event_title],
          ['Company', r.company], ['Event Date', fmt.date(r.event_date)],
          ['Membership ID', r.membership_id], ['Event Time', fmt.timeRange(r.start_time, r.end_time)],
          ['Member Type', memberType(r)], ['Registration ID', r.ref],
        ]} />
      </div>
    </Panel>
  );
}

function Details({ r }) {
  const { call, toast, reload } = useAdmin();
  const c = checks(r);
  const [busy, setBusy] = useState(false);
  async function attended() {
    setBusy(true);
    try {
      await call(`/registrations/${r.id}/attended`, { method: 'POST' });
      toast('Marked as attended');
      reload();
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <Page crumbs={[CRUMB, ['Registration Details']]} title="Registration Details" sub="Review participant information and registration status."
      back={['Back to Registrations', 'registrations']}>
      <RegStrip r={r} />
      <div className="a-cols">
        <div>
          <Panel icon="user" title="Participant Information" sub="Contact and membership details.">
            <div className="a-who" style={{ alignItems: 'flex-start', gap: 16 }}>
              <Avatar name={r.full_name} size={56} />
              <KV cols={2} rows={[
                ['Full Name', r.full_name], ['Membership ID', r.membership_id],
                ['Company', r.company], ['Email', r.email],
                ['Member Type', memberType(r)], ['Mobile', r.mobile],
                ['Membership', r.member_status ? statusLabel(r.member_status) : 'Not an HEH member'], ['Member Name', r.member_name],
              ]} />
            </div>
          </Panel>
          <Panel icon="calendar" title="Event Information" aside={<a className="a-row-btn" href={`#events?open=${r.event_id}`}>View Event Details <Icon name="arrow-right" /></a>}>
            <KV cols={2} rows={[
              ['Event Name', r.event_title], ['Event Time', fmt.timeRange(r.start_time, r.end_time)],
              ['Event Type', <TypePill key="t" type={r.event_category} />], ['Venue', r.venue_name],
              ['Event Date', fmt.date(r.event_date)], ['Approval', r.approval_mode === 'manual' ? 'Manual approval' : 'Automatic'],
            ]} />
          </Panel>
          <Panel icon="file" title="Registration Information">
            <KV cols={2} rows={[
              ['Registration ID', r.ref], ['Current Status', <StatusPill key="s" status={r.status} />],
              ['Registration Date', fmt.stamp(r.created_at)], ['Registration Source', 'HEH Website'],
              ['Last Updated', fmt.stamp(r.updated_at)], ['Reason', r.status_reason],
            ]} />
            {r.admin_notes && <p className="a-muted-sm" style={{ marginTop: 12 }}><b>Notes:</b> {r.admin_notes}</p>}
          </Panel>
        </div>
        <div>
          <Panel icon="check-circle" tone="green" title="Registration Review" sub="Verify eligibility before taking action.">
            <KV rows={[
              ['Registration Status', <StatusPill key="s" status={r.status} />],
              ['Membership', c.membership[0]],
              ['Event Eligibility', c.eligibility[0]],
              ['Capacity Available', c.capacity[0]],
              ['Approval Required', r.approval_mode === 'manual' ? 'Yes' : 'No'],
            ]} />
            <div className="a-foot" style={{ justifyContent: 'flex-start' }}>
              {r.status === 'pending' && <>
                <a className="btn btn-primary btn-sm" href={`#registrations/${r.id}/approve`}>Approve Registration</a>
                <a className="btn btn-sm danger-line" href={`#registrations/${r.id}/reject`}>Reject Registration</a>
              </>}
              {r.status === 'confirmed' && <button className="btn btn-primary btn-sm" type="button" onClick={attended} disabled={busy}><Icon name="user-check" /> Mark as Attended</button>}
              {['pending', 'confirmed'].includes(r.status) && <a className="btn btn-sm danger-line" href={`#registrations/${r.id}/cancel`}>Cancel Registration</a>}
              {['rejected', 'cancelled', 'attended'].includes(r.status) && <p className="a-muted-sm">No further action is needed for this registration.</p>}
            </div>
          </Panel>
          <Panel icon="clock" title="Recent Activity" aside={<a className="a-row-btn" href="#registrations/activity">View Full History <Icon name="arrow-right" /></a>}>
            <Timeline items={[...r.activity, { id: 'c', action: 'Registration Submitted', details: 'Registered through the HEH website', created_at: r.created_at }]} />
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function Approve({ r }) {
  const { go } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  const c = checks(r);
  if (r.status !== 'pending') return <NotAllowed r={r} what="approved" />;
  return (
    <Page crumbs={[CRUMB, ['Registration Details', `registrations/${r.id}`], ['Approve Registration']]} title="Approve Registration"
      sub="Verify participant eligibility and confirm event registration." back={['Back to Registration Details', `registrations/${r.id}`]}>
      <RegStrip r={r} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/registrations/${r.id}/approve`, {
        confirm: 'confirm', success: 'Registration approved', done: () => go(`registrations/${r.id}`),
      })}>
        <div className="a-cols">
          <div>
            <Summary r={r} />
            <Panel icon="shield" tone="green" title="Eligibility Verification" sub="Checked automatically from the member directory and event settings.">
              <Checklist items={[
                ['Membership Status', c.membership[1], c.membership[0]],
                ['Event Eligibility', c.eligibility[1], c.eligibility[0]],
                ['Event Capacity', c.capacity[1], c.capacity[0]],
              ]} />
            </Panel>
            <Panel icon="edit" title="Approval Remarks">
              <F label="Internal Remarks (optional)" htmlFor="remarks"><Counted name="remarks" placeholder="Add remarks about this approval…" /></F>
            </Panel>
          </div>
          <div>
            <Panel icon="file" title="Approval Overview">
              <KV rows={[
                ['Registration Status', <StatusPill key="s" status="pending" />],
                ['New Status (After Approval)', <StatusPill key="n" status="confirmed" />],
                ['Membership', c.membership[0]], ['Event Eligibility', c.eligibility[0]], ['Capacity Available', c.capacity[0]],
              ]} />
            </Panel>
            <Notice title="After Approval" items={[
              'The registration status will change to Confirmed.',
              'The participant will be included in the event’s confirmed registration count.',
              r.email ? 'A confirmation email will be sent to the participant (if email is set up).' : 'No email address was given, so no confirmation email will be sent.',
            ]} />
          </div>
        </div>
        <ConfirmRow text="I have reviewed the registration and confirm the participant’s eligibility." error={errors.confirm} />
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#registrations/${r.id}`}>Back to Details</a>
          <button className="btn btn-primary" type="submit" disabled={busy}>Approve Registration</button>
        </Foot>
      </form>
    </Page>
  );
}

const DECLINE = {
  reject: {
    title: 'Reject Registration', sub: 'Review the registration and provide a reason for rejection.', reasons: 'registrationRejectReasons',
    status: 'rejected', button: 'Reject Registration', success: 'Registration rejected', confirm: 'I have reviewed this registration and confirm the rejection decision.',
    after: ['The registration will be marked as Rejected.', 'The participant will be notified with the rejection message below (if selected).', 'The registration and rejection history will be kept for future reference.'],
    message: (r) => `Dear ${r.full_name},\n\nThank you for your interest in ${r.event_title}. We regret to inform you that your registration ${r.ref} could not be confirmed.\n\nRegards,\nHEH Events Team`,
  },
  cancel: {
    title: 'Cancel Registration', sub: 'Review and confirm registration cancellation.', reasons: 'registrationCancelReasons',
    status: 'cancelled', button: 'Cancel Registration', success: 'Registration cancelled', confirm: 'I have reviewed this registration and confirm the cancellation.',
    after: ['The registration status will change to Cancelled.', 'A confirmed registration no longer counts towards the event capacity, so the seat becomes available.', 'The original registration and cancellation record will be kept in the history.'],
    message: (r) => `Dear ${r.full_name},\n\nThis is to confirm that your registration ${r.ref} for ${r.event_title}${r.event_date ? ` on ${fmt.date(r.event_date)}` : ''} has been cancelled.\n\nRegards,\nHEH Events Team`,
  },
};

function Decline({ r, kind }) {
  const { go, meta } = useAdmin();
  const d = DECLINE[kind];
  const { errors, formError, busy, run } = useAction();
  const [notify, setNotify] = useState(Boolean(r.email));
  const allowed = kind === 'reject' ? ['pending'] : ['pending', 'confirmed'];
  if (!allowed.includes(r.status)) return <NotAllowed r={r} what={d.status} />;
  return (
    <Page crumbs={[CRUMB, ['Registration Details', `registrations/${r.id}`], [d.title]]} title={d.title} sub={d.sub}
      back={['Back to Registration Details', `registrations/${r.id}`]}>
      <RegStrip r={r} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/registrations/${r.id}/${kind}`, {
        confirm: 'confirm', success: d.success, done: () => go(`registrations/${r.id}`),
      })}>
        <div className="a-cols">
          <div>
            <Summary r={r} />
            <Panel icon="x" tone="red" title={kind === 'reject' ? 'Rejection Details' : 'Cancellation Details'}>
              <div className="form-grid">
                <F label={kind === 'reject' ? 'Rejection Reason' : 'Cancellation Reason'} req htmlFor="reason" error={errors.reason}>
                  <select className="input" id="reason" name="reason" defaultValue=""><Options list={meta[d.reasons] || []} placeholder="Select reason" /></select>
                </F>
                <F label="Internal Remarks" htmlFor="remarks"><Counted name="remarks" rows={3} placeholder="Enter the reason and relevant remarks…" /></F>
              </div>
            </Panel>
            <Panel icon="mail" title="Participant Notification">
              <label className="a-switch">
                <span>Notify Participant<small>{r.email ? `Email ${r.email}` : 'No email address on this registration'}{!meta.mail && ' · email is not set up on this server'}</small></span>
                <input type="checkbox" name="notify" checked={notify} onChange={(e) => setNotify(e.target.checked)} disabled={!r.email} />
              </label>
              {notify && (
                <F label="Notification Message" htmlFor="message" full>
                  <textarea className="input" id="message" name="message" rows={7} defaultValue={d.message(r)} />
                </F>
              )}
            </Panel>
          </div>
          <div>
            <Panel icon="file" title={kind === 'reject' ? 'Rejection Overview' : 'Cancellation Overview'}>
              <KV rows={[
                ['Registration ID', r.ref], ['Current Status', <StatusPill key="s" status={r.status} />],
                ['New Status', <StatusPill key="n" status={d.status} />], ['Participant Notification', notify ? 'Enabled' : 'Off'],
              ]} />
            </Panel>
            <Notice tone="red" title={kind === 'reject' ? 'After Rejection' : 'After Cancellation'} items={d.after} />
          </div>
        </div>
        <ConfirmRow text={d.confirm} error={errors.confirm} />
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#registrations/${r.id}`}>Back to Details</a>
          <button className="btn danger-solid" type="submit" disabled={busy}>{d.button}</button>
        </Foot>
      </form>
    </Page>
  );
}

function NotAllowed({ r, what }) {
  return (
    <Page crumbs={[CRUMB, ['Registration Details', `registrations/${r.id}`]]} title="Registration Details" back={['Back to Registration Details', `registrations/${r.id}`]}>
      <Panel><Empty icon="info" title={`This registration can’t be ${what}`}>It is currently {statusLabel(r.status)}.</Empty></Panel>
    </Page>
  );
}

// ---------- Export ----------

export const REG_COLUMNS = {
  participant: [['Registration ID', (r) => r.ref], ['Participant', (r) => r.full_name], ['Company', (r) => r.company], ['Membership ID', (r) => r.membership_id],
    ['Mobile', (r) => r.mobile], ['Email', (r) => r.email]],
  event: [['Event', (r) => r.event_title], ['Event Date', (r) => fmt.date(r.event_date)]],
  status: [['Status', (r) => statusLabel(r.status)], ['Registered On', (r) => fmt.stamp(r.created_at)], ['Reason', (r) => r.status_reason]],
};

function Export() {
  const { call } = useAdmin();
  const state = useLoad(async () => {
    const [regs, events] = await Promise.all([call('/registrations'), call('/events')]);
    return { regs: regs.items, statuses: regs.statuses, events: events.items };
  });
  return <ViewState state={state}>{(d) => <ExportForm {...d} />}</ViewState>;
}

const FORMATS = [['xlsx', 'Excel (.xlsx)', 'Detailed reporting and analysis'], ['csv', 'CSV (.csv)', 'Data processing and integration'], ['pdf', 'PDF (.pdf)', 'Professional printable report']];

function ExportForm({ regs, statuses, events }) {
  const { call, toast } = useAdmin();
  const blank = { event: '', status: '', from: '', to: '', format: 'xlsx', participant: true, eventInfo: true, statusInfo: true };
  const [f, setF] = useState(blank);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const rows = useMemo(() => regs.filter((r) => {
    const iso = new Date(new Date(r.created_at).getTime() + 5.5 * 3600000).toISOString().slice(0, 10); // India date
    return (!f.event || String(r.event_id) === f.event) && (!f.status || r.status === f.status)
      && (!f.from || iso >= f.from) && (!f.to || iso <= f.to);
  }), [regs, f]);
  const columns = [...(f.participant ? REG_COLUMNS.participant : REG_COLUMNS.participant.slice(0, 2)), ...(f.eventInfo ? REG_COLUMNS.event : []), ...(f.statusInfo ? REG_COLUMNS.status : [])];
  const eventName = events.find((e) => String(e.id) === f.event)?.title || 'All Events';
  const [busy, setBusy] = useState(false);

  async function exportNow() {
    if (!rows.length) { toast('No registrations match these filters.', true); return; }
    setBusy(true);
    try {
      const name = `Event Registrations – ${eventName}`;
      exportAs(f.format, columns, rows, { name: 'registrations', title: name, subtitle: `${f.status ? statusLabel(f.status) : 'All statuses'}${f.from || f.to ? `, ${f.from || '…'} to ${f.to || '…'}` : ''}` });
      await call('/reports/exports', { method: 'POST', body: { report: 'registrations', name, format: f.format, row_count: rows.length, params: f } });
      toast('Export ready');
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }

  return (
    <Page crumbs={[CRUMB, ['Export Registrations']]} title="Export Registrations" sub="Generate and download registration reports."
      back={['Back to Registrations', 'registrations']}>
      <div className="a-cols a-form">
        <div>
          <Panel icon="search" title="Select Registration Data" sub="Choose the records to include in your report.">
            <div className="form-grid">
              <F label="Event" htmlFor="x_event">
                <select className="input" id="x_event" value={f.event} onChange={(e) => set('event', e.target.value)}>
                  <Options list={events.map((e) => [String(e.id), `${e.title} – ${fmt.date(e.event_date)}`])} placeholder="All Events" />
                </select>
              </F>
              <F label="Registration Status" htmlFor="x_status">
                <select className="input" id="x_status" value={f.status} onChange={(e) => set('status', e.target.value)}>
                  <Options list={statuses.map((s) => [s, statusLabel(s)])} placeholder="All Registrations" />
                </select>
              </F>
              <F label="From Date" htmlFor="x_from"><input className="input" type="date" id="x_from" value={f.from} onChange={(e) => set('from', e.target.value)} /></F>
              <F label="To Date" htmlFor="x_to"><input className="input" type="date" id="x_to" value={f.to} onChange={(e) => set('to', e.target.value)} /></F>
            </div>
          </Panel>
          <Panel icon="file" title="Export Format" sub="Select the file format for your export.">
            <div className="a-choice">
              {FORMATS.map(([k, t, s]) => (
                <label key={k}><input type="radio" name="format" checked={f.format === k} onChange={() => set('format', k)} /><span><b>{t}</b><small>{s}</small></span></label>
              ))}
            </div>
          </Panel>
          <Panel icon="gear" title="Export Options" sub="Choose the information to include in the report.">
            <div className="a-choice">
              {[['participant', 'Include Participant Information'], ['eventInfo', 'Include Event Information'], ['statusInfo', 'Include Registration Status']].map(([k, t]) => (
                <label key={k}><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /><span><b>{t}</b></span></label>
              ))}
            </div>
          </Panel>
          <Panel icon="eye" title="Export Preview" sub="A quick summary of the records based on your selected filters.">
            <KV cols={2} rows={[['Matching Records', rows.length], ['Selected Format', FORMATS.find(([k]) => k === f.format)[1]], ['Estimated Columns', columns.length]]} />
          </Panel>
        </div>
        <div>
          <Panel icon="file" title="Export Summary">
            <KV rows={[
              ['Selected Event', eventName], ['Registration Status', f.status ? statusLabel(f.status) : 'All Registrations'],
              ['Date Range', f.from || f.to ? `${f.from ? fmt.date(f.from) : '…'} – ${f.to ? fmt.date(f.to) : '…'}` : 'All dates'],
              ['Matching Records', rows.length], ['Export Format', FORMATS.find(([k]) => k === f.format)[1]],
              ['Export Status', rows.length ? <span key="r" className="a-pill green">Ready</span> : <span key="n" className="a-pill grey">No records</span>],
            ]} />
          </Panel>
          <Notice title="Before You Export" items={[
            'The report will contain registration information based on your selected filters and access permissions.',
            'Handle downloaded participant information securely.',
            'Only authorised administrators can export registration data.',
            ...(f.format === 'pdf' ? ['PDF opens in a new tab with the print dialog: choose “Save as PDF”.'] : []),
          ]} />
        </div>
      </div>
      <Foot>
        <a className="btn btn-outline left" href="#registrations">Back to Registrations</a>
        <button className="btn btn-outline" type="button" onClick={() => setF(blank)}>Reset Filters</button>
        <button className="btn btn-primary" type="button" onClick={exportNow} disabled={busy}><Icon name="download" /> Export Registrations</button>
      </Foot>
    </Page>
  );
}

// ---------- Activity history ----------

function AllActivity() {
  const { call } = useAdmin();
  const state = useLoad(() => call('/activity?module=registrations'));
  return (
    <Page crumbs={[CRUMB, ['Activity History']]} title="Registration Activity History" sub="Track registration decisions, changes and approval actions."
      back={['Back to Registrations', 'registrations']}>
      <ViewState state={state}>
        {({ items }) => (
          <ActivityHistory items={items} entityLabel="Registration ID" search="Search by registration ID or participant…" stats={[
            ['file', 'blue', 'Total Activities', (a) => a.length],
            ['check-circle', 'green', 'Approval Actions', (a) => a.filter((x) => /Approved|Attended/.test(x.action)).length],
            ['x', 'red', 'Rejections & Cancellations', (a) => a.filter((x) => /Rejected|Cancelled/.test(x.action)).length],
          ]} />
        )}
      </ViewState>
    </Page>
  );
}
