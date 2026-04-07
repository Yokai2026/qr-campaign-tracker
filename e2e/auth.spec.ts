import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Spurig', { exact: true })).toBeVisible();
    await expect(page.locator('text=Melde dich an')).toBeVisible();
    await expect(page.locator('#identifier')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Registrieren')).toBeVisible();
  });

  test('login form shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', 'invalid@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=Ungültige Anmeldedaten').or(page.locator('text=Benutzername nicht gefunden'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected from settings to login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected from analytics to login', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
