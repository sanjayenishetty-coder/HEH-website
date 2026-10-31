import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

// From the "Who can join" section of entrepreneurhub.in (HEH's main site).
const CRITERIA = [
  ['chart', 'green', '₹2 crore+ annual revenue', 'Your venture has crossed ₹2 crore in annual revenue. Exceptions are considered by the HEH board for high-potential businesses.'],
  ['briefcase', 'blue', 'You run the business', 'You are a founder, partner or director actively involved in day-to-day operations, not an employee or investor.'],
  ['pin', '', 'Hyderabad-rooted', 'Your business is based in or operates substantially from Hyderabad, so the network compounds locally.'],
  ['handshake', 'purple', 'Show up for others', 'You are willing to share openly, make introductions and contribute, not just consume.'],
];

export default function WhoCanJoin() {
  useTitle('Who Can Join | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Who Can Join</span>
          <h1>Deliberately selective,<br /><span className="accent">so the room stays useful</span></h1>
          <p className="why-lead">We keep the bar high so every conversation is between people running real businesses.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="why-grid two">
            {CRITERIA.map(([icon, tone, title, text]) => (
              <article className="why-card" key={title}>
                <Ic name={icon} tone={tone} />
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Think HEH is right<br />for you?</h2>
            <p>Apply online in a few minutes. The HEH team reviews every application personally.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/faqs">Read the FAQs</Link>
          </div>
        </div>
      </section>
    </>
  );
}
