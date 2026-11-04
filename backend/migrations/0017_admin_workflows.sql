-- 0017: admin workflows (designs: images/Part2): activity history, registration approval, enquiry assignment and
-- responses, success-story review/archive, event registration settings and report export history.

-- Every admin action, shown on the "Activity History" screens and the audit log.
-- module: applications, members, events, registrations, stories, enquiries, reports, ...
CREATE TABLE admin_activity (
  id         serial PRIMARY KEY,
  admin_id   integer REFERENCES admin_users (id) ON DELETE SET NULL,
  admin_name text NOT NULL DEFAULT '',
  module     text NOT NULL,
  entity_id  integer,
  entity_ref text NOT NULL DEFAULT '',     -- reference or title shown in the history
  action     text NOT NULL,                -- e.g. "Registration Approved"
  details    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_activity_entity_idx ON admin_activity (module, entity_id, created_at DESC);
CREATE INDEX admin_activity_time_idx ON admin_activity (created_at DESC);

-- Registrations can wait for approval (events with approval_mode = 'manual') and be rejected.
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'attended'));
ALTER TABLE event_registrations
  ADD COLUMN admin_notes   text NOT NULL DEFAULT '',
  ADD COLUMN status_reason text NOT NULL DEFAULT '';   -- rejection / cancellation reason

-- Event registration settings (Create New Event, step 3).
ALTER TABLE events
  ADD COLUMN coordinator         text NOT NULL DEFAULT '',
  ADD COLUMN city                text NOT NULL DEFAULT 'Hyderabad',
  ADD COLUMN capacity            integer,            -- maximum participants; null = no limit
  ADD COLUMN registration_opens  date,               -- null = open now
  ADD COLUMN registration_closes date,               -- null = until the event date
  ADD COLUMN approval_mode       text NOT NULL DEFAULT 'auto' CHECK (approval_mode IN ('auto', 'manual'));

-- Enquiry assignment, follow-ups and closing.
ALTER TABLE enquiries
  ADD COLUMN assigned_to     integer REFERENCES admin_users (id) ON DELETE SET NULL,
  ADD COLUMN assigned_at     timestamptz,
  ADD COLUMN priority        text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN follow_up_date  date,
  ADD COLUMN follow_up_notes text NOT NULL DEFAULT '',
  ADD COLUMN close_reason    text NOT NULL DEFAULT '',
  ADD COLUMN closed_at       timestamptz;

CREATE TABLE enquiry_responses (
  id                 serial PRIMARY KEY,
  enquiry_id         integer NOT NULL REFERENCES enquiries (id) ON DELETE CASCADE,
  channel            text NOT NULL,                  -- Phone Call, Email, WhatsApp, In Person, ...
  contacted_at       timestamptz NOT NULL,
  summary            text NOT NULL,
  outcome            text NOT NULL,
  follow_up_required boolean NOT NULL DEFAULT false,
  next_follow_up     date,
  instructions       text NOT NULL DEFAULT '',
  admin_id           integer REFERENCES admin_users (id) ON DELETE SET NULL,
  admin_name         text NOT NULL DEFAULT '',
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiry_responses_enquiry_idx ON enquiry_responses (enquiry_id, contacted_at DESC);

-- Success stories: featured HEH member, publication permission and archiving (archived stories are unpublished).
ALTER TABLE stories
  ADD COLUMN member_id          integer REFERENCES members (id) ON DELETE SET NULL,
  ADD COLUMN publish_permission boolean NOT NULL DEFAULT false,
  ADD COLUMN archived           boolean NOT NULL DEFAULT false,
  ADD COLUMN archive_reason     text NOT NULL DEFAULT '',
  ADD COLUMN archived_at        timestamptz;
UPDATE stories SET publish_permission = true WHERE published;

-- Reports > Export & Download History. params holds what was asked for, so a report can be downloaded again.
CREATE TABLE report_exports (
  id         serial PRIMARY KEY,
  report     text NOT NULL,                  -- registrations, members, applications, events, enquiries
  name       text NOT NULL,
  format     text NOT NULL,                  -- xlsx, csv, pdf
  params     jsonb NOT NULL DEFAULT '{}',
  row_count  integer NOT NULL DEFAULT 0,
  admin_id   integer REFERENCES admin_users (id) ON DELETE SET NULL,
  admin_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
