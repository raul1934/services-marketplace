/* walvee-screens-customer.jsx — customer app screens + Foundations.
   Components read theme tokens from the wrapping .t-* class. */

/* ---- shared bits ---- */
function MiniMap({ height = 200, route = true, puck = true }) {
  return (
    <div className="map" style={{ height, borderRadius: 16 }}>
      <svg className="streets" viewBox="0 0 390 240" preserveAspectRatio="xMidYMid slice">
        <g stroke="currentColor" strokeWidth="10" opacity="0.06" fill="none" strokeLinecap="round">
          <path d="M-20 60H410M-20 150H410M-20 215H410" />
          <path d="M70 -20V260M180 -20V260M300 -20V260" />
        </g>
        <g stroke="currentColor" strokeWidth="4" opacity="0.05" fill="none">
          <path d="M-20 105H410M120 -20V260M250 -20V260" />
        </g>
        {route && <path d="M95 188 C 140 188, 150 120, 200 110 S 270 70, 300 64" fill="none"
          stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 11" opacity="0.85" />}
      </svg>
      <div className="pin me" style={{ left: "24%", top: "82%" }}><div className="dot" /></div>
      {puck && <div className="puck" style={{ left: "77%", top: "27%" }} />}
    </div>
  );
}

function CatTile({ icon, label, grad }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div className={"cat-ic" + (grad ? " grad" : "")} style={{ width: 60, height: 60, borderRadius: 18 }}>
        <Icon name={icon} size={28} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>{label}</span>
    </div>
  );
}

/* ============================================================ HOME */
function HomeScreen() {
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <AppMenu role="customer" />
        <div>
          <div className="ab-sub">Boa tarde</div>
          <h1 className="ab-title">Mateus</h1>
        </div>
        <span className="spacer" />
        <div className="iconbtn"><Icon name="bell" size={20} /></div>
        <div className="avatar">MA</div>
      </div>

      <div className="scroll">
        <div className="content">
          <div className="section-label">Solicitação ativa</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 18 }}>
              <div className="row">
                <div className="cat-ic"><Icon name="car" size={26} /></div>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Pneu furado</div>
                  <div className="muted" style={{ fontSize: 13 }}>Av. Paulista, 1500 · 2 min atrás</div>
                </div>
                <span className="badge b-urgent dot">Urgente</span>
              </div>
              <div className="row" style={{ marginTop: 14, gap: 10 }}>
                <div className="steps">
                  <div className="node done"><Icon name="check" size={13} /></div>
                  <div className="bar done" />
                  <div className="node now">2</div>
                  <div className="bar" />
                  <div className="node">3</div>
                </div>
                <span className="grow" />
                <span className="badge b-open dot">5 bids</span>
              </div>
            </div>
            <div style={{ background: "var(--surface-2)", padding: "13px 18px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, color: "var(--accent)" }}>
              <Icon name="arrowR" size={17} /> Ver propostas
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 4 }}>Ajuda rápida</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <CatTile icon="car" label="Pneu furado" />
            <CatTile icon="truck" label="Guincho" />
            <CatTile icon="key" label="Chaveiro" />
            <CatTile icon="drop" label="Encanamento" />
          </div>

          <div className="card" style={{ background: "var(--grad)", color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Precisa de ajuda agora?</div>
              <div style={{ fontSize: 13, opacity: .9, marginTop: 2 }}>Profissionais a minutos de você.</div>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="plus" size={26} />
            </div>
          </div>
        </div>
      </div>

      <TabBar role="customer" active="home" />
    </>
  );
}

