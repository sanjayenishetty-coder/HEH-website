/** Frequently asked questions. Rendered on the home page and reused as FAQ schema for search engines. */
export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: "Who can join HEH?",
    answer:
      "HEH is for established entrepreneurs whose ventures have crossed ₹2 crore in annual revenue. Members must be founders, partners or directors actively running the business. We welcome every industry; the selective admission process is what keeps the room serious and useful.",
  },
  {
    question: "How is HEH different from other networking groups?",
    answer:
      "Three things. Strict eligibility, so you only meet established business owners. Structure, with curated introductions, sector roundtables and peer advisory circles instead of open mixers. And a Hyderabad focus that creates deep local market insight and collaboration you will not find in national or generic groups. Members have collectively generated ₹500+ crore in business growth.",
  },
  {
    question: "What events and programmes does HEH run?",
    answer:
      "Two sessions a month: a learning workshop and a business networking session. On top of that we run peer advisory boards, one-on-one mentorship matching, industry visits and exclusive investor connect sessions. Events are scheduled in advance and members get priority registration and guest privileges.",
  },
  {
    question: "What is the application process?",
    answer:
      "Three steps. Apply online with your business details and revenue information. Shortlisted candidates are invited for a personal interview with HEH leadership. Approved applicants receive immediate access to member benefits. The whole process typically takes 5–7 business days.",
  },
  {
    question: "Can I attend an event before joining?",
    answer:
      "Yes. Prospective members can attend one session as a guest, either a workshop or a networking session, to experience the community first-hand. Guest attendance requires a referral from an existing member or a core team member.",
  },
  {
    question: "My revenue is below ₹2 crore. Can I still apply?",
    answer:
      "Yes. The HEH board considers exceptions based on your business potential and your interaction with the team during the interview.",
  },
  {
    question: "What does membership cost?",
    answer:
      "₹20,000 + GST per year. That covers all core events, masterclasses, the member directory, referral system, WhatsApp groups, industry visits and member-only resources.",
  },
];
