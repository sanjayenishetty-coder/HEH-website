// Events added by Working Committee members, approved by Executive Council members (API: routes/member.js
// "Event submissions"). Nothing shows on the website until an Executive Council member or an admin approves it.
//   #events/submit                 Working Committee: add an event
//   #events/submissions[/<id>]     Working Committee: my events and their approval status (edit / withdraw)
//   #events/approvals[/<id>]       Executive Council: events waiting for approval (approve / reject)
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';
import { Card, DateBox, Dialog, Empty, Field, Head, KV, Load, Pill, Tabs, useData } from './parts.jsx';

const TYPES = [['spotlight', 'Networking'], ['workshop', 'Workshop']];
const typeName = (c) => (c === 'workshop' ? 'Workshop' : 'Networking');
const APPROVAL = {
  pending: ['orange', 'clock', 'Awaiting Approval'],
  approved: ['green', 'check-circle', 'Approved – on the website'],
  rejected: ['red', 'x', 'Not Approved'],
};
export const ApprovalPill = ({ status }) => {
  const [tone, icon, label] = APPROVAL[status] || APPROVAL.pending;
  return <Pill tone={tone} icon={icon}>{label}</Pill>;
};
const todayIst = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

// ---------- Add / change an event (Working Committee) ----------

export function SubmitEvent({ id }) {
  const { me } = usePortal();
  const state = useData(id ? `/event-submissions/${id}` : null);
  if (!me.can_submit_events) {
    return (
      <>
        <Head title="Add Event" back="events" />
        <Card><Empty icon="lock" title="Only the Working Committee adds events">Events are added by Working Committee members and published after the Executive Council approves them.</Empty></Card>
      </>
    );
  }
  if (!id) return <EventForm />;
  return <Load state={state}>{(e) => <EventForm e={e} />}</Load>;
}

