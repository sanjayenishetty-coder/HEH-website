import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, text, children }: { eyebrow: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_20rem_at_90%_-20%,theme(colors.gold-100),transparent_60%)]" />
      <div className="container-x relative flex flex-col gap-6 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-balance mt-3 text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">{title}</h1>
          {text && <p className="mt-4 text-lg leading-relaxed text-muted">{text}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </section>
  );
}
