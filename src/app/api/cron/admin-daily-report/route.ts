import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'tomatenkopf36@gmail.com';

/**
 * Daily Admin Report — schickt um 08:00 UTC eine Zusammenfassung der letzten 24h
 * + offene At-Risk-Items an den Admin. Spart tägliches Admin-Panel-Klicken.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServiceClient();
  const now = Date.now();
  const yesterdayIso = new Date(now - 86_400_000).toISOString();
  const yesterdayDate = new Date(now - 86_400_000).toISOString().slice(0, 10);
  const todayDate = new Date(now).toISOString().slice(0, 10);

  // ============ Daten parallel holen ============
  const [
    newSignupsRes,
    newSubsRes,
    cancelledRes,
    trialsEndingRes,
    pastDueRes,
    snapshotTodayRes,
    snapshotYesterdayRes,
  ] = await Promise.all([
    sb
      .from('profiles')
      .select('id, email, username, created_at, trial_ends_at')
      .gte('created_at', yesterdayIso)
      .order('created_at', { ascending: false }),
    sb
      .from('subscriptions')
      .select('user_id, status, stripe_price_id, created_at, profiles:user_id(email, username)')
      .gte('created_at', yesterdayIso)
      .in('status', ['active', 'on_trial']),
    sb
      .from('subscriptions')
      .select('user_id, status, stripe_price_id, updated_at, cancel_at, cancellation_reason, profiles:user_id(email, username)')
      .gte('updated_at', yesterdayIso)
      .or('status.eq.cancelled,status.eq.expired,cancel_at.not.is.null')
      .order('updated_at', { ascending: false })
      .limit(20),
    sb
      .from('profiles')
      .select('id, email, username, trial_ends_at')
      .gte('trial_ends_at', new Date(now).toISOString())
      .lte('trial_ends_at', new Date(now + 3 * 86_400_000).toISOString()),
    sb
      .from('subscriptions')
      .select('user_id, profiles:user_id(email, username)')
      .eq('status', 'past_due'),
    sb.from('mrr_snapshots').select('mrr_total_eur, paying_count').eq('snapshot_date', todayDate).maybeSingle(),
    sb.from('mrr_snapshots').select('mrr_total_eur, paying_count').eq('snapshot_date', yesterdayDate).maybeSingle(),
  ]);

  const newSignups = newSignupsRes.data ?? [];
  const newSubs = newSubsRes.data ?? [];
  const cancelled = cancelledRes.data ?? [];
  const trialsEnding = trialsEndingRes.data ?? [];
  const pastDue = pastDueRes.data ?? [];
  const snapshotToday = snapshotTodayRes.data;
  const snapshotYesterday = snapshotYesterdayRes.data;

  // Filter Trials ohne aktive Sub
  const trialUserIds = trialsEnding.map((t) => t.id);
  let trialsWithoutSub: typeof trialsEnding = trialsEnding;
  if (trialUserIds.length > 0) {
    const { data: existingSubs } = await sb
      .from('subscriptions')
      .select('user_id')
      .in('user_id', trialUserIds)
      .in('status', ['active', 'on_trial', 'past_due']);
    const subbedIds = new Set((existingSubs ?? []).map((s) => s.user_id));
    trialsWithoutSub = trialsEnding.filter((t) => !subbedIds.has(t.id));
  }

  const mrrDelta = snapshotToday && snapshotYesterday
    ? Number(snapshotToday.mrr_total_eur) - Number(snapshotYesterday.mrr_total_eur)
    : null;
  const payingDelta = snapshotToday && snapshotYesterday
    ? snapshotToday.paying_count - snapshotYesterday.paying_count
    : null;

  const stats = {
    newSignups: newSignups.length,
    newSubs: newSubs.length,
    cancelled: cancelled.length,
    trialsEndingIn3d: trialsWithoutSub.length,
    pastDue: pastDue.length,
    mrrCurrent: snapshotToday ? Number(snapshotToday.mrr_total_eur) : null,
    mrrDelta,
    payingCurrent: snapshotToday?.paying_count ?? null,
    payingDelta,
  };

  // Mail nur senden wenn was Bemerkenswertes passiert ist ODER es ist Montag (Wochen-Review)
  const isMonday = new Date(now).getUTCDay() === 1;
  const hasNoise =
    stats.newSignups > 0 ||
    stats.newSubs > 0 ||
    stats.cancelled > 0 ||
    stats.pastDue > 0 ||
    stats.trialsEndingIn3d > 0;

  if (!hasNoise && !isMonday) {
    return NextResponse.json({ ok: true, sent: false, reason: 'no_activity', stats });
  }

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: buildSubject(stats),
      html: buildReportHtml({ stats, newSignups, newSubs, cancelled, trialsEnding: trialsWithoutSub, pastDue }),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Send failed', stats },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sent: true, stats });
}

function buildSubject(s: { newSignups: number; newSubs: number; cancelled: number; mrrDelta: number | null }): string {
  const parts: string[] = [];
  if (s.newSubs > 0) parts.push(`${s.newSubs} neue Subs`);
  if (s.newSignups > 0) parts.push(`${s.newSignups} Signups`);
  if (s.cancelled > 0) parts.push(`${s.cancelled} Cancels`);
  if (s.mrrDelta !== null && Math.abs(s.mrrDelta) > 0.01) {
    parts.push(`MRR ${s.mrrDelta >= 0 ? '+' : ''}${s.mrrDelta.toFixed(2)} €`);
  }
  const summary = parts.length > 0 ? parts.join(' · ') : 'Tagesreport';
  return `Spurig · ${summary}`;
}

type ProfileLite = { email: string; username: string | null } | { email: string; username: string | null }[] | null;
type ReportData = {
  stats: {
    newSignups: number;
    newSubs: number;
    cancelled: number;
    trialsEndingIn3d: number;
    pastDue: number;
    mrrCurrent: number | null;
    mrrDelta: number | null;
    payingCurrent: number | null;
    payingDelta: number | null;
  };
  newSignups: Array<{ id: string; email: string; username: string | null; created_at: string }>;
  newSubs: Array<{ user_id: string; status: string; stripe_price_id: string | null; created_at: string; profiles: ProfileLite }>;
  cancelled: Array<{
    user_id: string;
    status: string;
    stripe_price_id: string | null;
    updated_at: string;
    cancel_at: string | null;
    cancellation_reason: string | null;
    profiles: ProfileLite;
  }>;
  trialsEnding: Array<{ id: string; email: string; username: string | null; trial_ends_at: string | null }>;
  pastDue: Array<{ user_id: string; profiles: ProfileLite }>;
};

function pickProfile(p: ProfileLite): { email: string; username: string | null } | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

function buildReportHtml(d: ReportData): string {
  const { stats } = d;
  const dateLabel = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const row = (label: string, value: string, color = '#fff') => `
    <tr>
      <td style="padding:6px 0;color:#a3a3a3;font-size:13px">${label}</td>
      <td style="padding:6px 0;color:${color};font-size:14px;font-weight:600;text-align:right;font-variant-numeric:tabular-nums">${value}</td>
    </tr>`;

  const list = (title: string, items: Array<{ email: string; username: string | null; note?: string }>) => {
    if (items.length === 0) return '';
    return `
      <div style="margin-top:20px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#737373;margin-bottom:8px">${title}</div>
        <table style="width:100%;border-collapse:collapse;background:#171717;border:1px solid #262626;border-radius:8px;overflow:hidden">
          ${items.slice(0, 10).map((u, i) => `
            <tr style="${i > 0 ? 'border-top:1px solid #262626' : ''}">
              <td style="padding:8px 12px;font-size:13px;color:#fff">${u.email}${u.username ? `<span style="color:#737373"> · @${u.username}</span>` : ''}</td>
              ${u.note ? `<td style="padding:8px 12px;font-size:11.5px;color:#a3a3a3;text-align:right">${u.note}</td>` : ''}
            </tr>`).join('')}
        </table>
        ${items.length > 10 ? `<div style="margin-top:6px;font-size:11px;color:#737373">+ ${items.length - 10} weitere</div>` : ''}
      </div>`;
  };

  const mrrColor =
    stats.mrrDelta === null
      ? '#fff'
      : stats.mrrDelta > 0
        ? '#10b981'
        : stats.mrrDelta < 0
          ? '#ef4444'
          : '#fff';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Spurig Tagesreport</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#22d3ee15;border:1px solid #22d3ee40;color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">
      Spurig · Admin · Tagesreport
    </div>
    <h1 style="margin:18px 0 6px;font-size:22px;font-weight:600;color:#fff">${dateLabel}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#a3a3a3">Aktivität in den letzten 24 Stunden + offene Actions.</p>

    <div style="background:#171717;border:1px solid #262626;border-radius:14px;padding:20px;margin-bottom:18px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#737373;margin-bottom:10px">Heute</div>
      <table style="width:100%;border-collapse:collapse">
        ${row('Neue Signups (24h)', stats.newSignups.toString())}
        ${row('Neue Subscriptions', stats.newSubs.toString(), stats.newSubs > 0 ? '#10b981' : '#fff')}
        ${row('Kündigungen', stats.cancelled.toString(), stats.cancelled > 0 ? '#ef4444' : '#a3a3a3')}
        ${stats.payingCurrent !== null ? row('Zahlende Kunden', `${stats.payingCurrent}${stats.payingDelta !== null && stats.payingDelta !== 0 ? ` (${stats.payingDelta > 0 ? '+' : ''}${stats.payingDelta})` : ''}`) : ''}
        ${stats.mrrCurrent !== null ? row('MRR netto', `${stats.mrrCurrent.toFixed(2)} €${stats.mrrDelta !== null && Math.abs(stats.mrrDelta) > 0.01 ? ` (${stats.mrrDelta >= 0 ? '+' : ''}${stats.mrrDelta.toFixed(2)})` : ''}`, mrrColor) : ''}
      </table>
    </div>

    ${stats.trialsEndingIn3d > 0 || stats.pastDue > 0 ? `
    <div style="background:#451a03;border:1px solid #92400e;border-radius:14px;padding:20px;margin-bottom:18px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#fbbf24;margin-bottom:10px">⚠️ Aktion empfohlen</div>
      <table style="width:100%;border-collapse:collapse">
        ${stats.trialsEndingIn3d > 0 ? row('Trial endet in 3T', `${stats.trialsEndingIn3d} User`, '#fbbf24') : ''}
        ${stats.pastDue > 0 ? row('Zahlung offen (past_due)', `${stats.pastDue} User`, '#ef4444') : ''}
      </table>
    </div>` : ''}

    ${list('Neue Signups', d.newSignups.map((u) => ({
      email: u.email,
      username: u.username,
      note: `vor ${Math.round((Date.now() - new Date(u.created_at).getTime()) / 3_600_000)}h`,
    })))}

    ${list('Neue Subscriptions', d.newSubs.map((s) => ({
      email: pickProfile(s.profiles)?.email ?? '?',
      username: pickProfile(s.profiles)?.username ?? null,
      note: s.stripe_price_id === process.env.STRIPE_YEARLY_PRICE_ID ? 'Jährlich' : 'Monatlich',
    })))}

    ${list('Kündigungen / Auslaufend', d.cancelled.map((c) => ({
      email: pickProfile(c.profiles)?.email ?? '?',
      username: pickProfile(c.profiles)?.username ?? null,
      note: c.cancellation_reason ? `${c.cancellation_reason}` : c.cancel_at ? 'läuft aus' : 'gekündigt',
    })))}

    ${list('Trials enden in 3 Tagen', d.trialsEnding.map((t) => ({
      email: t.email,
      username: t.username,
      note: t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '',
    })))}

    ${list('Zahlung offen (past_due)', d.pastDue.map((p) => ({
      email: pickProfile(p.profiles)?.email ?? '?',
      username: pickProfile(p.profiles)?.username ?? null,
    })))}

    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #262626">
      <a href="https://spurig.com/admin" style="display:inline-block;padding:10px 16px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px">
        → Admin-Panel öffnen
      </a>
    </div>

    <p style="margin-top:24px;font-size:11px;color:#525252;line-height:1.6">
      Dieser Tagesreport wird automatisch um 08:00 UTC erzeugt. Wenn nichts passiert ist, bekommst du keine Mail (Montags gibt's einen Wochen-Review).<br />
      Anpassen via <code style="color:#a3a3a3">ADMIN_NOTIFICATION_EMAIL</code> in den Vercel-Env-Vars.
    </p>
  </div>
</body>
</html>`;
}
