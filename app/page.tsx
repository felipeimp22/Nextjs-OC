import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Testimonials from '@/components/landing/Testimonials';
import FooterCTA from '@/components/landing/FooterCTA';
import Footer from '@/components/landing/Footer';
import SocialProofAlert from '@/components/landing/SocialProofAlert';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <FooterCTA />
      </main>
      <Footer />
      <SocialProofAlert />
    </div>
  );
}