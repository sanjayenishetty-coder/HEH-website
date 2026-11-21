import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';

const STATUS = { pending: 'Pending Approval', confirmed: 'Confirmed', rejected: 'Not Confirmed', cancelled: 'Cancelled', attended: 'Attended' };

const Row = ({ icon, k, children }) => (
  <div className="row"><Icon name={icon} /><span className="k">{k}</span><span className="v">{children}</span></div>
);

const venueKnown = (r) => r.venue_name && !/to be announced/i.test(r.venue_name);

export default function RegistrationConfirmed() {
  useTitle('Registration Confirmed | Hyderabad Entrepreneurs Hub');
  const ref = useParam('ref') || '';
  const t = useParam('t') || '';
  const { data: r, error } = useApi(`/registrations/${encodeURIComponent(ref)}?t=${encodeURIComponent(t)}`);

  let details;
  if (error) details = <div className="empty" style={{ gridColumn: '1/-1', border: 0 }}>We could not find this registration. Please check the link from your confirmation, or contact HEH.</div>;
  else if (!r) details = <div className="loading" style={{ gridColumn: '1/-1' }}>Loading your registration…</div>;
  else {
    const d = r.event_date;
    details = (
      <>
        <div className="col">
          <Row icon="ticket" k="Registration ID">{r.ref}</Row>
          <Row icon="user" k="Participant Name">{r.full_name}</Row>
          <Row icon="building" k="Company Name">{r.company}</Row>
          <Row icon="tag" k="Event Name"><Link to={`/event?e=${encodeURIComponent(r.event_slug)}`}>{r.event_title}</Link></Row>
          <Row icon="users" k="Event Category"><span className="badge caps">{r.event_category === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight'}</span></Row>
        </div>
        <div className="col">
          <Row icon="calendar" k="Event Date">{d ? `${fmt.shortDay(d)}, ${fmt.date(d)}` : 'Date will be updated'}</Row>
          <Row icon="clock" k="Event Time">{fmt.timeRange(r.start_time, r.end_time)}</Row>
          <Row icon="pin" k="Venue">{r.venue_name || 'To Be Announced'}<br />{r.venue_address || 'Hyderabad'}</Row>
          <Row icon="check-circle" k="Registration Status"><span className={`badge caps ${r.status === 'pending' ? 'orange' : 'green'} lg`}>{STATUS[r.status] || r.status}</span></Row>
        </div>
      </>
    );
  }

  // Events that need approval: the registration waits for the HEH team before it is confirmed.
  const pending = r?.status === 'pending';
  const directions = r && venueKnown(r)
    ? r.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.venue_name}, ${r.venue_address}`)}`
    : null;

  return (
    <>
      <section className="page-hero center" style={{ paddingBottom: 30 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/events">Events</Link><Icon name="chevron-right" />
            <span>Event Registration</span><Icon name="chevron-right" /><span>Registration Confirmed</span>
          </nav>
          <div className="success-mark solid" style={{ marginTop: 26 }}><Icon name="check" /></div>
          <h1>{pending ? 'Registration Received!' : 'Registration Confirmed!'}</h1>
          <p className="lead" style={{ maxWidth: 600 }}>
            {pending
              ? 'Thank you for registering. The HEH team will review your registration and confirm it shortly.'
              : 'Thank you for registering. We look forward to welcoming you to our upcoming HEH event.'}
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="panel pad">
            <h2 className="title" style={{ marginBottom: 18 }}>Your Event Registration</h2>
            <div className="reg-grid">{details}</div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="panel blue pad">
            <h2 className="title" style={{ marginBottom: 24 }}>Before You Attend</h2>
            <div className="tips">
              <div><Ic name="clock" /><div><h3>Arrive on Time</h3><p>Please reach the venue on time to make the most of the session.</p></div></div>
              <div><Ic name="file" /><div><h3>Keep Your Confirmation</h3><p>Have your registration confirmation available at the venue.</p></div></div>
              <div><Ic name="users" /><div><h3>Follow Event Guidelines</h3><p>Please follow the event participation guidelines shared by HEH.</p></div></div>
            </div>
          </div>
          <div className="btn-row center" style={{ margin: '26px 0 20px' }}>
            <Link className="btn btn-primary" to="/events" style={{ minWidth: 240 }}>Back to Events <Icon name="arrow-right" /></Link>
            {directions && (
              <a className="btn btn-outline" href={directions} target="_blank" rel="noopener" style={{ minWidth: 240 }}>
                <Icon name="pin" /> Get Directions <Icon name="arrow-right" />
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
