import { test as setup } from '@playwright/test';
import { loginProvider } from './helpers/auth';

// Logs the provider in once and saves the session for all provider specs.
setup('authenticate provider', async ({ page }) => {
  await loginProvider(page);
  await page.context().storageState({ path: '.auth/provider.json' });
});
