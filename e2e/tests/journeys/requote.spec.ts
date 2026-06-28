import { test } from '@playwright/test';
import { CUSTOMER, PROVIDER, expect, go, newCustomer, newProvider, shooter, toInProgress, uploadPhoto } from './flow';
import { tap, slide } from '../helpers/auth';

// R-ACRÉSCIMO >50%: a large surcharge forces a mandatory re-quote (C40) the customer must decide.
test('re-quote: provider surcharge >50% → customer accepts the new quote', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('requote');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toInProgress(c, p, 1, 'Recotação E2E', shot);

  // provider proposes a surcharge > 50% of the agreed price → triggers re-quote
  await go(p, `${PROVIDER}/job/${id}/surcharge`);
  const fields = p.getByRole('textbox');
  await fields.nth(0).fill('100');
  await fields.nth(1).fill('Escopo muito maior que o previsto, preciso recotar');
  await uploadPhoto(p, /Photo \(required\)|Foto/i);
  await shot(p, 'provider — large surcharge (re-quote tier)');
  await tap(p, /send for approval/i);
  await p.waitForTimeout(2500);

  // customer gets the mandatory re-quote screen and accepts the new quote
  await go(c, `${CUSTOMER}/request/${id}/requote`);
  await expect(c.getByText(/re-?quote|recota|new quote|nova cotação/i).first()).toBeVisible();
  await shot(c, 'customer — re-quote decision');
  await slide(c);
  await c.waitForTimeout(2500);
  await shot(c, 'customer — re-quote accepted');

  await cc.close();
  await pc.close();
});
