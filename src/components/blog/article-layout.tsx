import Link from 'next/link';
import { CalendarDays, ArrowRight, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData } from '@/components/seo/structured-data';

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  readingMinutes: number;
  tags?: string[];
};

type Props = {
  meta: ArticleMeta;
  children: React.ReactNode;
};

export function ArticleLayout({ meta, children }: Props) {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    inLanguage: 'de-DE',
    author: {
      '@type': 'Person',
      name: meta.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Spurig',
      url: 'https://spurig.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://spurig.com/blog/${meta.slug}`,
    },
  } as const;

  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-article" data={articleLd} />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <GridBackdrop variant="dots" className="h-[320px] opacity-30" fade />
          <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-8 sm:px-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Zurück zum Blog
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <time dateTime={meta.publishedAt}>
                {new Date(meta.publishedAt).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <span className="text-muted-foreground/40">·</span>
              <span>{meta.readingMinutes} Min Lesezeit</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{meta.author}</span>
            </div>
            <h1 className="mt-4 font-heading text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">
              {meta.title}
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              {meta.description}
            </p>
            {meta.tags && meta.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {meta.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Article Body */}
        <article className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
          <div className="prose prose-neutral max-w-none dark:prose-invert [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-7 [&_h3]:text-[18px] [&_h3]:font-semibold [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:text-foreground/90 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_li]:text-[15px] [&_li]:leading-[1.7] [&_li]:text-foreground/90 [&_strong]:font-semibold [&_strong]:text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand/80 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/40 [&_blockquote]:bg-brand/[0.04] [&_blockquote]:py-2 [&_blockquote]:pl-5 [&_blockquote]:pr-3 [&_blockquote]:text-[14.5px] [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
            {children}
          </div>
        </article>

        {/* CTA bar — soft conversion */}
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-brand/30 bg-brand/[0.04] p-5 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-brand">Spurig probieren</div>
                <p className="mt-1 text-[14px] text-foreground">
                  DSGVO-konformes QR-Code-Tracking aus Deutschland. 14 Tage kostenlos, keine Karte.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13.5px] font-semibold text-brand-foreground transition-colors hover:brightness-110"
              >
                Trial starten
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
