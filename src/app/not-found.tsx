import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="bg-cream py-24">
      <div className="container-x text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold text-navy">That page has moved on</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">The link you followed does not exist any more. Head back home or meet the people behind the forum.</p>
        <div className="mt-8 flex justify-center gap-3"><ButtonLink href="/">Home</ButtonLink><ButtonLink href="/team" variant="secondary">Core team</ButtonLink></div>
      </div>
    </section>
  );
}
