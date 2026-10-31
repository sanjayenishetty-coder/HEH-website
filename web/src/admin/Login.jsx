import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { Field, FormError, formData, showErrors } from '../components/forms.jsx';

export default function Login({ onSignedIn }) {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const password = useRef();
  useEffect(() => { password.current?.focus(); }, []);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      await api('/admin/login', { method: 'POST', body: formData(form) });
      form.password.value = '';
      onSignedIn();
    } catch (err) {
      showErrors(form, err, setErrors, setFormError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login">
      <form className="panel pad" noValidate onSubmit={submit}>
        <div className="logo"><img src="/assets/brand/logo.png" alt="Hyderabad Entrepreneurs Hub" width="448" height="136" /></div>
        <h1 style={{ fontSize: 26, textAlign: 'center', margin: '18px 0 22px' }}>Admin Sign In</h1>
        <Field label="Username" htmlFor="username" error={errors.username}>
          <input className="input" id="username" name="username" autoComplete="username" defaultValue="admin" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" ref={password} />
        </Field>
        <FormError message={formError} style={{ marginTop: 14 }} />
        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} type="submit" disabled={busy}>Sign In</button>
        <p style={{ marginTop: 16, textAlign: 'center' }}><a className="link-arrow navy" href="/">Back to website</a></p>
      </form>
    </section>
  );
}
