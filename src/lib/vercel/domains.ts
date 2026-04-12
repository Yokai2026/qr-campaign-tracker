/**
 * Vercel Project Domains — thin wrapper around @vercel/sdk.
 *
 * Configuration comes from env vars:
 *   - VERCEL_TOKEN       (required) — Full-Account token from vercel.com/account/settings/tokens
 *   - VERCEL_PROJECT_ID  (required) — prj_... from Vercel Dashboard → Project → Settings → General
 *   - VERCEL_TEAM_ID     (optional) — team_... only for team accounts; leave empty for personal accounts
 *
 * All wrappers return { ok: boolean, error?: string } so callers never see raw SDK internals.
 * On transient failures, operations retry up to 3 times with exponential backoff (Vercel API
 * is known to be flaky under load).
 */

import { Vercel } from '@vercel/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VercelDomainResult =
  | { ok: true }
  | { ok: false; error: string };

export type VercelDomainVerifyResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

function getClient(): Vercel | null {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;
  return new Vercel({ bearerToken: token });
}

function getProjectId(): string | null {
  return process.env.VERCEL_PROJECT_ID || null;
}

function getTeamId(): string | undefined {
  const id = process.env.VERCEL_TEAM_ID;
  return id && id.trim().length > 0 ? id : undefined;
}

/**
 * True when the minimum Vercel credentials are configured.
 * Used to gracefully skip Vercel-API calls in local/dev environments.
 */
export function isVercelConfigured(): boolean {
  return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Don't retry on 4xx (client errors) except 429 (rate limit)
      const status = (err as { statusCode?: number })?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unbekannter Fehler';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a custom domain with the Vercel project.
 * Idempotent: if the domain is already attached, treated as success.
 */
export async function addDomainToVercel(host: string): Promise<VercelDomainResult> {
  if (!isVercelConfigured()) {
    return { ok: false, error: 'Vercel-API nicht konfiguriert (VERCEL_TOKEN/VERCEL_PROJECT_ID fehlen)' };
  }
  const vercel = getClient();
  const idOrName = getProjectId();
  if (!vercel || !idOrName) {
    return { ok: false, error: 'Vercel-Client konnte nicht initialisiert werden' };
  }

  try {
    await withRetry(() =>
      vercel.projects.addProjectDomain({
        idOrName,
        teamId: getTeamId(),
        requestBody: { name: host.toLowerCase() },
      }),
    );
    return { ok: true };
  } catch (err) {
    const msg = errorMessage(err);
    // "domain_already_in_use_by_different_project" or "already_exists" → treat as success for our project
    if (/already[\s_-]?exists|already_in_use/i.test(msg)) {
      return { ok: true };
    }
    return { ok: false, error: `Vercel API: ${msg}` };
  }
}

/**
 * Remove a custom domain from the Vercel project.
 * Idempotent: if the domain is not attached, treated as success.
 */
export async function removeDomainFromVercel(host: string): Promise<VercelDomainResult> {
  if (!isVercelConfigured()) {
    // In dev without Vercel credentials, silently succeed — DB cleanup still happens.
    return { ok: true };
  }
  const vercel = getClient();
  const idOrName = getProjectId();
  if (!vercel || !idOrName) {
    return { ok: false, error: 'Vercel-Client konnte nicht initialisiert werden' };
  }

  try {
    await withRetry(() =>
      vercel.projects.removeProjectDomain({
        idOrName,
        domain: host.toLowerCase(),
        teamId: getTeamId(),
      }),
    );
    return { ok: true };
  } catch (err) {
    const msg = errorMessage(err);
    // 404-ish: domain already gone → success
    if (/not[\s_-]?found|does not exist/i.test(msg)) {
      return { ok: true };
    }
    return { ok: false, error: `Vercel API: ${msg}` };
  }
}

/**
 * Trigger Vercel's side of domain verification (separate from our TXT-record check).
 * Returns { verified: true } once Vercel has confirmed the CNAME + SSL provisioning.
 */
export async function verifyDomainOnVercel(host: string): Promise<VercelDomainVerifyResult> {
  if (!isVercelConfigured()) {
    return { ok: false, error: 'Vercel-API nicht konfiguriert' };
  }
  const vercel = getClient();
  const idOrName = getProjectId();
  if (!vercel || !idOrName) {
    return { ok: false, error: 'Vercel-Client konnte nicht initialisiert werden' };
  }

  try {
    const result = await withRetry(() =>
      vercel.projects.verifyProjectDomain({
        idOrName,
        domain: host.toLowerCase(),
        teamId: getTeamId(),
      }),
    );
    // SDK returns { verified: boolean, ... }
    const verified = Boolean((result as { verified?: boolean })?.verified);
    return { ok: true, verified };
  } catch (err) {
    return { ok: false, error: `Vercel API: ${errorMessage(err)}` };
  }
}
