import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

// From the "Why HEH" section of entrepreneurhub.in (HEH's main site).
const PILLARS = [
  ['users', '', 'Structured networking', 'Curated introductions to verified business owners, not a room full of business cards.', [
    'Two working sessions every month',
    'One-on-one introductions to relevant members',
    'Sector roundtables and mastermind circles',
    'Private WhatsApp groups for quick collaboration',
  ]],
  ['chart', 'green', 'Business growth', 'Proven scaling playbooks, expert mentorship and peer accountability that show up in your numbers.', [
    'Monthly workshops led by successful entrepreneurs',
    'Growth consultations and strategy sessions',
    'Peer advisory groups for accountability',
    'Quarterly scorecard reviews in circles of eight',
  ]],
  ['briefcase', 'blue', 'Capital connect', 'Direct routes to investors and honest guidance on when, how and whether to raise.', [
    'Investor introduction programmes',
    'Funding strategy and pitch-deck reviews',
    'Access to private equity and venture networks',
    'Valuation and exit-strategy guidance',
  ]],
  ['bulb', '', 'Knowledge exchange', 'Insights from operators who have done it, not theory from the stage.', [
    'Expert speaker series and founder stories',
    'Industry trend reports and market intelligence',
    'Case studies presented by members',
    'Technology and innovation showcases',
  ]],
  ['rocket', 'purple', 'Go-to-market support', 'Launch faster with partners, channels and positioning advice from people who sell every day.', [
    'GTM workshops and product launch support',
    'Customer acquisition and sales channel development',
    'Positioning and competitive analysis',
    'Cross-promotion with member businesses',
  ]],
  ['shield', 'blue', 'Member privileges', 'Vetted vendors, partner offers and shared buying power that lower your cost of doing business.', [
    'Privilege offers from partner brands',
    'Vetted vendor and service-provider referrals',
    'Bulk purchasing power for business services',
    'Member-only resources and templates',
  ]],
];

export default function WhyHeh() {
  useTitle('Why HEH | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Why HEH</span>
          <h1>Built for owners who want<br /><span className="accent">results, not applause</span></h1>
          <p className="why-lead">Every programme exists to move one of three things: your knowledge, your network or your numbers.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="why-grid">
            {PILLARS.map(([icon, tone, title, text, points]) => (
              <article className="why-card" key={title}>
                <Ic name={icon} tone={tone} />
                <h2>{title}</h2>
                <p>{text}</p>
                <ul>{points.map((pt) => <li key={pt}><Icon name="check" />{pt}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Ready to grow with people<br />who get it?</h2>
            <p>Join a community where entrepreneurs connect, collaborate and grow together.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/who-can-join">Who Can Join</Link>
          </div>
        </div>
      </section>
    </>
  );
}
