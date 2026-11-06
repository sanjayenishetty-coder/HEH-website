import { useTitle } from '../lib/hooks.js';

const VALUES = [
  ['Trust & Integrity', 'Building relationships through transparency, credibility and mutual respect.'],
  ['Meaningful Networking', 'Creating valuable and long-term business connections.'],
  ['Continuous Learning', 'Encouraging growth through mentorship, expert insights and knowledge sharing.'],
  ['Collaborative Growth', 'Enabling business opportunities, partnerships and shared success.'],
  ['Community Impact', 'Promoting responsible entrepreneurship and contributing to economic development.'],
];

export default function About() {
  useTitle('Hyderabad Entrepreneurs Hub | About');
  return (
    <>
      <section className="section about-us">
        <div className="container">
          <h2 className="rule">About Us</h2>
          <div className="body">
            <p className="tagline">Building Connections. Creating Opportunities. Enabling Growth.</p>
            <p>Hyderabad Entrepreneurs Hub (HEH) is a professionally driven business networking platform that brings together entrepreneurs, business owners, startup founders, corporate leaders and accomplished professionals to foster meaningful business relationships and create opportunities for collective growth.</p>
            <p>HEH serves as a collaborative ecosystem where business leaders connect, exchange industry insights, gain access to experienced mentors and explore strategic partnerships, business collaborations and new growth opportunities.</p>
            <p>Through structured networking engagements, leadership interactions, knowledge-sharing initiatives, expert-led sessions and business development programmes, HEH facilitates an environment that encourages purposeful connections, continuous learning and professional excellence.</p>
            <p>We believe that sustainable business growth is built on trust, shared knowledge and meaningful collaboration. HEH is committed to strengthening the entrepreneurial ecosystem by connecting the right people, ideas and opportunities.</p>
          </div>
        </div>
      </section>

      <section className="section divided" style={{ paddingTop: 0 }}>
        <div className="container vm">
          <div>
            <span className="eyebrow tracked rule">Our Vision</span>
            <h3>To Become Hyderabad’s Most Trusted and Influential Entrepreneur Community.</h3>
            <p>Fostering meaningful connections, sustainable business growth and a culture of collaboration that drives economic and social impact.</p>
          </div>
          <div>
            <span className="eyebrow tracked rule">Our Mission</span>
            <h3>To Connect Genuine Entrepreneurs and Create Opportunities.</h3>
            <p>To connect genuine entrepreneurs, SME business owners, startup founders and professionals through purposeful networking, knowledge sharing, mentorship and strategic collaborations — creating an ecosystem where trust builds relationships, collaboration unlocks opportunities and collective growth drives business success.</p>
          </div>
        </div>
      </section>

      <section className="values">
        <div className="container">
          <span className="eyebrow tracked rule">Our Core Values</span>
          <div className="values-grid">
            {VALUES.map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}
          </div>
        </div>
      </section>
    </>
  );
}
