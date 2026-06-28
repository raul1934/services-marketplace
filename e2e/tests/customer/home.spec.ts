import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · home & categories (C05/C06)', () => {
  test('C05 home renders', async ({ page }) => {
    await open(page, '/(tabs)/home');
    await expect(page.getByText(/cliente|guincho|encanador|pneu|bateria|pedir|request|chamado|profile|perfil/i).first()).toBeVisible();
  });

  test('C06 categories lists services', async ({ page }) => {
    await open(page, '/categories');
    await expect(page.getByText(/guincho|bateria|encanador|eletricista|chaveiro/i).first()).toBeVisible();
  });
});
