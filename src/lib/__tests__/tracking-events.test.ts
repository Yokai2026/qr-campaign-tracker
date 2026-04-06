import { describe, it, expect } from 'vitest';
import { hashIp, parseDevice, isBot, getClientIp, isPrivateIp } from '@/lib/tracking/events';

describe('hashIp', () => {
  it('returns a 16-char hex string', () => {
    const hash = hashIp('192.168.1.1');
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it('returns same hash for same IP on same day', () => {
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'));
  });

  it('returns different hashes for different IPs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('5.6.7.8'));
  });
});

describe('parseDevice', () => {
  it('detects mobile device', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15';
    expect(parseDevice(ua)).toBe('mobile');
  });

  it('defaults to desktop for standard browser UA', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
    expect(parseDevice(ua)).toBe('desktop');
  });
});

describe('isBot', () => {
  it('detects Googlebot', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
  });

  it('detects WhatsApp preview', () => {
    expect(isBot('WhatsApp/2.23.10.75')).toBe(true);
  });

  it('detects curl', () => {
    expect(isBot('curl/7.88.1')).toBe(true);
  });

  it('allows real browsers', () => {
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')).toBe(false);
  });

  it('detects headless browsers', () => {
    expect(isBot('Mozilla/5.0 HeadlessChrome/120.0.0.0')).toBe(true);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(getClientIp(req)).toBe('9.8.7.6');
  });

  it('returns 0.0.0.0 when no headers', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('0.0.0.0');
  });
});

describe('isPrivateIp', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '192.168.1.1',
    '172.16.0.1',
    '172.31.255.255',
    '169.254.1.1',
    '0.0.0.0',
    '::1',
    '::',
    'fe80::1',
    'fc00::1',
    'fd12::1',
  ])('detects %s as private', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '203.0.113.1',
    '172.32.0.1',
    '172.15.0.1',
  ])('detects %s as public', (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });

  it('returns true for empty string', () => {
    expect(isPrivateIp('')).toBe(true);
  });
});
