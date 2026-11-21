-- 0002: HEH members (from the member list shared on 31 Oct 2026), replacing the sample members from seed.js.
-- Industries were assigned from the company names; adjust in /admin/. Core team photos come from entrepreneurhub.in/team.

DELETE FROM members WHERE slug IN ('rahul-sharma', 'priya-reddy', 'sandeep-varma', 'anita-desai')
  AND member_code IN ('HEH-M-0001', 'HEH-M-0002', 'HEH-M-0003', 'HEH-M-0004');

INSERT INTO members (slug, member_code, full_name, designation, company, industry, photo_url, sort_order) VALUES
  ('sanjay-enishetty', 'HEH-M-0001', 'Sanjay Enishetty', 'Chief Mentor & Advisor', 'Hyderabad Entrepreneurs Hub (HEH)', 'Other Services', '/assets/team/sanjay-enishetty.jpg', 1),
  ('naresh-kuchi', 'HEH-M-0002', 'Naresh Kuchi', 'Managing Director', 'Hyderabad Entrepreneurs Hub (HEH)', 'Other Services', '/assets/team/naresh-kuchi.jpg', 2),
  ('srinivas-bonda', 'HEH-M-0003', 'Srinivas Bonda', 'Founder', 'Vaaraahi Realty Consultants Pvt. Ltd.', 'Real Estate & Construction', '', 3),
  ('jayalakshmi', 'HEH-M-0004', 'Jayalakshmi', 'Director', 'Raadhya Infrastructure Pvt. Ltd.', 'Real Estate & Construction', '/assets/team/jaya-lakshmi.jpg', 4),
  ('manjusha', 'HEH-M-0005', 'Manjusha', 'Yoga & Wellness Coach', '', 'Healthcare', '/assets/team/manjusha-m.jpg', 5),
  ('vishnu-murthy', 'HEH-M-0006', 'Vishnu Murthy', 'CEO', 'Visu Technologies Pvt. Ltd.', 'Technology & IT Services', '', 6),
  ('madhavi-rao', 'HEH-M-0007', 'Madhavi Rao', 'Founder & CEO', 'MR Herbals', 'Healthcare', '', 7),
  ('madhulika', 'HEH-M-0008', 'Madhulika', 'Managing Director', 'RM Global Services', 'Other Services', '', 8),
  ('pankaj', 'HEH-M-0009', 'Pankaj', 'Founder', 'Camphor Info Pvt. Ltd.', 'Technology & IT Services', '', 9),
  ('gloria', 'HEH-M-0010', 'Gloria', 'Director', 'Rock T-shirts & Corporate Gifting Services', 'Retail & Trading', '', 10),
  ('sai-chandra-rao', 'HEH-M-0011', 'Sai Chandra Rao', 'Founder', 'Arytribe Alchemy Private Limited', 'Other Services', '', 11),
  ('sai-prakash-av', 'HEH-M-0012', 'Sai Prakash AV', 'Founder & CEO', 'Prakstudio', 'Other Services', '/assets/team/sai-prakash.jpg', 12),
  ('sridhar', 'HEH-M-0013', 'Sridhar', 'COO', 'APIT Technologies', 'Technology & IT Services', '/assets/team/dvp-sridhar.jpg', 13),
  ('sheeba', 'HEH-M-0014', 'Sheeba', '', 'Radiance Aesthetic Beauty Products', 'Retail & Trading', '', 14),
  ('sai-kumar', 'HEH-M-0015', 'Sai Kumar', 'Founder', 'Sri Sai Photography Service', 'Other Services', '', 15),
  ('akhil', 'HEH-M-0016', 'Akhil', '', 'Bulusu Digital Innovation Pvt. Limited', 'Technology & IT Services', '', 16),
  ('surya', 'HEH-M-0017', 'Surya', 'Founder & CEO', 'Bulusu Digital Innovation Pvt. Limited', 'Technology & IT Services', '', 17),
  ('varun-sainath-family', 'HEH-M-0018', 'Varun Sainath & Family', 'Managing Partner', 'Kridha Architects & Interior Design', 'Real Estate & Construction', '', 18),
  ('amarnath-reddy', 'HEH-M-0019', 'Amarnath Reddy', 'Founder', 'Hydparty Rentals', 'Other Services', '', 19),
  ('nvs-murthy', 'HEH-M-0020', 'NVS Murthy', 'Artist', 'Entertainment Services', 'Other Services', '', 20),
  ('niranjan-reddi-rommaala', 'HEH-M-0021', 'Niranjan Reddi Rommaala', 'Founder', 'Yanaar Infra Pvt. Ltd.', 'Real Estate & Construction', '', 21),
  ('namburi-venkat-raju', 'HEH-M-0022', 'Namburi Venkat Raju', 'Founder', 'Journey with NVR', 'Other Services', '', 22),
  ('manikanta', 'HEH-M-0023', 'Manikanta', 'Chartered Accountant', '', 'Financial & Professional Services', '', 23),
  ('shiva-pradeep', 'HEH-M-0024', 'Shiva Pradeep', 'CEO', 'Megha IT Recruitment Services', 'Other Services', '', 24)
ON CONFLICT (slug) DO NOTHING;
