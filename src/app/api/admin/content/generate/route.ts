import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ARTICLES } from '@/app/blog/articles';
import { readBlogPost, generateDraft, type ContentChannel } from '@/lib/content/repurpose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const CHANNELS: ContentChannel[] = ['linkedin', 'twitter', 'reddit'];

/**
 * POST /api/admin/content/generate
 * Body: { slug: string, channels?: ContentChannel[] }
 *
 * Generiert (oder regeneriert) Drafts fuer einen Blog-Post.
 * Default: alle 3 Channels. Speichert in content_drafts (upsert by slug+channel).
 */
export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { slug?: string; channels?: ContentChannel[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const slug = body.slug;
  if (!slug || !ARTICLES.find((a) => a.slug === slug)) {
    return NextResponse.json({ error: 'slug not found' }, { status: 400 });
  }

  const channels = (body.channels?.length ? body.channels : CHANNELS).filter((c) =>
    CHANNELS.includes(c),
  );

  const blog = await readBlogPost(slug);
  if (!blog) return NextResponse.json({ error: 'blog post unreadable' }, { status: 500 });

  const service = await createServiceClient();
  const results: Array<{ channel: ContentChannel; ok: boolean; error?: string }> = [];

  for (const channel of channels) {
    try {
      const text = await generateDraft(channel, blog);
      const { error } = await service
        .from('content_drafts')
        .upsert(
          {
            blog_slug: slug,
            channel,
            draft_text: text,
            model: 'claude-haiku-4-5',
            status: 'draft',
          },
          { onConflict: 'blog_slug,channel' },
        );
      if (error) {
        results.push({ channel, ok: false, error: error.message });
      } else {
        results.push({ channel, ok: true });
      }
    } catch (e) {
      results.push({
        channel,
        ok: false,
        error: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  return NextResponse.json({ slug, results });
}
