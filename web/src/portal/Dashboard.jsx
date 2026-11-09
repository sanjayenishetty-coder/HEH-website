// Dashboard: Overview, Events, Networking and Activities tabs (designs 47, 51, 53, 71).
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';
import {
  Avatar, Card, DateBox, Empty, EventMeta, Load, Stat, StatusPill, Tabs, ViewAll, eventState, useAction, useData,
} from './parts.jsx';
import { ActivityList } from './Feed.jsx';

const TABS = [['overview', 'Overview', 'grid'], ['events', 'Events', 'calendar'], ['networking', 'Networking', 'network'], ['activities', 'Activities', 'chart']];

export default function Dashboard({ query }) {
  const { me } = usePortal();
  const [tab, setTab] = useState(TABS.some(([k]) => k === query.get('tab')) ? query.get('tab') : 'overview');
  const state = useData('/dashboard');
  return (
    <>
      <div className="p-welcome">
        <p>Welcome back,</p>
        <h1>{me.full_name}</h1>
        <p className="role">{me.designation || 'Entrepreneur'} <i>|</i> HEH Member</p>
      </div>
      <Tabs items={TABS} value={tab} onChange={(t) => { setTab(t); window.history.replaceState(null, '', `#dashboard?tab=${t}`); }} />
      <Load state={state}>
        {(d) => (
          <>
            {tab === 'overview' && <Overview d={d} />}
            {tab === 'events' && <EventsTab d={d} />}
            {tab === 'networking' && <Networking d={d} reload={state.reload} />}
            {tab === 'activities' && <Activities d={d} />}
          </>
        )}
      </Load>
    </>
  );
}

function Overview({ d }) {
  const e = d.next_event;
  return (
    <>
      <div className="p-stats">
        <Stat icon="calendar" tone="blue" label="Upcoming Events" value={d.counts.upcoming_events} href="#events" />
        <Stat icon="users" tone="orange" label="My Connections" value={d.counts.connections} href="#connections/network" />
        <Stat icon="ticket" tone="green" label="My Registrations" value={d.counts.my_registrations} href="#events/registrations" />
      </div>
      <div className="p-grid-2">
        {e ? (
          <section className="p-hero-event">
            <span className="tag">{e.my_status ? 'Your Next Event' : 'Next Upcoming Event'}</span>
            <h2>{e.title}</h2>
            <p className="meta">
              <span><Icon name="calendar" /> {fmt.shortDay(e.event_date)}, {fmt.date(e.event_date)}</span>
              <span><Icon name="clock" /> {fmt.timeRange(e.start_time, e.end_time)}</span>
            </p>
            {(e.venue_name || e.city) && <p className="meta"><span><Icon name="pin" /> {e.venue_name || e.city}</span></p>}
            <a className="p-btn" href={`#events/${e.slug}`}>View Details <Icon name="arrow-right" /></a>
          </section>
        ) : (
          <Card title="Next Upcoming Event" icon="calendar"><Empty icon="calendar">New events will appear here.</Empty></Card>
        )}
        <Card title="Recent Announcements" icon="megaphone" action={<ViewAll href="#announcements" />}>
          {d.announcements.length ? (
            <ul className="p-list dots">
              {d.announcements.map((a) => (
                <li key={a.key}><a href={`#${a.link}`}><span><b>{a.title}</b><small>{fmt.date(a.date)}</small></span><Icon name="chevron-right" /></a></li>
              ))}
            </ul>
          ) : <Empty icon="megaphone">No announcements right now.</Empty>}
        </Card>
        <Card title="Community Highlights" icon="star" action={<ViewAll href="#stories" />}>
          {d.highlight ? (
            <a className="p-highlight" href={`#${d.highlight.link}`}>
              <span className="p-ico orange big"><Icon name="chart" /></span>
              <span><b>{d.highlight.title}</b><small>{d.highlight.text}</small></span>
            </a>
          ) : <Empty icon="trophy">Member success stories will appear here.</Empty>}
        </Card>
        <Card title="Quick Actions" icon="bolt">
          <div className="p-quick">
            <a className="p-btn" href="#directory"><Icon name="users" /> Explore Members <Icon name="arrow-right" /></a>
            <a className="p-btn outline" href="#events"><Icon name="calendar" /> View All Events <Icon name="arrow-right" /></a>
          </div>
        </Card>
      </div>
    </>
  );
}

