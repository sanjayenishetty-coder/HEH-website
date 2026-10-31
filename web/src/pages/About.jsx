import { useTitle } from '../lib/hooks.js';

const VALUES = [
  ['Trust & Integrity', 'Building relationships through transparency, credibility and mutual respect.'],
  ['Meaningful Networking', 'Creating valuable and long-term business connections.'],
  ['Continuous Learning', 'Encouraging growth through mentorship, expert insights and knowledge sharing.'],
  ['Collaborative Growth', 'Enabling business opportunities, partnerships and shared success.'],
  ['Community Impact', 'Promoting responsible entrepreneurship and contributing to economic development.'],
];

// Core team, from entrepreneurhub.in/team (photos in public/assets/team).
const TEAM = [
  ['Sanjay Enishetty', 'Chief Mentor & Advisor', 'sanjay-enishetty'],
  ['Naresh Kuchi', 'Managing Director', 'naresh-kuchi'],
  ['Sai Prakash', 'Marketing Head', 'sai-prakash'],
  ['DVP Sridhar', 'Head – Operations', 'dvp-sridhar'],
  ['Manjusha M', 'Head – Women’s Win', 'manjusha-m'],
  ['Jaya Lakshmi', 'Head – Membership Growth', 'jaya-lakshmi'],
];

export default function About() {
  useTitle('Hyderabad Entrepreneurs Hub | About');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">About Hyderabad Entrepreneurs Hub</span>
          <h1>About<br /><span className="accent">Hyderabad Entrepreneurs Hub</span></h1>
        </div>
      </section>

      <section className="section about-us">
        <div className="container">
          <h2 className="rule">About Us</h2>
          <div className="body">
            <p>Hyderabad Entrepreneurs Hub is a business networking community committed to bringing genuine entrepreneurs and business leaders together on a common platform.</p>
            <p>HEH aims to create an environment where members can build trusted relationships, share business insights, learn from experienced professionals and explore opportunities for mutual growth.</p>
            <p>Our approach goes beyond conventional networking by encouraging meaningful engagement, knowledge sharing, collaboration and active participation among members.</p>
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

      <section className="team">
        <div className="container">
          <span className="eyebrow tracked rule">Leadership &amp; Advisory Team</span>
          <h2>Leadership &amp; Advisory Team</h2>
          <p>Meet the leadership team, advisers and mentors who run HEH day to day and contribute to the growth and development of the HEH community.</p>
          <div className="team-grid">
            {TEAM.map(([name, role, photo]) => (
              <figure className="team-card" key={name}>
                <img src={`/assets/team/${photo}.jpg`} alt={name} loading="lazy" />
                <figcaption><h3>{name}</h3><span>{role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
