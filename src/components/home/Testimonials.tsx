import { testimonialVideos } from "@/data/testimonials";
import { Section, SectionHeading } from "@/components/ui";

export function Testimonials() {
  return (
    <Section tone="white">
      <SectionHeading eyebrow="Member voices" title="What members say"
        text="Entrepreneurs on what changed for their business after joining HEH." />
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        {testimonialVideos.map((v) => (
          <div key={v.id} className="mx-auto w-full max-w-[340px] overflow-hidden rounded-3xl border border-line bg-navy shadow-card">
            <iframe
              className="aspect-[9/16] w-full"
              src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`}
              title={v.title}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
