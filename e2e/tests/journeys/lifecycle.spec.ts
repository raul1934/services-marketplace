import { test } from '@playwright/test';
import { CUSTOMER, expect, go, newCustomer, newProvider, shooter, createRequest, providerBid, customerAccept, providerStart, providerComplete } from './flow';

// The whole V5 happy path, driven across both apps. Creates its own request → idempotent.
test('full lifecycle: create → bid → accept → start → complete → receipt', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('lifecycle');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await createRequest(c, 1, 'Bateria descarregada, preciso de partida', shot);
  await providerBid(p, id, shot);
  await customerAccept(c, id, shot);

  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/código de início|start code/i)).toBeVisible();
  await shot(c, 'customer — start code visible');

  await providerStart(c, p, id, shot);
  await providerComplete(p, id, shot);

  await go(c, `${CUSTOMER}/request/${id}/receipt`);
  await expect(c.getByText(/total/i)).toBeVisible();
  await expect(c.getByText(/WV-/)).toBeVisible();
  await shot(c, 'customer — receipt');

  await cc.close();
  await pc.close();
});
