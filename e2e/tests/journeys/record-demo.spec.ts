import { Browser, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { CUSTOMER, expect, go, shooter, createRequest, providerBid, customerAccept, providerStart, providerComplete } from './flow';
import { attachCaptions, caption, cueTracker, CueTracker } from '../helpers/caption';

/**
 * Demo recordings: drive the full request lifecycle (urgent + scheduled) with
 * video capture on and an on-page caption narrating each step, so the saved
 * .webm files are ready to trim into a feature video. Each journey writes:
 *
 *   recordings/<journey>/customer.webm   the customer app, captioned
 *   recordings/<journey>/provider.webm   the provider app, captioned
 *   recordings/<journey>/narrative.srt   the same cues with timestamps
 *
 * Run with: npm run test:record  (stack up via docker-compose.web.yml first)
 */

const phone = { width: 420, height: 900 };
const recDir = (journey: string) => path.join(process.cwd(), 'recordings', journey);
const PROVIDER = process.env.PROVIDER_URL || 'http://localhost:19082';

/**
 * Boot the app at its root and let the stored session hydrate before any deep
 * link. A fresh context downloads the whole Expo bundle, so the first deep
 * link can bounce to /welcome before auth hydrates (same race open() handles);
 * it also makes the video open on the home screen instead of mid-wizard.
 */
async function warm(page: Page, base: string) {
  await go(page, base);
  if (/welcome|login/.test(page.url())) await go(page, base);
  if (/welcome|login/.test(page.url())) throw new Error('session did not hydrate for ' + base);
}

async function recordingPages(browser: Browser, journey: string) {
  const dir = recDir(journey);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // Manual contexts don't inherit the project-level video setting — ask here.
  const cc = await browser.newContext({
    viewport: phone, storageState: '.auth/customer.json',
    geolocation: { latitude: -23.5614, longitude: -46.6559 }, permissions: ['geolocation'],
    recordVideo: { dir, size: phone },
  });
  const pc = await browser.newContext({
    viewport: phone, storageState: '.auth/provider.json',
    recordVideo: { dir, size: phone },
  });
  const c = await cc.newPage();
  const p = await pc.newPage();
  attachCaptions(c);
  attachCaptions(p);
  return { cc, pc, c, p };
}

/** Close both contexts (flushes the videos), then name the artifacts. */
async function finalize(journey: string, ctxs: Awaited<ReturnType<typeof recordingPages>>, tracker: CueTracker) {
  const { cc, pc, c, p } = ctxs;
  const cv = c.video();
  const pv = p.video();
  await cc.close();
  await pc.close();
  const dir = recDir(journey);
  await cv?.saveAs(path.join(dir, 'customer.webm'));
  await pv?.saveAs(path.join(dir, 'provider.webm'));
  await cv?.delete();
  await pv?.delete();
  fs.writeFileSync(path.join(dir, 'narrative.srt'), tracker.toSrt());
}

test('demo recording: urgent request — create, accept & perform', async ({ browser }) => {
  test.setTimeout(240_000);
  const journey = 'urgent-demo';
  const shot = shooter(journey);
  const ctxs = await recordingPages(browser, journey);
  const { c, p } = ctxs;
  const t = cueTracker();
  const say = async (page: Page, text: string) => { t.mark(text); await caption(page, text); };

  await say(c, 'App do cliente — tela inicial');
  await warm(c, CUSTOMER);
  await warm(p, PROVIDER);

  await say(c, 'Cliente cria uma solicitação URGENTE — descreve o problema, localização e orçamento');
  const id = await createRequest(c, 1, 'Bateria descarregada, preciso de partida agora', shot);

  await say(p, 'Prestador abre o chamado próximo e envia uma proposta');
  await providerBid(p, id, shot);

  await say(c, 'Cliente recebe a proposta e desliza para aceitar');
  await customerAccept(c, id, shot);

  await say(c, 'Solicitação aceita — o código de início aparece para o cliente');
  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/código de início|start code/i).first()).toBeVisible();
  await shot(c, 'customer — start code visible');

  await say(p, 'Prestador chega, digita o código do cliente e inicia o serviço');
  await providerStart(c, p, id, shot);

  await say(p, 'Serviço executado — prestador desliza para concluir');
  await providerComplete(p, id, shot);

  await say(c, 'Cliente confere o recibo do serviço');
  await go(c, `${CUSTOMER}/request/${id}/receipt`);
  await expect(c.getByText(/total/i)).toBeVisible();
  await shot(c, 'customer — receipt');
  await c.waitForTimeout(2500); // hold the final frame

  await finalize(journey, ctxs, t);
});

test('demo recording: scheduled request — create, accept & perform', async ({ browser }) => {
  test.setTimeout(240_000);
  const journey = 'scheduled-demo';
  const shot = shooter(journey);
  const ctxs = await recordingPages(browser, journey);
  const { c, p } = ctxs;
  const t = cueTracker();
  const say = async (page: Page, text: string) => { t.mark(text); await caption(page, text); };

  await say(c, 'App do cliente — tela inicial');
  await warm(c, CUSTOMER);
  await warm(p, PROVIDER);

  await say(c, 'Cliente cria uma solicitação AGENDADA — escolhe o dia e o período no calendário');
  const id = await createRequest(c, 1, 'Revisão da bateria, pode ser amanhã de manhã', shot, 'scheduled');

  await say(p, 'Prestador abre o chamado agendado e envia uma proposta');
  await providerBid(p, id, shot);

  await say(c, 'Cliente recebe a proposta e desliza para aceitar');
  await customerAccept(c, id, shot);

  await say(p, 'No horário combinado, o prestador desliza para iniciar — agendado não pede código');
  await providerStart(c, p, id, shot);

  await say(p, 'Serviço executado — prestador desliza para concluir');
  await providerComplete(p, id, shot);

  await say(c, 'Cliente confere o recibo do serviço');
  await go(c, `${CUSTOMER}/request/${id}/receipt`);
  await expect(c.getByText(/total/i)).toBeVisible();
  await shot(c, 'customer — receipt');
  await c.waitForTimeout(2500); // hold the final frame

  await finalize(journey, ctxs, t);
});
