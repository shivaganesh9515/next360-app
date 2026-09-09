import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustMarquee from '@/components/TrustMarquee';
import ThreeAudience from '@/components/ThreeAudience';
import ProductShowcase from '@/components/ProductShowcase';
import PrinciplesSection from '@/components/PrinciplesSection';
import SellerCTA from '@/components/SellerCTA';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustMarquee />
        <ThreeAudience />
        <ProductShowcase />
        <PrinciplesSection />
        <SellerCTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
