import { site, stats } from "@/data/site";
import { upcomingEvents, formatEventDate, formatTime } from "@/data/events";
import { ButtonLink, Icon } from "@/components/ui";

export function Hero() {
  const next = upcomingEvents()[0];
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,theme(colors.gold-100),transparent_60%)]" />
      <div className="container-x relative grid items-center gap-14 py-20 lg:grid-cols-12 lg:py-28">
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
            <ButtonLink href="/events" variant="secondary" size="lg">See upcoming sessions</ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-navy-700">
            {["Application-based", "Active business owners only", "Member-led sessions"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-success" />{t}</li>
            ))}
          </ul>
        </div>

        {/* Visual: real data instead of stock photography */}
        <div className="relative lg:col-span-5">
          <div className="relative rounded-[2rem] bg-navy p-6 text-white shadow-lift sm:p-8">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/30 blur-3xl" />
            <p className="eyebrow text-gold">The forum in numbers</p>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <dd className="text-2xl font-extrabold text-gold sm:text-3xl whitespace-nowrap">{s.value}</dd>
                  <dt className="mt-1 text-sm font-semibold text-white">{s.label}</dt>
                </div>
              ))}
            </dl>
            {next && (
              <div className="mt-6 rounded-2xl bg-white p-5 text-navy">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Next session</p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Open for RSVP</span>
                </div>
                <p className="mt-2 text-lg font-bold leading-snug">{next.title}</p>
                <p className="mt-1 text-sm text-muted">{formatEventDate(next.date)} · {formatTime(next.startTime)} · {next.venue}</p>
              </div>
            )}
          </div>
          <div className="absolute -bottom-5 left-6 hidden items-center gap-1 rounded-full bg-white p-1.5 shadow-lift sm:flex">
            {["Learn", "Connect", "Grow"].map((w, i) => (
              <span key={w} className={`rounded-full px-4 py-1.5 text-sm font-bold ${i === 1 ? "bg-gold text-navy" : "bg-navy text-white"}`}>{w}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
