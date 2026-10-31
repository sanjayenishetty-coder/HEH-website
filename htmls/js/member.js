// Member profile page + "Send Enquiry" modal (enquiries go to HEH, not directly to the member).
(function () {
  'use strict';
  const { api, esc, icon, media, param, industryBadge, formData, showErrors, clearErrors, bindCounters, swapIcons } = window.HEH;
  const main = document.querySelector('[data-member]');
  const slug = param('m');
  const OFFER_STYLE = [['blue', 'laptop'], ['', 'cloud'], ['green', 'gear'], ['purple', 'chart'], ['', 'handshake'], ['blue', 'bulb']];

  const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const paras = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p}</p>`).join('');

  function render(m) {
    const trio = [['target', 'Experience', m.experience], ['bulb', 'Expertise', m.expertise], ['chart-line', 'Passion', m.passion]].filter((x) => x[2]);
    const offers = m.offers || [];
    const opp = m.opportunities || [];
    const interests = m.collaboration_interests || [];
    return `
    <section class="page-hero" style="padding-bottom:28px">
      <div class="container">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a>${icon('chevron-right')}<a href="community.html">Our Community</a>${icon('chevron-right')}<a href="members.html">Member Directory</a>${icon('chevron-right')}<span>Member Profile</span></nav>
        <div class="panel profile-head" style="margin-top:20px">
          ${media(m.photo_url, { label: m.photo_url ? m.full_name : '', iconName: 'user', cls: m.photo_url ? '' : 'person' })}
          <div>
            <h1>${esc(m.full_name)}</h1>
            <div class="role">${esc(m.designation)}<br>${esc(m.company)}</div>
            ${m.industry ? industryBadge(m.industry) : ''}
            <div class="facts">
              <div>${icon('shield')}<span><b>HEH Member</b>Active Member</span></div>
              <div>${icon('pin')}<span><b>${esc(m.location || 'Hyderabad, Telangana')}</b>Business Location</span></div>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="button" data-enquire="connect">Connect Through HEH ${icon('arrow-right')}</button>
            <button class="btn btn-outline" type="button" data-enquire="enquiry">${icon('mail')} Send Enquiry</button>
            <small>Your enquiry will be shared with the member through HEH. Personal contact details are not shared publicly.</small>
          </div>
        </div>
      </div>
    </section>

    ${m.bio || trio.length ? `<section class="section tight" style="border-bottom:1px solid var(--line-cool)">
      <div class="container">
        <h2 class="title">About the Entrepreneur</h2>
        <div class="about-person" style="margin-top:22px">
          <div style="font-size:16px">${paras(m.bio || '')}</div>
          ${trio.length ? `<div class="panel soft trio">${trio.map(([ic, h, t]) => `<div>${icon(ic)}<h3>${h}</h3><p>${esc(t)}</p></div>`).join('')}</div>` : ''}
        </div>
      </div>
    </section>` : ''}

    <section class="section tight">
      <div class="container">
        <h2 class="title" style="margin-bottom:22px">About the Business</h2>
        <div class="panel biz">
          ${media(m.company_image_url, { label: m.company_image_url ? m.company : '', iconName: 'building' })}
          <div class="mid">
            <h3>${esc(m.company)}</h3>
            ${m.company_tagline ? `<p style="margin-top:6px;font-size:15.5px">${esc(m.company_tagline)}</p>` : ''}
            <div class="fact">${icon('building')}<span><b>Industry</b>${esc(m.industry || '—')}</span></div>
            <div class="fact">${icon('pin')}<span><b>Business Location</b>${esc(m.location || 'Hyderabad, Telangana')}</span></div>
          </div>
          <div class="right">
            ${m.company_about ? `<h4 style="margin-top:0">About the Company</h4><p>${esc(m.company_about)}</p>` : ''}
            ${m.products_services ? `<h4>Products / Services</h4><p>${esc(m.products_services)}</p>` : ''}
            ${m.website ? `<a class="btn btn-outline-orange btn-sm" style="margin-top:18px" href="${esc(m.website)}" target="_blank" rel="noopener nofollow">${icon('external')} Visit Company Website ${icon('arrow-right')}</a>` : ''}
          </div>
        </div>
      </div>
    </section>

    ${offers.length ? `<section class="section tight">
      <div class="container">
        <h2 class="title" style="margin-bottom:22px">What We Offer</h2>
        <div class="card-grid">${offers.map((o, i) => `<div class="panel offer"><span class="ic lg ${OFFER_STYLE[i % OFFER_STYLE.length][0]}" style="width:60px;height:60px">${icon(OFFER_STYLE[i % OFFER_STYLE.length][1])}</span><div><h3>${esc(o.title)}</h3><p>${esc(o.text || '')}</p></div></div>`).join('')}</div>
      </div>
    </section>` : ''}

    ${opp.length || interests.length ? `<section class="section tight">
      <div class="container">
        <h2 class="title" style="margin-bottom:22px">Let’s Connect &amp; Collaborate</h2>
        <div class="two-col">
          ${opp.length ? `<div class="collab panel blue">${icon('handshake', 'big')}<div><h3>Business Opportunities</h3>${list(opp)}</div></div>` : ''}
          ${interests.length ? `<div class="collab panel soft">${icon('users', 'big').replace('class="i big', 'style="color:var(--orange)" class="i big')}<div><h3>Collaboration Interests</h3>${list(interests)}</div></div>` : ''}
        </div>
      </div>
    </section>` : ''}

    <section class="section tight" style="padding-bottom:48px">
      <div class="btn-row center">
        <a class="btn btn-primary" href="members.html" style="min-width:220px">Explore More Members ${icon('arrow-right')}</a>
        <a class="btn btn-outline" href="community.html" style="min-width:220px">Back to Our Community</a>
      </div>
    </section>`;
  }

  // ---------- Enquiry modal ----------
  const modal = document.querySelector('[data-modal]');
  const form = document.getElementById('member-enquiry');
  const open = (title) => {
    document.querySelector('[data-modal-title]').textContent = title;
    clearErrors(form);
    modal.hidden = false;
    form.elements.full_name.focus();
  };
  const close = () => (modal.hidden = true);
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  bindCounters(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      const res = await api(`/members/${encodeURIComponent(slug)}/enquiry`, { method: 'POST', body: formData(form) });
      location.href = `enquiry-submitted.html?ref=${encodeURIComponent(res.ref)}&t=${res.token}`;
    } catch (err) {
      btn.disabled = false;
      showErrors(form, err);
    }
  });

  (async () => {
    if (!slug) return (location.href = 'members.html');
    try {
      const m = await api(`/members/${encodeURIComponent(slug)}`);
      document.title = `${m.full_name} | HEH Member`;
      main.innerHTML = render(m);
      swapIcons(main);
      main.addEventListener('click', (e) => {
        const b = e.target.closest('[data-enquire]');
        if (b) open(b.dataset.enquire === 'connect' ? `Connect with ${m.full_name} through HEH` : `Send an enquiry to ${m.full_name}`);
      });
    } catch (err) {
      main.innerHTML = `<section class="section"><div class="container empty">${err.status === 404 ? 'This member profile could not be found.' : esc(err.message)}<br><br><a class="btn btn-primary" href="members.html">Back to Members</a></div></section>`;
    }
  })();
})();
