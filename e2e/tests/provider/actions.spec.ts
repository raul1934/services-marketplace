import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Provider · action screens (P15/P18/P19/P25)', () => {
  test('P15 compose surcharge', async ({ page }) => {
    await open(page, '/job/6/surcharge');
    await expect(page.getByText(/acréscimo|surcharge|motivo|reason|valor|amount/i).first()).toBeVisible();
  });

  test('P25 reschedule', async ({ page }) => {
    await open(page, '/job/3/reschedule');
    await expect(page.getByText(/remarc|reschedule|nova data|new date|período|period/i).first()).toBeVisible();
  });

  test('P19 dispute defense (empty when no dispute)', async ({ page }) => {
    await open(page, '/job/13/dispute');
    await expect(page.getByText(/disputa|dispute|defesa|defense|nenhuma|no dispute/i).first()).toBeVisible();
  });

  test('P18 rate client', async ({ page }) => {
    await open(page, '/job/13/rate-client');
    await expect(page.getByText(/avaliar|rate|cliente|client|estrela|star/i).first()).toBeVisible();
  });
});
