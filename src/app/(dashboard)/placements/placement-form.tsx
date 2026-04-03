'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export function PlacementForm({ campaigns, locations, placement }: PlacementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!placement;

  // Form state
  const [name, setName] = useState(placement?.name ?? '');
  const [placementCode, setPlacementCode] = useState(placement?.placement_code ?? '');
  const [campaignId, setCampaignId] = useState(placement?.campaign_id ?? '');
  const [locationId, setLocationId] = useState(placement?.location_id ?? '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    parseTypes(placement?.placement_type ?? 'poster')
  );
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [posterVersion, setPosterVersion] = useState(placement?.poster_version ?? '');
  const [flyerVersion, setFlyerVersion] = useState(placement?.flyer_version ?? '');
  const [notes, setNotes] = useState(placement?.notes ?? '');
  const [status, setStatus] = useState<PlacementStatus>(placement?.status ?? 'planned');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Auto-generate placement code when campaign and location change (only for new)
  useEffect(() => {
    if (isEditing || !campaignId || !locationId) return;

    const campaign = campaigns.find((c) => c.id === campaignId);
    const location = locations.find((l) => l.id === locationId);
    if (!campaign || !location) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsGeneratingCode(true);
    let cancelled = false;
    generatePlacementCode(campaign.slug, location.venue_name)
      .then((code) => {
        if (!cancelled) setPlacementCode(code);
      })
      .catch(() => {
        // Fallback: manual entry
      })
      .finally(() => {
        if (!cancelled) setIsGeneratingCode(false);
      });
    return () => { cancelled = true; };
  }, [campaignId, locationId, campaigns, locations, isEditing]);

  // Types not yet selected (available to pick)
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

  // Joined type string for DB
  const placementTypeValue = selectedTypes.join(',');

  // Show version fields based on selected types
  const hasPosterType = selectedTypes.some((t) => t === 'poster' || t === 'banner');
  const hasFlyerType = selectedTypes.some((t) => t === 'flyer' || t === 'handout');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const input: PlacementInput = {
      name,
      placement_code: placementCode,
      campaign_id: campaignId,
      location_id: locationId,
      placement_type: placementTypeValue,
      poster_version: posterVersion || undefined,
      flyer_version: flyerVersion || undefined,
      notes: notes || undefined,
      status,
    };

    // Client-side validation
    const result = placementSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-5">
          {/* Campaign */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign_id">Kampagne *</Label>
            <Select value={campaignId} onValueChange={(val: string | null) => setCampaignId(val ?? '')}>
              <SelectTrigger className="w-full" id="campaign_id">
                <SelectValue placeholder="Kampagne wählen...">
                  {campaignId
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
            {errors.campaign_id && (
              <p className="text-xs text-destructive">{errors.campaign_id}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location_id">Standort *</Label>
            <Select value={locationId} onValueChange={(val: string | null) => setLocationId(val ?? '')}>
              <SelectTrigger className="w-full" id="location_id">
                <SelectValue placeholder="Standort wählen...">
                  {locationId
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
            {errors.location_id && (
              <p className="text-xs text-destructive">{errors.location_id}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Poster Haupteingang"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Placement Code */}
          <div className="space-y-1.5">
            <Label htmlFor="placement_code">Code *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="placement_code"
                value={placementCode}
                onChange={(e) => setPlacementCode(e.target.value)}
                placeholder="wird automatisch generiert"
                disabled={isGeneratingCode}
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
              <p className="text-xs text-destructive">{errors.placement_code}</p>
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
                      title="Typ hinzufügen"
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
            {errors.placement_type && (
              <p className="text-xs text-destructive">{errors.placement_type}</p>
            )}
          </div>

          {/* Poster / Flyer version (conditional) */}
          {hasPosterType && (
            <div className="space-y-1.5">
              <Label htmlFor="poster_version">Poster-Version</Label>
              <Input
                id="poster_version"
                value={posterVersion}
                onChange={(e) => setPosterVersion(e.target.value)}
                placeholder="z.B. v2-sommer"
              />
            </div>
          )}

          {hasFlyerType && (
            <div className="space-y-1.5">
              <Label htmlFor="flyer_version">Flyer-Version</Label>
              <Input
                id="flyer_version"
                value={flyerVersion}
                onChange={(e) => setFlyerVersion(e.target.value)}
                placeholder="z.B. v1-herbst"
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={status}
              onValueChange={(val: string | null) => val && setStatus(val as PlacementStatus)}
            >
              <SelectTrigger className="w-full" id="status">
                <SelectValue>
                  {PLACEMENT_STATUS_LABELS[status] ?? status}
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
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
