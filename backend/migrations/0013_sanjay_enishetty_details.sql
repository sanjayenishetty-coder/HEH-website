-- 0013: details for Sanjay Enishetty (supplied 31 Oct 2026). Members page card: role, then his positions;
-- profile bio: the full text.

UPDATE members SET
  team_role   = E'Chief Mentor & Advisor\nFounder, ScaleMe\nFormer CEO, Naturals — India''s largest salon chain (800+ outlets, 150+ cities)\nFormer CEO, 50K Ventures',
  designation = 'Founder',
  company     = 'ScaleMe',
  bio         = E'Chief Mentor & Advisor of Hyderabad Entrepreneurs Hub (HEH).\n\nFounder, ScaleMe. Former CEO, Naturals — India''s largest salon chain (800+ outlets, 150+ cities). Former CEO, 50K Ventures.\n\nOperator, investor, and ecosystem builder across two decades. Trusted by first and second-generation business owners across India.'
WHERE slug = 'sanjay-enishetty';
