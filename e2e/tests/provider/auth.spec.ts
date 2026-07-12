import { test, expect } from '@playwright/test';
import { loginProvider } from '../helpers/auth';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Provider · auth (P01)', () => {
  test('welcome carousel', async ({ page }) => {
    await page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.getByText(/already have an account|work near you|chama fácil|pro/i).first()).toBeVisible();
  });

  test('login form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login → dashboard', async ({ page }) => {
    await loginProvider(page);
    await expect(page).toHaveURL(/\/dashboard|\/\(tabs\)/);
  });
});
