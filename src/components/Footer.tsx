import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { Icon } from "@/components/ui";

const explore = [
  { href: "/events", label: "Events & calendar" },
  { href: "/members", label: "Member directory" },
  { href: "/team", label: "Core team" },
  { href: "/#membership", label: "Membership" },
  { href: "/#faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy policy" },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <Link href="/" className="inline-flex rounded-xl bg-white p-3" aria-label={`${site.name} home`}>
            <Image src="/brand/logo.png" alt={site.name} width={448} height={136} className="h-10 w-auto" />
          </Link>
          <p className="mt-6 max-w-md leading-relaxed text-white/70">
            A growth forum for Hyderabad&apos;s business owners: knowledge sessions led by successful entrepreneurs, structured networking and real business development. No stage lights. No gurus. A working forum.
          </p>
          <div className="mt-6 flex gap-3">
            <a href={site.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="HEH on LinkedIn" className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-gold hover:text-navy">
              <Icon name="linkedin" />
            </a>
            <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="HEH on Facebook" className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-gold hover:text-navy">
              <Icon name="facebook" />
            </a>
            <a href={`https://wa.me/${site.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer" aria-label="HEH on WhatsApp" className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-gold hover:text-navy">
              <Icon name="whatsapp" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="eyebrow text-gold">Explore</h3>
          <ul className="mt-5 space-y-3">
            {explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/75 transition-colors hover:text-gold">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h3 className="eyebrow text-gold">Contact</h3>
          <ul className="mt-5 space-y-4 text-white/75">
            <li className="flex gap-3">
              <Icon name="building" className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <span>{site.legalName}<br />{site.address.line1},<br />{site.address.city}, {site.address.region} {site.address.postalCode}</span>
            </li>
            <li className="flex gap-3">
              <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-gold">{site.email}</a>
            </li>
            <li className="flex gap-3">
              <Icon name="whatsapp" className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <a href={`https://wa.me/${site.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold">{site.whatsappDisplay}</a>
            </li>
          </ul>
          <a href={site.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-white">
            Apply for membership <Icon name="arrowRight" className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</p>
          <p>Hyderabad, Telangana, India</p>
        </div>
      </div>
    </footer>
  );
}
