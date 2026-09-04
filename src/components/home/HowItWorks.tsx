import { applicationSteps, eligibility } from "@/data/benefits";
import { site } from "@/data/site";
import { ButtonLink, Icon, Section, SectionHeading } from "@/components/ui";

export function HowItWorks() {
  return (
    <Section id="join" tone="white">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <SectionHeading align="left" eyebrow="Who can join" title="Deliberately selective, so the room stays useful"
            text="We keep the bar high so every conversation is between people running real businesses." />
          <ul className="space-y-4">
            {eligibility.map((e) => (
              <li key={e.title} className="flex gap-4 rounded-2xl border border-line bg-cream p-5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-gold"><Icon name="shield" className="h-4 w-4" /></span>
                <div>
                  <h3 className="font-bold text-navy">{e.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{e.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[2rem] bg-navy p-8 text-white sm:p-10">
            <p className="eyebrow text-gold">How it works</p>
            <h3 className="mt-3 text-2xl font-extrabold sm:text-3xl">Three steps. About a week.</h3>
            <ol className="mt-8 space-y-6">
              {applicationSteps.map((s, i) => (
                <li key={s.title} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-base font-extrabold text-navy">{i + 1}</span>
                  <div>
                    <h4 className="text-lg font-bold">{s.title}</h4>
                    <p className="mt-1 text-white/70">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={site.applyUrl} external size="lg">Start your application</ButtonLink>
              <p className="text-sm text-white/60">Shortlisted applicants get a guest pass to one session.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
