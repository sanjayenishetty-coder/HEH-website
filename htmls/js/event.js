// Event page: details + registration CTA for upcoming events, highlights for past events.
(function () {
  'use strict';
  const { api, esc, fmt, icon, media, param } = window.HEH;
  const main = document.querySelector('[data-event]');
  const slug = param('e');

  const crumbs = (items) =>
    `<nav class="crumbs" aria-label="Breadcrumb">${items
      .map(([label, href]) => (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`))
      .join(icon('chevron-right'))}</nav>`;
  const paras = (text) => esc(text).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const spotlightLabel = (e) => (e.category === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight');
  const mapsUrl = (e) => e.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue_name, e.venue_address].filter(Boolean).join(', ') || 'Hyderabad')}`;

  function upcoming(e) {
    const venueKnown = e.venue_name && !/to be announced/i.test(e.venue_name);
    const regUrl = `event-register.html?e=${encodeURIComponent(e.slug)}`;
    const canRegister = e.registration_open;
    const agenda = (e.agenda || []).length
      ? e.agenda.map((a) => `<div class="item"><span class="dot"></span><span class="t">${esc(a.time || 'Time will be updated')}</span><div><h4>${esc(a.title)}</h4><p>${esc(a.details || '')}</p></div></div>`).join('')
      : '<p class="muted" style="padding:14px 4px">The agenda will be updated here soon.</p>';
    const s = e.speaker;
    return `
    <section class="page-hero" style="padding-bottom:30px">
      <div class="container event-hero">
        <div>
          ${crumbs([['Home', 'index.html'], ['Events', 'events.html'], ['Event Details']])}
          <span class="badge caps lg" style="margin-top:28px">${spotlightLabel(e)}</span>
          <h1>${esc(e.title)}</h1>
          <div class="meta-grid">
            <div>${icon('calendar')}${esc(fmt.date(e.event_date))}</div>
            <div>${icon('clock')}${esc(fmt.timeRange(e.start_time, e.end_time))}</div>
            <div>${icon('pin')}${esc(e.venue_name || 'Venue will be updated')}</div>
            <div>${icon('users')}${e.members_only ? 'Member Exclusive' : 'Open Event'}</div>
          </div>
          ${canRegister ? `<div class="btn-row" style="margin-top:28px"><a class="btn btn-primary" href="${regUrl}">Register for Event ${icon('arrow-right')}</a></div>` : '<p class="status-pill closed" style="margin-top:26px">Registration Closed</p>'}
        </div>
        ${media(e.image_url, { label: e.image_url ? e.title : 'Event image will be uploaded here' })}
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <h2 class="title">About the Event</h2>
        <div style="margin-top:16px;max-width:760px">${e.description ? paras(e.description) : '<p class="muted">Event details will be updated here soon.</p>'}</div>
      </div>
    </section>

    <section class="section tight">
      <div class="container two-col">
        <div class="panel pad"><h2 class="title sm">Event Agenda</h2><div class="agenda">${agenda}</div></div>
        <div class="panel pad"><h2 class="title sm">Meet Our Speaker</h2>
          ${s ? `<div class="speaker">${media(s.photo_url, { label: s.photo_url ? s.name : 'Speaker image will be uploaded here', iconName: s.photo_url ? 'image' : 'image' })}
            <div><h3>${esc(s.name || 'Speaker Name')}</h3><div class="role">${esc(s.designation || '')}${s.company ? `<br>${esc(s.company)}` : ''}</div><p>${esc(s.bio || '')}</p></div></div>`
            : '<p class="muted" style="margin-top:18px">Speaker details will be announced soon.</p>'}
        </div>
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <div class="panel pad venue">
          <div>
            <h2 class="title sm">Event Venue</h2>
            <div class="addr">${icon('pin')}<div><h3>${esc(e.venue_name || 'Venue Name')}</h3><p style="font-size:15px">${esc(e.venue_address || 'Complete address will be updated soon.')}</p></div></div>
            <div class="meta-strip" style="margin-top:22px">
              <div>${icon('calendar')}${esc(fmt.date(e.event_date))}</div>
              <div>${icon('clock')}${esc(fmt.timeRange(e.start_time, e.end_time))}</div>
            </div>
            ${venueKnown ? `<a class="btn btn-outline-orange" style="margin-top:26px" href="${esc(mapsUrl(e))}" target="_blank" rel="noopener">Get Directions ${icon('arrow-right')}</a>` : ''}
          </div>
          ${venueKnown
            ? `<iframe class="map-frame" style="height:100%;min-height:220px" title="Map of ${esc(e.venue_name)}" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(`${e.venue_name}, ${e.venue_address}`)}&output=embed"></iframe>`
            : `<div class="ph">${icon('pin')}<span>Map will be displayed here once the venue is confirmed</span></div>`}
        </div>
      </div>
    </section>

    <section class="section tight" style="padding-bottom:44px">
      <div class="container">
        <div class="panel blue cta-box">
          <span class="ic lg blue" style="background:#e1ebf9;color:var(--navy)">${icon('users')}</span>
          <div class="copy"><h2 style="font-size:clamp(24px,2.8vw,30px)">Be Part of This Event</h2><p style="margin-top:8px">Connect with fellow entrepreneurs, exchange ideas and strengthen meaningful business relationships.</p></div>
          <div class="actions">
            ${canRegister ? `<a class="btn btn-primary" href="${regUrl}">Register for Event ${icon('arrow-right')}</a>` : ''}
            <a class="btn btn-outline" href="events.html">Back to Events</a>
          </div>
        </div>
      </div>
    </section>`;
  }

  function past(e) {
    const photos = (e.photos || []).length ? e.photos : Array(6).fill('');
    const f = e.featured;
    const takeaways = (e.takeaways || [])
      .map((t, i) => `<div class="takeaway"><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></div></div>`).join('');
    return `
    <section class="page-hero" style="padding-bottom:22px">
      <div class="container">
        ${crumbs([['Home', 'index.html'], ['Events', 'events.html'], ['Past Events', 'past-events.html'], ['Event Highlights']])}
        <span class="badge caps lg" style="margin-top:22px">${spotlightLabel(e)}</span>
        <h1 style="font-size:clamp(32px,4.2vw,46px)">${esc(e.title)}</h1>
        <div class="meta-strip">
          <div>${icon('calendar')}<span>${esc(fmt.date(e.event_date))}<br><span style="font-weight:400">${esc(fmt.weekday(e.event_date))}</span></span></div>
          ${e.start_time ? `<div>${icon('clock')}${esc(fmt.timeRange(e.start_time, e.end_time))}</div>` : ''}
          <div>${icon('pin')}${esc(e.venue_name || 'Hyderabad')}</div>
          <div>${icon('users')}${spotlightLabel(e)}</div>
        </div>
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <h2 class="title sm">About This Gathering</h2>
        <div style="margin-top:14px;max-width:880px">${paras(e.summary || e.description || e.short_description || 'Highlights from this gathering will be shared here soon.')}</div>
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <h2 class="title sm" style="margin-bottom:18px">Moments From the Event</h2>
        <div class="gallery">${photos.map((p) => (p ? `<a href="${esc(p)}" target="_blank" rel="noopener">${media(p, { label: e.title })}</a>` : media(''))).join('')}</div>
      </div>
    </section>

    ${f ? `<section class="section tight">
      <div class="container">
        <h2 class="title sm" style="margin-bottom:18px">Featured Entrepreneur</h2>
        <div class="panel featured-person">${media(f.photo_url, { label: f.photo_url ? f.name : '' })}
          <div><h3>${esc(f.name)}</h3><p>${esc(f.designation || '')}${f.company ? `<br>${esc(f.company)}` : ''}</p>${f.topic ? `<span class="badge">${esc(f.topic)}</span>` : ''}</div></div>
      </div>
    </section>` : ''}

    ${takeaways ? `<section class="section tight">
      <div class="container">
        <h2 class="title sm" style="margin-bottom:18px">Key Moments &amp; Takeaways</h2>
        <div class="takeaways">${takeaways}</div>
      </div>
    </section>` : ''}

    <section class="cta-light" style="margin-top:20px">
      <div class="container no-icon" style="grid-template-columns:1fr auto">
        <div><h2 class="title sm">Explore More HEH Events</h2><p style="margin-top:12px">Connect with entrepreneurs, exchange ideas and explore meaningful business opportunities through HEH.</p></div>
        <div class="actions"><a class="btn btn-primary" href="events.html">View Upcoming Events ${icon('arrow-right')}</a><a class="btn btn-outline" href="past-events.html">Back to Past Events</a></div>
      </div>
    </section>`;
  }

  (async () => {
    if (!slug) return (location.href = 'events.html');
    try {
      const e = await api(`/events/${encodeURIComponent(slug)}`);
      document.title = `${e.title} | Hyderabad Entrepreneurs Hub`;
      main.innerHTML = e.is_past ? past(e) : upcoming(e);
    } catch (err) {
      main.innerHTML = `<section class="section"><div class="container empty">${err.status === 404 ? 'This event could not be found.' : esc(err.message)}<br><br><a class="btn btn-primary" href="events.html">Back to Events</a></div></section>`;
    }
  })();
})();
