-- 0019: Events added by Working Committee members in the Member Portal wait for approval by an Executive Council
-- member or an admin. Only approved events can be published, so nothing unapproved ever shows on the website.
-- Events created in /admin/ are approved from the start (the column default).

ALTER TABLE events
  ADD COLUMN approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN submitted_by    integer REFERENCES members (id) ON DELETE SET NULL, -- Working Committee member who added it
  ADD COLUMN submitted_at    timestamptz,
  ADD COLUMN reviewed_by     text NOT NULL DEFAULT '',  -- e.g. "Jane Doe (Executive Council)" or "admin (Admin)"
  ADD COLUMN reviewed_at     timestamptz,
  ADD COLUMN review_note     text NOT NULL DEFAULT '';  -- approval remarks / reason for rejection

ALTER TABLE events ADD CONSTRAINT events_published_needs_approval CHECK (approval_status = 'approved' OR NOT published);

CREATE INDEX events_submitted_by_idx ON events (submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX events_pending_idx ON events (submitted_at) WHERE approval_status = 'pending';
