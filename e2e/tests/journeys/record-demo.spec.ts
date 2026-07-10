import { Browser, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { CUSTOMER, expect, go, shooter, createRequest, providerBid, customerAnswerQuestion, customerAccept, providerStart, providerComplete } from './flow';
import { tap } from '../helpers/auth';
import { attachCaptions, attachRoleBanner, caption, cueTracker, CueTracker } from '../helpers/caption';

/**
 * Demo recordings: drive the full request lifecycle (urgent + scheduled) with
 * video capture on, a top banner naming the app on screen, and a caption
 * narrating each step, so the saved .webm files are ready to trim into a
 * feature video. Each journey writes:
 *
 *   recordings/<journey>/customer.webm   the customer app, captioned
 *   recordings/<journey>/provider.webm   the provider app, captioned
 *   recordings/<journey>/narrative.srt   the same cues with timestamps
 *
 * The single-video journey drives ONE page that alternates between the two
 * apps (their sessions are merged into one context), producing one demo.webm
 * that switches apps exactly when the flow does.
 *
 * Run with: npm run test:record  (stack up via docker-compose.web.yml first)
 */

const phone = { width: 420, height: 900 };
const recDir = (journey: string) => path.join(process.cwd(), 'recordings', journey);
const PROVIDER = process.env.PROVIDER_URL || 'http://localhost:19082';

// Top banner: which app is on screen, resolved by origin (works on the
// single alternating page too).
const ROLES = {
  [new URL(CUSTOMER).origin]: { label: 'App do Cliente', color: '#f97316' },
  [new URL(PROVIDER).origin]: { label: 'App do Prestador', color: '#6366f1' },
};

// The job is at Av. Paulista; the provider reports from Praça da Sé (~4 km
// away) so the tracking maps have a real road route to draw. The provider app
// only shares location while a job is active — without geolocation granted on
// the provider context, no position is ever sent and no route shows (the "map
// doesn't show the way" bug).
const JOB_GEO = { latitude: -23.5614, longitude: -46.6559 };
const PROVIDER_GEO = { latitude: -23.5505, longitude: -46.6333 };

/**
 * Two staged "phone photos" (gradient + emoji + label) rendered in a throwaway
 * page, for the wizard's photo step. Nicer on video than a 1×1 fixture pixel.
 */
async function makeDemoPhotos(browser: Browser): Promise<string[]> {
  const dir = path.join(process.cwd(), '.tmp');
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
  const mk = async (file: string, emoji: string, label: string, grad: string) => {
    await page.setContent(
      `<div style="width:640px;height:480px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:${grad};font-family:system-ui">
         <div style="font-size:120px">${emoji}</div>
         <div style="color:#fff;font-weight:700;font-size:26px;text-shadow:0 2px 8px rgba(0,0,0,.5)">${label}</div>
         <div style="color:rgba(255,255,255,.75);font-size:14px">foto enviada pelo cliente · demo</div>
       </div>`,
    );
    const out = path.join(dir, file);
    await page.screenshot({ path: out });
    return out;
  };
  const a = await mk('demo-photo-battery.png', '🔋', 'Bateria descarregada', 'linear-gradient(135deg,#1f2937,#111827)');
  const b = await mk('demo-photo-car.png', '🚗', 'Carro parado na avenida', 'linear-gradient(135deg,#374151,#0b1220)');
  await page.close();
  return [a, b];
}

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
    geolocation: JOB_GEO, permissions: ['geolocation'],
    recordVideo: { dir, size: phone },
  });
  const pc = await browser.newContext({
    viewport: phone, storageState: '.auth/provider.json',
    geolocation: PROVIDER_GEO, permissions: ['geolocation'],
    recordVideo: { dir, size: phone },
  });
  const c = await cc.newPage();
  const p = await pc.newPage();
  attachCaptions(c);
  attachCaptions(p);
  attachRoleBanner(c, ROLES);
  attachRoleBanner(p, ROLES);
  return { cc, pc, c, p };
}

