-- 0012: details for JA Chowdary (supplied 31 Oct 2026). team_role line 1 = role on the Members page, line 2 = shown below it.

UPDATE members SET
  team_role   = E'Chief Patron\nFormer IT Advisor and Special Chief Secretary to the Chief Minister, Government of Andhra Pradesh',
  designation = 'Former IT Advisor and Special Chief Secretary to the Chief Minister',
  company     = 'Government of Andhra Pradesh',
  bio         = 'Chief Patron of Hyderabad Entrepreneurs Hub (HEH). Former IT Advisor and Special Chief Secretary to the Chief Minister, Government of Andhra Pradesh.'
WHERE slug = 'ja-chowdary';
