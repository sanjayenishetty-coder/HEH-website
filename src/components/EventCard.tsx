import Image from "next/image";
import { formatEventDate, formatTime, type Event } from "@/data/events";
import { Icon, Pill } from "@/components/ui";
import { site } from "@/data/site";

// Always render in IST regardless of the server's timezone
const part = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00+05:30`).toLocaleDateString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
const monthShort = (date: string) => part(date, { month: "short" });
const day = (date: string) => part(date, { day: "numeric" });
const year = (date: string) => part(date, { year: "numeric" });

export function EventCard({ event, upcoming }: { event: Event; upcoming: boolean }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
      <div className="grid md:grid-cols-[7rem_1fr]">
        <div className={`flex flex-row items-center justify-center gap-2 px-6 py-4 text-center md:flex-col md:gap-0 md:py-8 ${upcoming ? "bg-navy text-white" : "bg-navy/5 text-navy"}`}>
          <span className="text-4xl font-extrabold leading-none">{day(event.date)}</span>
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">{monthShort(event.date)}</span>
          <span className="text-xs opacity-60">{year(event.date)}</span>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="gold">{event.category}</Pill>
            {upcoming ? <Pill tone="green">Upcoming</Pill> : <Pill tone="neutral">Past event</Pill>}
          </div>
          <h3 className="mt-3 text-xl font-bold text-navy sm:text-2xl">{event.title}</h3>
          {event.host && (
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-navy">{event.host}</span>
              {event.hostTitle && <span> · {event.hostTitle}</span>}
            </p>
          )}
          <p className="mt-3 leading-relaxed text-ink/80">{event.description}</p>

          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-700">
            <div className="flex items-center gap-2"><Icon name="calendar" className="h-4 w-4 text-gold-600" /><dd>{formatEventDate(event.date)}</dd></div>
            <div className="flex items-center gap-2"><Icon name="clock" className="h-4 w-4 text-gold-600" /><dd>{formatTime(event.startTime)} – {formatTime(event.endTime)}</dd></div>
            <div className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 text-gold-600" /><dd>{event.venue}</dd></div>
            {event.seats && upcoming && (
              <div className="flex items-center gap-2"><Icon name="users" className="h-4 w-4 text-gold-600" /><dd>{event.seats} seats</dd></div>
            )}
          </dl>

          {event.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((t) => (
                <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-navy-700">{t}</span>
              ))}
            </div>
          )}

          {upcoming && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <a href={`https://wa.me/${site.whatsapp.replace("+", "")}?text=${encodeURIComponent(`Hi HEH, I would like to reserve a seat for "${event.title}" on ${formatEventDate(event.date)}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-600 hover:text-white">
                Reserve my seat <Icon name="arrowRight" className="h-4 w-4" />
              </a>
              {event.note && <span className="text-sm text-muted">{event.note}</span>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function PastEventTile({ event }: { event: Event }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
      <div className="relative aspect-[4/3] bg-navy/5">
        {event.image ? (
          <Image src={event.image} alt={event.title} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-navy/30"><Icon name="calendar" className="h-10 w-10" /></div>
        )}
        <span className="absolute left-4 top-4"><Pill tone="gold">{event.category}</Pill></span>
      </div>
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{formatEventDate(event.date)} · {event.venue}</p>
        <h3 className="mt-2 text-lg font-bold text-navy">{event.title}</h3>
        {event.host && <p className="mt-1 text-sm text-muted">{event.host}{event.hostTitle ? ` · ${event.hostTitle}` : ""}</p>}
      </div>
    </article>
  );
}
