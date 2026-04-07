import { describe, it, expect } from 'vitest';
import {
  normalizeReferrer,
  sanitizeUrl,
  parseUserAgentMinimal,
  sanitizeMetadata,
} from './privacy';

// ============================================
// normalizeReferrer
// ============================================

describe('normalizeReferrer', () => {
  it('returns hostname only from full URL', () => {
    expect(normalizeReferrer('https://www.google.com/search?q=test')).toBe('www.google.com');
  });

  it('returns hostname without path', () => {
    expect(normalizeReferrer('https://example.com/some/deep/path?foo=bar#hash')).toBe('example.com');
  });

  it('returns null for empty input', () => {
    expect(normalizeReferrer(null)).toBeNull();
    expect(normalizeReferrer('')).toBeNull();
  });

  it('returns null for non-http protocols', () => {
    expect(normalizeReferrer('ftp://files.example.com/doc')).toBeNull();
    expect(normalizeReferrer('javascript:alert(1)')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(normalizeReferrer('not-a-url')).toBeNull();
  });

  it('filters own hostnames when provided', () => {
    expect(normalizeReferrer('https://app.spurig.de/dashboard', ['spurig.de'])).toBeNull();
    expect(normalizeReferrer('https://spurig.de/', ['spurig.de'])).toBeNull();
  });

  it('keeps external referrers when own hostnames provided', () => {
    expect(normalizeReferrer('https://google.com/', ['spurig.de'])).toBe('google.com');
  });

  it('lowercases hostname', () => {
    expect(normalizeReferrer('https://WWW.Example.COM/path')).toBe('www.example.com');
  });
});

// ============================================
// sanitizeUrl
// ============================================

describe('sanitizeUrl', () => {
  it('returns URL unchanged when no PII params', () => {
    expect(sanitizeUrl('https://example.com/page?utm_source=qr&ref=abc')).toBe(
      'https://example.com/page?utm_source=qr&ref=abc',
    );
  });

  it('strips email parameter', () => {
    const result = sanitizeUrl('https://example.com/signup?email=john@test.com&utm_source=qr');
    expect(result).not.toContain('email=');
    expect(result).toContain('utm_source=qr');
  });

  it('strips multiple PII parameters', () => {
    const result = sanitizeUrl('https://example.com?name=John&phone=123&token=abc&utm_medium=poster');
    expect(result).not.toContain('name=');
    expect(result).not.toContain('phone=');
    expect(result).not.toContain('token=');
    expect(result).toContain('utm_medium=poster');
  });

  it('strips third-party click IDs', () => {
    const result = sanitizeUrl('https://example.com?fbclid=abc123&gclid=xyz&msclkid=999');
    expect(result).not.toContain('fbclid=');
    expect(result).not.toContain('gclid=');
    expect(result).not.toContain('msclkid=');
  });

  it('removes URL fragment', () => {
    const result = sanitizeUrl('https://example.com/page#user-section');
    expect(result).not.toContain('#');
  });

  it('returns null for empty/null input', () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
  });

  it('returns null for non-http URLs', () => {
    expect(sanitizeUrl('ftp://files.example.com')).toBeNull();
    expect(sanitizeUrl('javascript:void(0)')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('preserves UTM parameters', () => {
    const url = 'https://example.com?utm_source=qr&utm_medium=poster&utm_campaign=spring&utm_content=v1&utm_id=123';
    const result = sanitizeUrl(url);
    expect(result).toContain('utm_source=qr');
    expect(result).toContain('utm_medium=poster');
    expect(result).toContain('utm_campaign=spring');
    expect(result).toContain('utm_content=v1');
    expect(result).toContain('utm_id=123');
  });

  it('strips auth-related parameters', () => {
    const result = sanitizeUrl('https://example.com?access_token=secret&session_id=abc&password=hunter2');
    expect(result).not.toContain('access_token=');
    expect(result).not.toContain('session_id=');
    expect(result).not.toContain('password=');
  });
});

// ============================================
// parseUserAgentMinimal
// ============================================

describe('parseUserAgentMinimal', () => {
  it('detects mobile Chrome on Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('mobile');
    expect(result.browser_family).toBe('Chrome');
    expect(result.os_family).toBe('Android');
  });

  it('detects desktop Firefox on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('desktop');
    expect(result.browser_family).toBe('Firefox');
    expect(result.os_family).toBe('Windows');
  });

  it('detects Safari on iOS', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('mobile');
    expect(result.browser_family).toBe('Safari');
    expect(result.os_family).toBe('iOS');
  });

  it('detects tablet iPad', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('tablet');
    expect(result.browser_family).toBe('Safari');
    expect(result.os_family).toBe('iOS');
  });

  it('detects Edge on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('desktop');
    expect(result.browser_family).toBe('Edge');
    expect(result.os_family).toBe('macOS');
  });

  it('returns unknown for empty string', () => {
    const result = parseUserAgentMinimal('');
    expect(result.device_type).toBe('unknown');
    expect(result.browser_family).toBe('unknown');
    expect(result.os_family).toBe('unknown');
  });

  it('does not return version numbers', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.6099.130 Safari/537.36';
    const result = parseUserAgentMinimal(ua);
    expect(result.browser_family).not.toContain('120');
    expect(result.os_family).not.toContain('10.0');
  });

  it('detects Linux desktop', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
    const result = parseUserAgentMinimal(ua);
    expect(result.device_type).toBe('desktop');
    expect(result.browser_family).toBe('Firefox');
    expect(result.os_family).toBe('Linux');
  });
});

