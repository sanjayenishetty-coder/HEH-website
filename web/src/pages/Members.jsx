import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { Select } from '../components/forms.jsx';
import { api, meta } from '../lib/api.js';
import { useParam, useTitle } from '../lib/hooks.js';
import { GridNote, MemberCard } from './cards.jsx';

const PAGE = 12;

export default function Members() {
  useTitle('Member Directory | Hyderabad Entrepreneurs Hub');
  const initialIndustry = useParam('industry') || ''; // from the community page's industry links
  const [industries, setIndustries] = useState([]);
  const [industry, setIndustry] = useState(initialIndustry);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState(''); // debounced q
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const latest = useRef(0);

  useEffect(() => { meta().then((m) => setIndustries(m.industries)).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function load(offset, base) {
    const req = ++latest.current;
    const p = new URLSearchParams({ limit: PAGE, offset });
    if (industry) p.set('industry', industry);
    if (query) p.set('q', query);
    try {
      const d = await api(`/members?${p}`);
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
  }, [industry, query]);

  let grid;
  if (error) grid = <GridNote>{error.message}</GridNote>;
  else if (!items) grid = <GridNote className="loading">Loading members…</GridNote>;
  else if (!items.length) grid = <GridNote>No members match your search.</GridNote>;
  else grid = items.map((m) => <MemberCard key={m.slug} m={m} />);

  // Keep a deep-linked industry selectable even before /meta arrives.
  const options = industry && !industries.includes(industry) ? [...industries, industry] : industries;

  return (
    <>
      <section className="page-hero">
        <div className="container hero-grid">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link><Icon name="chevron-right" /><Link to="/community">Our Community</Link><Icon name="chevron-right" /><span>Member Directory</span>
            </nav>
            <span className="eyebrow rule" style={{ marginTop: 22 }}>HEH Member Directory</span>
            <h1>Meet Our Members</h1>
            <p className="lead" style={{ maxWidth: 600 }}>Entrepreneurs and business leaders from across industries who connect, collaborate and grow together through HEH.</p>
          </div>
          <div className="hero-tagline"><span>Connect</span><span>Collaborate</span><span>Grow</span></div>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 48 }}>
        <div className="container">
          <div className="filter-bar">
            <label style={{ flex: 1, minWidth: 240 }}>
              <span className="input-wrap" style={{ flex: 1 }}>
                <Icon name="search" />
                <input className="input" type="search" name="q" placeholder="Search by name or company" value={q} onChange={(e) => setQ(e.target.value)} />
              </span>
            </label>
            <label>Industry{' '}
              <Select className="input" name="industry" placeholder="All Industries" options={options} value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </label>
          </div>
          <div className="card-grid four member-directory" style={{ marginTop: 26 }}>{grid}</div>
          <div className="more">
            {!error && items && items.length < total && (
              <button className="btn btn-outline" onClick={() => load(items.length, items)}>Load More Members <Icon name="arrow-down" /></button>
            )}
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
