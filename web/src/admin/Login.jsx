import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { Icon } from '../components/Icon.jsx';
import { formData } from '../components/forms.jsx';

// Admin sign-in and account recovery, laid out as in images/Admin Login/.../Modified Login Page Designs:
// sign in, security code / verify email (6 digits), forgot password, check your email, reset password,
// reset successful, session expired. A reset link opens /admin/?reset=<token>.
// expired: the admin was signed out while working (a 401), so start on "Session Expired".

const resetToken = () => new URLSearchParams(window.location.search).get('reset') || '';
const dropResetFromUrl = () => window.history.replaceState(null, '', window.location.pathname + window.location.hash);

export default function Login({ onSignedIn, expired = false }) {
  const [view, setView] = useState(() => (resetToken() ? 'reset' : expired ? 'expired' : 'signin'));
  const [options, setOptions] = useState({ google: null, mail: false });
  const [code, setCode] = useState(null); // { step: 'login' | 'verify', token, email }
  const [sentTo, setSentTo] = useState(''); // masked address the reset link went to
  const [lastEmail, setLastEmail] = useState('');

  useEffect(() => { api('/admin/auth-options').then(setOptions, () => {}); }, []);

  const toSignIn = () => { dropResetFromUrl(); setView('signin'); };
  let card;
  if (view === 'expired') card = <Expired onContinue={toSignIn} />;
  else if (view === 'code') card = <CodeStep {...code} onSignedIn={onSignedIn} onBack={toSignIn} />;
  else if (view === 'forgot') {
    card = <Forgot onBack={toSignIn} initial={lastEmail} onSent={(email, masked) => { setLastEmail(email); setSentTo(masked); setView('sent'); }} />;
  } else if (view === 'sent') card = <Sent email={sentTo} resendTo={lastEmail} onBack={toSignIn} />;
  else if (view === 'reset') card = <Reset token={resetToken()} onBack={toSignIn} onForgot={() => { dropResetFromUrl(); setView('forgot'); }} onDone={() => { dropResetFromUrl(); setView('done'); }} />;
  else if (view === 'done') card = <Done onContinue={toSignIn} />;
  else {
    card = (
      <SignIn
        options={options}
        onSignedIn={onSignedIn}
        onCode={(c) => { setCode(c); setView('code'); }}
        onForgot={() => setView('forgot')}
      />
    );
  }

  return (
    <section className="login">
      <div className="login-art">
        <img className="login-logo" src="/assets/brand/logo-light.png" alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
        <h1>Welcome to<br />HEH Portal</h1>
        <p>A unified portal for our community, events and collaboration.</p>
      </div>
      <div className="login-side">{card}</div>
    </section>
  );
}

// ---------- pieces ----------

function Head({ icon, title, children }) {
  return (
    <>
      <span className="login-icon"><Icon name={icon} /></span>
      <h2>{title}</h2>
      {children && <p className="sub">{children}</p>}
    </>
  );
}

function ErrorLine({ message, id }) {
  return <p className="login-error" id={id} role="alert">{message && <><Icon name="alert" /> {message}</>}</p>;
}

function BackLink({ onClick }) {
  return <p className="login-back"><button type="button" onClick={onClick}><Icon name="arrow-left" /> Back to Sign In</button></p>;
}

function PasswordInput({ name, placeholder, autoComplete, invalid, inputRef }) {
  const [show, setShow] = useState(false);
  return (
    <label className={`login-input${invalid ? ' invalid' : ''}`}>
      <Icon name="lock" />
      <input ref={inputRef} name={name} type={show ? 'text' : 'password'} placeholder={placeholder} aria-label={placeholder}
        autoComplete={autoComplete} aria-invalid={invalid ? 'true' : undefined} maxLength={200} />
      <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eye-off' : 'eye'} />
      </button>
    </label>
  );
}

function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try { return await fn(); } finally { setBusy(false); }
  };
  return [busy, run];
}

// ---------- Sign in ----------

function SignIn({ options, onSignedIn, onCode, onForgot }) {
  const [error, setError] = useState('');
  const [busy, run] = useBusy();
  const username = useRef();
  useEffect(() => { username.current?.focus(); }, []);

  function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = formData(form);
    if (!body.username || !body.password) { setError('Enter your username or email and your password.'); return; }
    setError('');
    run(async () => {
      try {
        const res = await api('/admin/login', { method: 'POST', body });
        form.password.value = '';
        if (res.step) onCode(res);
        else onSignedIn();
      } catch (err) {
        setError(err.status === 401 ? 'Incorrect username or password. Please try again.' : err.message);
        form.password.select();
      }
    });
  }

  return (
    <form className="login-card" noValidate onSubmit={submit}>
      <Head icon="users" title="Welcome Back">Sign in to access the HEH Portal.</Head>
      <label className="login-input">
        <Icon name="mail" />
        <input ref={username} name="username" placeholder="Username or Email Address" aria-label="Username or email address" autoComplete="username" maxLength={160} />
      </label>
      <PasswordInput name="password" placeholder="Password" autoComplete="current-password" invalid={Boolean(error)} />
      <div className="login-row">
        <ErrorLine message={error} />
        <button type="button" className="login-link" onClick={onForgot}>Forgot Password?</button>
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Signing In…' : <>Sign In <Icon name="arrow-right" /></>}
      </button>
      {options.google && <GoogleButton clientId={options.google} onSignedIn={onSignedIn} onError={setError} />}
      <p className="login-back"><a href="/"><Icon name="arrow-left" /> Back to website</a></p>
    </form>
  );
}