function EventForm({ e = null }) {
  const { call, toast, go } = usePortal();
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(e?.image_url || '');
  const [uploading, setUploading] = useState(false);

  async function onImage(ev) {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    try { setImage((await call('/event-submissions/image', { method: 'POST', body })).url); } catch (err) { toast(err.message, true); } finally { setUploading(false); }
  }

  async function submit(ev) {
    ev.preventDefault();
    const body = { ...Object.fromEntries(new FormData(ev.currentTarget).entries()), image_url: image };
    body.members_only = ev.currentTarget.members_only.checked;
    setBusy(true);
    setErrors({});
    try {
      const saved = await call(e ? `/event-submissions/${e.id}` : '/event-submissions', { method: e ? 'PUT' : 'POST', body });
      toast(e ? 'Changes sent to the Executive Council for approval' : 'Event sent to the Executive Council for approval');
      go(`events/submissions/${saved.id}`);
    } catch (err) {
      if (err.errors) { setErrors(err.errors); toast(err.message, true); } else toast(err.message, true);
    } finally { setBusy(false); }
  }

  const v = e || {};
  return (
    <>
      <Head title={e ? 'Change Event' : 'Add Event'} crumbs={[['Events', 'events'], ['My Event Submissions', 'events/submissions'], [e ? 'Change Event' : 'Add Event']]} back={e ? `events/submissions/${e.id}` : 'events/submissions'} />
      <p className="p-note"><Icon name="info" /><span>The event is shown on the HEH website only after an <b>Executive Council</b> member or an admin approves it. You will get a notification when it is reviewed.</span></p>
      <form className="p-card p-form" noValidate onSubmit={submit}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="calendar" /></span>
          <div><h2>Event Details</h2><p className="p-muted">Fields marked * are required.</p></div></div>
        <div className="p-form-grid">
          <Field label="Event Name *" error={errors.title} full><input className="p-input" name="title" defaultValue={v.title} maxLength={160} /></Field>
          <Field label="Event Type *" error={errors.category}>
            <select className="p-input" name="category" defaultValue={v.category || 'spotlight'}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <Field label="Coordinator" error={errors.coordinator} hint="Who members can contact about the event"><input className="p-input" name="coordinator" defaultValue={v.coordinator} maxLength={160} /></Field>
          <Field label="Short Description *" error={errors.short_description} full hint="One or two lines shown in event lists">
            <input className="p-input" name="short_description" defaultValue={v.short_description} maxLength={300} />
          </Field>
          <Field label="Full Description" error={errors.description} full>
            <textarea className="p-input" name="description" rows={5} defaultValue={v.description} maxLength={5000} />
          </Field>
        </div>
        <div className="p-form-grid three">
          <Field label="Event Date *" error={errors.event_date}><input className="p-input" type="date" name="event_date" min={todayIst()} defaultValue={v.event_date ? String(v.event_date).slice(0, 10) : ''} /></Field>
          <Field label="Start Time *" error={errors.start_time}><input className="p-input" type="time" name="start_time" defaultValue={v.start_time ? String(v.start_time).slice(0, 5) : ''} /></Field>
          <Field label="End Time" error={errors.end_time}><input className="p-input" type="time" name="end_time" defaultValue={v.end_time ? String(v.end_time).slice(0, 5) : ''} /></Field>
        </div>
        <div className="p-form-grid">
          <Field label="Venue *" error={errors.venue_name}><input className="p-input" name="venue_name" defaultValue={v.venue_name} maxLength={160} /></Field>
          <Field label="City" error={errors.city}><input className="p-input" name="city" defaultValue={v.city || 'Hyderabad'} maxLength={80} /></Field>
          <Field label="Venue Address" error={errors.venue_address} full><input className="p-input" name="venue_address" defaultValue={v.venue_address} maxLength={400} /></Field>
          <Field label="Google Maps Link" error={errors.map_url}><input className="p-input" name="map_url" defaultValue={v.map_url} maxLength={500} placeholder="https://maps.google.com/…" /></Field>
          <Field label="Maximum Participants" error={errors.capacity} hint="Leave blank for no limit"><input className="p-input" name="capacity" inputMode="numeric" defaultValue={v.capacity || ''} maxLength={5} /></Field>
        </div>
        <label className="p-check"><input type="checkbox" name="members_only" defaultChecked={e ? v.members_only : true} /> Only HEH members can register</label>
        <div className="p-field">
          <span className="p-label">Event Image (optional)</span>
          <div className="p-ev-image">
            {image ? <img src={image} alt="" /> : <span className="p-ev-noimg"><Icon name="image" /></span>}
            <div>
              <label className="p-btn outline sm"><Icon name="upload" /> {uploading ? 'Uploading…' : image ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onImage} disabled={uploading} /></label>
              {image && <button type="button" className="p-btn outline sm" onClick={() => setImage('')}>Remove</button>}
              <small className="p-hint">JPG, PNG or WebP, up to 5 MB.</small>
            </div>
          </div>
        </div>
        <div className="p-form-acts">
          <a className="p-btn outline" href={e ? `#events/submissions/${e.id}` : '#events/submissions'}>Cancel</a>
          <button className="p-btn" type="submit" disabled={busy || uploading}>{busy ? 'Sending…' : <>{e ? 'Send Changes for Approval' : 'Send for Approval'} <Icon name="arrow-right" /></>}</button>
        </div>
      </form>
    </>
  );
}

// ---------- My event submissions (Working Committee) ----------

export function MySubmissions() {
  const state = useData('/event-submissions');
  return (
    <Load state={state}>
      {(d) => (
        <Card title={`My Event Submissions (${d.items.length})`} bar
          action={d.can_submit && <a className="p-btn sm" href="#events/submit"><Icon name="plus" /> Add Event</a>}>
          {d.items.length ? d.items.map((e) => <SubmissionRow key={e.id} e={e} href={`#events/submissions/${e.id}`} />)
            : <Empty icon="calendar" title="No events added yet"
              action={d.can_submit && <a className="p-btn" href="#events/submit"><Icon name="plus" /> Add Event</a>}>
              Events you add are sent to the Executive Council and appear on the website once approved.</Empty>}
        </Card>
      )}
    </Load>
  );
}

function SubmissionRow({ e, href, by = false }) {
  return (
    <div className="p-event-row">
      <DateBox date={e.event_date} small />
      <a className="body" href={href}><b>{e.title}</b>
        <span className="p-meta">
          <span><Icon name="clock" /> {fmt.timeRange(e.start_time, e.end_time)}</span>
          {e.venue_name && <span><Icon name="pin" /> {e.venue_name}</span>}
          {by && <span><Icon name="user" /> Added by {e.submitted_by_name}</span>}
          {!by && e.submitted_at && <span><Icon name="send" /> Sent {fmt.stamp(e.submitted_at).slice(0, 11)}</span>}
        </span></a>
      <ApprovalPill status={e.approval_status} />
      <a className="p-btn outline sm" href={href}>{by && e.approval_status === 'pending' ? 'Review' : 'View Details'}</a>
    </div>
  );
}

