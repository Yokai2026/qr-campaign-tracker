import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

/**
 * POST /api/admin/sales-agent/classify
 * Body: { leadId?: string, replyText: string }
 *
 * Klassifiziert eine Reply auf eine Cold-Mail und draftet eine Antwort.
 * Klassifikation: interested | question | not_interested | unsubscribe | spam
 * Returnt: intent, confidence, summary, suggested_response, telegram_alert(bool)
 */
export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { leadId?: string; replyText?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  if (!body.replyText || body.replyText.trim().length < 5) {
    return NextResponse.json({ error: 'replyText required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

  // Optional Lead-Kontext laden
  let leadContext = '';
  if (body.leadId) {
    const service = await createServiceClient();
    const { data: lead } = await service
      .from('outbound_leads')
      .select('name, segment, city, email, status')
      .eq('id', body.leadId)
      .maybeSingle();
    if (lead) {
      leadContext = `\n\nKONTEXT - Lead:\n- Firma: ${lead.name}\n- Segment: ${lead.segment}\n- Stadt: ${lead.city ?? '?'}\n- Email: ${lead.email}\n- Aktueller Status: ${lead.status}`;
    }
  }

  const prompt = `Du bist Sales-Assistent fuer Spurig (DSGVO-konformes QR + Kurzlink-Tracking, DACH).

Deine Aufgabe: klassifiziere die Reply unten und drafte eine Antwort.${leadContext}

REPLY:
"""
${body.replyText.slice(0, 4000)}
"""

Klassifiziere genau einen Intent:
- "interested"      = Lead will mehr Info / Demo / Termin (heisses Lead!)
- "question"        = Lead hat konkrete Frage, noch unentschieden
- "not_interested"  = Lead lehnt freundlich ab (kein Interesse, kein Bedarf, später)
- "unsubscribe"     = Lead will keine weiteren Mails (Stop, Unsubscribe, Loeschung)
- "spam"            = Out-of-Office, Auto-Reply, irrelevant
- "other"           = Sonstiges

Drafte eine Antwort-Mail (deutsch, du-Form, max 4 Saetze):
- Bei "interested": kurz freuen + konkreten Naechsten-Schritt vorschlagen (15-Min-Call, Demo-Link)
- Bei "question": antworte konkret auf die Frage + sanfter Termin-Hinweis
- Bei "not_interested": respektvoll bedanken + Tuer offen halten ("falls sich was aendert")
- Bei "unsubscribe": kurze Bestaetigung dass aus Liste entfernt
- Bei "spam"/"other": gar keine Antwort drafte (return null)

Tone: persoenlich, kurz, keine Marketing-Phrasen, Du-Form, ehrlich.

Antwortet NUR mit JSON (kein Markdown):
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "summary": "1 Satz zusammenfassen was Lead schreibt",
  "suggested_response": "Antwort-Text oder null",
  "telegram_alert": true/false (true wenn intent=interested oder question mit hoher Konfidenz)
}`;

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Claude: ${res.status} ${err.slice(0, 200)}` }, { status: 500 });
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
    const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed: {
      intent: string;
      confidence: number;
      summary: string;
      suggested_response: string | null;
      telegram_alert: boolean;
    };
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      return NextResponse.json({ error: `JSON parse: ${(e as Error).message}` }, { status: 500 });
    }

    // Telegram-Alert wenn interested
    if (parsed.telegram_alert) {
      void notifyTelegram({
        intent: parsed.intent,
        confidence: parsed.confidence,
        summary: parsed.summary,
        leadId: body.leadId,
        replyPreview: body.replyText.slice(0, 200),
      });
    }

    // Lead-Status updaten wenn klassifiziert
    if (body.leadId) {
      const service = await createServiceClient();
      const statusMap: Record<string, string> = {
        interested: 'replied',
        question: 'replied',
        not_interested: 'uninterested',
        unsubscribe: 'do_not_contact',
      };
      const newStatus = statusMap[parsed.intent];
      if (newStatus) {
        await service
          .from('outbound_leads')
          .update({
            status: newStatus,
            replied_at: new Date().toISOString(),
            notes: parsed.summary,
          })
          .eq('id', body.leadId);
      }
    }

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

async function notifyTelegram(input: {
  intent: string;
  confidence: number;
  summary: string;
  leadId?: string;
  replyPreview: string;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const msg = `🎯 *Reply: ${input.intent}* (${Math.round(input.confidence * 100)}%)\n\n${input.summary}\n\n_${input.replyPreview}..._\n\n→ /admin/outbound`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    });
  } catch {
    // ignore
  }
}