// Google's popup gives an access token; the API checks it with Google and matches the email to an admin.
let gsiScript;
const loadGoogle = () => {
  gsiScript ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => resolve(window.google);
    s.onerror = () => { gsiScript = null; reject(new Error('Could not load Google sign-in. Please try again.')); };
    document.head.appendChild(s);
  });
  return gsiScript;
};

function GoogleButton({ clientId, onSignedIn, onError }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => { loadGoogle().catch(() => {}); }, []);

  async function start() {
    onError('');
    try {
      const google = await loadGoogle();
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email',
        callback: async (resp) => {
          if (!resp.access_token) { onError('Google sign-in was cancelled.'); return; }
          setBusy(true);
          try {
            await api('/admin/login/google', { method: 'POST', body: { access_token: resp.access_token } });
            onSignedIn();
          } catch (err) {
            onError(err.message);
          } finally {
            setBusy(false);
          }
        },
        error_callback: () => onError('Google sign-in was cancelled.'),
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <>
      <div className="login-or"><span>OR</span></div>
      <button type="button" className="login-google" onClick={start} disabled={busy}>
        <svg viewBox="0 0 48 48" aria-hidden="true" width="22" height="22">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy ? 'Signing In…' : 'Sign in with Google'}
      </button>
    </>
  );
}

// ---------- 6-digit code: Security Verification / Verify Your Email ----------

