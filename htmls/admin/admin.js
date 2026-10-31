// HEH admin panel: submissions (applications, enquiries, registrations) and content (events, members, stories).
(function () {
  'use strict';
  const { api, esc, fmt, formData, showErrors } = window.HEH;
  const $ = (s, r = document) => r.querySelector(s);
  const view = $('[data-view]');
  const editor = $('[data-editor]');
  const editorBox = $('[data-editor-box]');
  let meta = { industries: [], storyCategories: [], eventCategories: [] };

  // ---------- utilities ----------
  function toast(msg, error = false) {
    const t = $('[data-toast]');
    t.textContent = msg;
    t.classList.toggle('error', error);
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 3000);
  }
  async function call(path, opts) {
    try {
      return await api(`/admin${path}`, opts);
    } catch (err) {
      if (err.status === 401) showLogin();
      throw err;
    }
  }
  const label = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const pill = (s) => `<span class="pill ${esc(s)}">${esc(label(s))}</span>`;
  const yes = (b) => `<span class="pill ${b ? 'yes' : 'no'}">${b ? 'Yes' : 'No'}</span>`;
  const statusSelect = (statuses, current, id) =>
    `<select class="input" data-status="${id}">${statuses.map((s) => `<option value="${s}"${s === current ? ' selected' : ''}>${label(s)}</option>`).join('')}</select>`;
  const openEditor = (html) => { editorBox.innerHTML = html; editor.hidden = false; editorBox.scrollTop = 0; };
  const closeEditor = () => { editor.hidden = true; editorBox.innerHTML = ''; };
  editor.addEventListener('mousedown', (e) => { if (e.target === editor) closeEditor(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !editor.hidden) closeEditor(); });

  // ---------- auth ----------
  function showLogin() {
    $('[data-app]').hidden = true;
    $('[data-login]').hidden = false;
    closeEditor();
    $('#password').focus();
  }
  async function showApp() {
    $('[data-login]').hidden = true;
    $('[data-app]').hidden = false;
    meta = await call('/meta');
    route();
  }
  $('#login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await api('/admin/login', { method: 'POST', body: formData(form) });
      form.password.value = '';
      showApp();
    } catch (err) {
      showErrors(form, err);
    } finally {
      btn.disabled = false;
    }
  });
  $('[data-logout]').addEventListener('click', async () => {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  });

  // ---------- routing ----------
  const TABS = {
    dashboard: renderDashboard,
    applications: () => renderSubmissions('applications'),
    enquiries: () => renderSubmissions('enquiries'),
    registrations: () => renderSubmissions('registrations'),
    events: () => renderContent('events'),
    members: () => renderContent('members'),
    stories: () => renderContent('stories'),
  };
  function route() {
    const tab = location.hash.slice(1).split('?')[0] || 'dashboard';
    const fn = TABS[tab] || TABS.dashboard;
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    view.innerHTML = '<div class="loading">Loading…</div>';
    fn().catch((err) => (view.innerHTML = `<div class="empty">${esc(err.message)}</div>`));
  }
  window.addEventListener('hashchange', route);
  $('[data-tabs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) location.hash = b.dataset.tab;
  });

  // ---------- dashboard ----------
  async function renderDashboard() {
    const s = await call('/summary');
    const card = (n, text, tab) => `<div class="stat" data-go="${tab}"><b>${n}</b><span>${text}</span></div>`;
    view.innerHTML = `<h1>Dashboard</h1>
      <div class="stats">
        ${card(s.new_applications, 'New membership applications', 'applications')}
        ${card(s.new_enquiries, 'New enquiries', 'enquiries')}
        ${card(s.upcoming_registrations, 'Registrations for upcoming events', 'registrations')}
        ${card(s.upcoming_events, 'Upcoming events', 'events')}
        ${card(s.active_members, 'Active members', 'members')}
        ${card(s.published_stories, 'Published stories', 'stories')}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">New items have status “Received”. Open a list, click a row to see full details, and change the status as you follow up.</p>`;
    view.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => (location.hash = el.dataset.go)));
  }

  // ---------- submissions ----------
  const SUB = {
    applications: {
      title: 'Membership Applications',
      head: ['Reference', 'Applicant', 'Company', 'Category', 'Submitted', 'Status'],
      row: (r) => [`<b>${esc(r.ref)}</b>`, `${esc(r.full_name)}<div class="sub">${esc(r.mobile)} · ${esc(r.email)}</div>`, esc(r.company_name), esc(r.business_category), esc(fmt.stamp(r.created_at))],
      detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Designation', r.designation], ['LinkedIn', r.linkedin],
        ['Company', r.company_name], ['Business category', r.business_category], ['Year established', r.year_established], ['Business location', r.business_location],
        ['Website', r.website], ['Annual turnover', r.turnover_range], ['Business description', r.business_description], ['Submitted', fmt.stamp(r.created_at)]],
      notes: true,
    },
    enquiries: {
      title: 'Enquiries',
      head: ['Reference', 'From', 'Type', 'Message', 'Submitted', 'Status'],
      row: (r) => [`<b>${esc(r.ref)}</b>`, `${esc(r.full_name)}<div class="sub">${esc(r.mobile)} · ${esc(r.email)}${r.company ? ` · ${esc(r.company)}` : ''}</div>`,
        `${esc(r.enquiry_type)}${r.member_name ? `<div class="sub">For member: ${esc(r.member_name)}</div>` : ''}`, `<div style="max-width:320px">${esc(r.message.slice(0, 140))}${r.message.length > 140 ? '…' : ''}</div>`, esc(fmt.stamp(r.created_at))],
      detail: (r) => [['Reference', r.ref], ['Full name', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Company', r.company], ['Enquiry type', r.enquiry_type],
        ['For member', r.member_name], ['Message', r.message], ['Submitted', fmt.stamp(r.created_at)]],
      notes: true,
    },
    registrations: {
      title: 'Event Registrations',
      head: ['Registration ID', 'Participant', 'Membership ID', 'Event', 'Registered', 'Status'],
      row: (r) => [`<b>${esc(r.ref)}</b>`, `${esc(r.full_name)}<div class="sub">${esc(r.mobile)}${r.email ? ` · ${esc(r.email)}` : ''} · ${esc(r.company)}</div>`, esc(r.membership_id),
        `${esc(r.event_title)}<div class="sub">${esc(fmt.date(r.event_date))}</div>`, esc(fmt.stamp(r.created_at))],
      detail: (r) => [['Registration ID', r.ref], ['Participant', r.full_name], ['Mobile', r.mobile], ['Email', r.email], ['Company', r.company], ['Membership ID', r.membership_id],
        ['Event', `${r.event_title} (${fmt.date(r.event_date)})`], ['Registered', fmt.stamp(r.created_at)]],
      notes: false,
    },
  };

  async function renderSubmissions(name) {
    const def = SUB[name];
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const params = new URLSearchParams();
    if (q.get('status')) params.set('status', q.get('status'));
    if (q.get('event_id')) params.set('event_id', q.get('event_id'));
    const [data, events] = await Promise.all([
      call(`/${name}?${params}`),
      name === 'registrations' ? call('/events') : Promise.resolve(null),
    ]);
    const rows = data.items;
    view.innerHTML = `<div class="bar"><h1>${def.title} <span class="muted" style="font-size:18px">(${rows.length})</span></h1>
      <div class="filters">
        ${events ? `<select class="input" data-filter="event_id"><option value="">All events</option>${events.items.map((e) => `<option value="${e.id}"${String(e.id) === q.get('event_id') ? ' selected' : ''}>${esc(e.title)} – ${esc(fmt.date(e.event_date))}</option>`).join('')}</select>` : ''}
        <select class="input" data-filter="status"><option value="">All statuses</option>${data.statuses.map((s) => `<option value="${s}"${s === q.get('status') ? ' selected' : ''}>${label(s)}</option>`).join('')}</select>
        <button class="btn btn-outline btn-sm" data-csv>Export CSV</button>
      </div></div>
      <div class="table-wrap"><table class="data"><thead><tr>${def.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr class="clickable" data-id="${r.id}">${def.row(r).map((c) => `<td>${c}</td>`).join('')}<td>${statusSelect(data.statuses, r.status, r.id)}</td></tr>`).join('')
        || `<tr><td colspan="${def.head.length}" class="muted" style="text-align:center;padding:30px">Nothing here yet.</td></tr>`}</tbody></table></div>`;

    view.querySelectorAll('[data-filter]').forEach((sel) => sel.addEventListener('change', () => {
      const p = new URLSearchParams(location.hash.split('?')[1] || '');
      if (sel.value) p.set(sel.dataset.filter, sel.value); else p.delete(sel.dataset.filter);
      location.hash = `${name}${p.toString() ? `?${p}` : ''}`;
    }));
    view.querySelectorAll('[data-status]').forEach((sel) => {
      sel.addEventListener('click', (e) => e.stopPropagation());
      sel.addEventListener('change', async () => {
        try {
          await call(`/${name}/${sel.dataset.status}`, { method: 'PATCH', body: { status: sel.value } });
          rows.find((r) => String(r.id) === sel.dataset.status).status = sel.value;
          toast('Status updated');
        } catch (err) { toast(err.message, true); }
      });
    });
    view.querySelectorAll('tr[data-id]').forEach((tr) => tr.addEventListener('click', () => {
      const r = rows.find((x) => String(x.id) === tr.dataset.id);
      openEditor(`<div class="editor detail"><h2>${esc(def.title.replace(/s$/, ''))} ${esc(r.ref)}</h2>
        <dl>${def.detail(r).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}
        <dt>Status</dt><dd>${pill(r.status)}</dd></dl>
        ${def.notes ? `<div class="field" style="margin-top:18px"><label for="notes">Internal notes (not visible to the applicant)</label><textarea class="input" id="notes">${esc(r.admin_notes || '')}</textarea></div>` : ''}
        <div class="actions">${def.notes ? '<button class="btn btn-primary btn-sm" data-save-notes>Save notes</button>' : ''}<button class="btn btn-outline btn-sm" data-close>Close</button></div></div>`);
      editorBox.querySelector('[data-close]').onclick = closeEditor;
      const save = editorBox.querySelector('[data-save-notes]');
      if (save) save.onclick = async () => {
        try {
          const admin_notes = $('#notes').value;
          await call(`/${name}/${r.id}`, { method: 'PATCH', body: { admin_notes } });
          r.admin_notes = admin_notes;
          toast('Notes saved');
          closeEditor();
        } catch (err) { toast(err.message, true); }
      };
    }));
    view.querySelector('[data-csv]').addEventListener('click', () => {
      const keys = Object.keys(rows[0] || {}).filter((k) => !['id', 'token'].includes(k));
      const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' }));
      a.download = `heh-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    });
  }

  // ---------- content editors ----------
  // Field spec: [name, label, type, extra]. Types: text, textarea, date, time, url, image, select, check, lines, pairs, triples, photos, group
  const CONTENT = {
    events: {
      title: 'Events',
      single: 'Event',
      head: ['Title', 'Date', 'Venue', 'Registrations', 'Registration open', 'Published'],
      row: (e) => [`<b>${esc(e.title)}</b><div class="sub">${e.category === 'workshop' ? 'Workshop' : 'Spotlight'} · /event.html?e=${esc(e.slug)}</div>`, esc(fmt.date(e.event_date)), esc(e.venue_name),
        `<a href="#registrations?event_id=${e.id}" data-stop>${e.registrations}</a>`, yes(e.registration_open), yes(e.published)],
      publicUrl: (e) => `../event.html?e=${encodeURIComponent(e.slug)}`,
      defaults: { category: 'spotlight', members_only: true, registration_open: true, published: true, agenda: [], takeaways: [], photos: [] },
      fields: () => [
        ['title', 'Title *', 'text'],
        ['category', 'Category', 'select', meta.eventCategories.map((c) => [c, c === 'workshop' ? 'HEH Workshop' : 'HEH Spotlight'])],
        ['event_date', 'Date', 'date'], ['start_time', 'Start time', 'time'], ['end_time', 'End time', 'time'],
        ['short_description', 'Short description (cards & registration page)', 'text'],
        ['description', 'About the event (upcoming page)', 'textarea'],
        ['image_url', 'Event image', 'image'],
        ['venue_name', 'Venue name', 'text'], ['venue_address', 'Venue address', 'text'],
        ['map_url', 'Google Maps link (optional, for “Get Directions”)', 'url'],
        ['members_only', 'Members only (registration requires a valid HEH Membership ID)', 'check'],
        ['registration_open', 'Registration open', 'check'],
        ['published', 'Published on website', 'check'],
        ['agenda', 'Agenda — one item per line: time | title | details', 'triples', ['time', 'title', 'details']],
        ['speaker', 'Speaker', 'group', [['name', 'Name'], ['designation', 'Designation'], ['company', 'Company'], ['bio', 'Introduction', 'textarea'], ['photo_url', 'Photo', 'image']]],
        ['summary', 'About this gathering (shown after the event)', 'textarea'],
        ['photos', 'Event photos (shown after the event)', 'photos'],
        ['featured', 'Featured entrepreneur (after the event)', 'group', [['name', 'Name'], ['designation', 'Designation'], ['company', 'Company'], ['topic', 'Talk / topic'], ['photo_url', 'Photo', 'image']]],
        ['takeaways', 'Key takeaways — one per line: title | text', 'pairs', ['title', 'text']],
      ],
    },
    members: {
      title: 'Members',
      single: 'Member',
      head: ['Name', 'Membership ID', 'Company', 'Industry', 'Status'],
      row: (m) => [`<b>${esc(m.full_name)}</b><div class="sub">${esc(m.designation)}</div>`, esc(m.member_code), esc(m.company), esc(m.industry), pill(m.status === 'active' ? 'yes' : 'no').replace(/Yes|No/, label(m.status))],
      publicUrl: (m) => `../member.html?m=${encodeURIComponent(m.slug)}`,
      defaults: { status: 'active', location: 'Hyderabad, Telangana', offers: [], opportunities: [], collaboration_interests: [], sort_order: 0 },
      fields: () => [
        ['full_name', 'Full name *', 'text'], ['member_code', 'HEH Membership ID * (used for event registration)', 'text'],
        ['designation', 'Designation', 'text'], ['company', 'Company', 'text'],
        ['industry', 'Industry', 'select', meta.industries.map((i) => [i, i])], ['location', 'Business location', 'text'],
        ['photo_url', 'Profile photo', 'image'],
        ['bio', 'About the entrepreneur', 'textarea'],
        ['experience', 'Experience (short)', 'text'], ['expertise', 'Expertise (short)', 'text'], ['passion', 'Passion (short)', 'text'],
        ['company_tagline', 'Company tagline', 'text'], ['company_image_url', 'Company image / logo', 'image'],
        ['company_about', 'About the company', 'textarea'], ['products_services', 'Products / services', 'textarea'],
        ['website', 'Company website', 'url'],
        ['offers', 'What we offer — one per line: title | text', 'pairs', ['title', 'text']],
        ['opportunities', 'Business opportunities — one per line', 'lines'],
        ['collaboration_interests', 'Collaboration interests — one per line', 'lines'],
        ['email', 'Email (private, admin only)', 'text'], ['phone', 'Phone (private, admin only)', 'text'],
        ['status', 'Status', 'select', [['active', 'Active (shown on website)'], ['inactive', 'Inactive (hidden)']]],
        ['sort_order', 'Sort order (lower shows first)', 'text'],
      ],
    },
    stories: {
      title: 'Success Stories',
      single: 'Story',
      head: ['Title', 'Category', 'Published on', 'Featured', 'Published'],
      row: (s) => [`<b>${esc(s.title)}</b>`, esc(s.category), esc(fmt.date(s.published_on)), yes(s.featured), yes(s.published)],
      publicUrl: (s) => `../story.html?s=${encodeURIComponent(s.slug)}`,
      defaults: { category: 'Business Collaboration', published: true, featured: false, members_involved: [], companies: [] },
      fields: () => [
        ['title', 'Title *', 'text'], ['category', 'Category', 'select', meta.storyCategories.map((c) => [c, c])],
        ['summary', 'Summary (cards)', 'textarea'], ['body', 'Full story (blank line between paragraphs)', 'textarea'],
        ['image_url', 'Photo', 'image'],
        ['members_involved', 'Members involved — one per line', 'lines'], ['companies', 'Companies — one per line', 'lines'],
        ['business_category', 'Business category', 'text'], ['published_on', 'Published on', 'date'],
        ['featured', 'Featured story (shown at the top of Success Stories)', 'check'], ['published', 'Published on website', 'check'],
      ],
    },
  };

  async function renderContent(name) {
    const def = CONTENT[name];
    const { items } = await call(`/${name}`);
    view.innerHTML = `<div class="bar"><h1>${def.title} <span class="muted" style="font-size:18px">(${items.length})</span></h1>
      <button class="btn btn-primary btn-sm" data-new>+ Add ${def.single}</button></div>
      <div class="table-wrap"><table class="data"><thead><tr>${def.head.map((h) => `<th>${h}</th>`).join('')}<th></th></tr></thead>
      <tbody>${items.map((it) => `<tr class="clickable" data-id="${it.id}">${def.row(it).map((c) => `<td>${c}</td>`).join('')}<td><a href="${def.publicUrl(it)}" target="_blank" rel="noopener" data-stop>View</a></td></tr>`).join('')
        || `<tr><td colspan="${def.head.length + 1}" class="muted" style="text-align:center;padding:30px">Nothing yet. Click “Add ${def.single}”.</td></tr>`}</tbody></table></div>`;
    view.querySelector('[data-new]').addEventListener('click', () => edit(name, { ...def.defaults }));
    view.querySelectorAll('[data-stop]').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));
    view.querySelectorAll('tr[data-id]').forEach((tr) => tr.addEventListener('click', async () => {
      try { edit(name, await call(`/${name}/${tr.dataset.id}`)); } catch (err) { toast(err.message, true); }
    }));
  }

  const toLines = (arr) => (arr || []).join('\n');
  const toRows = (arr, keys) => (arr || []).map((o) => keys.map((k) => o[k] || '').join(' | ')).join('\n');
  const fromLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
  const fromRows = (s, keys) => fromLines(s).map((line) => {
    const parts = line.split('|').map((x) => x.trim());
    // Extra "|" characters stay in the last field.
    const o = {};
    keys.forEach((k, i) => (o[k] = i === keys.length - 1 ? parts.slice(i).join(' | ') : parts[i] || ''));
    return o;
  });

  function fieldHtml([name, text, type, extra], value, prefix = '') {
    const id = `f_${prefix}${name}`;
    const n = `${prefix}${name}`;
    const v = value ?? '';
    switch (type) {
      case 'textarea': return `<div class="field full"><label for="${id}">${text}</label><textarea class="input" id="${id}" name="${n}">${esc(v)}</textarea></div>`;
      case 'date': return `<div class="field"><label for="${id}">${text}</label><input class="input" type="date" id="${id}" name="${n}" value="${esc(v)}"></div>`;
      case 'time': return `<div class="field"><label for="${id}">${text}</label><input class="input" type="time" id="${id}" name="${n}" value="${esc(String(v).slice(0, 5))}"></div>`;
      case 'select': return `<div class="field"><label for="${id}">${text}</label><select class="input" id="${id}" name="${n}">${extra.map(([val, lab]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select></div>`;
      case 'check': return `<label class="check full"><input type="checkbox" name="${n}"${v ? ' checked' : ''}> ${text}</label>`;
      case 'image': return `<div class="field full"><label for="${id}">${text}</label><div class="img-field"><span class="thumb" style="${v ? `background-image:url('${esc(v)}')` : ''}"></span>
        <input class="input" id="${id}" name="${n}" value="${esc(v)}" placeholder="Upload an image or paste an https:// link">
        <span class="btn btn-outline btn-sm upload-btn">Upload<input type="file" accept="image/jpeg,image/png,image/webp" data-upload="${n}"></span></div></div>`;
      case 'lines': return `<div class="field full"><label for="${id}">${text}</label><textarea class="input" id="${id}" name="${n}" data-kind="lines">${esc(toLines(v))}</textarea></div>`;
      case 'pairs':
      case 'triples': return `<div class="field full"><label for="${id}">${text}</label><textarea class="input" id="${id}" name="${n}" data-kind="rows" data-keys="${extra.join(',')}">${esc(toRows(v, extra))}</textarea></div>`;
      case 'photos': return `<div class="field full"><label>${text}</label><input type="hidden" name="${n}" data-kind="json" value="${esc(JSON.stringify(v || []))}">
        <div class="photo-list" data-photos="${n}"></div><span class="btn btn-outline btn-sm upload-btn" style="align-self:flex-start;margin-top:8px">Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" data-photo-upload="${n}"></span></div>`;
      case 'group': return `<fieldset class="full"><legend>${text}</legend><div class="form-grid">${extra.map(([k, l, t]) => fieldHtml([k, l, t || 'text'], (v || {})[k], `${name}.`)).join('')}</div>
        <p class="hint" style="margin-top:8px">Leave all fields empty to hide this section.</p></fieldset>`;
      case 'url':
      default: return `<div class="field"><label for="${id}">${text}</label><input class="input" id="${id}" name="${n}" value="${esc(v)}"></div>`;
    }
  }

  async function uploadFile(file) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) showLogin();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  function edit(name, item) {
    const def = CONTENT[name];
    const fields = def.fields();
    openEditor(`<form class="editor" novalidate>
      <h2>${item.id ? `Edit ${def.single}` : `New ${def.single}`}</h2>
      <div class="form-grid">${fields.map((f) => fieldHtml(f, item[f[0]])).join('')}</div>
      <div class="form-error" hidden style="margin-top:14px"></div>
      <div class="actions">
        ${item.id ? '<button type="button" class="btn btn-sm danger" data-delete>Delete</button>' : ''}
        <button type="button" class="btn btn-outline btn-sm" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div></form>`);
    const form = editorBox.querySelector('form');
    form.querySelector('[data-close]').onclick = closeEditor;

    // photo gallery
    const renderPhotos = (n) => {
      const hidden = form.elements[n];
      const list = JSON.parse(hidden.value || '[]');
      form.querySelector(`[data-photos="${n}"]`).innerHTML = list.map((u, i) => `<span class="p" style="background-image:url('${esc(u)}')"><button type="button" data-rm="${i}" aria-label="Remove">×</button></span>`).join('');
      form.querySelectorAll(`[data-photos="${n}"] [data-rm]`).forEach((b) => (b.onclick = () => {
        list.splice(Number(b.dataset.rm), 1);
        hidden.value = JSON.stringify(list);
        renderPhotos(n);
      }));
    };
    form.querySelectorAll('[data-photos]').forEach((el) => renderPhotos(el.dataset.photos));
    form.querySelectorAll('[data-photo-upload]').forEach((inp) => inp.addEventListener('change', async () => {
      const n = inp.dataset.photoUpload;
      const hidden = form.elements[n];
      for (const file of inp.files) {
        try {
          const url = await uploadFile(file);
          hidden.value = JSON.stringify([...JSON.parse(hidden.value || '[]'), url]);
          renderPhotos(n);
        } catch (err) { toast(err.message, true); }
      }
      inp.value = '';
    }));
    form.querySelectorAll('[data-upload]').forEach((inp) => inp.addEventListener('change', async () => {
      if (!inp.files[0]) return;
      try {
        const url = await uploadFile(inp.files[0]);
        const target = form.elements[inp.dataset.upload];
        target.value = url;
        target.parentElement.querySelector('.thumb').style.backgroundImage = `url('${url}')`;
        toast('Image uploaded');
      } catch (err) { toast(err.message, true); }
      inp.value = '';
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {};
      for (const el of form.elements) {
        if (!el.name || el.type === 'file') continue;
        let val = el.type === 'checkbox' ? el.checked : el.value.trim();
        if (el.dataset.kind === 'lines') val = fromLines(val);
        if (el.dataset.kind === 'rows') val = fromRows(val, el.dataset.keys.split(','));
        if (el.dataset.kind === 'json') val = JSON.parse(val || '[]');
        if (el.name.includes('.')) {
          const [group, key] = el.name.split('.');
          body[group] = body[group] || {};
          body[group][key] = val;
        } else body[el.name] = val;
      }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        await call(item.id ? `/${name}/${item.id}` : `/${name}`, { method: item.id ? 'PUT' : 'POST', body });
        toast(`${def.single} saved`);
        closeEditor();
        route();
      } catch (err) {
        showErrors(form, err);
      } finally {
        btn.disabled = false;
      }
    });

    const del = form.querySelector('[data-delete]');
    if (del) del.onclick = async () => {
      const extra = name === 'events' ? ' All registrations for this event will also be deleted.' : '';
      if (!confirm(`Delete this ${def.single.toLowerCase()}?${extra} This cannot be undone.`)) return;
      try {
        await call(`/${name}/${item.id}`, { method: 'DELETE' });
        toast(`${def.single} deleted`);
        closeEditor();
        route();
      } catch (err) { toast(err.message, true); }
    };
  }

  // ---------- start ----------
  api('/admin/me').then(showApp).catch(showLogin);
})();
