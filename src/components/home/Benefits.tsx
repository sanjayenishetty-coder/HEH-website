import { benefits } from "@/data/benefits";
import { Icon, Section, SectionHeading, type IconName } from "@/components/ui";

const iconFor: IconName[] = ["handshake", "chart", "rocket", "bulb", "spark", "gift"];

export function Benefits() {
  return (
    <Section id="why-heh" tone="light">
      <SectionHeading eyebrow="Why HEH" title="Built for owners who want results, not applause"
        text="Every programme exists to move one of three things: your knowledge, your network or your numbers." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b, i) => (
          <article key={b.title} className="flex flex-col rounded-3xl border border-line bg-white p-7 shadow-card transition-shadow hover:shadow-lift">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-600 ring-1 ring-gold/20">
              <Icon name={iconFor[i % iconFor.length]} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-navy">{b.title}</h3>
            <p className="mt-2 text-muted">{b.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-ink/85">
              {b.points.map((p) => (
                <li key={p} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
