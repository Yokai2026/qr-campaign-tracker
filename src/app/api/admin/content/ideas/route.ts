import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { CLUSTERS, type ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET   /api/admin/content/ideas?cluster=...     → Liste der Ideen
 * PATCH /api/admin/content/ideas                 → Status/Felder editieren
 */

export async function GET(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const cluster = url.searchParams.get('cluster');
  const status = url.searchParams.get('status');
  const includeDeleted = url.searchParams.get('include_deleted') === '1';

  const service = await createServiceClient();
  let q = service
    .from('content_ideas')
    .select('id, cluster, title, outline, angle, target_keywords, status, expanded_blog_id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (cluster && CLUSTERS.includes(cluster as ContentCluster)) q = q.eq('cluster', cluster);
  if (status) q = q.eq('status', status);
  else if (!includeDeleted) q = q.neq('status', 'deleted');
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts pro Cluster
  const { data: countsRows } = await service.from('content_ideas').select('cluster, status');
  const counts = (countsRows ?? []).reduce<Record<string, Record<string, number>>>((acc, row) => {
    const c = row.cluster as string;
    const s = row.status as string;
    acc[c] ??= {};
    acc[c][s] = (acc[c][s] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ ideas: data ?? [], counts });
}

export async function PATCH(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.status === 'string' && ['backlog', 'expanded', 'skipped'].includes(body.status)) {
    updates.status = body.status;
  }
  if (typeof body.title === 'string') updates.title = body.title;
  if (typeof body.outline === 'string') updates.outline = body.outline;
  if (typeof body.angle === 'string') updates.angle = body.angle;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  const service = await createServiceClient();
  const { error } = await service.from('content_ideas').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Soft-Delete: status='deleted' statt Hard-Delete, damit die AI die Idee in
  // zukuenftigen Generate-Aufrufen NICHT erneut generiert. Anti-Wiederholungs-
  // Liste enthaelt jetzt auch geloeschte Titel.
  const service = await createServiceClient();
  const { error } = await service
    .from('content_ideas')
    .update({ status: 'deleted' })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
