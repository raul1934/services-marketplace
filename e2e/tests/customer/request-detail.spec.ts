import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Customer · request detail states (C09/C17/C18/C28/C29/C34)', () => {
  test('C09 open request → view proposals', async ({ page }) => {
    await open(page, '/request/1');
    await expect(page.getByText(/ver propostas|view proposals/i)).toBeVisible();
  });

  test('C17 accepted request shows the start code card', async ({ page }) => {
    await open(page, '/request/3');
    await expect(page.getByText(/código de início|start code/i)).toBeVisible();
  });

  test('C18/C19 in-progress request shows parts approval', async ({ page }) => {
    await open(page, '/request/6');
    await expect(page.getByText(/aprovar|approve|acréscimo|surcharge|acompanhar|track/i).first()).toBeVisible();
  });

  test('C28 completed request offers receipt + rating + warranty/dispute', async ({ page }) => {
    await open(page, '/request/13');
    await expect(page.getByText(/recibo|receipt|avaliar|rate|garantia|warranty/i).first()).toBeVisible();
  });

  test('C34 cancelled request', async ({ page }) => {
    await open(page, '/request/5');
    await expect(page.getByText(/cancelad|cancel/i).first()).toBeVisible();
  });

  test('C29 expired request', async ({ page }) => {
    await open(page, '/request/4');
    await expect(page.getByText(/expirad|expired|encerrad/i).first()).toBeVisible();
  });
});
