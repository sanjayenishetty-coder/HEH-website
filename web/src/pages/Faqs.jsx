import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

// From the FAQ on entrepreneurhub.in (HEH's main site).
const FAQS = [
  ['Who can join HEH?', 'HEH is for established entrepreneurs whose ventures have crossed ₹2 crore in annual revenue. Members must be founders, partners or directors actively running the business. We welcome every industry; the selective admission process is what keeps the room serious and useful.'],
  ['How is HEH different from other networking groups?', 'Three things. Strict eligibility, so you only meet established business owners. Structure, with curated introductions, sector roundtables and peer advisory circles instead of open mixers. And a Hyderabad focus that creates deep local market insight and collaboration you will not find in national or generic groups. Members have collectively generated ₹500+ crore in business growth.'],
  ['What events and programmes does HEH run?', 'Two sessions a month: a learning workshop and a business networking session. On top of that we run peer advisory boards, one-on-one mentorship matching, industry visits and exclusive investor connect sessions. Events are scheduled in advance and members get priority registration and guest privileges.'],
  ['What is the application process?', 'Three steps. Apply online with your business details and revenue information. Shortlisted candidates are invited for a personal interview with HEH leadership. Approved applicants receive immediate access to member benefits. The whole process typically takes 5–7 business days.'],
  ['Can I attend an event before joining?', 'Yes. Prospective members can attend one session as a guest, either a workshop or a networking session, to experience the community first-hand. Guest attendance requires a referral from an existing member or a core team member.'],
  ['My revenue is below ₹2 crore. Can I still apply?', 'Yes. The HEH board considers exceptions based on your business potential and your interaction with the team during the interview.'],
  ['What does membership cost?', '₹20,000 + GST per year. That covers all core events, masterclasses, the member directory, referral system, WhatsApp groups, industry visits and member-only resources.'],
];

export default function Faqs() {
  useTitle('FAQs | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Got Questions?</span>
          <h1>Frequently Asked<br /><span className="accent">Questions</span></h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="faq-intro">Everything you need to know before applying.</p>
          <div className="faq-list">
            {FAQS.map(([q, a], i) => (
              <details className="faq" key={q} open={i === 0}>
                <summary>{q}<Icon name="chevron-down" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="notice faq-more">
            <Icon name="chat" />
            <span>Still have a question? <Link to="/contact?type=Membership">Send us a message</Link> and the HEH team will get back to you.</span>
          </div>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-outline" to="/our-members">Meet the Executive Council</Link>
          </div>
        </div>
      </section>
    </>
  );
}
