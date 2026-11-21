-- 0005: order of people within each group on the "About HEH > Members" page (lower first; 0 = after the numbered ones,
-- by the directory sort order). Separate from sort_order so the Community member directory keeps its order.

ALTER TABLE members ADD COLUMN IF NOT EXISTS team_order integer NOT NULL DEFAULT 0;

UPDATE members AS m SET team_order = t.n
FROM (VALUES
  ('sanjay-enishetty', 1), ('naresh-kuchi', 2), ('sai-prakash-av', 3),                       -- Core Team
  ('sridhar', 1), ('vishnu-murthy', 2), ('manjusha', 3), ('jayalakshmi', 4)                  -- Working Committee, in the given order
) AS t (slug, n)
WHERE m.slug = t.slug;
