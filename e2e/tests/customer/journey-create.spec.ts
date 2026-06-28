import { test, expect } from '@playwright/test';
import { open, tap, slide } from '../helpers/auth';

test.describe('Journey · customer creates a request (C06→C09)', () => {
  test('walks the wizard and submits → lands on the new request', async ({ page }) => {
    await open(page, '/request/new?categoryId=1');

    // 1 details
    await page.getByText(/Civic do pai/i).first().click().catch(() => {});
    await page.getByPlaceholder(/flat tire|pneu furado/i).first().fill('Pneu furado na marginal, preciso de troca');
    await tap(page, /^continue$/i);
    // 2 photos
    await tap(page, /^continue$/i);
    // 3 location
    await tap(page, /use my location|usar minha/i);
    await page.waitForTimeout(2500);
    await tap(page, /^continue$/i);
    // 4 when
    await tap(page, /^continue$/i);
    // 5 budget & payment
    await tap(page, /^continue$/i);
    // 6 review → slide to submit
    await expect(page.getByText(/6\s*\/\s*6/i)).toBeVisible();
    await slide(page);
    await page.waitForTimeout(3500);

    // submitted → navigated to the created request's detail
    await expect(page).toHaveURL(/\/request\/\d+$/);
  });
});
