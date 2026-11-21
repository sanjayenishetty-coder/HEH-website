import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

const PILLARS = [
  ['users', '', 'Business Networking', 'Connect with entrepreneurs, business owners and professionals across diverse industries through structured networking engagements.', [
    'Regular business networking meetings',
    'Opportunities to present your business and expertise',
    'Member-to-member introductions and interactions',
    'Cross-industry networking opportunities',
    'Building meaningful professional relationships',
  ]],
  ['bulb', 'green', 'Knowledge Sharing', 'Gain valuable business perspectives and practical insights through interactions with experienced entrepreneurs and industry experts.', [
    'Expert-led sessions and interactive discussions',
    'Business workshops and learning programmes',
    'Entrepreneur success stories and experiences',
    'Industry insights and emerging business trends',
    'Peer-to-peer knowledge exchange',
  ]],
  ['flag', 'blue', 'Mentorship & Leadership', 'Learn from experienced business leaders, mentors and industry professionals through knowledge-sharing and leadership interactions.', [
    'Interactions with experienced entrepreneurs and mentors',
    'Leadership talks and expert sessions',
    'Insights into business challenges and opportunities',
    'Experience sharing and peer learning',
    'Exposure to diverse business perspectives',
  ]],
  ['handshake', '', 'Business Collaboration', 'Explore opportunities to develop professional relationships, business partnerships and mutually beneficial collaborations within the HEH network.', [
    'Member-to-member business interactions',
    'Opportunities to explore strategic partnerships',
    'Business introductions within the network',
    'Cross-industry collaboration opportunities',
    'Sharing business requirements and opportunities',
  ]],
  ['cap', 'purple', 'Business Development & Workshops', 'Enhance business and professional capabilities through practical learning programmes and development initiatives.', [
    'Sales, marketing and business development workshops',
    'AI, technology and digital transformation sessions',
    'Entrepreneurial and management development programmes',
    'Industry-focused learning sessions',
    'Practical business insights and knowledge exchange',
  ]],
  ['heart', 'blue', 'Community & Engagement', 'Build stronger professional relationships through social interactions, sports activities and community initiatives beyond conventional business networking.', [
    'Member networking and social gatherings',
    'Entrepreneurial community initiatives',
    'Opportunities to connect beyond business',
    'A culture of mutual respect and professional participation',
  ]],
];

export default function WhyHeh() {
  useTitle('Why HEH | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Why HEH</span>
          <h1>A Community of Business Leaders.<br /><span className="accent">A Platform for Meaningful Growth.</span></h1>
          <p className="why-lead">Building a successful business requires the right connections, continuous learning, trusted relationships and opportunities to collaborate.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="why-intro">
            <p>Hyderabad Entrepreneurs Hub (HEH) provides a professional platform for entrepreneurs, business owners, startup founders and industry leaders to connect, exchange knowledge, share experiences and explore opportunities for mutual growth.</p>
            <p>Through structured networking, knowledge-sharing initiatives, mentorship interactions, business workshops and community engagements, HEH encourages meaningful relationships and a collaborative business environment.</p>
          </div>
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
