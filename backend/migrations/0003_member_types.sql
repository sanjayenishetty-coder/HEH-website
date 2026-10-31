-- 0003: member types for the "About HEH > Members" page (Core Team, Working Committee, Advisory Board).
-- member_types: list of keys from constants.memberTypes (a member can be in more than one).
-- team_role: role shown on that page (e.g. "Marketing Head"); falls back to designation when empty.

ALTER TABLE members ADD COLUMN IF NOT EXISTS member_types jsonb NOT NULL DEFAULT '[]';
ALTER TABLE members ADD COLUMN IF NOT EXISTS team_role text NOT NULL DEFAULT '';

-- Core team, from entrepreneurhub.in/team. Working Committee / Advisory Board are assigned in /admin/.
UPDATE members AS m SET member_types = '["core_team"]', team_role = t.role
FROM (VALUES
  ('sanjay-enishetty', 'Chief Mentor & Advisor'),
  ('naresh-kuchi', 'Managing Director'),
  ('sai-prakash-av', 'Marketing Head'),
  ('sridhar', 'Head – Operations'),
  ('manjusha', 'Head – Women’s Win'),
  ('jayalakshmi', 'Head – Membership Growth')
) AS t (slug, role)
WHERE m.slug = t.slug;