export function SubmissionDetails({ id }) {
  const state = useData(`/event-submissions/${id}`);
  const { call, toast, go, openModal, closeModal } = usePortal();
  const withdraw = (e) => openModal(
    <Dialog icon="trash" tone="red" title="Withdraw Event?"
      actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Keep It</button>
        <button type="button" className="p-btn danger" onClick={async () => {
          try { await call(`/event-submissions/${e.id}`, { method: 'DELETE' }); closeModal(); toast('Event withdrawn'); go('events/submissions'); } catch (err) { toast(err.message, true); }
        }}>Withdraw</button></>}>
      <p>“{e.title}” will be removed and the Executive Council will no longer see it.</p>
    </Dialog>,
  );
  return (
    <Load state={state}>
      {(e) => (
        <>
          <Head title="Event Submission" crumbs={[['Events', 'events'], ['My Event Submissions', 'events/submissions'], [e.title]]} back="events/submissions">
            {e.approval_status !== 'approved' && <a className="p-btn outline" href={`#events/submit/${e.id}`}><Icon name="edit" /> Change</a>}
            {e.approval_status !== 'approved' && <button type="button" className="p-btn outline" onClick={() => withdraw(e)}><Icon name="trash" /> Withdraw</button>}
            {e.approval_status === 'approved' && e.published && <a className="p-btn" href={`/event?e=${encodeURIComponent(e.slug)}`} target="_blank" rel="noopener">View on Website <Icon name="external" /></a>}
          </Head>
          <ReviewNote e={e} />
          <EventSummary e={e} />
        </>
      )}
    </Load>
  );
}

function ReviewNote({ e }) {
  if (e.approval_status === 'pending') {
    return <p className="p-note"><Icon name="clock" /><span>Waiting for approval by the <b>Executive Council</b>. It is not on the website yet.</span></p>;
  }
  if (e.approval_status === 'rejected') {
    return (
      <p className="p-note bad"><Icon name="alert" /><span><b>Not approved</b> by {e.reviewed_by}{e.reviewed_at && <> on {fmt.stamp(e.reviewed_at)}</>}.
        {e.review_note && <> Reason: {e.review_note}</>} You can change the event and send it again.</span></p>
    );
  }
  return (
    <p className="p-note good"><Icon name="check-circle" /><span><b>Approved</b> by {e.reviewed_by}{e.reviewed_at && <> on {fmt.stamp(e.reviewed_at)}</>}
      {e.published ? ' and published on the HEH website.' : '. An admin has taken it off the website for now.'}{e.review_note && <> Remarks: {e.review_note}</>}</span></p>
  );
}

function EventSummary({ e, children }) {
  return (
    <div className="p-grid-2 wide-left">
      <Card title={e.title} bar>
        {e.image_url && <img className="p-ev-cover" src={e.image_url} alt="" />}
        {e.short_description && <p className="p-text"><b>{e.short_description}</b></p>}
        {e.description && <p className="p-text pre">{e.description}</p>}
      </Card>
      <div className="p-stack">
        <Card title="Details" bar>
          <KV rows={[
            ['Status', <ApprovalPill key="s" status={e.approval_status} />],
            ['Type', typeName(e.category)],
            ['Date', e.event_date ? `${fmt.weekday(e.event_date)}, ${fmt.date(e.event_date)}` : ''],
            ['Time', fmt.timeRange(e.start_time, e.end_time)],
            ['Venue', [e.venue_name, e.venue_address, e.city].filter(Boolean).join(', ')],
            e.map_url && ['Map', <a key="m" className="p-link" href={e.map_url} target="_blank" rel="noopener">Open in Google Maps <Icon name="external" /></a>],
            ['Coordinator', e.coordinator],
            ['Participants', e.capacity ? `Up to ${e.capacity}` : 'No limit'],
            ['Who can register', e.members_only ? 'HEH members only' : 'Open to all'],
            ['Added by', e.submitted_by_name ? `${e.submitted_by_name}${e.submitted_by_company ? `, ${e.submitted_by_company}` : ''}` : ''],
            ['Sent on', e.submitted_at ? fmt.stamp(e.submitted_at) : ''],
          ]} />
        </Card>
        {children}
      </div>
    </div>
  );
}

// ---------- Event approvals (Executive Council) ----------

