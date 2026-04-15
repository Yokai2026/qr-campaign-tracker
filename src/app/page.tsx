import { StructuredData, softwareApplicationLd } from '@/components/seo/structured-data';
import { SiteHeader } from '@/components/landing/site-header';
import { Hero } from '@/components/landing/hero';
import { StepsSection } from '@/components/landing/steps-section';
import { FeaturesBento } from '@/components/landing/features-bento';
import { PrivacySection } from '@/components/landing/privacy-section';
import { DomainShowcase } from '@/components/landing/domain-showcase';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { FinalCTA } from '@/components/landing/final-cta';
import { SiteFooter } from '@/components/landing/site-footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-software-application" data={softwareApplicationLd} />
      <SiteHeader />
      <main>
        <Hero />
        <StepsSection />
        <FeaturesBento />
        <PrivacySection />
        <DomainShowcase />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