function EventsTab({ d }) {
  return (
    <>
      <div className="p-stats">
        <Stat icon="calendar" tone="blue" label="Upcoming Events" value={d.counts.upcoming_events} href="#events" />
        <Stat icon="users" tone="orange" label="My Registrations" value={d.counts.my_registrations} href="#events/registrations" />
        <Stat icon="check-circle" tone="green" label="Events Attended" value={d.counts.events_attended} href="#events/past" />
      </div>
      <div className="p-grid-2 wide-left">
        <Card title="Upcoming Events" icon="calendar" action={<ViewAll href="#events" />}>
          {d.events.length ? d.events.slice(0, 3).map((e) => {
            const [st, label] = eventState(e);
            return (
              <a key={e.id} className="p-event-row" href={`#events/${e.slug}`}>
                <DateBox date={e.event_date} small />
                <span className="body"><b>{e.title}</b><EventMeta e={e} /></span>
                <StatusPill status={st}>{label}</StatusPill>
              </a>
            );
          }) : <Empty icon="calendar">No upcoming events right now.</Empty>}
        </Card>
        <div className="p-stack">
          <Card title="My Event Registrations" icon="trophy">
            <div className="p-big"><b>{d.counts.my_registrations}</b><span>Upcoming Registrations</span>
              <a className="p-btn soft sm" href="#events/registrations">Manage Registrations <Icon name="arrow-right" /></a></div>
          </Card>
          <Card title="Recent Participation" icon="chart">
            <div className="p-big"><b>{d.counts.events_attended}</b><span>Events Attended</span>
              <a className="p-btn soft blue sm" href="#events/history">View History <Icon name="arrow-right" /></a></div>
          </Card>
        </div>
      </div>
      <div className="p-banner">
        <Icon name="megaphone" />
        <span><b>Stay Connected with HEH</b>Be a part of inspiring events, knowledge sessions and networking opportunities.</span>
        <a className="p-btn" href="#events">Explore Events <Icon name="arrow-right" /></a>
      </div>
    </>
  );
}

function Networking({ d, reload }) {
  const { call, toast } = usePortal();
  const [busy, run] = useAction();
  const answer = (id, move) => run(async () => {
    await call(`/connections/${id}/${move}`, { method: 'POST' });
    toast(move === 'accept' ? 'Connection accepted' : 'Request declined');
    reload();
  }).catch(() => {});
  return (
    <>
      <div className="p-stats">
        <Stat icon="users" tone="blue" label="My Connections" value={d.counts.connections} href="#connections/network" />
        <Stat icon="user-plus" tone="orange" label="Pending Requests" value={d.counts.received} href="#connections/received" />
        <Stat icon="handshake" tone="green" label="New This Month" value={d.counts.new_month} href="#connections" />
      </div>
      <div className="p-grid-2">
        <Card title="Connection Requests" icon="user-plus" action={<ViewAll href="#connections/received" />}>
          {d.received.length ? d.received.map((r) => (
            <div key={r.id} className="p-person-row">
              <Avatar name={r.member.full_name} photo={r.member.photo_url} size={40} />
              <a href={`#directory/${r.member.slug}`}><b>{r.member.full_name}</b><small>{[r.member.designation, r.member.company].filter(Boolean).join(', ')}</small></a>
              <button type="button" className="p-btn sm" disabled={busy} onClick={() => answer(r.id, 'accept')}>Accept</button>
              <button type="button" className="p-btn outline sm" disabled={busy} onClick={() => answer(r.id, 'decline')}>Decline</button>
            </div>
          )) : <Empty icon="user-plus">No pending requests.</Empty>}
        </Card>
        <Card title="My Connections" icon="users" action={<ViewAll href="#connections/network" />}>
          {d.recent_connections.length ? d.recent_connections.map((c) => (
            <a key={c.id} className="p-person-row link" href={`#directory/${c.member.slug}`}>
              <Avatar name={c.member.full_name} photo={c.member.photo_url} size={40} />
              <span><b>{c.member.full_name}</b><small>{c.member.industry || c.member.company}</small></span>
              <Icon name="chevron-right" />
            </a>
          )) : <Empty icon="users">Connect with members from the Member Directory.</Empty>}
        </Card>
      </div>
      <Card title="Quick Actions" icon="bolt">
        <div className="p-quick four">
          <a className="p-quick-btn" href="#directory"><Icon name="search" /> Find Members <Icon name="arrow-right" /></a>
          <a className="p-quick-btn" href="#directory"><Icon name="send" /> Send Connection <Icon name="arrow-right" /></a>
          <a className="p-quick-btn" href="#events"><Icon name="calendar" /> Network at Events <Icon name="arrow-right" /></a>
          <a className="p-quick-btn" href="#connections/network"><Icon name="users" /> View My Network <Icon name="arrow-right" /></a>
        </div>
      </Card>
    </>
  );
}

function Activities({ d }) {
  return (
    <>
      <div className="p-stats">
        <Stat icon="calendar" tone="blue" label="Events Attended" value={d.counts.events_attended} href="#events/history" />
        <Stat icon="users" tone="orange" label="Connections Made" value={d.counts.connections} href="#connections/network" />
        <Stat icon="star" tone="green" label="Recent Activities" value={d.counts.recent_activities} href="#activities" />
      </div>
      <div className="p-grid-2 wide-left">
        <Card title="Recent Activities" icon="bolt" action={<ViewAll href="#activities" />}>
          <ActivityList items={d.activities} />
        </Card>
        <div className="p-stack">
          <Card title="Event Participation" icon="trophy">
            <div className="p-big"><b>{d.counts.events_attended}</b><span>events attended<small>Be a part of more HEH events</small></span>
              <a className="p-btn soft sm" href="#events/history">View History <Icon name="arrow-right" /></a></div>
          </Card>
          <Card title="Networking Activity" icon="network">
            <div className="p-big"><b>{d.counts.new_month}</b><span>new connections<small>Grow your professional network</small></span>
              <a className="p-btn soft sm" href="#connections">Explore Network <Icon name="arrow-right" /></a></div>
          </Card>
        </div>
      </div>
    </>
  );
}

