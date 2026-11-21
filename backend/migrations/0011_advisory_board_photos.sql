-- 0011: Advisory Board photos (supplied 31 Oct 2026, in the order of the shared file list), in web/public/assets/team/.

UPDATE members AS m SET photo_url = '/assets/team/' || m.slug || '.jpg'
WHERE m.slug IN ('ja-chowdary', 'praveen-dorna', 'rathnakar', 'sushanto', 'vivek-shukla');
