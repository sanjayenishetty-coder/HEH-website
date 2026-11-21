import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { Field, FormError, useSubmit } from '../components/forms.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';

const Req = () => <span className="req">*</span>;

function Strip({ e, error, open }) {
  if (error) return <div style={{ gridColumn: '1/-1' }}>{error.status === 404 ? 'This event could not be found.' : error.message}</div>;
  if (!e) return <div className="loading" style={{ gridColumn: '1/-1', padding: 10 }}>Loading event…</div>;
  return (
    <>
      <div>
        <span className="badge caps">{e.category === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight'}</span>
        <h3>{e.title}</h3>
        <p style={{ fontSize: 15.5 }}>{e.short_description || ''}</p>
      </div>
      <div className="m"><b><Icon name="calendar" /> Date</b><span>{fmt.date(e.event_date)}</span></div>
      <div className="m"><b><Icon name="clock" /> Time</b><span>{fmt.timeRange(e.start_time, e.end_time)}</span></div>
      <div className="m"><b><Icon name="pin" /> Venue</b><span>{e.venue_name || 'Venue will be updated'}</span></div>
      <div><span className={`status-pill${open ? '' : ' closed'}`}>{open ? 'Registration Open' : 'Registration Closed'}</span></div>
    </>
  );
}

export default function EventRegister() {
  const slug = useParam('e');
  const navigate = useNavigate();
  const { data: e, error } = useApi(slug ? `/events/${encodeURIComponent(slug)}` : null);
  const { errors, formError, busy, submit } = useSubmit();
  useTitle(e ? `Register: ${e.title} | Hyderabad Entrepreneurs Hub` : 'Event Registration | Hyderabad Entrepreneurs Hub');

  useEffect(() => { if (!slug) navigate('/events', { replace: true }); }, [slug, navigate]);

  const open = !!e && e.registration_open && !e.is_past;
  const closed = !!e && !open;

  async function onSubmit(ev) {
    const res = await submit(ev, `/events/${encodeURIComponent(slug)}/register`);
    if (res) navigate(`/registration-confirmed?ref=${encodeURIComponent(res.ref)}&t=${res.token}`);
  }

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 22 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/events">Events</Link><Icon name="chevron-right" /><span>Event Registration</span>
          </nav>
          <h1 style={{ marginTop: 26 }}>Register for an HEH Event</h1>
          <p className="lead" style={{ maxWidth: 640 }}>Confirm your participation and connect with fellow entrepreneurs at our upcoming HEH gathering.</p>
          <div className="panel event-strip" style={{ marginTop: 28 }}><Strip e={e} error={error} open={open} /></div>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 40 }}>
        <div className="container">
          <form className="panel pad" id="register" noValidate onSubmit={onSubmit} hidden={!!error}>
            <h2 className="title">Confirm Your Participation</h2>
            <p style={{ margin: '10px 0 24px' }}>Please provide your details to register for this event.</p>
            <fieldset disabled={closed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <div className="form-grid">
                <Field className="sans" htmlFor="full_name" label={<><b>Full Name</b> <Req /></>} error={errors.full_name}>
                  <input className="input" id="full_name" name="full_name" maxLength={120} autoComplete="name" placeholder="Enter your full name" />
                </Field>
                <Field className="sans" htmlFor="mobile" label={<><b>Mobile Number</b> <Req /></>} error={errors.mobile}>
                  <div className="input-wrap">
                    <span className="prefix">+91 <span style={{ fontSize: 12.8, display: 'inline-flex' }}><Icon name="chevron-down" /></span></span>
                    <input className="input" id="mobile" name="mobile" type="tel" inputMode="numeric" maxLength={14} autoComplete="tel-national" placeholder="Enter your mobile number" />
                  </div>
                </Field>
                <Field className="sans" htmlFor="company" label={<><b>Company Name</b> <Req /></>} error={errors.company}>
                  <input className="input" id="company" name="company" maxLength={160} autoComplete="organization" placeholder="Enter your company name" />
                </Field>
                <Field className="sans" htmlFor="membership_id" label={<><b>Membership ID</b> <Req /></>} error={errors.membership_id}>
                  <input className="input" id="membership_id" name="membership_id" maxLength={40} placeholder="Enter your HEH membership ID" />
                </Field>
                <Field className="sans" htmlFor="email" label={<b>Email Address</b>} error={errors.email}>
                  <input className="input" id="email" name="email" type="email" maxLength={160} autoComplete="email" placeholder="Enter your email address (optional)" />
                </Field>
              </div>
              <label className={`check${errors.consent ? ' invalid' : ''}`} style={{ marginTop: 24 }}>
                <input type="checkbox" name="consent" /> I confirm my participation in this HEH event and agree to the applicable event guidelines.
                {errors.consent && <span className="err">{errors.consent}</span>}
              </label>
            </fieldset>
            <FormError style={{ marginTop: 16 }} message={closed ? e.registration_note || 'Registration for this event is closed.' : formError} />
            <div className="btn-row" style={{ marginTop: 26 }}>
              <button className="btn btn-primary" type="submit" style={{ minWidth: 270 }} disabled={busy || closed}>
                Confirm Registration <Icon name="arrow-right" />
              </button>
              <Link className="btn btn-outline" to={slug ? `/event?e=${encodeURIComponent(slug)}` : '/events'} style={{ minWidth: 230 }}>Back to Event Details</Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
