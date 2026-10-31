import { useAdmin, useLoad, ViewState } from './Admin.jsx';

export default function Dashboard() {
  const { call, go } = useAdmin();
  const state = useLoad(() => call('/summary'));
  const Card = ({ n, text, tab }) => <div className="stat" onClick={() => go(tab)}><b>{n}</b><span>{text}</span></div>;

  return (
    <ViewState state={state}>
      {(s) => (
        <>
          <h1>Dashboard</h1>
          <div className="stats">
            <Card n={s.new_applications} text="New membership applications" tab="applications" />
            <Card n={s.new_enquiries} text="New enquiries" tab="enquiries" />
            <Card n={s.upcoming_registrations} text="Registrations for upcoming events" tab="registrations" />
            <Card n={s.upcoming_events} text="Upcoming events" tab="events" />
            <Card n={s.active_members} text="Active members" tab="members" />
            <Card n={s.published_stories} text="Published stories" tab="stories" />
          </div>
          <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
            New items have status “Received”. Open a list, click a row to see full details, and change the status as you follow up.
          </p>
        </>
      )}
    </ViewState>
  );
}
