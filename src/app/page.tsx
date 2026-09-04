import { Hero } from "@/components/home/Hero";
import { SectorMarquee } from "@/components/home/SectorMarquee";
import { Stats } from "@/components/home/Stats";
import { Benefits } from "@/components/home/Benefits";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { Membership } from "@/components/home/Membership";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectorMarquee />
      <Stats />
      <Benefits />
      <HowItWorks />
      <Testimonials />
      <Membership />
      <FAQ />
      <CTA />
    </>
  );
}
