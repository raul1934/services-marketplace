import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · requests & receipt (C27/C20)', () => {
  test('C27 requests list shows seeded requests', async ({ page }) => {
    await open(page, '/(tabs)/requests');
    await expect(page.getByText(/guincho|encanador|pneu|bateria/i).first()).toBeVisible();
  });

  test('C20 completed request exposes a receipt', async ({ page }) => {
    await open(page, '/request/13/receipt');
    await expect(page.getByText(/total/i)).toBeVisible();
    await expect(page.getByText(/WV-/)).toBeVisible(); // receipt number
  });
});
