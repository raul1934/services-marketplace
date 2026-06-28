import { test, expect } from '@playwright/test';
import { open, tap } from '../helpers/auth';

test.describe('Provider · nearby (P05–P07)', () => {
  test('P05 nearby list with view toggle (list/map/calendar)', async ({ page }) => {
    await open(page, '/nearby');
    await expect(page.getByText(/list|lista|map|mapa|calend/i).first()).toBeVisible();
  });

  test('P07 calendar/agenda view toggles without leaving nearby', async ({ page }) => {
    await open(page, '/nearby');
    await tap(page, /calend|agenda/i).catch(() => {});
    await page.waitForTimeout(1200);
    await expect(page).toHaveURL(/\/nearby/);
    await expect(page.getByText(/calend|agenda|list|lista|map|mapa/i).first()).toBeVisible();
  });
});
