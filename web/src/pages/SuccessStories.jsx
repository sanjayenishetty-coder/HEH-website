import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { CATEGORY_BADGE, Media } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { fmt } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import { GridNote, StoryCard } from './cards.jsx';

const PAGE = 6;
const SEP = ' | ';
const CHIPS = [
  ['', 'All Stories'],
  ['Business Collaboration', 'Business Collaborations'],
  ['Business Referral', 'Business Referrals'],
  ['Growth Story', 'Growth Stories'],
  ['Community Impact', 'Community Impact'],
];

function Featured({ s }) {
  const url = `/story?s=${encodeURIComponent(s.slug)}`;
  return (
    <div className="panel featured-story">
      <Media url={s.image_url} label={s.image_url ? s.title : 'Admin Upload Photograph'} />
      <div style={{ padding: '10px 10px 6px 0' }}>
        <span className={`badge ${CATEGORY_BADGE[s.category] || ''}`}>{s.category}</span>
        <h3><Link to={url}>{s.title}</Link></h3>
        <p className="summary">{s.summary}</p>
        <div className="facts">
          {(s.members_involved || []).length > 0 && (
            <div className="fact"><Icon name="users" /><span><b>Members Involved</b>{s.members_involved.join(SEP)}</span></div>
          )}
          {s.business_category && <div className="fact"><Icon name="briefcase" /><span><b>Business Category</b>{s.business_category}</span></div>}
          <span></span>
          {(s.companies || []).length > 0 && (
            <div className="fact"><Icon name="building" /><span><b>Companies</b>{s.companies.join(SEP)}</span></div>
          )}
          <div className="fact"><Icon name="calendar" /><span><b>Published On</b>{fmt.date(s.published_on)}</span></div>
          <Link className="btn btn-primary btn-sm" style={{ padding: '12px 26px' }} to={url}>Read Full Story <Icon name="arrow-right" /></Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessStories() {
  useTitle('Success Stories | Hyderabad Entrepreneurs Hub');
  const [cat, setCat] = useState('');
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  // undefined = not loaded yet, null = none; taken from the first (unfiltered) response only.
  const [featured, setFeatured] = useState(undefined);
  const latest = useRef(0);

  async function load(offset, base) {
    const req = ++latest.current;
    const p = new URLSearchParams({ limit: PAGE, offset });
    if (cat) p.set('category', cat);
    try {
      const d = await api(`/stories?${p}`);
      setFeatured((f) => (f === undefined ? d.featured || null : f));
      if (req !== latest.current) return;
      setItems([...base, ...d.items]);
      setTotal(d.total);
      setError(null);
    } catch (err) {
      if (req === latest.current) setError(err);
    }
  }

  useEffect(() => {
    setItems(null);
    load(0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  let grid;
  if (error) grid = <GridNote>{error.message}</GridNote>;
  else if (!items) grid = <GridNote className="loading">Loading stories…</GridNote>;
  else if (!items.length) grid = <GridNote>No stories in this category yet.</GridNote>;
  else grid = items.map((s) => <StoryCard key={s.slug} s={s} />);

  return (
    <>
      <section className="page-hero">
        <div className="container hero-grid">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/community">Our Community</Link><Icon name="chevron-right" /><span>Success Stories</span>
            </nav>
            <span className="eyebrow rule" style={{ marginTop: 22 }}>HEH Success Stories</span>
            <h1>Real Connections.<br />Real Business Impact.</h1>
            <p className="lead" style={{ maxWidth: 600 }}>Discover how HEH entrepreneurs turn meaningful relationships into valuable collaborations, business opportunities and shared success.</p>
          </div>
          <div className="hero-tagline"><span>Connect</span><span>Collaborate</span><span>Grow</span></div>
        </div>
      </section>

      {featured !== null && (
        <section className="section tight">
          <div className="container">
            <h2 className="title" style={{ marginBottom: 22 }}>Featured Success Story</h2>
            <div>{featured ? <Featured s={featured} /> : <div className="loading">Loading…</div>}</div>
          </div>
        </section>
      )}

      <section className="section tight" style={{ paddingBottom: 40 }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 22 }}>Stories That Inspire</h2>
          <div className="chips">
            {CHIPS.map(([value, label]) => (
              <button key={value} className={`chip${cat === value ? ' active' : ''}`} onClick={() => setCat(value)}>{label}</button>
            ))}
          </div>
          <div className="card-grid" style={{ marginTop: 20 }}>{grid}</div>
          <div className="more">
            {!error && items && items.length < total && (
              <button className="btn btn-outline" onClick={() => load(items.length, items)}>Load More Stories <Icon name="arrow-down" /></button>
            )}
          </div>
        </div>
      </section>

      <section className="cta-light warm">
        <div className="container">
          <Ic name="file-edit" className="lg" />
          <div>
            <h2>Have a Success Story to Share?</h2>
            <p>Have you built a meaningful collaboration or achieved a business milestone through HEH? Share your experience with our community.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to={`/contact?type=${encodeURIComponent('General Enquiry')}`}>Submit Your Story <Icon name="arrow-right" /></Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <Ic name="users" />
          <div className="copy">
            <h2>Your Next Business Opportunity Starts Here</h2>
            <p>Become part of a trusted entrepreneurial community where relationships lead to meaningful opportunities.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
            <Link className="btn btn-ghost-light" to="/community">Explore Our Community</Link>
          </div>
        </div>
      </section>
    </>
  );
}
