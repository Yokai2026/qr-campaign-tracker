'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Globe, Trash2, Plus, Loader2, Check, Copy, Star, AlertCircle } from 'lucide-react';
import type { CustomDomain } from '@/types';
import {
  getCustomDomains,
  createCustomDomain,
  deleteCustomDomain,
  verifyCustomDomain,
  setPrimaryCustomDomain,
  unsetPrimaryCustomDomain,
} from '@/app/(dashboard)/settings/domains-actions';

export function CustomDomains() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [host, setHost] = useState('');
  const [isPending, startTransition] = useTransition();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

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
    if (!host.trim()) {
      toast.error('Hostname fehlt');
      return;
    }
    startTransition(async () => {
      const result = await createCustomDomain(host);
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Hinzufügen');
        return;
      }
      toast.success('Domain hinzugefügt — jetzt verifizieren');
      setHost('');
      setShowForm(false);
      await loadDomains();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Domain wirklich entfernen?')) return;
    startTransition(async () => {
      const result = await deleteCustomDomain(id);
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Löschen');
        return;
      }
      toast.success('Domain entfernt');
      setDomains((prev) => prev.filter((d) => d.id !== id));
    });
  }

  async function handleVerify(id: string) {
    setVerifyingId(id);
    const result = await verifyCustomDomain(id);
    setVerifyingId(null);

    if (result.verified) {
      toast.success('Domain verifiziert');
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
        {/* Add form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Hostname</Label>
              <Input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="kurz.example.com"
                className="h-8 text-[13px]"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Nur der Hostname, ohne Protokoll oder Pfad
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
  const recordName = `_spurig-verify.${domain.host}`;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-medium font-mono truncate">{domain.host}</span>
              {domain.verified ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                  Verifiziert
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(domain.id)}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Setup instructions */}
      {showSetup && !domain.verified && (
        <div className="border-t border-border bg-muted/20 px-3 py-3 space-y-2.5">
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
                  <code className="font-mono flex-1 truncate">{recordName}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Wert:</span>
                  <code className="font-mono flex-1 truncate">{domain.verification_token}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
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
                  2. CNAME / A
                </span>
                <span className="text-[11px] text-muted-foreground">Traffic-Weiterleitung</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Name:</span>
                  <code className="font-mono flex-1 truncate">{domain.host}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12">Ziel:</span>
                  <span className="text-[11px] text-muted-foreground">
                    CNAME auf cname.vercel-dns.com (oder A auf 76.76.21.21)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            DNS-Änderungen können einige Minuten dauern, bis sie aktiv sind. Zusätzlich
            muss die Domain im Vercel-Dashboard dem Projekt hinzugefügt werden.
          </p>
        </div>
      )}
    </div>
  );
}
