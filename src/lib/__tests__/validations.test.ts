import { describe, it, expect } from 'vitest';
import { campaignSchema, locationSchema, qrCodeSchema, shortLinkSchema, trackEventSchema, isUrlSafe } from '@/lib/validations';

describe('campaignSchema', () => {
  const valid = {
    name: 'Frühlingskampagne',
    slug: 'fruehlings-kampagne-2024',
    status: 'draft' as const,
  };

  it('accepts valid campaign', () => {
    expect(campaignSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(campaignSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects invalid slug', () => {
    expect(campaignSchema.safeParse({ ...valid, slug: 'UPPER CASE!' }).success).toBe(false);
  });

  it('rejects invalid status', () => {
    expect(campaignSchema.safeParse({ ...valid, status: 'invalid' }).success).toBe(false);
  });

  it('allows optional description', () => {
    expect(campaignSchema.safeParse({ ...valid, description: '' }).success).toBe(true);
    expect(campaignSchema.safeParse({ ...valid, description: 'Beschreibung' }).success).toBe(true);
  });
});

describe('locationSchema', () => {
  const valid = {
    venue_name: 'Stadtbibliothek',
    location_type: 'library' as const,
    active: true,
  };

  it('accepts valid location', () => {
    expect(locationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty venue_name', () => {
    expect(locationSchema.safeParse({ ...valid, venue_name: '' }).success).toBe(false);
  });

  it('rejects invalid location_type', () => {
    expect(locationSchema.safeParse({ ...valid, location_type: 'casino' }).success).toBe(false);
  });
});

describe('qrCodeSchema', () => {
  const valid = {
    placement_id: '550e8400-e29b-41d4-a716-446655440000',
    target_url: 'https://example.com',
  };

  it('accepts valid QR code', () => {
    expect(qrCodeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(qrCodeSchema.safeParse({ ...valid, placement_id: 'not-uuid' }).success).toBe(false);
  });

  it('rejects invalid URL', () => {
    expect(qrCodeSchema.safeParse({ ...valid, target_url: 'not-a-url' }).success).toBe(false);
  });

  it('validates color format', () => {
    expect(qrCodeSchema.safeParse({ ...valid, qr_fg_color: '#FF0000' }).success).toBe(true);
    expect(qrCodeSchema.safeParse({ ...valid, qr_fg_color: 'red' }).success).toBe(false);
  });

  it('validates max_scans minimum', () => {
    expect(qrCodeSchema.safeParse({ ...valid, max_scans: 0 }).success).toBe(false);
    expect(qrCodeSchema.safeParse({ ...valid, max_scans: 1 }).success).toBe(true);
  });
});

describe('shortLinkSchema', () => {
  const valid = { target_url: 'https://example.com' };

  it('accepts valid short link', () => {
    expect(shortLinkSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short_code under 3 chars', () => {
    expect(shortLinkSchema.safeParse({ ...valid, short_code: 'ab' }).success).toBe(false);
  });

  it('allows valid short_code', () => {
    expect(shortLinkSchema.safeParse({ ...valid, short_code: 'my-link_1' }).success).toBe(true);
  });
});

describe('trackEventSchema', () => {
  it('accepts valid event', () => {
    expect(trackEventSchema.safeParse({ event_type: 'cta_click' }).success).toBe(true);
  });

  it('rejects invalid event_type', () => {
    expect(trackEventSchema.safeParse({ event_type: 'unknown_event' }).success).toBe(false);
  });
});

describe('isUrlSafe', () => {
  it('allows https URLs', () => {
    expect(isUrlSafe('https://example.com')).toBe(true);
  });

  it('allows http URLs', () => {
    expect(isUrlSafe('http://example.com')).toBe(true);
  });

  it('blocks javascript: URLs', () => {
    expect(isUrlSafe('javascript:alert(1)')).toBe(false);
  });

  it('blocks data: URLs', () => {
    expect(isUrlSafe('data:text/html,<h1>Hi</h1>')).toBe(false);
  });

  it('blocks vbscript: URLs', () => {
    expect(isUrlSafe('vbscript:msgbox("hi")')).toBe(false);
  });

  it('blocks file: URLs', () => {
    expect(isUrlSafe('file:///etc/passwd')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isUrlSafe('not a url')).toBe(false);
  });

  it('blocks ftp: URLs', () => {
    expect(isUrlSafe('ftp://files.example.com')).toBe(false);
  });
});
