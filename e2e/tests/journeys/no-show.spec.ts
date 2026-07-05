import { test } from '@playwright/test';
import { CUSTOMER, expect, go, newCustomer, newProvider, shooter, toAccepted } from './flow';
import { tap } from '../helpers/auth';

// C35/C36: provider never shows → customer reopens the request to other pros.
test('no-show: customer reopens an accepted request', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('no-show');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toAccepted(c, p, 1, 'No-show E2E', shot);

  await go(c, `${CUSTOMER}/request/${id}/no-show`);
  await shot(c, 'customer — no-show options');
  await tap(c, /reopen/i);
  await c.waitForTimeout(2500);

  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/propostas|proposals/i).first()).toBeVisible();
  await shot(c, 'customer — request reopened');

  await cc.close();
  await pc.close();
});
