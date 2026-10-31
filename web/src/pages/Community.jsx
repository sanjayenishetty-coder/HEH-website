import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { CATEGORY_BADGE, INDUSTRY_STYLE, Media } from '../components/ui.jsx';
import { useApi, useTitle } from '../lib/hooks.js';
import { GridNote, MemberCard } from './cards.jsx';

function Members() {
  const { data, error } = useApi('/members?limit=4');
  if (error) return <GridNote>{error.message}</GridNote>;
  if (!data) return <GridNote className="loading">Loading members…</GridNote>;
  if (!data.items.length) return <GridNote>Member profiles will be published soon.</GridNote>;
  return data.items.map((m) => <MemberCard key={m.slug} m={m} />);
}

function Stories() {
  const { data, error } = useApi('/stories?limit=3&offset=0');
  if (error) return <GridNote>{error.message}</GridNote>;
  if (!data) return <GridNote className="loading">Loading stories…</GridNote>;
  if (!data.items.length) return <GridNote>Success stories will be published soon.</GridNote>;
  return data.items.map((x) => (
    <article className="h-tile" key={x.slug}>
      <Media url={x.image_url} label={x.image_url ? x.title : ''} />
      <div>
        <span className={`badge ${CATEGORY_BADGE[x.category] || ''}`}>{x.category}</span>
        <h3>{x.title}</h3>
        <p>{x.summary}</p>
        <Link className="btn btn-outline-orange btn-sm" to={`/story?s=${encodeURIComponent(x.slug)}`}>Read Story <Icon name="arrow-right" /></Link>
      </div>
    </article>
  ));
}

export default function Community() {
  useTitle('Our Community | Hyderabad Entrepreneurs Hub');
  return (
    <>
      <section className="page-hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow rule" style={{ marginTop: 20 }}>Our Community</span>
            <h1>Stronger Connections.<br />Greater Opportunities.</h1>
            <p className="lead" style={{ maxWidth: 560 }}>Discover a trusted network of entrepreneurs and business leaders who connect, collaborate and grow together through HEH.</p>
          </div>
          <div className="hero-tagline"><span>Connect</span><span>Collaborate</span><span>Grow</span></div>
        </div>
      </section>

      <section className="section tight" style={{ borderBottom: '1px solid var(--line-cool)' }}>
        <div className="container meet">
          <div>
            <h2 className="title">Meet the HEH Community</h2>
            <p style={{ marginTop: 16, fontSize: 16 }}>HEH brings together entrepreneurs from diverse industries, creating opportunities for meaningful business relationships, knowledge sharing and collaboration.</p>
          </div>
          <div className="stat-row">
            <div><Ic name="users" /><h3>Entrepreneurs</h3><p>Business owners and founders</p></div>
            <div><Ic name="building" /><h3>Industries</h3><p>Diverse business sectors</p></div>
            <div><Ic name="handshake" /><h3>Collaborations</h3><p>Meaningful business connections</p></div>
          </div>
        </div>
      </section>

      <section className="section tight" style={{ borderBottom: '1px solid var(--line-cool)' }}>
        <div className="container">
          <div className="section-head">
            <h2 className="title">Our Members</h2>
            <Link className="link-arrow navy" to="/members">View all members <Icon name="arrow-right" /></Link>
          </div>
          <div className="card-grid four"><Members /></div>
          <div className="more">
            <Link className="btn btn-outline btn-sm" to="/members" style={{ padding: '11px 40px' }}>Explore All Members <Icon name="arrow-right" /></Link>
          </div>
        </div>
      </section>

      <section className="section tight" style={{ borderBottom: '1px solid var(--line-cool)' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 22 }}>Businesses Across Industries</h2>
          <div className="industry-grid">
            {Object.entries(INDUSTRY_STYLE).map(([name, [tone, ic]]) => (
              <Link key={name} className="industry" to={`/members?industry=${encodeURIComponent(name)}`}><Ic name={ic} tone={tone} />{name}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="section-head">
            <h2 className="title">Connections That Create Impact</h2>
            <Link className="link-arrow navy" to="/success-stories">View all success stories <Icon name="arrow-right" /></Link>
          </div>
          <div className="card-grid"><Stories /></div>
        </div>
      </section>

      <section className="cta-band no-icon">
        <div className="container">
          <div className="copy">
            <h2 className="title">Grow With the HEH Community</h2>
            <p>Join a network of entrepreneurs committed to building trusted relationships and meaningful business opportunities.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/membership">Explore Membership</Link>
          </div>
        </div>
      </section>
    </>
  );
}
