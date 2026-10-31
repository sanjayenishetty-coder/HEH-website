import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

const WHO = [
  'SME business owners',
  'Business and professional service providers',
  'Startup founders',
  'Growth-oriented business leaders',
  'Established entrepreneurs',
];

const BENEFITS = [
  'Connect with entrepreneurs and business leaders across industries.',
  'Showcase your business through approved member features and community initiatives.',
  'Participate in structured networking meetings and member interactions.',
  'Learn from the experiences and insights of fellow entrepreneurs.',
  'Explore business collaborations, partnerships and referrals.',
  'Build long-term professional relationships within a curated business community.',
  'Attend expert sessions, workshops and mentorship programmes, subject to eligibility.',
];

const STEPS = [
  'Submit a membership enquiry.',
  'Complete the membership application process.',
  'Undergo the membership review and approval process.',
  'Complete the applicable membership formalities.',
  'Join the HEH community and participate in its activities.',
];

export default function Membership() {
  useTitle('Hyderabad Entrepreneurs Hub | Membership');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Membership</span>
          <h1>Become a Part of a<br /><span className="accent">Growing Entrepreneur Community</span></h1>
          <p className="lead">HEH welcomes entrepreneurs and business leaders who believe in building genuine relationships, sharing knowledge and creating meaningful business opportunities.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="rule">Who Can Join?</h2>
          <div className="card">
            <ul className="dot-list">{WHO.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <p className="note">Membership is subject to eligibility, category availability and approval in accordance with HEH membership guidelines.</p>
        </div>
      </section>

      <section className="section divided">
        <div className="container">
          <h2 className="rule">Membership Benefits</h2>
          <div className="card">
            <ul className="dot-list">{BENEFITS.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section divided">
        <div className="container">
          <h2 className="rule">How to Become a Member</h2>
          <div className="card steps">
            {STEPS.map((t, i) => <div key={t}><b>{String(i + 1).padStart(2, '0')}</b><p>{t}</p></div>)}
          </div>
        </div>
      </section>

      <div className="container">
        <section className="cta" id="enquire">
          <div>
            <span className="eyebrow tracked rule">Call to Action</span>
            <h2>Ready to Join HEH?</h2>
            <p>Membership fees, eligibility requirements and applicable terms will be communicated during the application process or displayed as approved by HEH.</p>
          </div>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-outline" to="/contact?type=Membership">Enquire About Membership</Link>
          </div>
        </section>
      </div>
    </>
  );
}
