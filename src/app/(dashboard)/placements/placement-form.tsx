'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  PLACEMENT_TYPE_LABELS,
  PLACEMENT_STATUS_LABELS,
} from '@/lib/constants';
import { placementSchema } from '@/lib/validations';
import {
  createPlacement,
  updatePlacement,
  generatePlacementCode,
} from './actions';
import type {
  Placement,
  PlacementInput,
  PlacementStatus,
  Campaign,
  Location,
} from '@/types';

interface PlacementFormProps {
  campaigns: Pick<Campaign, 'id' | 'name' | 'slug' | 'status'>[];
  locations: Pick<Location, 'id' | 'venue_name' | 'district'>[];
  placement?: Placement;
}

function parseTypes(typeStr: string): string[] {
  if (!typeStr) return [];
  return typeStr.split(',').map((t) => t.trim()).filter(Boolean);
}

// Form schema (placement_type as comma-joined string is validated separately)
const formSchema = placementSchema;

type FormValues = {
  campaign_id: string;
  location_id: string;
  name: string;
  placement_code: string;
  poster_version: string;
  flyer_version: string;
  notes: string;
  status: PlacementStatus;
};

export function PlacementForm({ campaigns, locations, placement }: PlacementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!placement;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      campaign_id: placement?.campaign_id ?? '',
      location_id: placement?.location_id ?? '',
      name: placement?.name ?? '',
      placement_code: placement?.placement_code ?? '',
      poster_version: placement?.poster_version ?? '',
      flyer_version: placement?.flyer_version ?? '',
      notes: placement?.notes ?? '',
      status: placement?.status ?? 'planned',
    },
  });

  // Multi-select types (managed separately — complex chip UI)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    parseTypes(placement?.placement_type ?? 'poster')
  );
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const campaignId = watch('campaign_id');
  const locationId = watch('location_id');

  // Auto-generate placement code when campaign and location change (only for new)
  useEffect(() => {
    if (isEditing || !campaignId || !locationId) return;

    const campaign = campaigns.find((c) => c.id === campaignId);
    const location = locations.find((l) => l.id === locationId);
    if (!campaign || !location) return;

    setIsGeneratingCode(true);
    let cancelled = false;
    generatePlacementCode(campaign.slug, location.venue_name)
      .then((code) => {
        if (!cancelled) setValue('placement_code', code);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsGeneratingCode(false);
      });
    return () => { cancelled = true; };
  }, [campaignId, locationId, campaigns, locations, isEditing, setValue]);

  // Types not yet selected
  const availableTypes = Object.entries(PLACEMENT_TYPE_LABELS).filter(
    ([key]) => !selectedTypes.includes(key)
  );

  function addType(type: string) {
    setSelectedTypes((prev) => [...prev, type]);
    setTypePopoverOpen(false);
  }

  function removeType(type: string) {
    setSelectedTypes((prev) => prev.filter((t) => t !== type));
  }

  function addCustomType() {
    const trimmed = customTypeInput.trim().toLowerCase();
    if (trimmed && !selectedTypes.includes(trimmed)) {
      setSelectedTypes((prev) => [...prev, trimmed]);
    }
    setCustomTypeInput('');
    setShowCustomInput(false);
    setTypePopoverOpen(false);
  }

  function getTypeLabel(type: string): string {
    return PLACEMENT_TYPE_LABELS[type] ?? type;
  }

  // Lookup helpers for select labels
  const selectedCampaign = campaigns.find((c) => c.id === campaignId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  const placementTypeValue = selectedTypes.join(',');
  const hasPosterType = selectedTypes.some((t) => t === 'poster' || t === 'banner');
  const hasFlyerType = selectedTypes.some((t) => t === 'flyer' || t === 'handout');

  function onSubmit(data: FormValues) {
    const input: PlacementInput = {
      name: data.name,
      placement_code: data.placement_code,
      campaign_id: data.campaign_id,
      location_id: data.location_id,
      placement_type: placementTypeValue,
      poster_version: data.poster_version || undefined,
      flyer_version: data.flyer_version || undefined,
      notes: data.notes || undefined,
      status: data.status,
    };

    const result = formSchema.safeParse(input);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() as keyof FormValues | undefined;
        if (key && key in data) {
          setError(key, { message: issue.message });
        }
      }
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          await updatePlacement(placement.id, input);
          toast.success('Platzierung aktualisiert');
          router.refresh();
        } else {
          const created = await createPlacement(input);
          toast.success('Platzierung erstellt');
          router.push(`/placements/${created.id}`);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-5">
          {/* Campaign */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign_id">Kampagne *</Label>
            <Controller
              name="campaign_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(val: string | null) => field.onChange(val ?? '')}>
                  <SelectTrigger className="w-full" id="campaign_id" aria-invalid={!!errors.campaign_id}>
                    <SelectValue placeholder="Kampagne wählen...">
                      {field.value
                        ? selectedCampaign?.name ?? 'Kampagne wählen...'
                        : 'Kampagne wählen...'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.campaign_id && (
              <p className="text-xs text-destructive">{errors.campaign_id.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location_id">Standort *</Label>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(val: string | null) => field.onChange(val ?? '')}>
                  <SelectTrigger className="w-full" id="location_id" aria-invalid={!!errors.location_id}>
                    <SelectValue placeholder="Standort wählen...">
                      {field.value
                        ? selectedLocation
                          ? `${selectedLocation.venue_name}${selectedLocation.district ? ` (${selectedLocation.district})` : ''}`
                          : 'Standort wählen...'
                        : 'Standort wählen...'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.venue_name}
                        {l.district && (
                          <span className="ml-1 text-muted-foreground">
                            ({l.district})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location_id && (
              <p className="text-xs text-destructive">{errors.location_id.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="z.B. Poster Haupteingang"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Placement Code */}
          <div className="space-y-1.5">
            <Label htmlFor="placement_code">Code *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="placement_code"
                {...register('placement_code')}
                placeholder="wird automatisch generiert"
                disabled={isGeneratingCode}
                aria-invalid={!!errors.placement_code}
              />
              {isGeneratingCode && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Wird generiert...
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Nur Kleinbuchstaben, Zahlen und Bindestriche.
            </p>
            {errors.placement_code && (
              <p className="text-xs text-destructive">{errors.placement_code.message}</p>
            )}
          </div>

          {/* Placement Types (multi-select chips) */}
          <div className="space-y-1.5">
            <Label>Typ *</Label>
            <div className="flex flex-wrap items-center gap-2">
              {selectedTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-[13px] font-medium"
                >
                  {getTypeLabel(type)}
                  <button
                    type="button"
                    onClick={() => removeType(type)}
                    className="ml-0.5 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${getTypeLabel(type)} entfernen`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Typ hinzufügen"
                    />
                  }
                >
                  <Plus className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="flex flex-col">
                    {availableTypes.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className="rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted transition-colors"
                        onClick={() => addType(value)}
                      >
                        {label}
                      </button>
                    ))}
                    {showCustomInput ? (
                      <div className="flex items-center gap-1 border-t border-border mt-1 pt-1 px-1">
                        <Input
                          value={customTypeInput}
                          onChange={(e) => setCustomTypeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomType();
                            }
                          }}
                          placeholder="Typ eingeben..."
                          className="h-7 text-[13px]"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={addCustomType}
                          aria-label="Eigenen Typ hinzufügen"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-primary hover:bg-muted transition-colors border-t border-border mt-1 pt-1"
                        onClick={() => setShowCustomInput(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Eigener Typ...
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Mindestens einen Typ auswählen.
              </p>
            )}
          </div>

          {/* Poster / Flyer version (conditional) */}
          {hasPosterType && (
            <div className="space-y-1.5">
              <Label htmlFor="poster_version">Poster-Version</Label>
              <Input
                id="poster_version"
                {...register('poster_version')}
                placeholder="z.B. v2-sommer"
              />
            </div>
          )}

          {hasFlyerType && (
            <div className="space-y-1.5">
              <Label htmlFor="flyer_version">Flyer-Version</Label>
              <Input
                id="flyer_version"
                {...register('flyer_version')}
                placeholder="z.B. v1-herbst"
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val: string | null) => {
                    if (val) field.onChange(val);
                  }}
                >
                  <SelectTrigger className="w-full" id="status">
                    <SelectValue>
                      {PLACEMENT_STATUS_LABELS[field.value] ?? field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLACEMENT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optionale Hinweise zu dieser Platzierung..."
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? 'Wird gespeichert...'
                : 'Wird erstellt...'
              : isEditing
                ? 'Speichern'
                : 'Platzierung erstellen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
