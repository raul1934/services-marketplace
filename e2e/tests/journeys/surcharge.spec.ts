import { test } from '@playwright/test';
import { CUSTOMER, PROVIDER, expect, go, newCustomer, newProvider, shooter, toInProgress, uploadPhoto } from './flow';
import { tap, slide } from '../helpers/auth';

// R-ACRÉSCIMO: provider proposes a surcharge mid-job (P15) → customer approves (C16).
test('surcharge: provider proposes (with photo) → customer approves', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('surcharge');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toInProgress(c, p, 1, 'Acréscimo E2E', shot);

  await go(p, `${PROVIDER}/job/${id}/surcharge`);
  const fields = p.getByRole('textbox');
  await fields.nth(0).fill('40');
  await fields.nth(1).fill('Peça adicional necessária no reparo');
  await uploadPhoto(p, /Photo \(required\)|Foto/i);
  await shot(p, 'provider — surcharge composed');
  await tap(p, /send for approval/i);
  await p.waitForTimeout(2500);

  await go(c, `${CUSTOMER}/request/${id}/surcharge`);
  await expect(c.getByText(/surcharge proposed|acréscimo proposto/i)).toBeVisible();
  await shot(c, 'customer — surcharge proposed');
  await slide(c);
  await c.waitForTimeout(2500);

  await go(c, `${CUSTOMER}/request/${id}/surcharge`);
  await expect(c.getByText(/no pending surcharge|nenhum acréscimo pendente/i)).toBeVisible();
  await shot(c, 'customer — surcharge approved (none pending)');

  await cc.close();
  await pc.close();
});
