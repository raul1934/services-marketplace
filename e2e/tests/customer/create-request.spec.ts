import { test, expect } from '@playwright/test';
import { open, tap } from '../helpers/auth';

// Guincho = first roadside category (id 1), which carries custom questions.
test.describe('Customer · create-request wizard (C07/C08)', () => {
  test('C07 walks all 7 steps and ends on a read-only review with payment', async ({ page }) => {
    await open(page, '/request/new?categoryId=1');
    await expect(page.getByText(/1\s*\/\s*7/i)).toBeVisible();

    await page.getByText(/Civic do pai/i).first().click().catch(() => {});
    await page.getByPlaceholder(/flat tire|pneu furado/i).first().fill('Pneu furado, preciso de troca');
    await tap(page, /^continue$/i);

    await expect(page.getByText(/2\s*\/\s*7/i)).toBeVisible();
    await tap(page, /use my location|usar minha/i);
    await page.waitForTimeout(2500);
    await tap(page, /^continue$/i);

    // custom question for Guincho — now its own step
    await expect(page.getByText(/3\s*\/\s*7/i)).toBeVisible();
    await expect(page.getByText(/tow to where|para onde rebocar/i)).toBeVisible();
    await tap(page, /^continue$/i);

    await expect(page.getByText(/4\s*\/\s*7/i)).toBeVisible();
    await tap(page, /^continue$/i);

    await expect(page.getByText(/5\s*\/\s*7/i)).toBeVisible();
    await tap(page, /^continue$/i);

    await expect(page.getByText(/6\s*\/\s*7/i)).toBeVisible();
    await expect(page.getByText(/^Pix$/i).first()).toBeVisible();
    await expect(page.getByText(/^Card$|Cartão/i).first()).toBeVisible();
    await tap(page, /^continue$/i);

    await expect(page.getByText(/7\s*\/\s*7/i)).toBeVisible();
    await expect(page.getByText(/review|revisão/i)).toBeVisible();
    await expect(page.getByText(/budget|orçamento/i)).toBeVisible();
    await expect(page.getByText(/payment|pagamento/i)).toBeVisible();
    await expect(page.getByText(/slide to request|arraste para pedir/i)).toBeVisible();
  });

  test('C07 blocks Continue until the description is filled', async ({ page }) => {
    await open(page, '/request/new?categoryId=1');
    await tap(page, /^continue$/i).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page.getByText(/1\s*\/\s*7/i)).toBeVisible();
  });

  test('C08 home-category create flow loads', async ({ page }) => {
    await open(page, '/request/new?categoryId=13'); // encanador (residential)
    await expect(page.getByText(/1\s*\/\s*7/i)).toBeVisible();
    await expect(page.getByText(/what happened|o que aconteceu|service type|tipo de serviço/i).first()).toBeVisible();
  });
});
