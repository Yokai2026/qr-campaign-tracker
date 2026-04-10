'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Loader2,
  FlaskConical,
  ChevronUp,
  Power,
  PowerOff,
  Crown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

import {
  createAbVariant,
  updateAbVariant,
  deleteAbVariant,
} from '@/app/(dashboard)/qr-codes/ab-variants-actions';
import type { AbVariant } from '@/types';
import type { EffectiveTier } from '@/lib/billing/gates';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AbVariantsEditorProps {
  variants: AbVariant[];
  qrCodeId?: string;
  shortLinkId?: string;
  userTier?: EffectiveTier;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AbVariantsEditor({ variants: initialVariants, qrCodeId, shortLinkId, userTier }: AbVariantsEditorProps) {
  const isPro = userTier === 'paid' || userTier === 'trial';
  const [variants, setVariants] = useState(initialVariants);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B-Testing
          </CardTitle>
          <CardDescription>
            Teste verschiedene Ziel-URLs gegeneinander mit gewichteter Verteilung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
            <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Pro-Feature</p>
              <p className="text-xs text-muted-foreground">
                A/B-Testing ist nur mit dem Pro-Abo verfuegbar.
              </p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/pricing?reason=conditional_redirects" />}>
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalWeight = variants.filter((v) => v.active).reduce((sum, v) => sum + v.weight, 0);

  function handleCreated(variant: AbVariant) {
    setVariants((prev) => [...prev, variant]);
    setShowAdd(false);
  }

  function handleUpdated(updated: AbVariant) {
    setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }

  function handleDeleted(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function handleToggle(variant: AbVariant) {
    startTransition(async () => {
      const res = await updateAbVariant(variant.id, { active: !variant.active });
      if (res.success) {
        handleUpdated({ ...variant, active: !variant.active });
        toast.success(variant.active ? 'Variante deaktiviert' : 'Variante aktiviert');
      } else {
        toast.error(res.error || 'Fehler');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B-Testing
          </CardTitle>
          <CardDescription>
            Teste verschiedene Ziel-URLs gegeneinander mit gewichteter Verteilung.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? (
            <>
              <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
              Abbrechen
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Variante
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAdd && (
          <AddVariantForm
            qrCodeId={qrCodeId}
            shortLinkId={shortLinkId}
            onCreated={handleCreated}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {variants.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Keine Varianten vorhanden. Alle Besucher sehen die Standard-URL.
          </p>
        )}

        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            totalWeight={totalWeight}
            onToggle={() => handleToggle(variant)}
            onDeleted={() => handleDeleted(variant.id)}
            isPending={isPending}
          />
        ))}

        {variants.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            Hinweis: Die Standard-Ziel-URL wird nicht mehr verwendet, wenn aktive Varianten existieren.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Variant Row
// ---------------------------------------------------------------------------

function VariantRow({
  variant,
  totalWeight,
  onToggle,
  onDeleted,
  isPending,
}: {
  variant: AbVariant;
  totalWeight: number;
  onToggle: () => void;
  onDeleted: () => void;
  isPending: boolean;
}) {
  const [isDeleting, startDelete] = useTransition();
  const percentage = totalWeight > 0 && variant.active
    ? Math.round((variant.weight / totalWeight) * 100)
    : 0;

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteAbVariant(variant.id);
      if (res.success) {
        onDeleted();
        toast.success('Variante geloescht');
      } else {
        toast.error(res.error || 'Fehler beim Loeschen');
      }
    });
  }

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${!variant.active ? 'opacity-50' : ''}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <FlaskConical className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {variant.label || 'Variante'}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {variant.weight}w
          </span>
          {variant.active && (
            <span className="text-xs text-muted-foreground">
              ({percentage}%)
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {variant.target_url}
        </p>
      </div>

      {/* Weight bar */}
      {variant.active && (
        <div className="hidden sm:flex w-16 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        disabled={isPending}
        title={variant.active ? 'Deaktivieren' : 'Aktivieren'}
      >
        {variant.active ? (
          <Power className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            )}
          </Button>
        }
        title="Variante loeschen?"
        description="Diese A/B-Variante wird unwiderruflich geloescht."
        confirmLabel="Loeschen"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Variant Form
// ---------------------------------------------------------------------------

function AddVariantForm({
  qrCodeId,
  shortLinkId,
  onCreated,
  onCancel,
}: {
  qrCodeId?: string;
  shortLinkId?: string;
  onCreated: (variant: AbVariant) => void;
  onCancel: () => void;
}) {
  const [targetUrl, setTargetUrl] = useState('');
  const [weight, setWeight] = useState('50');
  const [label, setLabel] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const weightNum = parseInt(weight, 10);
    if (!targetUrl || isNaN(weightNum) || weightNum < 1 || weightNum > 100) return;

    startTransition(async () => {
      const res = await createAbVariant({
        qr_code_id: qrCodeId,
        short_link_id: shortLinkId,
        target_url: targetUrl,
        weight: weightNum,
        label: label || undefined,
      });

      if (res.success) {
        toast.success('Variante erstellt');
        onCreated({
          id: crypto.randomUUID(),
          qr_code_id: qrCodeId || null,
          short_link_id: shortLinkId || null,
          target_url: targetUrl,
          weight: weightNum,
          label: label || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        toast.error(res.error || 'Fehler beim Erstellen');
      }
    });
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Bezeichnung (optional)</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="z.B. Variante A, Landing Page neu"
        />
      </div>

      <div className="grid grid-cols-[1fr,80px] gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Ziel-URL</Label>
          <Input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://beispiel.de/variante-a"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Gewicht</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Gewicht bestimmt den Anteil des Traffics. Zwei Varianten mit Gewicht 50 erhalten je 50%.
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !targetUrl || !weight}
        >
          {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Variante erstellen
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
