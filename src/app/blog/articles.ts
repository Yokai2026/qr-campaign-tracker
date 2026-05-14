import type { ArticleMeta } from '@/components/blog/article-layout';

/**
 * Zentrale Registry aller Blog-Artikel. Jeder neue Artikel:
 *   1. Hier Eintrag ergänzen (slug, title, etc.)
 *   2. /src/app/blog/<slug>/page.tsx erstellen, die <ArticleLayout meta={...}> nutzt
 *   3. fertig — landet auto im Blog-Index + Sitemap
 */
export const ARTICLES: ArticleMeta[] = [
  {
    slug: 'bitly-dsgvo-check',
    title: 'Bitly DSGVO-Check: Was 2026 wirklich gilt',
    description:
      'Ist Bitly DSGVO-konform? Schrems II, US-Cloud Act, Standardvertragsklauseln — was deutsche Unternehmen rechtlich beachten müssen wenn sie Kurzlinks aus den USA nutzen.',
    publishedAt: '2026-05-14',
    author: 'Spurig-Team',
    readingMinutes: 6,
    tags: ['DSGVO', 'Bitly', 'Compliance'],
  },
  {
    slug: 'plakatkampagne-ohne-tracking-kosten',
    title: 'Was eine Plakatkampagne ohne Tracking wirklich kostet',
    description:
      'Rechenbeispiel anhand einer typischen DACH-Plakatbuchung: warum 30-40 % des Budgets verbrennen wenn du nicht pro Standort misst — und wie du das mit 27 € verhinderst.',
    publishedAt: '2026-05-14',
    author: 'Spurig-Team',
    readingMinutes: 5,
    tags: ['Print', 'ROI', 'Marketing'],
  },
];

export function getArticleBySlug(slug: string): ArticleMeta | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
