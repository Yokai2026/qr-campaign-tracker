import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getResend } from '@/lib/email/resend';
import { buildAlertHtml } from '@/lib/email/alert-html';
import type { AlertMetric } from '@/types';

export const dynamic = 'force-dynamic';

const METRIC_LABELS: Record<AlertMetric, string> = {
  total_scans: 'Scans gesamt',
  unique_visitors: 'Einzelne Besucher',
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const resend = getResend();
  const now = new Date();

  // Find active alerts
  const { data: alerts } = await supabase
    .from('scan_alerts')
    .select('*, campaign:campaigns(id, name)')
    .eq('active', true);

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    try {
      // Cooldown check
      if (alert.last_triggered_at) {
        const lastTriggered = new Date(alert.last_triggered_at);
        const cooldownMs = alert.cooldown_hours * 60 * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) continue;
      }

      const metric = alert.metric as AlertMetric;
      const currentValue = await getMetricValue(supabase, metric, alert.campaign_id);

      if (currentValue < alert.threshold) continue;

      // Threshold exceeded — send alert
      const campaignName = alert.campaign?.name || null;
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/analytics${alert.campaign_id ? `?campaign=${alert.campaign_id}` : ''}`
        : 'https://spurig.com/analytics';

      const html = buildAlertHtml({
        metricLabel: METRIC_LABELS[metric],
        currentValue,
        threshold: alert.threshold,
        campaignName,
        dashboardUrl,
      });

      const subject = campaignName
        ? `Spurig Alert: ${METRIC_LABELS[metric]} >= ${alert.threshold} (${campaignName})`
        : `Spurig Alert: ${METRIC_LABELS[metric]} >= ${alert.threshold}`;

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'alerts@spurig.com';

      await resend.emails.send({
        from: `Spurig <${fromEmail}>`,
        to: alert.email,
        subject,
        html,
      });

      // Update last_triggered_at
      await supabase
        .from('scan_alerts')
        .update({
          last_triggered_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', alert.id);

      sent++;
    } catch (err) {
      errors.push(`${alert.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({
    checked: alerts.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

async function getMetricValue(
  supabase: SupabaseClient,
  metric: AlertMetric,
  campaignId: string | null,
): Promise<number> {
  let query = supabase
    .from('redirect_events')
    .select('id, ip_hash', { count: 'exact' })
    .eq('event_type', 'qr_open');

  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, count } = await query;

  if (metric === 'total_scans') {
    return count ?? 0;
  }

  // unique_visitors: count distinct ip_hash values
  const uniqueHashes = new Set(
    (data || []).map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean),
  );
  return uniqueHashes.size;
}
