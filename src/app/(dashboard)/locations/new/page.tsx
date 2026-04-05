'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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

type FormValues = {
  venue_name: string;
  district: string;
  address: string;
  location_type: LocationType;
  notes: string;
  active: boolean;
};

export default function NewLocationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      venue_name: '',
      district: '',
      address: '',
      location_type: 'other',
      notes: '',
      active: true,
    },
  });

  function onSubmit(data: FormValues) {
    const input: LocationInput = {
      venue_name: data.venue_name,
      district: data.district || undefined,
      address: data.address || undefined,
      location_type: data.location_type,
      notes: data.notes || undefined,
      active: data.active,
    };

    const parsed = locationSchema.safeParse(input);
    if (!parsed.success) return;

    startTransition(async () => {
      try {
        const result = await createLocation(input);
        if (result.success) {
          toast.success('Standort erstellt');
          router.push(`/locations/${result.id}`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Unerwarteter Fehler');
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Neuer Standort" description="Einen neuen Standort anlegen" />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Venue name */}
            <div className="space-y-1.5">
              <Label htmlFor="venue_name">Ortsname *</Label>
              <Input
                id="venue_name"
                {...register('venue_name')}
                placeholder="z.B. Stadtbibliothek Mitte"
                aria-invalid={!!errors.venue_name}
              />
              {errors.venue_name && (
                <p className="text-xs text-destructive">{errors.venue_name.message}</p>
              )}
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <Label htmlFor="district">Bezirk</Label>
              <Input
                id="district"
                {...register('district')}
                placeholder="z.B. Mitte"
              />
              {errors.district && (
                <p className="text-xs text-destructive">{errors.district.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Straße, PLZ Ort"
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Location type */}
            <div className="space-y-1.5">
              <Label htmlFor="location_type">Typ *</Label>
              <Controller
                name="location_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => { if (val) field.onChange(val); }}>
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
                )}
              />
              {errors.location_type && (
                <p className="text-xs text-destructive">{errors.location_type.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Optionale Hinweise zum Standort..."
                rows={3}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* Active */}
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Aktiv
                  </Label>
                </div>
              )}
            />

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
