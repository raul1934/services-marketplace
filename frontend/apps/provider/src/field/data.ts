/**
 * Single source of truth for the field module (mock — a real backend replaces
 * this). Everything is keyed by id so navigation carries the right entity:
 * a route lists its own stops, each stop opens its site's detail and OS with
 * that site's services.
 */

export type Charge = 'visit' | 'hour';
export type Nest = { icon: string; label: string; sub: string; value: string; tone?: 'charge' | 'free' };
export type Service = { id: string; name: string; who: string; whoName: string; rate: Charge; done: boolean; obrig: boolean; nest: Nest[] };
export type HistoryItem = { id: string; day: 'today' | 'yesterday'; time: string; services: number; status: 'done' | 'doing' };
export type Site = { id: string; name: string; contract: string; address: string; services: Service[]; history: HistoryItem[] };

/** Company-wide catalog offered as add-on services on any visit. */
export const CATALOG: { id: string; name: string; rate: Charge; obrig: boolean }[] = [
  { id: 'para-raios', name: 'Para-raios — inspeção', rate: 'visit', obrig: true },
  { id: 'hidrante', name: 'Hidrante — teste de pressão', rate: 'visit', obrig: false },
  { id: 'cftv', name: 'CFTV — verificação', rate: 'hour', obrig: false },
  { id: 'bomba-incendio', name: 'Bomba de incêndio — teste', rate: 'visit', obrig: true },
];

const you = { who: 'AN', whoName: 'Você' };
const bruno = { who: 'BR', whoName: 'Bruno' };
const carla = { who: 'CA', whoName: 'Carla' };

export const SITES: Record<string, Site> = {
  'rio-fortore': {
    id: 'rio-fortore', name: 'Cond. Rio Fortore', contract: 'Nadruz', address: 'Av. Anísio Haddad, 2000',
    services: [
      { id: 'bomba', name: "Bomba d'água — preventiva", ...you, rate: 'visit', done: true, obrig: true, nest: [
        { icon: '🔧', label: 'Multímetro', sub: 'equipamento', value: '1h' },
        { icon: '📦', label: 'Pressostato', sub: 'material', value: 'cobra à parte', tone: 'charge' },
        { icon: '✓', label: 'Checklist da bomba', sub: '', value: '2/2' },
      ] },
      { id: 'quadro', name: 'Quadro elétrico — revisão', ...bruno, rate: 'hour', done: true, obrig: true, nest: [
        { icon: '🔧', label: 'Alicate-amperímetro', sub: 'equipamento', value: '1,5h' },
      ] },
      { id: 'portao', name: 'Portão automático — lubrificação', ...carla, rate: 'visit', done: false, obrig: false, nest: [
        { icon: '📦', label: 'Graxa', sub: 'material', value: 'sem custo', tone: 'free' },
      ] },
    ],
    history: [
      { id: 'h1', day: 'today', time: '8:33', services: 4, status: 'done' },
      { id: 'h2', day: 'yesterday', time: '9:12', services: 3, status: 'done' },
    ],
  },
  solar: {
    id: 'solar', name: 'Ed. Solar das Palmeiras', contract: 'Pacco', address: 'Av. Bady Bassitt, 3200',
    services: [
      { id: 'gerador', name: 'Gerador — teste de carga', ...you, rate: 'hour', done: true, obrig: true, nest: [
        { icon: '🔧', label: 'Alicate-amperímetro', sub: 'equipamento', value: '1h' },
        { icon: '📦', label: 'Diesel', sub: 'material', value: 'cobra à parte', tone: 'charge' },
      ] },
      { id: 'ar', name: 'Ar-condicionado — limpeza', ...bruno, rate: 'visit', done: false, obrig: false, nest: [
        { icon: '📦', label: 'Gás R-410', sub: 'material', value: 'cobra à parte', tone: 'charge' },
      ] },
    ],
    history: [{ id: 'h1', day: 'today', time: '9:58', services: 2, status: 'doing' }],
  },
  villa: {
    id: 'villa', name: 'Cond. Villa Toscana', contract: 'Pacco', address: 'R. Cel. Spínola de Castro, 3100',
    services: [
      { id: 'elevador', name: 'Elevador — inspeção mensal', ...you, rate: 'visit', done: true, obrig: true, nest: [
        { icon: '✓', label: 'Checklist do elevador', sub: '', value: '5/5' },
      ] },
      { id: 'portao', name: 'Portão social — lubrificação', ...carla, rate: 'visit', done: true, obrig: false, nest: [
        { icon: '📦', label: 'Graxa', sub: 'material', value: 'sem custo', tone: 'free' },
      ] },
    ],
    history: [{ id: 'h1', day: 'yesterday', time: '16:10', services: 3, status: 'done' }],
  },
  anavec: {
    id: 'anavec', name: 'Ed. Anavec', contract: 'Nadruz', address: 'R. Silva Jardim, 890',
    services: [
      { id: 'quadro-geral', name: 'Quadro geral — termografia', ...bruno, rate: 'hour', done: false, obrig: true, nest: [
        { icon: '🔧', label: 'Câmera termográfica', sub: 'equipamento', value: '1h' },
      ] },
      { id: 'iluminacao', name: 'Iluminação — manutenção', ...you, rate: 'visit', done: true, obrig: false, nest: [
        { icon: '📦', label: 'Lâmpadas LED', sub: 'material', value: 'cobra à parte', tone: 'charge' },
      ] },
    ],
    history: [{ id: 'h1', day: 'yesterday', time: '11:05', services: 3, status: 'done' }],
  },
  represa: {
    id: 'represa', name: 'Cond. Represa', contract: 'Pacco', address: 'R. da Represa, 450',
    services: [
      { id: 'bomba-piscina', name: 'Bomba da piscina — preventiva', ...you, rate: 'visit', done: false, obrig: true, nest: [
        { icon: '📦', label: 'Selo mecânico', sub: 'material', value: 'sem custo', tone: 'free' },
      ] },
      { id: 'jardim', name: 'Irrigação do jardim — revisão', ...carla, rate: 'visit', done: false, obrig: false, nest: [] },
    ],
    history: [],
  },
  damha: {
    id: 'damha', name: 'Res. Damha', contract: 'Nadruz', address: 'Av. Damha, 1200',
    services: [
      { id: 'guarita', name: 'Guarita — CFTV e cerca elétrica', ...bruno, rate: 'hour', done: false, obrig: true, nest: [
        { icon: '🔧', label: 'Multímetro', sub: 'equipamento', value: '1h' },
      ] },
    ],
    history: [{ id: 'h1', day: 'yesterday', time: '14:20', services: 2, status: 'done' }],
  },
};

