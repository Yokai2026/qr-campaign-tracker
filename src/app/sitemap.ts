import type { MetadataRoute } from 'next';
import { ARTICLES } from './blog/articles';
import { createServiceClient } from '@/lib/supabase/server';
import { COMPETITORS } from '@/data/competitors';

export const revalidate = 3600; // 1h cache — Sitemap braucht nicht real-time zu sein

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://spurig.com';
  const now = new Date();

  const fileArticles: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // DB-Blogs (Ideas-Pipeline)
  let dbArticles: MetadataRoute.Sitemap = [];
  try {
    const sb = await createServiceClient();
    const { data } = await sb
      .from('content_blogs')
      .select('slug, created_at, updated_at')
      .order('created_at', { ascending: false });
    dbArticles = (data ?? []).map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: new Date(b.updated_at ?? b.created_at ?? now),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap soll auch funktionieren wenn DB kurz nicht erreichbar
  }

  // Dedup DB > File
  const dbSlugs = new Set(dbArticles.map((a) => a.url));
  const articleEntries = [...dbArticles, ...fileArticles.filter((a) => !dbSlugs.has(a.url))];

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // SEO-Landing-Pages — höchster Such-Intent
    { url: `${base}/bitly-alternative`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Comparison-Pages /vergleich/<competitor>-alternative (SEO-Goldmines)
    ...COMPETITORS.map((c) => ({
      url: `${base}/vergleich/${c.slug}-alternative`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.88,
    })),
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
