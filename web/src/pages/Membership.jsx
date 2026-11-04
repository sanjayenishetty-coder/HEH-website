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
  'Connect with entrepreneurs, business owners and industry leaders across diverse sectors.',
  'Participate in structured business networking meetings and member interactions.',
  'Opportunities to introduce and showcase your business through HEH initiatives, subject to approval.',
  'Exchange business knowledge, experiences and industry insights with fellow members.',
  'Explore potential business collaborations, partnerships and professional referrals.',
  'Build meaningful and long-term professional relationships.',
  'Participate in expert sessions, workshops and learning programmes organised by HEH.',
  'Avail preferential member pricing on HEH events, workshops and annual business summits.',
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

      <section className="section" id="who-can-join">
        <div className="container">
          <h2 className="rule">Who Can Join?</h2>
          <div className="card">
            <ul className="dot-list">{WHO.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <p className="note">Membership is subject to eligibility, category availability and approval in accordance with HEH membership guidelines.</p>
        </div>
      </section>

      <section className="section divided" id="why-heh">
        <div className="container">
          <h2 className="rule">Membership Benefits</h2>
          <p className="section-lead">Be part of a professional business community that encourages meaningful networking, knowledge sharing and continuous learning.</p>
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
