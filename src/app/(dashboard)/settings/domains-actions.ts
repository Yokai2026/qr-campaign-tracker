'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import {
  addDomainToVercel,
  removeDomainFromVercel,
  verifyDomainOnVercel,
  isVercelConfigured,
} from '@/lib/vercel/domains';
import {
  extractApex,
  matchProviderFromNs,
  PROVIDERS,
  type DnsProviderKey,
  type DnsProviderInfo,
} from '@/lib/dns/providers';
import { sendEmail } from '@/lib/email/send';
import type { CustomDomain } from '@/types';

// Hostname validation: letters/digits/dots/hyphens, at least one dot, no protocol/path.
const hostSchema = z
  .string()
  .trim()
  .min(3, 'Hostname zu kurz')
  .max(253, 'Hostname zu lang')
  .regex(
    /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))+$/,
    'Ungültiger Hostname — erwartet z.B. kurz.example.com'
  )
  .transform((v) => v.toLowerCase());

export async function getCustomDomains(): Promise<CustomDomain[]> {
  await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from('custom_domains')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as CustomDomain[];
}

export async function createCustomDomain(
  rawHost: string
): Promise<{ success: boolean; error?: string; warning?: string; domain?: CustomDomain }> {
  const user = await requireAuth();

  const parsed = hostSchema.safeParse(rawHost);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültiger Hostname' };
  }
  const host = parsed.data;

  // Reject main app host
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const appHost = new URL(appUrl).hostname.toLowerCase();
      if (host === appHost) {
        return { success: false, error: 'Dies ist bereits die Haupt-Domain' };
      }
    } catch {
      // ignore parse errors
    }
  }

  // Insert into DB + register with Vercel in parallel. If Vercel fails but DB
  // succeeds we keep the DB row (user can retry later) and surface a warning.
  const supabase = await createClient();
  const [dbResult, vercelResult] = await Promise.all([
    supabase.from('custom_domains').insert({ host, created_by: user.id }).select('*').single(),
    isVercelConfigured() ? addDomainToVercel(host) : Promise.resolve({ ok: true as const }),
  ]);

  if (dbResult.error) {
    // DB failed — roll back Vercel registration to keep state consistent.
    if (vercelResult.ok && isVercelConfigured()) {
      await removeDomainFromVercel(host).catch(() => {
        // Best-effort rollback; user can retry the create.
      });
    }
    if (dbResult.error.code === '23505') {
      return { success: false, error: 'Diese Domain wurde bereits hinzugefügt' };
    }
    return { success: false, error: dbResult.error.message };
  }

  revalidatePath('/settings');

  // Vercel fails (rare): DB row is created, user gets warning + can retry verify later.
  if (!vercelResult.ok) {
    return {
      success: true,
      domain: dbResult.data as CustomDomain,
      warning: `Domain in Datenbank angelegt, aber Vercel-Registrierung fehlgeschlagen: ${vercelResult.error}. Die Domain wird beim nächsten Verify automatisch nachregistriert.`,
    };
  }

  return { success: true, domain: dbResult.data as CustomDomain };
}

export async function deleteCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Fetch the host before deletion so we can clean up on Vercel.
  const { data: existing } = await supabase
    .from('custom_domains')
    .select('host')
    .eq('id', id)
    .single();

  const host = (existing as { host: string } | null)?.host ?? null;

  // DB delete + Vercel unregister in parallel — Vercel failure must not block DB cleanup.
  const [dbResult, vercelResult] = await Promise.all([
    supabase.from('custom_domains').delete().eq('id', id),
    host && isVercelConfigured()
      ? removeDomainFromVercel(host)
      : Promise.resolve({ ok: true as const }),
  ]);

  if (dbResult.error) return { success: false, error: dbResult.error.message };

  await logAudit({
    userId: profile.id,
    action: 'campaign.deleted',
    entityType: 'custom_domain',
    entityId: id,
  });

  revalidatePath('/settings');

  if (!vercelResult.ok) {
    return {
      success: true,
      warning: `Domain aus Datenbank entfernt, aber Vercel-Abmeldung fehlgeschlagen: ${vercelResult.error}. Bitte im Vercel-Dashboard manuell entfernen.`,
    };
  }

  return { success: true };
}

