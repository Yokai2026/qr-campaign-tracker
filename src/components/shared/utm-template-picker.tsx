'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Tag, ChevronDown } from 'lucide-react';
import { getUtmTemplates } from '@/app/(dashboard)/settings/utm-actions';
import type { UtmTemplate } from '@/types';

type UtmValues = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_id: string;
};

type UtmTemplatePickerProps = {
  onSelect: (values: UtmValues) => void;
};

export function UtmTemplatePicker({ onSelect }: UtmTemplatePickerProps) {
  const [templates, setTemplates] = useState<UtmTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      getUtmTemplates().then((data) => {
        setTemplates(data);
        setLoaded(true);
      });
    }
  }, [loaded]);

  if (loaded && templates.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[12px] gap-1.5"
          />
        }
      >
        <Tag className="h-3 w-3" />
        Template
        <ChevronDown className="h-3 w-3 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        {templates.length === 0 ? (
          <p className="px-2 py-3 text-[12px] text-muted-foreground text-center">
            Lade...
          </p>
        ) : (
          <div className="space-y-0.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors"
                onClick={() => {
                  onSelect({
                    utm_source: t.utm_source || '',
                    utm_medium: t.utm_medium || '',
                    utm_campaign: t.utm_campaign || '',
                    utm_content: t.utm_content || '',
                    utm_id: t.utm_id || '',
                  });
                  setOpen(false);
                }}
              >
                <span className="text-[13px] font-medium">{t.name}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {[t.utm_source, t.utm_medium, t.utm_campaign].filter(Boolean).join(' / ') || 'Keine Werte'}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
