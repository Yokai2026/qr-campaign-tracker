'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { KeyRound, Copy, Check, Trash2, Loader2, BookOpen, ExternalLink } from 'lucide-react';
import { listTokens, createToken, revokeToken, type TokenSummary } from '@/lib/api/token-actions';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'nie verwendet';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tagen`;
  return formatDate(iso);
}

export function ApiTokens() {
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<{ token: string; prefix: string } | null>(null);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [submitting, startSubmit] = useTransition();
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function refresh() {
    const list = await listTokens();
    setTokens(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleCreate() {
    if (!name.trim()) {
      toast.error('Bitte einen Namen vergeben.');
      return;
    }
    const days = expiresInDays ? parseInt(expiresInDays, 10) : null;
    startSubmit(async () => {
      const result = await createToken(name, days);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNewToken({ token: result.token, prefix: result.prefix });
      setName('');
      setExpiresInDays('');
      await refresh();
    });
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(id: string) {
    if (!confirm('Diesen Token unwiderruflich widerrufen? Apps die ihn benutzen werden 401-Fehler bekommen.')) return;
    setRevoking(id);
    revokeToken(id).then((r) => {
      setRevoking(null);
      if (!r.success) toast.error(r.error);
      else {
        toast.success('Token widerrufen');
        refresh();
      }
    });
  }

  const activeTokens = tokens.filter((t) => !t.revoked_at);
  const revokedTokens = tokens.filter((t) => t.revoked_at);

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">API-Tokens</CardTitle>
              <CardDescription className="text-[12px]">
                Für KI-Agenten, n8n und eigene Integrationen.{' '}
                <a href="/api-docs" target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                  Dokumentation <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </div>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) {
                setNewToken(null);
                setName('');
                setExpiresInDays('');
              }
            }}
          >
            <DialogTrigger render={<Button variant="brand" size="sm">Token erstellen</Button>} />
            <DialogContent className="max-w-md">
              {newToken ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Token erstellt</DialogTitle>
                    <DialogDescription>
                      Kopiere den Token jetzt — du wirst ihn nie wieder sehen können.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <code className="block break-all font-mono text-[12.5px]">{newToken.token}</code>
                  </div>
                  <DialogFooter>
                    <Button variant="brand" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Kopiert
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Token kopieren
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Neuen API-Token erstellen</DialogTitle>
                    <DialogDescription>
                      Gib dem Token einen Namen damit du später weißt wo er benutzt wird.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="token-name" className="text-[12px] text-muted-foreground">Name</Label>
                      <Input
                        id="token-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="z.B. n8n-Bot, Mein Skript, Claude-Agent"
                        className="h-9 text-[13px]"
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="token-expires" className="text-[12px] text-muted-foreground">
                        Ablauf in Tagen <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <Input
                        id="token-expires"
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(e.target.value)}
                        placeholder="leer = nie"
                        min={1}
                        max={3650}
                        className="h-9 text-[13px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="brand" onClick={handleCreate} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Wird erstellt…
                        </>
                      ) : 'Erstellen'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Lade Tokens…
          </div>
        ) : activeTokens.length === 0 && revokedTokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <BookOpen className="mx-auto h-5 w-5 text-muted-foreground/60" />
            <p className="mt-2 text-[13.5px] font-medium">Noch keine Tokens</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Erstelle einen Token um die Spurig-API von einem Bot, Skript oder anderen Tool aus zu nutzen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTokens.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="truncate text-[13.5px] font-medium">{t.name}</span>
                    <code className="font-mono text-[11.5px] text-muted-foreground">{t.token_prefix}…</code>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                    <span>Erstellt: {formatDate(t.created_at)}</span>
                    <span>Zuletzt benutzt: {formatRelative(t.last_used_at)}</span>
                    {t.expires_at && <span>Läuft ab: {formatDate(t.expires_at)}</span>}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(t.id)}
                  disabled={revoking === t.id}
                  aria-label="Token widerrufen"
                >
                  {revoking === t.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
            {revokedTokens.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-[12px] text-muted-foreground hover:text-foreground">
                  {revokedTokens.length} widerrufene Token{revokedTokens.length === 1 ? '' : 's'} anzeigen
                </summary>
                <div className="mt-2 space-y-2">
                  {revokedTokens.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/5 p-2.5 opacity-60">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="truncate text-[13px] line-through">{t.name}</span>
                          <code className="font-mono text-[11px] text-muted-foreground">{t.token_prefix}…</code>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Widerrufen am {formatDate(t.revoked_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
