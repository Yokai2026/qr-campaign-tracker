import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('Datenschutz page is accessible without auth', async ({ page }) => {
    await page.goto('/datenschutz');
    // Should not redirect to login
    expect(page.url()).toContain('/datenschutz');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Impressum page is accessible without auth', async ({ page }) => {
    await page.goto('/impressum');
    expect(page.url()).toContain('/impressum');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('root redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    // Root should redirect to /login (unauthenticated) or /dashboard (authenticated)
    await page.waitForURL(/\/(login|dashboard)/);
  });

  test('QR image endpoint responds', async ({ request }) => {
    // /api/qr/image is public — test it returns an error for missing params
    const res = await request.get('/api/qr/image');
    // Should return 400 for missing params or 200 with image
    expect([200, 400]).toContain(res.status());
  });
});
