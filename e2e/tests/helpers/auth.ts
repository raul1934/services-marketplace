import { Page, expect } from '@playwright/test';

/**
 * Complete a SlideToConfirm. The control now grants the react-native-web
 * responder on press (onStartShouldSetPanResponder), so a real mouse drag of the
 * thumb left→right past the 85% threshold confirms it — and the thumb visibly
 * travels when running --headed. `nth` picks which slider when a screen has more
 * than one. (Previously this needed CDP touch events because the responder only
 * engaged on move.)
 */
export async function slide(page: Page, nth = 0) {
  const track = page.getByTestId('slideToConfirm').nth(nth);
  await expect(track).toBeVisible();
  const box = await track.boundingBox();
  if (!box) throw new Error('slideToConfirm not found');
  await page.waitForTimeout(250); // let layout settle so the box is stable
  const y = box.y + box.height / 2;
  const startX = box.x + 26;
  // Stay just INSIDE the right edge: leaving the element's bounds makes
  // react-native-web terminate the PanResponder and spring the thumb back.
  const endX = box.x + box.width - 12;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(startX + ((endX - startX) * i) / 20, y);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);
}

const PASSWORD = process.env.WALVEE_PASSWORD || 'senha123';

/** Robust click for react-native-web Pressables (role=button OR a text node). */
export async function tap(page: Page, name: RegExp) {
  const byRole = page.getByRole('button', { name });
  if (await byRole.count()) { await byRole.last().click(); return; }
  const byText = page.getByText(name);
  const n = await byText.count();
  if (n) { await byText.nth(n - 1).click(); return; } // last match = the button, not a heading
  throw new Error(`No clickable element matching ${name}`);
}

/**
 * Log into a walvee app. Dev creds are pre-filled on /login, but we fill
 * explicitly for determinism. Submit button is "Continue" (customer) / "Sign in"
 * (provider).
 */
export async function login(page: Page, email: string, submit: RegExp) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const inputs = page.locator('input');
  await inputs.first().fill(email);
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    if ((await inputs.nth(i).getAttribute('type')) === 'password') {
      await inputs.nth(i).fill(PASSWORD);
      break;
    }
  }
  await page.waitForTimeout(300);
  await tap(page, submit);
  await page.waitForTimeout(3500);
}

export const loginCustomer = (page: Page) => login(page, process.env.CUSTOMER_EMAIL || 'cliente@walvee.test', /^continue$/i);
export const loginProvider = (page: Page) => login(page, process.env.PROVIDER_EMAIL || 'prestador@walvee.test', /^sign in$/i);

/**
 * Navigate to an authenticated route. With a stored session the deep link works
 * directly, but if the app bounces to welcome/login before auth hydrates, warm
 * the root once and retry.
 */
export async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  if (/\/welcome|\/login/.test(page.url()) && !/welcome|login/.test(path)) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
  }
}
