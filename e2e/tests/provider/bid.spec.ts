import { test, expect } from '@playwright/test';
import { open, tap } from '../helpers/auth';

test.describe('Provider · bid wizard (P09–P11)', () => {
  test('P09 bid wizard: review → questions → price step', async ({ page }) => {
    await open(page, '/job/1/bid'); // guincho, open
    // 4-step wizard: step 1 is the review (the step counter is locale-independent).
    await expect(page.getByText(/etapa 1\/4/i)).toBeVisible();
    // advance review → questions → price, then assert the price dial step.
    await tap(page, /^(continue|continuar)$/i); await page.waitForTimeout(700);
    await tap(page, /^(continue|continuar)$/i); await page.waitForTimeout(700);
    await expect(page.getByText(/preço|price|eta|chegada|arrival/i).first()).toBeVisible();
  });
});
