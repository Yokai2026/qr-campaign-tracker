import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { expandIdeaToBlog, type BlogArchetype, type HookPattern } from '@/lib/content/ideas';
import { generateDraft, readBlogPost } from '@/lib/content/repurpose';
import { notifySearchEngines } from '@/lib/seo/indexing';
import type { ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// 300s max auf Vercel Pro. Blog-Generation + 3 Repurpose-Calls + Image-Generation
// kann 90-120s dauern wenn Web-Search aktiv ist.
export const maxDuration = 300;

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
    .select('id, cluster, title, outline, angle, target_keywords, hook_pattern, emotion, target_audience, cta_suggestion, ai_reference, tracking_reference, tonality, blog_format, status, expanded_blog_id')
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
    // Letzte 5 Archetypes + Opener-Sätze aus DB ziehen.
    // Archetype-Rotation: verhindert zwei gleiche hintereinander.
    // Opener-Anti-Rep: zeigt der AI welche Anfänge gerade benutzt wurden,
    //                  damit sie einen ANDEREN wählt (verhindert "Donnerstag 14:47"-Wiederholung).
    const { data: recentBlogs } = await service
      .from('content_blogs')
      .select('tags, body_md')
      .order('created_at', { ascending: false })
      .limit(5);
    const recentArchetypes: BlogArchetype[] = [];
    const recentMoods: number[] = [];
    const recentOpeners: string[] = [];
    for (const b of recentBlogs ?? []) {
      const tags = (b.tags as string[] | null) ?? [];
      const archTag = tags.find((t) => t.startsWith('archetype:'));
      const code = archTag?.slice('archetype:'.length) as BlogArchetype | undefined;
      if (code && ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(code)) {
        recentArchetypes.push(code);
      }
      const moodTag = tags.find((t) => t.startsWith('mood:'));
      const moodNum = moodTag ? parseInt(moodTag.slice('mood:'.length), 10) : NaN;
      if (Number.isFinite(moodNum) && moodNum >= 1 && moodNum <= 6) {
        recentMoods.push(moodNum);
      }
      // Erste 1-2 Sätze als Opener-Signature extrahieren
      const body = (b.body_md as string | null) ?? '';
      const cleaned = body.replace(/^(##\s+.*?\n+)+/m, '').trim();
      const opener = cleaned.slice(0, 140).replace(/\s+/g, ' ').trim();
      if (opener.length > 20) recentOpeners.push(opener);
    }

    let expanded;
    try {
      const meta = idea as {
        hook_pattern?: string | null;
        emotion?: string | null;
        target_audience?: string | null;
        cta_suggestion?: string | null;
        ai_reference?: string | null;
        tracking_reference?: string | null;
        tonality?: string | null;
        blog_format?: string | null;
      };
      expanded = await expandIdeaToBlog({
        title: idea.title,
        outline: idea.outline ?? '',
        angle: idea.angle ?? '',
        target_keywords: idea.target_keywords,
        cluster: idea.cluster as ContentCluster,
        recentArchetypes: recentArchetypes.slice(0, 3),
        recentMoods: recentMoods.slice(0, 3),
        recentOpeners,
        hookPattern: meta.hook_pattern as HookPattern | undefined,
        emotion: meta.emotion,
        targetAudience: meta.target_audience,
        ctaSuggestion: meta.cta_suggestion,
        aiReference: meta.ai_reference,
        trackingReference: meta.tracking_reference,
        tonality: meta.tonality,
        blogFormat: meta.blog_format,
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

    // SEO: Bing IndexNow + Google Sitemap-Ping fire-and-forget
    const blogUrl = `https://spurig.com/blog/${blog.slug}`;
    void notifySearchEngines([blogUrl]);
  }

  // Auto-Repurpose (3 Channels)
  let repurposed: Array<{ channel: string; ok: boolean; error?: string }> = [];
  if (autoRepurpose && blog) {
    const blogContent = await readBlogPost(blog.slug);
    if (blogContent) {
      const channels = ['linkedin', 'twitter', 'reddit'] as const;
      for (let i = 0; i < channels.length; i++) {
        const ch = channels[i];
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

        // Bei Anthropic-Ueberlast laenger pausieren, sonst nur kurz Luft holen.
        if (i < channels.length - 1) {
          const last = repurposed[repurposed.length - 1];
          const hitOverload = !last.ok && /529|429|ueberlastet|Rate-Limit/i.test(last.error ?? '');
          await new Promise((r) => setTimeout(r, hitOverload ? 15_000 : 1_500));
        }
      }
    }
  }

  return NextResponse.json({
    blog: { id: blog.id, slug: blog.slug, title: blog.title },
    repurposed,
  });
}
