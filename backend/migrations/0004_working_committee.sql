-- 0004: move Sridhar, Vishnu Murthy, Manjusha and Jayalakshmi to the Working Committee (out of the Core Team),
-- as requested on 31 Oct 2026. Their team_role (e.g. "Head – Operations") is kept and still shown on their cards.

UPDATE members SET member_types = '["working_committee"]'
WHERE slug IN ('sridhar', 'vishnu-murthy', 'manjusha', 'jayalakshmi');
