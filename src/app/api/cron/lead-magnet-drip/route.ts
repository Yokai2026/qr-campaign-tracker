import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const FROM = process.env.OUTBOUND_FROM_EMAIL ?? 'David da Silva Gornik <david@hello.spurig.com>';
const REPLY_TO = process.env.OUTBOUND_REPLY_TO ?? 'david@spurig.com';

type DripStage = 'd1' | 'd3' | 'd7';
type StageConfig = {
  dayOffset: number;
  marker: 'drip_d1_sent_at' | 'drip_d3_sent_at' | 'drip_d7_sent_at';
  subject: string;
  html: () => string;
};

const STAGES: Record<DripStage, StageConfig> = {
  d1: {
    dayOffset: 1,
    marker: 'drip_d1_sent_at',
    subject: 'Hat die DSGVO-Checkliste gepasst?',
    html: () => buildDripHtml({
      hookHeadline: 'Hat die Checkliste gepasst?',
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Gestern hast du dir die DSGVO-Marketing-Tracking-Checkliste geholt. Kurze Frage:
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#e5e5e5">
          <strong>Wie viele der 14 Punkte habt ihr unabgehakt?</strong>
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Wenn's 3+ sind, hast du Compliance-Schulden. Wenn's 5+ sind, ist eine Aufsichtsbehoerden-Pruefung schon teuer.
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Antworte einfach auf diese Mail mit deiner Zahl. Ich schreibe persoenlich zurueck mit 1-2 konkreten Tipps wo du am meisten Risiko hast.
        </p>
      `,
      ctaText: 'Spurig 14 Tage gratis testen',
      ctaUrl: 'https://spurig.com/?utm_source=lead_magnet&utm_medium=email&utm_campaign=drip-d1',
    }),
  },
  d3: {
    dayOffset: 3,
    marker: 'drip_d3_sent_at',
    subject: 'Bitly ist kein Sicherheitsrisiko. Bis es eines wird.',
    html: () => buildDripHtml({
      hookHeadline: 'Eine kurze Geschichte zu Bitly.',
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          2024 hat eine deutsche Marketing-Agentur eine DSGVO-Pruefung bekommen. Bitly war in 3 Kunden-Kampagnen.
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#e5e5e5">
          Frage der Behoerde: <strong>"Wie sichern Sie ab, dass US-Behoerden nicht auf die Klick-Daten Ihrer EU-Kunden zugreifen?"</strong>
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Antwort: SCC-Standardvertragsklauseln. Aber seit Schrems II reicht das nicht mehr.
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Ergebnis: 6 Monate Migration-Stress, drei Kunden weg. Bussgeld vermieden, Vertrauen weg.
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#e5e5e5">
          Bitly wird nicht morgen verboten. Aber 2026 hat sich die Pruefungs-Dichte verdreifacht.
        </p>
      `,
      ctaText: 'Spurig vs. Bitly anschauen',
      ctaUrl: 'https://spurig.com/vergleich/bitly-alternative?utm_source=lead_magnet&utm_medium=email&utm_campaign=drip-d3',
    }),
  },
  d7: {
    dayOffset: 7,
    marker: 'drip_d7_sent_at',
    subject: 'Letzte Mail von mir (versprochen)',
    html: () => buildDripHtml({
      hookHeadline: 'Letzte Mail.',
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Du hast vor 7 Tagen die Checkliste geholt. Ich schreibe dir nicht weiter wenn du nicht antwortest — versprochen.
        </p>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#e5e5e5">
          Falls du Tracking + DSGVO ernst nimmst:
        </p>
        <ul style="margin:0 0 16px;padding-left:18px;font-size:14.5px;line-height:1.8;color:#a3a3a3">
          <li>14 Tage kostenlos testen, kein Trick</li>
          <li>Setup in 5 Min (oder 1 Min mit Migration-Helfer)</li>
          <li>Wenn's nicht passt: Loeschung mit 1 Klick</li>
        </ul>
        <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#a3a3a3">
          Falls nicht: alles gut. Dann hat dir hoffentlich wenigstens die Checkliste was gebracht. Und falls du Fragen hast — antworte einfach auf diese Mail.
        </p>
      `,
      ctaText: '14 Tage gratis testen',
      ctaUrl: 'https://spurig.com/signup?utm_source=lead_magnet&utm_medium=email&utm_campaign=drip-d7',
    }),
  },
};

/**
 * GET /api/cron/lead-magnet-drip
 *
 * Triggert taeglich. Sendet pro Subscriber maximal eine Mail:
 *  - Day 1: Soft-Follow-up
 *  - Day 3: Story zu Bitly
 *  - Day 7: Last-Mail
 *
 * Authentication: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });

  const sb = await createServiceClient();
  const now = Date.now();
  const day = 86_400_000;
  const result: Record<DripStage, { eligible: number; sent: number; errors: string[] }> = {
    d1: { eligible: 0, sent: 0, errors: [] },
    d3: { eligible: 0, sent: 0, errors: [] },
    d7: { eligible: 0, sent: 0, errors: [] },
  };

  for (const stage of ['d1', 'd3', 'd7'] as DripStage[]) {
    const cfg = STAGES[stage];
    const upper = new Date(now - cfg.dayOffset * day).toISOString();
    const lower = new Date(now - (cfg.dayOffset + 1) * day).toISOString();

    const { data: subs } = await sb
      .from('lead_magnet_subscribers')
      .select('id, email, magnet_slug, unsubscribed_at')
      .lte('created_at', upper)
      .gt('created_at', lower)
      .is(cfg.marker, null)
      .is('unsubscribed_at', null);

    if (!subs?.length) continue;
    result[stage].eligible = subs.length;

    for (const sub of subs) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM,
            to: [sub.email],
            reply_to: REPLY_TO,
            subject: cfg.subject,
            html: cfg.html(),
            tags: [
              { name: 'type', value: 'lead_magnet_drip' },
              { name: 'stage', value: stage },
            ],
            tracking: { opens: true, clicks: true },
          }),
        });
        if (!res.ok) {
          result[stage].errors.push(`${sub.email}: ${res.status}`);
          continue;
        }
        await sb
          .from('lead_magnet_subscribers')
          .update({ [cfg.marker]: new Date().toISOString() })
          .eq('id', sub.id);
        result[stage].sent++;
      } catch (e) {
        result[stage].errors.push(`${sub.email}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
  }

  return NextResponse.json({ triggeredAt: new Date().toISOString(), result });
}

function buildDripHtml(input: {
  hookHeadline: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:left;padding:0 8px 24px">
      <span style="font-size:18px;font-weight:700;color:#fafafa">Spurig</span>
    </div>
    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:28px">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#fafafa">${input.hookHeadline}</h1>
      ${input.bodyHtml}
      <a href="${input.ctaUrl}" style="display:inline-block;margin-top:12px;padding:12px 22px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">${input.ctaText} &rarr;</a>
      <p style="margin:24px 0 0;font-size:12px;color:#525252">
        David da Silva Gornik · Spurig · Berlin<br />
        Falls du nichts mehr von mir hoeren willst, antworte einfach mit "stop".
      </p>
    </div>
  </div>
</body>
</html>`;
}
