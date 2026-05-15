import { notFound } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { createServiceClient } from '@/lib/supabase/server';
import { ArticleLayout } from '@/components/blog/article-layout';
import { LeadMagnetCTA } from '@/components/blog/lead-magnet-cta';
import { RelatedPosts } from '@/components/blog/related-posts';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

type Params = { slug: string };

async function fetchDbBlog(slug: string) {
  try {
    const sb = await createServiceClient();
    const { data } = await sb
      .from('content_blogs')
      .select('slug, title, description, tags, body_md, cluster, created_at')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchDbBlog(slug);
  if (!post) return { title: 'Artikel nicht gefunden' };
  return {
    title: `${post.title} · Spurig Blog`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.created_at,
      url: `https://spurig.com/blog/${post.slug}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function DbBlogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchDbBlog(slug);
  if (!post) notFound();

  const meta = {
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: (post.created_at ?? '').slice(0, 10),
    author: 'Spurig-Team',
    readingMinutes: Math.max(2, Math.round(post.body_md.split(/\s+/).length / 220)),
    tags: post.tags ?? [],
  };

  // Markdown -> HTML, dann DOMPurify-sanitized (Defense-in-Depth gegen XSS)
  const rawHtml = marked.parse(post.body_md, { async: false, breaks: true, gfm: true });
  const safeHtml = DOMPurify.sanitize(typeof rawHtml === 'string' ? rawHtml : '', {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'b', 'i',
      'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'rel', 'target'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <ArticleLayout meta={meta}>
      <div
        className="db-blog-content"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      <LeadMagnetCTA />
      <RelatedPosts
        currentSlug={post.slug}
        cluster={post.cluster ?? null}
        tags={Array.isArray(post.tags) ? post.tags : []}
      />
    </ArticleLayout>
  );
}
