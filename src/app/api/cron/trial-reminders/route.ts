import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Sendet Reminder-Mails an User deren Trial in den nächsten 24-48h endet.
 * Idempotent: Markiert User mit `trial_reminder_sent_at` damit kein User
 * mehrfach getriggert wird.
 *
 * Aufruf: Vercel-Cron täglich 09:00 UTC.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServiceClient();
  const now = Date.now();
  const in24h = new Date(now + 24 * 3_600_000).toISOString();
  const in48h = new Date(now + 48 * 3_600_000).toISOString();

  // User die im Fenster 24-48h Trial-Ende haben UND noch keine Sub UND noch nicht erinnert wurden
  const { data: candidates, error } = await sb
    .from('profiles')
    .select('id, email, username, trial_ends_at, trial_reminder_sent_at')
    .gte('trial_ends_at', in24h)
    .lte('trial_ends_at', in48h)
    .is('trial_reminder_sent_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  // Filter: nur ohne aktive Sub
  const userIds = candidates.map((c) => c.id);
  const { data: subs } = await sb
    .from('subscriptions')
    .select('user_id, status')
    .in('user_id', userIds)
    .in('status', ['active', 'on_trial', 'past_due']);
  const usersWithSub = new Set((subs ?? []).map((s) => s.user_id));
  const toRemind = candidates.filter((c) => !usersWithSub.has(c.id));

  let sent = 0;
  const errors: string[] = [];
  for (const u of toRemind) {
    try {
      const trialEnd = new Date(u.trial_ends_at!);
      const dateLabel = trialEnd.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
      await sendEmail({
        to: u.email,
        subject: 'Dein Spurig-Trial endet morgen',
        html: buildTrialReminderHtml({
          username: u.username ?? '',
          trialEndDate: dateLabel,
        }),
      });
      // Marker setzen
      await sb
        .from('profiles')
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq('id', u.id);
      sent++;
    } catch (e) {
      errors.push(`${u.email}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  return NextResponse.json({
    checked: candidates.length,
    eligible: toRemind.length,
    sent,
    errors,
  });
}

function buildTrialReminderHtml(input: { username: string; trialEndDate: string }): string {
  const greeting = input.username ? `Hi ${input.username}` : 'Hi';
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Dein Trial endet morgen</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#22d3ee15;border:1px solid #22d3ee40;color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">
      Spurig
    </div>
    <h1 style="margin:24px 0 8px;font-size:28px;font-weight:600;line-height:1.2;color:#fff">
      ${greeting}, dein Trial endet morgen
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3">
      Deine kostenlose Testphase läuft am <strong style="color:#fff">${input.trialEndDate}</strong> aus.
      Wenn du Spurig weiter nutzen willst, sicher dir jetzt einen Plan — sonst kannst du
      ab morgen keine neuen QR-Codes oder Kurzlinks mehr erstellen.
    </p>
    <div style="background:#171717;border:1px solid #262626;border-radius:14px;padding:20px;margin-bottom:24px">
      <div style="margin-bottom:12px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#737373;margin-bottom:4px">Neukunden-Angebot</div>
        <div style="font-size:24px;font-weight:600;color:#fff">5,99 € / Monat <span style="font-size:14px;color:#737373;font-weight:400">statt 12,99 €</span></div>
        <div style="font-size:12px;color:#a3a3a3;margin-top:4px">Erste 3 Monate · automatischer Coupon · jederzeit kündbar</div>
      </div>
      <a href="https://spurig.com/settings"
        style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
        Jetzt Plan wählen →
      </a>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#737373">
      Du hast schon Daten in deinem Account: bestehende QR-Codes & Links bleiben weiterhin aktiv,
      auch nach Trial-Ende. Nur Neu-Erstellung ist gesperrt bis du upgradest.
    </p>
    <hr style="border:none;border-top:1px solid #262626;margin:32px 0" />
    <p style="margin:0;font-size:11px;line-height:1.6;color:#525252">
      Fragen? Antworte einfach auf diese Mail oder schreib an <a href="mailto:support@spurig.com" style="color:#22d3ee">support@spurig.com</a>.<br />
      Du bekommst diese Erinnerung weil dein Spurig-Trial bald endet — eine einmalige Mail, nicht abonnierbar.
    </p>
  </div>
</body>
</html>`;
}
