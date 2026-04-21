'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  BarChart3,
  Clock,
  Globe,
  Tag,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Palette,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

import { updateQrCode, deleteQrCode } from '../actions';
import { computeQrStatus } from '@/lib/qr/status';
import { downloadQrPng, downloadQrSvg } from '@/lib/qr/download';
import { QR_ACTION_LABELS } from '@/lib/constants';

import type { QrCode, QrStatusHistory, RedirectRule, AbVariant } from '@/types';
import { RedirectRulesEditor } from '@/components/redirect-rules/redirect-rules-editor';
import { AbVariantsEditor } from '@/components/ab-testing/ab-variants-editor';
import { AbResultsChart } from '@/components/ab-testing/ab-results-chart';
import { QrDesignStudio } from '@/components/qr-design/qr-design-studio';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  expired: 'Abgelaufen',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return format(new Date(iso), 'dd.MM.yyyy', { locale: de });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  try {
    return format(new Date(iso), 'dd.MM.yyyy HH:mm', { locale: de });
  } catch {
    return iso;
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('In Zwischenablage kopiert'),
    () => toast.error('Kopieren fehlgeschlagen'),
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

import type { EffectiveTier } from '@/lib/billing/gates';

interface QrCodeDetailProps {
  qrCode: QrCode;
  history: QrStatusHistory[];
  redirectCount: number;
  redirectRules: RedirectRule[];
  abVariants: AbVariant[];
  userTier: EffectiveTier;
}

// ---------------------------------------------------------------------------
// Edit form values
// ---------------------------------------------------------------------------

type EditFormValues = {
  target_url: string;
  note: string;
  active: boolean;
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

export function QrCodeDetail({ qrCode, history, redirectCount, redirectRules, abVariants, userTier }: QrCodeDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const status = computeQrStatus(qrCode);
  const placement = qrCode.placement;
  const campaign = placement?.campaign;
  const location = placement?.location;

  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  const shortLink = baseUrl ? `${baseUrl}/r/${qrCode.short_code}` : `/r/${qrCode.short_code}`;

  // Edit form state
  const [showEdit, setShowEdit] = useState(false);

  const editForm = useForm<EditFormValues>({
    defaultValues: {
      target_url: qrCode.target_url,
      note: qrCode.note ?? '',
      active: qrCode.active,
      valid_from: qrCode.valid_from ?? '',
      valid_until: qrCode.valid_until ?? '',
      utm_source: qrCode.utm_source ?? '',
      utm_medium: qrCode.utm_medium ?? '',
      utm_campaign: qrCode.utm_campaign ?? '',
      utm_content: qrCode.utm_content ?? '',
      utm_id: qrCode.utm_id ?? '',
      qr_fg_color: qrCode.qr_fg_color ?? '#000000',
      qr_bg_color: qrCode.qr_bg_color ?? '#FFFFFF',
      max_scans: qrCode.max_scans ? String(qrCode.max_scans) : '',
      limit_redirect_url: qrCode.limit_redirect_url ?? '',
    },
  });

  function handleSave(data: EditFormValues) {
    startTransition(async () => {
      try {
        await updateQrCode(qrCode.id, {
          target_url: data.target_url,
          note: data.note || undefined,
          active: data.active,
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
        });
        toast.success('QR-Code aktualisiert');
        setShowEdit(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Aktualisieren',
        );
      }
    });
  }

  function handleDelete() {
    setIsDeleting(true);
    startTransition(async () => {
      try {
        await deleteQrCode(qrCode.id);
        toast.success('QR-Code gelöscht');
        router.push('/qr-codes');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Löschen',
        );
        setIsDeleting(false);
      }
    });
  }

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <PageHeader
        title={`QR-Code: ${qrCode.short_code}`}
        description={placement?.name ?? 'Kein Platzierungsname'}
        breadcrumbs={[
          { label: 'QR-Codes', href: '/qr-codes' },
          { label: qrCode.short_code },
        ]}
        badge={<StatusBadge status={status} label={STATUS_LABELS[status] ?? status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: QR code preview & download */}
        <div className="space-y-6">
          {/* QR Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle>QR-Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrCode.qr_png_url ? (
                <Image
                  src={qrCode.qr_png_url}
                  alt={`QR-Code ${qrCode.short_code}`}
                  width={256}
                  height={256}
                  className="rounded-lg border"
                  unoptimized
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  Kein QR-Code
                </div>
              )}

              {/* Short link */}
              <div className="w-full space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Kurzlink
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                  <code className="flex-1 text-sm font-mono break-all">
                    {shortLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyToClipboard(shortLink)}
                    aria-label="Kurzlink kopieren"
                    title="Kurzlink kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (qrCode.qr_png_url) downloadQrPng(qrCode.qr_png_url, qrCode.short_code);
                }}
                disabled={!qrCode.qr_png_url}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (qrCode.qr_svg_url) downloadQrSvg(qrCode.qr_svg_url, qrCode.short_code);
                }}
                disabled={!qrCode.qr_svg_url}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                SVG
              </Button>
            </CardFooter>
          </Card>

          {/* Quick stats */}
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-semibold tabular-nums">{redirectCount.toLocaleString('de-DE')}</p>
                  <p className="text-xs text-muted-foreground">
                    Scans gesamt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle/Right column: Details & Edit */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details card */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Details</CardTitle>
                <CardDescription>Alle Informationen zum QR-Code</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(!showEdit)}
              >
                {showEdit ? (
                  <>
                    <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                    Schließen
                  </>
                ) : (
                  'Bearbeiten'
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {showEdit ? (
                <EditForm
                  form={editForm}
                  onSave={handleSave}
                  onCancel={() => setShowEdit(false)}
                  isPending={isPending}
                />
              ) : (
                <DetailsView
                  qrCode={qrCode}
                  campaign={campaign}
                  location={location}
                  placement={placement}
                />
              )}
            </CardContent>
          </Card>

          {/* Conditional Redirect Rules */}
          <RedirectRulesEditor
            rules={redirectRules}
            qrCodeId={qrCode.id}
            userTier={userTier}
          />

          {/* A/B Testing */}
          <AbVariantsEditor
            variants={abVariants}
            qrCodeId={qrCode.id}
            userTier={userTier}
          />

          {/* A/B Test Results */}
          <AbResultsChart
            variants={abVariants}
            qrCodeId={qrCode.id}
          />

          {/* QR Design Studio */}
          <QrDesignStudio
            redirectUrl={shortLink}
            shortCode={qrCode.short_code}
            initialFgColor={qrCode.qr_fg_color}
            initialBgColor={qrCode.qr_bg_color}
          />

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Verlauf</CardTitle>
              <CardDescription>
                Änderungsprotokoll dieses QR-Codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Einträge vorhanden.
                </p>
              ) : (
                <ol className="space-y-3" aria-label="Änderungsverlauf">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {QR_ACTION_LABELS[entry.action] ?? entry.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {entry.note}
                          </p>
                        )}
                        {(entry.old_value || entry.new_value) && (
                          <div className="mt-1 text-xs text-muted-foreground font-mono">
                            {entry.old_value && (
                              <span className="line-through">{entry.old_value}</span>
                            )}
                            {entry.old_value && entry.new_value && ' → '}
                            {entry.new_value && <span>{entry.new_value}</span>}
                          </div>
                        )}
                        {entry.profile && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            von {entry.profile.display_name ?? entry.profile.email}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">QR-Code löschen</p>
                  <p className="text-sm text-muted-foreground">
                    Der QR-Code wird unwiderruflich gelöscht.
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive" size="sm" disabled={isDeleting || isPending}>
                      {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Löschen
                    </Button>
                  }
                  title="QR-Code löschen?"
                  description="Dieser QR-Code und alle zugehörigen Scan-Daten werden unwiderruflich gelöscht."
                  confirmLabel="Endgültig löschen"
                  onConfirm={handleDelete}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DetailsViewProps {
  qrCode: QrCode;
  campaign?: { name: string; slug: string } | null;
  location?: { venue_name: string; address?: string | null } | null;
  placement?: { name: string; placement_code: string } | null;
}

function DetailsView({ qrCode, campaign, location, placement }: DetailsViewProps) {
  return (
    <div className="space-y-4">
      <DetailRow
        icon={Globe}
        label="Ziel-URL"
        value={
          <a
            href={qrCode.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm hover:underline break-all"
          >
            {qrCode.target_url}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        }
      />

      {placement && (
        <DetailRow
          icon={Tag}
          label="Platzierung"
          value={`${placement.name} (${placement.placement_code})`}
        />
      )}

      {campaign && (
        <DetailRow icon={Tag} label="Kampagne" value={campaign.name} />
      )}

      {location && (
        <DetailRow
          icon={Tag}
          label="Standort"
          value={`${location.venue_name}${location.address ? ` – ${location.address}` : ''}`}
        />
      )}

      {qrCode.note && (
        <DetailRow icon={FileText} label="Notiz" value={qrCode.note} />
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Gültig ab</p>
          <p className="font-medium">{formatDate(qrCode.valid_from)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Gültig bis</p>
          <p className="font-medium">{formatDate(qrCode.valid_until)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Erstellt</p>
          <p className="font-medium">{formatDate(qrCode.created_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Zuletzt aktualisiert</p>
          <p className="font-medium">{formatDate(qrCode.updated_at)}</p>
        </div>
      </div>

      <Separator />

      {/* UTM parameters */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          UTM-Parameter
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <UtmField label="source" value={qrCode.utm_source} />
          <UtmField label="medium" value={qrCode.utm_medium} />
          <UtmField label="campaign" value={qrCode.utm_campaign} />
          <UtmField label="content" value={qrCode.utm_content} />
          <UtmField label="id" value={qrCode.utm_id} />
        </div>
      </div>

      {/* Scan-Limit */}
      {qrCode.max_scans && (
        <>
          <Separator />
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Scan-Limit
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Max. Scans</p>
                <p className="font-medium">{qrCode.max_scans}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Limit-URL</p>
                <p className="font-mono text-xs break-all">{qrCode.limit_redirect_url || 'Info-Seite'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function UtmField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">utm_{label}</p>
      <p className="font-mono">{value || '-'}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Form (using React Hook Form)
// ---------------------------------------------------------------------------

import type { UseFormReturn } from 'react-hook-form';

interface EditFormProps {
  form: UseFormReturn<EditFormValues>;
  onSave: (data: EditFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}

function EditForm({ form, onSave, onCancel, isPending }: EditFormProps) {
  const { register, handleSubmit, watch, setValue } = form;
  const [showUtm, setShowUtm] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const active = watch('active');
  const watchFg = watch('qr_fg_color');
  const watchBg = watch('qr_bg_color');
  const watchMaxScans = watch('max_scans');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      {/* Target URL */}
      <div className="space-y-2">
        <Label htmlFor="edit_target_url">Ziel-URL</Label>
        <Input
          id="edit_target_url"
          type="url"
          {...register('target_url')}
          aria-invalid={!!form.formState.errors.target_url}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="edit_note">Notiz</Label>
        <Textarea
          id="edit_note"
          {...register('note')}
          rows={2}
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Label htmlFor="edit_active">Status</Label>
        <Button
          type="button"
          variant={active ? 'default' : 'outline'}
          size="sm"
          onClick={() => setValue('active', !active)}
          aria-pressed={active}
        >
          {active ? 'Aktiv' : 'Inaktiv'}
        </Button>
      </div>

      {/* Validity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit_valid_from">Gueltig ab</Label>
          <Input
            id="edit_valid_from"
            type="date"
            {...register('valid_from')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_valid_until">Gueltig bis</Label>
          <Input
            id="edit_valid_until"
            type="date"
            {...register('valid_until')}
          />
        </div>
      </div>

      {/* UTM (collapsible) */}
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setShowUtm(!showUtm)}
        aria-expanded={showUtm}
      >
        UTM-Parameter
        {showUtm ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showUtm && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit_utm_source" className="text-xs">
                utm_source
              </Label>
              <Input id="edit_utm_source" {...register('utm_source')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_utm_medium" className="text-xs">
                utm_medium
              </Label>
              <Input id="edit_utm_medium" {...register('utm_medium')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit_utm_campaign" className="text-xs">
              utm_campaign
            </Label>
            <Input id="edit_utm_campaign" {...register('utm_campaign')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit_utm_content" className="text-xs">
              utm_content
            </Label>
            <Input id="edit_utm_content" {...register('utm_content')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit_utm_id" className="text-xs">
              utm_id
            </Label>
            <Input id="edit_utm_id" {...register('utm_id')} />
          </div>
        </div>
      )}

      {/* QR Colors */}
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setShowColors(!showColors)}
        aria-expanded={showColors}
      >
        <Palette className="h-3.5 w-3.5 mr-0.5" />
        QR-Farben
        {showColors ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showColors && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="edit_fg" className="text-xs">Vordergrund</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="edit_fg"
                value={watchFg}
                onChange={(e) => setValue('qr_fg_color', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={watchFg}
                onChange={(e) => setValue('qr_fg_color', e.target.value)}
                className="font-mono text-xs uppercase"
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit_bg" className="text-xs">Hintergrund</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="edit_bg"
                value={watchBg}
                onChange={(e) => setValue('qr_bg_color', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={watchBg}
                onChange={(e) => setValue('qr_bg_color', e.target.value)}
                className="font-mono text-xs uppercase"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scan-Limit */}
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setShowLimit(!showLimit)}
        aria-expanded={showLimit}
      >
        <ShieldAlert className="h-3.5 w-3.5 mr-0.5" />
        Scan-Limit
        {showLimit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showLimit && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="edit_max_scans" className="text-xs">Maximale Scans</Label>
            <Input
              id="edit_max_scans"
              type="number"
              min="1"
              placeholder="Leer = unbegrenzt"
              {...register('max_scans')}
            />
            <p className="text-xs text-muted-foreground">Nach dieser Anzahl wird der QR-Code gesperrt.</p>
          </div>
          {watchMaxScans && (
            <div className="space-y-1">
              <Label htmlFor="edit_limit_url" className="text-xs">Weiterleitungs-URL nach Limit</Label>
              <Input
                id="edit_limit_url"
                type="url"
                placeholder="https://beispiel.de/ausverkauft"
                {...register('limit_redirect_url')}
              />
              <p className="text-xs text-muted-foreground">Ohne Angabe wird eine Info-Seite angezeigt.</p>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending && (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          )}
          Speichern
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
