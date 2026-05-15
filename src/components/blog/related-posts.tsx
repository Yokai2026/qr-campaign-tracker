import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { ARTICLES } from '@/app/blog/articles';

type RelatedPost = {
  slug: string;
  title: string;
  description: string;
  source: 'db' | 'file';
};

/**
 * Server-Component: liefert 3 verwandte Blog-Posts.
 * Strategie: gleicher Cluster wenn DB-Blog, sonst Tag-Overlap mit File-Blogs.
 * Boostet SEO-Authority + reduziert Bounce-Rate.
 */
export async function RelatedPosts({
  currentSlug,
  cluster = null,
  tags = [],
  limit = 3,
}: {
  currentSlug: string;
  cluster?: string | null;
  tags?: string[];
  limit?: number;
}) {
  const candidates: RelatedPost[] = [];

  // 1) DB-Blogs aus gleichem Cluster
  try {
    const sb = await createServiceClient();
    const { data } = await sb
      .from('content_blogs')
      .select('slug, title, description, cluster, tags, created_at')
      .neq('slug', currentSlug)
      .order('created_at', { ascending: false })
      .limit(20);

    const sameCluster = cluster ? (data ?? []).filter((p) => p.cluster === cluster) : [];
    const otherDb = (data ?? []).filter((p) => p.cluster !== cluster);

    for (const p of [...sameCluster, ...otherDb]) {
      if (candidates.length >= limit) break;
      candidates.push({ slug: p.slug, title: p.title, description: p.description, source: 'db' });
    }
  } catch {
    // ignore
  }

  // 2) Fill with file-articles by tag-overlap
  if (candidates.length < limit) {
    const overlaps = ARTICLES.filter((a) => a.slug !== currentSlug).map((a) => {
      const overlap = (a.tags ?? []).filter((t) => tags.includes(t)).length;
      return { ...a, overlap };
    }).sort((a, b) => b.overlap - a.overlap);

    for (const a of overlaps) {
      if (candidates.length >= limit) break;
      if (candidates.find((c) => c.slug === a.slug)) continue;
      candidates.push({ slug: a.slug, title: a.title, description: a.description, source: 'file' });
    }
  }

  if (candidates.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3 w-3" />
        Weiterlesen
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {candidates.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40 hover:bg-card/80"
          >
            <h3 className="text-[14.5px] font-semibold leading-tight tracking-tight transition-colors group-hover:text-brand">
              {p.title}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground transition-colors group-hover:text-brand">
              Lesen <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
