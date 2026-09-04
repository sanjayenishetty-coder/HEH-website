/** Privacy policy content. Each section renders as a heading with paragraphs and bullet lists. */
export const privacyMeta = { lastUpdated: "20 December 2024", effectiveDate: "20 December 2024" };

export interface PolicyBlock {
  text?: string;
  items?: string[];
  subtitle?: string;
}
export interface PolicySection {
  id: string;
  title: string;
  blocks: PolicyBlock[];
}

export const privacySections: PolicySection[] = [
  {
    id: "introduction",
    title: "Introduction",
    blocks: [
      { text: 'At Hyderabad Entrepreneurs Hub ("HEH", "we", "us" or "our") we are committed to protecting your privacy and the security of your personal information. This policy explains how we collect, use, disclose and safeguard your information when you visit entrepreneurhub.in, use our services or engage with our community.' },
      { text: "By accessing or using our website and services you acknowledge that you have read and understood this policy. We may update it from time to time; the \"Last updated\" date at the top reflects the current version, and continued use after a change indicates acceptance." },
    ],
  },
  {
    id: "information-we-collect",
    title: "1. Information we collect",
    blocks: [
      { subtitle: "Information you provide", text: "When you apply for membership, create an account, contact us or take part in the community, you may provide:" },
      { items: ["Full name, email address and phone number", "LinkedIn profile URL, current role and company or venture name", "Industry sector, annual revenue stage and professional goals", "A brief introduction and how you heard about HEH", "Profile information such as bio, photo and company description", "Event registration details and communication preferences", "Payment information, processed securely by third-party payment processors", "Forum posts, event feedback, survey responses and collaboration interests"] },
      { subtitle: "Information collected automatically", text: "When you use the website we may collect device and usage information such as IP address, browser and operating system, device type, pages visited, time spent, referring URLs and click patterns. We use cookies and similar technologies to remember preferences, understand usage and improve the site. You can control cookies through your browser settings." },
      { subtitle: "Information from third parties", items: ["Publicly available professional information, including LinkedIn profile details you share", "Transaction confirmations and payment status from payment processors (we never store full card details)", "Referral information from HEH members, event partners and collaborators", "Company details from public databases"] },
    ],
  },
  {
    id: "how-we-use",
    title: "2. How we use your information",
    blocks: [
      { items: ["Process and evaluate membership applications and verify eligibility", "Create and manage member accounts and the member directory", "Organise events, workshops, mentorship matching and business opportunities", "Send membership notices, event invitations, newsletters and, with consent, marketing communications", "Analyse usage to improve and personalise our services and develop new programmes", "Process payments, maintain records and run internal operations", "Comply with legal obligations, enforce our policies and protect against fraud or misuse"] },
    ],
  },
  {
    id: "how-we-share",
    title: "3. How we share your information",
    blocks: [
      { text: "We do not sell, rent or trade your personal information to third parties for their marketing purposes. We may share information in these circumstances:" },
      { subtitle: "Within the HEH community", text: "With your consent, your name, photo, company, role, industry, business description, LinkedIn profile and contact preferences appear in a member directory visible only to verified members. Content you post in community spaces is visible to other members." },
      { subtitle: "Service providers", text: "Trusted providers who perform functions on our behalf, including payment gateways, email and newsletter tools, cloud storage, analytics, event registration platforms, messaging tools and CRM systems. They may access personal information only as needed for those functions and must keep it confidential." },
      { subtitle: "Event partners and sponsors", text: "With your explicit consent we may share limited information (name, company, email) with speakers, facilitators, sponsors of events you attend and partners offering member benefits. You can opt out for specific events during registration." },
      { subtitle: "Business transfers and legal requirements", text: "If HEH is involved in a merger, acquisition or sale of assets, your information may be transferred as part of that transaction and we will notify you beforehand. We may also disclose information when required by law, legal process or regulators, or to protect the rights, property or safety of HEH, our members or the public." },
    ],
  },
  {
    id: "your-rights",
    title: "4. Your privacy rights and choices",
    blocks: [
      { items: ["Access: request a copy of the personal information we hold about you", "Correction: update inaccurate information via your account or by contacting us", "Portability: receive your information in a structured, machine-readable format", "Deletion: request deletion, subject to legal and legitimate business exceptions", "Opt out: unsubscribe from newsletters, control your directory visibility and manage cookies", "Objection and restriction: object to direct marketing or ask us to restrict processing in certain circumstances"] },
      { text: "Deleting your account removes you from the member directory, cancels your membership and deletes your profile. Some information may be retained where the law or a legitimate business purpose requires it." },
    ],
  },
  {
    id: "data-security",
    title: "5. Data security",
    blocks: [
      { text: "We use appropriate technical and organisational measures, including encryption in transit (SSL/TLS) and at rest for sensitive data, access controls, regular security reviews, PCI DSS-compliant payment processing and regular backups. No method of transmission or storage is completely secure, so we cannot guarantee absolute security." },
      { text: "Please keep your password confidential, log out of shared devices and report any unauthorised access immediately." },
    ],
  },
  {
    id: "data-retention",
    title: "6. Data retention",
    blocks: [
      { text: "We keep personal information for as long as needed to provide our services, meet legal obligations, resolve disputes and enforce our agreements. Typical retention periods:" },
      { items: ["Active members: the duration of membership plus two years", "Former members: up to five years for business and legal purposes", "Unsuccessful applications: one year", "Financial records: seven years, as required by law", "Marketing data: until you opt out or after three years of inactivity", "Website analytics: typically 26 months"] },
    ],
  },
  {
    id: "childrens-privacy",
    title: "7. Children's privacy",
    blocks: [
      { text: "HEH's services are intended for adults aged 18 and over. We do not knowingly collect personal information from children. If you believe we have done so, contact us and we will delete it promptly." },
    ],
  },
  {
    id: "international-transfers",
    title: "8. International data transfers",
    blocks: [
      { text: "Your information may be processed in countries other than India, some of which may not offer the same level of data protection. Where we transfer information internationally we put appropriate safeguards in place, such as standard contractual clauses." },
    ],
  },
  {
    id: "third-party-links",
    title: "9. Third-party links",
    blocks: [
      { text: "Our website may link to third-party sites and services, including LinkedIn, Google Maps, payment gateways, event platforms and analytics providers. This policy does not apply to them and we are not responsible for their privacy practices. Please review their policies." },
    ],
  },
  {
    id: "updates",
    title: "10. Updates to this policy",
    blocks: [
      { text: "We may update this policy to reflect changes in our practices, legal requirements or new services. We will update the \"Last updated\" date, and for material changes we will email you and post a notice on the website. Continued use after the effective date constitutes acceptance." },
    ],
  },
  {
    id: "contact",
    title: "11. Contact us",
    blocks: [
      { text: "For questions, concerns or requests about this policy or our privacy practices, contact the HEH privacy team:" },
      { items: ["Email: privacy@entrepreneurhub.in (general enquiries: heh@entrepreneurhub.in)", "WhatsApp: +91 63007 99266", "Address: Hyderabad Entrepreneurs Hub Pvt Ltd, Plot 115, Ashok Enclave, Netaji Nagar, Secunderabad, Telangana 500062, India", "Office hours: Monday to Friday, 9:00 AM to 6:00 PM IST"] },
      { text: "We aim to respond to privacy-related enquiries within five business days. If you believe we have not addressed your concern adequately, you have the right to lodge a complaint with the appropriate data protection authority in India." },
    ],
  },
  {
    id: "consent",
    title: "12. Consent",
    blocks: [
      { text: "By using HEH's website and services you consent to the collection, use and sharing of your information as described in this policy, including the use of cookies and, where applicable, international transfers. You can withdraw consent at any time by updating your account settings, contacting us or deleting your account. Withdrawal does not affect processing that took place before it." },
    ],
  },
];
