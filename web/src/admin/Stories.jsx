// Success story screens (designs: images/Part2): add / edit, details, website preview, review & publication,
// archive / restore and activity history.
// Routes: #stories/new, #stories/<id>, #stories/<id>/edit | preview | review | archive | activity
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import { ImageField } from './Content.jsx';
import {
  ActivityHistory, Checklist, ConfirmRow, Counted, Empty, F, Foot, KV, Notice, Options, Page, Panel, Strip, Timeline, useAction,
} from './parts.jsx';
import { Avatar, StatusPill } from './ui.jsx';

const CRUMB = ['Success Stories', 'stories'];
export const storyStatus = (s) => (s.archived ? 'archived' : s.published ? 'published' : 'draft');
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

export default function StoryPages({ path }) {
  const [id, action] = path;
  const { call } = useAdmin();
  const state = useLoad(async () => {
    const [story, members] = await Promise.all([
      id === 'new' ? Promise.resolve(null) : call(`/stories/${id}/full`),
      id === 'new' || action === 'edit' ? call('/members') : Promise.resolve({ items: [] }),
    ]);
    return { story, members: members.items.filter((m) => m.status !== 'inactive') };
  });
  return (
    <ViewState state={state}>
      {({ story, members }) => {
        if (!story) return <StoryForm members={members} />;
        if (action === 'edit') return <StoryForm s={story} members={members} />;
        if (action === 'preview') return <Preview s={story} />;
        if (action === 'review') return <Review s={story} />;
        if (action === 'archive') return <Archive s={story} />;
        if (action === 'activity') return <Activity s={story} />;
        return <Details s={story} />;
      }}
    </ViewState>
  );
}

function StoryStrip({ s }) {
  return (
    <Strip items={[
      ['star', 'Selected Success Story', s.title],
      ['ticket', 'Story ID', `HEH-SS-${String(s.id).padStart(4, '0')}`],
      ['tag', 'Story Category', s.category],
      ['info', 'Current Status', <StatusPill key="s" status={storyStatus(s)} />],
      ['globe', 'Website Visibility', s.published ? 'Public' : 'Not Published'],
    ]} />
  );
}

// ---------- Add / edit ----------

