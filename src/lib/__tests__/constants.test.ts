import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAppUrl, CAMPAIGN_STATUS_LABELS, LOCATION_TYPE_LABELS, PLACEMENT_STATUS_LABELS } from '@/lib/constants';

describe('getAppUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses NEXT_PUBLIC_APP_URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://spur.example.com');
    expect(getAppUrl()).toBe('https://spur.example.com');
  });

  it('falls back to VERCEL_PROJECT_PRODUCTION_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'spur.vercel.app');
    expect(getAppUrl()).toBe('https://spur.vercel.app');
  });

  it('falls back to VERCEL_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', 'spur-abc123.vercel.app');
    expect(getAppUrl()).toBe('https://spur-abc123.vercel.app');
  });

  it('defaults to localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', '');
    expect(getAppUrl()).toBe('http://localhost:3000');
  });
});

describe('label maps', () => {
  it('has all campaign statuses', () => {
    expect(Object.keys(CAMPAIGN_STATUS_LABELS)).toEqual(
      expect.arrayContaining(['draft', 'active', 'paused', 'completed', 'archived']),
    );
  });

  it('has all location types', () => {
    expect(Object.keys(LOCATION_TYPE_LABELS)).toHaveLength(9);
  });

  it('has all placement statuses', () => {
    expect(Object.keys(PLACEMENT_STATUS_LABELS)).toEqual(
      expect.arrayContaining(['planned', 'installed', 'active', 'paused', 'removed', 'archived']),
    );
  });
});
