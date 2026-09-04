import { pastEvents, upcomingEvents } from "@/data/events";
import { EventCard, PastEventTile } from "@/components/EventCard";
import { ButtonLink, Icon, Section, SectionHeading } from "@/components/ui";

export function EventsPreview() {
  const upcoming = upcomingEvents().slice(0, 2);
  const recent = pastEvents().slice(0, 3);
  return (
    <Section id="events" tone="light">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading align="left" eyebrow="What's next" title="Upcoming in the forum"
          text="Knowledge sessions, networking mixers, industry visits and business development circles. All member-led, all working sessions." />
        <ButtonLink href="/events" variant="secondary" className="mb-12 lg:mb-16 shrink-0">Full calendar <Icon name="arrowRight" className="h-4 w-4" /></ButtonLink>
      </div>

      {upcoming.length > 0 ? (
        <div className="space-y-6">
          {upcoming.map((e) => <EventCard key={e.slug} event={e} upcoming />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-muted">
          The next session is being scheduled. Members are notified first in the WhatsApp group.
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h3 className="mt-16 text-sm font-bold uppercase tracking-widest text-muted">Recent sessions</h3>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((e) => <PastEventTile key={e.slug} event={e} />)}
          </div>
        </>
      )}
    </Section>
  );
}
