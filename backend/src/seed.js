// Sample content taken from the design mock-ups so every page has something to show.
// Only inserts into tables that are empty, so it is safe to re-run. Replace via /admin.
const { pool } = require('./db');

const agenda = [
  { time: '10:00 AM', title: 'Welcome & Introduction', details: 'Registration, welcome note and member introductions.' },
  { time: '10:30 AM', title: 'Main Session', details: 'Featured talk followed by an open Q&A.' },
  { time: '11:45 AM', title: 'Networking', details: 'Structured one-to-one and small-group networking.' },
  { time: '12:45 PM', title: 'Closing', details: 'Key takeaways and announcements.' },
];
const takeaways = [
  { title: 'Valuable Insights', text: 'Practical strategies to scale SME businesses.' },
  { title: 'Meaningful Conversations', text: 'Open discussions with industry leaders.' },
  { title: 'New Connections', text: 'Opportunities for collaboration and growth.' },
  { title: 'Inspiring Journey', text: 'Real-world experiences from the featured entrepreneur.' },
];

const events = [
  {
    slug: 'november-spotlight-2026', title: 'November Spotlight', category: 'spotlight', event_date: '2026-11-14',
    start_time: '10:00', end_time: '13:00', venue_name: 'To Be Announced', venue_address: 'Hyderabad, Telangana',
    short_description: 'An evening of conversations on building scalable SME businesses in Hyderabad.',
    description: 'The November HEH Spotlight brings together entrepreneurs, business owners and industry leaders for an insightful session on building a stronger SME ecosystem. Expect real-world experiences, practical strategies and structured networking with fellow members.',
    agenda, speaker: { name: 'Speaker Name', designation: 'Founder & CEO', company: 'Company Name', bio: 'Speaker introduction will be updated here from the admin.', photo_url: '' },
  },
  {
    slug: 'growth-workshop-december-2026', title: 'Growth Workshop: Finance for Founders', category: 'workshop', event_date: '2026-12-05',
    start_time: '15:00', end_time: '18:00', venue_name: 'T-Hub', venue_address: 'Knowledge City, Raidurg, Hyderabad',
    short_description: 'A hands-on workshop on cash flow, funding options and financial planning for SMEs.',
    description: 'A practical, small-group workshop covering cash-flow management, working capital, funding options and how to prepare your business for growth capital.',
    agenda: agenda.slice(0, 3),
  },
  {
    slug: 'innovating-for-a-stronger-sme-ecosystem', title: 'Innovating for a Stronger SME Ecosystem', category: 'spotlight',
    event_date: '2026-10-24', start_time: '10:00', end_time: '13:00', venue_name: 'Zythum, Hyderabad', venue_address: 'Hyderabad, Telangana',
    short_description: 'Building a stronger SME ecosystem through collaboration.',
    summary: 'The October HEH Spotlight brought together entrepreneurs, business owners and industry leaders for an insightful session on building a stronger SME ecosystem. The session focused on real-world experiences, practical strategies and collaboration opportunities to support business growth in the Hyderabad region.',
    featured: { name: 'John Doe', designation: 'Founder & CEO', company: 'ABC Technologies Pvt. Ltd.', topic: 'From Ideas to Impact: Building Scalable Businesses', photo_url: '' },
    takeaways, registration_open: false,
  },
  { slug: 'digital-marketing-workshop', title: 'Digital Marketing for SMEs', category: 'workshop', event_date: '2026-10-10', venue_name: 'Hyderabad', short_description: 'Hands-on session on digital marketing for small businesses.', takeaways, registration_open: false },
  { slug: 'september-spotlight-2026', title: 'September Spotlight', category: 'spotlight', event_date: '2026-09-25', venue_name: 'Hyderabad', short_description: 'Founders share their growth journeys.', takeaways, registration_open: false },
  { slug: 'gst-compliance-workshop', title: 'GST & Compliance Made Simple', category: 'workshop', event_date: '2026-09-12', venue_name: 'Hyderabad', short_description: 'Practical compliance guidance for SME owners.', takeaways, registration_open: false },
];

const offers = [
  { title: 'Custom Software Development', text: 'Tailored software solutions for business-specific needs.' },
  { title: 'Cloud Solutions', text: 'Secure and scalable cloud infrastructure and migration services.' },
  { title: 'IT Consulting', text: 'Strategic technology advisory to improve business efficiency and growth.' },
];

