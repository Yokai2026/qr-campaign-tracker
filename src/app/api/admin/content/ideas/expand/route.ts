import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { expandIdeaToBlog } from '@/lib/content/ideas';
import { generateDraft, readBlogPost } from '@/lib/content/repurpose';
import type { ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/content/ideas/expand
 * Body: { ideaId: string, autoRepurpose?: boolean (default true) }
 *
 * Expandiert eine Idee zu einem Full-Blog-Post (Markdown, 1500-2000 Worte).
 * Inseriert in content_blogs (slug unique). Setzt content_ideas.status='expanded'.
 * Wenn autoRepurpose=true (default): generiert direkt im Anschluss 3 Drafts
 * (linkedin/twitter/reddit) in content_drafts.
 */
export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { ideaId?: string; autoRepurpose?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  if (!body.ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });
  const autoRepurpose = body.autoRepurpose !== false;

  const service = await createServiceClient();
  const { data: idea, error: ideaErr } = await service
    .from('content_ideas')
    .select('id, cluster, title, outline, angle, target_keywords, status, expanded_blog_id')
    .eq('id', body.ideaId)
    .maybeSingle();
  if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 });
  if (!idea) return NextResponse.json({ error: 'idea not found' }, { status: 404 });

  // Wenn schon expanded: kein Re-Expand, aber Repurpose optional re-triggern
  let blog;
  if (idea.expanded_blog_id) {
    const { data: existing } = await service
      .from('content_blogs')
      .select('id, slug, title, description, tags, body_md')
      .eq('id', idea.expanded_blog_id)
      .maybeSingle();
    blog = existing;
  }

  if (!blog) {
    let expanded;
    try {
      expanded = await expandIdeaToBlog({
        title: idea.title,
        outline: idea.outline ?? '',
        angle: idea.angle ?? '',
        target_keywords: idea.target_keywords,
        cluster: idea.cluster as ContentCluster,
      });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'expand-failed' }, { status: 500 });
    }

    // Unique slug: bei Konflikt mit -2 / -3 ranhaengen
    let finalSlug = expanded.slug;
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await service.from('content_blogs').select('id').eq('slug', finalSlug).maybeSingle();
      if (!clash) break;
      finalSlug = `${expanded.slug}-${i + 2}`;
    }

    const { data: inserted, error: insErr } = await service
      .from('content_blogs')
      .insert({
        slug: finalSlug,
        title: expanded.title,
        description: expanded.description,
        tags: expanded.tags,
        body_md: expanded.body_md,
        image_prompt: expanded.image_prompt,
        image_alt: expanded.image_alt,
        source: 'ideas',
        cluster: idea.cluster,
        origin_idea_id: idea.id,
      })
      .select('id, slug, title, description, tags, body_md, image_prompt, image_alt')
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    blog = inserted;

    await service.from('content_ideas').update({
      status: 'expanded',
      expanded_blog_id: blog.id,
    }).eq('id', idea.id);
  }

  // Auto-Repurpose (3 Channels)
  let repurposed: Array<{ channel: string; ok: boolean; error?: string }> = [];
  if (autoRepurpose && blog) {
    const blogContent = await readBlogPost(blog.slug);
    if (blogContent) {
      const channels = ['linkedin', 'twitter', 'reddit'] as const;
      for (const ch of channels) {
        try {
          const text = await generateDraft(ch, blogContent);
          await service.from('content_drafts').upsert(
            { blog_slug: blog.slug, channel: ch, draft_text: text, model: 'claude-haiku-4-5', status: 'draft' },
            { onConflict: 'blog_slug,channel' },
          );
          repurposed.push({ channel: ch, ok: true });
        } catch (e) {
          repurposed.push({ channel: ch, ok: false, error: e instanceof Error ? e.message : 'unknown' });
        }
      }
    }
  }

  return NextResponse.json({
    blog: { id: blog.id, slug: blog.slug, title: blog.title },
    repurposed,
  });
}