export async function verifyCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string; warning?: string; verified?: boolean }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: domain, error: fetchError } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !domain) {
    return { success: false, error: 'Domain nicht gefunden' };
  }

  const expected = (domain as CustomDomain).verification_token;
  const host = (domain as CustomDomain).host;
  const lookupName = `_spurig-verify.${host}`;

  // Step 1: Our own TXT-record verification — proves the user owns the domain.
  try {
    const { resolveTxt } = await import('node:dns/promises');
    const records = await resolveTxt(lookupName);
    const flat = records.map((r) => r.join('')).map((v) => v.trim());
    const match = flat.includes(expected);

    if (!match) {
      return {
        success: false,
        verified: false,
        error: `TXT-Record ${lookupName} gefunden, aber Token stimmt nicht. Erwartet: ${expected}`,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      verified: false,
      error: `DNS-Lookup fehlgeschlagen: ${message}. Bitte lege einen TXT-Record unter ${lookupName} mit dem Wert ${expected} an.`,
    };
  }

  // Step 2: Make sure the domain is attached to the Vercel project and Vercel
  // has confirmed the CNAME + SSL. If not yet attached, register it now
  // (self-healing for domains added before Vercel integration existed).
  let vercelWarning: string | undefined;
  if (isVercelConfigured()) {
    const addResult = await addDomainToVercel(host); // idempotent
    if (!addResult.ok) {
      vercelWarning = addResult.error;
    } else {
      const verifyResult = await verifyDomainOnVercel(host);
      if (!verifyResult.ok) {
        vercelWarning = verifyResult.error;
      } else if (!verifyResult.verified) {
        vercelWarning =
          'Vercel hat den CNAME-Record noch nicht bestätigt. DNS-Änderungen können bis zu 30 Minuten dauern — bitte später erneut versuchen.';
      }
    }
  }

  const { error: updateError } = await supabase
    .from('custom_domains')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/settings');
  return { success: true, verified: true, warning: vercelWarning };
}

export async function setPrimaryCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: domain } = await supabase
    .from('custom_domains')
    .select('verified')
    .eq('id', id)
    .single();

  if (!domain) return { success: false, error: 'Domain nicht gefunden' };
  if (!(domain as { verified: boolean }).verified) {
    return { success: false, error: 'Domain muss erst verifiziert werden' };
  }

  // Unset current primary, then set new primary (partial unique index requires this order).
  const { error: clearError } = await supabase
    .from('custom_domains')
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq('is_primary', true);

  if (clearError) return { success: false, error: clearError.message };

  const { error: setError } = await supabase
    .from('custom_domains')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (setError) return { success: false, error: setError.message };

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Returns all verified custom domains (host only) for selection in create forms.
 * Ordered so the primary domain comes first.
 */
export async function getVerifiedDomains(): Promise<{ id: string; host: string; is_primary: boolean }[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from('custom_domains')
    .select('id, host, is_primary')
    .eq('verified', true)
    .order('is_primary', { ascending: false })
    .order('host', { ascending: true });

  return (data ?? []) as { id: string; host: string; is_primary: boolean }[];
}

/**
 * Returns the primary verified custom domain host for the current user, or null.
 * Lightweight — used by create forms to show the short URL prefix.
 */
export async function getPrimaryDomainHost(): Promise<string | null> {
  await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from('custom_domains')
    .select('host')
    .eq('verified', true)
    .eq('is_primary', true)
    .limit(1)
    .single();

  return (data as { host: string } | null)?.host ?? null;
}

/**
 * Erkennt den DNS-Anbieter der Domain via NS-Lookup. Liefert sowohl den
 * erkannten Provider-Key (für provider-spezifische Guides) als auch die
 * rohen Nameserver (falls der User das manuell prüfen will).
 */
