import type { MetadataRoute } from 'next';
import { ARTICLES } from './blog/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://spurig.com';
  const now = new Date();

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // SEO-Landing-Pages — höchster Such-Intent
    { url: `${base}/bitly-alternative`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/dsgvo-qr-code`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/qr-code-fuer-gastronomie`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/qr-code-print-tracking`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/kurzlink-eigene-domain`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // Blog
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...articleEntries,
    { url: `${base}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
