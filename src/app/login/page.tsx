import type { Metadata } from "next";
import { site } from "@/data/site";
import { ButtonLink, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Member login",
  description: "Member login for Hyderabad Entrepreneurs Hub is launching soon.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card sm:p-10">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold/20"><Icon name="lock" className="h-7 w-7" /></span>
          <p className="eyebrow mt-5">Member login</p>
          <h1 className="mt-2 text-3xl font-extrabold text-navy">Launching soon</h1>
          <p className="mt-3 text-muted">Member accounts, the directory and event RSVPs are coming to this page. Until then, the WhatsApp group is the member home.</p>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href={`https://wa.me/${site.whatsapp.replace("+", "")}`} external size="lg">Message the team on WhatsApp</ButtonLink>
            <ButtonLink href="/" variant="secondary" size="lg">Back to home</ButtonLink>
          </div>
          <p className="mt-6 text-sm text-muted">Not a member yet? <a href={site.applyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-600 hover:underline">Apply to join</a></p>
        </div>
      </div>
    </section>
  );
}
