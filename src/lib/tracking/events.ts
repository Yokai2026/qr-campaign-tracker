import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

export function hashIp(ip: string): string {
  // Hash with a daily salt to anonymize while allowing same-day dedup
  const daySalt = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16);
}

export function parseDevice(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  if (device.type) return device.type; // mobile, tablet, etc.
  return 'desktop';
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}
