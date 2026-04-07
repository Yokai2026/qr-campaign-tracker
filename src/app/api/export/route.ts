import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeUrl } from '@/lib/privacy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') || 'qr_codes';
  const campaignId = request.nextUrl.searchParams.get('campaign_id');
  const dateFrom = request.nextUrl.searchParams.get('date_from');
  const dateTo = request.nextUrl.searchParams.get('date_to');

  let csvContent = '';

  switch (type) {
    case 'qr_codes': {
      const query = supabase
        .from('qr_codes')
        .select('short_code, target_url, active, valid_from, valid_until, note, utm_source, utm_medium, utm_campaign, utm_content, created_at, placement:placements(name, placement_code, campaign:campaigns(name))')
        .order('created_at', { ascending: false });

      const { data } = await query;
      if (!data || data.length === 0) {
        csvContent = 'Keine Daten vorhanden';
        break;
      }

      const headers = ['Short Code', 'Ziel-URL', 'Aktiv', 'Gültig von', 'Gültig bis', 'Notiz', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'Erstellt', 'Platzierung', 'Code', 'Kampagne'];
      const rows = data.map((qr: Record<string, unknown>) => {
        const p = qr.placement as { name: string; placement_code: string; campaign: { name: string } | null } | null;
        return [
          qr.short_code, qr.target_url, qr.active ? 'Ja' : 'Nein',
          qr.valid_from || '', qr.valid_until || '', qr.note || '',
          qr.utm_source || '', qr.utm_medium || '', qr.utm_campaign || '', qr.utm_content || '',
          (qr.created_at as string).slice(0, 19),
          p?.name || '', p?.placement_code || '', p?.campaign?.name || '',
        ];
      });

      csvContent = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
      break;
    }

    case 'placements': {
      let query = supabase
        .from('placements')
        .select('name, placement_code, placement_type, status, poster_version, flyer_version, notes, installed_at, removed_at, created_at, campaign:campaigns(name), location:locations(venue_name, district)')
        .order('created_at', { ascending: false });

      if (campaignId) query = query.eq('campaign_id', campaignId);

      const { data } = await query;
      if (!data || data.length === 0) {
        csvContent = 'Keine Daten vorhanden';
        break;
      }

      const headers = ['Name', 'Code', 'Typ', 'Status', 'Poster-Version', 'Flyer-Version', 'Notizen', 'Installiert', 'Entfernt', 'Erstellt', 'Kampagne', 'Standort', 'Bezirk'];
      const rows = data.map((p: Record<string, unknown>) => {
        const c = p.campaign as { name: string } | null;
        const l = p.location as { venue_name: string; district: string | null } | null;
        return [
          p.name, p.placement_code, p.placement_type, p.status,
          p.poster_version || '', p.flyer_version || '', p.notes || '',
          p.installed_at || '', p.removed_at || '',
          (p.created_at as string).slice(0, 19),
          c?.name || '', l?.venue_name || '', l?.district || '',
        ];
      });

      csvContent = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
      break;
    }

    case 'events': {
      let query = supabase
        .from('redirect_events')
        .select('short_code, event_type, device_type, browser_family, os_family, destination_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
      if (campaignId) query = query.eq('campaign_id', campaignId);

      const { data } = await query;
      if (!data || data.length === 0) {
        csvContent = 'Keine Daten vorhanden';
        break;
      }

      const headers = ['Datum', 'Short Code', 'Event', 'Gerät', 'Browser', 'Betriebssystem', 'Ziel-URL'];
      const rows = data.map((e: Record<string, unknown>) => [
        (e.created_at as string).slice(0, 19),
        e.short_code, e.event_type, e.device_type || '',
        e.browser_family || '', e.os_family || '',
        sanitizeUrl(String(e.destination_url || '')),
      ]);

      csvContent = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
      break;
    }

    default:
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
  }

  const bom = '\ufeff';
  return new NextResponse(bom + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
