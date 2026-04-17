'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Globe, Trash2, Plus, Loader2, Check, Copy, Star, AlertCircle, Crown, Info, QrCode, ExternalLink, LifeBuoy, Search } from 'lucide-react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UpgradeBanner } from '@/components/shared/upgrade-banner';
import { checkFeatureAccess } from '@/lib/billing/check-access';
import type { CustomDomain } from '@/types';
import {
  getCustomDomains,
  createCustomDomain,
  deleteCustomDomain,
  verifyCustomDomain,
  setPrimaryCustomDomain,
  unsetPrimaryCustomDomain,
  detectDnsProvider,
  checkDnsRecord,
  requestDomainSupport,
} from '@/app/(dashboard)/settings/domains-actions';
import type { DnsProviderInfo } from '@/lib/dns/providers';

function normalizeHostInput(raw: string): string {
  let h = raw.trim().toLowerCase();
  // strip protocol
  h = h.replace(/^https?:\/\//i, '');
  // strip userinfo if pasted (rare, aber robust)
  h = h.replace(/^[^@]+@/, '');
  // strip path / query / hash — behalte nur host:port
  h = h.split(/[/?#]/)[0];
  // strip trailing dot (FQDN-Schreibweise)
  h = h.replace(/\.$/, '');
  // strip port (Records haben keinen Port)
  h = h.split(':')[0];
  return h;
}

export function CustomDomains() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [host, setHost] = useState('');
  const [isPending, startTransition] = useTransition();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check billing access on mount
  useEffect(() => {
    checkFeatureAccess('custom_domains').then(({ allowed }) => {
      if (!allowed) setAccessDenied(true);
    });
  }, []);

  async function loadDomains() {
    const data = await getCustomDomains();
    setDomains(data);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    getCustomDomains().then((data) => {
      if (!mounted) return;
      setDomains(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function handleCreate() {
    const normalized = normalizeHostInput(host);
    if (!normalized) {
      toast.error('Hostname fehlt');
      return;
    }
    if (normalized !== host) setHost(normalized);
    startTransition(async () => {
      const result = await createCustomDomain(normalized);
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Hinzufügen');
        return;
      }
      if (result.warning) {
        toast.warning(result.warning, { duration: 8000 });
      } else {
        toast.success('Domain hinzugefügt — jetzt DNS einrichten und verifizieren');
      }
      setHost('');
      setShowForm(false);
      await loadDomains();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCustomDomain(id);
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Löschen');
        return;
      }
      if (result.warning) {
        toast.warning(result.warning, { duration: 8000 });
      } else {
        toast.success('Domain entfernt');
      }
      setDomains((prev) => prev.filter((d) => d.id !== id));
    });
  }

  async function handleVerify(id: string) {
    setVerifyingId(id);
    const result = await verifyCustomDomain(id);
    setVerifyingId(null);

    if (result.verified) {
      if (result.warning) {
        toast.warning(result.warning, { duration: 10000 });
      } else {
        toast.success('Domain verifiziert');
      }
      await loadDomains();
    } else {
      toast.error(result.error || 'Verifizierung fehlgeschlagen');
    }
  }

  function handleSetPrimary(id: string, currentlyPrimary: boolean) {
    startTransition(async () => {
      const result = currentlyPrimary
        ? await unsetPrimaryCustomDomain()
        : await setPrimaryCustomDomain(id);

      if (!result.success) {
        toast.error(result.error || 'Aktion fehlgeschlagen');
        return;
      }
      toast.success(currentlyPrimary ? 'Als Primär entfernt' : 'Als Primär gesetzt');
      await loadDomains();
    });
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    toast.success('Token kopiert');
  }

  if (loading) {
    return (
      <Card className="border border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (accessDenied) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px] flex items-center gap-2">
                Eigene Kurz-Domains
                <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <Crown className="h-2.5 w-2.5" />
                  Pro
                </span>
              </CardTitle>
              <CardDescription className="text-[12px]">
                Verwende eine eigene Domain statt der Standard-URL für QR-Codes und Kurzlinks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UpgradeBanner
            title="Pro-Feature"
            description="Eigene Kurz-Domains sind im Pro-Plan verfügbar. Upgrade, um deine eigene Domain für QR-Codes und Kurzlinks zu nutzen."
            requiredTier="Pro"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">Eigene Kurz-Domains</CardTitle>
              <CardDescription className="text-[12px]">
                Verwende eine eigene Domain statt der Standard-URL für QR-Codes und Kurzlinks
              </CardDescription>
            </div>
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Domain hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explainer: 3-Step Guide */}
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            So richtest du eine eigene Kurz-Domain ein
          </div>
          <ol className="space-y-1.5 text-[11px] text-muted-foreground pl-1">
            <li><span className="font-medium text-foreground">1.</span> Domain hier eintragen (z.B. <code className="font-mono">go.deine-marke.de</code>)</li>
            <li><span className="font-medium text-foreground">2.</span> Zwei DNS-Records bei deinem Domain-Anbieter anlegen (Anleitung wird angezeigt)</li>
            <li><span className="font-medium text-foreground">3.</span> „Verifizieren&quot; klicken — fertig. Deine QR-Codes zeigen beim Scan deine Domain statt spurig.com.</li>
          </ol>
          <div className="flex items-center gap-3 pt-1 text-[11px]">
            <Link href="/qr-codes/new" className="inline-flex items-center gap-1 text-primary hover:underline">
              <QrCode className="h-3 w-3" />
              QR-Code mit eigener Domain erstellen
            </Link>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="custom-domain-host" className="text-[12px] text-muted-foreground">Hostname</Label>
              <Input
                id="custom-domain-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="kurz.example.com"
                className="h-8 text-[13px]"
                autoFocus
                aria-describedby="custom-domain-host-hint"
              />
              <p id="custom-domain-host-hint" className="text-[11px] text-muted-foreground">
                Protokoll (https://) und Pfad werden automatisch entfernt
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird hinzugefügt...
                  </>
                ) : (
                  'Hinzufügen'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setHost('');
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {domains.length === 0 && !showForm && (
          <p className="text-[13px] text-muted-foreground py-2">
            Noch keine eigenen Domains konfiguriert
          </p>
        )}

        {/* Domain list */}
        {domains.length > 0 && (
          <div className="space-y-2">
            {domains.map((d) => (
              <DomainItem
                key={d.id}
                domain={d}
                onDelete={handleDelete}
                onVerify={handleVerify}
                onSetPrimary={handleSetPrimary}
                onCopyToken={copyToken}
                isVerifying={verifyingId === d.id}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DomainItem({
  domain,
  onDelete,
  onVerify,
  onSetPrimary,
  onCopyToken,
  isVerifying,
  isPending,
}: {
  domain: CustomDomain;
  onDelete: (id: string) => void;
  onVerify: (id: string) => void;
  onSetPrimary: (id: string, currentlyPrimary: boolean) => void;
  onCopyToken: (token: string) => void;
  isVerifying: boolean;
  isPending: boolean;
}) {
  const [showSetup, setShowSetup] = useState(!domain.verified);
  const [provider, setProvider] = useState<DnsProviderInfo | null>(null);
  const [apex, setApex] = useState<string>('');
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [pollState, setPollState] = useState<'idle' | 'searching' | 'found' | 'exhausted'>(
    domain.verified ? 'idle' : 'searching'
  );
  const [supportSent, setSupportSent] = useState(false);
  const MAX_POLL_ATTEMPTS = 20; // 20 × 15s = 5 min

  // Subdomain-Präfix relativ zur Apex-Domain. Beispiel:
  //   host=kurz.example.com + apex=example.com  → subdomain="kurz"
  //   host=example.com      + apex=example.com  → subdomain=""  (Apex selbst)
  const isApex = apex !== '' && domain.host === apex;
  const subdomain = apex && !isApex ? domain.host.slice(0, -(apex.length + 1)) : '';
  // Viele Provider (IONOS, Cloudflare, Strato, …) hängen die Domain im
  // Formular automatisch an. Dort MUSS nur der Subdomain-Teil rein, sonst
  // entsteht `_spurig-verify.kurz.example.com.example.com`.
  const useSubOnly = provider?.nameFormat === 'subdomain-only';
  const txtNameFqdn = `_spurig-verify.${domain.host}`;
  const txtNameShort = isApex ? '_spurig-verify' : `_spurig-verify.${subdomain}`;
  const cnameNameFqdn = domain.host;
  const cnameNameShort = isApex ? '@' : subdomain;
  const txtName = useSubOnly ? txtNameShort : txtNameFqdn;
  const cnameName = useSubOnly ? cnameNameShort : cnameNameFqdn;
  const recordName = txtNameFqdn; // für DNS-Lookup immer FQDN

  // Provider-Detection beim Mount (nur wenn unverifiziert)
  useEffect(() => {
    if (domain.verified) return;
    let cancelled = false;
    detectDnsProvider(domain.host).then((res) => {
      if (cancelled) return;
      setProvider(res.provider);
      setNameservers(res.nameservers);
      setApex(res.apex);
    });
    return () => {
      cancelled = true;
    };
  }, [domain.host, domain.verified]);

  // Auto-Poll alle 15s: prüft ob TXT-Record sichtbar ist, triggert onVerify() wenn ja.
  useEffect(() => {
    if (domain.verified) return;
    if (pollState !== 'searching') return;

    const tick = async () => {
      setPollAttempts((n) => n + 1);
      const res = await checkDnsRecord(domain.id);
      if (res.found) {
        setPollState('found');
        onVerify(domain.id); // full verify inkl. Vercel
      }
    };

    // Erster Check nach 5s (gibt User Zeit DNS zu setzen bevor 1. Poll spammt)
    const first = setTimeout(tick, 5000);
    const interval = setInterval(tick, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [domain.id, domain.verified, pollState, onVerify]);

  useEffect(() => {
    if (pollAttempts >= MAX_POLL_ATTEMPTS && pollState === 'searching') {
      setPollState('exhausted');
    }
  }, [pollAttempts, pollState]);

  async function handleSupport() {
    const result = await requestDomainSupport(domain.id);
    if (result.success) {
      toast.success('Support-Anfrage gesendet — wir melden uns per E-Mail');
      setSupportSent(true);
    } else {
      toast.error(result.error || 'Support-Anfrage fehlgeschlagen');
    }
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-medium font-mono truncate">{domain.host}</span>
              {domain.verified ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                  Verifiziert
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Unverifiziert
                </span>
              )}
              {domain.is_primary && (
                <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Primär
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!domain.verified && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => onVerify(domain.id)}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Prüfe...
                </>
              ) : (
                'Verifizieren'
              )}
            </Button>
          )}
          {domain.verified && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => onSetPrimary(domain.id, domain.is_primary)}
              disabled={isPending}
            >
              {domain.is_primary ? 'Primär aufheben' : 'Als Primär setzen'}
            </Button>
          )}
          {!domain.verified && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setShowSetup(!showSetup)}
            >
              {showSetup ? 'Verbergen' : 'Anleitung'}
            </Button>
          )}
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isPending} aria-label="Domain entfernen" title="Domain entfernen">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Domain entfernen?"
            description={`Die Domain "${domain.host}" wird unwiderruflich entfernt. Kurzlinks über diese Domain funktionieren danach nicht mehr.`}
            confirmLabel="Entfernen"
            onConfirm={() => onDelete(domain.id)}
          />
        </div>
      </div>

      {/* Setup instructions */}
      {showSetup && !domain.verified && (
        <div className="border-t border-border bg-muted/20 px-3 py-3 space-y-3">
          {/* Live-Poll-Status */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={
              'flex items-center gap-2 rounded-md border px-2.5 py-2 text-[12px] ' +
              (pollState === 'found'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
                : pollState === 'exhausted'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
                : 'border-border bg-background text-muted-foreground')
            }
          >
            {pollState === 'found' ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>DNS-Record gefunden — Verifizierung läuft…</span>
              </>
            ) : pollState === 'exhausted' ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Nach 5 Minuten kein DNS-Record gefunden. Bitte prüfe die Einträge
                  bei deinem Anbieter — oder fordere unten Hilfe an.
                </span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                <span>
                  DNS-Record wird automatisch gesucht… (Versuch {pollAttempts}/
                  {MAX_POLL_ATTEMPTS}, alle 15&nbsp;Sekunden)
                </span>
              </>
            )}
          </div>

          {/* Provider-Guide */}
          {provider && (
            <div className="rounded-md border border-border bg-background p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[12px] font-medium">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {provider.key === 'unknown'
                    ? 'DNS-Anbieter nicht automatisch erkannt'
                    : `Erkannt: ${provider.label}`}
                </div>
                {provider.dashboardUrl && (
                  <Link
                    href={provider.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    Zum Dashboard
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>
              {provider.menuHint && (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium">Menü:</span> {provider.menuHint}
                </p>
              )}
              <ol className="space-y-1 pl-4 text-[11px] text-muted-foreground list-decimal">
                {provider.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {nameservers.length > 0 && (
                <details className="text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Nameserver anzeigen
                  </summary>
                  <ul className="mt-1 pl-3 font-mono space-y-0.5">
                    {nameservers.map((ns) => (
                      <li key={ns}>{ns}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <p className="text-[12px] text-muted-foreground">
            Lege zwei DNS-Records bei deinem Domain-Anbieter an:
          </p>
          <div className="space-y-2">
            <div className="rounded-md border border-border bg-background p-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  1. TXT
                </span>
                <span className="text-[11px] text-muted-foreground">DNS-Verifizierung</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Name:</span>
                  <code className="font-mono flex-1 truncate">{txtName}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    aria-label="TXT-Name kopieren"
                    title="Kopieren"
                    onClick={() => {
                      navigator.clipboard.writeText(txtName);
                      toast.success('Name kopiert');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {useSubOnly && (
                  <p className="pl-14 text-[10px] text-muted-foreground">
                    Vollständig: <code className="font-mono">{txtNameFqdn}</code>
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Wert:</span>
                  <code className="font-mono flex-1 truncate">{domain.verification_token}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    aria-label="Verifizierungs-Token kopieren"
                    title="Kopieren"
                    onClick={() => onCopyToken(domain.verification_token)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  2. {isApex ? 'A' : 'CNAME'}
                </span>
                <span className="text-[11px] text-muted-foreground">Traffic-Weiterleitung</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Name:</span>
                  <code className="font-mono flex-1 truncate">{cnameName}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    aria-label="CNAME/A-Name kopieren"
                    title="Kopieren"
                    onClick={() => {
                      navigator.clipboard.writeText(cnameName);
                      toast.success('Name kopiert');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {useSubOnly && !isApex && (
                  <p className="pl-14 text-[10px] text-muted-foreground">
                    Vollständig: <code className="font-mono">{cnameNameFqdn}</code>
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Ziel:</span>
                  {isApex ? (
                    <code className="font-mono flex-1 truncate">76.76.21.21</code>
                  ) : (
                    <code className="font-mono flex-1 truncate">cname.vercel-dns.com</code>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    aria-label="Ziel kopieren"
                    title="Kopieren"
                    onClick={() => {
                      const target = isApex ? '76.76.21.21' : 'cname.vercel-dns.com';
                      navigator.clipboard.writeText(target);
                      toast.success('Ziel kopiert');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {useSubOnly && !isApex && (
            <p className="text-[11px] text-muted-foreground">
              Hinweis: {provider?.label ?? 'Dein Anbieter'} hängt die Domain automatisch an — trage im Formular
              nur den hier gezeigten Kurznamen ein, nicht die vollständige Variante.
            </p>
          )}
          {isApex && (
            <p className="text-[11px] text-muted-foreground">
              Hinweis: Du verifizierst die Apex-Domain. CNAME ist auf dem Apex nicht erlaubt — nutze stattdessen
              den A-Record auf <code className="font-mono">76.76.21.21</code>.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            DNS-Änderungen können einige Minuten dauern, bis sie aktiv sind.
          </p>

          {/* Support-Button — erscheint nach erschöpften Polls oder bleibt permanent sichtbar */}
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <p className="text-[11px] text-muted-foreground">
              Kommst du nicht weiter? Unser Support hilft dir beim DNS-Setup.
            </p>
            <Button
              variant={pollState === 'exhausted' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-[12px] shrink-0"
              onClick={handleSupport}
              disabled={supportSent}
            >
              <LifeBuoy className="mr-1.5 h-3 w-3" />
              {supportSent ? 'Anfrage gesendet' : 'Hilfe anfordern'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
