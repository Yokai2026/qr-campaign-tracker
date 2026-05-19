import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ARTICLES } from '@/app/blog/articles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS = ['draft', 'edited', 'posted', 'skipped'] as const;
const ALLOWED_CHANNELS = ['linkedin', 'twitter', 'reddit'] as const;

/**
 * GET    /api/admin/content                 -> Liste aller Drafts + Blog-Posts
 * PATCH  /api/admin/content                 -> Editiert ein Draft (status/text/external_url)
 * DELETE /api/admin/content?slug=...        -> Loescht 1 DB-Blog (+ Drafts, Ideen-Link revert)
 * DELETE /api/admin/content  body{slugs[]}  -> Bulk-Loeschen mehrerer DB-Blogs
 *
 * File-based Blogs (source='file', aus src/app/blog/articles.ts) sind NICHT loeschbar
 * — die liegen im Code, nicht in der DB.
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
      .select('slug, title, description, tags, cluster, image_prompt, image_url, image_alt, created_at')
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
    image_prompt: b.image_prompt ?? null,
    image_url: b.image_url ?? null,
    image_alt: b.image_alt ?? null,
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

export async function DELETE(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Slug-Quellen: query-param (?slug=…) ODER JSON-Body { slugs: [...] }
  const url = new URL(request.url);
  const singleSlug = url.searchParams.get('slug');
  let slugs: string[] = [];
  if (singleSlug) {
    slugs = [singleSlug];
  } else {
    try {
      const body = await request.json();
      if (Array.isArray(body.slugs)) {
        slugs = body.slugs.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0);
      }
    } catch {
      // kein body — ok, slugs bleibt leer
    }
  }
  if (slugs.length === 0) {
    return NextResponse.json({ error: 'slug oder slugs[] erforderlich' }, { status: 400 });
  }

  // File-based Blogs (in ARTICLES Code-File) sind NICHT loeschbar.
  const fileSlugs = new Set(ARTICLES.map((a) => a.slug));
  const codeBacked = slugs.filter((s) => fileSlugs.has(s));
  const deletable = slugs.filter((s) => !fileSlugs.has(s));

  const service = await createServiceClient();

  // Zuerst Blog-IDs holen — werden gebraucht um Ideen-Links zu reverten.
  const { data: blogRows, error: lookupErr } = await service
    .from('content_blogs')
    .select('id, slug')
    .in('slug', deletable);
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });

  const blogIds = (blogRows ?? []).map((r) => r.id);
  const foundSlugs = new Set((blogRows ?? []).map((r) => r.slug));
  const notFound = deletable.filter((s) => !foundSlugs.has(s));

  const results = { deleted: [] as string[], errors: [] as Array<{ slug: string; error: string }> };

  // 1) Channel-Drafts zu diesen Slugs entsorgen
  if (foundSlugs.size > 0) {
    const { error: draftsErr } = await service
      .from('content_drafts')
      .delete()
      .in('blog_slug', Array.from(foundSlugs));
    if (draftsErr) {
      return NextResponse.json({ error: `drafts delete: ${draftsErr.message}` }, { status: 500 });
    }
  }

  // 2) Ideen die auf diese Blogs zeigten -> zurueck in den Backlog setzen,
  //    damit der User die Idee erneut "ausbauen" kann ohne sie zu verlieren.
  if (blogIds.length > 0) {
    const { error: ideasErr } = await service
      .from('content_ideas')
      .update({ expanded_blog_id: null, status: 'backlog' })
      .in('expanded_blog_id', blogIds);
    if (ideasErr) {
      // Nicht kritisch — Blog haben wir noch nicht geloescht. Loggen, weitermachen.
      console.warn('[content DELETE] ideas revert failed:', ideasErr.message);
    }
  }

  // 3) Blogs selbst loeschen
  if (foundSlugs.size > 0) {
    const { data: deletedRows, error: delErr } = await service
      .from('content_blogs')
      .delete()
      .in('slug', Array.from(foundSlugs))
      .select('slug');
    if (delErr) return NextResponse.json({ error: `blogs delete: ${delErr.message}` }, { status: 500 });
    results.deleted = (deletedRows ?? []).map((r) => r.slug);
  }

  notFound.forEach((s) => results.errors.push({ slug: s, error: 'nicht in DB' }));
  codeBacked.forEach((s) => results.errors.push({ slug: s, error: 'file-based blog (code) — nicht loeschbar' }));

  return NextResponse.json(results);
}
