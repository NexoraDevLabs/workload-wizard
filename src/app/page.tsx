import Hero from "@/components/Hero";
import JoinWaitlist from "@/components/JoinWaitlist";
import DynamicIslandHeader from "@/components/dynamic-header-island";
import Footer from "@/components/Footer";
import "@/styles/index.css";

export default function Home() {
  return (
    <div className="relative">
      <DynamicIslandHeader />
      <Hero />
      {/*<Features />*/}
      {/*<Benefits />*/}
      {/*<HowItWorks />*/}
      {/*<Testimonials />*/}
      {/*<CTA />*/}
      <Footer />
    </div>
  );
}
