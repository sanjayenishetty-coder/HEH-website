// "Member Portal access" box in the member editor: turn sign-in on/off, set a temporary password (shown once),
// and verify the documents the member uploaded in the portal (/portal/, see routes/portal-admin.js).
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin } from './Admin.jsx';
import { StatusPill } from './ui.jsx';

export default function PortalAccess({ memberId }) {
  const { call, toast } = useAdmin();
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { call(`/members/${memberId}/portal`).then(setInfo, () => {}); }, [call, memberId]);

  async function act(path, opts, msg) {
    setBusy(true);
    try {
      const res = await call(path, { method: 'POST', ...opts });
      setInfo(res);
      if (res.password) setPassword(res.password);
      if (msg) toast(msg);
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(password); toast('Password copied'); } catch { toast('Select the password and copy it.', true); }
  }
  const review = (d, what) => {
    const remarks = window.prompt(what === 'verify' ? 'Remarks for the member (optional):' : 'Why could this document not be verified?', '');
    if (remarks === null) return;
    act(`/member-documents/${d.id}/${what}`, { body: { remarks } }, what === 'verify' ? 'Document verified' : 'Document marked as not verified');
  };

  if (!info) return null;
  const has = Boolean(info.account_id);
  return (
    <fieldset className="full portal-access">
      <legend>Member Portal access</legend>
      {!has && <p className="hint">This member cannot sign in to the Member Portal yet. Turning access on creates a temporary password for you to share with them.</p>}
      {has && (
        <p className="hint">
          Sign-in: {info.disabled ? <b className="off">Turned off</b> : <b className="on">Active</b>} · Signs in with <b>{info.member_code}</b>{info.email ? <> or <b>{info.email}</b></> : ''}
          {' '}· Last sign-in: {info.last_login_at ? fmt.stamp(info.last_login_at) : 'never'}{info.temporary_password ? ' · still on the temporary password' : ''}
        </p>
      )}
      {password && (
        <div className="pa-pass">
          <span>Temporary password (shown only now): <code>{password}</code></span>
          <button type="button" className="btn btn-outline btn-sm" onClick={copy}><Icon name="copy" /> Copy</button>
          <small>Share it with the member privately. They will be asked to choose their own password at {window.location.origin}/portal/</small>
        </div>
      )}
      <div className="pa-acts">
        {!has && <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(`/members/${memberId}/portal`, {}, 'Portal access turned on')}>Turn on portal access</button>}
        {has && !info.disabled && <button type="button" className="btn btn-outline btn-sm" disabled={busy}
          onClick={() => window.confirm('Create a new temporary password? The current password will stop working and the member will be signed out.') && act(`/members/${memberId}/portal`, {}, 'New temporary password created')}>Reset password</button>}
        {has && !info.disabled && <button type="button" className="btn btn-outline btn-sm pa-off" disabled={busy}
          onClick={() => window.confirm('Turn off portal access? The member will be signed out and cannot sign in until you turn it on again.') && act(`/members/${memberId}/portal/disable`, {}, 'Portal access turned off')}>Turn off access</button>}
        {has && info.disabled && <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(`/members/${memberId}/portal/enable`, {}, 'Portal access turned on')}>Turn access back on</button>}
      </div>
      {info.documents.length > 0 && (
        <div className="pa-docs">
          <b>Verification documents</b>
          {info.documents.map((d) => (
            <div key={d.id} className="pa-doc">
              <a href={`/api/admin/member-documents/${d.id}/file`} target="_blank" rel="noopener"><Icon name="file" /> {d.doc_type}</a>
              <small>{d.category} · {fmt.stamp(d.created_at).slice(0, 11)}</small>
              <StatusPill status={d.status === 'verified' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending'} />
              {d.status !== 'verified' && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => review(d, 'verify')}>Verify</button>}
              {d.status !== 'rejected' && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => review(d, 'reject')}>Not valid</button>}
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
