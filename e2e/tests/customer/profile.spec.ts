import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · profile', () => {
  test('profile tab renders', async ({ page }) => {
    await open(page, '/(tabs)/profile');
    await expect(page.getByText(/Cliente Teste|perfil|profile|sair|logout|conta|account/i).first()).toBeVisible();
  });
});
