import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Mission from '@/components/Mission';
import HowItWorks from '@/components/HowItWorks';
import StorefrontShowcase from '@/components/StorefrontShowcase';
import TrustStrip from '@/components/TrustStrip';
import FeatureShowcase from '@/components/FeatureShowcase';
import AppDownload from '@/components/AppDownload';
import LoyaltyTeaser from '@/components/LoyaltyTeaser';
import VendorPartnerSection from '@/components/VendorPartnerSection';
import Footer from '@/components/Footer';
import { LayoutLines } from '@/components/ui/layout-lines';

export default function HomePage() {
  return (
    <>
      <LayoutLines />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Mission />
        <HowItWorks />
        <StorefrontShowcase />
        <TrustStrip />
        <FeatureShowcase />
        <AppDownload />
        <LoyaltyTeaser />
        <VendorPartnerSection />
      </main>
      <Footer />
    </>
  );
}
