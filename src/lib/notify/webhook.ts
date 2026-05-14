/**
 * Generic Webhook-Notifier — postet Lifecycle-Events an Discord, Slack oder Telegram.
 *
 * Konfiguration via Env-Vars:
 *   - DISCORD_WEBHOOK_URL — wenn gesetzt, wird Discord-Format gepostet
 *   - SLACK_WEBHOOK_URL   — wenn gesetzt, wird Slack-Format gepostet
 *   - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — wenn beide gesetzt, wird Telegram gepostet
 *   - beliebige Kombi: postet an alle konfigurierten gleichzeitig
 *   - keiner gesetzt: No-Op (kein Crash)
 */

export type NotifyLevel = 'info' | 'success' | 'warn' | 'error';

export type NotifyPayload = {
  title: string;
  description?: string;
  level?: NotifyLevel;
  /** Key-Value-Felder die als Liste angezeigt werden. */
  fields?: Array<{ name: string; value: string }>;
  /** Optionaler Link der ans Ende gehängt wird. */
  url?: string;
};

const LEVEL_COLOR: Record<NotifyLevel, number> = {
  info: 0x22d3ee, // brand teal
  success: 0x10b981, // emerald
  warn: 0xf59e0b, // amber
  error: 0xef4444, // red
};

const LEVEL_EMOJI: Record<NotifyLevel, string> = {
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌',
};

/**
 * Schickt ein Event an alle konfigurierten Webhooks. Fail-soft: Errors werden
 * geloggt aber nie hochgereicht — Notifications dürfen nichts blockieren.
 */
export async function notifyLifecycle(payload: NotifyPayload): Promise<void> {
  const level = payload.level ?? 'info';
  const tasks: Promise<unknown>[] = [];

  if (process.env.DISCORD_WEBHOOK_URL) {
    tasks.push(postDiscord(process.env.DISCORD_WEBHOOK_URL, payload, level));
  }
  if (process.env.SLACK_WEBHOOK_URL) {
    tasks.push(postSlack(process.env.SLACK_WEBHOOK_URL, payload, level));
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    tasks.push(
      postTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, payload, level),
    );
  }

  if (tasks.length === 0) return;

  try {
    await Promise.allSettled(tasks);
  } catch (e) {
    // Fail-soft — nicht loggen wenn keine sentry da ist
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[notifyLifecycle] failed:', e);
    }
  }
}

async function postDiscord(url: string, p: NotifyPayload, level: NotifyLevel) {
  const embed = {
    title: `${LEVEL_EMOJI[level]} ${p.title}`,
    description: p.description ?? undefined,
    color: LEVEL_COLOR[level],
    fields: p.fields?.map((f) => ({ name: f.name, value: f.value, inline: true })) ?? undefined,
    url: p.url ?? undefined,
    timestamp: new Date().toISOString(),
    footer: { text: 'Spurig · Admin' },
  };
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function postTelegram(
  token: string,
  chatId: string,
  p: NotifyPayload,
  level: NotifyLevel,
) {
  // Telegram HTML-Format. Escape um Injection via User-Daten zu verhindern.
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines: string[] = [];
  lines.push(`<b>${LEVEL_EMOJI[level]} ${esc(p.title)}</b>`);
  if (p.description) {
    lines.push('');
    lines.push(esc(p.description));
  }
  if (p.fields && p.fields.length > 0) {
    lines.push('');
    for (const f of p.fields) {
      lines.push(`<b>${esc(f.name)}:</b> ${esc(f.value)}`);
    }
  }
  if (p.url) {
    lines.push('');
    lines.push(`<a href="${esc(p.url)}">Im Admin öffnen →</a>`);
  }

  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

async function postSlack(url: string, p: NotifyPayload, level: NotifyLevel) {
  const colorHex =
    level === 'success'
      ? '#10b981'
      : level === 'warn'
      ? '#f59e0b'
      : level === 'error'
      ? '#ef4444'
      : '#22d3ee';

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${LEVEL_EMOJI[level]} ${p.title}`, emoji: true },
    },
  ];
  if (p.description) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: p.description } });
  }
  if (p.fields && p.fields.length > 0) {
    blocks.push({
      type: 'section',
      fields: p.fields.map((f) => ({ type: 'mrkdwn', text: `*${f.name}:*\n${f.value}` })),
    });
  }
  if (p.url) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Öffnen' },
          url: p.url,
        },
      ],
    });
  }

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{ color: colorHex, blocks }],
    }),
  });
}
