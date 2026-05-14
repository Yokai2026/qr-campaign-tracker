import Link from 'next/link';
import { CalendarDays, ArrowRight, BookOpen } from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { ARTICLES } from './articles';

export const metadata = {
  title: 'Spurig Blog — QR-Code-Tracking, DSGVO & Print-Marketing',
  description:
    'Praktische Guides, Vergleiche und Daten rund um QR-Code-Tracking, DSGVO-konformes Analytics und Print-Marketing für deutsche Unternehmen.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Spurig Blog',
    description: 'Guides zu QR-Code-Tracking, DSGVO und Print-Marketing.',
    url: 'https://spurig.com/blog',
  },
};

export default function BlogIndexPage() {
  const articles = [...ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <GridBackdrop variant="dots" className="h-[320px] opacity-30" fade />
          <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-10 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <BookOpen className="h-3 w-3 text-brand" />
              Spurig Blog
            </div>
            <h1 className="mt-5 font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[52px]">
              Guides, Vergleiche, Praxis-Daten.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Was deutsche Marketing-Teams wirklich über QR-Code-Tracking, DSGVO-konforme
              Analytics und messbare Print-Kampagnen wissen müssen.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <ul className="grid gap-4 md:grid-cols-2">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="group block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40 hover:bg-card/80"
                >
                  <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <time dateTime={a.publishedAt}>
                      {new Date(a.publishedAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{a.readingMinutes} Min</span>
                  </div>
                  <h2 className="mt-2 font-heading text-[20px] font-semibold leading-tight tracking-tight transition-colors group-hover:text-brand">
                    {a.title}
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                  {a.tags && a.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      {a.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-brand">
                        Lesen <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
