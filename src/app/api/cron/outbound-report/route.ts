import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyLifecycle } from '@/lib/notify/webhook';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily 18:00 UTC: Telegram-Tagesreport für Outbound-Pipeline.
 * Was heute passiert: gescraped, discovered, sent, geöffnet, geantwortet.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServiceClient();
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayStartIso = dayStart.toISOString();

  const [scrapedRes, discoveredRes, sentRes, openedRes, repliedRes, totalLeadsRes, queuedRes] =
    await Promise.all([
      sb
        .from('outbound_leads')
        .select('id', { count: 'exact', head: true })
        .gte('scraped_at', dayStartIso),
      sb
        .from('outbound_leads')
        .select('id', { count: 'exact', head: true })
        .eq('email_status', 'discovered')
        .gte('updated_at', dayStartIso),
      sb
        .from('outbound_messages')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', dayStartIso),
      sb
        .from('outbound_messages')
        .select('id', { count: 'exact', head: true })
        .not('opened_at', 'is', null)
        .gte('sent_at', dayStartIso),
      sb
        .from('outbound_messages')
        .select('id', { count: 'exact', head: true })
        .not('replied_at', 'is', null)
        .gte('replied_at', dayStartIso),
      sb.from('outbound_leads').select('id', { count: 'exact', head: true }),
      sb
        .from('outbound_leads')
        .select('id', { count: 'exact', head: true })
        .eq('email_status', 'discovered')
        .eq('status', 'new'),
    ]);

  const stats = {
    scraped: scrapedRes.count ?? 0,
    discovered: discoveredRes.count ?? 0,
    sent: sentRes.count ?? 0,
    opened: openedRes.count ?? 0,
    replied: repliedRes.count ?? 0,
    totalLeads: totalLeadsRes.count ?? 0,
    queuedToSend: queuedRes.count ?? 0,
  };

  // Nur Telegram senden wenn was passiert ist
  const isActive = stats.scraped > 0 || stats.sent > 0 || stats.replied > 0;
  if (!isActive) {
    return NextResponse.json({ ok: true, sent: false, reason: 'no_activity', stats });
  }

  const fields: Array<{ name: string; value: string }> = [
    { name: 'Heute gescraped', value: String(stats.scraped) },
    { name: 'Heute discovered', value: String(stats.discovered) },
    { name: 'Heute versendet', value: String(stats.sent) },
    { name: 'Heute geöffnet', value: String(stats.opened) },
    { name: 'Heute geantwortet', value: String(stats.replied) },
    { name: 'Queue (versand-bereit)', value: String(stats.queuedToSend) },
    { name: 'Total Leads', value: String(stats.totalLeads) },
  ];

  await notifyLifecycle({
    title: 'Outbound-Pipeline Tagesreport',
    description: stats.replied > 0 ? '🎉 ' + stats.replied + ' Replies heute!' : undefined,
    level: stats.replied > 0 ? 'success' : 'info',
    fields,
    url: 'https://spurig.com/admin',
  });

  return NextResponse.json({ ok: true, sent: true, stats });
}
