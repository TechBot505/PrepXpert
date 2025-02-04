import HeroSection from "@/components/hero";
import CTA from "@/components/cta";
import FAQS from "@/components/faqs";
import Testimonials from "@/components/testimonials";
import HowItWorks from "@/components/howItWorks";
import Stats from "@/components/stats";
import Features from "@/components/features";

export default function Home() {
  return (
    <div>
      <div className="grid-background"></div>

      <HeroSection />

      <Features />

      <Stats />

      <HowItWorks />

      <Testimonials />

      <FAQS />

      <CTA />
    </div>
  );
}
