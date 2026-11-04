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
  registrations: ['pending', 'confirmed', 'rejected', 'cancelled', 'attended'],
};

// Admin workflow choices (designs: images/Part2).
const registrationRejectReasons = [
  'Not an active HEH member',
  'Event capacity reached',
  'Does not meet event eligibility',
  'Incomplete or incorrect details',
  'Duplicate registration',
  'Other',
];
const registrationCancelReasons = [
  'Participant request',
  'Event rescheduled',
  'Event cancelled',
  'Duplicate registration',
  'Eligibility issue',
  'Other',
];
const enquiryPriorities = ['low', 'normal', 'high', 'urgent'];
const enquiryChannels = ['Phone Call', 'Email', 'WhatsApp', 'In-person Meeting', 'Video Call'];
const enquiryOutcomes = ['Information Shared', 'Meeting Scheduled', 'Awaiting Enquirer Response', 'Referred to Team', 'Resolved', 'No Response'];
const enquiryCloseReasons = ['Query resolved', 'Information provided', 'Converted to membership application', 'No response from enquirer', 'Duplicate enquiry', 'Not relevant', 'Other'];
const enquiryReopenReasons = ['Enquirer followed up', 'Issue not resolved', 'Closed by mistake', 'New information received', 'Other'];
const storyArchiveReasons = ['Outdated information', 'Requested by member', 'Member no longer active', 'Content under review', 'Replaced by a newer story', 'Other'];
const reportTypes = [
  ['registrations', 'Event Registrations'],
  ['members', 'Members'],
  ['applications', 'Membership Applications'],
  ['events', 'Events'],
  ['enquiries', 'Enquiries'],
];

module.exports = {
  industries, turnoverRanges, enquiryTypes, storyCategories, eventCategories, memberTypes, statuses,
  registrationRejectReasons, registrationCancelReasons, enquiryPriorities, enquiryChannels, enquiryOutcomes,
  enquiryCloseReasons, enquiryReopenReasons, storyArchiveReasons, reportTypes,
};
