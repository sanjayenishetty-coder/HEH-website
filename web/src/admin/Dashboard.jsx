// Dashboard (design: Part1 "Welcome Back, Admin"): counts, upcoming events, items needing attention,
// latest applications, recent activity and quick actions.
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import { Avatar, PageHead, StatCard, StatusPill, TypePill, ago, eventStatus } from './ui.jsx';

const ACTIVITY = {
  application: ['file', 'blue', (a) => `New membership application from ${a.who}`],
  enquiry: ['chat', 'red', (a) => `New enquiry from ${a.who}${a.detail ? ` (${a.detail})` : ''}`],
  registration: ['user-check', 'orange', (a) => `${a.who} registered for ${a.detail}`],
  event: ['calendar', 'purple', (a) => `Event created: ${a.who}`],
  member: ['users', 'green', (a) => `Member added: ${a.who}`],
};

export default function Dashboard() {
  const { call, go, user } = useAdmin();
  const state = useLoad(() => call('/summary'));
  const name = user === 'admin' ? 'Admin' : user;

  return (
    <ViewState state={state}>
      {(s) => (
        <>
          <PageHead title={`Welcome Back, ${name}`} sub="Here’s what’s happening across the HEH community.">
            <button className="btn btn-primary" type="button" onClick={() => go('events/new')}><Icon name="plus" /> Create Event</button>
          </PageHead>

          <div className="a-stats five">
            <StatCard icon="users" tone="blue" title="Active Members" value={s.active_members} sub="Total active HEH members" onClick={() => go('members?status=active')} />
            <StatCard icon="file" tone="orange" title="Pending Applications" value={s.pending_applications} sub="Awaiting review" onClick={() => go('applications?status=open')} />
            <StatCard icon="calendar" tone="purple" title="Upcoming Events" value={s.upcoming_events} sub="Scheduled events" onClick={() => go('events?status=upcoming')} />
            <StatCard icon="user-check" tone="green" title="Event Registrations" value={s.upcoming_registrations} sub="For upcoming events" onClick={() => go('registrations')} />
            <StatCard icon="chat" tone="red" title="Open Enquiries" value={s.open_enquiries} sub="Requiring action" onClick={() => go('enquiries?status=open')} />
          </div>

          <div className="dash-grid top">
            <section className="a-card">
              <div className="a-card-head"><h2>Upcoming Events</h2><a href="#events">View All Events <Icon name="arrow-right" /></a></div>
              {s.events.length ? s.events.map((e) => (
                <a className="dash-event" key={e.id} href={`#events?open=${e.id}`}>
                  <span className="thumb" style={e.image_url ? { backgroundImage: `url('${e.image_url}')` } : undefined} />
                  <span className="info">
                    <TypePill type={e.category} />
                    <b>{e.title}</b>
                    <span className="meta">
                      <span><Icon name="calendar" /> {fmt.date(e.event_date)}</span>
                      {e.start_time && <span><Icon name="clock" /> {fmt.timeRange(e.start_time, e.end_time)}</span>}
                      {e.venue_name && <span><Icon name="pin" /> {e.venue_name}</span>}
                    </span>
                  </span>
                  <span className="count"><Icon name="users" /> <b>{e.registrations}</b><small>Registered</small></span>
                  <StatusPill status={eventStatus(e)} />
                </a>
              )) : <p className="a-empty">No upcoming events. <a href="#events?new=1">Create one</a>.</p>}
            </section>

            <section className="a-card">
              <div className="a-card-head"><h2>Requires Attention</h2></div>
              {[
                ['file', 'orange', 'Membership Reviews', s.pending_applications, 'Applications awaiting review', 'applications?status=open'],
                ['user-check', 'blue', 'New Registrations', s.recent_registrations, 'Event registrations in the last 7 days', 'registrations'],
                ['chat', 'red', 'Enquiry Follow-ups', s.open_enquiries, 'Unresolved enquiries', 'enquiries?status=open'],
              ].map(([icon, tone, title, n, text, hash]) => (
                <a className="attn" key={title} href={`#${hash}`}>
                  <span className={`a-ic ${tone}`}><Icon name={icon} solid /></span>
                  <span><b>{title}</b><span><b className="n">{n}</b> {text}</span></span>
                  <Icon name="chevron-right" className="go" />
                </a>
              ))}
            </section>
          </div>

          <div className="dash-grid bottom">
            <section className="a-card">
              <div className="a-card-head"><h2>Recent Membership Applications</h2><a href="#applications">View All Applications <Icon name="arrow-right" /></a></div>
              <div className="table-wrap flat">
                <table className="data a-table">
                  <thead><tr><th>Applicant</th><th>Applied On</th><th>Status</th><th className="act">Action</th></tr></thead>
                  <tbody>
                    {s.applications.length ? s.applications.map((a) => (
                      <tr key={a.id} className="clickable" onClick={() => go(`applications?open=${a.id}`)}>
                        <td><span className="a-who"><Avatar name={a.full_name} size={30} /><span>{a.full_name}<small>{a.company_name}</small></span></span></td>
                        <td className="nowrap">{fmt.stamp(a.created_at).slice(0, 11)}</td>
                        <td><StatusPill status={a.status} /></td>
                        <td className="act"><span className="a-row-btn small">View</span></td>
                      </tr>
                    )) : <tr><td colSpan={4} className="a-empty">No applications yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="a-card">
              <div className="a-card-head"><h2>Recent Activity</h2></div>
              <ul className="activity">
                {s.activity.map((a, i) => {
                  const [icon, tone, text] = ACTIVITY[a.kind];
                  return (
                    <li key={i}>
                      <span className={`a-ic sm ${tone}`}><Icon name={icon} /></span>
                      <span><b>{text(a)}</b><small>{ago(a.at)}</small></span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="a-card">
              <div className="a-card-head"><h2>Quick Actions</h2></div>
              <div className="quick">
                {[
                  ['calendar', 'orange', 'Create Event', 'events?new=1'],
                  ['file', 'blue', 'Review Applications', 'applications?status=open'],
                  ['users', 'green', 'Add Member', 'members?new=1'],
                  ['chat', 'red', 'View Enquiries', 'enquiries'],
                ].map(([icon, tone, text, hash]) => (
                  <a key={text} className={`quick-btn ${tone}`} href={`#${hash}`}>
                    <span className={`a-ic sm ${tone}`}><Icon name={icon} /></span>{text}<Icon name="arrow-right" className="go" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </ViewState>
  );
}
