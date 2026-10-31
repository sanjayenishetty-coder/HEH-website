// Shared card renderers for community pages.
window.HEHCommunity = (function () {
  'use strict';
  const { esc, icon, media, industryBadge, CATEGORY_BADGE, fmt } = window.HEH;

  const memberCard = (m) => `<article class="tile member-tile">
    ${media(m.photo_url, { label: m.photo_url ? m.full_name : '', iconName: 'user', cls: m.photo_url ? '' : 'person' })}
    <div class="body">
      <h3><a href="member.html?m=${encodeURIComponent(m.slug)}">${esc(m.full_name)}</a></h3>
      <div class="role">${esc(m.designation)}<br>${esc(m.company)}</div>
      ${m.industry ? industryBadge(m.industry) : ''}
      <a class="btn btn-outline-orange btn-sm" href="member.html?m=${encodeURIComponent(m.slug)}">View Profile ${icon('arrow-right')}</a>
    </div></article>`;

  const storyCard = (s) => `<article class="tile story-tile">
    ${media(s.image_url, { label: s.image_url ? s.title : 'Admin Upload Photograph' })}
    <div class="body">
      <span class="badge ${CATEGORY_BADGE[s.category] || ''}" style="align-self:flex-start">${esc(s.category)}</span>
      <h3><a href="story.html?s=${encodeURIComponent(s.slug)}">${esc(s.title)}</a></h3>
      <p class="summary">${esc(s.summary)}</p>
      <div class="foot" style="padding-top:14px"><span style="display:flex;gap:8px;align-items:center">${icon('calendar').replace('class="i ', 'style="color:var(--orange)" class="i ')}${esc(fmt.date(s.published_on))}</span>
        <a class="link-arrow" href="story.html?s=${encodeURIComponent(s.slug)}">Read Story ${icon('arrow-right')}</a></div>
    </div></article>`;

  return { memberCard, storyCard };
})();
