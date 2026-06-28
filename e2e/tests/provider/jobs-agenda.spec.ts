import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Provider · jobs & agenda (P24)', () => {
  test('jobs tab (jobs/bids segments)', async ({ page }) => {
    await open(page, '/(tabs)/jobs');
    await expect(page.getByText(/trabalhos|jobs|propostas|bids/i).first()).toBeVisible();
  });

  test('P24 agenda tab', async ({ page }) => {
    await open(page, '/(tabs)/agenda');
    await expect(page.getByText(/agenda|hoje|today|sem agendamentos|nothing/i).first()).toBeVisible();
  });
});
