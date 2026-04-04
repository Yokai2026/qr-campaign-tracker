import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getResend } from '@/lib/email/resend';
import { buildReportHtml } from '@/lib/email/report-html';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import type { ReportFrequency } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const resend = getResend();
  const now = new Date().toISOString();

  // Find due schedules
  const { data: schedules } = await supabase
    .from('report_schedules')
    .select('*, campaign:campaigns(id, name)')
    .eq('active', true)
    .lte('next_run_at', now);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const dateRange = getDateRange(schedule.frequency as ReportFrequency);
      const reportData = await gatherReportData(supabase, dateRange.from, dateRange.to, schedule.campaign_id);

      const campaignName = schedule.campaign?.name || null;
      const html = buildReportHtml({
        dateFrom: format(dateRange.from, 'dd.MM.yyyy'),
        dateTo: format(dateRange.to, 'dd.MM.yyyy'),
        campaignName,
        ...reportData,
      });

      const subject = campaignName
        ? `QR Report: ${campaignName} (${format(dateRange.from, 'dd.MM.')} - ${format(dateRange.to, 'dd.MM.')})`
        : `QR Report: Alle Kampagnen (${format(dateRange.from, 'dd.MM.')} - ${format(dateRange.to, 'dd.MM.')})`;

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'reports@qr-tracker.app';

      await resend.emails.send({
        from: `QR Tracker <${fromEmail}>`,
        to: schedule.email,
        subject,
        html,
      });

      // Update schedule
      const nextRun = computeNextRun(schedule.frequency as ReportFrequency);
      await supabase
        .from('report_schedules')
        .update({
          last_sent_at: now,
          next_run_at: nextRun.toISOString(),
          updated_at: now,
        })
        .eq('id', schedule.id);

      sent++;
    } catch (err) {
      errors.push(`${schedule.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}

function getDateRange(frequency: ReportFrequency): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  let from: Date;
  switch (frequency) {
    case 'daily':
      from = subDays(to, 1);
      break;
    case 'weekly':
      from = subWeeks(to, 1);
      break;
    case 'monthly':
      from = subMonths(to, 1);
      break;
  }
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function computeNextRun(frequency: ReportFrequency): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1);
      break;
  }
  return next;
}

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

async function gatherReportData(
  supabase: SupabaseClient,
  from: Date,
  to: Date,
  campaignId: string | null
) {
  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  // Redirect events
  let redirectQuery = supabase
    .from('redirect_events')
    .select('id, ip_hash, country, placement_id, placements(name), event_type')
    .eq('event_type', 'qr_open')
    .gte('created_at', fromStr)
    .lte('created_at', toStr);

  if (campaignId) redirectQuery = redirectQuery.eq('campaign_id', campaignId);
  const { data: redirects } = await redirectQuery;
  const events = redirects || [];

  // Page events
  let pageQuery = supabase
    .from('page_events')
    .select('id, event_type')
    .gte('created_at', fromStr)
    .lte('created_at', toStr);

  if (campaignId) pageQuery = pageQuery.eq('campaign_id', campaignId);
  const { data: pageEvents } = await pageQuery;

  const totalScans = events.length;
  const uniqueVisitors = new Set(events.map((e: Record<string, unknown>) => e.ip_hash).filter(Boolean)).size;
  const ctaClicks = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'cta_click').length;
  const formSubmits = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'form_submit').length;

  // Top placements
  const placeMap = new Map<string, { name: string; scans: number }>();
  for (const e of events) {
    const ev = e as Record<string, unknown>;
    const pid = ev.placement_id as string;
    if (!pid) continue;
    const existing = placeMap.get(pid);
    if (existing) {
      existing.scans++;
    } else {
      const p = ev.placements as { name: string } | null;
      placeMap.set(pid, { name: p?.name || 'Unbekannt', scans: 1 });
    }
  }
  const topPlacements = [...placeMap.values()].sort((a, b) => b.scans - a.scans);

  // Top countries
  const countryMap = new Map<string, number>();
  for (const e of events) {
    const country = (e as Record<string, unknown>).country as string | null;
    if (!country) continue;
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }
  const topCountries = [...countryMap.entries()]
    .map(([name, scans]) => ({ name, scans }))
    .sort((a, b) => b.scans - a.scans);

  return { totalScans, uniqueVisitors, ctaClicks, formSubmits, topPlacements, topCountries };
}