// ============================================
// sanitizeMetadata
// ============================================

describe('sanitizeMetadata', () => {
  it('passes through valid metadata', () => {
    const result = sanitizeMetadata({ action: 'click', count: 5, active: true });
    expect(result).toEqual({ action: 'click', count: 5, active: true });
  });

  it('strips PII keys', () => {
    const result = sanitizeMetadata({ email: 'test@example.com', action: 'click', phone: '123' });
    expect(result).toEqual({ action: 'click' });
  });

  it('truncates long string values', () => {
    const longValue = 'a'.repeat(300);
    const result = sanitizeMetadata({ description: longValue });
    expect(result!.description).toHaveLength(200);
  });

  it('limits to 10 keys', () => {
    const input: Record<string, string> = {};
    for (let i = 0; i < 15; i++) {
      input[`key${String(i).padStart(2, '0')}`] = `val${i}`;
    }
    const result = sanitizeMetadata(input);
    expect(Object.keys(result!)).toHaveLength(10);
  });

  it('returns null for empty object', () => {
    expect(sanitizeMetadata({})).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(sanitizeMetadata(null)).toBeNull();
    expect(sanitizeMetadata('string')).toBeNull();
    expect(sanitizeMetadata(42)).toBeNull();
    expect(sanitizeMetadata([1, 2])).toBeNull();
  });

  it('rejects invalid key formats', () => {
    const result = sanitizeMetadata({ 'Invalid-Key': 'val', '123start': 'val', valid_key: 'ok' });
    expect(result).toEqual({ valid_key: 'ok' });
  });

  it('skips non-primitive values', () => {
    const result = sanitizeMetadata({ action: 'click', nested: { a: 1 }, list: [1, 2] });
    expect(result).toEqual({ action: 'click' });
  });

  it('rejects NaN and Infinity numbers', () => {
    const result = sanitizeMetadata({ valid: 42, nan: NaN, inf: Infinity });
    expect(result).toEqual({ valid: 42 });
  });

  it('strips auth/session keys', () => {
    const result = sanitizeMetadata({ token: 'abc', session: 'xyz', password: '123', action: 'submit' });
    expect(result).toEqual({ action: 'submit' });
  });
});
