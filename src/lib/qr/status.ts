import type { QrCode } from '@/types';

/**
 * Compute a display status for a QR code.
 * This is a pure function that can be used in client or server components.
 */
export function computeQrStatus(qr: Pick<QrCode, 'active' | 'valid_until'>): string {
  if (!qr.active) return 'inactive';
  if (qr.valid_until && new Date(qr.valid_until) < new Date()) return 'expired';
  return 'active';
}
