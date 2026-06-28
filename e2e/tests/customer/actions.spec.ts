import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · action screens (C16/C20/C21/C35/C37/C40/C41/C43)', () => {
  test('C16 surcharge approval', async ({ page }) => {
    await open(page, '/request/6/surcharge');
    await expect(page.getByText(/acréscimo|surcharge/i).first()).toBeVisible();
  });

  test('C40 mandatory re-quote', async ({ page }) => {
    await open(page, '/request/14/requote');
    await expect(page.getByText(/re-?quote|re-?cota|recotação|new quote|nova cotação/i).first()).toBeVisible();
  });

  test('C43 reschedule', async ({ page }) => {
    await open(page, '/request/3/reschedule');
    await expect(page.getByText(/remarc|reschedule|nova data|new date/i).first()).toBeVisible();
  });

  test('C35 no-show', async ({ page }) => {
    await open(page, '/request/3/no-show');
    await expect(page.getByText(/no-?show|não apareceu|reabrir|reopen/i).first()).toBeVisible();
  });

  test('C37 open dispute', async ({ page }) => {
    await open(page, '/request/13/dispute');
    await expect(page.getByText(/disputa|dispute/i).first()).toBeVisible();
  });

  test('C41 warranty', async ({ page }) => {
    await open(page, '/request/13/warranty');
    await expect(page.getByText(/garantia|warranty|refazer|redo|reembolso|refund/i).first()).toBeVisible();
  });

  test('C21 rate provider', async ({ page }) => {
    await open(page, '/request/13/rate');
    await expect(page.getByText(/avaliar|avalie|rate|estrela|star|gorjeta|tip/i).first()).toBeVisible();
  });
});
