// Membership application: 3 steps on one page, draft kept in sessionStorage until submitted.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { Field, FormError, Select } from '../components/forms.jsx';
import { api, meta } from '../lib/api.js';
import { useTitle } from '../lib/hooks.js';

const KEY = 'heh-application-draft';
const HERO = {
  1: ['Apply', 'Begin Your HEH Journey', 'Share a few details about yourself and your business to begin your membership application.'],
  2: ['Apply', 'Tell Us About Your Business', 'Help us understand your business and professional background as part of your HEH membership application.'],
  3: ['Review', 'Review Your Application', 'Please review your information carefully before submitting your application to Hyderabad Entrepreneurs Hub.'],
};
const STEP_FIELDS = {
  1: ['full_name', 'mobile', 'email', 'designation', 'linkedin'],
  2: ['company_name', 'business_category', 'year_established', 'business_location', 'website', 'turnover_range', 'business_description'],
  3: ['consent_accuracy', 'consent_terms'],
};
// Light client-side checks; the API validates everything again.
const REQUIRED = {
  1: { full_name: 'Full name is required.', mobile: 'Mobile number is required.', email: 'Email address is required.', designation: 'Current designation is required.' },
  2: { company_name: 'Company name is required.', business_category: 'Business category is required.', year_established: 'Year established is required.', business_location: 'Business location is required.', business_description: 'Business description is required.' },
};
const YEARS = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => String(new Date().getFullYear() - i));

function check(step, data) {
  const errors = {};
  for (const [k, msg] of Object.entries(REQUIRED[step])) if (!String(data[k] || '').trim()) errors[k] = msg;
  if (step === 1) {
    const digits = (data.mobile || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (data.mobile && !/^[6-9]\d{9}$/.test(digits)) errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = 'Enter a valid email address.';
  }
  if (step === 2 && data.business_description && data.business_description.trim().length < 20) {
    errors.business_description = 'Please write at least 20 characters.';
  }
  return errors;
}

function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
}

const Row = ({ icon, tone, k, v }) => (
  <div className="row">
    <Ic name={icon} tone={tone} className="sm" />
    <span className="k">{k}</span>
    <span className="v">{v || <span className="muted">—</span>}</span>
  </div>
);

const AsideItem = ({ icon, tone, title, children }) => (
  <div className="aside-item"><Ic name={icon} tone={tone} /><div><h3>{title}</h3><p>{children}</p></div></div>
);

