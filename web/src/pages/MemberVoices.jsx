import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useTitle } from '../lib/hooks.js';

// Member testimonial videos (YouTube Shorts) from the "Member voices" section of entrepreneurhub.in.
const VIDEOS = ['FOuI4vQXQJE', '9Gsa21gmH2o', 'rv2avRy4A8Q'];

export default function MemberVoices() {
  useTitle('Member Voices | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">Member Voices</span>
          <h1>What Members <span className="accent">Say</span></h1>
          <p className="why-lead">Entrepreneurs on what changed for their business after joining HEH.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="voices">
            {VIDEOS.map((id, i) => (
              <div className="voice" key={id}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
                  title={`HEH member testimonial ${i + 1}`}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ))}
          </div>
          <p className="voices-more">
            Read how members have collaborated in our <Link to="/success-stories">Success Stories</Link>.
          </p>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Write your own<br />HEH story.</h2>
            <p>Join a community where entrepreneurs connect, collaborate and grow together.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Apply for Membership <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/why-heh">Why HEH</Link>
          </div>
        </div>
      </section>
    </>
  );
}
