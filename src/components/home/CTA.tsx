import { site } from "@/data/site";
import { ButtonLink, Icon } from "@/components/ui";

export function CTA() {
  return (
    <section className="bg-cream pb-20 lg:pb-28">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy px-8 py-14 text-center text-white sm:px-14">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gold/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <h2 className="text-balance relative text-3xl font-extrabold sm:text-4xl">Ready to grow with people who get it?</h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-white/70">Apply in five minutes. If you are shortlisted, you get a guest pass to one session before you commit.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={site.applyUrl} external size="lg">Apply for membership <Icon name="arrowRight" className="h-5 w-5" /></ButtonLink>
            <ButtonLink href="/team" variant="inverse" size="lg">Meet the core team</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
