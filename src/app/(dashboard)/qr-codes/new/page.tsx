'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Link as LinkIcon,
  Palette,
  QrCode as QrCodeIcon,
  ShieldAlert,
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
// Form schema
// ---------------------------------------------------------------------------

const formSchema = qrCodeSchema;
type FormValues = {
  placement_id: string;
  target_url: string;
  note: string;
  valid_from: string;
  valid_until: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_id: string;
  qr_fg_color: string;
  qr_bg_color: string;
  max_scans: string;
  limit_redirect_url: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewQrCodePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Placement data (loaded on mount)
  const [placements, setPlacements] = useState<PlacementOption[]>([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [showUtm, setShowUtm] = useState(false);
  const [showDesign, setShowDesign] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      placement_id: '',
      target_url: '',
      note: '',
      valid_from: '',
      valid_until: '',
      utm_source: 'qr',
      utm_medium: 'offline',
      utm_campaign: '',
      utm_content: '',
      utm_id: '',
      qr_fg_color: '#000000',
      qr_bg_color: '#FFFFFF',
      max_scans: '',
      limit_redirect_url: '',
    },
  });

  const placementId = watch('placement_id');
  const watchFg = watch('qr_fg_color');
  const watchBg = watch('qr_bg_color');
  const watchMaxScans = watch('max_scans');
  const selectedPlacement = placements.find((p) => p.id === placementId);

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
      if (!getValues('utm_campaign')) setValue('utm_campaign', placement.campaign?.slug || '');
      if (!getValues('utm_content')) setValue('utm_content', placement.placement_code || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementId]);

  // Preview URL — initialize empty to avoid hydration mismatch
  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  const previewShortUrl = baseUrl ? `${baseUrl}/r/<short-code>` : '';

  function onSubmit(data: FormValues) {
    const input: QrCodeInput = {
      placement_id: data.placement_id,
      target_url: data.target_url,
      note: data.note || undefined,
      valid_from: data.valid_from || undefined,
      valid_until: data.valid_until || undefined,
      utm_source: data.utm_source || undefined,
      utm_medium: data.utm_medium || undefined,
      utm_campaign: data.utm_campaign || undefined,
      utm_content: data.utm_content || undefined,
      utm_id: data.utm_id || undefined,
      qr_fg_color: data.qr_fg_color || undefined,
      qr_bg_color: data.qr_bg_color || undefined,
      max_scans: data.max_scans ? parseInt(data.max_scans, 10) : undefined,
      limit_redirect_url: data.limit_redirect_url || undefined,
    };

    const result = formSchema.safeParse(input);
    if (!result.success) {
      for (const err of result.error.issues) {
        const key = err.path[0]?.toString() as keyof FormValues | undefined;
        if (key) setError(key, { message: err.message });
      }
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
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
              <Controller
                name="placement_id"
                control={control}
                render={({ field }) => (
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          disabled={loadingPlacements}
                          aria-label="Platzierung auswählen"
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
                                  field.onChange(p.id);
                                  setComboOpen(false);
                                }}
                                data-checked={field.value === p.id}
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
                )}
              />
              {errors.placement_id && (
                <p className="text-sm text-destructive">{errors.placement_id.message}</p>
              )}
            </div>

            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="target_url">Ziel-URL</Label>
              <Input
                id="target_url"
                type="url"
                placeholder="https://beispiel.de/seite"
                {...register('target_url')}
                aria-invalid={!!errors.target_url}
              />
              {errors.target_url && (
                <p className="text-sm text-destructive">{errors.target_url.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Textarea
                id="note"
                placeholder="Interne Notiz zum QR-Code..."
                {...register('note')}
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
                  {...register('valid_from')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Gueltig bis (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  {...register('valid_until')}
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
              aria-expanded={showUtm}
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
                    {...register('utm_source')}
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
                    {...register('utm_medium')}
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
                  {...register('utm_campaign')}
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
                  {...register('utm_content')}
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
                  {...register('utm_id')}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* QR Design */}
        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowDesign(!showDesign)}
              aria-expanded={showDesign}
            >
              <div>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    QR-Design
                  </span>
                </CardTitle>
                <CardDescription>
                  Farben des QR-Codes anpassen.
                </CardDescription>
              </div>
              {showDesign ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showDesign && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qr_fg_color">Vordergrund</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={watchFg}
                      onChange={(e) => setValue('qr_fg_color', e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    />
                    <Input
                      value={watchFg}
                      onChange={(e) => setValue('qr_fg_color', e.target.value)}
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr_bg_color">Hintergrund</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={watchBg}
                      onChange={(e) => setValue('qr_bg_color', e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    />
                    <Input
                      value={watchBg}
                      onChange={(e) => setValue('qr_bg_color', e.target.value)}
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
              {/* Live preview */}
              <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: watchBg }}
                >
                  <QrCodeIcon
                    className="h-16 w-16 transition-colors"
                    style={{ color: watchFg }}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Scan-Limit */}
        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowLimit(!showLimit)}
              aria-expanded={showLimit}
            >
              <div>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Scan-Limit
                  </span>
                </CardTitle>
                <CardDescription>
                  Begrenze die Anzahl der Scans — z.B. für limitierte Angebote wie &quot;Nur die ersten 100 bekommen Rabatt&quot;.
                </CardDescription>
              </div>
              {showLimit ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showLimit && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_scans">Maximale Scans</Label>
                <Input
                  id="max_scans"
                  type="number"
                  min="1"
                  placeholder="z.B. 100"
                  {...register('max_scans')}
                />
                <p className="text-xs text-muted-foreground">
                  Nach dieser Anzahl wird der QR-Code gesperrt. Leer lassen fuer unbegrenzt.
                </p>
              </div>
              {watchMaxScans && (
                <div className="space-y-2">
                  <Label htmlFor="limit_redirect_url">Weiterleitungs-URL nach Limit</Label>
                  <Input
                    id="limit_redirect_url"
                    type="url"
                    placeholder="https://beispiel.de/ausverkauft"
                    {...register('limit_redirect_url')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wohin soll nach Erreichen des Limits weitergeleitet werden? Ohne Angabe wird eine Info-Seite angezeigt.
                  </p>
                </div>
              )}
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
