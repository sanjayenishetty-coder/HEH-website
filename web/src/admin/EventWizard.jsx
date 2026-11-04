// Create New Event wizard (designs: images/Part2): basic details, schedule & venue, registration settings,
// review & create, then the "Event Created" confirmation with Publish Event.
// Routes: #events/new, #events/<id>/created
import { useRef, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { useAdmin, useLoad, ViewState } from './Admin.jsx';
import { ImageField } from './Content.jsx';
import { ConfirmRow, Counted, F, Foot, KV, Notice, Options, Page, Panel, readForm } from './parts.jsx';
import { StatusPill, TypePill } from './ui.jsx';

const STEPS = ['Basic Details', 'Schedule & Venue', 'Registration Settings', 'Review & Create'];
const CRUMBS = [['Events', 'events'], ['Create New Event']];
const typeName = (c) => (c === 'workshop' ? 'HEH Workshop' : c === 'spotlight' ? 'HEH Spotlight' : '');

export default function EventPages({ path }) {
  const [id, action] = path;
  if (id === 'new') return <Wizard />;
  if (action === 'created') return <Created id={id} />;
  window.location.hash = `events?open=${id}`;
  return null;
}

function Steps({ step }) {
  return (
    <ol className="a-card a-steps">
      {STEPS.map((t, i) => (
        <li key={t} className={i < step ? 'done' : i === step ? 'on' : ''}><i>{i < step ? <Icon name="check" /> : i + 1}</i>{t}</li>
      ))}
    </ol>
  );
}

// Each step checks its own required fields.
function check(step, d) {
  const e = {};
  if (step === 0) {
    if (!d.title) e.title = 'Enter the event name.';
    if (!d.category) e.category = 'Select the event type.';
  }
  if (step === 1) {
    if (!d.event_date) e.event_date = 'Select the event date.';
    if (!d.start_time) e.start_time = 'Select the start time.';
    if (d.start_time && d.end_time && d.end_time <= d.start_time) e.end_time = 'End time must be after the start time.';
    if (!d.venue_name) e.venue_name = 'Enter the venue name.';
  }
  if (step === 2) {
    if (d.capacity && !(Number.isInteger(Number(d.capacity)) && Number(d.capacity) > 0)) e.capacity = 'Enter a whole number, or leave blank for no limit.';
    if (d.registration_opens && d.registration_closes && d.registration_closes < d.registration_opens) e.registration_closes = 'Closing date must be after the opening date.';
    if (d.registration_closes && d.event_date && d.registration_closes > d.event_date) e.registration_closes = 'Registration should close on or before the event date.';
  }
  return e;
}

function Wizard() {
  const { call, toast, go } = useAdmin();
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ category: '', city: 'Hyderabad', approval_mode: 'auto', guests: false, registration_open: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useRef();

  const collect = () => ({ ...d, ...readForm(form.current) });

  function move(to) {
    const next = collect();
    const errs = to > step ? check(step, next) : {};
    setD(next);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = form.current.elements[Object.keys(errs)[0]];
      if (first?.focus) first.focus();
      return;
    }
    setStep(to);
    window.scrollTo(0, 0);
  }

  async function save(asDraftOnly) {
    const data = collect();
    setD(data);
    setFormError('');
    if (!data.title) { setStep(0); setErrors({ title: 'Enter the event name.' }); return; }
    if (!asDraftOnly && !data.confirm) { setErrors({ confirm: 'Please tick this box to confirm.' }); return; }
    setBusy(true);
    try {
      const body = {
        title: data.title, category: data.category || 'spotlight', coordinator: data.coordinator, short_description: data.short_description,
        description: data.description, image_url: data.image_url, event_date: data.event_date, start_time: data.start_time, end_time: data.end_time,
        venue_name: data.venue_name, venue_address: data.venue_address, city: data.city, map_url: data.map_url,
        capacity: data.capacity, registration_opens: data.registration_opens, registration_closes: data.registration_closes,
        members_only: !data.guests, approval_mode: data.approval_mode, registration_open: data.registration_open, published: false,
      };
      const ev = await call('/events', { method: 'POST', body });
      if (asDraftOnly) { toast('Event saved as draft'); go('events'); } else go(`events/${ev.id}/created`);
    } catch (err) { setFormError(err.message); } finally { setBusy(false); }
  }

  const setup = (
    <Panel icon="gear" title="Event Setup">
      <KV rows={[
        ['Event Type', d.category ? <TypePill key="t" type={d.category} /> : 'Not selected'], ['Coordinator', d.coordinator || 'Not assigned'],
        ['Event Status', <StatusPill key="s" status="draft" />], ['Website Visibility', 'Not Published'], ['Creation Progress', `Step ${step + 1} of 4`],
      ]} />
    </Panel>
  );
  const sideNotes = [
    ['Ensure the event name, category and coordinator are correct.', 'The event will remain in Draft until you publish it.', 'You can save it as a draft and complete the details later.'],
    ['Ensure the event date, timings and venue information are accurate.', 'Verify the venue address and Google Maps link (if available).', 'The event remains in Draft until it is reviewed and published.'],
    ['Registrations become available only after the event is published.', 'With manual approval, each registration waits for an administrator to approve it.', 'At least one participant category (HEH members) can always register.'],
    ['The event will be saved as Draft.', 'It will appear in Events Management.', 'Publish it to make it and its registration page visible on the HEH website.'],
  ][step];

  return (
    <Page crumbs={CRUMBS} title="Create New Event" sub="Set up a new HEH Spotlight Session or Workshop." back={['Back to Events', 'events']}>
      <Steps step={step} />
      <form ref={form} className="a-form" noValidate onSubmit={(e) => { e.preventDefault(); if (step < 3) move(step + 1); else save(false); }}>
        <div className="a-cols">
          <div key={step}>
            {step === 0 && (
              <Panel icon="file" title="Basic Event Information" sub="Enter the essential details of your event.">
                <div className="form-grid">
                  <F label="Event Name" req htmlFor="title" error={errors.title} full>
                    <input className="input" id="title" name="title" maxLength={120} defaultValue={d.title} placeholder="Enter event name (e.g. HEH Business Spotlight – November 2026)" />
                  </F>
                  <F label="Event Type" req htmlFor="category" error={errors.category}>
                    <select className="input" id="category" name="category" defaultValue={d.category}><Options list={[['spotlight', 'HEH Spotlight'], ['workshop', 'HEH Workshop']]} placeholder="Select event type" /></select>
                  </F>
                  <F label="Event Coordinator" htmlFor="coordinator"><input className="input" id="coordinator" name="coordinator" defaultValue={d.coordinator} placeholder="e.g. HEH Events Team" /></F>
                  <F label="Short Description (cards & registration page)" htmlFor="short_description" full>
                    <Counted name="short_description" max={200} rows={2} defaultValue={d.short_description} placeholder="One or two lines about the event." />
                  </F>
                  <F label="Event Description" htmlFor="description" full>
                    <Counted name="description" max={2000} rows={5} defaultValue={d.description} placeholder="Briefly describe the event and its purpose." />
                  </F>
                  <ImageField id="image_url" n="image_url" text="Event Cover Image (optional) — JPG, PNG or WebP, up to 5 MB" value={d.image_url} />
                </div>
              </Panel>
            )}
            {step === 1 && (
              <>
                <Panel icon="calendar" title="Event Schedule" sub="Set the event date and timings.">
                  <div className="form-grid three">
                    <F label="Event Date" req htmlFor="event_date" error={errors.event_date}><input className="input" type="date" id="event_date" name="event_date" defaultValue={d.event_date} /></F>
                    <F label="Start Time" req htmlFor="start_time" error={errors.start_time}><input className="input" type="time" id="start_time" name="start_time" defaultValue={d.start_time} /></F>
                    <F label="End Time" htmlFor="end_time" error={errors.end_time}><input className="input" type="time" id="end_time" name="end_time" defaultValue={d.end_time} /></F>
                  </div>
                </Panel>
                <Panel icon="pin" title="Venue Information" sub="Where the event will take place.">
                  <div className="form-grid">
                    <F label="Venue Name" req htmlFor="venue_name" error={errors.venue_name}><input className="input" id="venue_name" name="venue_name" defaultValue={d.venue_name} placeholder="e.g. The Park Hyderabad" /></F>
                    <F label="City" req htmlFor="city"><input className="input" id="city" name="city" defaultValue={d.city} /></F>
                    <F label="Venue Address" htmlFor="venue_address" full><input className="input" id="venue_address" name="venue_address" defaultValue={d.venue_address} placeholder="e.g. Banjara Hills, Hyderabad, Telangana – 500034" /></F>
                    <F label="Google Maps Link (optional)" htmlFor="map_url" full><input className="input" id="map_url" name="map_url" defaultValue={d.map_url} placeholder="https://maps.app.goo.gl/…" /></F>
                  </div>
                </Panel>
              </>
            )}
            {step === 2 && (
              <Panel icon="user-check" title="Registration Settings" sub="Configure participant eligibility, capacity and approval rules.">
                <div className="form-grid three">
                  <F label="Maximum Participants" htmlFor="capacity" error={errors.capacity} hint="Leave blank for no limit.">
                    <input className="input" type="number" min="1" id="capacity" name="capacity" defaultValue={d.capacity} />
                  </F>
                  <F label="Registration Opening Date" htmlFor="registration_opens" hint="Blank = open once published."><input className="input" type="date" id="registration_opens" name="registration_opens" defaultValue={d.registration_opens} /></F>
                  <F label="Registration Closing Date" htmlFor="registration_closes" error={errors.registration_closes} hint="Blank = until the event date."><input className="input" type="date" id="registration_closes" name="registration_closes" defaultValue={d.registration_closes} /></F>
                </div>
                <h3 className="a-gap" style={{ fontSize: 16 }}>Who Can Register?</h3>
                <label className="a-switch"><span>HEH Members<small>Allow registrations from HEH members (checked against the member directory).</small></span><input type="checkbox" checked disabled /></label>
                <label className="a-switch"><span>Guests / Non-Members<small>Allow registrations from external participants.</small></span><input type="checkbox" name="guests" defaultChecked={d.guests} /></label>
                <h3 className="a-gap" style={{ fontSize: 16 }}>Registration Approval</h3>
                <div className="a-choice">
                  <label><input type="radio" name="approval_mode" value="auto" defaultChecked={d.approval_mode !== 'manual'} /><span><b>Automatic Approval</b><small>Registrations are confirmed automatically (subject to capacity).</small></span></label>
                  <label><input type="radio" name="approval_mode" value="manual" defaultChecked={d.approval_mode === 'manual'} /><span><b>Manual Approval</b><small>Registrations stay pending until an administrator approves them.</small></span></label>
                </div>
                <label className="a-switch a-gap"><span>Accept Registrations<small>Allow participants to register for this event once it is published.</small></span><input type="checkbox" name="registration_open" defaultChecked={d.registration_open} /></label>
              </Panel>
            )}
            {step === 3 && (
              <Panel icon="eye" title="Review Event Details" sub="Verify the information before creating the event.">
                <ReviewBlock title="Basic Information" onEdit={() => move(0)} rows={[
                  ['Event Name', d.title], ['Event Type', typeName(d.category)], ['Coordinator', d.coordinator], ['Description', d.short_description || d.description],
                ]} image={d.image_url} />
                <ReviewBlock title="Schedule & Venue" onEdit={() => move(1)} rows={[
                  ['Event Date', fmt.date(d.event_date)], ['Time', fmt.timeRange(d.start_time, d.end_time)], ['Venue', d.venue_name], ['Address', [d.venue_address, d.city].filter(Boolean).join(', ')], ['Maps', d.map_url ? 'Link added' : ''],
                ]} />
                <ReviewBlock title="Registration Settings" onEdit={() => move(2)} rows={[
                  ['Maximum Participants', d.capacity || 'No limit'], ['Registration Opens', d.registration_opens ? fmt.date(d.registration_opens) : 'When published'],
                  ['Registration Closes', d.registration_closes ? fmt.date(d.registration_closes) : 'On the event date'], ['HEH Members', 'Allowed'],
                  ['Guests', d.guests ? 'Allowed' : 'Not allowed'], ['Approval Method', d.approval_mode === 'manual' ? 'Manual approval' : 'Automatic approval'],
                  ['Accept Registrations', d.registration_open ? 'Enabled' : 'Disabled'],
                ]} />
              </Panel>
            )}
          </div>
          <div>
            {setup}
            <Notice title={step === 3 ? 'What Happens Next?' : 'Before You Continue'} items={sideNotes} />
          </div>
        </div>
        {step === 3 && <ConfirmRow text="I confirm the event details are accurate." error={errors.confirm} />}
        <Foot error={formError}>
          {step > 0 ? <button className="btn btn-outline left" type="button" onClick={() => move(step - 1)}><Icon name="arrow-left" /> Back</button>
            : <a className="btn btn-outline left" href="#events">Cancel</a>}
          <button className="btn btn-outline" type="button" onClick={() => save(true)} disabled={busy}>Save Draft</button>
          <button className="btn btn-primary" type="submit" disabled={busy}>{step < 3 ? <>Save & Continue <Icon name="arrow-right" /></> : 'Create Event'}</button>
        </Foot>
      </form>
    </Page>
  );
}

