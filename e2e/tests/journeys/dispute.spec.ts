import { test } from '@playwright/test';
import { CUSTOMER, PROVIDER, expect, go, newCustomer, newProvider, shooter, toCompleted } from './flow';
import { tap } from '../helpers/auth';

// R5: customer opens a dispute on a completed job (C37) → provider files a defense (P19).
test('dispute: customer opens → provider defends', async ({ browser }) => {
  test.setTimeout(180_000);
  const shot = shooter('dispute');
  const { ctx: cc, page: c } = await newCustomer(browser);
  const { ctx: pc, page: p } = await newProvider(browser);

  const id = await toCompleted(c, p, 1, 'Disputa E2E', shot);

  await go(c, `${CUSTOMER}/request/${id}/dispute`);
  await c.getByRole('textbox').first().fill('O serviço não foi concluído corretamente, preciso de revisão.');
  await shot(c, 'customer — opening dispute');
  await tap(c, /open dispute|abrir disputa/i);
  await c.waitForTimeout(2500);

  await go(p, `${PROVIDER}/job/${id}/dispute`);
  await expect(p.getByText(/my version|minha versão/i)).toBeVisible();
  await p.getByRole('textbox').first().fill('Executei o serviço conforme combinado; segue minha versão.');
  await shot(p, 'provider — filing defense');
  await tap(p, /send defense|enviar defesa/i);
  await p.waitForTimeout(2500);

  await go(c, `${CUSTOMER}/request/${id}/dispute`);
  await expect(c.getByText(/mediation|under review|análise|em mediação|retido|retain/i).first()).toBeVisible();
  await shot(c, 'customer — dispute under review');

  await cc.close();
  await pc.close();
});
