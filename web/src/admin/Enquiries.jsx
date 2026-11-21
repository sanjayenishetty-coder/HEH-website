// Enquiry screens (designs: images/Part2): details, assign, record response & follow-up, close / reopen and activity history.
// Routes: #enquiries/<id>, #enquiries/<id>/assign | respond | close | activity
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import {
  Checklist, ConfirmRow, Counted, Empty, F, Foot, KV, Notice, Options, Page, Panel, Strip, Timeline, useAction,
} from './parts.jsx';
import { StatusPill, statusLabel } from './ui.jsx';

const CRUMBS = (q, last) => [['Enquiries', 'enquiries'], ['Enquiry Details', `enquiries/${q.id}`], ...(last ? [[last]] : [])];
const PRIORITY = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
const nowLocal = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 16); // India time for datetime-local

export default function EnquiryPages({ path }) {
  const [id, action] = path;
  const { call } = useAdmin();
  const state = useLoad(async () => {
    const [q, admins] = await Promise.all([call(`/enquiries/${id}`), call('/admins')]);
    return { q, admins: admins.items };
  });
  return (
    <ViewState state={state}>
      {({ q, admins }) => {
        if (action === 'assign') return <Assign q={q} admins={admins} />;
        if (action === 'respond') return <Respond q={q} />;
        if (action === 'close') return <CloseReopen q={q} />;
        if (action === 'activity') return <Activity q={q} />;
        return <Details q={q} />;
      }}
    </ViewState>
  );
}

function EnqStrip({ q }) {
  return (
    <Strip items={[
      ['chat', 'Selected Enquiry', q.ref],
      ['tag', 'Enquiry Type', q.enquiry_type],
      ['calendar', 'Received On', fmt.stamp(q.created_at)],
      ['info', 'Current Status', <StatusPill key="s" status={q.status} />],
    ]} />
  );
}

function SummaryPanel({ q }) {
  return (
    <Panel icon="file" title="Enquiry Summary">
      <KV rows={[
        ['Enquiry ID', q.ref], ['Submitted By', q.full_name], ['Enquiry Type', q.enquiry_type], ['Company', q.company],
        ['Received On', fmt.stamp(q.created_at)], ['Assigned Administrator', q.assigned_name || 'Unassigned'],
        ['Current Status', <StatusPill key="s" status={q.status} />],
      ]} />
      <div className="a-foot" style={{ justifyContent: 'flex-start' }}><a className="a-row-btn" href={`#enquiries/${q.id}`}>View Full Enquiry <Icon name="arrow-right" /></a></div>
    </Panel>
  );
}

