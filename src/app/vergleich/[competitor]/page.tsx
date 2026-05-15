import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowRight, ShieldCheck, MapPin, Globe2 } from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData } from '@/components/seo/structured-data';
import { COMPETITORS, getCompetitorBySlug } from '@/data/competitors';
import type { Metadata } from 'next';

type Params = { competitor: string };

export async function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: `${c.slug}-alternative` }));
}

function resolveSlug(competitor: string): string {
  return competitor.replace(/-alternative$/, '');
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { competitor } = await params;
  const slug = resolveSlug(competitor);
  const c = getCompetitorBySlug(slug);
  if (!c) return { title: 'Vergleich' };

  const title = `${c.name}-Alternative aus Deutschland (DSGVO-konform) — Spurig`;
  const description = `Spurig vs. ${c.name}: ${c.oneLine}. EU-Hosting, deutscher Support, ${c.pricing.includes('Self-hosted') ? 'managed' : 'guenstiger oder gleich teuer'}. Migration in 5 Min.`;

  return {
    title,
    description,
    alternates: { canonical: `/vergleich/${c.slug}-alternative` },
    openGraph: {
      title,
      description,
      url: `https://spurig.com/vergleich/${c.slug}-alternative`,
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<Params> }) {
  const { competitor } = await params;
  const slug = resolveSlug(competitor);
  const c = getCompetitorBySlug(slug);
  if (!c) notFound();

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Spurig',
    description: `DSGVO-konforme ${c.name}-Alternative aus Deutschland mit EU-Hosting.`,
    brand: { '@type': 'Brand', name: 'Spurig' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: '8.99',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-faq" data={faqLd} />
      <StructuredData id="ld-product" data={productLd} />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <GridBackdrop variant="dots" className="h-[280px] opacity-30" fade />
          <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-12 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-brand" />
              Vergleich · Spurig vs. {c.name}
            </div>
            <h1 className="mt-5 font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[52px]">
              {c.name}-Alternative.<br />
              <span className="text-brand">DSGVO-konform aus Deutschland.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
              {c.ourPositioning}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[14px] font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition-transform hover:-translate-y-px"
              >
                14 Tage kostenlos testen <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#vergleich"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-medium hover:bg-muted/30"
              >
                Direktvergleich anzeigen
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> EU-Server in Frankfurt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> AVV inklusive
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5" /> Deutscher Support
              </span>
            </div>
          </div>
        </section>

        {/* DSGVO-Issues */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-[28px] font-semibold tracking-tight">
            Warum {c.name} 2026 problematisch ist
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Vier konkrete Compliance- und Praxis-Probleme aus Sicht eines deutschen Marketing-Teams.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {c.dsgvoIssues.map((issue, i) => (
              <li key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                  Problem {i + 1}
                </div>
                <p className="mt-1 text-[14px] leading-relaxed">{issue}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Direkter Feature-Vergleich */}
        <section id="vergleich" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-[28px] font-semibold tracking-tight">
            Spurig vs. {c.name} im Direktvergleich
          </h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-brand">
                    Spurig
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.features.map((f, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {f.feature}
                      {f.note && <div className="mt-0.5 text-[11px] text-muted-foreground">{f.note}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <CompareCell value={f.spurig} positive />
                    </td>
                    <td className="px-4 py-3">
                      <CompareCell value={f.competitor} positive={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Why Migrate */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-[28px] font-semibold tracking-tight">
            5 Gruende fuer den Wechsel zu Spurig
          </h2>
          <ol className="mt-6 space-y-3">
            {c.whyMigrate.map((reason, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[13px] font-semibold text-brand">
                  {i + 1}
                </span>
                <p className="text-[14.5px] leading-relaxed">{reason}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQs */}
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-[28px] font-semibold tracking-tight">
            Haeufige Fragen zum Wechsel von {c.name}
          </h2>
          <dl className="mt-6 space-y-4">
            {c.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <FinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}

function CompareCell({ value, positive }: { value: boolean | string; positive: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1 text-emerald-500">
        <Check className="h-4 w-4" /> Ja
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-red-500/80">
        <X className="h-4 w-4" /> Nein
      </span>
    );
  }
  return <span className={positive ? 'text-foreground font-medium' : 'text-muted-foreground'}>{value}</span>;
}
