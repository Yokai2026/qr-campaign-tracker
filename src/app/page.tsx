import {
  StructuredData,
  softwareApplicationLd,
  faqPageLd,
} from '@/components/seo/structured-data';
import { SiteHeader } from '@/components/landing/site-header';
import { Hero } from '@/components/landing/hero';
import { QuickWinsStrip } from '@/components/landing/quick-wins-strip';
import { SectorStrip } from '@/components/landing/sector-strip';
import { StepsSection } from '@/components/landing/steps-section';
import { FeaturesBento } from '@/components/landing/features-bento';
import { PrivacySection } from '@/components/landing/privacy-section';
import { DomainShowcase } from '@/components/landing/domain-showcase';
import { FounderBlock } from '@/components/landing/founder-block';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { FaqSection, FAQ_ITEMS } from '@/components/landing/faq-section';
import { FinalCTA } from '@/components/landing/final-cta';
import { SiteFooter } from '@/components/landing/site-footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-software-application" data={softwareApplicationLd} />
      <StructuredData id="ld-faq-page" data={faqPageLd(FAQ_ITEMS)} />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <QuickWinsStrip />
        <SectorStrip />
        <StepsSection />
        <FeaturesBento />
        <PrivacySection />
        <DomainShowcase />
        <FounderBlock />
        <PricingTeaser />
        <FaqSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
