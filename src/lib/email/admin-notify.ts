import { sendEmail } from './send';
import { renderShell, heading, paragraph, row, escapeHtml } from './shell';

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

function adminCtaLink(label: string): string {
  return `<div style="margin:24px 0 0"><a href="${APP_URL}/admin" style="color:#0e7c7b;text-decoration:none;font-weight:500;font-size:14px">${escapeHtml(label)} →</a></div>`;
}

export async function notifyAdminSignup(p: SignupPayload): Promise<void> {
  const trialDate = p.trialEndsAt
    ? new Date(p.trialEndsAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '–';
  const body = [
    heading('Neue Registrierung'),
    paragraph('Ein neuer User hat seine E-Mail bestätigt und ist startklar.'),
    row('E-Mail', p.email),
    row('Benutzername', p.username ?? '–'),
    row('Trial endet am', trialDate),
    adminCtaLink('Im Admin-Panel ansehen'),
  ].join('\n');

  await safeSend(
    `[Spurig] Neuer Trial-User: ${p.email}`,
    renderShell({
      preheader: `Neuer Trial-User: ${p.email}`,
      body,
      footer: 'Admin-Notification · Spurig Backend',
    }),
  );
}

export async function notifyAdminPayment(p: PaymentPayload): Promise<void> {
  const planLabel = p.plan === 'yearly' ? 'Jährlich' : 'Monatlich';
  const amountText = `${p.amount.toFixed(2).replace('.', ',')} € netto / Mo`;
  const body = [
    heading('💰 Neue Zahlung'),
    paragraph(
      '<strong style="color:#0e7c7b">Stripe-Checkout abgeschlossen.</strong> Der User hat ein Abo gestartet.',
    ),
    row('E-Mail', p.email),
    row('Benutzername', p.username ?? '–'),
    row('Plan', planLabel),
    row('Preis', amountText),
    adminCtaLink('Im Admin-Panel ansehen'),
  ].join('\n');

  await safeSend(
    `[Spurig] 💰 Neue Zahlung: ${p.email} · ${planLabel}`,
    renderShell({
      preheader: `Neue Zahlung: ${p.email} (${planLabel}, ${amountText})`,
      body,
      footer: 'Admin-Notification · Spurig Backend',
      headerAccent: '#10b981', // emerald für Erfolg
    }),
  );
}

export async function notifyAdminCancellation(p: CancellationPayload): Promise<void> {
  const planLabel = p.plan === 'yearly' ? 'Jährlich' : p.plan === 'monthly' ? 'Monatlich' : 'Unbekannt';
  const cancelDate = p.cancelAt
    ? new Date(p.cancelAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'sofort';
  const body = [
    heading('⚠ Kündigung'),
    paragraph(
      '<strong style="color:#b45309">Kündigung registriert.</strong> Der User hat sein Abo beendet.',
    ),
    row('E-Mail', p.email),
    row('Benutzername', p.username ?? '–'),
    row('Plan', planLabel),
    row('Endet am', cancelDate),
    adminCtaLink('Im Admin-Panel ansehen'),
  ].join('\n');

  await safeSend(
    `[Spurig] ⚠ Kündigung: ${p.email}`,
    renderShell({
      preheader: `Kündigung: ${p.email}`,
      body,
      footer: 'Admin-Notification · Spurig Backend',
      headerAccent: '#f59e0b', // amber für Warnung
    }),
  );
}
