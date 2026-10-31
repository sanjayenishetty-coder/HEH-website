import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { CountedTextarea, Field, FormError, Select, useSubmit } from '../components/forms.jsx';
import { meta } from '../lib/api.js';
import { useParam, useTitle } from '../lib/hooks.js';

const req = <span className="req">*</span>;

export default function Contact() {
  useTitle('Contact Us | Hyderabad Entrepreneurs Hub');
  const navigate = useNavigate();
  const wanted = useParam('type');
  const [types, setTypes] = useState([]);
  const [type, setType] = useState('');
  const [formKey, setFormKey] = useState(0);
  const { errors, setErrors, formError, setFormError, busy, submit } = useSubmit();

  useEffect(() => {
    meta().then((m) => {
      setTypes(m.enquiryTypes);
      if (wanted && m.enquiryTypes.includes(wanted)) setType(wanted);
    }).catch(() => {});
  }, [wanted]);

  async function onSubmit(e) {
    const res = await submit(e, '/enquiries');
    if (res) navigate(`/enquiry-submitted?ref=${encodeURIComponent(res.ref)}&t=${res.token}`);
  }

  // Clear Form: remount the form so every field and the counter start empty.
  function onReset(e) {
    e.preventDefault();
    setFormKey((k) => k + 1);
    setType('');
    setErrors({});
    setFormError('');
  }

  return (
    <>
      <section className="page-hero">
        <div className="container hero-grid">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><Icon name="chevron-right" /><span>Contact Us</span></nav>
            <span className="eyebrow rule" style={{ marginTop: 22 }}>Contact HEH</span>
            <h1>Let’s Connect &amp;<br />Grow Together.</h1>
            <p className="lead" style={{ maxWidth: 540 }}>Have a question about HEH, membership or business collaboration? We’d be happy to hear from you.</p>
          </div>
          <div className="hero-tagline"><span>Connect</span><span>Collaborate</span><span>Grow</span></div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title" style={{ marginBottom: 22 }}>Get in Touch</h2>
          <div className="contact-cards">
            <div className="panel contact-card"><Ic name="mail" /><div><h3>Email Us</h3><p>For membership, business collaborations and general enquiries.</p><a className="big" href="mailto:info@heh.in">info@heh.in</a></div></div>
            <div className="panel contact-card"><Ic name="phone" /><div><h3>Call Us</h3><p>Speak with our team during business hours.</p><a className="big" href="tel:+919876543210">+91 98765 43210</a></div></div>
            <div className="panel contact-card"><Ic name="pin" /><div><h3>Our Location</h3><p style={{ fontSize: 15, color: 'var(--ink)' }}>Hyderabad, Telangana<br />India</p></div></div>
          </div>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 48 }}>
        <div className="container contact-layout">
          <form key={formKey} className="panel pad" id="enquiry" noValidate onSubmit={onSubmit} onReset={onReset}>
            <h2 className="title">Send Us a Message</h2>
            <p style={{ margin: '12px 0 24px' }}>Complete the form below and our team will get back to you.</p>
            <div className="form-grid">
              <Field label={<>Full Name {req}</>} htmlFor="full_name" error={errors.full_name}>
                <input className="input" id="full_name" name="full_name" maxLength={120} autoComplete="name" placeholder="Enter your full name" />
              </Field>
              <Field label={<>Mobile Number {req}</>} htmlFor="mobile" error={errors.mobile}>
                <input className="input" id="mobile" name="mobile" type="tel" maxLength={16} autoComplete="tel" placeholder="Enter your mobile number" />
              </Field>
              <Field label={<>Email Address {req}</>} htmlFor="email" error={errors.email}>
                <input className="input" id="email" name="email" type="email" maxLength={160} autoComplete="email" placeholder="Enter your email address" />
              </Field>
              <Field label="Company Name" htmlFor="company" error={errors.company}>
                <input className="input" id="company" name="company" maxLength={160} autoComplete="organization" placeholder="Enter your company name" />
              </Field>
              <Field label={<>Enquiry Type {req}</>} htmlFor="enquiry_type" error={errors.enquiry_type} className="full">
                <Select className="input" id="enquiry_type" name="enquiry_type" value={type} onChange={(e) => setType(e.target.value)} options={types} placeholder="Select enquiry type" />
              </Field>
              <Field label={<>Your Message {req}</>} htmlFor="message" error={errors.message} className="full">
                <div style={{ position: 'relative' }}>
                  <CountedTextarea className="input" id="message" name="message" maxLength={500} placeholder="Tell us how we can help you..." />
                </div>
              </Field>
            </div>
            <FormError message={formError} style={{ marginTop: 16 }} />
            <div className="btn-row" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" type="submit" disabled={busy} style={{ minWidth: 190 }}>Send Message <Icon name="arrow-right" /></button>
              <button className="btn btn-outline" type="reset" style={{ minWidth: 160 }}>Clear Form</button>
            </div>
          </form>

          <aside className="panel pad">
            <h2 className="title sm">Our Location</h2>
            <iframe className="map-frame" style={{ marginTop: 18 }} title="Map of Hyderabad, Telangana" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Hyderabad,+Telangana,+India&z=11&output=embed" />
            <div className="office">
              <div className="row"><Icon name="building" /><div><h3>Visit Our Office</h3><p>Hyderabad, Telangana<br />India</p></div></div>
              <div className="row"><Icon name="clock" /><div><h3>Business Hours</h3><p>Monday - Saturday<br />9:00 AM - 6:00 PM</p></div></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <Ic name="users" />
          <div className="copy">
            <h2>Become Part of the HEH Community</h2>
            <p>Join a trusted network of entrepreneurs committed to building meaningful relationships, sharing knowledge and creating opportunities.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership">Explore Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/membership-apply">Become a Member</Link>
          </div>
        </div>
      </section>
    </>
  );
}