/* ============================================================ CATEGORIES */
function CategoriesScreen() {
  const groups = [
    ["Veicular", [["car", "Pneu furado"], ["battery", "Bateria"], ["drop", "Sem combustível"], ["key", "Sem chave"], ["truck", "Guincho"], ["wrench", "Não liga"]]],
    ["Casa & imóvel", [["drop", "Encanamento"], ["flash", "Elétrica"], ["key", "Chaveiro"], ["sparkles", "Limpeza"], ["wifi", "Internet"], ["wrench", "Eletrodoméstico"]]],
    ["Pets", [["paw", "Passeio"], ["heart", "Veterinário"], ["sparkles", "Banho & tosa"]]],
  ];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">O que você precisa?</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 22 }}>
          {groups.map(([label, cats]) => (
            <div key={label}>
              <div className="section-label" style={{ marginBottom: 14 }}>{label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {cats.map(([ic, name], i) => (
                  <div key={i} className="card flat" style={{ padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                    <div className="cat-ic" style={{ width: 48, height: 48 }}><Icon name={ic} size={24} /></div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================================ CREATE REQUEST */
function CreateRequestScreen() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Pneu furado</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="cat-ic grad"><Icon name="car" size={26} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Veicular · Pneu furado</div>
              <div className="muted" style={{ fontSize: 13 }}>Conte o que aconteceu</div>
            </div>
          </div>

          <div className="field" style={{ minHeight: 84 }}>
            <div className="fl">O que aconteceu?</div>
            <div className="fv" style={{ marginTop: 5 }}>Pneu dianteiro esquerdo estourou na avenida. Carro parado no acostamento.</div>
          </div>
          <div className="field"><div className="fl">Address</div><div className="fv">Av. Paulista, 1500</div></div>
          <BudgetMeter work="A flat tire" value={190} min={60} max={300} bandLo={90} bandHi={160} regionAvg={120} />

          <div className="section-label" style={{ marginTop: 6 }}>When</div>
          <div className="segment">
            <div className="seg active"><Icon name="flash" size={16} /> Urgente</div>
            <div className="seg"><Icon name="calendar" size={16} /> Agendar</div>
          </div>

          <div className="section-label" style={{ marginTop: 6 }}>Fotos</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="ph-img" style={{ width: 84, height: 84 }}>photo</div>
            <div className="ph-img" style={{ width: 84, height: 84 }}>photo</div>
            <div className="card flat" style={{ width: 84, height: 84, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--ink-3)", padding: 0 }}>
              <Icon name="camera" size={22} /><span style={{ fontSize: 11, fontWeight: 700 }}>Add</span>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 4 }}>
            <MiniMap height={150} route={false} puck={false} />
            <div className="row" style={{ padding: "12px 14px" }}>
              <Icon name="location" size={18} style={{ color: "var(--accent)" }} />
              <div className="grow" style={{ fontSize: 13, fontWeight: 600 }}>Localização obtida · arraste o pino</div>
              <Icon name="check" size={18} style={{ color: "var(--ok)" }} />
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <SlideConfirm variant="accept" label="Arraste para pedir ajuda" fill={20} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================ REQUEST DETAIL (bids) */
function Proposal({ initials, color, name, rating, count, eta, comment, price, best }) {
  return (
    <div className="card" style={{ padding: 16, position: "relative", border: best ? "1.5px solid var(--accent)" : undefined }}>
      {best && <span className="badge b-open" style={{ position: "absolute", top: -10, right: 16, fontSize: 11 }}>Melhor opção</span>}
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="av-init" style={{ background: color }}>{initials}</div>
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 15.5 }}>{name}</div>
          <div className="row" style={{ gap: 6, marginTop: 2 }}>
            <Stars val={rating} size={13} />
            <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{rating} · {count} trabalhos</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="price"><span className="cur">R$</span>{price}</div>
          <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}><Icon name="clock" size={12} style={{ verticalAlign: -2 }} /> {eta} min</div>
        </div>
      </div>
      {comment && <div className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.4 }}>"{comment}"</div>}
      {best
        ? <div style={{ marginTop: 12 }}><SlideConfirm variant="accept" compact label="Arraste para aceitar" fill={24} /></div>
        : <button className="btn grad sm" style={{ width: "100%", marginTop: 12 }}>Aceitar proposta</button>}
    </div>
  );
}

const PROPOSALS = [
  { initials: "RC", color: "#3b82f6", name: "Rafael C.", rating: 4.9, count: 213, eta: 8, price: 120, comment: "A caminho com estepe e ferramentas. 5 anos de experiência.", best: true },
  { initials: "JS", color: "#10b981", name: "Auto Já · João", rating: 4.7, count: 88, eta: 12, price: 95 },
  { initials: "MP", color: "#f59e0b", name: "Marcos P.", rating: 4.8, count: 156, eta: 15, price: 140 },
];
const PR_SORT = [["rating", "Melhor avaliação"], ["price", "Menor preço"], ["eta", "Mais rápido"]];
const PR_PRICE = [["all", "Qualquer"], ["100", "Até R$ 100"], ["130", "Até R$ 130"], ["160", "Até R$ 160"]];
const PR_RATING = [["0", "Qualquer"], ["4.5", "4.5+"], ["4.8", "4.8+"]];
const PR_DEFAULTS = { sort: "rating", maxprice: "all", minrating: "0" };
const PR_SECTIONS = [
  { label: "Ordenar por", key: "sort", opts: PR_SORT, sortOnly: true },
  { label: "Preço máximo", key: "maxprice", opts: PR_PRICE },
  { label: "Avaliação mínima", key: "minrating", opts: PR_RATING },
];

function RequestDetailScreen() {
  const ctl = useFilter(PR_DEFAULTS);
  const { f, reset, active } = ctl;
  const list = PROPOSALS
    .filter((p) => (f.maxprice === "all" || p.price <= +f.maxprice) && p.rating >= +f.minrating)
    .slice()
    .sort((a, b) => f.sort === "price" ? a.price - b.price : f.sort === "eta" ? a.eta - b.eta : b.rating - a.rating);

  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Pneu furado</span>
        <span className="grow" />
        <FilterButton ctl={ctl} />
        <span className="badge b-open dot">Aberto</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="car" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Veicular · Pneu furado</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Av. Paulista, 1500</div>
              </div>
              <span className="badge b-urgent dot">Urgente</span>
            </div>
          </div>

          <div className="row">
            <div className="section-label">Propostas <span className="count">{list.length}</span></div>
            <span className="grow" />
            {active && (
              <span onClick={reset} style={{ color: "var(--accent)", fontWeight: 800, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Limpar <Icon name="close" size={13} />
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <div style={{ padding: "34px 26px", textAlign: "center", border: "1.5px dashed var(--line)", borderRadius: 18 }}>
              <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Nenhuma proposta com esses filtros.</div>
              <span onClick={reset} style={{ display: "inline-block", marginTop: 8, color: "var(--accent)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Limpar filtros</span>
            </div>
          ) : list.map((p) => (
            <Proposal key={p.name} initials={p.initials} color={p.color} name={p.name} rating={p.rating} count={p.count} eta={p.eta} price={p.price} comment={p.comment} best={p.best} />
          ))}

          <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, padding: "2px 0 8px" }}>Cancelar solicitação</div>
        </div>
      </div>
      <FilterSheet ctl={ctl} count={list.length} sections={PR_SECTIONS} toggle={null} noun={["proposta", "propostas"]} />
    </>
  );
}

/* ============================================================ TRACKING */
function TrackingScreen() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">A caminho</span>
        <span className="grow" />
        <span className="badge b-live dot">Ao vivo</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <MiniMap height={250} />
            <div style={{ padding: 16 }}>
              <div className="row">
                <Icon name="navigate" size={22} style={{ color: "var(--accent)" }} />
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 17 }}>1.2 km de distância</div>
                  <div className="muted" style={{ fontSize: 13 }}>Chega em ~6 min</div>
                </div>
                <span className="badge b-live dot">Em movimento</span>
              </div>
            </div>
          </div>

          <div className="steps" style={{ justifyContent: "space-between", padding: "0 6px" }}>
            {[["Aceito", "done"], ["A caminho", "now"], ["Chegou", ""], ["Done", ""]].map(([l, s], i) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className={"node " + s}>{s === "done" ? <Icon name="check" size={13} /> : i + 1}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: s ? "var(--ink)" : "var(--ink-3)" }}>{l}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 2, background: i === 0 ? "var(--accent)" : "var(--line)", margin: "0 -2px", marginBottom: 18 }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="av-init" style={{ background: "#3b82f6" }}>RC</div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Rafael C.</div>
                <div className="row" style={{ gap: 6, marginTop: 2 }}><Stars val={4.9} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>4.9 · Toyota tow</span></div>
              </div>
              <div style={{ textAlign: "right" }}><div className="price"><span className="cur">R$</span>120</div></div>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <button className="btn ghost" style={{ flex: 1 }}><Icon name="phone" size={18} /> Ligar</button>
              <button className="btn grad" style={{ flex: 1 }}><Icon name="chat" size={18} /> Mensagem</button>
            </div>
          </div>
        </div>
      </div>

      <TabBar role="customer" active="navigate" tabs={[["navigate", "Live"], ["chat", "Chat", true]]} />
    </>
  );
}

