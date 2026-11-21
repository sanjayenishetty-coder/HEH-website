-- 0020: N. Manjusha's new photo and title.
-- The photo ships in web/public/assets/team/ under a new file name, so browsers that cached the old one show the new
-- photo straight away. Each change only replaces the value the earlier migrations set, so anything changed since in
-- admin or in the Member Portal is kept.
UPDATE members SET photo_url = '/assets/team/manjusha-n.jpg', updated_at = now()
WHERE slug = 'manjusha' AND photo_url = '/assets/team/manjusha-m.jpg';

UPDATE members SET designation = 'Yoga & Wellness Coach', updated_at = now()
WHERE slug = 'manjusha' AND designation = 'Certified Yoga Instructor';