export function Approvals({ query }) {
  const { me } = usePortal();
  const status = ['approved', 'rejected'].includes(query.get('status')) ? query.get('status') : 'pending';
  const state = useData(me.can_approve_events ? `/event-approvals?status=${status}` : null);
  if (!me.can_approve_events) {
    return <Card><Empty icon="lock" title="Executive Council only">Events added by the Working Committee are approved by Executive Council members.</Empty></Card>;
  }
  return (
    <Load state={state}>
      {(d) => (
        <>
          <Tabs value={status} onChange={(k) => { window.location.hash = `events/approvals${k === 'pending' ? '' : `?status=${k}`}`; }}
            items={[['pending', 'Awaiting Approval', 'clock', d.counts.pending || 0], ['approved', 'Approved', 'check-circle', d.counts.approved || 0],
              ['rejected', 'Not Approved', 'x', d.counts.rejected || 0]]} />
          <Card title={status === 'pending' ? 'Events Awaiting Your Approval' : status === 'approved' ? 'Approved Events' : 'Events Not Approved'} bar>
            {d.items.length ? d.items.map((e) => <SubmissionRow key={e.id} e={e} by href={`#events/approvals/${e.id}`} />)
              : <Empty icon="check-circle" title={status === 'pending' ? 'Nothing waiting' : 'Nothing here yet'}>
                {status === 'pending' ? 'Events added by the Working Committee will appear here for approval.' : ''}</Empty>}
          </Card>
        </>
      )}
    </Load>
  );
}

export function ApprovalDetails({ id }) {
  const state = useData(`/event-approvals/${id}`);
  const { call, toast, openModal, closeModal, refreshMe } = usePortal();

  const review = (e, what) => openModal(<ReviewDialog e={e} what={what} onDone={async () => {
    closeModal();
    toast(what === 'approve' ? 'Event approved and published on the website' : 'Event not approved; the member has been told');
    state.reload();
    refreshMe();
  }} call={call} />);

  return (
    <Load state={state}>
      {(e) => (
        <>
          <Head title="Review Event" crumbs={[['Events', 'events'], ['Event Approvals', 'events/approvals'], [e.title]]} back="events/approvals">
            {e.approval_status === 'approved' && e.published && <a className="p-btn outline" href={`/event?e=${encodeURIComponent(e.slug)}`} target="_blank" rel="noopener">View on Website <Icon name="external" /></a>}
          </Head>
          <ReviewNote e={e} />
          <EventSummary e={e}>
            {e.approval_status === 'pending' && (
              <Card title="Your Decision" bar>
                {e.own ? <p className="p-muted">You added this event, so another Executive Council member or an admin needs to approve it.</p> : (
                  <>
                    <p className="p-muted">Approving publishes the event on the HEH website and opens registrations.</p>
                    <div className="p-form-acts center">
                      <button type="button" className="p-btn outline" onClick={() => review(e, 'reject')}><Icon name="x" /> Reject</button>
                      <button type="button" className="p-btn" onClick={() => review(e, 'approve')}><Icon name="check" /> Approve &amp; Publish</button>
                    </div>
                  </>
                )}
              </Card>
            )}
          </EventSummary>
        </>
      )}
    </Load>
  );
}

function ReviewDialog({ e, what, onDone, call }) {
  const { closeModal, toast } = usePortal();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const approve = what === 'approve';
  async function go() {
    if (!approve && !note.trim()) { setError('Enter the reason so the member can fix the event.'); return; }
    setBusy(true);
    try {
      await call(`/event-approvals/${e.id}/${what}`, { method: 'POST', body: { note } });
      await onDone();
    } catch (err) { if (err.errors?.note) setError(err.errors.note); else toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <Dialog icon={approve ? 'check-circle' : 'x'} tone={approve ? 'green' : 'red'} title={approve ? 'Approve Event?' : 'Reject Event?'}
      actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Cancel</button>
        <button type="button" className={`p-btn${approve ? '' : ' danger'}`} disabled={busy} onClick={go}>{busy ? 'Saving…' : approve ? 'Approve & Publish' : 'Reject'}</button></>}>
      <p>{approve ? <>“{e.title}” will be published on the HEH website and members can register.</> : <>“{e.title}” will stay off the website. {e.submitted_by_name} will see your reason and can change the event.</>}</p>
      <Field label={approve ? 'Remarks for the member (optional)' : 'Reason *'} error={error} full>
        <textarea className="p-input" rows={3} maxLength={1000} value={note} onChange={(ev) => { setNote(ev.target.value); setError(''); }} />
      </Field>
    </Dialog>
  );
}