/* ============================================================ ASSETS — Histórico de ativos (o fosso) */
const ASSETS = [
  { id: "civic", ic: "car",     grad: true,  name: "Honda Civic 2019", sub: "FNZ-1A23 · 58.400 km", records: 10, last: "Troca de pneu + peças · hoje", due: "Revisão dos 60 mil km", dueIn: "vence em ~1.600 km" },
  { id: "apto",  ic: "home",    grad: false, name: "Apartamento Jardins", sub: "Rua Oscar Freire, 1200", records: 6, last: "Reparo hidráulico · há 3 sem", due: null },
  { id: "ac",    ic: "snow",    grad: false, name: "Ar-condicionado Sala", sub: "Split 12.000 BTUs", records: 4, last: "Limpeza · há 5 meses", due: "Limpeza semestral", dueIn: "vence em 3 semanas" },
];

function AssetCard({ a }) {
  return (
    <div className="card asset-card" data-go={"asset-" + a.id}>
      <div className={"asset-ic" + (a.grad ? " grad" : "")}><Icon name={a.ic} size={26} /></div>
      <div className="asset-meta">
        <div className="asset-name">{a.name}</div>
        <div className="asset-sub">{a.sub}</div>
        <div className="asset-foot">
          <Icon name="history" size={15} style={{ color: "var(--ink-3)" }} />
          <span>{a.records} registros · {a.last}</span>
        </div>
      </div>
      <Icon name="fwd" size={18} style={{ color: "var(--ink-3)", flex: "none" }} />
    </div>
  );
}

