import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks after limit exceeded', () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('counts remaining correctly', () => {
    const key = `test-remaining-${Date.now()}`;
    expect(checkRateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(checkRateLimit(key, 5, 60_000).remaining).toBe(3);
    expect(checkRateLimit(key, 5, 60_000).remaining).toBe(2);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    checkRateLimit(key, 1, 50);

    // Wait for the 50ms window to expire
    await new Promise((r) => setTimeout(r, 60));

    const result = checkRateLimit(key, 1, 50);
    expect(result.allowed).toBe(true);
  });

  it('isolates different keys', () => {
    const keyA = `test-iso-a-${Date.now()}`;
    const keyB = `test-iso-b-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      checkRateLimit(keyA, 3, 60_000);
    }

    const resultA = checkRateLimit(keyA, 3, 60_000);
    const resultB = checkRateLimit(keyB, 3, 60_000);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