export async function detectDnsProvider(host: string): Promise<{
  key: DnsProviderKey;
  provider: DnsProviderInfo;
  nameservers: string[];
  apex: string;
}> {
  await requireAuth();
  const parsed = hostSchema.safeParse(host);
  const clean = parsed.success ? parsed.data : host.toLowerCase().trim();
  const apex = extractApex(clean);
  try {
    const { resolveNs } = await import('node:dns/promises');
    const ns = await resolveNs(apex);
    const key = matchProviderFromNs(ns);
    return { key, provider: PROVIDERS[key], nameservers: ns, apex };
  } catch {
    return { key: 'unknown', provider: PROVIDERS.unknown, nameservers: [], apex };
  }
}

/**
 * Leichtgewichtiger DNS-Poll: Fragt NUR den TXT-Record ab, vergleicht Token,
 * ruft aber NICHT die Vercel-API auf. Der UI-Polling-Loop nutzt das, um ohne
 * Rate-Limit-Risiko alle paar Sekunden zu prüfen. Gefunden → UI triggert dann
 * verifyCustomDomain() für den vollen Flow.
 */
export async function checkDnsRecord(
  id: string
): Promise<{ found: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();
  const { data: domain } = await supabase
    .from('custom_domains')
    .select('host, verification_token')
    .eq('id', id)
    .single();
  if (!domain) return { found: false, error: 'Domain nicht gefunden' };

  const { host, verification_token } = domain as { host: string; verification_token: string };
  const lookupName = `_spurig-verify.${host}`;
  try {
    const { resolveTxt } = await import('node:dns/promises');
    const records = await resolveTxt(lookupName);
    const flat = records.map((r) => r.join('').trim());
    return { found: flat.includes(verification_token) };
  } catch {
    return { found: false };
  }
}

/**
 * Sendet eine Support-Anfrage an info@spurig.com mit allen Daten, die der
 * Support braucht, um dem Kunden beim DNS-Setup zu helfen. Triggered nach
 * mehreren gescheiterten Poll-Versuchen oder per Button „Hilfe anfordern".
 */
export async function requestDomainSupport(
  id: string,
  userNote?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: domain } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', id)
    .single();
  if (!domain) return { success: false, error: 'Domain nicht gefunden' };

  const d = domain as CustomDomain;
  const apex = extractApex(d.host);
  let nsList: string[] = [];
  let provider: DnsProviderKey = 'unknown';
  try {
    const { resolveNs } = await import('node:dns/promises');
    nsList = await resolveNs(apex);
    provider = matchProviderFromNs(nsList);
  } catch {
    // ignore — info ist best-effort
  }

  const subject = `[Spurig] Support-Anfrage: Custom-Domain ${d.host}`;
  const html = `
    <h2>Kunden-Support: DNS-Setup benötigt Hilfe</h2>
    <p><strong>Kunde:</strong> ${user.email ?? user.id}</p>
    <p><strong>Domain:</strong> <code>${d.host}</code></p>
    <p><strong>Erkannter Anbieter:</strong> ${PROVIDERS[provider].label}</p>
    <p><strong>Nameserver:</strong><br><code>${nsList.join('<br>') || '— nicht ermittelbar —'}</code></p>
    <p><strong>Verification-Token:</strong> <code>${d.verification_token}</code></p>
    <p><strong>Erwarteter TXT-Record:</strong> <code>_spurig-verify.${d.host}</code> → Token (siehe oben)</p>
    <p><strong>Erwarteter CNAME:</strong> <code>${d.host}</code> → <code>cname.vercel-dns.com</code></p>
    ${userNote ? `<hr><p><strong>Nachricht vom Kunden:</strong></p><p>${userNote.replace(/[<>]/g, '')}</p>` : ''}
    <hr>
    <p style="color:#666;font-size:12px">Domain-ID: ${d.id} · Angelegt: ${d.created_at}</p>
  `;

  try {
    await sendEmail({ to: 'info@spurig.com', subject, html });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'E-Mail-Versand fehlgeschlagen',
    };
  }
}

export async function unsetPrimaryCustomDomain(): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('custom_domains')
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq('is_primary', true);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}
