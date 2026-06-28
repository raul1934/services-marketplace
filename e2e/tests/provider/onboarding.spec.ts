import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

// The seeded dev provider is already approved, so /onboarding and /pending guard-
// redirect to the dashboard. These screens are only reachable with an unapproved
// account (not seeded) — skipped until such a fixture exists.
test.describe('Provider · onboarding (P02/P03)', () => {
  test.skip('P02 onboarding (documents/categories) loads', async ({ page }) => {
    await open(page, '/onboarding');
    await expect(page.getByText(/document|documento|categoria|selfie|enviar|submit/i).first()).toBeVisible();
  });

  test.skip('P03 pending-approval screen loads', async ({ page }) => {
    await open(page, '/pending');
    await expect(page.getByText(/aprovação|approval|análise|review|aguard|pending/i).first()).toBeVisible();
  });

  test('approved provider is redirected away from onboarding', async ({ page }) => {
    await open(page, '/onboarding');
    await expect(page).toHaveURL(/\/dashboard|\/\(tabs\)/);
  });
});
