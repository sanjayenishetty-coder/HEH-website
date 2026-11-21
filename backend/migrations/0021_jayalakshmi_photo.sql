-- 0021: new photo for Jayalakshmi Kakumanu (shipped in web/public/assets/team/ under a new file name so cached copies
-- of the old one are not shown). Only replaces the photo the earlier migrations set, so a photo changed since in admin
-- or in the Member Portal is kept.
UPDATE members SET photo_url = '/assets/team/jayalakshmi-k.jpg', updated_at = now()
WHERE slug = 'jayalakshmi' AND photo_url = '/assets/team/jaya-lakshmi.jpg';
