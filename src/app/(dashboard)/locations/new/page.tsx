'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { locationSchema } from '@/lib/validations';
import { LOCATION_TYPE_LABELS } from '@/lib/constants';
import type { LocationInput, LocationType } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { createLocation } from '../actions';

const LOCATION_TYPES = Object.keys(LOCATION_TYPE_LABELS) as LocationType[];

export default function NewLocationPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data: LocationInput = {
      venue_name: formData.get('venue_name') as string,
      district: (formData.get('district') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      location_type: formData.get('location_type') as LocationType,
      notes: (formData.get('notes') as string) || undefined,
      active: formData.get('active') === 'on',
    };

    // Client-side validation
    const parsed = locationSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    try {
      const result = await createLocation(data);
      if (result.success) {
        toast.success('Standort erfolgreich erstellt.');
        router.push(`/locations/${result.id}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Neuer Standort" description="Einen neuen Standort anlegen." />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Venue name */}
            <div className="space-y-1.5">
              <Label htmlFor="venue_name">Ortsname *</Label>
              <Input
                id="venue_name"
                name="venue_name"
                placeholder="z.B. Stadtbibliothek Mitte"
                required
                aria-invalid={!!errors.venue_name}
              />
              {errors.venue_name && (
                <p className="text-xs text-destructive">{errors.venue_name}</p>
              )}
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <Label htmlFor="district">Bezirk</Label>
              <Input
                id="district"
                name="district"
                placeholder="z.B. Mitte"
              />
              {errors.district && (
                <p className="text-xs text-destructive">{errors.district}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                placeholder="Straße, PLZ Ort"
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address}</p>
              )}
            </div>

            {/* Location type */}
            <div className="space-y-1.5">
              <Label htmlFor="location_type">Typ *</Label>
              <Select name="location_type" defaultValue="other" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LOCATION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_type && (
                <p className="text-xs text-destructive">{errors.location_type}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optionale Hinweise zum Standort..."
                rows={3}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes}</p>
              )}
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <Checkbox id="active" name="active" defaultChecked />
              <Label htmlFor="active" className="cursor-pointer">
                Aktiv
              </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Wird erstellt...' : 'Standort erstellen'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/locations')}
                disabled={isPending}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
