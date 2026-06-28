import { test } from '@playwright/test';
import { CUSTOMER, PROVIDER, expect, go, newCustomer, newProvider, shooter, toAccepted } from './flow';
import { tap } from '../helpers/auth';

// R-AGENDA: provider proposes a new date (P25) → customer accepts (C43).
test('reschedule: provider requests → customer accepts', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('reschedule');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toAccepted(c, p, 1, 'Remarcação E2E', shot);

  await go(p, `${PROVIDER}/job/${id}/reschedule`);
  await p.getByRole('textbox').first().fill('2026-07-15');
  await shot(p, 'provider — propose new date');
  await tap(p, /send request/i);
  await p.waitForTimeout(2000);

  await go(c, `${CUSTOMER}/request/${id}/reschedule`);
  await expect(c.getByText(/accept new date|aceitar nova data/i)).toBeVisible();
  await shot(c, 'customer — incoming reschedule');
  await tap(c, /accept new date|aceitar nova data/i);
  await c.waitForTimeout(2000);

  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/track|acompanhar|código de início|start code/i).first()).toBeVisible();
  await shot(c, 'customer — reschedule accepted (request active)');

  await cc.close();
  await pc.close();
});
