import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Format an ISO date string for display (German locale).
 * Returns '–' for null/undefined/empty values.
 */
export function formatDate(
  iso: string | null | undefined,
  pattern = 'dd.MM.yyyy',
): string {
  if (!iso) return '\u2013';
  try {
    return format(parseISO(iso), pattern, { locale: de });
  } catch {
    return '\u2013';
  }
}

/**
 * Format an ISO datetime string for display (German locale).
 */
export function formatDateTime(iso: string | null | undefined): string {
  return formatDate(iso, 'dd.MM.yyyy HH:mm');
}

/**
 * Truncate a URL for display.
 */
export function truncateUrl(url: string, max = 45): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + '\u2026';
}
