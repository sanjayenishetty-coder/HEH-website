-- 0014: Sai Prakash AV moves from the Executive Council to the Working Committee (31 Oct 2026), first in that group.

UPDATE members SET member_types = '["working_committee"]' WHERE slug = 'sai-prakash-av';

UPDATE members AS m SET team_order = t.n
FROM (VALUES ('sai-prakash-av', 1), ('sridhar', 2), ('vishnu-murthy', 3), ('manjusha', 4), ('jayalakshmi', 5)) AS t (slug, n)
WHERE m.slug = t.slug;
