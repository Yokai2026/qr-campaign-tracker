'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';

import { createQrCode, getPlacements } from '../actions';
import { qrCodeSchema } from '@/lib/validations';
import type { QrCodeInput } from '@/types';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlacementOption = {
  id: string;
  name: string;
  placement_code: string;
  campaign: { id: string; name: string; slug: string } | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewQrCodePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Placement data
  const [placements, setPlacements] = useState<PlacementOption[]>([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);

  // Form state
  const [placementId, setPlacementId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [note, setNote] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // UTM fields
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('qr');
  const [utmMedium, setUtmMedium] = useState('offline');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmId, setUtmId] = useState('');

  // Placement combobox
  const [comboOpen, setComboOpen] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load placements on mount
  useEffect(() => {
    getPlacements()
      .then((data) => setPlacements(data))
      .catch(() => toast.error('Platzierungen konnten nicht geladen werden.'))
      .finally(() => setLoadingPlacements(false));
  }, []);

  // Auto-fill UTM defaults when placement changes
  useEffect(() => {
    const placement = placements.find((p) => p.id === placementId);
    if (placement) {
      if (!utmCampaign || utmCampaign === '') {
        setUtmCampaign(placement.campaign?.slug ?? '');
      }
      if (!utmContent || utmContent === '') {
        setUtmContent(placement.placement_code ?? '');
      }
    }
    // Only run when placementId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementId]);

  const selectedPlacement = placements.find((p) => p.id === placementId);

  // Preview URL — initialize empty to avoid hydration mismatch
  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin);
  }, []);
  const previewShortUrl = baseUrl ? `${baseUrl}/r/<short-code>` : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const input: QrCodeInput = {
      placement_id: placementId,
      target_url: targetUrl,
      note: note || undefined,
      valid_from: validFrom || undefined,
      valid_until: validUntil || undefined,
      utm_source: utmSource || undefined,
      utm_medium: utmMedium || undefined,
      utm_campaign: utmCampaign || undefined,
      utm_content: utmContent || undefined,
      utm_id: utmId || undefined,
    };

    // Client-side validation
    const result = qrCodeSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of result.error.issues) {
        const key = err.path[0]?.toString() ?? 'form';
        fieldErrors[key] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const qrCode = await createQrCode(input);
        toast.success('QR-Code erfolgreich erstellt!');
        router.push(`/qr-codes/${qrCode.id}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Erstellen des QR-Codes.',
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Neuer QR-Code"
        description="Erstellen Sie einen neuen QR-Code mit Weiterleitung."
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Placement select */}
        <Card>
          <CardHeader>
            <CardTitle>Platzierung & Ziel</CardTitle>
            <CardDescription>
              Waehlen Sie die Platzierung und geben Sie die Ziel-URL an.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placement combobox */}
            <div className="space-y-2">
              <Label htmlFor="placement_id">Platzierung</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled={loadingPlacements}
                    />
                  }
                >
                  {loadingPlacements
                    ? 'Laden...'
                    : selectedPlacement
                      ? `${selectedPlacement.name} (${selectedPlacement.campaign?.name ?? '-'})`
                      : 'Platzierung waehlen...'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Platzierung suchen..." />
                    <CommandList>
                      <CommandEmpty>Keine Platzierung gefunden.</CommandEmpty>
                      <CommandGroup>
                        {placements.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.campaign?.name ?? ''}`}
                            onSelect={() => {
                              setPlacementId(p.id);
                              setComboOpen(false);
                            }}
                            data-checked={placementId === p.id}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.campaign?.name ?? 'Keine Kampagne'} &middot; {p.placement_code}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.placement_id && (
                <p className="text-sm text-destructive">{errors.placement_id}</p>
              )}
            </div>

            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="target_url">Ziel-URL</Label>
              <Input
                id="target_url"
                type="url"
                placeholder="https://beispiel.de/seite"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                aria-invalid={!!errors.target_url}
              />
              {errors.target_url && (
                <p className="text-sm text-destructive">{errors.target_url}</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Textarea
                id="note"
                placeholder="Interne Notiz zum QR-Code..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            {/* Validity dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Gueltig ab (optional)</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Gueltig bis (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            {previewShortUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Redirect-URL:{' '}
                  <span className="font-mono text-foreground">
                    {previewShortUrl}
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UTM Parameters (collapsible) */}
        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowUtm(!showUtm)}
            >
              <div>
                <CardTitle>Tracking-Einstellungen</CardTitle>
                <CardDescription>
                  Hiermit erkennst du in Analytics, woher ein Besucher kam. Wird automatisch befuellt — nur anpassen, wenn noetig.
                </CardDescription>
              </div>
              {showUtm ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showUtm && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_source">Quelle</Label>
                  <Input
                    id="utm_source"
                    placeholder="qr"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Woher kommt der Besucher? (z.B. qr, instagram, flyer)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_medium">Kanal</Label>
                  <Input
                    id="utm_medium"
                    placeholder="offline"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Welche Art von Werbung? (z.B. offline, social, email)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_campaign">Kampagnenname</Label>
                <Input
                  id="utm_campaign"
                  placeholder="Kampagnen-Slug"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Wird automatisch von der Kampagne uebernommen.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_content">Platzierung</Label>
                <Input
                  id="utm_content"
                  placeholder="Platzierungscode"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Wird automatisch vom Platzierungscode uebernommen. Hilft zu erkennen, welcher QR-Code gescannt wurde.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_id">Kampagnen-ID (optional)</Label>
                <Input
                  id="utm_id"
                  placeholder="z.B. interne Referenznummer"
                  value={utmId}
                  onChange={(e) => setUtmId(e.target.value)}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            QR-Code erstellen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/qr-codes')}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}
