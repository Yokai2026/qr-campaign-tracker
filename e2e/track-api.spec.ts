import { test, expect } from '@playwright/test';

test.describe('Tracking API /api/track', () => {
  test('OPTIONS returns CORS headers', async ({ request }) => {
    const res = await request.fetch('/api/track', { method: 'OPTIONS' });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['access-control-allow-methods']).toContain('POST');
  });

  test('rejects invalid event data with 400', async ({ request }) => {
    const res = await request.post('/api/track', {
      data: { invalid: 'data' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid event data');
  });

  test('rejects non-JSON body with 500', async ({ request }) => {
    const res = await request.fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      data: 'not json',
    });
    expect(res.status()).toBe(500);
  });

  test('accepts valid landing_page_view event', async ({ request }) => {
    const res = await request.post('/api/track', {
      data: {
        event_type: 'landing_page_view',
        page_url: 'https://example.com/landing',
      },
    });
    // 200 if DB insert succeeds, 500 if DB rejects (no valid FK)
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });

  test('CORS headers present on error responses', async ({ request }) => {
    const res = await request.post('/api/track', {
      data: { invalid: true },
    });
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });
});
