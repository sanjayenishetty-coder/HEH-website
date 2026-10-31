import { Fragment, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { Media } from '../components/ui.jsx';
import { fmt } from '../lib/format.js';
import { useApi, useParam, useTitle } from '../lib/hooks.js';

// Event page: details + registration CTA for upcoming events, highlights for past events. /event?e=<slug>

function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map(([label, to], i) => (
        <Fragment key={label}>
          {i > 0 && <Icon name="chevron-right" />}
          {to ? <Link to={to}>{label}</Link> : <span>{label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

// Blank lines split paragraphs; single newlines become <br>.
function Paras({ text }) {
  return String(text).split(/\n{2,}/).map((p, i) => (
    <p key={i}>{p.split('\n').map((line, j) => <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>)}</p>
  ));
}

const spotlightLabel = (e) => (e.category === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight');
const mapsUrl = (e) =>
  e.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue_name, e.venue_address].filter(Boolean).join(', ') || 'Hyderabad')}`;

function Upcoming({ e }) {
  const venueKnown = e.venue_name && !/to be announced/i.test(e.venue_name);
  const regUrl = `/event-register?e=${encodeURIComponent(e.slug)}`;
  const canRegister = e.registration_open;
  const s = e.speaker;
  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 30 }}>
        <div className="container event-hero">
          <div>
            <Crumbs items={[['Home', '/'], ['Events', '/events'], ['Event Details']]} />
            <span className="badge caps lg" style={{ marginTop: 28 }}>{spotlightLabel(e)}</span>
            <h1>{e.title}</h1>
            <div className="meta-grid">
              <div><Icon name="calendar" />{fmt.date(e.event_date)}</div>
              <div><Icon name="clock" />{fmt.timeRange(e.start_time, e.end_time)}</div>
              <div><Icon name="pin" />{e.venue_name || 'Venue will be updated'}</div>
              <div><Icon name="users" />{e.members_only ? 'Member Exclusive' : 'Open Event'}</div>
            </div>
            {canRegister
              ? <div className="btn-row" style={{ marginTop: 28 }}><Link className="btn btn-primary" to={regUrl}>Register for Event <Icon name="arrow-right" /></Link></div>
              : <p className="status-pill closed" style={{ marginTop: 26 }}>Registration Closed</p>}
          </div>
          <Media url={e.image_url} label={e.image_url ? e.title : 'Event image will be uploaded here'} />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title">About the Event</h2>
          <div style={{ marginTop: 16, maxWidth: 760 }}>
            {e.description ? <Paras text={e.description} /> : <p className="muted">Event details will be updated here soon.</p>}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container two-col">
          <div className="panel pad">
            <h2 className="title sm">Event Agenda</h2>
            <div className="agenda">
              {(e.agenda || []).length
                ? e.agenda.map((a, i) => (
                  <div className="item" key={i}>
                    <span className="dot"></span>
                    <span className="t">{a.time || 'Time will be updated'}</span>
                    <div><h4>{a.title}</h4><p>{a.details || ''}</p></div>
                  </div>
                ))
                : <p className="muted" style={{ padding: '14px 4px' }}>The agenda will be updated here soon.</p>}
            </div>
          </div>
          <div className="panel pad">
            <h2 className="title sm">Meet Our Speaker</h2>
            {s ? (
              <div className="speaker">
                <Media url={s.photo_url} label={s.photo_url ? s.name : 'Speaker image will be uploaded here'} />
                <div>
                  <h3>{s.name || 'Speaker Name'}</h3>
                  <div className="role">{s.designation || ''}{s.company && <><br />{s.company}</>}</div>
                  <p>{s.bio || ''}</p>
                </div>
              </div>
            ) : <p className="muted" style={{ marginTop: 18 }}>Speaker details will be announced soon.</p>}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="panel pad venue">
            <div>
              <h2 className="title sm">Event Venue</h2>
              <div className="addr">
                <Icon name="pin" />
                <div><h3>{e.venue_name || 'Venue Name'}</h3><p style={{ fontSize: 15 }}>{e.venue_address || 'Complete address will be updated soon.'}</p></div>
              </div>
              <div className="meta-strip" style={{ marginTop: 22 }}>
                <div><Icon name="calendar" />{fmt.date(e.event_date)}</div>
                <div><Icon name="clock" />{fmt.timeRange(e.start_time, e.end_time)}</div>
              </div>
              {venueKnown && (
                <a className="btn btn-outline-orange" style={{ marginTop: 26 }} href={mapsUrl(e)} target="_blank" rel="noopener">
                  Get Directions <Icon name="arrow-right" />
                </a>
              )}
            </div>
            {venueKnown
              ? <iframe className="map-frame" style={{ height: '100%', minHeight: 220 }} title={`Map of ${e.venue_name}`} loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${e.venue_name}, ${e.venue_address}`)}&output=embed`} />
              : <div className="ph"><Icon name="pin" /><span>Map will be displayed here once the venue is confirmed</span></div>}
          </div>
        </div>
      </section>

      <section className="section tight" style={{ paddingBottom: 44 }}>
        <div className="container">
          <div className="panel blue cta-box">
            <span className="ic lg blue" style={{ background: '#e1ebf9', color: 'var(--navy)' }}><Icon name="users" solid /></span>
            <div className="copy">
              <h2 style={{ fontSize: 'clamp(24px,2.8vw,30px)' }}>Be Part of This Event</h2>
              <p style={{ marginTop: 8 }}>Connect with fellow entrepreneurs, exchange ideas and strengthen meaningful business relationships.</p>
            </div>
            <div className="actions">
              {canRegister && <Link className="btn btn-primary" to={regUrl}>Register for Event <Icon name="arrow-right" /></Link>}
              <Link className="btn btn-outline" to="/events">Back to Events</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Past({ e }) {
  const photos = (e.photos || []).length ? e.photos : Array(6).fill('');
  const f = e.featured;
  const takeaways = e.takeaways || [];
  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 22 }}>
        <div className="container">
          <Crumbs items={[['Home', '/'], ['Events', '/events'], ['Past Events', '/past-events'], ['Event Highlights']]} />
          <span className="badge caps lg" style={{ marginTop: 22 }}>{spotlightLabel(e)}</span>
          <h1 style={{ fontSize: 'clamp(32px,4.2vw,46px)' }}>{e.title}</h1>
          <div className="meta-strip">
            <div><Icon name="calendar" /><span>{fmt.date(e.event_date)}<br /><span style={{ fontWeight: 400 }}>{fmt.weekday(e.event_date)}</span></span></div>
            {e.start_time && <div><Icon name="clock" />{fmt.timeRange(e.start_time, e.end_time)}</div>}
            <div><Icon name="pin" />{e.venue_name || 'Hyderabad'}</div>
            <div><Icon name="users" />{spotlightLabel(e)}</div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title sm">About This Gathering</h2>
          <div style={{ marginTop: 14, maxWidth: 880 }}>
            <Paras text={e.summary || e.description || e.short_description || 'Highlights from this gathering will be shared here soon.'} />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <h2 className="title sm" style={{ marginBottom: 18 }}>Moments From the Event</h2>
          <div className="gallery">
            {photos.map((p, i) => (p
              ? <a key={i} href={p} target="_blank" rel="noopener"><Media url={p} label={e.title} /></a>
              : <Media key={i} url="" />))}
          </div>
        </div>
      </section>

      {f && (
        <section className="section tight">
          <div className="container">
            <h2 className="title sm" style={{ marginBottom: 18 }}>Featured Entrepreneur</h2>
            <div className="panel featured-person">
              <Media url={f.photo_url} label={f.photo_url ? f.name : ''} />
              <div>
                <h3>{f.name}</h3>
                <p>{f.designation || ''}{f.company && <><br />{f.company}</>}</p>
                {f.topic && <span className="badge">{f.topic}</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      {takeaways.length > 0 && (
        <section className="section tight">
          <div className="container">
            <h2 className="title sm" style={{ marginBottom: 18 }}>Key Moments &amp; Takeaways</h2>
            <div className="takeaways">
              {takeaways.map((t, i) => (
                <div className="takeaway" key={i}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <div><h4>{t.title}</h4><p>{t.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-light" style={{ marginTop: 20 }}>
        <div className="container no-icon" style={{ gridTemplateColumns: '1fr auto' }}>
          <div>
            <h2 className="title sm">Explore More HEH Events</h2>
            <p style={{ marginTop: 12 }}>Connect with entrepreneurs, exchange ideas and explore meaningful business opportunities through HEH.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" to="/events">View Upcoming Events <Icon name="arrow-right" /></Link>
            <Link className="btn btn-outline" to="/past-events">Back to Past Events</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Event() {
  const slug = useParam('e');
  const navigate = useNavigate();
  const { data: e, error } = useApi(slug ? `/events/${encodeURIComponent(slug)}` : null);
  useTitle(e ? `${e.title} | Hyderabad Entrepreneurs Hub` : 'Event | Hyderabad Entrepreneurs Hub');

  useEffect(() => { if (!slug) navigate('/events', { replace: true }); }, [slug, navigate]);

  if (error) {
    return (
      <section className="section">
        <div className="container empty">
          {error.status === 404 ? 'This event could not be found.' : error.message}
          <br /><br />
          <Link className="btn btn-primary" to="/events">Back to Events</Link>
        </div>
      </section>
    );
  }
  if (!e) return <div className="container loading" style={{ padding: '120px 0' }}>Loading event…</div>;
  return e.is_past ? <Past e={e} /> : <Upcoming e={e} />;
}