const members = [
  {
    slug: 'rahul-sharma', member_code: 'HEH-M-0001', full_name: 'Rahul Sharma', designation: 'Founder & CEO', company: 'ABC Technologies Pvt. Ltd.',
    industry: 'Technology & IT Services', company_tagline: 'Digital Solutions for a Smarter Tomorrow',
    bio: 'Rahul Sharma is a technology entrepreneur with over 15 years of experience in building digital solutions for businesses. He is passionate about using technology to solve real-world challenges and help organisations improve efficiency and growth. Through ABC Technologies, he works with clients across various industries, providing innovative and scalable IT solutions.',
    experience: '15+ years in technology and business solutions', expertise: 'Digital transformation, software solutions, business automation', passion: 'Helping businesses grow with practical technology solutions',
    company_about: 'ABC Technologies provides end-to-end IT solutions to help businesses improve efficiency, streamline operations and achieve digital growth. We work with organisations across industries, delivering reliable and scalable technology solutions.',
    products_services: 'Custom Software Development, Web & Mobile Applications, Cloud Solutions, IT Consulting, Support & Maintenance.',
    website: 'https://www.example.com', offers,
    opportunities: ['Partner with businesses looking for digital transformation', 'Collaborate on technology implementation projects', 'Work with companies seeking custom software solutions', 'Explore opportunities in IT consulting and cloud services'],
    collaboration_interests: ['Manufacturing and industrial businesses', 'Healthcare and hospital networks', 'Educational institutions', 'Real estate and construction companies', 'SMEs looking to improve operational efficiency'],
    sort_order: 1,
  },
  { slug: 'priya-reddy', member_code: 'HEH-M-0002', full_name: 'Priya Reddy', designation: 'Managing Director', company: 'Reddy Constructions', industry: 'Real Estate & Construction', sort_order: 2,
    bio: 'Priya Reddy leads Reddy Constructions, delivering residential and commercial projects across Hyderabad.' },
  { slug: 'sandeep-varma', member_code: 'HEH-M-0003', full_name: 'Sandeep Varma', designation: 'Director', company: 'Varma Healthcare', industry: 'Healthcare', sort_order: 3,
    bio: 'Sandeep Varma runs a network of diagnostic and healthcare services focused on quality, affordable care.' },
  { slug: 'anita-desai', member_code: 'HEH-M-0004', full_name: 'Anita Desai', designation: 'Founder', company: 'Desai Financial Services', industry: 'Financial & Professional Services', sort_order: 4,
    bio: 'Anita Desai advises SMEs on financial planning, compliance and growth capital.' },
];

const stories = [
  {
    slug: 'from-network-to-new-opportunity', title: 'From Network to New Opportunity', category: 'Business Collaboration', featured: true, published_on: '2026-10-28',
    summary: 'Two HEH members collaborated to deliver a comprehensive technology solution, combining their expertise and resources to create new business opportunities.',
    body: 'Two HEH members met at a Spotlight session and discovered that their services complemented each other.\n\nOver the following weeks they combined their expertise and resources to deliver a comprehensive technology solution for a shared client, opening new business opportunities for both companies.',
    members_involved: ['Member A', 'Member B'], companies: ['Company A', 'Company B'], business_category: 'Technology & IT Services',
  },
  { slug: 'technology-partnership-drives-growth', title: 'Technology Partnership Drives Growth', category: 'Business Collaboration', published_on: '2026-10-10',
    summary: 'A meaningful collaboration between two HEH members to deliver an integrated solution for their clients.', body: 'A meaningful collaboration between two HEH members to deliver an integrated solution for their clients.' },
  { slug: 'a-referral-that-created-new-opportunities', title: 'A Referral That Created New Opportunities', category: 'Business Referral', published_on: '2026-09-22',
    summary: 'A simple introduction through HEH led to a valuable business opportunity and a long-term partnership.', body: 'A simple introduction through HEH led to a valuable business opportunity and a long-term partnership.' },
  { slug: 'scaling-through-strategic-connections', title: 'Scaling Through Strategic Connections', category: 'Growth Story', published_on: '2026-09-05',
    summary: 'How an HEH member expanded into new markets with the support of the HEH community.', body: 'How an HEH member expanded into new markets with the support of the HEH community.' },
  { slug: 'from-conversation-to-business', title: 'From Conversation to Business', category: 'New Business Opportunity', published_on: '2026-08-20',
    summary: 'A meaningful discussion at an HEH event led to a new business opportunity.', body: 'A meaningful discussion at an HEH event led to a new business opportunity.' },
  { slug: 'industry-insights-creates-impact', title: 'Industry Insights Creates Impact', category: 'Knowledge Sharing', published_on: '2026-08-02',
    summary: 'A session by an HEH member provided valuable insights for the community.', body: 'A session by an HEH member provided valuable insights for the community.' },
];

const JSON_COLS = new Set(['agenda', 'speaker', 'featured', 'takeaways', 'photos', 'offers', 'opportunities', 'collaboration_interests', 'members_involved', 'companies']);

async function seed(table, rows) {
  const { rows: [{ n }] } = await pool.query(`SELECT count(*)::int AS n FROM ${table}`);
  if (n > 0) return console.log(`${table}: already has ${n} rows, skipped`);
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map((c) => (JSON_COLS.has(c) ? JSON.stringify(row[c]) : row[c]));
    await pool.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`, vals);
  }
  console.log(`${table}: inserted ${rows.length} rows`);
}

(async () => {
  await seed('events', events);
  await seed('members', members);
  await seed('stories', stories);
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
