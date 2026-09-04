import { membershipIncludes } from "@/data/benefits";
import { site } from "@/data/site";
import { ButtonLink, Icon, Section, SectionHeading } from "@/components/ui";

export function Membership() {
  return (
    <Section id="membership" tone="light">
      <SectionHeading eyebrow="Membership" title="One plan. Everything included."
        text="Annual membership for verified business owners. No tiers, no upsells." />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-lift lg:grid-cols-5">
        <div className="bg-navy p-8 text-white sm:p-10 lg:col-span-2">
          <p className="eyebrow text-gold">HEH membership</p>
          <p className="mt-6 text-5xl font-extrabold">{site.membership.fee}</p>
          <p className="mt-1 text-white/60">{site.membership.feeNote}</p>
          <ul className="mt-8 space-y-2 text-sm text-white/80">
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-gold" />Verified business owners only</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-gold" />Two working sessions every month</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-gold" />Decision within 5–7 business days</li>
          </ul>
          <ButtonLink href={site.applyUrl} external size="lg" className="mt-10 w-full">Apply to join</ButtonLink>
          <p className="mt-4 text-center text-xs text-white/50">Fees are payable only after approval.</p>
        </div>
        <div className="p-8 sm:p-10 lg:col-span-3">
          <h3 className="text-lg font-bold text-navy">What&apos;s included</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {membershipIncludes.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-ink/85">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" className="h-3 w-3" /></span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-cream p-4 text-sm text-muted">
            Eligibility: ventures with {site.membership.minRevenue}+ annual revenue, run by founders, partners or directors who are actively involved. Exceptions are considered by the HEH board.
          </p>
        </div>
      </div>
    </Section>
  );
}
