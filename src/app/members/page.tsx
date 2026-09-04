import type { Metadata } from "next";
import { sectors, site } from "@/data/site";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Member directory",
  description: "The HEH member directory: verified, full-time business owners across Hyderabad. Launching soon for members.",
  alternates: { canonical: "/members" },
};

/* Placeholder tiles — no real or fake people, just the shape of what's coming */
const placeholders = Array.from({ length: 6 }, (_, i) => ({ id: i, sector: sectors[i % sectors.length] }));

export default function MembersPage() {
  return (
    <>
      <PageHeader eyebrow="Member directory" title="Meet the members"
        text="Every profile is a verified, full-time business owner. Members will be able to search by sector and connect over email or WhatsApp." />

      <section className="bg-cream py-16 lg:py-20">
        <div className="container-x relative">
          {/* Blurred preview of the directory layout */}
          <div aria-hidden="true" className="pointer-events-none select-none blur-[6px]">
            <div className="mb-8 flex gap-3">
              <div className="h-12 flex-1 rounded-full bg-white ring-1 ring-line" />
              <div className="h-12 w-40 rounded-full bg-white ring-1 ring-line" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {placeholders.map((p) => (
                <div key={p.id} className="rounded-3xl border border-line bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-navy/10" />
                    <div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded bg-navy/10" /><div className="h-3 w-1/2 rounded bg-navy/10" /></div>
                  </div>
                  <div className="mt-4 flex gap-2"><span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy-700">{p.sector}</span><span className="h-6 w-28 rounded-full bg-emerald-50" /></div>
                  <div className="mt-4 space-y-2"><div className="h-3 rounded bg-navy/10" /><div className="h-3 w-5/6 rounded bg-navy/10" /><div className="h-3 w-3/4 rounded bg-navy/10" /></div>
                  <div className="mt-5 h-10 rounded-full bg-navy/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Lock card */}
          <div className="absolute inset-0 flex items-start justify-center pt-16 sm:items-center sm:pt-0">
            <div className="mx-4 w-full max-w-md rounded-3xl border border-line bg-white/95 p-8 text-center shadow-lift backdrop-blur sm:p-10">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold/20"><Icon name="lock" className="h-7 w-7" /></span>
              <h2 className="mt-5 text-3xl font-extrabold text-navy">Launching soon</h2>
              <p className="mt-3 text-muted">The member directory opens to verified members first. Apply now to be in the first cohort with directory access.</p>
              <div className="mt-6 flex flex-col gap-3">
                <ButtonLink href={site.applyUrl} external size="lg">Apply for membership</ButtonLink>
                <ButtonLink href="/team" variant="secondary" size="lg">Meet the core team instead</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
