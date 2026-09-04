/**
 * Events. Upcoming vs past is computed from `date` automatically, so you only
 * ever add new events at the top of this list. Dates are YYYY-MM-DD, times 24h.
 */
export interface Event {
  slug: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  category: "Networking" | "Workshop" | "Expert Talk" | "Business Development";
  host?: string;
  hostTitle?: string;
  seats?: number;
  image?: string;
  note?: string;
  tags?: string[];
}

export const events: Event[] = [
  {
    slug: "business-development-circle-sept-2026",
    title: "Business Development Circle + Quarterly Review",
    description:
      "Members present quarterly scorecards in circles of eight. Referral exchange, accountability check-ins and next-quarter commitments.",
    date: "2026-09-12",
    startTime: "09:30",
    endTime: "13:30",
    venue: "ISB Hyderabad (AIC Hall)",
    category: "Business Development",
    host: "HEH Leadership",
    seats: 60,
    note: "Exclusively for official members",
    tags: ["Quarterly Review", "Referrals", "Accountability"],
  },
  {
    slug: "member-spotlight-series-may-2026",
    title: "Member Spotlight Series",
    description:
      "A Know Your Member session where members present their business, share their journey and discover collaboration opportunities within the HEH community.",
    date: "2026-05-09",
    startTime: "16:00",
    endTime: "18:00",
    venue: "Cowork Valley, Madhapur",
    category: "Networking",
    host: "Mr. Naveen",
    hostTitle: "Founder, Bujjly · Host",
    image: "/events/member-spotlight-may26.jpg",
    note: "Exclusively for official members",
    tags: ["Member Spotlight", "Know Your Member", "Collaboration"],
  },
  {
    slug: "expert-talk-networking-jan-2026",
    title: "Expert Talk & Networking Session",
    description:
      "Practical lessons from a founder's real journey: what works, what to avoid, and how to build a business that lasts. Followed by structured networking.",
    date: "2026-01-31",
    startTime: "15:30",
    endTime: "17:30",
    venue: "AOF, Kukatpalli",
    category: "Expert Talk",
    host: "Vivek Shukla",
    hostTitle: "Founder & CEO, Nukkad Shops · Guest Speaker",
    image: "/events/vivek-shukla.jpg",
    tags: ["Founder Stories", "Business Insights"],
  },
  {
    slug: "business-model-canvas-workshop-jan-2026",
    title: "Business Model Canvas Workshop",
    description:
      "A hands-on workshop on the Business Model Canvas: how each building block shapes a stronger business, with practical examples and interactive exercises.",
    date: "2026-01-03",
    startTime: "15:30",
    endTime: "17:30",
    venue: "Jubilee Hills International Club",
    category: "Workshop",
    host: "Praveen Dorna",
    hostTitle: "Founder, Founders First Network · Head of Founder Programs, T-Hub",
    image: "/events/bmc-workshop-jan26.jpg",
    tags: ["Business Model", "Workshop"],
  },
  {
    slug: "members-breakfast-meet-dec-2025",
    title: "Members Breakfast Meet",
    description:
      "A productive morning of meaningful networking, business ideation and growth discussions: member introductions, business insights, case studies, the HEH roadmap and open discussion.",
    date: "2025-12-06",
    startTime: "09:00",
    endTime: "11:00",
    venue: "Jubilee Hills International Club",
    category: "Networking",
    host: "Sanjay Enishetty",
    hostTitle: "Chief Mentor & Advisor, HEH",
    image: "/events/breakfast-meet-dec25.jpg",
    tags: ["Breakfast Meet", "Business Insights"],
  },
];

export function isUpcoming(event: Event, now = new Date()): boolean {
  const end = new Date(`${event.date}T${event.endTime}:00+05:30`);
  return end.getTime() >= now.getTime();
}

export function upcomingEvents(now = new Date()): Event[] {
  return events
    .filter((e) => isUpcoming(e, now))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function pastEvents(now = new Date()): Event[] {
  return events
    .filter((e) => !isUpcoming(e, now))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatEventDate(date: string): string {
  return new Date(`${date}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}