function StoryForm({ s, members }) {
  const { toast, go, meta } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  const [memberId, setMemberId] = useState(s?.member_id ? String(s.member_id) : '');
  const member = members.find((m) => String(m.id) === memberId);
  const editing = Boolean(s);
  const back = editing ? `stories/${s.id}` : 'stories';

  async function submit(e) {
    const form = e.currentTarget;
    const extra = {
      member_id: memberId || null,
      members_involved: lines(form.elements.members_involved.value),
      companies: lines(form.elements.companies.value),
      ...(editing ? {} : { published: false }),
    };
    if (!form.elements.title.value.trim()) {
      e.preventDefault();
      toast('Enter the story title.', true);
      form.elements.title.focus();
      return;
    }
    const saved = await run(e, editing ? `/stories/${s.id}` : '/stories', { method: editing ? 'PUT' : 'POST', extra, success: editing ? 'Story saved' : 'Story saved as draft' });
    if (saved) go(`stories/${saved.id}`);
  }

  return (
    <Page crumbs={[CRUMB, ...(editing ? [['Story Details', `stories/${s.id}`], ['Edit Story']] : [['Add Success Story']])]}
      title={editing ? 'Edit Success Story' : 'Add Success Story'}
      sub={editing ? 'Update story information and prepare it for publication review.' : 'Create an inspiring story highlighting an HEH entrepreneur’s achievement.'}
      back={[editing ? 'Back to Story Details' : 'Back to Success Stories', back]}>
      <form className="a-form" noValidate onSubmit={submit}>
        <div className="a-cols">
          <div>
            <Panel icon="file" title="Story Details" sub="Enter the basic information about this success story.">
              <div className="form-grid">
                <F label="Story Title" req htmlFor="title" error={errors.title} full>
                  <input className="input" id="title" name="title" maxLength={150} defaultValue={s?.title} placeholder="Enter success story title" />
                </F>
                <F label="Story Category" req htmlFor="category">
                  <select className="input" id="category" name="category" defaultValue={s?.category || ''}><Options list={meta.storyCategories || []} placeholder="Select story category" /></select>
                </F>
                <F label="Featured HEH Member" req htmlFor="member_id">
                  <select className="input" id="member_id" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                    <Options list={members.map((m) => [String(m.id), `${m.full_name}${m.company ? ` – ${m.company}` : ''}`])} placeholder="Select HEH member" />
                  </select>
                </F>
                <F label="Company Name" full><input className="input" value={member?.company || ''} placeholder="Auto-filled from member profile" disabled /></F>
              </div>
            </Panel>
            <Panel icon="edit" title="Story Content" sub="Refine the achievement summary and detailed story.">
              <div className="form-grid">
                <F label="Short Summary" req htmlFor="summary" full><Counted name="summary" max={300} rows={3} defaultValue={s?.summary} placeholder="Briefly describe the achievement or entrepreneurial journey." /></F>
                <F label="Detailed Story" req htmlFor="body" full hint="Leave a blank line between paragraphs.">
                  <textarea className="input" id="body" name="body" rows={10} defaultValue={s?.body} placeholder="Write the complete success story, including the background, achievement and impact." />
                </F>
                <F label="Members involved (one per line)" htmlFor="members_involved">
                  <textarea className="input" id="members_involved" name="members_involved" rows={3} defaultValue={(s?.members_involved || []).join('\n')} />
                </F>
                <F label="Companies (one per line)" htmlFor="companies">
                  <textarea className="input" id="companies" name="companies" rows={3} defaultValue={(s?.companies || []).join('\n')} />
                </F>
              </div>
            </Panel>
          </div>
          <div>
            <Panel icon="image" title="Featured Photograph" sub="Upload a photograph representing the entrepreneur or achievement. JPG, PNG or WebP, up to 5 MB, 16:9 recommended.">
              <div className="form-grid"><ImageField id="image_url" n="image_url" text="Photo" value={s?.image_url} /></div>
            </Panel>
            <Panel icon="gear" title="Publication Settings">
              <KV rows={[['Story Status', <StatusPill key="s" status={s ? storyStatus(s) : 'draft'} />], ['Website Visibility', s?.published ? 'Public' : 'Not Published']]} />
              <label className="a-switch" style={{ marginTop: 10 }}>
                <span>Publication Permission<small>Permission to publish this story and associated media has been obtained.</small></span>
                <input type="checkbox" name="publish_permission" defaultChecked={Boolean(s?.publish_permission)} />
              </label>
              <label className="a-switch">
                <span>Featured Story<small>Shown at the top of the Success Stories page.</small></span>
                <input type="checkbox" name="featured" defaultChecked={Boolean(s?.featured)} />
              </label>
              <F label="Business category (optional)" htmlFor="business_category"><input className="input" id="business_category" name="business_category" defaultValue={s?.business_category} /></F>
              <p className="a-muted-sm" style={{ marginTop: 10 }}><Icon name="info" /> Stories become publicly visible only after review and publication.</p>
            </Panel>
            {editing && (
              <Panel icon="info" title="Story Information">
                <KV rows={[['Created On', fmt.stamp(s.created_at)], ['Last Updated', fmt.stamp(s.updated_at)], ['Publication Status', <StatusPill key="s" status={storyStatus(s)} />]]} />
              </Panel>
            )}
          </div>
        </div>
        <Foot error={formError}>
          <a className="btn btn-outline left" href={`#${back}`}>Cancel</a>
          {editing && <a className="btn btn-outline" href={`#stories/${s.id}/preview`}><Icon name="eye" /> Preview Story</a>}
          <button className="btn btn-primary" type="submit" disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</button>
        </Foot>
      </form>
    </Page>
  );
}

// ---------- Details ----------

function Entrepreneur({ s }) {
  if (!s.member_id && !(s.members_involved || []).length) {
    return <Empty icon="user" title="No Entrepreneur Linked">Select a verified HEH member while editing this story.</Empty>;
  }
  return (
    <div className="a-who" style={{ gap: 14 }}>
      <Avatar name={s.member_name || s.members_involved[0]} photo={s.member_photo} size={52} />
      <span><b>{s.member_name || s.members_involved.join(', ')}</b><small>{[s.member_designation, s.member_company].filter(Boolean).join(', ') || (s.companies || []).join(', ')}</small></span>
    </div>
  );
}

