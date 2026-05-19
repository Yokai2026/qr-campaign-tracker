import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { readBlogPost, generateDraft, type ContentChannel } from '@/lib/content/repurpose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Worst-Case: 3 Channels × bis zu 17s Anthropic-Retry-Backoff (2+5+10s)
// + zwei 15s-Cooldowns nach Overload-Treffern = ~80s. Daher 120s Reserve.
export const maxDuration = 120;

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
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  const channels = (body.channels?.length ? body.channels : CHANNELS).filter((c) =>
    CHANNELS.includes(c),
  );

  // readBlogPost macht den Slug-Lookup (DB content_blogs zuerst, dann File ARTICLES).
  // Wenn beide fehlschlagen -> Blog existiert wirklich nicht.
  const blog = await readBlogPost(slug);
  if (!blog) {
    return NextResponse.json(
      { error: `Blog mit slug "${slug}" nicht gefunden (weder DB noch File)` },
      { status: 404 },
    );
  }

  const service = await createServiceClient();
  const results: Array<{ channel: ContentChannel; ok: boolean; error?: string }> = [];

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
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
      results.push(
        error ? { channel, ok: false, error: error.message } : { channel, ok: true },
      );
    } catch (e) {
      results.push({
        channel,
        ok: false,
        error: e instanceof Error ? e.message : 'unknown',
      });
    }

    // Wenn der eben fertige Channel gegen Anthropic-Ueberlast gelaufen ist
    // (529/429), fuer den naechsten Channel laenger Luft holen — sonst rauschen
    // alle drei in dieselbe Welle. Bei Erfolg: kleines Cooldown reicht.
    const last = results[results.length - 1];
    const next = channels[i + 1];
    if (!next) break;
    const hitOverload = !last.ok && /529|429|ueberlastet|Rate-Limit/i.test(last.error ?? '');
    await new Promise((r) => setTimeout(r, hitOverload ? 15_000 : 1_500));
  }

  return NextResponse.json({ slug, results });
}
