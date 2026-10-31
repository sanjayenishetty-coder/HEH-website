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

const statuses = {
  applications: ['received', 'under_review', 'interaction', 'approved', 'rejected'],
  enquiries: ['received', 'in_progress', 'closed'],
  registrations: ['confirmed', 'cancelled', 'attended'],
};

module.exports = { industries, turnoverRanges, enquiryTypes, storyCategories, eventCategories, statuses };