function Details({ s }) {
  const ready = s.readiness.every(([, ok]) => ok);
  return (
    <Page crumbs={[CRUMB, ['Story Details']]} title="Success Story Details" sub="Review the story information, featured entrepreneur and publication status."
      back={['Back to Success Stories', 'stories']} actions={<a className="btn btn-primary" href={`#stories/${s.id}/edit`}><Icon name="edit" /> Edit Story</a>}>
      <div className="a-cols">
        <div>
          <Panel icon="file" title="Story Overview" sub="Basic information about this success story.">
            <KV cols={2} rows={[
              ['Story ID', `HEH-SS-${String(s.id).padStart(4, '0')}`], ['Story Category', s.category],
              ['Story Title', s.title], ['Publication Status', <StatusPill key="s" status={storyStatus(s)} />],
              ['Created On', fmt.stamp(s.created_at)], ['Last Updated', fmt.stamp(s.updated_at)],
              ['Published On', s.published ? fmt.date(s.published_on) : ''], ['Featured', s.featured ? 'Yes' : 'No'],
            ]} />
          </Panel>
          <Panel icon="edit" title="Story Content" sub="The summary and detailed story of this success story.">
            <KV rows={[['Short Summary', s.summary || 'No story summary has been added yet.'], ['Detailed Story', s.body || 'The detailed success story has not been added yet.']]} />
          </Panel>
          <Panel icon="clock" title="Recent Activity" aside={<a className="a-row-btn" href={`#stories/${s.id}/activity`}>View Full History <Icon name="arrow-right" /></a>}>
            <Timeline items={s.activity.slice(0, 5)} />
          </Panel>
        </div>
        <div>
          <Panel icon="image" title="Featured Photograph">
            {s.image_url ? <div className="a-cover" style={{ backgroundImage: `url('${s.image_url}')` }} /> : <Empty icon="image" title="No Featured Photograph Uploaded">A featured photograph can be added when editing this story.</Empty>}
          </Panel>
          <Panel icon="user" title="Featured Entrepreneur" sub="The HEH member featured in this success story."><Entrepreneur s={s} /></Panel>
          <Panel icon="gear" title="Publication Information">
            <KV rows={[['Story Status', <StatusPill key="s" status={storyStatus(s)} />], ['Publication Permission', s.publish_permission ? 'Granted' : 'Pending'],
              ['Website Visibility', s.published ? 'Public' : 'Not Published'], ...(s.archived ? [['Archive Reason', s.archive_reason]] : [])]} />
            {!s.archived && !s.published && (
              <Notice tone={ready ? 'blue' : 'orange'} title={ready ? 'Ready for Publication' : 'Not Ready for Publication'}
                items={ready ? ['Review the story and publish it to the HEH website.'] : s.readiness.filter(([, ok]) => !ok).map(([t]) => `${t} is still needed.`)} />
            )}
          </Panel>
        </div>
      </div>
      <Foot>
        <a className="btn btn-outline left" href="#stories">Back</a>
        <a className="btn btn-outline" href={`#stories/${s.id}/preview`}><Icon name="eye" /> Preview Story</a>
        <a className="btn btn-outline" href={`#stories/${s.id}/archive`}>{s.archived ? 'Restore Story' : 'Archive Story'}</a>
        {!s.archived && <a className="btn btn-primary" href={`#stories/${s.id}/review`}>{s.published ? 'Publication Status' : 'Review & Publish'} <Icon name="arrow-right" /></a>}
      </Foot>
    </Page>
  );
}

// ---------- Website preview ----------

