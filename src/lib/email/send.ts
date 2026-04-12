type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('N8N_EMAIL_WEBHOOK_URL is not set');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Email webhook failed: ${response.status} ${response.statusText}`);
  }
}
