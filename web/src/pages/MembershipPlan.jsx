import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

// From the "Membership" section of entrepreneurhub.in (HEH's main site). The existing /membership page is separate.
const HIGHLIGHTS = ['Verified business owners only', 'Two working sessions every month', 'Decision within 5–7 business days'];

const INCLUDED = [
  "Access to the HEH official members' community",
  'Participation in regular business networking meetings',
  'Knowledge-sharing sessions and expert interactions',
  'Networking opportunities with entrepreneurs and business leaders',
  'Access to official member communication groups',
  'Special member pricing on all HEH events, monthly programmes, workshops and annual business summits',
];

export default function MembershipPlan() {
  useTitle('Membership Details | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Membership</span>
          <h1>One plan.<br /><span className="accent">Everything included.</span></h1>
          <p className="why-lead">Annual membership for verified business owners. No tiers, no upsells.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="plan">
            <div className="plan-price">
              <span className="eyebrow">HEH membership</span>
              <p className="amount">₹20,000</p>
              <p className="per">+ GST, per year</p>
              <ul>{HIGHLIGHTS.map((t) => <li key={t}><Icon name="check" />{t}</li>)}</ul>
              <Link className="btn btn-primary btn-block" to="/membership-apply">Apply to Join <Icon name="arrow-right" /></Link>
              <p className="note">Fees are payable only after approval.</p>
            </div>
            <div className="plan-included">
              <h2>What’s included</h2>
              <ul>{INCLUDED.map((t) => <li key={t}><span className="tick"><Icon name="check" /></span>{t}</li>)}</ul>
              <p className="note">Additional participation fees may apply to certain workshops and special programmes. Membership fees are payable only after application approval.</p>
            </div>
          </div>

          <div className="notice plan-eligibility">
            <Icon name="info" />
            <span>
              <b>Eligibility:</b> ventures with <b>₹2 crore+</b> annual revenue, run by founders, partners or directors who are actively
              involved. Exceptions are considered by the HEH board. <Link to="/who-can-join">See who can join</Link>
            </span>
          </div>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Have a question before<br />you apply?</h2>
            <p>Read the FAQs or send us a message and the HEH team will get back to you.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/faqs">Read the FAQs <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/contact?type=Membership">Contact HEH</Link>
          </div>
        </div>
      </section>
    </>
  );
}
