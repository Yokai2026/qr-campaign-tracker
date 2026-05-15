/**
 * Server-side Meta Conversions API (CAPI).
 *
 * Feuert Conversion-Events ohne Browser-Pixel — vermeidet Cookies und
 * Tracking-Blocker, hält das Cookie-Banner-Versprechen "kein Drittanbieter-
 * Tracking" ein. Match-Quality 60-80% durch gehashten Email-Match.
 *
 * Erfordert Env: META_PIXEL_ID, META_CAPI_ACCESS_TOKEN.
 * Optional: META_CAPI_TEST_EVENT_CODE (fuer Events-Manager-Testmodus).
 *
 * No-op wenn Env-Vars fehlen — sicher fuer Deployment ohne Ad-Konto.
 */

import crypto from 'node:crypto';

const GRAPH_VERSION = 'v18.0';

type MetaUserData = {
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  externalId?: string | null;
  fbp?: string | null;   // Facebook Browser-Cookie, falls verfuegbar
  fbc?: string | null;   // Facebook Click-ID, falls verfuegbar
};

type MetaPurchaseInput = {
  eventId: string;          // Dedup-Key, z.B. stripe_subscription_id
  value: number;            // EUR-Betrag
  currency?: string;
  user: MetaUserData;
  contentName?: string;     // z.B. "monthly" / "yearly"
};

type MetaLeadInput = {
  eventId: string;
  user: MetaUserData;
};

export async function trackMetaPurchase(input: MetaPurchaseInput): Promise<{ sent: boolean; error?: string }> {
  return sendMetaEvent({
    eventName: 'Purchase',
    eventId: input.eventId,
    user: input.user,
    customData: {
      currency: input.currency ?? 'EUR',
      value: input.value,
      ...(input.contentName ? { content_name: input.contentName } : {}),
    },
  });
}

export async function trackMetaLead(input: MetaLeadInput): Promise<{ sent: boolean; error?: string }> {
  return sendMetaEvent({
    eventName: 'Lead',
    eventId: input.eventId,
    user: input.user,
  });
}

// ---------------------------------------------------------------------------

async function sendMetaEvent(input: {
  eventName: string;
  eventId: string;
  user: MetaUserData;
  customData?: Record<string, unknown>;
}): Promise<{ sent: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { sent: false, error: 'meta-capi-not-configured' };
  }

  const userData: Record<string, unknown> = {};
  if (input.user.email) userData.em = [sha256(input.user.email.toLowerCase().trim())];
  if (input.user.externalId) userData.external_id = [sha256(input.user.externalId)];
  if (input.user.ipAddress) userData.client_ip_address = input.user.ipAddress;
  if (input.user.userAgent) userData.client_user_agent = input.user.userAgent;
  if (input.user.fbp) userData.fbp = input.user.fbp;
  if (input.user.fbc) userData.fbc = input.user.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        user_data: userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
  };

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, error: `${res.status}: ${errText.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
