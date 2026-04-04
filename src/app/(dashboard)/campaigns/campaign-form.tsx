'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import type { CampaignStatus, CampaignInput } from '@/types';
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createCampaign, updateCampaign } from './actions';

// ---------------------------------------------------------------------------
// Schema (tags as comma-separated string for the form)
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  slug: z.string().min(1, 'Slug ist erforderlich').max(100)
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  description: z.string().max(2000),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  start_date: z.string(),
  end_date: z.string(),
  tags: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CampaignFormProps {
  /** If provided the form operates in edit mode. */
  campaignId?: string;
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    status: CampaignStatus;
    start_date: string;
    end_date: string;
    tags: string[];
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignForm({ campaignId, defaultValues }: CampaignFormProps) {
  const router = useRouter();
  const isEditing = Boolean(campaignId);
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'draft',
      start_date: defaultValues?.start_date ?? '',
      end_date: defaultValues?.end_date ?? '',
      tags: defaultValues?.tags?.join(', ') ?? '',
    },
  });

  const nameReg = register('name');

  function onSubmit(data: FormValues) {
    const input: CampaignInput = {
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      status: data.status,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      tags: data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    startTransition(async () => {
      try {
        if (isEditing && campaignId) {
          await updateCampaign(campaignId, input);
          toast.success('Kampagne aktualisiert');
        } else {
          await createCampaign(input);
          toast.success('Kampagne erstellt');
        }
        router.push('/campaigns');
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Ein Fehler ist aufgetreten',
        );
      }
    });
  }

  const statusEntries = Object.entries(CAMPAIGN_STATUS_LABELS) as [
    CampaignStatus,
    string,
  ][];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Kampagne bearbeiten' : 'Neue Kampagne'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...nameReg}
              onChange={(e) => {
                nameReg.onChange(e);
                if (!slugTouched) {
                  setValue('slug', generateSlug(e.target.value));
                }
              }}
              placeholder="z.B. Sommer-Leseaktion 2026"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register('slug', {
                onChange: () => setSlugTouched(true),
              })}
              placeholder="sommer-leseaktion-2026"
              className="font-mono"
              aria-invalid={!!errors.slug}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Wird automatisch aus dem Namen generiert. Nur Kleinbuchstaben,
              Zahlen und Bindestriche.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optionale Beschreibung der Kampagne..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusEntries.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="z.B. sommer, lesen, kinder"
            />
            <p className="text-xs text-muted-foreground">
              Kommagetrennte Liste von Tags.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/campaigns')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Wird gespeichert...'
              : isEditing
                ? 'Speichern'
                : 'Erstellen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
