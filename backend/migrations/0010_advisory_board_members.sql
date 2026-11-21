-- 0010: Advisory Board members added 31 Oct 2026 (from the list of photo files shared: Mr JA Chowdary, Praveen Dorna,
-- Rathnakar (Hyd Angels), Sushanto, Vivek Shukla). JA Chowdary was added in 0007. Photos and roles to be added in /admin/.

INSERT INTO members (slug, member_code, full_name, designation, company, industry, member_types, team_order, sort_order) VALUES
  ('praveen-dorna', 'HEH-M-0026', 'Praveen Dorna', '', '', 'Other Services', '["advisory_board"]', 2, 26),
  ('rathnakar', 'HEH-M-0027', 'Rathnakar', '', 'Hyderabad Angels', 'Financial & Professional Services', '["advisory_board"]', 3, 27),
  ('sushanto', 'HEH-M-0028', 'Sushanto', '', '', 'Other Services', '["advisory_board"]', 4, 28),
  ('vivek-shukla', 'HEH-M-0029', 'Vivek Shukla', '', '', 'Other Services', '["advisory_board"]', 5, 29)
ON CONFLICT (slug) DO NOTHING;
