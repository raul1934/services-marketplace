import { test, expect } from '@playwright/test';
import { loginCustomer } from '../helpers/auth';

// Auth screens must be tested unauthenticated — drop the stored session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Customer · auth (C01–C04)', () => {
  test('C04 welcome/tutorial carousel', async ({ page }) => {
    await page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.getByText(/already have an account|work near you|walvee/i).first()).toBeVisible();
  });

  test('C02 login form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('C01 register form', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('C02 login → home', async ({ page }) => {
    await loginCustomer(page);
    await expect(page).toHaveURL(/\/home|\/\(tabs\)/);
  });
});
