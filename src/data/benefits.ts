/** "Why HEH" cards on the home page. */
export interface Benefit {
  title: string;
  description: string;
  points: string[];
}

export const benefits: Benefit[] = [
  {
    title: "Structured networking",
    description:
      "Curated introductions to verified business owners, not a room full of business cards.",
    points: [
      "Two working sessions every month",
      "One-on-one introductions to relevant members",
      "Sector roundtables and mastermind circles",
      "Private WhatsApp groups for quick collaboration",
    ],
  },
  {
    title: "Business growth",
    description:
      "Proven scaling playbooks, expert mentorship and peer accountability that show up in your numbers.",
    points: [
      "Monthly workshops led by successful entrepreneurs",
      "Growth consultations and strategy sessions",
      "Peer advisory groups for accountability",
      "Quarterly scorecard reviews in circles of eight",
    ],
  },
  {
    title: "Capital connect",
    description:
      "Direct routes to investors and honest guidance on when, how and whether to raise.",
    points: [
      "Investor introduction programmes",
      "Funding strategy and pitch-deck reviews",
      "Access to private equity and venture networks",
      "Valuation and exit-strategy guidance",
    ],
  },
  {
    title: "Knowledge exchange",
    description:
      "Insights from operators who have done it, not theory from the stage.",
    points: [
      "Expert speaker series and founder stories",
      "Industry trend reports and market intelligence",
      "Case studies presented by members",
      "Technology and innovation showcases",
    ],
  },
  {
    title: "Go-to-market support",
    description:
      "Launch faster with partners, channels and positioning advice from people who sell every day.",
    points: [
      "GTM workshops and product launch support",
      "Customer acquisition and sales channel development",
      "Positioning and competitive analysis",
      "Cross-promotion with member businesses",
    ],
  },
  {
    title: "Member privileges",
    description:
      "Vetted vendors, partner offers and shared buying power that lower your cost of doing business.",
    points: [
      "Privilege offers from partner brands",
      "Vetted vendor and service-provider referrals",
      "Bulk purchasing power for business services",
      "Member-only resources and templates",
    ],
  },
];

/** What's included in the annual membership. */
export const membershipIncludes = [
  "All core networking events (20+ per year)",
  "Monthly expert masterclasses with industry leaders",
  "Premium member directory with contact access",
  "Business referral system and lead generation",
  "Exclusive WhatsApp groups for instant networking",
  "Annual business growth assessment report",
  "Industry visits and market exposure",
  "Member-only resources and templates",
  "Discounted rates on additional HEH services",
];

/** Eligibility criteria shown in the "Who can join" section. */
export const eligibility = [
  {
    title: "₹2 crore+ annual revenue",
    detail:
      "Your venture has crossed ₹2 crore in annual revenue. Exceptions are considered by the HEH board for high-potential businesses.",
  },
  {
    title: "You run the business",
    detail:
      "You are a founder, partner or director actively involved in day-to-day operations, not an employee or investor.",
  },
  {
    title: "Hyderabad-rooted",
    detail:
      "Your business is based in or operates substantially from Hyderabad, so the network compounds locally.",
  },
  {
    title: "Show up for others",
    detail:
      "You are willing to share openly, make introductions and contribute, not just consume.",
  },
];

export const applicationSteps = [
  {
    title: "Apply online",
    detail: "Share your business details and revenue stage in a five-minute form.",
  },
  {
    title: "Interview",
    detail: "Shortlisted applicants meet HEH leadership for a personal conversation.",
  },
  {
    title: "Welcome",
    detail:
      "Approved members get immediate access to sessions, the directory and member groups. The whole process takes 5–7 business days.",
  },
];
