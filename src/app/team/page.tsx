import type { Metadata } from "next";
import Image from "next/image";
import { team } from "@/data/team";
import { site } from "@/data/site";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Core team",
  description: "The leaders behind Hyderabad Entrepreneurs Hub: mentors and operators building a working forum for Hyderabad's business owners.",
  alternates: { canonical: "/team" },
};

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2);

export default function TeamPage() {
  return (
    <>
      <PageHeader eyebrow="Core team" title="The people behind the forum"
        text="Operators and mentors who run HEH day to day, so that every session is worth your morning." />
      <section className="bg-cream py-16 lg:py-20">
        <div className="container-x">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.name} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
                <div className="relative aspect-square bg-navy/5">
                  {m.photo ? (
                    <Image src={m.photo} alt={m.name} fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover" style={{ objectPosition: m.focus ?? "center" }} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-extrabold text-navy/30">{initials(m.name)}</div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-navy">{m.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-gold-600">{m.role}</p>
                  {(m.linkedin || m.email) && (
                    <div className="mt-4 flex gap-2">
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className="rounded-full bg-cream p-2.5 text-navy transition-colors hover:bg-navy hover:text-white"><Icon name="linkedin" className="h-4 w-4" /></a>
                      )}
                      {m.email && (
                        <a href={`mailto:${m.email}`} aria-label={`Email ${m.name}`} className="rounded-full bg-cream p-2.5 text-navy transition-colors hover:bg-navy hover:text-white"><Icon name="mail" className="h-4 w-4" /></a>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-[2rem] bg-navy p-8 text-white sm:p-10 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">Want to help run the forum?</h2>
              <p className="mt-2 max-w-xl text-white/70">We add core team members from within the membership. Join first, contribute, and let&apos;s talk.</p>
            </div>
            <ButtonLink href={site.applyUrl} external size="lg" className="mt-6 lg:mt-0">Apply for membership</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
