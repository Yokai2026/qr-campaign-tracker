import { NextRequest } from 'next/server';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

// Liefert aggregierte Analytics-Daten fuer den authentifizierten User.
// Query-Params:
//   from        ISO-Date (default: heute - 30 Tage)
//   to          ISO-Date (default: heute)
//   campaign_id Optional Campaign-Filter
//   source      'qr' | 'link' | 'all'  (default: 'all')
export async function GET(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(req.url);
  const today = new Date();
  const thirtyAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateFrom = searchParams.get('from') || thirtyAgo.toISOString().slice(0, 10);
  const dateTo = searchParams.get('to') || today.toISOString().slice(0, 10);
  const campaignId = searchParams.get('campaign_id');
  const source = (searchParams.get('source') || 'all') as 'qr' | 'link' | 'all';

  const eventTypes = source === 'qr' ? ['qr_open'] : source === 'link' ? ['link_open'] : ['qr_open', 'link_open'];
  const fromIso = `${dateFrom}T00:00:00Z`;
  const toIso = `${dateTo}T23:59:59Z`;

  const sb = serviceRoleClient();

  // Wir muessen die Events des Users laden — dafuer filtern wir ueber
  // die Owner-Tabellen (qr_codes.created_by oder short_links.created_by).
  // Subselects via .in() funktionieren mit Service-Role-Client.
  const [{ data: ownedQrs }, { data: ownedLinks }, { data: ownedCampaigns }] = await Promise.all([
    sb.from('qr_codes').select('id').eq('created_by', auth.userId),
    sb.from('short_links').select('id').eq('created_by', auth.userId),
    sb.from('campaigns').select('id').eq('owner_id', auth.userId),
  ]);
  const qrIds = (ownedQrs ?? []).map((r: { id: string }) => r.id);
  const linkIds = (ownedLinks ?? []).map((r: { id: string }) => r.id);
  const campaignIds = (ownedCampaigns ?? []).map((r: { id: string }) => r.id);

  let q = sb
    .from('redirect_events')
    .select('event_type, ip_hash, created_at, qr_code_id, short_link_id, campaign_id, country, device_type', { count: 'exact' })
    .in('event_type', eventTypes)
    .eq('is_bot', false)
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (campaignId) q = q.eq('campaign_id', campaignId);

  // Owner-Scope: Event gehoert zum User wenn EINE der drei FKs auf seinen
  // Pool zeigt. Wir filtern in zwei Pass durch OR-Konstruktion:
  // (qr_code_id IN owned OR short_link_id IN owned OR campaign_id IN owned)
  if (qrIds.length || linkIds.length || campaignIds.length) {
    const ors: string[] = [];
    if (qrIds.length) ors.push(`qr_code_id.in.(${qrIds.join(',')})`);
    if (linkIds.length) ors.push(`short_link_id.in.(${linkIds.join(',')})`);
    if (campaignIds.length) ors.push(`campaign_id.in.(${campaignIds.join(',')})`);
    q = q.or(ors.join(','));
  } else {
    // Keine eigenen Resourcen → keine Events
    return apiOk({
      data: {
        date_from: dateFrom, date_to: dateTo,
        kpis: { total_opens: 0, qr_scans: 0, link_clicks: 0, unique_visitors: 0 },
        time_series: [],
        top_countries: [],
        top_devices: [],
      },
    });
  }

  const { data: events, error } = await q;
  if (error) return apiError(500, error.message);
  const evts = events || [];

  // KPIs
  const qrScans = evts.filter((e) => e.event_type === 'qr_open').length;
  const linkClicks = evts.filter((e) => e.event_type === 'link_open').length;
  const uniqueVisitors = new Set(evts.map((e) => e.ip_hash).filter(Boolean)).size;

  // Time-Series: alle Tage im Range, Default 0
  const dayMap: Record<string, { qr: number; link: number }> = {};
  const start = new Date(fromIso);
  const end = new Date(toIso);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dayMap[d.toISOString().slice(0, 10)] = { qr: 0, link: 0 };
  }
  evts.forEach((e) => {
    const day = String(e.created_at).slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { qr: 0, link: 0 };
    if (e.event_type === 'qr_open') dayMap[day].qr++;
    else if (e.event_type === 'link_open') dayMap[day].link++;
  });
  const timeSeries = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({ date, qr_scans: val.qr, link_clicks: val.link }));

  // Top-Countries
  const cMap: Record<string, number> = {};
  evts.forEach((e) => {
    const c = e.country?.toString();
    if (c && c.length === 2) cMap[c.toUpperCase()] = (cMap[c.toUpperCase()] || 0) + 1;
  });
  const topCountries = Object.entries(cMap)
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Top-Devices
  const dMap: Record<string, number> = {};
  evts.forEach((e) => {
    const dev = (e.device_type as string) || 'unknown';
    dMap[dev] = (dMap[dev] || 0) + 1;
  });
  const topDevices = Object.entries(dMap)
    .sort(([, a], [, b]) => b - a)
    .map(([device, count]) => ({ device, count }));

  return apiOk({
    data: {
      date_from: dateFrom,
      date_to: dateTo,
      kpis: {
        total_opens: evts.length,
        qr_scans: qrScans,
        link_clicks: linkClicks,
        unique_visitors: uniqueVisitors,
      },
      time_series: timeSeries,
      top_countries: topCountries,
      top_devices: topDevices,
    },
  });
}
