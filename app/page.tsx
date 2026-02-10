import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import PricingSection from "@/components/pricing-section";
import { Testimonials } from "@/components/testimonials";
import { LeadMagnet } from "@/components/lead-magnet";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-white text-black">
      <Header />
      
      <Hero />
      
      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="pricing">
        <PricingSection />
      </div>

      <div id="testimonials">
        <Testimonials />
      </div>

      <LeadMagnet />
      
      <Footer />
    </main>
  );
}