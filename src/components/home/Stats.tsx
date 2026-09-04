import { stats } from "@/data/site";
import { Section, SectionHeading } from "@/components/ui";

export function Stats() {
  return (
    <Section tone="dark">
      <SectionHeading eyebrow="The forum in numbers" title="A community that shows up" dark
        text="Verified business owners, working sessions every month, and collaboration you can measure." />
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
            <dd className="text-5xl font-extrabold text-gold">{s.value}</dd>
            <dt className="mt-3 text-lg font-bold">{s.label}</dt>
            <p className="mt-1 text-sm text-white/65">{s.detail}</p>
          </div>
        ))}
      </dl>
    </Section>
  );
}
