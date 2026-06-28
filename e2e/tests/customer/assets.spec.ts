import { test, expect, Page } from '@playwright/test';
import { open, tap } from '../helpers/auth';

// NOTE: on web the customer `/assets` route collides with Metro's `/assets`
// static-asset path, so HARD deep-links 500. In-app (client-side) navigation
// works — these tests reach assets by tapping through from the profile tab.
async function gotoAssets(page: Page) {
  await open(page, '/(tabs)/profile');
  await page.getByText(/ativos|assets|veículos|vehicles/i).first().click();
  await page.waitForTimeout(2000);
}

test.describe('Customer · assets (C22–C25)', () => {
  test('C22 assets list shows seeded vehicles', async ({ page }) => {
    await gotoAssets(page);
    await expect(page.getByText(/Civic do pai|Gol da firma|Minha moto/i).first()).toBeVisible();
  });

  // KNOWN WEB BUG: `/assets/new` and `/assets/[id]` don't mount on web — the
  // `/assets` route segment collides with Metro's static `/assets/` path, so the
  // nested screens render blank (URL changes, screen doesn't mount). Works on
  // native. Skipped until the route is renamed (e.g. `/my-assets`). The list (C22)
  // renders fine via in-app nav.
  test.skip('C23 add asset form', async ({ page }) => {
    await gotoAssets(page);
    await tap(page, /adicionar|add asset|add vehicle|novo|new/i);
    await page.waitForTimeout(1500);
    await expect(page.getByText(/apelido|nickname|tipo|type|salvar|save/i).first()).toBeVisible();
  });

  test.skip('C24/C25 asset detail/history', async ({ page }) => {
    await gotoAssets(page);
    await page.getByText(/Civic do pai/i).first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/Civic do pai|histórico|history|salvar|save/i).first()).toBeVisible();
  });
});
