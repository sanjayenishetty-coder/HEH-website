-- 0015: official HEH member list (38 rows, shared 31 Oct 2026).
-- Existing members are updated to the names, designations and companies in the list; new members are added
-- (rows 6 and 8 are the same person, added once). Members not in this list are left as they are.
-- Directory order: the agreed top seven first, then the list's order, then everyone else in their previous order.

INSERT INTO members (slug, member_code, full_name, designation, company, industry, sort_order) VALUES
  ('abhinav-reddy-gotham', 'HEH-M-0030', 'Abhinav Reddy Gotham', 'Founder & Director', 'Trishakti Interiors by ARG', 'Real Estate & Construction', 0),
  ('anjani-singh', 'HEH-M-0031', 'Anjani Singh', 'CEO', 'Kyra', 'Other Services', 0),
  ('aditya-sainath-kakunanu', 'HEH-M-0032', 'Ar. Aditya Sainath Kakunanu', 'Principal Architect', 'Kridha Architects', 'Real Estate & Construction', 0),
  ('b-swathi', 'HEH-M-0033', 'B. Swathi', 'Founder', 'Go Green Landscaping and Horticulture', 'Other Services', 0),
  ('bala-hema-sunder-chavali', 'HEH-M-0034', 'Bala Hema Sunder Chavali', 'Founder', 'Housing and Loans.com', 'Financial & Professional Services', 0),
  ('chandrakanth-shivarathri', 'HEH-M-0035', 'Chandrakanth Shivarathri', 'Founder', 'JataU', 'Other Services', 0),
  ('deepak-bhattad', 'HEH-M-0036', 'Deepak Bhattad', 'CXO', 'Bradsol', 'Technology & IT Services', 0),
  ('rajaram', 'HEH-M-0037', 'Dr. Rajaram', 'Founder & Managing Director', 'Sri Raghavas Physio Clinic', 'Healthcare', 0),
  ('rohit-kumar-tirunagari', 'HEH-M-0038', 'Dr. Rohit Kumar Tirunagari', 'Managing Director', 'Siri Caterer''s', 'Hospitality & Food Services', 0),
  ('suresh-kumar', 'HEH-M-0039', 'Dr. Suresh Kumar', 'Founder', '', 'Other Services', 0),
  ('gundra-santosh-kumar', 'HEH-M-0040', 'Gundra Santosh Kumar', 'Working Partner & SM (M&S)', 'Haripriya Developers', 'Real Estate & Construction', 0),
  ('keerthi', 'HEH-M-0041', 'Keerthi', 'Managing Director', 'Columbus Coffee Shop', 'Hospitality & Food Services', 0),
  ('kvrk-varma', 'HEH-M-0042', 'KVRK Varma', 'Managing Director', 'Devayaan', 'Other Services', 0),
  ('pandu-chittimalla', 'HEH-M-0043', 'Pandu Chittimalla', 'Handloom Designer & Textile Revivalist', 'Shree Panduranga Handlooms', 'Manufacturing', 0),
  ('rajasekhar-duggempudi', 'HEH-M-0044', 'Rajasekhar Duggempudi', 'Managing Partner', 'The Nightbird', 'Hospitality & Food Services', 0),
  ('raviteja-parinam', 'HEH-M-0045', 'Raviteja Parinam', 'Co-founder', 'A3 Advisors LLP', 'Financial & Professional Services', 0),
  ('rohit-maila', 'HEH-M-0046', 'Rohit Maila', 'Proprietor', 'Mahaveer Computers', 'Retail & Trading', 0),
  ('srinivas-gandla', 'HEH-M-0047', 'Srinivas Gandla', 'Founder & Director', 'Swimdeep Technologies Pvt. Ltd.', 'Technology & IT Services', 0),
  ('suda-anki-reddy', 'HEH-M-0048', 'Suda Anki Reddy', 'AVP', 'Axis Max Life', 'Financial & Professional Services', 0),
  ('sunnam-srikanth', 'HEH-M-0049', 'Sunnam Srikanth', 'Director', 'Shree Infra Developers', 'Real Estate & Construction', 0)
ON CONFLICT (slug) DO NOTHING;

