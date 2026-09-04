import Image from "next/image";
import { site } from "@/data/site";
import { ButtonLink, Icon } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,theme(colors.gold-100),transparent_60%)]" />
      <div className="container-x relative grid items-center gap-14 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-50 px-4 py-1.5 text-sm font-semibold text-gold-600">
            <Icon name="spark" className="h-4 w-4" /> A growth forum for Hyderabad&apos;s entrepreneurs
          </span>
          <h1 className="text-balance mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Where entrepreneurs <span className="text-gold">grow</span> — together.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700 sm:text-xl">
            HEH is a community of Hyderabad business owners who show up for each other: knowledge sessions led by successful entrepreneurs and subject-matter experts, structured networking, and real business development. No stage lights. No gurus. A working forum.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={site.applyUrl} external size="lg">Apply for membership <Icon name="arrowRight" className="h-5 w-5" /></ButtonLink>
            <ButtonLink href="/members" variant="secondary" size="lg">Meet the members</ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-navy-700">
            {["Application-based", "Active business owners only", "Member-led sessions"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-success" />{t}</li>
            ))}
          </ul>
        </div>

        {/* Hero photo card. Replace /public/hero.jpg to change the image. */}
        <div className="relative mx-auto w-full max-w-[520px] lg:col-span-5 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] rounded-br-[6rem] bg-navy shadow-lift">
            <Image
              src="/hero.jpg"
              alt="HEH members networking in Hyderabad"
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute right-3 -top-4 rounded-2xl bg-white p-3 shadow-lift sm:-right-5 sm:-top-6">
            <Image src="/brand/icon.png" alt="" width={126} height={126} className="h-9 w-9" />
          </div>
          <div className="absolute -bottom-5 left-4 flex items-center gap-1 rounded-full bg-white p-1.5 shadow-lift sm:left-6">
            {["Learn", "Connect", "Grow"].map((w, i) => (
              <span key={w} className={`rounded-full px-4 py-1.5 text-sm font-bold ${i === 1 ? "bg-gold text-navy" : "bg-navy text-white"}`}>{w}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
