import crypto from 'node:crypto';

const PREFIX = 'spr_live_';
const SECRET_BYTES = 24; // 24 random bytes → ~32 char base64url

export type GeneratedToken = {
  full: string;       // spr_live_<random>  — nur einmalig zurueckgeben
  prefix: string;     // erste 12 Zeichen fuer UI
  hash: string;       // SHA-256 hex, das was in DB landet
};

export function generateToken(): GeneratedToken {
  const raw = crypto.randomBytes(SECRET_BYTES).toString('base64url');
  const full = `${PREFIX}${raw}`;
  const prefix = full.slice(0, 16); // "spr_live_xxxxxxx"
  const hash = hashToken(full);
  return { full, prefix, hash };
}

export function hashToken(full: string): string {
  return crypto.createHash('sha256').update(full).digest('hex');
}

// Prueft Format ohne Hash-Lookup — fuer fruehe 401-Reject auf Garbage-Input.
export function looksLikeToken(value: string): boolean {
  return /^spr_live_[A-Za-z0-9_-]{20,}$/.test(value);
}
