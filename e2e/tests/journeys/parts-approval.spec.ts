import { test } from '@playwright/test';
import { CUSTOMER, PROVIDER, expect, go, newCustomer, newProvider, shooter, toInProgress } from './flow';
import { tap } from '../helpers/auth';

// R-PEÇA: provider requests approval of the running total (P16) → customer approves (C19).
test('parts approval: provider requests → customer approves', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('parts-approval');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toInProgress(c, p, 1, 'Aprovação E2E', shot);

  // The running-total approval lives on the worklog screen (Screen B).
  await go(p, `${PROVIDER}/job/${id}/worklog`);
  await tap(p, /request approval/i);
  await p.waitForTimeout(2000);
  await shot(p, 'provider — approval requested');

  await go(c, `${CUSTOMER}/request/${id}`);
  await shot(c, 'customer — approval prompt');
  await tap(c, /approve total|approve|aprovar/i);
  await c.waitForTimeout(2000);

  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/approved|aprovad/i).first()).toBeVisible();
  await shot(c, 'customer — total approved');

  await cc.close();
  await pc.close();
});
