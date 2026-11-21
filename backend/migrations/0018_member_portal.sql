-- 0018: Member Portal (designs: images/Member Login Web Application/Part 1).
-- Members sign in at /portal/ with their email or HEH Membership ID. An administrator turns portal access on
-- for a member (Admin > Members > the member > Member Portal access), which sets a temporary password.

CREATE TABLE member_accounts (
  id                   serial PRIMARY KEY,
  member_id            integer NOT NULL UNIQUE REFERENCES members (id) ON DELETE CASCADE,
  password_hash        text NOT NULL,
  temporary_password   boolean NOT NULL DEFAULT true,  -- set by an administrator; the member is asked to change it
  disabled             boolean NOT NULL DEFAULT false,
  -- sessions issued before this time are no longer valid (password changed or reset)
  sessions_valid_after timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz,
  -- {events, connections, announcements, stories, in_app, email, whatsapp}: true/false
  notify_prefs         jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Password reset links (sha256 of the random token in the link).
CREATE TABLE member_tokens (
  id         serial PRIMARY KEY,
  account_id integer NOT NULL REFERENCES member_accounts (id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profile details the member edits in the portal.
ALTER TABLE members
  ADD COLUMN city               text NOT NULL DEFAULT '',
  ADD COLUMN state              text NOT NULL DEFAULT '',
  ADD COLUMN business_type      text NOT NULL DEFAULT '',
  ADD COLUMN business_email     text NOT NULL DEFAULT '',
  ADD COLUMN expertise_tags     jsonb NOT NULL DEFAULT '[]',  -- professional expertise, e.g. ["Software Development"]
  ADD COLUMN business_interests jsonb NOT NULL DEFAULT '[]',  -- sectors of interest, e.g. ["Technology", "Startups"]
  ADD COLUMN services           jsonb NOT NULL DEFAULT '[]',  -- services offered
  -- {show_in_directory, email_visibility, mobile_visibility, show_company, show_expertise, show_interests,
  --  allow_requests, show_activity}; missing keys use the defaults in src/routes/member.js
  ADD COLUMN privacy            jsonb NOT NULL DEFAULT '{}';

CREATE TABLE member_connections (
  id           serial PRIMARY KEY,
  requester_id integer NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  recipient_id integer NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'removed')),
  purpose      text NOT NULL DEFAULT '',
  message      text NOT NULL DEFAULT '',
  responded_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);
-- At most one open (pending or accepted) connection between two members, whoever asked.
CREATE UNIQUE INDEX member_connections_pair ON member_connections
  (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id)) WHERE status IN ('pending', 'accepted');
CREATE INDEX member_connections_recipient ON member_connections (recipient_id, status);
CREATE INDEX member_connections_requester ON member_connections (requester_id, status);

-- Verification documents; files are kept outside the public /uploads folder and sent only to the member and admins.
CREATE TABLE member_documents (
  id          serial PRIMARY KEY,
  member_id   integer NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  category    text NOT NULL,           -- Identity, Company, Membership
  doc_type    text NOT NULL,           -- e.g. Company Registration Certificate
  file_name   text NOT NULL,           -- name as uploaded
  stored_name text NOT NULL UNIQUE,    -- name on disk
  mime        text NOT NULL,
  size        integer NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  remarks     text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_documents_member ON member_documents (member_id);

CREATE TABLE member_notifications (
  id         serial PRIMARY KEY,
  member_id  integer NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('event', 'announcement', 'connection', 'story', 'update')),
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  link       text NOT NULL DEFAULT '',  -- portal hash, e.g. events/heh-meet
  ref_key    text,                      -- set for generated notices so each is created once
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX member_notifications_ref ON member_notifications (member_id, ref_key) WHERE ref_key IS NOT NULL;
CREATE INDEX member_notifications_member ON member_notifications (member_id, created_at DESC);

-- Event gallery items a member saved ("<event id>:p<n>" photo, "<event id>:v<n>" video).
CREATE TABLE member_saved_media (
  member_id  integer NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  media_key  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, media_key)
);

-- Event videos for the gallery: [{title, url}] (YouTube link or a video file URL).
ALTER TABLE events ADD COLUMN videos jsonb NOT NULL DEFAULT '[]';

-- Registrations made from the portal are linked to the member; notes and check-in time for the member's view.
ALTER TABLE event_registrations
  ADD COLUMN member_id     integer REFERENCES members (id) ON DELETE SET NULL,
  ADD COLUMN notes         text NOT NULL DEFAULT '',
  ADD COLUMN checked_in_at timestamptz;
CREATE INDEX event_registrations_member ON event_registrations (member_id);
-- Link existing registrations to members by membership ID.
UPDATE event_registrations r SET member_id = m.id FROM members m
WHERE r.member_id IS NULL AND lower(m.member_code) = lower(r.membership_id);
