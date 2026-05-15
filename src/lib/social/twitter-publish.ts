/**
 * Twitter / X API v2 Auto-Publisher.
 *
 * Verwendet OAuth 1.0a User-Context (4 Keys noetig):
 *   TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
 *
 * Free-Tier: 1500 Tweets / Monat (~50 / Tag). Reicht fuer 1-2 Posts / Tag dicke.
 *
 * No-op wenn Credentials fehlen — Framework ist deploy-safe ohne Setup.
 */

import crypto from 'node:crypto';

const TWITTER_API = 'https://api.twitter.com/2/tweets';

export type TwitterPublishResult = {
  ok: boolean;
  tweetId?: string;
  error?: string;
};

export async function publishTweet(text: string): Promise<TwitterPublishResult> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { ok: false, error: 'twitter-credentials-missing' };
  }

  if (text.length > 280) {
    return { ok: false, error: `tweet-too-long: ${text.length} chars` };
  }

  // OAuth 1.0a Signing
  const body = JSON.stringify({ text });
  const oauthHeader = buildOAuthHeader({
    method: 'POST',
    url: TWITTER_API,
    apiKey,
    apiSecret,
    accessToken,
    accessSecret,
  });

  try {
    const res = await fetch(TWITTER_API, {
      method: 'POST',
      headers: {
        Authorization: oauthHeader,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = (await res.json()) as { data?: { id?: string } };
    return { ok: true, tweetId: data.data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

/**
 * Minimaler OAuth 1.0a Header Builder fuer Twitter API.
 * KEINE externe Library noetig.
 */
function buildOAuthHeader(input: {
  method: string;
  url: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    oauth_consumer_key: input.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: input.accessToken,
    oauth_version: '1.0',
  };

  // Signature-Base-String
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(params[k])}`)
    .join('&');
  const signatureBase = [
    input.method.toUpperCase(),
    encodeRFC3986(input.url),
    encodeRFC3986(paramString),
  ].join('&');

  const signingKey = `${encodeRFC3986(input.apiSecret)}&${encodeRFC3986(input.accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  params.oauth_signature = signature;

  const headerParts = Object.keys(params)
    .sort()
    .map((k) => `${encodeRFC3986(k)}="${encodeRFC3986(params[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

function encodeRFC3986(str: string): string {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}
