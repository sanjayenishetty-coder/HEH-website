// Option lists shared by the API validation and the website forms (served at GET /api/meta).

const industries = [
  'Technology & IT Services',
  'Manufacturing',
  'Real Estate & Construction',
  'Healthcare',
  'Financial & Professional Services',
  'Retail & Trading',
  'Education & Training',
  'Automobile & Allied Services',
  'Hospitality & Food Services',
  'Other Services',
];

const turnoverRanges = [
  'Below ₹50 Lakh',
  '₹50 Lakh – ₹2 Crore',
  '₹2 Crore – ₹10 Crore',
  '₹10 Crore – ₹50 Crore',
  'Above ₹50 Crore',
  'Prefer not to say',
];

const enquiryTypes = [
  'Membership',
  'Events',
  'Business Collaboration',
  'Partnership / Sponsorship',
  'General Enquiry',
];

const storyCategories = [
  'Business Collaboration',
  'Business Referral',
  'Growth Story',
  'Community Impact',
  'New Business Opportunity',
  'Knowledge Sharing',
];

const eventCategories = ['spotlight', 'workshop'];

// Groups on the "About HEH > Members" page, in display order: [key, label]
const memberTypes = [
  ['core_team', 'Executive Council'], // key kept from when this group was called Core Team
  ['working_committee', 'Working Committee'],
  ['advisory_board', 'Advisory Board'],
];

const statuses = {
  applications: ['received', 'under_review', 'interaction', 'approved', 'rejected'],
  enquiries: ['received', 'in_progress', 'closed'],
  registrations: ['confirmed', 'cancelled', 'attended'],
};

module.exports = { industries, turnoverRanges, enquiryTypes, storyCategories, eventCategories, memberTypes, statuses };
