-- 0009: member directory order requested on 31 Oct 2026: these seven first, then everyone else in their previous order.

WITH wanted (slug, n) AS (VALUES
  ('sanjay-enishetty', 1), ('naresh-kuchi', 2), ('sai-prakash-av', 3), ('vishnu-murthy', 4),
  ('sridhar', 5), ('manjusha', 6), ('jayalakshmi', 7)
),
renumbered AS (
  SELECT m.id,
         COALESCE(w.n, 7 + row_number() OVER (PARTITION BY w.n IS NULL ORDER BY m.sort_order, m.full_name)) AS n
  FROM members m LEFT JOIN wanted w ON w.slug = m.slug
)
UPDATE members m SET sort_order = r.n FROM renumbered r WHERE r.id = m.id;
