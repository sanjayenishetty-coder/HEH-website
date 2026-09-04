import { faqs } from "@/data/faq";
import { site } from "@/data/site";
import { Icon, Section, SectionHeading } from "@/components/ui";

export function FAQ() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <Section id="faq" tone="white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading align="left" eyebrow="Got questions?" title="Frequently asked questions"
            text="Everything you need to know before applying." />
          <div className="rounded-3xl border border-line bg-cream p-6">
            <p className="font-bold text-navy">Still have a question?</p>
            <p className="mt-1 text-sm text-muted">We reply within one business day.</p>
            <div className="mt-4 flex flex-col gap-2">
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold-600"><Icon name="mail" className="h-4 w-4" />{site.email}</a>
              <a href={`https://wa.me/${site.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold-600"><Icon name="whatsapp" className="h-4 w-4" />WhatsApp {site.whatsappDisplay}</a>
            </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="divide-y divide-line rounded-3xl border border-line bg-white">
            {faqs.map((f, i) => (
              <details key={f.question} className="group px-6" open={i === 0}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left font-semibold text-navy">
                  {f.question}
                  <Icon name="chevron" className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-6 leading-relaxed text-ink/80">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
