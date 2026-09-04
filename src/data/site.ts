/**
 * Global site settings and contact details.
 * Edit this file to change anything that appears site-wide.
 */
export const site = {
  name: "Hyderabad Entrepreneurs Hub",
  shortName: "HEH",
  legalName: "Hyderabad Entrepreneurs Hub Pvt Ltd",
  tagline: "Where entrepreneurs grow — together.",
  description:
    "Hyderabad Entrepreneurs Hub (HEH) is an application-based growth forum for Hyderabad business owners: knowledge sessions led by successful entrepreneurs, structured networking, and real business development.",
  url: "https://entrepreneurhub.in",
  email: "heh@entrepreneurhub.in",
  whatsapp: "+916300799266",
  whatsappDisplay: "+91 63007 99266",
  address: {
    line1: "Plot 115, Ashok Enclave, Netaji Nagar",
    city: "Secunderabad",
    region: "Telangana",
    postalCode: "500062",
    country: "IN",
  },
  applyUrl: "https://forms.gle/nCFCD5x5aGdHeBPk6",
  social: {
    linkedin: "https://www.linkedin.com/in/entrepreneur-hub-hyderabad-a56587356/",
    facebook: "https://www.facebook.com/entrepreneurhubhyderabad/",
  },
  membership: {
    fee: "₹20,000",
    feeNote: "+ GST, per year",
    minRevenue: "₹2 crore",
  },
} as const;

/** Header navigation. The core team page is linked from the footer instead. */
export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/members", label: "Members" },
] as const;

/** Industries strip that scrolls under the hero. */
export const sectors = [
  "Manufacturing",
  "Healthcare",
  "Real Estate",
  "Finance",
  "D2C",
  "Technology",
  "Food & Beverage",
  "Advisory",
  "Travel",
  "Education",
] as const;

export const stats = [
  {
    value: "100+",
    label: "Active members",
    detail: "Verified, full-time business owners",
  },
  {
    value: "₹500+ Cr",
    label: "Collective revenue",
    detail: "Combined annual turnover of member businesses",
  },
  {
    value: "15+",
    label: "Industry sectors",
    detail: "From manufacturing to D2C to healthcare",
  },
  {
    value: "50+",
    label: "Collaborations",
    detail: "Referrals, vendor deals and partnerships",
  },
] as const;