function Responses({ q }) {
  if (!q.responses.length) return <Empty icon="chat" title="No Responses Recorded">Responses and follow-up updates will appear here.</Empty>;
  return (
    <ul className="a-timeline">
      {q.responses.map((r) => (
        <li key={r.id}>
          <span className="dot" />
          <span>
            <b>{r.channel} · {r.outcome}</b>
            <small>{r.summary}</small>
            {r.follow_up_required && <small>Next follow-up: {fmt.date(r.next_follow_up)}{r.instructions ? ` — ${r.instructions}` : ''}</small>}
            <small className="by">{fmt.stamp(r.contacted_at)}{r.admin_name ? ` · ${r.admin_name}` : ''}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Details({ q }) {
  const closed = q.status === 'closed';
  return (
    <Page crumbs={[['Enquiries', 'enquiries'], ['Enquiry Details']]} title="Enquiry Details" sub="Review enquiry information, assignment and follow-up status."
      back={['Back to Enquiries', 'enquiries']}>
      <EnqStrip q={q} />
      <div className="a-cols">
        <div>
          <Panel icon="user" title="Enquiry Information" sub="Contact and submission details.">
            <KV cols={2} rows={[
              ['Full Name', q.full_name], ['Enquiry Type', q.enquiry_type],
              ['Email Address', q.email ? <a key="e" href={`mailto:${q.email}`}>{q.email}</a> : ''], ['Enquiry Source', q.member_name ? `Member profile (${q.member_name})` : 'HEH Website'],
              ['Mobile Number', q.mobile ? <a key="m" href={`tel:${q.mobile.replace(/\s/g, '')}`}>{q.mobile}</a> : ''], ['Received Date', fmt.stamp(q.created_at)],
              ['Organisation / Company', q.company], ['Enquiry ID', q.ref],
            ]} />
          </Panel>
          <Panel icon="mail" title="Submitted Message">
            <KV rows={[['Message', q.message]]} />
          </Panel>
          <Panel icon="chat" title="Response History" sub="Recorded responses and follow-up communications."
            aside={!closed && <a className="btn btn-outline btn-sm" href={`#enquiries/${q.id}/respond`}><Icon name="plus" /> Record Response</a>}>
            <Responses q={q} />
          </Panel>
        </div>
        <div>
          <Panel icon="chart" title="Enquiry Status">
            <KV rows={[
              ['Current Status', <StatusPill key="s" status={q.status} />], ['Priority', PRIORITY[q.priority]],
              ['Last Updated', fmt.stamp(q.updated_at)], ['Follow-up Due', q.follow_up_date ? fmt.date(q.follow_up_date) : 'Not scheduled'],
              ...(closed ? [['Close Reason', q.close_reason]] : []),
            ]} />
          </Panel>
          <Panel icon="user" title="Assignment Details">
            <KV rows={[
              ['Assigned Administrator', q.assigned_name || 'Unassigned'], ['Assigned On', q.assigned_at ? fmt.stamp(q.assigned_at) : ''],
              ['Priority', PRIORITY[q.priority]], ['Instructions', q.follow_up_notes],
            ]} />
            {!closed && <div className="a-foot" style={{ justifyContent: 'flex-start' }}><a className="btn btn-outline btn-sm" href={`#enquiries/${q.id}/assign`}><Icon name="user" /> {q.assigned_to ? 'Reassign Enquiry' : 'Assign Enquiry'}</a></div>}
          </Panel>
          <Panel icon="rocket" title="Quick Actions">
            <div className="a-foot" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
              {!closed && <a className="btn btn-primary btn-sm" href={`#enquiries/${q.id}/assign`}>Assign Enquiry</a>}
              {!closed && <a className="btn btn-outline btn-sm" href={`#enquiries/${q.id}/respond`}>Record Response</a>}
              <a className="btn btn-outline btn-sm" href={`#enquiries/${q.id}/close`}>{closed ? 'Reopen Enquiry' : 'Close Enquiry'}</a>
              <a className="btn btn-outline btn-sm" href={`#enquiries/${q.id}/activity`}>Activity History</a>
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function Assign({ q, admins }) {
  const { go, meta } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  if (q.status === 'closed') return <Closed q={q} />;
  return (
    <Page crumbs={CRUMBS(q, 'Assign Enquiry')} title="Assign Enquiry" sub="Assign responsibility and schedule the next action for this enquiry."
      back={['Back to Enquiry Details', `enquiries/${q.id}`]}>
      <EnqStrip q={q} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/enquiries/${q.id}/assign`, { success: 'Enquiry assigned', done: () => go(`enquiries/${q.id}`) })}>
        <div className="a-cols">
          <div>
            <Panel icon="user" title="Assignment Details" sub="Select the administrator responsible for handling this enquiry.">
              <div className="form-grid">
                <F label="Assign To" req htmlFor="assigned_to" error={errors.assigned_to}>
                  <select className="input" id="assigned_to" name="assigned_to" defaultValue={q.assigned_to || ''}>
                    <Options list={admins.map((a) => [String(a.id), `${a.username}${a.email ? ` (${a.email})` : ''}`])} placeholder="Select HEH administrator" />
                  </select>
                </F>
                <F label="Priority" req htmlFor="priority" error={errors.priority}>
                  <select className="input" id="priority" name="priority" defaultValue={q.priority}>
                    <Options list={(meta.enquiryPriorities || []).map((p) => [p, PRIORITY[p]])} />
                  </select>
                </F>
                <F label="Assignment Date"><input className="input" value="Recorded automatically" disabled /></F>
                <F label="Assignment Status"><input className="input" value={q.assigned_to ? `Assigned to ${q.assigned_name}` : 'Pending assignment'} disabled /></F>
              </div>
            </Panel>
            <Panel icon="calendar" title="Follow-up & Instructions" sub="Schedule a follow-up and add internal instructions for the assigned administrator.">
              <div className="form-grid">
                <F label="Follow-up Date" htmlFor="follow_up_date"><input className="input" type="date" id="follow_up_date" name="follow_up_date" defaultValue={q.follow_up_date || ''} /></F>
                <F label="Internal Instructions" htmlFor="instructions" full><Counted name="instructions" defaultValue={q.follow_up_notes} placeholder="Add instructions for the assigned administrator…" /></F>
              </div>
            </Panel>
          </div>
          <div>
            <SummaryPanel q={q} />
            <Panel icon="user" title="Current Assignment">
              <KV rows={[['Assigned Administrator', q.assigned_name || 'Unassigned'], ['Assigned On', q.assigned_at ? fmt.stamp(q.assigned_at) : ''],
                ['Current Priority', PRIORITY[q.priority]], ['Follow-up Due', q.follow_up_date ? fmt.date(q.follow_up_date) : 'Not scheduled']]} />
            </Panel>
            <Notice tone="blue" title="Assignment Guidelines" items={[
              'The selected administrator becomes responsible for the enquiry.',
              'A new enquiry moves to In Progress once it is assigned.',
              'All assignments and reassignments are recorded in the activity history.',
            ]} />
          </div>
        </div>
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#enquiries/${q.id}`}>Cancel</a>
          <button className="btn btn-primary" type="submit" disabled={busy}><Icon name="user" /> Assign Enquiry</button>
        </Foot>
      </form>
    </Page>
  );
}

function Respond({ q }) {
  const { go, meta } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  const [followUp, setFollowUp] = useState('no');
  return (
    <Page crumbs={CRUMBS(q, 'Record Response')} title="Record Response & Follow-up" sub="Record communication details and schedule the next action."
      back={['Back to Enquiry Details', `enquiries/${q.id}`]}>
      <EnqStrip q={q} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/enquiries/${q.id}/responses`, {
        extra: { follow_up_required: followUp === 'yes' }, success: 'Response recorded', done: () => go(`enquiries/${q.id}`),
      })}>
        <div className="a-cols">
          <div>
            <Panel icon="chat" title="Response Details" sub="Record the communication made regarding this enquiry.">
              <div className="form-grid">
                <F label="Communication Channel" req htmlFor="channel" error={errors.channel}>
                  <select className="input" id="channel" name="channel" defaultValue=""><Options list={meta.enquiryChannels || []} placeholder="Select communication channel" /></select>
                </F>
                <F label="Communication Date & Time" req htmlFor="contacted_at" error={errors.contacted_at}>
                  <input className="input" type="datetime-local" id="contacted_at" name="contacted_at" defaultValue={nowLocal()} />
                </F>
                <F label="Response Summary" req htmlFor="summary" error={errors.summary} full>
                  <Counted name="summary" max={1000} placeholder="Briefly describe the response or discussion with the enquirer…" />
                </F>
                <F label="Communication Outcome" req htmlFor="outcome" error={errors.outcome}>
                  <select className="input" id="outcome" name="outcome" defaultValue=""><Options list={meta.enquiryOutcomes || []} placeholder="Select outcome" /></select>
                </F>
              </div>
            </Panel>
            <Panel icon="calendar" title="Follow-up Details" sub="Schedule the next action if additional communication is required.">
              <div className="form-grid">
                <F label="Follow-up Required">
                  <span className="a-segs">
                    {[['no', 'No'], ['yes', 'Yes']].map(([k, t]) => <button key={k} type="button" className={followUp === k ? 'on' : ''} onClick={() => setFollowUp(k)}>{t}</button>)}
                  </span>
                </F>
                {followUp === 'yes' && (
                  <F label="Next Follow-up Date" req htmlFor="next_follow_up" error={errors.next_follow_up}>
                    <input className="input" type="date" id="next_follow_up" name="next_follow_up" />
                  </F>
                )}
                {followUp === 'yes' && <F label="Follow-up Instructions" htmlFor="instructions" full><Counted name="instructions" placeholder="Enter the next action or follow-up instructions…" /></F>}
              </div>
            </Panel>
          </div>
          <div>
            <SummaryPanel q={q} />
            <Panel icon="user" title="Assignment Information">
              <KV rows={[['Assigned Administrator', q.assigned_name || 'Unassigned'], ['Assigned On', q.assigned_at ? fmt.stamp(q.assigned_at) : ''],
                ['Priority', PRIORITY[q.priority]], ['Follow-up Due', q.follow_up_date ? fmt.date(q.follow_up_date) : 'Not scheduled']]} />
            </Panel>
            <Panel icon="chat" title="Recent Communication"><Responses q={{ ...q, responses: q.responses.slice(0, 3) }} /></Panel>
          </div>
        </div>
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#enquiries/${q.id}`}>Cancel</a>
          <button className="btn btn-primary" type="submit" disabled={busy}>Save Response</button>
        </Foot>
      </form>
    </Page>
  );
}

function CloseReopen({ q }) {
  const { go, meta } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  const closed = q.status === 'closed';
  const action = closed ? 'reopen' : 'close';
  const responded = q.responses.length > 0;
  const followUpsDone = !q.responses.some((r) => r.follow_up_required && r.next_follow_up && r.next_follow_up > new Date().toISOString().slice(0, 10));
  return (
    <Page crumbs={CRUMBS(q, closed ? 'Reopen Enquiry' : 'Close Enquiry')} title="Close / Reopen Enquiry" sub="Manage enquiry closure and reopening with proper documentation."
      back={['Back to Enquiry Details', `enquiries/${q.id}`]}>
      <EnqStrip q={q} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/enquiries/${q.id}/${action}`, {
        confirm: 'confirm', success: closed ? 'Enquiry reopened' : 'Enquiry closed', done: () => go(`enquiries/${q.id}`),
      })}>
        <div className="a-cols">
          <div>
            <Panel icon="gear" title="Enquiry Status Management" sub="Select the action to be performed on this enquiry.">
              <div className="a-choice">
                <label><input type="radio" checked={!closed} disabled={closed} readOnly /><span><b>Close Enquiry</b><small>Finalise a resolved enquiry.</small></span></label>
                <label><input type="radio" checked={closed} disabled={!closed} readOnly /><span><b>Reopen Enquiry</b><small>Resume work on a closed enquiry.</small></span></label>
              </div>
              <p className="a-muted-sm" style={{ marginTop: 12 }}>Status change: <StatusPill status={q.status} /> → <StatusPill status={closed ? 'in_progress' : 'closed'} /></p>
            </Panel>
            <Panel icon="edit" title="Action Details" sub="Provide the reason and additional remarks for this action.">
              <div className="form-grid">
                <F label="Reason" req htmlFor="reason" error={errors.reason}>
                  <select className="input" id="reason" name="reason" defaultValue=""><Options list={meta[closed ? 'enquiryReopenReasons' : 'enquiryCloseReasons'] || []} placeholder="Select reason" /></select>
                </F>
                <F label="Action Date & Time"><input className="input" value="Automatically recorded on save" disabled /></F>
                <F label="Internal Remarks" htmlFor="remarks" full><Counted name="remarks" placeholder={`Add internal remarks about this ${closed ? 'reopening' : 'closure'}…`} /></F>
              </div>
            </Panel>
          </div>
          <div>
            <SummaryPanel q={q} />
            {!closed && (
              <Panel icon="check-circle" tone="green" title="Resolution Checklist">
                <Checklist items={[
                  ['Enquiry Reviewed', Boolean(q.assigned_to || responded), q.assigned_to || responded ? 'Complete' : 'Pending'],
                  ['Response Recorded', responded, responded ? 'Complete' : 'Pending'],
                  ['Follow-ups Addressed', followUpsDone, followUpsDone ? 'Complete' : 'Pending'],
                ]} />
              </Panel>
            )}
            <Panel icon="clock" title="Status History"><Timeline items={q.activity.filter((a) => /Closed|Reopened|Status/.test(a.action))} empty="No status changes recorded yet." /></Panel>
          </div>
        </div>
        <ConfirmRow text="I confirm that the selected action and supporting information have been reviewed." error={errors.confirm} />
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#enquiries/${q.id}`}>Cancel</a>
          <button className="btn btn-primary" type="submit" disabled={busy}><Icon name={closed ? 'arrow-left' : 'check-circle'} /> {closed ? 'Reopen Enquiry' : 'Close Enquiry'}</button>
        </Foot>
      </form>
    </Page>
  );
}

function Activity({ q }) {
  const items = [...q.activity, { id: 'c', action: 'Enquiry Received', details: 'Submitted through the HEH website', created_at: q.created_at }];
  return (
    <Page crumbs={CRUMBS(q, 'Activity History')} title="Enquiry Activity History" sub="Track all actions and updates for this enquiry."
      back={['Back to Enquiry Details', `enquiries/${q.id}`]}>
      <Strip items={[['chat', 'Enquiry', q.ref], ['tag', 'Type', q.enquiry_type], ['info', 'Status', <StatusPill key="s" status={q.status} />]]} />
      <div className="a-cols">
        <div><Panel icon="clock" title="Activity Timeline"><Timeline items={items} /></Panel></div>
        <div>
          <SummaryPanel q={q} />
          <Panel icon="chart" title="Activity Overview">
            <KV rows={[['Total Activities', items.length], ['Last Updated', fmt.stamp(q.updated_at)], ['Latest Action', items[0]?.action], ['Status', statusLabel(q.status)]]} />
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function Closed({ q }) {
  return (
    <Page crumbs={CRUMBS(q)} title="Enquiry Details" back={['Back to Enquiry Details', `enquiries/${q.id}`]}>
      <Panel><Empty icon="info" title="This enquiry is closed">Reopen it before assigning it to an administrator.
        <br /><a className="btn btn-primary btn-sm" style={{ marginTop: 12 }} href={`#enquiries/${q.id}/close`}>Reopen Enquiry</a></Empty></Panel>
    </Page>
  );
}
