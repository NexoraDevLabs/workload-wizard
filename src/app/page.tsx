import Hero from '@/components/Hero';
import DynamicIslandHeader from '@/components/dynamic-header-island';
import Footer from '@/components/Footer';
import '@/styles/index.css';

export const dynamic = 'force-static';

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
