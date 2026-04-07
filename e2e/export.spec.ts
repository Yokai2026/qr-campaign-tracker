import { test, expect } from '@playwright/test';

test.describe('Export Endpoints', () => {
  test('CSV export redirects to login without auth', async ({ page }) => {
    await page.goto('/api/export?type=qr_codes');
    // Middleware redirects unauthenticated API requests to /login
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('DSGVO data export redirects to login without auth', async ({ page }) => {
    await page.goto('/api/export/my-data');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });
});
