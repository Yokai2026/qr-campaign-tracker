import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { anonymizeIp, hashIp, isBot, isPrivateIp, getClientIp, parseDevice } from './events';

// ============================================
// anonymizeIp
// ============================================

describe('anonymizeIp', () => {
  it('zeros last two octets of IPv4', () => {
    expect(anonymizeIp('192.168.1.42')).toBe('192.168.0.0');
  });

  it('zeros last two octets of another IPv4', () => {
    expect(anonymizeIp('10.20.30.40')).toBe('10.20.0.0');
  });

  it('handles 0.0.0.0', () => {
    expect(anonymizeIp('0.0.0.0')).toBe('0.0.0.0');
  });

  it('handles 255.255.255.255', () => {
    expect(anonymizeIp('255.255.0.0')).toBe('255.255.0.0');
  });

  it('keeps first 3 groups of IPv6 and zeros rest', () => {
    expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:0:0:0:0:0');
  });

  it('handles short IPv6', () => {
    // '::1' splits to ['', '', '1'], first 3 groups kept, rest zeroed
    expect(anonymizeIp('::1')).toBe('::1:0:0:0:0:0');
  });
});

// ============================================
// hashIp
// ============================================

describe('hashIp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-07'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a 16-character hex string', () => {
    const hash = hashIp('192.168.1.42');
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it('returns same hash for same IP on same day', () => {
    expect(hashIp('10.20.30.40')).toBe(hashIp('10.20.30.40'));
  });

  it('returns same hash for IPs in the same /16 subnet', () => {
    // Both become 10.20.0.0 after anonymization
    expect(hashIp('10.20.30.40')).toBe(hashIp('10.20.99.100'));
  });

  it('returns different hash for different subnets', () => {
    expect(hashIp('10.20.30.40')).not.toBe(hashIp('10.21.30.40'));
  });

  it('returns different hash on different days', () => {
    const hash1 = hashIp('192.168.1.1');
    vi.setSystemTime(new Date('2026-04-08'));
    const hash2 = hashIp('192.168.1.1');
    expect(hash1).not.toBe(hash2);
  });
});

// ============================================
// isBot
// ============================================

describe('isBot', () => {
  it('detects Googlebot', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
  });

  it('detects Facebook crawler', () => {
    expect(isBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true);
  });

  it('detects Slack preview', () => {
    expect(isBot('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)')).toBe(true);
  });

  it('detects WhatsApp', () => {
    expect(isBot('WhatsApp/2.23.20.0 N')).toBe(true);
  });

  it('detects curl', () => {
    expect(isBot('curl/7.88.1')).toBe(true);
  });

  it('detects headless browser', () => {
    expect(isBot('Mozilla/5.0 HeadlessChrome/120.0.0.0')).toBe(true);
  });

  it('returns false for regular Chrome', () => {
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')).toBe(false);
  });

  it('returns false for regular Safari on iPhone', () => {
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isBot('GOOGLEBOT')).toBe(true);
    expect(isBot('Twitterbot/1.0')).toBe(true);
  });
});

// ============================================
// isPrivateIp
// ============================================

describe('isPrivateIp', () => {
  it('detects 10.x.x.x (RFC1918)', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('10.255.255.255')).toBe(true);
  });

  it('detects 192.168.x.x (RFC1918)', () => {
    expect(isPrivateIp('192.168.0.1')).toBe(true);
    expect(isPrivateIp('192.168.100.200')).toBe(true);
  });

  it('detects 172.16-31.x.x (RFC1918)', () => {
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
  });

  it('rejects 172.15.x.x and 172.32.x.x', () => {
    expect(isPrivateIp('172.15.0.1')).toBe(false);
    expect(isPrivateIp('172.32.0.1')).toBe(false);
  });

  it('detects loopback', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('127.0.0.42')).toBe(true);
    expect(isPrivateIp('::1')).toBe(true);
  });

  it('detects unspecified addresses', () => {
    expect(isPrivateIp('0.0.0.0')).toBe(true);
    expect(isPrivateIp('::')).toBe(true);
  });

  it('detects link-local', () => {
    expect(isPrivateIp('169.254.1.1')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
  });

  it('detects IPv6 ULA', () => {
    expect(isPrivateIp('fc00::1')).toBe(true);
    expect(isPrivateIp('fd12:3456::1')).toBe(true);
  });

  it('rejects public IPs', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('203.0.113.5')).toBe(false);
  });

  it('detects empty/missing IP', () => {
    expect(isPrivateIp('')).toBe(true);
  });
});

// ============================================
// parseDevice
// ============================================

describe('parseDevice', () => {
  it('detects mobile from mobile UA', () => {
    expect(parseDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile Safari/537.36')).toBe('mobile');
  });

  it('detects desktop from desktop UA', () => {
    expect(parseDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')).toBe('desktop');
  });

  it('detects tablet from iPad UA', () => {
    expect(parseDevice('Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe('tablet');
  });
});

// ============================================
// getClientIp
// ============================================

describe('getClientIp', () => {
  it('returns x-forwarded-for first IP', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns x-real-ip if no forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(getClientIp(req)).toBe('9.8.7.6');
  });

  it('returns 0.0.0.0 if no IP headers', () => {
    const req = new Request('https://example.com');
    expect(getClientIp(req)).toBe('0.0.0.0');
  });
});
