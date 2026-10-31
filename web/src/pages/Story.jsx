import { Fragment, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { CATEGORY_BADGE, Media } from '../components/ui.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';
import { StoryCard } from './cards.jsx';

// Success story page. /story?s=<slug>

function Paras({ text }) {
  return String(text).split(/\n{2,}/).map((p, i) => (
    <p key={i}>{p.split('\n').map((line, j) => <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>)}</p>
  ));
}

function MoreStories({ slug }) {
  const { data } = useApi(`/stories?limit=3&exclude=${encodeURIComponent(slug)}`);
  return <div className="card-grid">{(data?.items || []).map((s) => <StoryCard key={s.slug} s={s} />)}</div>;
}

export default function Story() {
  const slug = useParam('s');
  const navigate = useNavigate();
  const { data: s, error } = useApi(slug ? `/stories/${encodeURIComponent(slug)}` : null);
  useTitle(s ? `${s.title} | HEH Success Stories` : 'Success Story | Hyderabad Entrepreneurs Hub');

  useEffect(() => { if (!slug) navigate('/success-stories', { replace: true }); }, [slug, navigate]);

  if (error) {
    return (
      <section className="section">
        <div className="container empty">
          {error.status === 404 ? 'This story could not be found.' : error.message}
          <br /><br />
          <Link className="btn btn-primary" to="/success-stories">Back to Success Stories</Link>
        </div>
      </section>
    );
  }
  if (!s) return <div className="container loading" style={{ padding: '120px 0' }}>Loading story…</div>;

  const facts = [
    (s.members_involved || []).length && ['users', 'Members Involved', s.members_involved.join(', ')],
    (s.companies || []).length && ['building', 'Companies', s.companies.join(', ')],
    s.business_category && ['briefcase', 'Business Category', s.business_category],
    ['calendar', 'Published On', fmt.date(s.published_on)],
  ].filter(Boolean);

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 28 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/community">Our Community</Link><Icon name="chevron-right" />
            <Link to="/success-stories">Success Stories</Link><Icon name="chevron-right" /><span>Story</span>
          </nav>
          <span className={`badge ${CATEGORY_BADGE[s.category] || ''}`} style={{ marginTop: 24 }}>{s.category}</span>
          <h1 style={{ fontSize: 'clamp(32px,4.4vw,48px)' }}>{s.title}</h1>
          <p className="lead">{s.summary}</p>
        </div>
      </section>

      <section className="section tight">
        <div className="container article">
          {s.image_url && <Media url={s.image_url} label={s.title} />}
          <div className="meta-strip" style={{ marginBottom: 24 }}>
            {facts.map(([ic, k, v]) => (
              <div key={k}>
                <Icon name={ic} />
                <span><span className="muted" style={{ fontWeight: 400, fontSize: 13, display: 'block' }}>{k}</span>{v}</span>
              </div>
            ))}
          </div>
          <Paras text={s.body || s.summary} />
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 40 }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 22 }}>More Success Stories</h2>
          <MoreStories slug={slug} />
          <div className="btn-row center" style={{ marginTop: 30 }}>
            <Link className="btn btn-outline" to="/success-stories">Back to Success Stories</Link>
          </div>
        </div>
      </section>
    </>
  );
}