/** Merge both apps' saved sessions so ONE context is logged into both origins. */
function mergedAuthState(): string {
  const read = (f: string) => JSON.parse(fs.readFileSync(path.join('.auth', f), 'utf8'));
  const a = read('customer.json');
  const b = read('provider.json');
  const merged = { cookies: [...(a.cookies ?? []), ...(b.cookies ?? [])], origins: [...(a.origins ?? []), ...(b.origins ?? [])] };
  const out = path.join('.auth', 'both.json');
  fs.writeFileSync(out, JSON.stringify(merged));
  return out;
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

  const photos = await makeDemoPhotos(browser);

  await say(c, 'App do cliente — tela inicial');
  await warm(c, CUSTOMER);
  await warm(p, PROVIDER);

  await say(c, 'Cliente cria uma solicitação URGENTE — problema, fotos, detalhes e orçamento');
  const id = await createRequest(c, 1, 'Bateria descarregada, preciso de partida agora', shot, 'urgent', photos);

  await say(p, 'Prestador abre o chamado, pergunta ao cliente e envia uma proposta');
  await providerBid(p, id, shot, 'O carro está em garagem coberta? Chego em ~12 min.');

  await say(c, 'Cliente responde a pergunta do prestador');
  await customerAnswerQuestion(c, id, 'Está na rua, em frente ao nº 1578. Pode vir!', shot);

  await say(c, 'Cliente recebe a proposta e desliza para aceitar');
  await customerAccept(c, id, shot);

  await say(p, 'Prestador a caminho — a rota até o cliente aparece no mapa');
  await go(p, `${PROVIDER}/job/${id}`);
  await expect(p.locator('path.leaflet-interactive').first()).toBeVisible({ timeout: 20_000 });
  await p.waitForTimeout(2000);
  await shot(p, 'provider — en route, road route on map');

  await say(c, 'Cliente acompanha o prestador chegando em tempo real — e vê o código de início');
  await go(c, `${CUSTOMER}/request/${id}`);
  await expect(c.getByText(/código de início|start code/i).first()).toBeVisible();
  await expect(c.locator('path.leaflet-interactive').first()).toBeVisible({ timeout: 20_000 });
  await shot(c, 'customer — live tracking with route + start code');

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

// One continuous video: a single page hops between the customer and provider
// apps as the flow demands — the top banner flips with each hop.
test('demo recording: single video alternating between the apps', async ({ browser }) => {
  test.setTimeout(240_000);
  const journey = 'full-demo';
  const shot = shooter(journey);
  const dir = recDir(journey);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const photos = await makeDemoPhotos(browser);
  const ctx = await browser.newContext({
    viewport: phone, storageState: mergedAuthState(),
    geolocation: JOB_GEO, permissions: ['geolocation'],
    recordVideo: { dir, size: phone },
  });
  const page = await ctx.newPage();
  attachCaptions(page);
  attachRoleBanner(page, ROLES);
  const t = cueTracker();
  const say = async (text: string) => { t.mark(text); await caption(page, text); };

  await say('Dois apps, um fluxo — cliente pede, prestador atende');
  await warm(page, CUSTOMER);
  await warm(page, PROVIDER);

  await say('Cliente cria uma solicitação URGENTE — problema, fotos, detalhes e orçamento');
  const id = await createRequest(page, 1, 'Pneu furado na avenida, preciso de troca', shot, 'urgent', photos);

  // From here on, the browser "is" the provider whenever the provider app is
  // on screen — report its position from across town so the maps get a route.
  await ctx.setGeolocation(PROVIDER_GEO);

  await say('Prestador abre o chamado, pergunta ao cliente e envia uma proposta');
  await providerBid(page, id, shot, 'O estepe está no porta-malas? Chego em ~12 min.');

  await say('Cliente responde a pergunta do prestador');
  await customerAnswerQuestion(page, id, 'Está sim, com o macaco junto. Pode vir!', shot);

  await say('Cliente recebe a proposta e desliza para aceitar');
  await customerAccept(page, id, shot);

  await say('Prestador a caminho — a rota até o cliente aparece no mapa');
  await go(page, `${PROVIDER}/job/${id}`);
  await expect(page.locator('path.leaflet-interactive').first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(2000);
  await shot(page, 'provider — en route, road route on map');

  // providerStart() flips between two pages to fetch the code — with a single
  // page, read the code from the customer screen first, then enter it.
  await say('Cliente acompanha o prestador no mapa — e vê o código de início');
  await go(page, `${CUSTOMER}/request/${id}`);
  const code = (await page.locator('text=/^\\d{4}$/').first().textContent())?.trim();
  if (!code) throw new Error('start code not found on customer screen');
  await expect(page.locator('path.leaflet-interactive').first()).toBeVisible({ timeout: 20_000 });
  await shot(page, 'customer — live tracking with route + start code');

  await say('Prestador chega, digita o código do cliente e inicia o serviço');
  await go(page, `${PROVIDER}/job/${id}`);
  await page.getByText(/^(start the job|iniciar atendimento)$/i).last().click();
  await page.waitForTimeout(500);
  await page.keyboard.type(code);
  await tap(page, /confirm & start|confirmar e iniciar/i);
  await page.waitForTimeout(1500);
  await shot(page, 'provider — job started');

  await say('Serviço executado — prestador desliza para concluir');
  await providerComplete(page, id, shot);

  await say('Cliente confere o recibo do serviço');
  await go(page, `${CUSTOMER}/request/${id}/receipt`);
  await expect(page.getByText(/total/i)).toBeVisible();
  await shot(page, 'customer — receipt');
  await page.waitForTimeout(2500); // hold the final frame

  const video = page.video();
  await ctx.close();
  await video?.saveAs(path.join(dir, 'demo.webm'));
  await video?.delete();
  fs.writeFileSync(path.join(dir, 'narrative.srt'), t.toSrt());
});

test('demo recording: scheduled request — create, accept & perform', async ({ browser }) => {
  test.setTimeout(240_000);
  const journey = 'scheduled-demo';
  const shot = shooter(journey);
  const ctxs = await recordingPages(browser, journey);
  const { c, p } = ctxs;
  const t = cueTracker();
  const say = async (page: Page, text: string) => { t.mark(text); await caption(page, text); };

  const photos = await makeDemoPhotos(browser);

  await say(c, 'App do cliente — tela inicial');
  await warm(c, CUSTOMER);
  await warm(p, PROVIDER);

  await say(c, 'Cliente cria uma solicitação AGENDADA — escolhe o dia e o período no calendário');
  const id = await createRequest(c, 1, 'Revisão da bateria, pode ser amanhã de manhã', shot, 'scheduled', photos);

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
