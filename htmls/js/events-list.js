// Event card grid with category / year / month filters. <main data-when="upcoming|past">.
(function () {
  'use strict';
  const { api, esc, fmt, icon, media, eventBadge } = window.HEH;
  const when = document.querySelector('main').dataset.when;
  const grid = document.querySelector('[data-grid]');
  const moreBtn = document.querySelector('[data-more]');
  const yearSel = document.querySelector('[name="year"]');
  const monthSel = document.querySelector('[name="month"]');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  monthSel.innerHTML = '<option value="">All Months</option>' + MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');

  const state = { category: '', year: '', month: '', offset: 0 };
  const PAGE = 6;
  let yearsLoaded = false;

  const card = (e) => {
    const url = `event.html?e=${encodeURIComponent(e.slug)}`;
    const action = when === 'past'
      ? `<a class="btn btn-outline-orange btn-sm" href="${url}">View Highlights ${icon('arrow-right')}</a>`
      : `<a class="btn btn-outline-orange btn-sm" href="${url}">View Details ${icon('arrow-right')}</a>`;
    return `<article class="tile">
      <div style="position:relative">${eventBadge(e.category).replace('class="badge', 'style="position:absolute;top:10px;left:10px;z-index:1" class="badge')}${media(e.image_url, { label: e.image_url ? e.title : 'Event image will be displayed here' })}</div>
      <div class="body">
        <h3><a href="${url}">${esc(e.title)}</a></h3>
        <div class="foot" style="margin-top:2px">
          <div class="meta"><span>${icon('calendar')}${esc(fmt.date(e.event_date))}</span><span>${icon('pin')}${esc(e.venue_name || 'Hyderabad')}</span></div>
          ${action}
        </div>
      </div></article>`;
  };

  async function load(append = false) {
    if (!append) { state.offset = 0; grid.innerHTML = '<div class="loading" style="grid-column:1/-1">Loading events…</div>'; }
    moreBtn.disabled = true;
    const q = new URLSearchParams({ when, limit: PAGE, offset: state.offset });
    for (const k of ['category', 'year', 'month']) if (state[k]) q.set(k, state[k]);
    try {
      const data = await api(`/events?${q}`);
      if (!yearsLoaded) {
        yearSel.innerHTML = '<option value="">All Years</option>' + data.years.map((y) => `<option>${y}</option>`).join('');
        yearsLoaded = true;
      }
      const html = data.items.map(card).join('');
      if (append) grid.insertAdjacentHTML('beforeend', html);
      else grid.innerHTML = html || `<div class="empty" style="grid-column:1/-1">${when === 'past' ? 'No past events match these filters yet.' : 'New events will be announced soon. Check back shortly or <a class="link-arrow" href="past-events.html">explore past events</a>.'}</div>`;
      state.offset += data.items.length;
      moreBtn.hidden = state.offset >= data.total;
    } catch (err) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Could not load events. ${esc(err.message)}</div>`;
      moreBtn.hidden = true;
    } finally {
      moreBtn.disabled = false;
    }
  }

  document.querySelectorAll('.seg button').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b));
      state.category = b.dataset.cat;
      load();
    }));
  yearSel.addEventListener('change', () => { state.year = yearSel.value; load(); });
  monthSel.addEventListener('change', () => { state.month = monthSel.value; load(); });
  moreBtn.addEventListener('click', () => load(true));
  load();
})();