function CodeBoxes({ value, onChange, invalid }) {
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  function put(i, text) {
    const d = text.replace(/\D/g, '');
    if (!d) return;
    const next = (value.slice(0, i) + d).slice(0, 6);
    onChange(next);
    refs.current[Math.min(next.length, 5)]?.focus();
  }
  function key(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const at = digits[i] ? i : Math.max(0, i - 1);
      onChange(value.slice(0, at));
      refs.current[at]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  }

  return (
    <div className={`code-boxes${invalid ? ' invalid' : ''}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          maxLength={6}
          onFocus={(e) => e.target.select()}
          onChange={(e) => put(Math.min(i, value.length), e.target.value)}
          onKeyDown={(e) => key(i, e)}
          onPaste={(e) => { e.preventDefault(); put(0, e.clipboardData.getData('text')); }}
        />
      ))}
    </div>
  );
}

function CodeStep({ step, token, email, onSignedIn, onBack }) {
  const verify = step === 'verify';
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [dead, setDead] = useState(false);
  const [busy, run] = useBusy();

  function submit(e) {
    e.preventDefault();
    if (value.length !== 6) { setError('Enter the 6-digit code.'); return; }
    run(async () => {
      try {
        await api('/admin/login/code', { method: 'POST', body: { token, code: value } });
        onSignedIn();
      } catch (err) {
        setError(err.message);
        setValue('');
        if (err.expired) setDead(true);
      }
    });
  }

  async function resend() {
    setError('');
    setNote('');
    try {
      await api('/admin/login/resend', { method: 'POST', body: { token } });
      setNote('A new code has been sent.');
    } catch (err) {
      setError(err.message);
      if (err.expired) setDead(true);
    }
  }

  return (
    <form className="login-card" noValidate onSubmit={submit}>
      <Head icon={verify ? 'mail-check' : 'shield-lock'} title={verify ? 'Verify Your Email' : 'Security Verification'}>
        Enter the 6-digit {verify ? 'verification' : 'security'} code sent to your registered email address.
      </Head>
      <p className="login-pill"><Icon name="mail" /> {email}</p>
      <CodeBoxes value={value} onChange={(v) => { setValue(v); setError(''); }} invalid={Boolean(error)} />
      <ErrorLine message={error} />
      {dead ? (
        <button className="btn btn-primary btn-block" type="button" onClick={onBack}>Sign In Again <Icon name="arrow-right" /></button>
      ) : (
        <>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Checking…' : <>{verify ? 'Verify Email' : 'Verify & Continue'} <Icon name="arrow-right" /></>}
          </button>
          <p className="login-small">Didn’t receive the code? <button type="button" className="login-link" onClick={resend}>Resend Code</button></p>
          {note && <p className="login-small ok">{note}</p>}
        </>
      )}
      <BackLink onClick={onBack} />
    </form>
  );
}

// ---------- Forgot password / Check your email ----------

function Forgot({ initial, onSent, onBack }) {
  const [error, setError] = useState('');
  const [busy, run] = useBusy();
  const input = useRef();
  useEffect(() => { input.current?.focus(); }, []);

  function submit(e) {
    e.preventDefault();
    const email = e.currentTarget.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    run(async () => {
      try {
        const res = await api('/admin/password/forgot', { method: 'POST', body: { email } });
        onSent(email, res.email);
      } catch (err) {
        setError(err.message);
      }
    });
  }

  return (
    <form className="login-card" noValidate onSubmit={submit}>
      <Head icon="lock-key" title="Forgot Password?">Enter your registered email address to receive a password reset link.</Head>
      <label className={`login-input${error ? ' invalid' : ''}`}>
        <Icon name="mail" />
        <input ref={input} name="email" type="email" defaultValue={initial} placeholder="Email Address" aria-label="Email address" autoComplete="email" maxLength={160} />
      </label>
      <ErrorLine message={error} />
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Sending…' : <>Send Reset Link <Icon name="arrow-right" /></>}
      </button>
      <BackLink onClick={onBack} />
    </form>
  );
}

function Sent({ email, resendTo, onBack }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  async function resend() {
    setNote('');
    setError('');
    try {
      await api('/admin/password/forgot', { method: 'POST', body: { email: resendTo } });
      setNote('We’ve sent the link again.');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="login-card">
      <Head icon="mail-check" title="Check Your Email">
        If an account exists with this email address, we’ve sent instructions to reset your password.
      </Head>
      <p className="login-pill"><Icon name="mail" /> {email}</p>
      <button className="btn btn-primary btn-block" type="button" onClick={onBack}>Back to Sign In <Icon name="arrow-right" /></button>
      <p className="login-small">Didn’t receive the email? <button type="button" className="login-link" onClick={resend}>Resend Link</button></p>
      {note && <p className="login-small ok">{note}</p>}
      <ErrorLine message={error} />
      <p className="login-note"><Icon name="info" /> Please check your spam or junk folder.</p>
    </div>
  );
}

// ---------- Reset password / Reset successful ----------

function Reset({ token, onDone, onBack, onForgot }) {
  const [state, setState] = useState('checking'); // checking | ok | invalid
  const [linkError, setLinkError] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, run] = useBusy();
  const first = useRef();

  useEffect(() => {
    api('/admin/password/reset/check', { method: 'POST', body: { token } }).then(
      () => setState('ok'),
      (err) => { setLinkError(err.message); setState('invalid'); },
    );
  }, [token]);
  useEffect(() => { if (state === 'ok') first.current?.focus(); }, [state]);

  function submit(e) {
    e.preventDefault();
    const { password, confirm } = formData(e.currentTarget);
    const errs = {};
    if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) errs.password = 'Use at least 8 characters with letters and numbers.';
    else if (confirm !== password) errs.confirm = 'The passwords do not match.';
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;
    run(async () => {
      try {
        await api('/admin/password/reset', { method: 'POST', body: { token, password, confirm } });
        onDone();
      } catch (err) {
        if (err.errors) setErrors(err.errors);
        else setError(err.message);
      }
    });
  }

  if (state === 'checking') return <div className="login-card"><p className="sub">Checking your reset link…</p></div>;
  if (state === 'invalid') {
    return (
      <div className="login-card">
        <Head icon="clock-lock" title="Link Expired">{linkError}</Head>
        <button className="btn btn-primary btn-block" type="button" onClick={onForgot}>Request a New Link <Icon name="arrow-right" /></button>
        <BackLink onClick={onBack} />
      </div>
    );
  }
  return (
    <form className="login-card" noValidate onSubmit={submit}>
      <Head icon="lock-reset" title="Reset Password">Create a new password to securely access your HEH account.</Head>
      <PasswordInput inputRef={first} name="password" placeholder="New Password" autoComplete="new-password" invalid={Boolean(errors.password)} />
      <PasswordInput name="confirm" placeholder="Confirm New Password" autoComplete="new-password" invalid={Boolean(errors.confirm)} />
      <ErrorLine message={errors.password || errors.confirm || error} />
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Saving…' : <>Reset Password <Icon name="arrow-right" /></>}
      </button>
      <BackLink onClick={onBack} />
    </form>
  );
}

function Done({ onContinue }) {
  return (
    <div className="login-card">
      <Head icon="shield-check" title="Password Reset Successful">
        Your password has been updated successfully. You can now sign in using your new password.
      </Head>
      <button className="btn btn-primary btn-block" type="button" onClick={onContinue}>Sign In Now <Icon name="arrow-right" /></button>
      <p className="login-note"><Icon name="lock" /> Your previous sessions have been signed out for security.</p>
    </div>
  );
}

function Expired({ onContinue }) {
  return (
    <div className="login-card">
      <Head icon="clock-lock" title="Session Expired">Your session has expired for security reasons.<br />Please sign in again to continue.</Head>
      <button className="btn btn-primary btn-block" type="button" onClick={onContinue}>Sign In Again <Icon name="arrow-right" /></button>
      <p className="login-note"><Icon name="shield" /> Your account remains secure.</p>
    </div>
  );
}
