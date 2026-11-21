// My Profile: Overview, Personal Info, Company Info, Documents tabs and their edit / detail screens
// (designs 5, 22, 32, 34, 49, 58, 65, 73, 74, 82, 87, 90).
import { useRef, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { usePortal } from './Portal.jsx';
import {
  Card, ChipPicker, Chips, Empty, Field, Head, KV, Load, Pill, Select, StatusPill, Tabs, Toggle, Avatar, day, useAction, useData,
} from './parts.jsx';

const TABS = [['', 'Overview'], ['personal', 'Personal Info'], ['company', 'Company Info'], ['documents', 'Documents']];
const since = (p) => new Date(p.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default function Profile({ path }) {
  const state = useData('/profile');
  const [section, sub] = path;
  return (
    <Load state={state}>
      {(p) => {
        const props = { p, reload: state.reload };
        if (section === 'personal' && sub === 'edit') return <EditPersonal {...props} />;
        if (section === 'company' && sub === 'edit') return <EditCompany {...props} />;
        if (section === 'expertise') return <EditExpertise {...props} />;
        if (section === 'documents' && sub === 'upload') return <Upload {...props} />;
        if (section === 'documents' && sub) return <DocumentDetails {...props} id={Number(sub)} />;
        if (section === 'completion') return <Completion {...props} />;
        if (section === 'privacy') return <Privacy {...props} />;
        if (section === 'preview') return <Preview {...props} />;
        const tab = TABS.some(([k]) => k === section) ? section || '' : '';
        const actions = {
          '': <a className="p-btn outline" href="#profile/personal/edit"><Icon name="edit" /> Edit Profile</a>,
          personal: <a className="p-btn outline" href="#profile/personal/edit"><Icon name="edit" /> Edit Information</a>,
          company: <a className="p-btn outline" href="#profile/company/edit"><Icon name="edit" /> Edit Company</a>,
          documents: <a className="p-btn outline" href="#profile/documents/upload"><Icon name="upload" /> Upload Document</a>,
        };
        return (
          <>
            <Head title="My Profile" sub="Manage your HEH membership profile" back="dashboard">{actions[tab]}</Head>
            <Tabs items={TABS} value={tab} base="profile" />
            {tab === '' && <Overview {...props} />}
            {tab === 'personal' && <Personal {...props} />}
            {tab === 'company' && <Company {...props} />}
            {tab === 'documents' && <Documents {...props} />}
          </>
        );
      }}
    </Load>
  );
}

function ProfileHeader({ p, reload, company = false }) {
  const { toast, refreshMe } = usePortal();
  const input = useRef();
  async function onPhoto(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/member/profile/photo', { method: 'POST', body, credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      toast('Profile photo updated');
      reload();
      refreshMe();
    } catch (err) { toast(err.message, true); }
  }
  if (company) {
    return (
      <div className="p-profile-head">
        <span className="p-ico orange huge"><Icon name="building" /></span>
        <div className="who"><h2>{p.company || 'Your company'}</h2><p>{p.industry}</p>{p.location && <p><Icon name="pin" /> {p.location}</p>}</div>
        <div className="side"><StatusPill status="confirmed">Active</StatusPill><small>Member Since: {since(p)}</small></div>
      </div>
    );
  }
  return (
    <div className="p-profile-head">
      <button type="button" className="p-photo" onClick={() => input.current.click()} title="Change profile photo">
        <Avatar name={p.full_name} photo={p.photo_url} size={78} />
        <span><Icon name="upload" /></span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPhoto} />
      <div className="who">
        <h2>{p.full_name}</h2>
        <p>{p.designation || 'Entrepreneur'} <i>•</i> HEH Member</p>
        {p.location && <p><Icon name="pin" /> {p.location}</p>}
      </div>
      <div className="side"><StatusPill status="confirmed">Active Member</StatusPill><small>Member Since: {since(p)}</small></div>
    </div>
  );
}

