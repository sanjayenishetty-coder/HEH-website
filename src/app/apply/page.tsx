import type { Metadata } from "next";
import { applicationSteps, eligibility } from "@/data/benefits";
import { site } from "@/data/site";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Apply for membership",
  description: `Apply to join Hyderabad Entrepreneurs Hub. For founders, partners and directors running ventures with ${site.membership.minRevenue}+ annual revenue. Decision within 5–7 business days.`,
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return (
    <>
      <PageHeader eyebrow="Apply" title="Apply for membership"
        text="Five minutes to apply. A conversation with HEH leadership. A decision within a week.">
        <ButtonLink href={site.applyUrl} external size="lg">Open the application form <Icon name="arrowRight" className="h-5 w-5" /></ButtonLink>
      </PageHeader>
      <section className="bg-cream py-16 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-8">
            <h2 className="text-xl font-extrabold text-navy">Before you apply, check you fit</h2>
            <ul className="mt-5 space-y-4">
              {eligibility.map((e) => (
                <li key={e.title} className="flex gap-3"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-success" /><div><p className="font-semibold text-navy">{e.title}</p><p className="text-sm text-muted">{e.detail}</p></div></li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-navy p-8 text-white">
            <h2 className="text-xl font-extrabold">What happens next</h2>
            <ol className="mt-5 space-y-5">
              {applicationSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-extrabold text-navy">{i + 1}</span><div><p className="font-semibold">{s.title}</p><p className="text-sm text-white/70">{s.detail}</p></div></li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-white/60">Membership is {site.membership.fee} {site.membership.feeNote}, payable only after approval.</p>
            <ButtonLink href={site.applyUrl} external size="lg" className="mt-6 w-full">Start the application</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
