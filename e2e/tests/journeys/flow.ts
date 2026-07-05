import { Browser, Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { tap, slide } from '../helpers/auth';

export const CUSTOMER = process.env.CUSTOMER_URL || 'http://localhost:19083';
export const PROVIDER = process.env.PROVIDER_URL || 'http://localhost:19082';

export const go = (page: Page, url: string) =>
  page.goto(url, { waitUntil: 'domcontentloaded' }).then(() => page.waitForTimeout(2200));

export type Shot = (page: Page, step: string) => Promise<void>;

/** A per-flow screenshot recorder: numbers PNGs in order and logs a manifest row. */
export function shooter(journey: string): Shot {
  let n = 0;
  return async (page: Page, step: string) => {
    n++;
    const idx = String(n).padStart(2, '0');
    const slug = step.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 44) || 'step';
    const rel = path.posix.join('screens', journey, `${idx}-${slug}.png`);
    const abs = path.join(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    await page.screenshot({ path: abs, fullPage: true });
    fs.appendFileSync(
      path.join(process.cwd(), 'screens', 'manifest.jsonl'),
      JSON.stringify({ journey, order: n, file: `${idx}-${slug}.png`, path: rel, step }) + '\n',
    );
  };
}

export async function newCustomer(browser: Browser) {
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 900 }, storageState: '.auth/customer.json',
    geolocation: { latitude: -23.5614, longitude: -46.6559 }, permissions: ['geolocation'],
  });
  return { ctx, page: await ctx.newPage() };
}

export async function newProvider(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, storageState: '.auth/provider.json' });
  return { ctx, page: await ctx.newPage() };
}

/** A real 1×1 PNG written to disk, for file-chooser uploads. */
let pngPath: string | undefined;
export function fixturePng(): string {
  if (pngPath) return pngPath;
  const dir = path.join(process.cwd(), '.tmp');
  fs.mkdirSync(dir, { recursive: true });
  pngPath = path.join(dir, 'photo.png');
  fs.writeFileSync(pngPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'));
  return pngPath;
}

/** Upload into a "Photo (required)"-style picker (clicks the box, drives the file chooser). */
export async function uploadPhoto(page: Page, labelRe: RegExp) {
  const lb = await page.getByText(labelRe).first().boundingBox();
  if (!lb) throw new Error('photo label not found: ' + labelRe);
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.mouse.click(lb.x + 36, lb.y + 55),
  ]);
  await fc.setFiles(fixturePng());
  await page.waitForTimeout(800);
}

// ── lifecycle bootstrap — every step is a real UI action; `shot` captures each ──
export async function createRequest(c: Page, categoryId = 1, desc = 'Solicitação de teste E2E', shot?: Shot, urgency: 'urgent' | 'scheduled' = 'urgent') {
  await go(c, `${CUSTOMER}/request/new?categoryId=${categoryId}`);
  await shot?.(c, 'create — step 1 details');
  await c.getByText(/Civic do pai/i).first().click().catch(() => {});
  await c.getByPlaceholder(/flat tire|pneu furado/i).first().fill(desc);
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 2 location');
  await tap(c, /use my location|usar minha/i); await c.waitForTimeout(2500);
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 3 questions');
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 4 schedule');
  if (urgency === 'scheduled') {
    // Flip the segment to Scheduled, then pick today in the calendar — today is
    // never disabled, and selecting a day auto-checks the "morning" window,
    // which is all the step needs to allow Continue.
    await tap(c, /^(scheduled|agendado)$/i); await c.waitForTimeout(600);
    await c.getByText(new RegExp(`^${new Date().getDate()}$`)).last().click();
    await c.waitForTimeout(600);
    await shot?.(c, 'create — step 4 scheduled for today (morning)');
  }
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 5 photos');
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 6 budget & payment');
  await tap(c, /^continue$/i); await c.waitForTimeout(900);
  await shot?.(c, 'create — step 7 review');
  await slide(c); await c.waitForTimeout(3500);
  await shot?.(c, 'create — submitted (request detail)');
  const m = c.url().match(/\/request\/(\d+)/);
  if (!m) throw new Error('request not created; url=' + c.url());
  return Number(m[1]);
}

export async function providerBid(p: Page, id: number, shot?: Shot) {
  await go(p, `${PROVIDER}/job/${id}`);
  await shot?.(p, 'provider — open job (send proposal)');
  await tap(p, /send proposal|enviar proposta/i);
  await p.waitForTimeout(1500);
  await shot?.(p, 'provider — bid wizard');
  // 4-step wizard: review → questions → price → summary. Advance to the last
  // step, then slide to send.
  for (let i = 0; i < 3; i++) { await tap(p, /^(continue|continuar)$/i); await p.waitForTimeout(900); }
  await slide(p); await p.waitForTimeout(2500);
  await shot?.(p, 'provider — bid sent');
}

export async function customerAccept(c: Page, id: number, shot?: Shot) {
  await go(c, `${CUSTOMER}/request/${id}/proposals`);
  await shot?.(c, 'customer — proposals');
  await slide(c); await c.waitForTimeout(3000);
  await shot?.(c, 'customer — proposal accepted');
}

/**
 * Urgent jobs (the default for categoryId=1) require the customer's 4-digit
 * start code instead of a plain slide — read it off the customer's request
 * detail screen, then enter it in the provider's start-code modal. Scheduled
 * jobs skip the code and slide straight to start.
 */
export async function providerStart(c: Page, p: Page, id: number, shot?: Shot) {
  await go(p, `${PROVIDER}/job/${id}`);
  await shot?.(p, 'provider — accepted job (start code)');

  // Anchored: the scheduled footer's slide label is "Slide to start the job",
  // which CONTAINS "start the job" — only the urgent CTA is the exact text.
  const startCodeCta = p.getByText(/^(start the job|iniciar atendimento)$/i);
  if (await startCodeCta.count()) {
    await go(c, `${CUSTOMER}/request/${id}`);
    const code = (await c.locator('text=/^\\d{4}$/').first().textContent())?.trim();
    if (!code) throw new Error('start code not found on customer screen');

    await startCodeCta.last().click();
    await p.waitForTimeout(500);
    await p.keyboard.type(code);
    await tap(p, /confirm & start|confirmar e iniciar/i);
    await p.waitForTimeout(1500);
  } else {
    await slide(p);
    await p.waitForTimeout(2500);
  }
  await shot?.(p, 'provider — job started');
}

export async function providerComplete(p: Page, id: number, shot?: Shot) {
  await go(p, `${PROVIDER}/job/${id}`);
  await slide(p); await p.waitForTimeout(3000);
  await shot?.(p, 'provider — job completed');
}

export async function toAccepted(c: Page, p: Page, catId = 1, desc = 'E2E', shot?: Shot) {
  const id = await createRequest(c, catId, desc, shot);
  await providerBid(p, id, shot);
  await customerAccept(c, id, shot);
  return id;
}
export async function toInProgress(c: Page, p: Page, catId = 1, desc = 'E2E', shot?: Shot) {
  const id = await toAccepted(c, p, catId, desc, shot);
  await providerStart(c, p, id, shot);
  return id;
}
export async function toCompleted(c: Page, p: Page, catId = 1, desc = 'E2E', shot?: Shot) {
  const id = await toInProgress(c, p, catId, desc, shot);
  await providerComplete(p, id, shot);
  return id;
}

export { expect };
