'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  /** ISO-Date-String (yyyy-MM-dd). */
  value: string;
  onChange: (value: string) => void;
  /** Placeholder text when no date selected. */
  placeholder?: string;
  /** Disable dates after this ISO date. */
  maxDate?: string;
  /** Disable dates before this ISO date. */
  minDate?: string;
  className?: string;
  ariaLabel?: string;
};

/**
 * Calendar-Popover für ISO-Date-Strings.
 * Ersatz für plain `<input type="date">` — konsistenteres UI über Browser hinweg,
 * klickbarer auf Mobile, zeigt deutsches Datumsformat.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Datum wählen',
  maxDate,
  minDate,
  className,
  ariaLabel,
}: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined;
  const max = maxDate ? parseISO(maxDate) : undefined;
  const min = minDate ? parseISO(minDate) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              'h-9 w-full justify-start gap-2 text-[13px] font-normal',
              !selected && 'text-muted-foreground',
              className,
            )}
            aria-label={ariaLabel}
          />
        }
      >
        <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
        {selected ? format(selected, 'dd.MM.yyyy', { locale: de }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(format(date, 'yyyy-MM-dd'));
          }}
          disabled={(date) => {
            if (max && date > max) return true;
            if (min && date < min) return true;
            return false;
          }}
          locale={de}
          weekStartsOn={1}
        />
      </PopoverContent>
    </Popover>
  );
}
