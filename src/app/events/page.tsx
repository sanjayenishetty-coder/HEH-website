import type { Metadata } from "next";
import { pastEvents, upcomingEvents } from "@/data/events";
import { site } from "@/data/site";
import { EventCard, PastEventTile } from "@/components/EventCard";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Events & calendar",
  description:
    "Upcoming HEH sessions in Hyderabad: knowledge workshops, expert talks, networking mixers, industry visits and business development circles for verified business owners.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();
  return (
    <>
      <PageHeader eyebrow="Events & calendar" title="Where the forum meets"
        text="Knowledge sessions, networking mixers, industry visits and business development circles. All member-led, all working sessions.">
        <ButtonLink href={site.applyUrl} external>Apply to join <Icon name="arrowRight" className="h-4 w-4" /></ButtonLink>
      </PageHeader>

      <section className="bg-cream py-16 lg:py-20">
        <div className="container-x">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-navy">Upcoming</h2>
            <span className="text-sm text-muted">{upcoming.length} scheduled</span>
          </div>
          <div className="mt-6 space-y-6">
            {upcoming.length > 0 ? (
              upcoming.map((e) => <EventCard key={e.slug} event={e} upcoming />)
            ) : (
              <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-muted">
                The next session is being scheduled. Members hear first in the WhatsApp group.
              </div>
            )}
          </div>
          <p className="mt-6 text-sm text-muted">
            Not a member yet? Shortlisted applicants get a guest pass to one mixer.{" "}
            <a href={site.applyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-600 underline-offset-4 hover:underline">Apply now</a>
          </p>
        </div>
      </section>

      {past.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="container-x">
            <h2 className="text-2xl font-extrabold text-navy">Past sessions</h2>
            <p className="mt-2 text-muted">A look at what the forum has been up to.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => <PastEventTile key={e.slug} event={e} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
