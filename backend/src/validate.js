// Tiny field validator. Each rule returns the cleaned value or throws a ValidationError.

class ValidationError extends Error {
  constructor(errors) {
    super('Please check the highlighted fields.');
    this.status = 400;
    this.errors = errors; // { field: message }
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;

const rules = {
  text: ({ required = false, max = 200, min = 0, label = 'This field' } = {}) => (v) => {
    const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
    if (!s) {
      if (required) throw `${label} is required.`;
      return '';
    }
    if (s.length < min) throw `${label} must be at least ${min} characters.`;
    if (s.length > max) throw `${label} must be at most ${max} characters.`;
    return s;
  },
  email: ({ required = false } = {}) => (v) => {
    const s = rules.text({ required, max: 160, label: 'Email address' })(v);
    if (s && !EMAIL_RE.test(s)) throw 'Enter a valid email address.';
    return s.toLowerCase();
  },
  mobile: ({ required = true } = {}) => (v) => {
    const digits = String(v ?? '').replace(/[\s\-()]/g, '').replace(/^\+?91(?=\d{10}$)/, '');
    if (!digits) {
      if (required) throw 'Mobile number is required.';
      return '';
    }
    if (!/^[6-9]\d{9}$/.test(digits)) throw 'Enter a valid 10-digit Indian mobile number.';
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  },
  url: ({ required = false, label = 'URL' } = {}) => (v) => {
    let s = rules.text({ required, max: 300, label })(v);
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    if (!URL_RE.test(s)) throw `Enter a valid ${label.toLowerCase()}.`;
    return s;
  },
  oneOf: (list, { required = true, label = 'This field' } = {}) => (v) => {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s) {
      if (required) throw `${label} is required.`;
      return '';
    }
    if (!list.includes(s)) throw `Choose a valid ${label.toLowerCase()}.`;
    return s;
  },
  int: ({ required = true, min, max, label = 'This field' } = {}) => (v) => {
    if (v === '' || v == null) {
      if (required) throw `${label} is required.`;
      return null;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || (min != null && n < min) || (max != null && n > max)) {
      throw `Enter a valid ${label.toLowerCase()}.`;
    }
    return n;
  },
  checked: (message) => (v) => {
    if (v !== true && v !== 'true' && v !== 'on' && v !== 1) throw message;
    return true;
  },
};

function validate(body, schema) {
  const out = {};
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    try {
      out[field] = rule(body?.[field]);
    } catch (msg) {
      if (typeof msg !== 'string') throw msg;
      errors[field] = msg;
    }
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return out;
}

module.exports = { validate, rules, ValidationError };