function AssetsScreen() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Meus ativos</span>
        <span className="grow" />
        <div className="backbtn"><Icon name="search" size={18} /></div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 13 }}>
          <div className="card flat" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="shieldCheck" size={20} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Cada serviço que você contrata fica registrado no ativo — histórico completo, sempre com você.</div>
          </div>

          <div className="section-label">Seus bens</div>
          {ASSETS.map((a) => <AssetCard key={a.id} a={a} />)}

          <div className="add-asset" data-go="asset-civic"><Icon name="plus" size={19} /> Adicionar ativo</div>
        </div>
      </div>
      <TabBar role="customer" active="list" />
    </>
  );
}

/* ---- asset detail: maintenance timeline ---- */
const ASSET_TIMELINE = {
  civic: {
    a: ASSETS[0],
    stats: [["10", "Serviços"], ["R$ 4.435", "Investido"], ["3", "Garantias"]],
    events: [
      { date: "19 jun 2026", title: "Troca de pneu + 2 peças", prov: "Rafael C.", rating: 4.9, cost: "R$ 255", km: "58.400 km", warranty: "Pastilha e válvula · garantia 90 dias", ok: true },
      { date: "12 abr 2026", title: "Troca de óleo e filtro", prov: "Auto Já · João", rating: 4.7, cost: "R$ 180", km: "58.400 km", warranty: "Garantia até out 2026", ok: true },
      { date: "03 fev 2026", title: "Alinhamento e balanceamento", prov: "Pneus Centro", rating: 4.8, cost: "R$ 140", km: "55.900 km", ok: true },
      { date: "20 nov 2025", title: "Troca de pastilhas de freio", prov: "Rafael C.", rating: 4.9, cost: "R$ 320", km: "52.100 km", warranty: "Garantia até nov 2026", ok: true },
      { date: "08 set 2025", title: "Revisão dos 50 mil km", prov: "Honda Vila Mariana", rating: 4.9, cost: "R$ 890", km: "50.000 km", ok: true },
      { date: "14 jun 2025", title: "Troca de bateria", prov: "SOS Bateria", rating: 4.6, cost: "R$ 410", km: "47.300 km", ok: true },
    ],
  },
  apto: {
    a: ASSETS[1],
    stats: [["6", "Serviços"], ["R$ 2.640", "Investido"], ["1", "Garantia"]],
    events: [
      { date: "28 mar 2026", title: "Reparo hidráulico · cozinha", prov: "Carlos R.", rating: 4.8, cost: "R$ 220", km: "Cozinha", warranty: "Garantia até set 2026", ok: true },
      { date: "10 jan 2026", title: "Pintura · sala e corredor", prov: "Pinta Bem", rating: 4.7, cost: "R$ 1.350", km: "Sala", ok: true },
      { date: "02 dez 2025", title: "Instalação de luminárias", prov: "Beatriz L.", rating: 4.9, cost: "R$ 480", km: "Sala", ok: true },
      { date: "15 out 2025", title: "Troca de fechadura", prov: "Chaveiro 24h", rating: 4.6, cost: "R$ 290", km: "Entrada", ok: true },
    ],
  },
  ac: {
    a: ASSETS[2],
    stats: [["4", "Serviços"], ["R$ 760", "Investido"], ["1", "Garantia"]],
    events: [
      { date: "18 jan 2026", title: "Limpeza e higienização", prov: "Refrigera SP", rating: 4.8, cost: "R$ 160", km: "12k BTUs", warranty: "Garantia até jul 2026", ok: true },
      { date: "22 jul 2025", title: "Recarga de gás", prov: "Refrigera SP", rating: 4.8, cost: "R$ 280", km: "12k BTUs", ok: true },
      { date: "09 fev 2025", title: "Troca de capacitor", prov: "Frio Já", rating: 4.5, cost: "R$ 190", km: "12k BTUs", ok: true },
    ],
  },
};

