import { useEffect } from "react";
import Navbar from "./Navbar.tsx";
import Hero from "./Hero.tsx";
import TrustBar from "./TrustBar.tsx";
import HowItWorks from "./HowItWorks.tsx";
import Features from "./Features.tsx";
import Pricing from "./Pricing.tsx";
import Testimonials from "./Testimonials.tsx";
import CTASection from "./CTASection.tsx";
import Footer from "./Footer.tsx";

export default function App() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "WANI — Asisten WhatsApp AI untuk UMKM";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-white text-stone-900"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
