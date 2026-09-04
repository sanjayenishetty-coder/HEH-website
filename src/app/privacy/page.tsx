import type { Metadata } from "next";
import { privacyMeta, privacySections } from "@/data/privacy";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Hyderabad Entrepreneurs Hub collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" text={`Last updated ${privacyMeta.lastUpdated} · Effective ${privacyMeta.effectiveDate}`} />
      <section className="bg-cream py-16 lg:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <nav aria-label="Policy contents" className="lg:col-span-4">
            <div className="rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-24">
              <p className="eyebrow">Contents</p>
              <ol className="mt-4 space-y-2 text-sm">
                {privacySections.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="text-navy-700 transition-colors hover:text-gold-600">{s.title}</a></li>
                ))}
              </ol>
            </div>
          </nav>
          <article className="prose-policy lg:col-span-8">
            {privacySections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 rounded-3xl border border-line bg-white p-7 sm:p-9 [&+&]:mt-6">
                <h2 className="text-2xl font-extrabold text-navy">{s.title}</h2>
                {s.blocks.map((b, i) => (
                  <div key={i} className="mt-4">
                    {b.subtitle && <h3 className="font-bold text-navy">{b.subtitle}</h3>}
                    {b.text && <p className="mt-1 leading-relaxed text-ink/85">{b.text}</p>}
                    {b.items && (
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink/85">
                        {b.items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
