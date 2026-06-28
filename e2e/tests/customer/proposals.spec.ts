import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · proposals (C12–C14)', () => {
  test('C12 proposals screen lists competing bids', async ({ page }) => {
    await open(page, '/request/1/proposals'); // guincho (open) — seeded with 3 bidders
    await expect(page.getByText(/proposta|proposal/i).first()).toBeVisible();
    await expect(page.getByText(/João|Maria|Carlos/i).first()).toBeVisible(); // seeded bidders
  });
});
