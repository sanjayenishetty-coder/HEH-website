-- 0007: JA Chowdary, Chief Patron, on the Advisory Board (added 31 Oct 2026). Photo and profile can be added in /admin/.

INSERT INTO members (slug, member_code, full_name, designation, company, industry, member_types, team_role, team_order, sort_order)
VALUES ('ja-chowdary', 'HEH-M-0025', 'JA Chowdary', 'Chief Patron', 'Hyderabad Entrepreneurs Hub (HEH)', 'Other Services',
        '["advisory_board"]', 'Chief Patron', 1, 25)
ON CONFLICT (slug) DO NOTHING;