export type StopStatus = 'now' | 'next' | 'done';
export type RouteStop = { siteId: string; km: string; status: StopStatus; here?: string };
export type Route = { id: string; name: string; km: number; stops: RouteStop[] };

export const ROUTES: Record<string, Route> = {
  'centro-norte': {
    id: 'centro-norte', name: 'Centro–Norte', km: 18, stops: [
      { siteId: 'villa', km: '0,0', status: 'done' },
      { siteId: 'rio-fortore', km: '1,2', status: 'now', here: '11 min' },
      { siteId: 'solar', km: '3,8', status: 'next' },
      { siteId: 'anavec', km: '5,1', status: 'next' },
    ],
  },
  sul: {
    id: 'sul', name: 'Sul', km: 12, stops: [
      { siteId: 'represa', km: '0,0', status: 'next' },
      { siteId: 'damha', km: '2,4', status: 'next' },
      { siteId: 'anavec', km: '4,8', status: 'next' },
    ],
  },
};

export type Performance = { id: string; siteId: string; day: 'today' | 'yesterday'; time: string; crew: number; status: 'done' | 'doing' };
export const PERFORMANCES: Performance[] = [
  { id: 'p1', siteId: 'rio-fortore', day: 'today', time: '8:33', crew: 3, status: 'done' },
  { id: 'p2', siteId: 'solar', day: 'today', time: '9:58', crew: 2, status: 'doing' },
  { id: 'p3', siteId: 'villa', day: 'yesterday', time: '16:10', crew: 2, status: 'done' },
  { id: 'p4', siteId: 'anavec', day: 'yesterday', time: '11:05', crew: 3, status: 'done' },
];

export const orderedSites = (): Site[] => Object.values(SITES);
export const orderedRoutes = (): Route[] => Object.values(ROUTES);
export const mandatoryServices = (s: Site): Service[] => s.services.filter((x) => x.obrig);
/** Total mandatory services across a route's stops. */
export const routeRequired = (r: Route): number => r.stops.reduce((n, st) => n + mandatoryServices(SITES[st.siteId]).length, 0);
