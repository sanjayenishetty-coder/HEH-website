import { useState } from 'react';
import { api } from '../lib/api.js';

// Read a <form>'s named fields (checkboxes as booleans, text trimmed).
export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  }
  return out;
}

// Submit handling for a form that posts to the API.
// submit(e, path, extra?, method?) resolves with the response, or null after showing the errors.
export function useSubmit() {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e, path, extra = {}, method = 'POST') {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      return await api(path, { method, body: { ...formData(form), ...extra } });
    } catch (err) {
      showErrors(form, err, setErrors, setFormError);
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { errors, setErrors, formError, setFormError, busy, submit };
}

// Field errors go next to their fields (and focus the first); anything else goes in the form's error box.
export function showErrors(form, err, setErrors, setFormError) {
  const errs = err.errors || {};
  setErrors(errs);
  const first = Object.keys(errs).map((n) => form?.elements[n]).find(Boolean);
  if (first) setTimeout(() => first.focus(), 0);
  else setFormError(err.message);
}

// .field wrapper with the inline error message used across the site's forms.
export function Field({ label, htmlFor, error, className = '', children }) {
  return (
    <div className={`field ${error ? 'invalid' : ''} ${className}`.replace(/\s+/g, ' ').trim()}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export function FormError({ message, style }) {
  if (!message) return null;
  return (
    <div className="form-error" style={style} ref={(el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
      {message}
    </div>
  );
}

// <textarea maxLength> with the "12 / 500" counter from the designs.
export function CountedTextarea({ maxLength, defaultValue = '', ...props }) {
  const [n, setN] = useState(String(defaultValue).length);
  return (
    <>
      <textarea maxLength={maxLength} defaultValue={defaultValue} onInput={(e) => setN(e.currentTarget.value.length)} {...props} />
      <span className="counter">{n} / {maxLength}</span>
    </>
  );
}

// <select> with a placeholder option.
export function Select({ options = [], placeholder, ...props }) {
  return (
    <select {...props}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