function StoryCard({ s, mobile }) {
  return (
    <div className={`a-preview${mobile ? ' mobile' : ''}`}>
      <div className="bar"><img src="/assets/brand/logo.png" alt="" /><span>Home · About HEH · Membership · Events · Community · Contact</span></div>
      <div className="body">
        <span className="a-pill orange soft">{s.category || 'Success Story'}</span>
        <h3>{s.title || 'Your Success Story Title'}</h3>
        <p className="lead">{s.summary || 'The approved story title and summary will appear here.'}</p>
        <div className="a-cover" style={s.image_url ? { backgroundImage: `url('${s.image_url}')` } : undefined}>{!s.image_url && 'No Featured Photograph Uploaded'}</div>
        <div className="a-cols" style={{ gridTemplateColumns: mobile ? '1fr' : undefined }}>
          <div className="text">
            <h4>The Story</h4>
            {(s.body || 'The complete entrepreneurial journey, achievements and business impact will appear here once the content is completed.').split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div><h4>Featured Entrepreneur</h4><Entrepreneur s={s} /></div>
        </div>
      </div>
    </div>
  );
}

function Preview({ s }) {
  const [mode, setMode] = useState('desktop');
  return (
    <Page crumbs={[CRUMB, ['Story Details', `stories/${s.id}`], ['Website Preview']]} title="Website Story Preview" sub="Review how this story will appear on the HEH website."
      back={['Back to Story Details', `stories/${s.id}`]}>
      <StoryStrip s={s} />
      <Panel icon="monitor" title="Preview Mode" sub="See how this story will appear on the HEH website."
        aside={<span className="a-segs">{[['desktop', 'Desktop', 'monitor'], ['mobile', 'Mobile', 'phone']].map(([k, t, i]) => (
          <button key={k} type="button" className={mode === k ? 'on' : ''} onClick={() => setMode(k)}><Icon name={i} /> {t}</button>
        ))}</span>}>
        <StoryCard s={s} mobile={mode === 'mobile'} />
      </Panel>
      <Foot>
        <a className="btn btn-outline left" href="#stories">Back to Stories</a>
        <a className="btn btn-outline" href={`#stories/${s.id}/edit`}><Icon name="edit" /> Edit Story</a>
        {!s.archived && <a className="btn btn-primary" href={`#stories/${s.id}/review`}>Review & Publish <Icon name="arrow-right" /></a>}
      </Foot>
    </Page>
  );
}

// ---------- Review & publication ----------

function Review({ s }) {
  const { go, call, toast } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  const ready = s.readiness.every(([, ok]) => ok);
  async function unpublish() {
    try {
      await call(`/stories/${s.id}/unpublish`, { method: 'POST' });
      toast('Story moved back to draft');
      go(`stories/${s.id}`);
    } catch (err) { toast(err.message, true); }
  }
  return (
    <Page crumbs={[CRUMB, ['Story Details', `stories/${s.id}`], ['Review & Publication']]} title="Success Story Review & Publication"
      sub="Verify story information and approve it for publication on the HEH website." back={['Back to Story Details', `stories/${s.id}`]}>
      <StoryStrip s={s} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/stories/${s.id}/publish`, { confirm: 'confirm', success: 'Story published', done: () => go(`stories/${s.id}`) })}>
        <div className="a-cols">
          <div>
            <Panel icon="eye" title="Success Story Preview" sub="Review how the story will appear on the HEH website."
              aside={<a className="btn btn-outline btn-sm" href={`#stories/${s.id}/preview`}>Preview on Website <Icon name="external" /></a>}>
              <StoryCard s={s} />
            </Panel>
          </div>
          <div>
            <Panel icon="check-circle" tone="green" title="Publication Readiness" sub="Verify all requirements before publishing.">
              <Checklist items={s.readiness.map(([t, ok]) => [t, ok, ok ? 'Complete' : 'Incomplete'])} />
              {!ready && <Notice tone="red" title="Not Ready for Publication" items={['Complete the required story information and approvals before publishing.']} />}
            </Panel>
            <Panel icon="file" title="Publication Summary" sub="Key details of this success story.">
              <KV rows={[['Story ID', `HEH-SS-${String(s.id).padStart(4, '0')}`], ['Current Status', <StatusPill key="s" status={storyStatus(s)} />],
                ['Featured Member', s.member_name || (s.members_involved || []).join(', ')], ['Website Visibility', s.published ? 'Public' : 'Not Published'],
                ['Publication Date', s.published ? fmt.date(s.published_on) : 'On publishing']]} />
            </Panel>
          </div>
        </div>
        {s.published ? (
          <Foot>
            <a className="btn btn-outline left" href={`#stories/${s.id}/edit`}>Return to Edit</a>
            <button className="btn btn-outline" type="button" onClick={unpublish}>Unpublish (back to Draft)</button>
          </Foot>
        ) : (
          <>
            <ConfirmRow text="I confirm that the story information, achievements and publication permissions have been reviewed and verified." error={errors.confirm} />
            <Foot error={formError}>
              <a className="btn btn-outline left" href={`#stories/${s.id}/edit`}>Return to Edit</a>
              <a className="btn btn-outline" href={`#stories/${s.id}`}>Cancel</a>
              <button className="btn btn-primary" type="submit" disabled={busy || !ready}>Publish Success Story</button>
            </Foot>
          </>
        )}
      </form>
    </Page>
  );
}

// ---------- Archive / restore ----------

function Archive({ s }) {
  const { go, meta, call, toast } = useAdmin();
  const { errors, formError, busy, run } = useAction();
  async function restore() {
    try {
      await call(`/stories/${s.id}/restore`, { method: 'POST' });
      toast('Story restored as a draft');
      go(`stories/${s.id}`);
    } catch (err) { toast(err.message, true); }
  }
  if (s.archived) {
    return (
      <Page crumbs={[CRUMB, ['Story Details', `stories/${s.id}`], ['Archived Story']]} title="Archived Success Story" sub="This story is archived and hidden from the website."
        back={['Back to Story Details', `stories/${s.id}`]}>
        <StoryStrip s={s} />
        <Panel icon="info" title="Archive Information">
          <KV rows={[['Archive Reason', s.archive_reason], ['Archived On', s.archived_at ? fmt.stamp(s.archived_at) : '']]} />
          <Notice tone="blue" title="Restoring this story" items={['The story returns as a draft with its content, photograph and linked member intact.', 'Publish it again from Review & Publish when it is ready.']} />
        </Panel>
        <Foot><a className="btn btn-outline" href={`#stories/${s.id}`}>Cancel</a><button className="btn btn-primary" type="button" onClick={restore}>Restore as Draft</button></Foot>
      </Page>
    );
  }
  return (
    <Page crumbs={[CRUMB, ['Story Details', `stories/${s.id}`], ['Archive Story']]} title="Archive Success Story"
      sub="Remove a success story from public visibility while preserving its records." back={['Back to Story Details', `stories/${s.id}`]}>
      <StoryStrip s={s} />
      <form className="a-form" noValidate onSubmit={(e) => run(e, `/stories/${s.id}/archive`, { confirm: 'confirm', success: 'Story archived', done: () => go(`stories/${s.id}`) })}>
        <div className="a-cols">
          <div>
            <Panel icon="file" title="Archive Details" sub="Provide the reason for removing this story from public visibility.">
              <div className="form-grid">
                <F label="Archive Reason" req htmlFor="reason" error={errors.reason} full>
                  <select className="input" id="reason" name="reason" defaultValue=""><Options list={meta.storyArchiveReasons || []} placeholder="Select archive reason" /></select>
                </F>
                <F label="Internal Remarks" htmlFor="notes" full><Counted name="notes" placeholder="Add optional internal notes about this archive action…" /></F>
              </div>
            </Panel>
            <Panel icon="gear" title="Publication Status Change" sub="This action will update the publication and website visibility of the story.">
              <p className="a-muted-sm"><StatusPill status={storyStatus(s)} /> → <StatusPill status="archived" /></p>
            </Panel>
          </div>
          <div>
            <Notice title="What Happens After Archiving?" items={[
              'Public website: the story will be removed from the public Success Stories page.',
              'Existing story link: the public story link will no longer display the archived content.',
              'Story information: story text, photographs and linked members are kept securely.',
              'Future restoration: an administrator can restore the story as a draft.',
            ]} />
          </div>
        </div>
        <ConfirmRow text="I understand that this story will be removed from public visibility while its records remain preserved." error={errors.confirm} />
        <Foot error={formError}>
          <a className="btn btn-outline" href={`#stories/${s.id}`}>Cancel</a>
          <button className="btn danger-solid" type="submit" disabled={busy}>Archive Success Story</button>
        </Foot>
      </form>
    </Page>
  );
}

function Activity({ s }) {
  return (
    <Page crumbs={[CRUMB, ['Story Details', `stories/${s.id}`], ['Activity History']]} title="Success Story Activity History"
      sub="Track story updates, publication decisions and administrative actions." back={['Back to Story Details', `stories/${s.id}`]}>
      <StoryStrip s={s} />
      <ActivityHistory items={s.activity} entityLabel="Story" search="Search activities by description…" stats={[
        ['file', 'blue', 'Total Activities', (a) => a.length],
        ['edit', 'orange', 'Content Updates', (a) => a.filter((x) => /Created|Updated/.test(x.action)).length],
        ['globe', 'green', 'Publication Actions', (a) => a.filter((x) => /Published|Unpublished|Archived|Restored/.test(x.action)).length],
      ]} />
    </Page>
  );
}
