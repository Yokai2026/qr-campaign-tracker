import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ARTICLES } from '@/app/blog/articles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS = ['draft', 'edited', 'posted', 'skipped'] as const;
const ALLOWED_CHANNELS = ['linkedin', 'twitter', 'reddit'] as const;

/**
 * GET  /api/admin/content              -> Liste aller Drafts + Blog-Posts ohne Drafts
 * PATCH /api/admin/content             -> Editiert ein Draft (status/text/external_url)
 */
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const service = await createServiceClient();
  const [draftsRes, dbBlogsRes] = await Promise.all([
    service
      .from('content_drafts')
      .select('id, blog_slug, channel, draft_text, model, status, posted_at, external_url, notes, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    service
      .from('content_blogs')
      .select('slug, title, description, tags, cluster, created_at')
      .order('created_at', { ascending: false }),
  ]);

  if (draftsRes.error) return NextResponse.json({ error: draftsRes.error.message }, { status: 500 });

  // Merge: file-based ARTICLES + DB content_blogs (DB-Blogs zuerst, neueste oben)
  const fileArticles = ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    publishedAt: a.publishedAt,
    tags: a.tags,
    source: 'file' as const,
  }));
  const dbArticles = (dbBlogsRes.data ?? []).map((b) => ({
    slug: b.slug,
    title: b.title,
    description: b.description,
    publishedAt: b.created_at.split('T')[0],
    tags: b.tags ?? [],
    source: 'db' as const,
    cluster: b.cluster,
  }));

  // Dedup nach slug (DB wins)
  const seen = new Set(dbArticles.map((a) => a.slug));
  const merged = [...dbArticles, ...fileArticles.filter((a) => !seen.has(a.slug))];

  return NextResponse.json({
    drafts: draftsRes.data ?? [],
    articles: merged,
  });
}

export async function PATCH(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.draft_text === 'string') {
    updates.draft_text = body.draft_text;
    updates.status = 'edited';
  }
  if (typeof body.status === 'string' && ALLOWED_STATUS.includes(body.status as never)) {
    updates.status = body.status;
    if (body.status === 'posted') updates.posted_at = new Date().toISOString();
  }
  if (typeof body.external_url === 'string') updates.external_url = body.external_url || null;
  if (typeof body.notes === 'string') updates.notes = body.notes || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const service = await createServiceClient();
  const { error } = await service.from('content_drafts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: updates });
}
