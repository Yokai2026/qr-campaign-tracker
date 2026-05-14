import { sendEmail } from './send';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'tomatenkopf36@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spurig.com';

type SignupPayload = {
  email: string;
  username: string | null;
  trialEndsAt: string | null;
};

type PaymentPayload = {
  email: string;
  username: string | null;
  plan: 'monthly' | 'yearly';
  amount: number; // EUR netto
};

type CancellationPayload = {
  email: string;
  username: string | null;
  plan: 'monthly' | 'yearly' | 'unknown';
  cancelAt: string | null;
};

function shell(title: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden">
    <div style="padding:18px 24px;border-bottom:1px solid #1f1f1f;background:#0d0d0d">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accentColor}"></span>
        <span style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#a3a3a3">Spurig Admin</span>
      </div>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">${title}</h1>
    </div>
    <div style="padding:20px 24px;font-size:13.5px;line-height:1.65;color:#d4d4d4">${body}</div>
    <div style="padding:14px 24px;border-top:1px solid #1f1f1f;background:#0d0d0d;font-size:11px;color:#737373">
      <a href="${APP_URL}/admin" style="color:#22d3ee;text-decoration:none">Im Admin-Panel ansehen &rarr;</a>
    </div>
  </div>
</div>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1f1f1f"><span style="color:#737373">${label}</span><span style="color:#e5e5e5;font-weight:500">${escapeHtml(value)}</span></div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/**
 * Sendet Admin-Notification asynchron — Failures werden geloggt aber NICHT propagiert,
 * damit ein hängendes n8n nie einen User-Flow (Signup, Payment) blockiert.
 */
async function safeSend(subject: string, html: string): Promise<void> {
  try {
    await sendEmail({ to: ADMIN_EMAIL, subject, html });
  } catch (err) {
    console.error('[admin-notify] failed:', err);
  }
}

export async function notifyAdminSignup(p: SignupPayload): Promise<void> {
  const trialDate = p.trialEndsAt
    ? new Date(p.trialEndsAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '–';
  const body = `
    <p style="margin:0 0 12px">Ein neuer User hat seine E-Mail bestätigt und ist startklar.</p>
    <div style="margin-top:8px">
      ${row('E-Mail', p.email)}
      ${row('Benutzername', p.username ?? '–')}
      ${row('Trial endet am', trialDate)}
    </div>`;
  await safeSend(`[Spurig] Neuer Trial-User: ${p.email}`, shell('Neue Registrierung', '#22d3ee', body));
}

export async function notifyAdminPayment(p: PaymentPayload): Promise<void> {
  const planLabel = p.plan === 'yearly' ? 'Jährlich' : 'Monatlich';
  const amountText = `${p.amount.toFixed(2).replace('.', ',')} € netto / Mo`;
  const body = `
    <p style="margin:0 0 12px"><strong style="color:#10b981">Zahlung eingegangen.</strong> Stripe hat den Checkout abgeschlossen.</p>
    <div style="margin-top:8px">
      ${row('E-Mail', p.email)}
      ${row('Benutzername', p.username ?? '–')}
      ${row('Plan', planLabel)}
      ${row('Preis', amountText)}
    </div>`;
  await safeSend(`[Spurig] 💰 Neue Zahlung: ${p.email} · ${planLabel}`, shell('Neue Zahlung', '#10b981', body));
}

export async function notifyAdminCancellation(p: CancellationPayload): Promise<void> {
  const planLabel = p.plan === 'yearly' ? 'Jährlich' : p.plan === 'monthly' ? 'Monatlich' : 'Unbekannt';
  const cancelDate = p.cancelAt
    ? new Date(p.cancelAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'sofort';
  const body = `
    <p style="margin:0 0 12px"><strong style="color:#f59e0b">Kündigung registriert.</strong> Der User hat sein Abo beendet.</p>
    <div style="margin-top:8px">
      ${row('E-Mail', p.email)}
      ${row('Benutzername', p.username ?? '–')}
      ${row('Plan', planLabel)}
      ${row('Endet am', cancelDate)}
    </div>`;
  await safeSend(`[Spurig] ⚠ Kündigung: ${p.email}`, shell('Kündigung', '#f59e0b', body));
}
