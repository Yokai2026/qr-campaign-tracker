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
import { StatsMoment } from '@/components/landing/stats-moment';
import { PrivacySection } from '@/components/landing/privacy-section';
import { DomainShowcase } from '@/components/landing/domain-showcase';
import { CompareSection } from '@/components/landing/compare-section';
import { TrustStrip } from '@/components/landing/trust-strip';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { FaqSection, FAQ_ITEMS } from '@/components/landing/faq-section';
import { FinalCTA } from '@/components/landing/final-cta';
import { SiteFooter } from '@/components/landing/site-footer';
import { Reveal } from '@/components/shared/reveal';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-software-application" data={softwareApplicationLd} />
      <StructuredData id="ld-faq-page" data={faqPageLd(FAQ_ITEMS)} />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Reveal><QuickWinsStrip /></Reveal>
        <Reveal><SectorStrip /></Reveal>
        <Reveal><StepsSection /></Reveal>
        <Reveal><FeaturesBento /></Reveal>
        <Reveal><StatsMoment /></Reveal>
        <Reveal><PrivacySection /></Reveal>
        <Reveal><DomainShowcase /></Reveal>
        <Reveal><CompareSection /></Reveal>
        <Reveal><TrustStrip /></Reveal>
        <Reveal><PricingTeaser /></Reveal>
        <Reveal><FaqSection /></Reveal>
        <Reveal><FinalCTA /></Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
