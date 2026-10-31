import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { CountedTextarea, Field, FormError, useSubmit } from '../components/forms.jsx';
import { IndustryBadge, Media } from '../components/ui.jsx';
import { useApi, useParam, useTitle } from '../lib/hooks.js';

// Member profile page + "Send Enquiry" modal (enquiries go to HEH, not directly to the member). /member?m=<slug>

const OFFER_STYLE = [['blue', 'laptop'], ['', 'cloud'], ['green', 'gear'], ['purple', 'chart'], ['', 'handshake'], ['blue', 'bulb']];
const Req = () => <span className="req">*</span>;
const List = ({ items }) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
const Paras = ({ text }) => String(text).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>);

function EnquiryModal({ slug, title, onClose }) {
  const navigate = useNavigate();
  const { errors, formError, busy, submit } = useSubmit();
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function onSubmit(e) {
    const res = await submit(e, `/members/${encodeURIComponent(slug)}/enquiry`);
    if (res) navigate(`/enquiry-submitted?ref=${encodeURIComponent(res.ref)}&t=${res.token}`);
  }

  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="box" id="member-enquiry" noValidate onSubmit={onSubmit}>
        <button className="close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <h2 className="title sm">{title}</h2>
        <p style={{ margin: '12px 0 20px', fontSize: 15 }}>Your enquiry will be shared with the member through HEH. Personal contact details are not shared publicly.</p>
        <div className="form-grid">
          <Field htmlFor="m_full_name" label={<>Full Name <Req /></>} error={errors.full_name}>
            <input ref={nameRef} className="input" id="m_full_name" name="full_name" maxLength={120} autoComplete="name" />
          </Field>
          <Field htmlFor="m_mobile" label={<>Mobile Number <Req /></>} error={errors.mobile}>
            <input className="input" id="m_mobile" name="mobile" type="tel" maxLength={16} autoComplete="tel" />
          </Field>
          <Field htmlFor="m_email" label={<>Email Address <Req /></>} error={errors.email}>
            <input className="input" id="m_email" name="email" type="email" maxLength={160} autoComplete="email" />
          </Field>
          <Field htmlFor="m_company" label="Company Name" error={errors.company}>
            <input className="input" id="m_company" name="company" maxLength={160} autoComplete="organization" />
          </Field>
          <Field className="full" htmlFor="m_message" label={<>Your Message <Req /></>} error={errors.message}>
            <div style={{ position: 'relative' }}>
              <CountedTextarea className="input" id="m_message" name="message" maxLength={500} placeholder="Tell us how you would like to connect…" />
            </div>
          </Field>
        </div>
        <FormError style={{ marginTop: 14 }} message={formError} />
        <div className="btn-row" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>Send Enquiry <Icon name="arrow-right" /></button>
          <button className="btn btn-outline" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Profile({ m, onEnquire }) {
  const trio = [['target', 'Experience', m.experience], ['bulb', 'Expertise', m.expertise], ['chart-line', 'Passion', m.passion]].filter((x) => x[2]);
  const offers = m.offers || [];
  const opp = m.opportunities || [];
  const interests = m.collaboration_interests || [];
  const location = m.location || 'Hyderabad, Telangana';
  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 28 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/community">Our Community</Link><Icon name="chevron-right" />
            <Link to="/members">Member Directory</Link><Icon name="chevron-right" /><span>Member Profile</span>
          </nav>
          <div className="panel profile-head" style={{ marginTop: 20 }}>
            <Media url={m.photo_url} label={m.photo_url ? m.full_name : ''} icon="user" className={m.photo_url ? '' : 'person'} />
            <div>
              <h1>{m.full_name}</h1>
              <div className="role">{m.designation}<br />{m.company}</div>
              {m.industry && <IndustryBadge industry={m.industry} />}
              <div className="facts">
                <div><Icon name="shield" /><span><b>HEH Member</b>Active Member</span></div>
                <div><Icon name="pin" /><span><b>{location}</b>Business Location</span></div>
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-primary" type="button" onClick={() => onEnquire(`Connect with ${m.full_name} through HEH`)}>
                Connect Through HEH <Icon name="arrow-right" />
              </button>
              <button className="btn btn-outline" type="button" onClick={() => onEnquire(`Send an enquiry to ${m.full_name}`)}>
                <Icon name="mail" /> Send Enquiry
              </button>
              <small>Your enquiry will be shared with the member through HEH. Personal contact details are not shared publicly.</small>
            </div>
          </div>
        </div>
      </section>

      {(m.bio || trio.length > 0) && (
        <section className="section tight" style={{ borderBottom: '1px solid var(--line-cool)' }}>
          <div className="container">
            <h2 className="title">About the Entrepreneur</h2>
            <div className="about-person" style={{ marginTop: 22 }}>
              <div style={{ fontSize: 16 }}><Paras text={m.bio || ''} /></div>
              {trio.length > 0 && (
                <div className="panel soft trio">
                  {trio.map(([ic, h, t]) => <div key={h}><Icon name={ic} /><h3>{h}</h3><p>{t}</p></div>)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section tight">
        <div className="container">
          <h2 className="title" style={{ marginBottom: 22 }}>About the Business</h2>
          <div className="panel biz">
            <Media url={m.company_image_url} label={m.company_image_url ? m.company : ''} icon="building" />
            <div className="mid">
              <h3>{m.company}</h3>
              {m.company_tagline && <p style={{ marginTop: 6, fontSize: 15.5 }}>{m.company_tagline}</p>}
              <div className="fact"><Icon name="building" /><span><b>Industry</b>{m.industry || '—'}</span></div>
              <div className="fact"><Icon name="pin" /><span><b>Business Location</b>{location}</span></div>
            </div>
            <div className="right">
              {m.company_about && <><h4 style={{ marginTop: 0 }}>About the Company</h4><p>{m.company_about}</p></>}
              {m.products_services && <><h4>Products / Services</h4><p>{m.products_services}</p></>}
              {m.website && (
                <a className="btn btn-outline-orange btn-sm" style={{ marginTop: 18 }} href={m.website} target="_blank" rel="noopener nofollow">
                  <Icon name="external" /> Visit Company Website <Icon name="arrow-right" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="section tight">
          <div className="container">
            <h2 className="title" style={{ marginBottom: 22 }}>What We Offer</h2>
            <div className="card-grid">
              {offers.map((o, i) => {
                const [tone, ic] = OFFER_STYLE[i % OFFER_STYLE.length];
                return (
                  <div className="panel offer" key={i}>
                    <span className={`ic lg ${tone}`.trim()} style={{ width: 60, height: 60 }}><Icon name={ic} solid /></span>
                    <div><h3>{o.title}</h3><p>{o.text || ''}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(opp.length > 0 || interests.length > 0) && (
        <section className="section tight">
          <div className="container">
            <h2 className="title" style={{ marginBottom: 22 }}>Let’s Connect &amp; Collaborate</h2>
            <div className="two-col">
              {opp.length > 0 && (
                <div className="collab panel blue"><Icon name="handshake" className="big" /><div><h3>Business Opportunities</h3><List items={opp} /></div></div>
              )}
              {interests.length > 0 && (
                <div className="collab panel soft">
                  <span style={{ color: 'var(--orange)', display: 'contents' }}><Icon name="users" className="big" /></span>
                  <div><h3>Collaboration Interests</h3><List items={interests} /></div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section tight" style={{ paddingBottom: 48 }}>
        <div className="btn-row center">
          <Link className="btn btn-primary" to="/members" style={{ minWidth: 220 }}>Explore More Members <Icon name="arrow-right" /></Link>
          <Link className="btn btn-outline" to="/community" style={{ minWidth: 220 }}>Back to Our Community</Link>
        </div>
      </section>
    </>
  );
}

export default function Member() {
  const slug = useParam('m');
  const navigate = useNavigate();
  const { data: m, error } = useApi(slug ? `/members/${encodeURIComponent(slug)}` : null);
  const [modalTitle, setModalTitle] = useState(null);
  const closeModal = useCallback(() => setModalTitle(null), []);
  useTitle(m ? `${m.full_name} | HEH Member` : 'Member Profile | Hyderabad Entrepreneurs Hub');

  useEffect(() => { if (!slug) navigate('/members', { replace: true }); }, [slug, navigate]);

  if (error) {
    return (
      <section className="section">
        <div className="container empty">
          {error.status === 404 ? 'This member profile could not be found.' : error.message}
          <br /><br />
          <Link className="btn btn-primary" to="/members">Back to Members</Link>
        </div>
      </section>
    );
  }
  if (!m) return <div className="container loading" style={{ padding: '120px 0' }}>Loading profile…</div>;
  return (
    <>
      <Profile m={m} onEnquire={setModalTitle} />
      {modalTitle && <EnquiryModal slug={slug} title={modalTitle} onClose={closeModal} />}
    </>
  );
}