function Overview({ p, reload }) {
  const c = p.completion;
  return (
    <>
      <ProfileHeader p={p} reload={reload} />
      <div className="p-grid-2">
        <Card title="Personal Information" icon="user" action={<a className="p-link" href="#profile/personal">View</a>}>
          <KV rows={[['Full Name', p.full_name], ['Location', p.city || p.location], ['Membership', 'HEH Member'], ['Membership ID', p.member_code]]} />
        </Card>
        <Card title="Company Information" icon="building" action={<a className="p-link" href="#profile/company">View</a>}>
          <KV rows={[['Company', p.company], ['Designation', p.designation], ['Industry', p.industry]]} />
        </Card>
      </div>
      <Card title="Profile Completion" icon="chart" action={<b className="p-orange">{c.percent}%</b>}>
        <div className="p-progress"><span style={{ width: `${c.percent}%` }} /></div>
        <p className="p-muted">{c.percent === 100 ? 'Your profile is complete.' : 'Complete the remaining details to improve your visibility within HEH.'}
          {' '}<a className="p-link" href="#profile/completion">See what’s left</a></p>
      </Card>
      <div className="p-links-row">
        <a className="p-btn outline" href="#profile/preview"><Icon name="eye" /> Public Profile Preview</a>
        <a className="p-btn outline" href="#profile/privacy"><Icon name="shield" /> Profile Visibility & Privacy</a>
        <a className="p-btn outline" href="#profile/expertise"><Icon name="star" /> Expertise & Interests</a>
      </div>
    </>
  );
}

function Personal({ p, reload }) {
  return (
    <>
      <ProfileHeader p={p} reload={reload} />
      <div className="p-grid-2">
        <Card title="Basic Information" icon="user">
          <KV rows={[['Full Name', p.full_name], ['Designation', p.designation], ['Location', p.city || p.location], ['Member Since', since(p)], ['Membership ID', p.member_code]]} />
        </Card>
        <Card title="Contact Information" icon="phone">
          <KV rows={[['Email', p.email], ['Mobile', p.phone], ['City', p.city], ['State', p.state]]} />
        </Card>
      </div>
      <Card title="Professional Introduction" icon="file">
        {p.bio ? <p className="p-text">{p.bio}</p> : <Empty icon="file">Add a short introduction so other members know about you.</Empty>}
      </Card>
    </>
  );
}