function ReviewBlock({ title, rows, onEdit, image }) {
  return (
    <div className="a-card a-panel" style={{ marginBottom: 12, boxShadow: 'none' }}>
      <div className="a-panel-head" style={{ marginBottom: 10 }}>
        <div><h2 style={{ fontSize: 17 }}>{title}</h2></div>
        <div className="aside"><button className="a-row-btn" type="button" onClick={onEdit}><Icon name="edit" /> Edit</button></div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {image && <span className="a-thumb" style={{ width: 120, height: 80, flex: 'none', backgroundImage: `url('${image}')` }} />}
        <KV rows={rows} />
      </div>
    </div>
  );
}

function Created({ id }) {
  const { call, toast, go } = useAdmin();
  const state = useLoad(() => call(`/events/${id}`));
  const [busy, setBusy] = useState(false);
  async function publish() {
    setBusy(true);
    try {
      await call(`/events/${id}/publish`, { method: 'POST' });
      toast('Event published');
      go('events');
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  }
  return (
    <ViewState state={state}>
      {(e) => (
        <Page crumbs={[['Events', 'events'], ['Create New Event'], ['Confirmation']]} title="Event Created" sub="Your new HEH event has been saved successfully." back={['Back to Events', 'events']}>
          <section className="a-card a-panel">
            <div className="a-big-check">
              <span className="a-ic green"><Icon name="check" /></span>
              <h2>Event Created Successfully</h2>
              <p>Your HEH event has been created and saved as a draft. You can review the event details and publish it when ready.</p>
            </div>
            <div style={{ maxWidth: 640, margin: '10px auto 0' }}>
              <Panel icon="calendar" title="Event Summary">
                <KV rows={[
                  ['Event Name', e.title], ['Event ID', `HEH-EVT-${String(e.id).padStart(4, '0')}`], ['Event Type', <TypePill key="t" type={e.category} />],
                  ['Event Date', fmt.date(e.event_date)], ['Event Time', fmt.timeRange(e.start_time, e.end_time)],
                  ['Event Status', <StatusPill key="s" status={e.published ? 'published' : 'draft'} />], ['Website Visibility', e.published ? 'Published' : 'Not Published'],
                ]} />
              </Panel>
              <div className="a-gap"><Notice title="What Happens Next?" items={['Your event is currently saved as Draft.', 'Publish it to make the event and its registration page visible on the HEH website.']} /></div>
            </div>
            <Foot>
              <a className="btn btn-outline" href={`#events?open=${e.id}`}>View Event Details</a>
              {!e.published && <button className="btn btn-primary" type="button" onClick={publish} disabled={busy}>Publish Event <Icon name="arrow-right" /></button>}
            </Foot>
          </section>
        </Page>
      )}
    </ViewState>
  );
}