UPDATE members SET full_name = 'Amarnath Reddy', designation = 'Founder', company = 'Hyd Party Rentals', industry = 'Other Services' WHERE slug = 'amarnath-reddy';
UPDATE members SET website = 'https://housingandloan.com' WHERE slug = 'bala-hema-sunder-chavali';
UPDATE members SET full_name = 'Jayalakshmi Kakumanu', designation = 'Founder & Managing Director', company = 'Raadhya Infrastructures Pvt. Ltd.', industry = 'Real Estate & Construction' WHERE slug = 'jayalakshmi';
UPDATE members SET full_name = 'Kalagony Vishnu Murthy', designation = 'CEO', company = 'Visu Technologies Private Limited', industry = 'Technology & IT Services' WHERE slug = 'vishnu-murthy';
UPDATE members SET full_name = 'Madhulika Mullapudi', designation = 'Managing Director', company = 'RM Global Services', industry = 'Other Services' WHERE slug = 'madhulika';
UPDATE members SET full_name = 'Makani Siva Pradeep', designation = 'Authorised Signatory', company = 'Megha Consultancy', industry = 'Other Services' WHERE slug = 'shiva-pradeep';
UPDATE members SET full_name = 'Manikanta', designation = 'Founder', company = 'Finora Advisory Services', industry = 'Financial & Professional Services' WHERE slug = 'manikanta';
UPDATE members SET full_name = 'N. Manjusha', designation = 'Certified Yoga Instructor', company = 'Manasananda Yoga', industry = 'Healthcare' WHERE slug = 'manjusha';
UPDATE members SET full_name = 'Namburi Venkata Raju', designation = 'Founder & Travel Consultant', company = 'Journeys with NVR', industry = 'Other Services' WHERE slug = 'namburi-venkat-raju';
UPDATE members SET full_name = 'Naresh Kuchi', designation = 'Director', company = 'Sports Hub', industry = 'Other Services' WHERE slug = 'naresh-kuchi';
UPDATE members SET full_name = 'NVS Murthy', designation = 'Consultant', company = 'KIMS Hospital', industry = 'Healthcare' WHERE slug = 'nvs-murthy';
UPDATE members SET full_name = 'Pankaj', designation = 'Founder & Managing Director', company = 'Comphor Placements', industry = 'Other Services' WHERE slug = 'pankaj';
UPDATE members SET full_name = 'Sai Kumar', designation = 'Founder', company = 'Sai Photography Services', industry = 'Other Services' WHERE slug = 'sai-kumar';
UPDATE members SET full_name = 'Sai Prakash A. V.', designation = 'Founder & CEO', company = 'Prak Studio LLP', industry = 'Other Services' WHERE slug = 'sai-prakash-av';
UPDATE members SET full_name = 'Sheeba', designation = 'Proprietor', company = 'Radiance Aesthetic Beauty Products', industry = 'Retail & Trading' WHERE slug = 'sheeba';
UPDATE members SET full_name = 'Sridhar DadhiRao', designation = 'Partner & Principal Consultant', company = 'APT IT Solutions', industry = 'Technology & IT Services' WHERE slug = 'sridhar';
UPDATE members SET full_name = 'Srinivas Bonda', designation = 'Managing Director', company = 'Vaaraahi Realty Consultants Pvt. Ltd.', industry = 'Real Estate & Construction' WHERE slug = 'srinivas-bonda';
UPDATE members SET full_name = 'Suryanarayana Bulusu', designation = 'Founder', company = 'Bulusu Digital Innovation Pvt. Limited', industry = 'Technology & IT Services' WHERE slug = 'surya';

WITH wanted (slug, n) AS (VALUES
  ('sanjay-enishetty', 1),
  ('naresh-kuchi', 2),
  ('sai-prakash-av', 3),
  ('vishnu-murthy', 4),
  ('sridhar', 5),
  ('manjusha', 6),
  ('jayalakshmi', 7),
  ('abhinav-reddy-gotham', 8),
  ('amarnath-reddy', 9),
  ('anjani-singh', 10),
  ('aditya-sainath-kakunanu', 11),
  ('b-swathi', 12),
  ('bala-hema-sunder-chavali', 13),
  ('chandrakanth-shivarathri', 14),
  ('deepak-bhattad', 15),
  ('rajaram', 16),
  ('rohit-kumar-tirunagari', 17),
  ('suresh-kumar', 18),
  ('gundra-santosh-kumar', 19),
  ('keerthi', 20),
  ('kvrk-varma', 21),
  ('madhulika', 22),
  ('shiva-pradeep', 23),
  ('manikanta', 24),
  ('namburi-venkat-raju', 25),
  ('nvs-murthy', 26),
  ('pandu-chittimalla', 27),
  ('pankaj', 28),
  ('rajasekhar-duggempudi', 29),
  ('raviteja-parinam', 30),
  ('rohit-maila', 31),
  ('sai-kumar', 32),
  ('sheeba', 33),
  ('srinivas-bonda', 34),
  ('srinivas-gandla', 35),
  ('suda-anki-reddy', 36),
  ('sunnam-srikanth', 37),
  ('surya', 38)
),
renumbered AS (
  SELECT m.id,
         COALESCE(w.n, 38 + row_number() OVER (PARTITION BY w.n IS NULL ORDER BY m.sort_order, m.full_name)) AS n
  FROM members m LEFT JOIN wanted w ON w.slug = m.slug
)
UPDATE members m SET sort_order = r.n FROM renumbered r WHERE r.id = m.id;
