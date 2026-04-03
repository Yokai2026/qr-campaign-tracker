'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterOption = {
  value: string;
  label: string;
};

type FilterDef = {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
};

type FilterToolbarProps = {
  filters: FilterDef[];
  searchKey?: string;
  searchPlaceholder?: string;
  className?: string;
};

export function FilterToolbar({
  filters,
  searchKey,
  searchPlaceholder = 'Suchen...',
  className,
}: FilterToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const hasActiveFilters = filters.some(
    (f) => searchParams.has(f.key) && searchParams.get(f.key) !== 'all',
  ) || (searchKey && searchParams.has(searchKey));

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {searchKey && (
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Input
            placeholder={searchPlaceholder}
            defaultValue={searchParams.get(searchKey) ?? ''}
            onChange={(e) => updateParam(searchKey, e.target.value || undefined)}
          />
        </div>
      )}
      {filters.map((filter) => (
        <div key={filter.key} className="w-full sm:w-auto sm:min-w-[160px]">
          <Select
            value={searchParams.get(filter.key) ?? 'all'}
            onValueChange={(v) => updateParam(filter.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder ?? filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {filter.placeholder ?? `Alle ${filter.label}`}
              </SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="mr-1 h-3 w-3" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
