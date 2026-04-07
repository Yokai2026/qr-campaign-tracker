import { test, expect } from '@playwright/test';

test.describe('QR Redirect /r/[code]', () => {
  test('returns 404 HTML for non-existent short code', async ({ request }) => {
    const res = await request.get('/r/nonexistent-code-xyz');
    expect(res.status()).toBe(404);
    expect(res.headers()['content-type']).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('Link nicht gefunden');
  });

  test('returns valid response for empty code path', async ({ request }) => {
    const res = await request.get('/r/');
    // Next.js may serve 200 (dynamic route with empty param) or 404
    expect([200, 404]).toContain(res.status());
  });

  test('includes Datenschutz link in error pages', async ({ request }) => {
    const res = await request.get('/r/does-not-exist');
    const body = await res.text();
    expect(body).toContain('/datenschutz');
  });
});
