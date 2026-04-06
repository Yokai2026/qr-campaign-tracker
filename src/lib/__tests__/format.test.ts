import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, truncateUrl } from '@/lib/format';

describe('formatDate', () => {
  it('formats ISO date to German format', () => {
    expect(formatDate('2024-03-15')).toBe('15.03.2024');
  });

  it('formats with custom pattern', () => {
    expect(formatDate('2024-12-01', 'yyyy/MM/dd')).toBe('2024/12/01');
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('\u2013');
  });

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('\u2013');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('\u2013');
  });

  it('returns dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('\u2013');
  });
});

describe('formatDateTime', () => {
  it('formats ISO datetime with time', () => {
    // parseISO converts to local timezone, so use a non-UTC string
    expect(formatDateTime('2024-03-15T14:30:00')).toBe('15.03.2024 14:30');
  });

  it('returns dash for null', () => {
    expect(formatDateTime(null)).toBe('\u2013');
  });
});

describe('truncateUrl', () => {
  it('returns short URLs unchanged', () => {
    expect(truncateUrl('https://example.com')).toBe('https://example.com');
  });

  it('truncates long URLs with ellipsis', () => {
    const long = 'https://example.com/very/long/path/that/exceeds/the/limit/of/characters';
    const result = truncateUrl(long, 30);
    expect(result).toHaveLength(31); // 30 + ellipsis char
    expect(result.endsWith('\u2026')).toBe(true);
  });

  it('respects custom max length', () => {
    const url = 'https://example.com/path';
    expect(truncateUrl(url, 10)).toBe('https://ex\u2026');
  });
});
