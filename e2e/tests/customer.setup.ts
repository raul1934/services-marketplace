import { test as setup } from '@playwright/test';
import { loginCustomer } from './helpers/auth';

// Logs the customer in once and saves the session for all customer specs.
setup('authenticate customer', async ({ page }) => {
  await loginCustomer(page);
  await page.context().storageState({ path: '.auth/customer.json' });
});
