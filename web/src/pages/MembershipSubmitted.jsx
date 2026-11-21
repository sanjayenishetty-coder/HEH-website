import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';
import { ICONS } from '../lib/icons.js';
import { STATIC } from '../lib/static.js';

const STATUS = { received: 'Received', under_review: 'Under Review', interaction: 'Interaction', approved: 'Approved', rejected: 'Not Approved' };

const JOURNEY = [
  ['file-edit', '', 'Application Received', 'Your application has been submitted.'],
  ['users', 'blue', 'Committee Review', 'HEH evaluates your application.'],
  ['chat', 'blue', 'Interaction', 'Additional discussion, if required.'],
  ['check', 'blue', 'Decision', 'HEH communicates its decision.'],
];

const Row = ({ icon, tone = '', k, children }) => (
  <div className="row"><Ic name={icon} tone={tone} /><span className="k">{k}</span><span className="v">{children}</span></div>
);

function readSent(ref) {
  try {
    const s = JSON.parse(sessionStorage.getItem('heh-application-sent'));
    return s && s.ref === ref ? s : null;
  } catch { return null; }
}

export default function MembershipSubmitted() {
  useTitle('Application Submitted | Hyderabad Entrepreneurs Hub');
  const ref = useParam('ref') || '';
  const t = useParam('t') || '';
  const api = useApi(STATIC ? null : `/applications/${encodeURIComponent(ref)}?t=${encodeURIComponent(t)}`);
  // Website-only build: no database, so show what this tab just sent (lib/static.js sendApplication).
  const a = STATIC ? readSent(ref) : api.data;
  const loading = STATIC ? false : api.loading;

  return (
    <>
      <section className="page-hero center" style={{ paddingBottom: 36 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb" style={{ justifyContent: 'flex-start' }}>
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/membership">Membership</Link><Icon name="chevron-right" />
            <Link to="/membership-apply">Apply</Link><Icon name="chevron-right" /><span>Application Submitted</span>
          </nav>
          <div className="success-mark" style={{ marginTop: 20 }}>
            <Icon name="check" />
            {Array.from({ length: 6 }, (_, i) => <span className="ray" key={i} />)}
          </div>
          <span className="eyebrow" style={{ letterSpacing: '.02em' }}>Application Submitted</span>
          <h1>Thank You for Your<br />Interest in HEH!</h1>
          <p className="lead">Your membership application has been successfully submitted to Hyderabad Entrepreneurs Hub.</p>
          <p className="muted" style={{ margin: '12px auto 0', maxWidth: 480 }}>Our Membership Committee will review your application and communicate the next steps.</p>
          <span className="status-pill" style={{ marginTop: 20, padding: '10px 20px', borderRadius: 999, border: '1px solid #cfe9d6' }}>
            <Icon name="check-circle" /> Application Received
          </span>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="panel pad">
            <h2 className="title sm" style={{ marginBottom: 20 }}>Your Application Details</h2>
            <div className="dtable">
              {loading ? <div className="loading">Loading your application…</div>
                : a ? (
                  <>
                    <Row icon="file" k="Application Reference">{a.ref}</Row>
                    <Row icon="user" tone="blue" k="Applicant Name">{a.full_name}</Row>
                    <Row icon="building" tone="purple" k="Company Name">{a.company_name}</Row>
                    <Row icon="tag" k="Business Category">{a.business_category}</Row>
                    <Row icon="calendar" tone="blue" k="Submission Date">{fmt.stamp(a.created_at)}</Row>
                    <Row icon="star" tone="green" k="Application Status"><span className="badge green lg">{STATUS[a.status] || a.status}</span></Row>
                  </>
                ) : (
                  <div className="empty" style={{ border: 0 }}>We could not find this application. If you submitted one, our team has received it and will contact you.</div>
                )}
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title sm" style={{ marginBottom: 26 }}>Your Membership Journey</h2>
          <div className="journey cards" style={{ '--n': 4 }}>
            {JOURNEY.map(([icon, tone, title, text], i) => (
              <div className={`step${i === 0 ? ' current' : ''}`} key={title}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <Ic name={icon} tone={tone} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="notice lg" style={{ marginTop: 26 }}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 44, height: 44 }} dangerouslySetInnerHTML={{ __html: ICONS.info }} />
            <span className="divider" />
            <div><h3>Please Note</h3><p>Your application is subject to HEH membership eligibility guidelines, category availability and approval by the HEH Membership Committee. Submitting an application does not automatically grant membership.</p></div>
          </div>
          <div className="btn-row center" style={{ margin: '30px 0 20px' }}>
            <Link className="btn btn-primary" to="/" style={{ minWidth: 230 }}>Back to Home <Icon name="arrow-right" /></Link>
            {STATIC
              ? <Link className="btn btn-outline" to="/our-members" style={{ minWidth: 240 }}>Meet the Board Members</Link>
              : <Link className="btn btn-outline" to="/events" style={{ minWidth: 240 }}>Explore HEH Events</Link>}
          </div>
        </div>
      </section>
    </>
  );
}
