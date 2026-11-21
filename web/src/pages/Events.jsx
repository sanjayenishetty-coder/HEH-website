import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Ic } from '../components/Icon.jsx';
import { Media } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { fmt } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';

// Event card grid with category / year / month filters, for /events (upcoming) and /past-events (past).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PAGE = 6;
const BADGE_POS = { position: 'absolute', top: 10, left: 10, zIndex: 1 };

const COPY = {
  upcoming: {
    title: 'Events | Hyderabad Entrepreneurs Hub',
    h1: 'Meet. Learn. Grow Together.',
    lead: 'Join upcoming HEH Spotlights and Workshops to connect with fellow entrepreneurs, learn from experienced leaders and discover new opportunities.',
    heading: 'Upcoming HEH Events',
  },
  past: {
    title: 'Past Events | Hyderabad Entrepreneurs Hub',
    h1: 'Our Journey. Our Connections.',
    lead: 'Explore the meaningful moments, inspiring conversations and valuable connections created through HEH gatherings.',
    heading: 'Memorable HEH Gatherings',
  },
};

function EventCard({ e, past }) {
  const url = `/event?e=${encodeURIComponent(e.slug)}`;
  return (
    <article className="tile">
      <div style={{ position: 'relative' }}>
        {e.category === 'workshop'
          ? <span style={BADGE_POS} className="badge caps blue">HEH Workshop</span>
          : <span style={BADGE_POS} className="badge caps">HEH Spotlight</span>}
        <Media url={e.image_url} label={e.image_url ? e.title : 'Event image will be displayed here'} />
      </div>
      <div className="body">
        <h3><Link to={url}>{e.title}</Link></h3>
        <div className="foot" style={{ marginTop: 2 }}>
          <div className="meta">
            <span><Icon name="calendar" />{fmt.date(e.event_date)}</span>
            <span><Icon name="pin" />{e.venue_name || 'Hyderabad'}</span>
          </div>
          <Link className="btn btn-outline-orange btn-sm" to={url}>{past ? 'View Highlights' : 'View Details'} <Icon name="arrow-right" /></Link>
        </div>
      </div>
    </article>
  );
}

// /events and /past-events share this component; the key gives each its own state.
export default function Events({ when }) {
  return <EventList key={when} when={when} />;
}

function EventList({ when }) {
  const past = when === 'past';
  const copy = COPY[past ? 'past' : 'upcoming'];
  useTitle(copy.title);

  const [filters, setFilters] = useState({ category: '', year: '', month: '' });
  const [years, setYears] = useState(null);
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);

  async function load(offset, base) {
    const req = ++latest.current; // ignore answers to filters that have since changed
    setBusy(true);
    const q = new URLSearchParams({ when, limit: PAGE, offset });
    for (const k of ['category', 'year', 'month']) if (filters[k]) q.set(k, filters[k]);
    try {
      const data = await api(`/events?${q}`);
      if (req !== latest.current) return;
      setYears((y) => y || data.years);
      setItems([...base, ...data.items]);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      if (req === latest.current) setError(err);
    } finally {
      if (req === latest.current) setBusy(false);
    }
  }

  useEffect(() => {
    setItems(null);
    setError(null);
    load(0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  let grid;
  if (error) grid = <div className="empty" style={{ gridColumn: '1/-1' }}>Could not load events. {error.message}</div>;
  else if (!items) grid = <div className="loading" style={{ gridColumn: '1/-1' }}>Loading events…</div>;
  else if (!items.length) {
    grid = (
      <div className="empty" style={{ gridColumn: '1/-1' }}>
        {past ? 'No past events match these filters yet.'
          : <>New events will be announced soon. Check back shortly or <Link className="link-arrow" to="/past-events">explore past events</Link>.</>}
      </div>
    );
  } else grid = items.map((e) => <EventCard key={e.id ?? e.slug} e={e} past={past} />);

  const showMore = !error && items && items.length < total;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><Icon name="chevron-right" />
            {past ? <><Link to="/events">Events</Link><Icon name="chevron-right" /><span>Past Events</span></> : <span>Events</span>}
          </nav>
          <h1 className="title" style={{ fontSize: 'clamp(36px,5vw,56px)' }}>{copy.h1}</h1>
          <p className="lead" style={{ maxWidth: 500 }}>{copy.lead}</p>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="filter-bar">
            <div className="seg" role="group" aria-label="Event type">
              {[['', 'All Events'], ['spotlight', 'Spotlight'], ['workshop', 'Workshop']].map(([cat, label]) => (
                <button key={cat} type="button" className={filters.category === cat ? 'active' : ''} onClick={() => set('category')(cat)}>{label}</button>
              ))}
            </div>
            <span className="vr"></span>
            <label>Year{' '}
              <select className="input" name="year" value={filters.year} onChange={(e) => set('year')(e.target.value)}>
                <option value="">All Years</option>
                {(years || []).map((y) => <option key={y}>{y}</option>)}
              </select>
            </label>
            <label>Month{' '}
              <select className="input" name="month" value={filters.month} onChange={(e) => set('month')(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
          </div>

          <h2 className="title" style={{ margin: '34px 0 22px' }}>{copy.heading}</h2>
          <div className="card-grid">{grid}</div>
          <div className="more">
            {showMore && (
              <button className="btn btn-outline" disabled={busy} onClick={() => load(items.length, items)}>
                Load More Events <Icon name="arrow-down" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <Ic name="users" />
          {past ? (
            <>
              <div className="copy">
                <h2>Be Part of Our Next Gathering</h2>
                <p>Connect with entrepreneurs, exchange ideas and explore meaningful business opportunities through HEH.</p>
              </div>
              <div className="actions">
                <Link className="btn btn-primary" to="/events">Explore Upcoming Events <Icon name="arrow-right" /></Link>
                <Link className="btn btn-ghost-light" to="/membership-apply">Become a Member</Link>
              </div>
            </>
          ) : (
            <>
              <div className="copy">
                <h2>Our Journey So Far</h2>
                <p>Look back at the conversations, insights and connections from previous HEH gatherings.</p>
              </div>
              <div className="actions">
                <Link className="btn btn-primary" to="/past-events">View Past Events <Icon name="arrow-right" /></Link>
                <Link className="btn btn-ghost-light" to="/membership-apply">Become a Member</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
