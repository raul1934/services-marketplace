import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Provider · dashboard (P04)', () => {
  test('shows online status, stats and the nearby Bateria tile', async ({ page }) => {
    await open(page, '/(tabs)/dashboard');
    await expect(page.getByText(/online|receiving nearby|recebendo/i).first()).toBeVisible();
    await expect(page.getByText(/Bateria/i)).toBeVisible();
    await expect(page.getByText(/in progress|em andamento|em atendimento/i).first()).toBeVisible();
  });
});