function Company({ p, reload }) {
  return (
    <>
      <ProfileHeader p={p} reload={reload} company />
      <div className="p-grid-2">
        <Card title="Company Details" icon="building">
          <KV rows={[['Company Name', p.company], ['Industry', p.industry], ['Business Type', p.business_type], ['Location', p.location]]} />
        </Card>
        <Card title="Business Contact" icon="globe">
          <KV rows={[['Website', p.website && <a className="p-link" href={p.website} target="_blank" rel="noopener">{p.website.replace(/^https?:\/\//, '')} <Icon name="external" /></a>],
            ['Business Email', p.business_email], ['City', p.city], ['State', p.state]]} />
        </Card>
      </div>
      <Card title="About the Business" icon="file">{p.company_about ? <p className="p-text">{p.company_about}</p> : <p className="p-muted">Not added yet.</p>}</Card>
      <Card title="Services & Collaboration Interests" icon="handshake" action={<a className="p-link" href="#profile/expertise">Manage</a>}>
        <Chips items={[...(p.services || []), ...(p.collaboration_interests || [])]} />
      </Card>
      <Card title="Expertise & Business Interests" icon="star" action={<a className="p-link" href="#profile/expertise">Manage</a>}>
        <Chips items={[...p.expertise_list, ...(p.business_interests || [])]} />
      </Card>
    </>
  );
}

// ---------- Edit forms ----------

function useSave(path, after) {
  const { call, toast, go, refreshMe } = usePortal();
  const [errors, setErrors] = useState({});
  const [busy, run] = useAction();
  const save = (body, msg = 'Changes saved') => run(async () => {
    setErrors({});
    try {
      await call(path, { method: 'PUT', body });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      throw err;
    }
    toast(msg);
    refreshMe();
    go(after);
  }).catch(() => {});
  return { errors, busy, save };
}

const formBody = (form) => Object.fromEntries(new FormData(form).entries());

function EditPersonal({ p }) {
  const { errors, busy, save } = useSave('/profile/personal', 'profile/personal');
  const [bio, setBio] = useState(p.bio || '');
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile/personal" />
      <Tabs items={TABS} value="personal" base="profile" />
      <form className="p-card p-form" noValidate onSubmit={(e) => { e.preventDefault(); save(formBody(e.currentTarget)); }}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="edit" /></span>
          <div><h2>Edit Personal Information</h2><p className="p-crumbs-text">My Profile › Personal Info › Edit</p></div></div>
        <h3 className="p-sec"><Icon name="user" /> Basic Information</h3>
        <div className="p-form-grid">
          <Field label="Full Name *" error={errors.full_name}><input className="p-input" name="full_name" defaultValue={p.full_name} maxLength={120} /></Field>
          <Field label="Designation" error={errors.designation}><input className="p-input" name="designation" defaultValue={p.designation} maxLength={120} /></Field>
          <Field label="City" error={errors.city}><input className="p-input" name="city" defaultValue={p.city} maxLength={80} /></Field>
          <Field label="State" error={errors.state}><input className="p-input" name="state" defaultValue={p.state} maxLength={80} /></Field>
        </div>
        <h3 className="p-sec"><Icon name="phone" /> Contact Information</h3>
        <div className="p-form-grid">
          <Field label="Email Address *" error={errors.email} hint="This is also the email you sign in with."><input className="p-input" type="email" name="email" defaultValue={p.email} maxLength={160} /></Field>
          <Field label="Mobile Number" error={errors.phone}><input className="p-input" name="phone" defaultValue={p.phone} maxLength={20} /></Field>
        </div>
        <h3 className="p-sec"><Icon name="file" /> Professional Introduction</h3>
        <Field label="Introduction" error={errors.bio} full>
          <textarea className="p-input" name="bio" rows={4} maxLength={1500} value={bio} onChange={(e) => setBio(e.target.value)} />
          <small className="p-count">{bio.length} / 1500</small>
        </Field>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile/personal">Cancel</a>
          <button className="p-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

function EditCompany({ p }) {
  const { meta } = usePortal();
  const { errors, busy, save } = useSave('/profile/company', 'profile/company');
  const [services, setServices] = useState(p.services || []);
  const [collab, setCollab] = useState(p.collaboration_interests || []);
  const [about, setAbout] = useState(p.company_about || '');
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile/company" />
      <Tabs items={TABS} value="company" base="profile" />
      <form className="p-card p-form" noValidate onSubmit={(e) => {
        e.preventDefault();
        save({ ...formBody(e.currentTarget), services, collaboration_interests: collab });
      }}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="building" /></span>
          <div><h2>Edit Company Information</h2><p className="p-crumbs-text">My Profile › Company Info › Edit</p></div></div>
        <h3 className="p-sec"><Icon name="building" /> Company Details</h3>
        <div className="p-form-grid three">
          <Field label="Company Name *" error={errors.company}><input className="p-input" name="company" defaultValue={p.company} maxLength={160} /></Field>
          <Field label="Industry *" error={errors.industry}>
            <select className="p-input" name="industry" defaultValue={p.industry}>{!p.industry && <option value="">Select</option>}{meta.industries.map((i) => <option key={i}>{i}</option>)}</select>
          </Field>
          <Field label="Business Type" error={errors.business_type}>
            <select className="p-input" name="business_type" defaultValue={p.business_type}><option value="">Select</option>{meta.businessTypes.map((i) => <option key={i}>{i}</option>)}</select>
          </Field>
          <Field label="City" error={errors.city}><input className="p-input" name="city" defaultValue={p.city} maxLength={80} /></Field>
          <Field label="State" error={errors.state}><input className="p-input" name="state" defaultValue={p.state} maxLength={80} /></Field>
        </div>
        <h3 className="p-sec"><Icon name="globe" /> Business Contact</h3>
        <div className="p-form-grid">
          <Field label="Website" error={errors.website}><input className="p-input" name="website" defaultValue={p.website} maxLength={300} placeholder="www.example.com" /></Field>
          <Field label="Business Email" error={errors.business_email}><input className="p-input" type="email" name="business_email" defaultValue={p.business_email} maxLength={160} /></Field>
        </div>
        <h3 className="p-sec"><Icon name="file" /> About the Business</h3>
        <Field label="About the business" error={errors.company_about} full>
          <textarea className="p-input" name="company_about" rows={3} maxLength={1500} value={about} onChange={(e) => setAbout(e.target.value)} />
          <small className="p-count">{about.length} / 1500</small>
        </Field>
        <h3 className="p-sec"><Icon name="handshake" /> Services & Collaboration Interests</h3>
        <div className="p-form-grid">
          <Field label="Services Offered" error={errors.services} group><ChipPicker options={[]} value={services} onChange={setServices} custom placeholder="Add a service" /></Field>
          <Field label="Collaboration Interests" error={errors.collaboration_interests} group><ChipPicker options={meta.collaborationPreferences} value={collab} onChange={setCollab} /></Field>
        </div>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile/company">Cancel</a>
          <button className="p-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

function EditExpertise({ p }) {
  const { meta } = usePortal();
  const { errors, busy, save } = useSave('/profile/expertise', 'profile/company');
  const [expertise, setExpertise] = useState(p.expertise_tags?.length ? p.expertise_tags : p.expertise_list);
  const [interests, setInterests] = useState(p.business_interests || []);
  const [collab, setCollab] = useState(p.collaboration_interests || []);
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile/company" />
      <Tabs items={TABS} value="company" base="profile" />
      <form className="p-card p-form" noValidate onSubmit={(e) => {
        e.preventDefault();
        save({ expertise_tags: expertise, business_interests: interests, collaboration_interests: collab });
      }}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="target" /></span>
          <div><h2>Manage Expertise & Business Interests</h2><p className="p-crumbs-text">My Profile › Company Info › Expertise & Interests</p></div></div>
        <h3 className="p-sec"><Icon name="briefcase" /> Professional Expertise</h3>
        <p className="p-muted">Select the areas your business specializes in.</p>
        <ChipPicker options={meta.expertiseAreas} value={expertise} onChange={setExpertise} custom placeholder="Add another expertise" />
        {errors.expertise_tags && <small className="p-err">{errors.expertise_tags}</small>}
        <h3 className="p-sec"><Icon name="target" /> Business Interests</h3>
        <p className="p-muted">Choose industries and opportunities you want to explore.</p>
        <ChipPicker options={meta.businessInterests} value={interests} onChange={setInterests} custom placeholder="Add another interest" />
        <h3 className="p-sec"><Icon name="handshake" /> Collaboration Preferences</h3>
        <p className="p-muted">Indicate how you would like to collaborate with other members.</p>
        <div className="p-checks">
          {meta.collaborationPreferences.map((o) => (
            <label key={o} className="p-check"><input type="checkbox" checked={collab.includes(o)}
              onChange={() => setCollab(collab.includes(o) ? collab.filter((x) => x !== o) : [...collab, o])} /> {o}</label>
          ))}
        </div>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile/company">Cancel</a>
          <button className="p-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

// ---------- Documents ----------

const docUrl = (d, download) => `/api/member/documents/${d.id}/file${download ? '?download=1' : ''}`;

function Documents({ p }) {
  const groups = ['Identity', 'Company', 'Membership'].map((cat) => {
    const docs = p.documents.filter((d) => d.category === cat);
    const status = docs.some((d) => d.status === 'verified') ? 'verified' : docs.some((d) => d.status === 'pending') ? 'pending' : docs.length ? 'rejected' : null;
    return [cat, status];
  });
  const allVerified = groups.every(([, s]) => s === 'verified');
  return (
    <>
      <Card title="Documents & Verification" icon="file" sub="Manage your documents and verification status"
        action={allVerified ? <StatusPill status="verified">Profile Verified</StatusPill> : p.documents.length
          ? <Pill tone="orange" icon="clock">Verification in progress</Pill> : <Pill tone="grey" icon="upload">Documents needed</Pill>}>
        <div className="p-verify">
          <b>Verification Status</b>
          {groups.map(([cat, s]) => (
            <span key={cat}><span className="p-ico orange"><Icon name={cat === 'Identity' ? 'user' : cat === 'Company' ? 'building' : 'file'} /></span>
              <span><small>{cat}</small>{s ? <StatusPill status={s}>{s === 'pending' ? 'Under Review' : undefined}</StatusPill> : <Pill>Not uploaded</Pill>}</span></span>
          ))}
        </div>
      </Card>
      <Card title="My Documents" icon="file" action={<a className="p-btn sm" href="#profile/documents/upload"><Icon name="upload" /> Upload Document</a>}>
        {p.documents.length ? (
          <div className="p-table-wrap">
            <table className="p-table">
              <thead><tr><th>Document Name</th><th>Uploaded On</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {p.documents.map((d) => (
                  <tr key={d.id}>
                    <td><a className="p-doc" href={`#profile/documents/${d.id}`}><Icon name="file" /> {d.doc_type}</a></td>
                    <td>{day(d.created_at)}</td>
                    <td><StatusPill status={d.status}>{d.status === 'pending' ? 'Under Review' : undefined}</StatusPill></td>
                    <td className="p-acts">
                      <a href={docUrl(d)} target="_blank" rel="noopener" aria-label="View"><Icon name="eye" /></a>
                      <a href={docUrl(d, true)} aria-label="Download"><Icon name="download" /></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon="upload" title="No documents yet">Upload your identity, company and membership documents for verification.</Empty>}
      </Card>
      <div className="p-banner soft"><Icon name="shield-check" /><span><b>Your Documents Stay Private</b>Documents are never shown in the Member Directory; only you and authorised HEH verification staff can open them.</span></div>
    </>
  );
}

function Upload() {
  const { meta, toast, go } = usePortal();
  const [category, setCategory] = useState(meta.documentTypes[1][0]);
  const [docType, setDocType] = useState(meta.documentTypes[1][1][0]);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const types = meta.documentTypes.find(([c]) => c === category)[1];
  async function submit(e) {
    e.preventDefault();
    const body = new FormData();
    body.append('category', category);
    body.append('doc_type', docType);
    body.append('confirm', e.currentTarget.confirm.checked ? 'true' : '');
    if (file) body.append('file', file);
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch('/api/member/documents', { method: 'POST', body, credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { if (data.errors) setErrors(data.errors); throw new Error(data.error || 'Upload failed'); }
      toast('Document submitted for verification');
      go('profile/documents');
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  const pick = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErrors({ file: 'The file must be 5 MB or smaller.' }); return; }
    setErrors({});
    setFile(f);
  };
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile/documents" />
      <Tabs items={TABS} value="documents" base="profile" />
      <form className="p-card p-form" noValidate onSubmit={submit}>
        <div className="p-form-head"><span className="p-ico orange"><Icon name="upload" /></span>
          <div><h2>Upload Documents</h2><p className="p-crumbs-text">My Profile › Documents › Upload</p></div></div>
        <h3 className="p-sec"><Icon name="file" /> Document Information</h3>
        <div className="p-form-grid">
          <Field label="Document Category *" error={errors.category}>
            <Select options={meta.documentTypes.map(([c]) => c)} value={category}
              onChange={(c) => { setCategory(c); setDocType(meta.documentTypes.find(([x]) => x === c)[1][0]); }} />
          </Field>
          <Field label="Document Type *" error={errors.doc_type}><Select options={types} value={docType} onChange={setDocType} /></Field>
        </div>
        <label className={`p-drop${drag ? ' over' : ''}${errors.file ? ' invalid' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
          <Icon name="upload" />
          <b>{file ? file.name : 'Drag & drop your file here or'}</b>
          <span className="p-btn outline sm">{file ? 'Choose another file' : 'Choose File'}</span>
          <small>Supported formats: PDF, JPG, PNG | Maximum size: 5 MB</small>
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => pick(e.target.files[0])} />
        </label>
        {errors.file && <small className="p-err">{errors.file}</small>}
        <label className="p-check"><input type="checkbox" name="confirm" /> I confirm that the document is accurate and belongs to me or my authorised business.</label>
        {errors.confirm && <small className="p-err">{errors.confirm}</small>}
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile/documents">Cancel</a>
          <button className="p-btn" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Submit Document'}</button>
        </div>
      </form>
      <div className="p-banner soft"><Icon name="shield-check" /><span><b>Secure Document Handling</b>Documents are stored securely and are accessible only to you and authorised HEH verification personnel.</span></div>
    </>
  );
}

function DocumentDetails({ p, id }) {
  const d = p.documents.find((x) => x.id === id);
  if (!d) return <><Head title="Document Details" back="profile/documents" /><Empty icon="file">This document was not found.</Empty></>;
  const size = d.size > 1024 * 1024 ? `${(d.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(d.size / 1024))} KB`;
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile/documents" />
      <Tabs items={TABS} value="documents" base="profile" />
      <section className="p-card">
        <div className="p-form-head"><span className="p-ico orange"><Icon name="file" /></span>
          <div><h2>Document Details</h2><p className="p-crumbs-text">My Profile › Documents › Document Details</p></div></div>
        <div className="p-doc-title"><span className="p-ico red"><Icon name="file" /></span>
          <div><b>{d.doc_type}</b><small>{d.category} | Uploaded on {day(d.created_at)}</small></div>
          <StatusPill status={d.status}>{d.status === 'pending' ? 'Under Review' : undefined}</StatusPill></div>
        <div className="p-grid-2">
          <div className="p-sub-card"><h3>Document Information</h3>
            <KV rows={[['Document Type', d.doc_type], ['Category', d.category], ['File Name', d.file_name], ['Uploaded On', day(d.created_at)],
              ['File Format', d.mime === 'application/pdf' ? 'PDF' : d.mime.split('/')[1].toUpperCase()], ['File Size', size],
              ['Review Status', <StatusPill key="s" status={d.status}>{d.status === 'pending' ? 'Under Review' : undefined}</StatusPill>]]} />
          </div>
          <div className="p-sub-card"><h3>Verification History</h3>
            <ul className="p-timeline">
              <li className="done"><b>Document Uploaded</b><small>{day(d.created_at)}</small></li>
              {d.reviewed_at ? <li className={d.status === 'verified' ? 'done' : 'bad'}><b>{d.status === 'verified' ? 'Verification Completed' : 'Not Verified'}</b><small>{day(d.reviewed_at)}</small></li>
                : <li><b>Awaiting Review</b><small>HEH will review this document shortly.</small></li>}
            </ul>
            {d.remarks && <><h3>Administrator Remarks</h3><p className={`p-remark ${d.status}`}><Icon name={d.status === 'verified' ? 'check-circle' : 'info'} /> {d.remarks}</p></>}
          </div>
        </div>
        <div className="p-preview-box">
          {d.mime.startsWith('image/') ? <img src={docUrl(d)} alt={d.doc_type} /> : <><Icon name="file" /><p>Secure document preview</p></>}
          <a className="p-btn outline sm" href={docUrl(d)} target="_blank" rel="noopener"><Icon name="eye" /> Preview Document</a>
        </div>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile/documents"><Icon name="arrow-left" /> Back</a>
          <a className="p-btn" href={docUrl(d, true)}><Icon name="download" /> Download</a>
        </div>
      </section>
    </>
  );
}

// ---------- Completion, privacy, preview ----------

const SECTION_LINK = { personal: 'profile/personal/edit', company: 'profile/company/edit', expertise: 'profile/expertise', documents: 'profile/documents/upload', intro: 'profile/personal/edit' };
const SECTION_ICON = { personal: 'user', company: 'building', expertise: 'star', documents: 'file', intro: 'briefcase' };

function Completion({ p }) {
  const c = p.completion;
  const next = c.sections.find((s) => !s.done);
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile" />
      <Tabs items={TABS} value="" base="profile" />
      <section className="p-card">
        <div className="p-form-head"><span className="p-ico orange"><Icon name="chart" /></span>
          <div><h2>Profile Completion</h2><p className="p-crumbs-text">My Profile › Overview › Completion</p></div>
          {c.percent === 100 ? <StatusPill status="confirmed">Complete</StatusPill> : <Pill tone="orange" icon="clock">In Progress</Pill>}</div>
        <div className="p-completion">
          <span className="p-ring" style={{ '--p': c.percent }}><b>{c.percent}%</b></span>
          <div><small>Your Profile Completion</small><h3>{c.percent}% Complete</h3><p className="p-muted">Complete the remaining details to improve your HEH member profile.</p></div>
          <div className="bar"><small>{c.done} of {c.total} sections completed</small><div className="p-progress"><span style={{ width: `${c.percent}%` }} /></div></div>
        </div>
        <h3 className="p-sec">Profile Checklist <small>{c.total} Sections</small></h3>
        <div className="p-checklist">
          {c.sections.map((s) => (
            <div key={s.key}>
              <span className="p-ico orange"><Icon name={SECTION_ICON[s.key]} /></span>
              <span><b>{s.title}</b><small>{s.text}</small></span>
              {s.done ? <StatusPill status="confirmed">Completed</StatusPill> : <Pill tone="orange" icon="clock">Incomplete</Pill>}
              <a className={`p-btn sm${s.done ? ' outline' : ''}`} href={`#${SECTION_LINK[s.key]}`}>{s.done ? 'View' : 'Complete Now'}</a>
            </div>
          ))}
        </div>
        <div className="p-banner soft"><Icon name="info" /><span><b>Why Complete Your Profile?</b>A complete profile helps other HEH entrepreneurs understand your business, expertise and collaboration interests. Verification is managed by authorised HEH administrators.</span></div>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile"><Icon name="arrow-left" /> Back to Profile</a>
          {next && <a className="p-btn" href={`#${SECTION_LINK[next.key]}`}>Complete Remaining Section <Icon name="arrow-right" /></a>}
        </div>
      </section>
    </>
  );
}

const VIS = [['members', 'All HEH Members'], ['connections', 'My Connections Only'], ['private', 'Private']];

export function Privacy({ p, back = 'profile', connections = false }) {
  const { call, toast, go } = usePortal();
  const [v, setV] = useState(p.privacy);
  const [busy, run] = useAction();
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const save = () => run(async () => {
    await call('/profile/privacy', { method: 'PUT', body: v });
    toast('Privacy settings saved');
    go(back);
  }).catch(() => {});
  const row = (k, title, text) => (
    <div className="p-pref"><span><b>{title}</b><small>{text}</small></span><Toggle checked={v[k]} onChange={set(k)} label={title} /></div>
  );
  return (
    <>
      <Head title={connections ? 'Connection Privacy & Permissions' : 'My Profile'} back={back}
        {...(connections ? { crumbs: [['My Connections', 'connections'], ['Privacy & Permissions']] } : { sub: 'Manage your HEH membership profile' })} />
      {!connections && <Tabs items={TABS} value="" base="profile" />}
      <section className="p-card">
        {!connections && <div className="p-form-head"><span className="p-ico orange"><Icon name="shield" /></span>
          <div><h2>Profile Visibility & Privacy</h2><p className="p-crumbs-text">My Profile › Overview › Privacy</p></div></div>}
        <div className="p-grid-2">
          <div className="p-sub-card">
            <h3><Icon name="eye" /> Profile Visibility</h3>
            <p className="p-muted">Choose whether other HEH members can discover your profile.</p>
            <label className="p-radio"><input type="radio" checked={v.show_in_directory} onChange={() => set('show_in_directory')(true)} />
              <span><b>Visible to HEH Members</b><small>Your profile will be shown in the Member Directory and search.</small></span></label>
            <label className="p-radio"><input type="radio" checked={!v.show_in_directory} onChange={() => set('show_in_directory')(false)} />
              <span><b>Hidden from Member Directory</b><small>Only your connections can open your profile.</small></span></label>
          </div>
          <div className="p-sub-card">
            <h3><Icon name="phone" /> Contact Information</h3>
            <p className="p-muted">Control who can see your contact details.</p>
            <div className="p-pref"><span><b>Email Visibility</b></span><Select options={VIS} value={v.email_visibility} onChange={set('email_visibility')} /></div>
            <div className="p-pref"><span><b>Mobile Number Visibility</b></span><Select options={VIS} value={v.mobile_visibility} onChange={set('mobile_visibility')} /></div>
          </div>
          <div className="p-sub-card">
            <h3><Icon name="building" /> Business Information</h3>
            <p className="p-muted">Choose the business details to show on your profile.</p>
            {row('show_company', 'Show Company Information', 'Company name, industry, website and business details.')}
            {row('show_expertise', 'Show Professional Expertise', 'Your business category and expertise.')}
            {row('show_interests', 'Show Collaboration Interests', 'How you would like to collaborate.')}
          </div>
          <div className="p-sub-card">
            <h3><Icon name="network" /> Networking Preferences</h3>
            <p className="p-muted">Manage your networking and connection options.</p>
            {row('allow_requests', 'Allow Connection Requests', 'Let eligible members send you connection invitations.')}
            {row('show_activity', 'Show Connection Activity', 'Let connections see when you join events.')}
          </div>
        </div>
        <div className="p-banner soft"><Icon name="lock" /><span><b>Your Documents Stay Private</b>Identity and verification documents are never visible in the Member Directory and remain accessible only to authorised HEH verification personnel.</span></div>
        <div className="p-form-acts">
          <button type="button" className="p-btn outline" onClick={() => setV(p.privacy)}>Reset</button>
          <button type="button" className="p-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Preferences'}</button>
        </div>
      </section>
    </>
  );
}

function Preview({ p }) {
  const v = p.privacy;
  return (
    <>
      <Head title="My Profile" sub="Manage your HEH membership profile" back="profile" />
      <Tabs items={TABS} value="" base="profile" />
      <section className="p-card">
        <div className="p-form-head"><span className="p-ico orange"><Icon name="eye" /></span>
          <div><h2>Public Profile Preview</h2><p className="p-crumbs-text">My Profile › Overview › Preview</p></div><Pill tone="blue" icon="eye">Member View</Pill></div>
        <p className="p-note"><Icon name="info" /> This is how your profile appears to other HEH members, based on your visibility settings.</p>
        <div className="p-profile-head flat">
          <Avatar name={p.full_name} photo={p.photo_url} size={64} />
          <div className="who"><h2>{p.full_name}</h2><p>{[p.designation, v.show_company && p.company].filter(Boolean).join(' • ')}</p>{p.location && <p><Icon name="pin" /> {p.location}</p>}</div>
          <div className="side"><StatusPill status="confirmed">HEH Member</StatusPill></div>
        </div>
        <div className="p-grid-2">
          <div className="p-sub-card"><h3><Icon name="user" /> About Member</h3><p className="p-text">{p.bio || 'No introduction yet.'}</p></div>
          <div className="p-sub-card"><h3><Icon name="building" /> Company Information</h3>
            {v.show_company ? <KV rows={[['Company', p.company], ['Industry', p.industry], ['Location', p.location]]} /> : <p className="p-muted">Hidden by your privacy settings.</p>}</div>
          <div className="p-sub-card"><h3><Icon name="star" /> Business Expertise</h3>{v.show_expertise ? <Chips items={p.expertise_list} /> : <p className="p-muted">Hidden.</p>}</div>
          <div className="p-sub-card"><h3><Icon name="handshake" /> Collaboration Interests</h3>{v.show_interests ? <Chips items={p.collaboration_interests} /> : <p className="p-muted">Hidden.</p>}</div>
        </div>
        <div className="p-banner soft"><Icon name="lock" /><span><b>Contact Visibility</b>Email: {VIS.find(([k]) => k === v.email_visibility)[1]} · Mobile: {VIS.find(([k]) => k === v.mobile_visibility)[1]}. Verification documents are never shown.</span>
          <a className="p-btn outline sm" href="#profile/privacy">Privacy Settings</a></div>
        <div className="p-form-acts">
          <a className="p-btn outline" href="#profile"><Icon name="arrow-left" /> Back to Profile</a>
          <a className="p-btn" href="#profile/personal/edit"><Icon name="edit" /> Edit Profile</a>
        </div>
      </section>
    </>
  );
}