export default function MembershipApply() {
  useTitle('Apply for Membership | Hyderabad Entrepreneurs Hub');
  const navigate = useNavigate();
  const location = useLocation();
  const [draft, setDraft] = useState(loadDraft);
  const [options, setOptions] = useState({ industries: [], turnoverRanges: [] });
  const [consent, setConsent] = useState({ consent_accuracy: false, consent_terms: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(() => {
    const d = loadDraft();
    const start = Number((location.hash.match(/step-(\d)/) || [])[1]) || 1;
    return start === 3 && !d.company_name ? 1 : start === 2 && !d.full_name ? 1 : start;
  });

  useEffect(() => { meta().then(setOptions).catch(() => {}); }, []);
  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(draft)); }, [draft]);

  const go = (n) => {
    setStep(n);
    setFormError('');
    navigate({ hash: `step-${n}` }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Field errors go next to their fields (focus the first); otherwise show the message box.
  const fail = (n, errs, message) => {
    setErrors(errs);
    const first = Object.keys(errs).find((k) => STEP_FIELDS[n].includes(k));
    if (first) setTimeout(() => document.querySelector(`[name="${first}"]`)?.focus(), 0);
    setFormError(first ? '' : message);
  };

  const val = (name) => draft[name] ?? '';
  const change = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };
  const input = (name, extra = {}) => ({ id: name, name, value: val(name), onChange: change, className: 'input', ...extra });

  const next = (n) => (e) => {
    e.preventDefault();
    const errs = check(n, draft);
    if (Object.keys(errs).length) return fail(n, errs, 'Please check the highlighted fields.');
    setErrors({});
    go(n + 1);
  };

  const clearStep1 = () => {
    setDraft((d) => {
      const copy = { ...d };
      for (const k of STEP_FIELDS[1]) delete copy[k];
      return copy;
    });
    setErrors({});
    setFormError('');
  };

  async function submitApplication(e) {
    e.preventDefault();
    const missing = {};
    if (!consent.consent_accuracy) missing.consent_accuracy = 'Please confirm the information is accurate.';
    if (!consent.consent_terms) missing.consent_terms = 'Please confirm you understand the membership terms.';
    if (Object.keys(missing).length) return fail(3, missing, 'Please accept the declaration.');

    setErrors({});
    setFormError('');
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      const res = await api('/applications', { method: 'POST', body: { ...body, ...consent } });
      sessionStorage.removeItem(KEY);
      navigate(`/membership-submitted?ref=${encodeURIComponent(res.ref)}&t=${res.token}`);
    } catch (err) {
      setBusy(false);
      const errs = err.errors || {};
      // Send the user back to the step that holds the first invalid field.
      const keys = Object.keys(errs);
      const n = keys.some((k) => STEP_FIELDS[1].includes(k)) ? 1 : keys.some((k) => STEP_FIELDS[2].includes(k)) ? 2 : 3;
      if (n < 3) go(n);
      fail(n, errs, err.message);
    }
  }

  const [crumb, title, lead] = HERO[step];
  const d = draft;
  const asideFor = (steps) => !steps.includes(step);
  const CheckBox = ({ name, children, style }) => (
    <label className={`check${errors[name] ? ' invalid' : ''}`} style={style}>
      <input type="checkbox" name={name} checked={consent[name]} onChange={(e) => setConsent((c) => ({ ...c, [name]: e.target.checked }))} /> {children}
      {errors[name] && <span className="err">{errors[name]}</span>}
    </label>
  );

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 30 }}>
        <div className="container hero-grid">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/membership">Membership</Link><Icon name="chevron-right" />
              <span>
                {step === 3
                  ? <><a href="#step-1" onClick={(e) => { e.preventDefault(); go(1); }}>Apply</a> <Icon name="chevron-right" /> Review</>
                  : crumb}
              </span>
            </nav>
            <span className="eyebrow rule">HEH Membership Application</span>
            <h1>{title}</h1>
            <p className="lead" style={{ maxWidth: 880 }}>{lead}</p>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 48, marginTop: -6 }}>
        <div className="container split">
          <div>
            <div className="panel pad">
              <div className="stepper" style={{ marginBottom: 0 }}>
                {['Personal Details', 'Business Details', 'Review & Submit'].map((label, i) => {
                  const n = i + 1;
                  return (
                    <div key={n} className={`s${n < step ? ' done' : ''}${n === step ? ' current' : ''}`}>
                      <span className="dot">{n < step ? <Icon name="check" /> : `0${n}`}</span>{label}
                    </div>
                  );
                })}
              </div>

              {step === 1 && (
                <form noValidate style={{ marginTop: 26 }} onSubmit={next(1)}>
                  <h2 className="title sm">Tell Us About Yourself</h2>
                  <p style={{ margin: '12px 0 22px' }}>Please provide your personal information to begin your membership application.</p>
                  <div className="form-grid">
                    <Field label={<>Full Name <span className="req">*</span></>} htmlFor="full_name" error={errors.full_name}>
                      <div className="input-wrap boxed"><Icon name="user" /><input {...input('full_name', { maxLength: 120, autoComplete: 'name', placeholder: 'Enter your full name' })} /></div>
                    </Field>
                    <Field label={<>Mobile Number <span className="req">*</span></>} htmlFor="mobile" error={errors.mobile}>
                      <div className="input-wrap"><span className="prefix"><span className="flag" />+91</span><input {...input('mobile', { type: 'tel', inputMode: 'numeric', maxLength: 14, autoComplete: 'tel-national', placeholder: 'Enter your mobile number' })} /></div>
                    </Field>
                    <Field label={<>Email Address <span className="req">*</span></>} htmlFor="email" error={errors.email}>
                      <div className="input-wrap boxed"><Icon name="mail" /><input {...input('email', { type: 'email', maxLength: 160, autoComplete: 'email', placeholder: 'Enter your email address' })} /></div>
                    </Field>
                    <Field label={<>Current Designation <span className="req">*</span></>} htmlFor="designation" error={errors.designation}>
                      <div className="input-wrap boxed"><Icon name="briefcase" /><input {...input('designation', { maxLength: 120, autoComplete: 'organization-title', placeholder: 'Enter your current designation' })} /></div>
                    </Field>
                    <Field label={<>LinkedIn Profile <span className="opt">(Optional)</span></>} htmlFor="linkedin" error={errors.linkedin} className="full">
                      <div className="input-wrap boxed"><Icon name="linkedin" className="li" /><input {...input('linkedin', { maxLength: 300, placeholder: 'Enter your LinkedIn profile URL (e.g. https://www.linkedin.com/in/yourname)' })} /></div>
                    </Field>
                  </div>
                  <FormError message={formError} style={{ marginTop: 16 }} />
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={clearStep1}>Clear Form</button>
                    <button className="btn btn-primary" type="submit">Continue <Icon name="arrow-right" /></button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form noValidate style={{ marginTop: 26 }} onSubmit={next(2)}>
                  <h2 className="title sm">Tell Us About Your Business</h2>
                  <p style={{ margin: '12px 0 22px' }}>Please provide your business information to continue your membership application.</p>
                  <div className="form-grid">
                    <Field label={<>Company Name <span className="req">*</span></>} htmlFor="company_name" error={errors.company_name}>
                      <div className="input-wrap"><Icon name="building" /><input {...input('company_name', { maxLength: 160, autoComplete: 'organization', placeholder: 'Enter your company name' })} /></div>
                    </Field>
                    <Field label={<>Business Category <span className="req">*</span></>} htmlFor="business_category" error={errors.business_category}>
                      <div className="input-wrap"><Icon name="tag" /><Select {...input('business_category')} options={options.industries} placeholder="Select business category" /></div>
                    </Field>
                    <Field label={<>Year Established <span className="req">*</span></>} htmlFor="year_established" error={errors.year_established}>
                      <div className="input-wrap"><Icon name="calendar" /><Select {...input('year_established')} options={YEARS} placeholder="Select year" /></div>
                    </Field>
                    <Field label={<>Business Location <span className="req">*</span></>} htmlFor="business_location" error={errors.business_location}>
                      <div className="input-wrap"><Icon name="pin" /><input {...input('business_location', { maxLength: 160, placeholder: 'Enter your business location (City, State)' })} /></div>
                    </Field>
                    <Field label={<>Company Website <span className="opt">(Optional)</span></>} htmlFor="website" error={errors.website}>
                      <div className="input-wrap"><Icon name="link" /><input {...input('website', { maxLength: 300, placeholder: 'https://www.example.com' })} /></div>
                    </Field>
                    <Field label="Annual Turnover Range" htmlFor="turnover_range" error={errors.turnover_range}>
                      <div className="input-wrap"><Icon name="chart" /><Select {...input('turnover_range')} options={options.turnoverRanges} placeholder="Select annual turnover range" /></div>
                    </Field>
                    <Field label={<>Business Description <span className="req">*</span></>} htmlFor="business_description" error={errors.business_description} className="full">
                      <div className="input-wrap textarea">
                        <Icon name="file" />
                        <textarea {...input('business_description', { maxLength: 500, rows: 3, style: { minHeight: 84 }, placeholder: 'Briefly describe your business, products or services, and your target market.' })} />
                        <span className="counter">{val('business_description').length} / 500</span>
                      </div>
                    </Field>
                  </div>
                  <FormError message={formError} style={{ marginTop: 16 }} />
                  <div className="form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => go(1)}><Icon name="arrow-left" /> Previous</button>
                    <button className="btn btn-primary" type="submit">Continue <Icon name="arrow-right" /></button>
                  </div>
                </form>
              )}
            </div>

            {step === 3 && (
              <form noValidate onSubmit={submitApplication}>
                <div className="panel pad" style={{ marginTop: 12 }}>
                  <div className="panel-head"><h2 className="title sm">Personal Information</h2><button className="btn btn-outline btn-sm" type="button" onClick={() => go(1)}><Icon name="edit" /> Edit Personal Details</button></div>
                  <div className="kv">
                    <div className="col">
                      <Row icon="user" tone="blue" k="Full Name" v={d.full_name} />
                      <Row icon="mail" tone="blue" k="Email Address" v={d.email} />
                      <Row icon="linkedin" tone="blue" k="LinkedIn Profile" v={d.linkedin} />
                    </div>
                    <div className="col">
                      <Row icon="phone" tone="" k="Mobile Number" v={d.mobile ? `+91 ${d.mobile.replace(/^\+?91\s?/, '')}` : ''} />
                      <Row icon="briefcase" tone="blue" k="Current Designation" v={d.designation} />
                    </div>
                  </div>
                </div>
                <div className="panel pad" style={{ marginTop: 12 }}>
                  <div className="panel-head"><h2 className="title sm">Business Information</h2><button className="btn btn-outline btn-sm" type="button" onClick={() => go(2)}><Icon name="edit" /> Edit Business Details</button></div>
                  <div className="kv">
                    <div className="col">
                      <Row icon="building" tone="blue" k="Company Name" v={d.company_name} />
                      <Row icon="tag" tone="" k="Business Category" v={d.business_category} />
                      <Row icon="calendar" tone="blue" k="Year Established" v={d.year_established} />
                      <Row icon="pin" tone="green" k="Business Location" v={d.business_location} />
                    </div>
                    <div className="col">
                      <Row icon="globe" tone="green" k="Company Website" v={d.website} />
                      <Row icon="chart" tone="purple" k="Annual Turnover Range" v={d.turnover_range} />
                      <Row icon="file" tone="blue" k="Business Description" v={d.business_description} />
                    </div>
                  </div>
                </div>
                <div className="panel pad" style={{ marginTop: 12 }}>
                  <h2 className="title sm" style={{ marginBottom: 16 }}>Declaration</h2>
                  {CheckBox({ name: 'consent_accuracy', children: 'I confirm that the information provided in this application is accurate and complete to the best of my knowledge.' })}
                  {CheckBox({ name: 'consent_terms', style: { marginTop: 10 }, children: 'I understand that submitting this application does not guarantee HEH membership and that approval is subject to the applicable membership guidelines, category availability and decision of the HEH Membership Committee.' })}
                  <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>Your information is used only to evaluate your membership application and is not shared publicly.</p>
                </div>
                <FormError message={formError} style={{ marginTop: 14 }} />
                <div className="form-actions" style={{ borderTop: 0 }}>
                  <button className="btn btn-outline" type="button" onClick={() => go(2)}><Icon name="arrow-left" /> Previous</button>
                  <button className="btn btn-primary" type="submit" disabled={busy}>Submit Application <Icon name="arrow-right" /></button>
                </div>
              </form>
            )}
          </div>

          <aside className="panel soft pad">
            <div hidden={asideFor([1, 2])}>
              <h2 className="title sm" style={{ fontSize: 24 }}>Why We Need This Information?</h2>
              <div hidden={asideFor([1])}>
                <p style={{ marginTop: 20, fontSize: 15.5, color: 'var(--muted)', paddingBottom: 20, borderBottom: '1px solid #f1d8c5' }}>Your information will be reviewed by the HEH Membership Committee to understand your background and business profile.</p>
                <div className="aside-list">
                  <AsideItem icon="shield" tone="blue" title="Secure & Confidential">Your information is kept secure and used only for membership review.</AsideItem>
                  <AsideItem icon="users" title="Committee Review">All applications are carefully evaluated by the HEH Membership Committee.</AsideItem>
                  <AsideItem icon="file" tone="green" title="Next Step">After submitting this section, you will be asked to provide your business details.</AsideItem>
                </div>
              </div>
              <div hidden={asideFor([2])}>
                <div className="aside-list">
                  <AsideItem icon="chart" tone="blue" title="Business Understanding">Helps HEH understand your industry, business background and professional expertise.</AsideItem>
                  <AsideItem icon="users" title="Membership Evaluation">Allows the Membership Committee to review applications according to HEH guidelines.</AsideItem>
                  <AsideItem icon="handshake" tone="green" title="Business Networking">Helps HEH understand the different industries represented within the community.</AsideItem>
                </div>
                <div className="notice lg" style={{ marginTop: 24, background: '#fdeee2' }}>
                  <Icon name="info" />
                  <div><h3 style={{ fontSize: 18 }}>Important</h3><p style={{ fontSize: 14.5 }}>Your business information is kept confidential and is used only for membership evaluation purposes by the HEH Membership Committee.</p></div>
                </div>
              </div>
            </div>
            <div hidden={asideFor([3])}>
              <h2 className="title sm" style={{ fontSize: 24 }}>Application Guidelines</h2>
              <div className="aside-list">
                <AsideItem icon="lock" tone="blue" title="Secure Submission">Your information is kept secure and confidential.</AsideItem>
                <AsideItem icon="users" title="Committee Review">Your application will be reviewed by the HEH Membership Committee.</AsideItem>
                <AsideItem icon="info" tone="green" title="Further Discussion">The committee may reach out for additional information or a discussion.</AsideItem>
                <AsideItem icon="mail" tone="purple" title="Decision Update">You will be notified about the membership decision via email or phone.</AsideItem>
              </div>
              <div style={{ marginTop: 26, paddingTop: 24, borderTop: '1px solid #f1d8c5' }}>
                <h2 className="title sm" style={{ fontSize: 24 }}>Need Help?</h2>
                <p style={{ margin: '14px 0 20px', fontSize: 15.5 }}>If you have any questions about the membership application, feel free to contact the HEH team.</p>
                <Link className="btn btn-outline btn-block" to="/contact?type=Membership">Contact HEH <Icon name="arrow-right" /></Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
