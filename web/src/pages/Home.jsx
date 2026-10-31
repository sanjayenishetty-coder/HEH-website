import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

const FEATURES = [
  ['users', '', 'Business Networking', 'Connect with entrepreneurs across industries.'],
  ['handshake', 'blue', 'Business Opportunities', 'Explore collaborations and referrals.'],
  ['bulb', '', 'Knowledge Sharing', 'Learn through workshops and expert sessions.'],
  ['chart', 'green', 'Community Growth', 'Build long-term professional relationships.'],
];

const WHO = [
  ['briefcase', 'blue', 'Business Owners', 'Entrepreneurs operating established businesses.'],
  ['store', '', 'SME Entrepreneurs', 'Owners of small and medium enterprises.'],
  ['rocket', 'green', 'Startup Founders', 'Founders building growth-oriented ventures.'],
  ['user', 'purple', 'Business Leaders', 'Professionals with entrepreneurial leadership responsibilities.'],
];

const JOURNEY = [
  ['file-edit', 'blue', 'Apply Online', 'Submit your membership application.'],
  ['search', '', 'Application Review', 'HEH reviews your business information.'],
  ['users', '', 'Interaction', 'Committee may schedule a discussion.'],
  ['check', 'blue', 'Approval', 'Membership decision communicated.'],
  ['flag', '', 'Onboarding', 'Complete formalities and join HEH.'],
];

const FeatureGrid = ({ items }) => (
  <div className="feature-grid">
    {items.map(([icon, tone, title, text]) => (
      <div className="feature" key={title}>
        <Ic name={icon} tone={tone} />
        <div><h3>{title}</h3><p>{text}</p></div>
      </div>
    ))}
  </div>
);

export default function Home() {
  useTitle('Hyderabad Entrepreneurs Hub | Your Network. Your Growth. Your Opportunity.');
  return (
    <>
      <section className="hero-home">
        <div className="photo" role="img" aria-label="Charminar, Hyderabad, at sunset">
          <div className="hero-tagline"><span>Connect</span><span>Collaborate</span><span>Grow</span></div>
        </div>
        <div className="container">
          <div className="content">
            <span className="eyebrow">Join the HEH Community</span>
            <h1>Your Network.<br />Your Growth.<br />Your Opportunity.</h1>
            <p className="lead">Become part of a trusted community of entrepreneurs committed to meaningful connections, knowledge sharing and business growth.</p>
            <div className="btn-row">
              <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
              <Link className="btn btn-outline" to="/membership">Explore Membership Benefits</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="title" style={{ marginBottom: 26 }}>Grow Through Meaningful Connections</h2>
          <FeatureGrid items={FEATURES} />
        </div>
      </section>

      <section className="section flush-top">
        <div className="container">
          <h2 className="title">Who Can Apply?</h2>
          <p style={{ margin: '14px 0 24px', maxWidth: 760 }}>HEH welcomes entrepreneurs and business leaders who are committed to active participation and professional collaboration.</p>
          <FeatureGrid items={WHO} />
          <div className="notice" style={{ marginTop: 16 }}>
            <Icon name="info" />
            <span>Membership is subject to eligibility criteria, category availability and approval by the HEH Membership Committee.</span>
          </div>
        </div>
      </section>

      <section className="section flush-top">
        <div className="container">
          <h2 className="title" style={{ marginBottom: 30 }}>Your Journey to HEH Membership</h2>
          <div className="journey" style={{ '--n': JOURNEY.length }}>
            {JOURNEY.map(([icon, tone, title, text], i) => (
              <div className="step" key={title}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <Ic name={icon} tone={tone} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Take the First Step Towards<br />Meaningful Connections.</h2>
            <p>Join a community where entrepreneurs connect, collaborate and grow together.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Start Membership Application <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/contact">Contact HEH</Link>
          </div>
        </div>
      </section>
    </>
  );
}
