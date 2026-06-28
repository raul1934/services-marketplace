import { test } from '@playwright/test';
import { CUSTOMER, expect, go, newCustomer, newProvider, shooter, toCompleted } from './flow';
import { tap } from '../helpers/auth';

// C41/C42: customer opens a warranty claim on a completed job.
test('warranty: customer opens a claim on a completed job', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('warranty');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toCompleted(c, p, 1, 'Garantia E2E', shot);

  await go(c, `${CUSTOMER}/request/${id}/warranty`);
  await c.getByRole('textbox').first().fill('O reparo apresentou problema novamente, solicito refazer.');
  await shot(c, 'customer — opening warranty claim');
  await tap(c, /open claim|abrir/i);
  await c.waitForTimeout(2500);

  await expect(c.getByText(/redo|refazer|refund|reembolso|in progress|aberto|open/i).first()).toBeVisible();
  await shot(c, 'customer — claim opened');

  await cc.close();
  await pc.close();
});
