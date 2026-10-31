// Membership application: 3 steps on one page, draft kept in sessionStorage until submitted.
(function () {
  'use strict';
  const { api, esc, icon, formData, clearErrors, showErrors, bindCounters, fillSelect, meta } = window.HEH;
  const KEY = 'heh-application-draft';
  const forms = { 1: document.querySelector('form[data-step="1"]'), 2: document.querySelector('form[data-step="2"]'), 3: document.querySelector('form[data-step="3"]') };
  const HERO = {
    1: ['Apply', 'Begin Your HEH Journey', 'Share a few details about yourself and your business to begin your membership application.'],
    2: ['Apply', 'Tell Us About Your Business', 'Help us understand your business and professional background as part of your HEH membership application.'],
    3: ['Review', 'Review Your Application', 'Please review your information carefully before submitting your application to Hyderabad Entrepreneurs Hub.'],
  };

  let draft = {};
  try { draft = JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { draft = {}; }
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(draft));

  // Year options: this year back to 1950.
  const yearSel = document.getElementById('year_established');
  for (let y = new Date().getFullYear(); y >= 1950; y--) yearSel.insertAdjacentHTML('beforeend', `<option>${y}</option>`);

  const restore = () => {
    for (const form of [forms[1], forms[2]]) {
      for (const el of form.elements) if (el.name && draft[el.name] != null) el.value = draft[el.name];
    }
    bindCounters();
  };

  meta().then((m) => {
    fillSelect(document.getElementById('business_category'), m.industries, 'Select business category');
    fillSelect(document.getElementById('turnover_range'), m.turnoverRanges, 'Select annual turnover range');
    restore();
  }).catch(restore);

  // Light client-side checks; the API validates everything again.
  const REQUIRED = {
    1: { full_name: 'Full name is required.', mobile: 'Mobile number is required.', email: 'Email address is required.', designation: 'Current designation is required.' },
    2: { company_name: 'Company name is required.', business_category: 'Business category is required.', year_established: 'Year established is required.', business_location: 'Business location is required.', business_description: 'Business description is required.' },
  };
  function check(step, data) {
    const errors = {};
    for (const [k, msg] of Object.entries(REQUIRED[step])) if (!data[k]) errors[k] = msg;
    if (step === 1) {
      const digits = (data.mobile || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      if (data.mobile && !/^[6-9]\d{9}$/.test(digits)) errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Enter a valid email address.';
    }
    if (step === 2 && data.business_description && data.business_description.length < 20) {
      errors.business_description = 'Please write at least 20 characters.';
    }
    return errors;
  }

  function go(step) {
    for (const [n, f] of Object.entries(forms)) f.hidden = Number(n) !== step;
    document.querySelector('[data-stepper-box]').classList.toggle('pad', true);
    // In step 3 the stepper sits alone in its panel; the review cards follow below it.
    document.querySelectorAll('.stepper .s').forEach((s) => {
      const n = Number(s.dataset.s);
      s.classList.toggle('done', n < step);
      s.classList.toggle('current', n === step);
      s.querySelector('.dot').innerHTML = n < step ? icon('check') : `0${n}`;
    });
    document.querySelectorAll('[data-aside]').forEach((el) => {
      el.hidden = !el.dataset.aside.split(' ').includes(String(step));
    });
    const [crumb, title, lead] = HERO[step];
    document.querySelector('[data-crumb]').innerHTML = step === 3 ? `<a href="#" data-go="1">Apply</a> ${icon('chevron-right')} Review` : crumb;
    document.querySelector('[data-hero-title]').textContent = title;
    document.querySelector('[data-hero-lead]').textContent = lead;
    if (step === 3) renderReview();
    history.replaceState(null, '', `#step-${step}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const row = (ic, tone, k, v) =>
    `<div class="row"><span class="ic sm ${tone}">${icon(ic)}</span><span class="k">${k}</span><span class="v">${esc(v) || '<span class="muted">—</span>'}</span></div>`;

  function renderReview() {
    const d = draft;
    document.querySelector('[data-review="personal"]').innerHTML =
      `<div class="col">${row('user', 'blue', 'Full Name', d.full_name)}${row('mail', 'blue', 'Email Address', d.email)}${row('linkedin', 'blue', 'LinkedIn Profile', d.linkedin)}</div>` +
      `<div class="col">${row('phone', '', 'Mobile Number', d.mobile ? `+91 ${d.mobile.replace(/^\+?91\s?/, '')}` : '')}${row('briefcase', 'blue', 'Current Designation', d.designation)}</div>`;
    document.querySelector('[data-review="business"]').innerHTML =
      `<div class="col">${row('building', 'blue', 'Company Name', d.company_name)}${row('tag', '', 'Business Category', d.business_category)}${row('calendar', 'blue', 'Year Established', d.year_established)}${row('pin', 'green', 'Business Location', d.business_location)}</div>` +
      `<div class="col">${row('globe', 'green', 'Company Website', d.website)}${row('chart', 'purple', 'Annual Turnover Range', d.turnover_range)}${row('file', 'blue', 'Business Description', d.business_description)}</div>`;
  }

  for (const step of [1, 2]) {
    forms[step].addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(forms[step]);
      const errors = check(step, data);
      Object.assign(draft, data);
      save();
      if (Object.keys(errors).length) return showErrors(forms[step], { message: 'Please check the highlighted fields.', errors });
      clearErrors(forms[step]);
      go(step + 1);
    });
    forms[step].addEventListener('input', (e) => {
      if (e.target.name) { draft[e.target.name] = e.target.value; save(); }
    });
  }

  forms[1].addEventListener('reset', () => {
    setTimeout(() => {
      for (const el of forms[1].elements) if (el.name) delete draft[el.name];
      save();
      clearErrors(forms[1]);
    });
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    e.preventDefault();
    go(Number(b.dataset.go));
  });

  forms[3].addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = forms[3].querySelector('[type="submit"]');
    const consent = formData(forms[3]);
    clearErrors(forms[3]);
    const missing = {};
    if (!consent.consent_accuracy) missing.consent_accuracy = 'Please confirm the information is accurate.';
    if (!consent.consent_terms) missing.consent_terms = 'Please confirm you understand the membership terms.';
    if (Object.keys(missing).length) return showErrors(forms[3], { message: 'Please accept the declaration.', errors: missing });

    btn.disabled = true;
    try {
      const res = await api('/applications', { method: 'POST', body: { ...draft, ...consent } });
      sessionStorage.removeItem(KEY);
      location.href = `membership-submitted.html?ref=${encodeURIComponent(res.ref)}&t=${res.token}`;
    } catch (err) {
      btn.disabled = false;
      const errs = err.errors || {};
      // Send the user back to the step that holds the first invalid field.
      const step = Object.keys(errs).some((k) => k in REQUIRED[1] || k === 'linkedin') ? 1
        : Object.keys(errs).some((k) => forms[2].elements[k]) ? 2 : 3;
      if (step < 3) { go(step); showErrors(forms[step], err); } else showErrors(forms[3], err);
    }
  });

  const start = Number((location.hash.match(/step-(\d)/) || [])[1]) || 1;
  go(start === 3 && !draft.company_name ? 1 : start === 2 && !draft.full_name ? 1 : start);
})();
