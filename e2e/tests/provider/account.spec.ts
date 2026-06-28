import { test, expect } from '@playwright/test';
import { open } from '../helpers/auth';

test.describe('Provider · account (P20–P23)', () => {
  test('P20 account hub / profile', async ({ page }) => {
    await open(page, '/(tabs)/profile');
    await expect(page.getByText(/Prestador Teste|perfil|profile|conta|account|ganhos|earnings/i).first()).toBeVisible();
  });

  test('P21 edit profile', async ({ page }) => {
    await open(page, '/edit-profile');
    await expect(page.getByText(/perfil|profile|nome|name|bio|seguro|insured|salvar|save/i).first()).toBeVisible();
  });

  test('P22 manage services', async ({ page }) => {
    await open(page, '/config');
    await expect(page.getByText(/serviços|services|categoria|categor|disponib|availab|preço|price/i).first()).toBeVisible();
  });

  test('P23 earnings & withdrawals', async ({ page }) => {
    await open(page, '/earnings');
    await expect(page.getByText(/ganhos|earnings|saldo|balance|saque|withdraw|repasse/i).first()).toBeVisible();
  });
});
