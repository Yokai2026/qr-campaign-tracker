import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { publishTweet } from '@/lib/social/twitter-publish';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/cron/twitter-publish
 *
 * Postet automatisch den naechsten Tweet aus content_drafts (channel='twitter',
 * status='draft', laenge <= 280). Max 1 Tweet pro Cron-Tick.
 *
 * Trigger: n8n taeglich 10:00 UTC.
 *
 * No-op wenn TWITTER_API_KEY fehlt -> kein Crash, klare Response.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.TWITTER_API_KEY) {
    return NextResponse.json({
      skipped: true,
      reason: 'Twitter-Credentials nicht gesetzt — Framework ready, aber inaktiv.',
    });
  }

  const sb = await createServiceClient();
  // Naechster postbarer Tweet:
  //  - channel = twitter
  //  - status = draft
  //  - text <= 280 chars
  //  - aelteste zuerst (FIFO) ODER scheduled_at gesetzt + erreicht
  const { data: drafts, error } = await sb
    .from('content_drafts')
    .select('id, blog_slug, draft_text, scheduled_at')
    .eq('channel', 'twitter')
    .eq('status', 'draft')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!drafts?.length) {
    return NextResponse.json({ posted: 0, reason: 'no-drafts-ready' });
  }

  // Erstes < 280 + falls scheduled, dann erreicht
  const now = Date.now();
  const candidate = drafts.find((d) => {
    if (d.draft_text.length > 280) return false;
    if (d.scheduled_at && new Date(d.scheduled_at).getTime() > now) return false;
    return true;
  });

  if (!candidate) {
    return NextResponse.json({ posted: 0, reason: 'no-valid-candidate' });
  }

  const result = await publishTweet(candidate.draft_text);
  if (!result.ok) {
    return NextResponse.json({ posted: 0, error: result.error }, { status: 500 });
  }

  await sb
    .from('content_drafts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_post_id: result.tweetId,
      external_url: result.tweetId ? `https://twitter.com/i/web/status/${result.tweetId}` : null,
    })
    .eq('id', candidate.id);

  return NextResponse.json({
    posted: 1,
    tweetId: result.tweetId,
    blogSlug: candidate.blog_slug,
  });
}