function AssetDetailScreen({ id = "civic" }) {
  const data = ASSET_TIMELINE[id] || ASSET_TIMELINE.civic;
  const { a, stats, events } = data;
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">{a.name}</span>
        <span className="grow" />
        <div className="backbtn"><Icon name="edit" size={17} /></div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
            <div className={"asset-ic" + (a.grad ? " grad" : "")} style={{ width: 56, height: 56 }}><Icon name={a.ic} size={28} /></div>
            <div className="grow">
              <div className="asset-name" style={{ fontSize: 17 }}>{a.name}</div>
              <div className="asset-sub">{a.sub}</div>
            </div>
          </div>

          <div className="asset-stats">
            {stats.map(([v, k]) => (
              <div className="as" key={k}><div className="av">{v}</div><div className="ak">{k}</div></div>
            ))}
          </div>

          {a.due && (
            <div className="due-card">
              <div className="due-ic"><Icon name="clock" size={20} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{a.due}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginTop: 1 }}>Próxima manutenção · {a.dueIn}</div>
              </div>
              <button className="btn grad sm" data-go="create">Agendar</button>
            </div>
          )}

          <div className="section-label" style={{ marginTop: 2 }}>Histórico de manutenções</div>
          <div className="card" style={{ padding: 16 }}>
            <div className="mtl">
              {events.map((e, i) => (
                <div className="mtl-item" key={i}>
                  <div className="mtl-rail"><div className={"mtl-node" + (e.ok ? " ok" : "")}><Icon name="wrench" size={16} /></div></div>
                  <div className="mtl-body">
                    <div className="row" style={{ alignItems: "baseline" }}>
                      <span className="mtl-date">{e.date} · {e.km}</span>
                      <span className="mtl-cost">{e.cost}</span>
                    </div>
                    <div className="mtl-title">{e.title}</div>
                    <div className="mtl-prov"><Icon name="star" size={13} fill="current" /> {e.prov} · {e.rating}</div>
                    {e.warranty && (
                      <div className="mtl-tags">
                        <span className="badge b-done"><Icon name="shieldCheck" size={13} /> {e.warranty}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TabBar role="customer" active="list" />
    </>
  );
}

Object.assign(window, { MiniMap, CatTile, HomeScreen, CategoriesScreen, CreateRequestScreen, RequestDetailScreen, TrackingScreen, AssetsScreen, AssetCard, AssetDetailScreen });
