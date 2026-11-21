import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';

const STATUS = { received: 'Received', in_progress: 'In Progress', closed: 'Closed' };

const NEXT = [
  ['', 'file-edit', 'Enquiry Received', 'Your enquiry has been successfully submitted.'],
  ['warm', 'users', 'HEH Team Reviews', 'Our team will review your message.'],
  ['green', 'phone', 'Team Gets in Touch', 'We will get back to you soon.'],
];

const Row = ({ icon, tone = '', k, children }) => (
  <div className="row"><Ic name={icon} tone={tone} /><span className="k">{k}</span><span className="v">{children}</span></div>
);

export default function EnquirySubmitted() {
  useTitle('Enquiry Received | Hyderabad Entrepreneurs Hub');
  const ref = useParam('ref') || '';
  const t = useParam('t') || '';
  const { data: q, loading } = useApi(`/enquiries/${encodeURIComponent(ref)}?t=${encodeURIComponent(t)}`);

  return (
    <>
      <section className="page-hero center" style={{ paddingBottom: 36 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/contact">Contact Us</Link><Icon name="chevron-right" /><span>Enquiry Confirmation</span>
          </nav>
          <div className="success-mark" style={{ marginTop: 24 }}>
            <Icon name="check" />
            {Array.from({ length: 6 }, (_, i) => <span className="ray" key={i} />)}
          </div>
          <h1>Thank You for<br />Reaching Out!</h1>
          <p className="lead">
            {q?.member_name
              ? `Your enquiry for ${q.member_name} has been sent to Hyderabad Entrepreneurs Hub.`
              : 'Your enquiry has been successfully submitted to Hyderabad Entrepreneurs Hub.'}
          </p>
          <p className="muted" style={{ marginTop: 12 }}>Our team will review your message and get back to you.</p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="panel pad">
            <h2 className="title sm" style={{ marginBottom: 20 }}>Your Enquiry Details</h2>
            <div className="dtable">
              {loading ? <div className="loading">Loading your enquiry…</div>
                : q ? (
                  <>
                    <Row icon="file" k="Enquiry Reference">{q.ref}</Row>
                    <Row icon="user" tone="blue" k="Full Name">{q.full_name}</Row>
                    <Row icon="building" tone="purple" k="Company Name">{q.company || '—'}</Row>
                    <Row icon="chat" k="Enquiry Type">{q.enquiry_type}</Row>
                    <Row icon="calendar" tone="blue" k="Submitted On">{fmt.stamp(q.created_at)}</Row>
                    <Row icon="star" tone="green" k="Status"><span className="badge green lg">{STATUS[q.status] || q.status}</span></Row>
                  </>
                ) : (
                  <div className="empty" style={{ border: 0 }}>We could not find this enquiry. If you sent one, our team has received it and will get back to you.</div>
                )}
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title sm">What Happens Next?</h2>
          <div className="next-steps">
            {NEXT.map(([tone, icon, title, text], i) => (
              <Fragment key={title}>
                {i > 0 && <Icon name="chevron-right" className="chev" />}
                <div className={`next-step ${tone}`.trim()}>
                  <span className="badge-ic"><b>{String(i + 1).padStart(2, '0')}</b><Icon name={icon} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="btn-row center" style={{ margin: '34px 0 20px' }}>
            <Link className="btn btn-primary" to="/" style={{ minWidth: 230 }}>Back to Home <Icon name="arrow-right" /></Link>
            <Link className="btn btn-outline" to="/membership" style={{ minWidth: 260 }}>Explore HEH Membership</Link>
          </div>
        </div>
      </section>
    </>
  );
}
