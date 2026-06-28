/* walvee-v2-proto.jsx — navigable prototype shell.
   Single phone frame, screen-stack router, theme toggle, screen menu.
   Reuses all existing screen components (window.*). Navigation is wired
   with a delegated click handler + per-screen link maps so the original
   screen components stay untouched. */

const { useState, useEffect, useRef, useCallback } = React;

/* ---- Dashboard with a Rotas entry (integration point) ---- */
function ProtoDashboard() {
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <AppMenu role="provider" />
        <div>
          <div className="ab-sub">Modo profissional</div>
          <h1 className="ab-title">Rafael C.</h1>
        </div>
        <span className="spacer" />
        <div className="iconbtn"><Icon name="bell" size={20} /></div>
        <div className="av-init" style={{ width: 42, height: 42, borderRadius: 14, background: "#3b82f6" }} data-go="account">RC</div>
      </div>

      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="online-card">
            <div className="pulse" />
            <div className="row" style={{ position: "relative" }}>
              <div className="grow">
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: .9, letterSpacing: ".04em" }}>VOCÊ ESTÁ ONLINE</div>
                <div style={{ fontWeight: 800, fontSize: 20, marginTop: 2 }}>Recebendo trabalhos próximos</div>
              </div>
              <div className="toggle on" />
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="row" style={{ alignItems: "stretch" }}>
              <div className="stat"><div className="v">R$ 480</div><div className="k">Hoje</div></div>
              <div style={{ width: 1, background: "var(--line)" }} />
              <div className="stat" style={{ paddingLeft: 16 }}><div className="v">6</div><div className="k">Trabalhos</div></div>
              <div style={{ width: 1, background: "var(--line)" }} />
              <div className="stat" style={{ paddingLeft: 16 }}><div className="v">4.9</div><div className="k">Avaliação</div></div>
            </div>
          </div>

          {/* ---- Rotas add-on entry ---- */}
          <div className="proto-rotas" data-go="shift">
            <div className="pr-ic"><Icon name="route" size={24} /></div>
            <div className="grow">
              <div className="row" style={{ gap: 7 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>Rotas de hoje</span>
                <span className="badge" style={{ background: "rgba(255,255,255,.22)", color: "#fff", fontWeight: 800, padding: "3px 9px", fontSize: 11 }}>Add-on</span>
              </div>
              <div style={{ fontSize: 12.5, opacity: .92, marginTop: 2 }}>3 rotas · 18 paradas · turno não iniciado</div>
            </div>
            <Icon name="fwd" size={20} />
          </div>

          <div className="section-label">Em andamento</div>
          <div className="card" style={{ padding: 16 }} data-go="active">
            <div className="row">
              <div className="cat-ic"><Icon name="car" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Flat tire</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Mateus A. · 1.2 km</div>
              </div>
              <span className="badge b-live dot">A caminho</span>
            </div>
          </div>

          <div className="section-label">Novos por perto</div>
          <div className="card" style={{ padding: 16, border: "1.5px solid var(--accent)" }} data-go="bid">
            <div className="row">
              <div className="cat-ic grad"><Icon name="battery" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Bateria descarregada</div>
                <div className="muted" style={{ fontSize: 12.5 }}>0.8 km · até R$ 150</div>
              </div>
              <button className="btn grad sm">Propor</button>
            </div>
          </div>
        </div>
      </div>

      <div className="fab" style={{ bottom: 100 }} data-go="nearby"><Icon name="search" size={26} /></div>
      <TabBar role="provider" active="home" />
    </>
  );
}

/* ---- Proposal status — same screen for "sent/waiting" and "accepted" ---- */
function ProviderBidStatus({ accepted }) {
  const steps = accepted
    ? [["Proposta enviada", "14:02", "done"], ["Vista pelo cliente", "14:03", "done"], ["Proposta aceita", "14:05", "done"]]
    : [["Proposta enviada", "Agora · 14:02", "done"], ["Vista pelo cliente", "Aguardando", "now"], ["Resposta do cliente", "Pendente", "todo"]];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">{accepted ? "Proposta aceita" : "Proposta enviada"}</span>
        <span className="grow" />
        <span className={"badge dot " + (accepted ? "b-done" : "b-live")}>{accepted ? "Aceita" : "Aguardando"}</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 11, textAlign: "center" }}>
            <div className={"proto-wait" + (accepted ? " ok" : "")}><Icon name={accepted ? "check" : "clock"} size={accepted ? 36 : 32} sw={accepted ? 2.6 : 2} /></div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{accepted ? "O cliente aceitou sua proposta" : "Proposta enviada"}</div>
            <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{accepted ? "Inicie o deslocamento até o local do atendimento." : "Mateus A. está analisando. Avisamos assim que houver resposta."}</div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="battery" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Roadside · Bateria descarregada</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Jardins · 0,8 km · Mateus A.</div>
              </div>
              <span className="badge b-urgent dot">Urgente</span>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}><MiniMap height={170} /></div>

          <div className="section-label">Sua proposta</div>
          <div className="card" style={{ padding: "4px 16px" }}>
            <div className="total-line" style={{ padding: "13px 0", borderBottom: "1px solid var(--line)" }}><span className="tk">Preço</span><span style={{ fontWeight: 800, fontSize: 16 }}>R$ 110</span></div>
            <div className="total-line" style={{ padding: "13px 0", borderBottom: "1px solid var(--line)" }}><span className="tk">Chega em</span><span style={{ fontWeight: 700 }}>12 min</span></div>
            <div style={{ padding: "13px 0", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.45 }}>“On my way with a jump pack and tools. 6 years' experience.”</div>
          </div>

          <div className="section-label">Status</div>
          <div className="card flat" style={{ padding: "4px 16px" }}>
            {steps.map(([t, w, st], i) => (
              <div key={i} className="row" style={{ padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none", gap: 12 }}>
                <span className={"v2-idx" + (st === "done" ? " done" : st === "now" ? " now" : "")} style={{ flex: "none" }}>{st === "done" ? <Icon name="check" size={12} sw={3} /> : i + 1}</span>
                <div className="grow" style={{ fontWeight: 700, fontSize: 13.5, color: st === "todo" ? "var(--ink-3)" : "var(--ink)" }}>{t}</div>
                <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="chat" size={18} /></button>
        {accepted
          ? <div style={{ flex: 1 }}><SlideConfirm variant="accept" label="Arraste para iniciar" fill={16} /></div>
          : <button className="btn ghost" style={{ flex: 1 }}>Editar ou cancelar proposta</button>}
      </div>
    </>
  );
}

/* ---- Client's custom form for the provider to answer ---- */
function ProviderClientForm() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Formulário do cliente</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="clipboard" size={19} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Mateus A. pede estas informações antes de aceitar propostas.</div>
          </div>

          <div className="q-ans">
            <div className="qq">Você traz jump pack próprio?</div>
            <div className="segment" style={{ marginTop: 10 }}>
              <div className="seg active">Sim</div>
              <div className="seg">Não</div>
            </div>
          </div>

          <div className="q-ans">
            <div className="qq">Em quanto tempo consegue chegar?</div>
            <div className="field" style={{ marginTop: 8 }}><div className="fv">~12 minutos</div></div>
          </div>

          <div className="q-ans">
            <div className="qq">Anexe um comprovante/credencial (opcional)</div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <div className="ph-img" style={{ width: 72, height: 72 }}>doc</div>
              <div className="card flat" style={{ width: 72, height: 72, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: "var(--ink-3)", padding: 0 }}>
                <Icon name="camera" size={20} /><span style={{ fontSize: 10.5, fontWeight: 700 }}>Add</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Responder e voltar à proposta <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ---- Agenda — provider pipeline by status: executados / em proposta / aceitos / cancelados ---- */
function ProviderAgenda() {
  const [filter, setFilter] = useState("all");
  const [when, setWhen] = useState("all");
  const filters = [["all", "Todos"], ["wait", "Em proposta"], ["ok", "Aceitos"], ["done", "Executados"], ["cancel", "Cancelados"]];
  const dates = [["all", "Qualquer data"], ["today", "Hoje"], ["upcoming", "Próximos"], ["past", "Anteriores"]];
  const meta = {
    wait:   { k: "proposto", badge: "Aguardando cliente", cls: "b-live", go: "bid-sent" },
    ok:     { k: "acordado", badge: "Aceito", cls: "b-done", go: "active" },
    done:   { k: "recebido", badge: "Executado", cls: "b-ok", go: "rate" },
    cancel: { k: "—", badge: "Cancelado", cls: "b-cancel", go: null },
  };
  const items = [
    ["battery", "Bateria descarregada", "Mateus A. · Jardins", "Hoje · agora", 110, "wait", "today"],
    ["drop", "Reparo de vazamento", "Carlos R. · Jardins", "Amanhã · 14:30", 140, "wait", "upcoming"],
    ["sparkles", "Limpeza pesada", "Ana M. · Pinheiros", "Amanhã · 09:00", 180, "ok", "upcoming"],
    ["flash", "Instalação de luminária", "Beatriz L. · Bela Vista", "Ter 17 · 10:00", 160, "ok", "upcoming"],
    ["wrench", "Conserto de eletro", "João P. · Vila Mariana", "Ontem · 15:00", 130, "done", "past"],
    ["paw", "Banho & tosa", "Diego S. · Consolação", "Seg 9 · 16:00", 90, "done", "past"],
    ["truck", "Guincho", "Renata F. · Pinheiros", "Sex 6 · cancelado", 300, "cancel", "past"],
  ];
  const shown = items.filter(([, , , , , st, w]) => (filter === "all" || st === filter) && (when === "all" || w === when));
  const fLabel = filters.find(([k]) => k === filter)[1];
  const wLabel = dates.find(([k]) => k === when)[1];
  const activeFilter = filter !== "all" || when !== "all";
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <div>
          <div className="ab-sub">Seus compromissos</div>
          <h1 className="ab-title">Agenda</h1>
        </div>
        <span className="spacer" />
        <div className="iconbtn"><Icon name="filter" size={20} /></div>
      </div>
      <div className="ag-filter">
        {filters.map(([k, l]) => (
          <button key={k} className={"ag-chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="ag-filter" style={{ paddingTop: 0 }}>
        {dates.map(([k, l]) => (
          <button key={k} className={"ag-chip date" + (when === k ? " on" : "")} onClick={() => setWhen(k)}>{k !== "all" && <Icon name="clock" size={13} />}{l}</button>
        ))}
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 10, paddingBottom: 96 }}>
          {activeFilter && (
            <div className="ag-active">
              <span>Filtrando: <b>{[filter !== "all" && fLabel, when !== "all" && wLabel].filter(Boolean).join(" · ")}</b> · {shown.length}</span>
              <button className="ag-clear" onClick={() => { setFilter("all"); setWhen("all"); }}>Limpar <Icon name="close" size={13} /></button>
            </div>
          )}
          {shown.map(([icon, title, who, time, val, st], i) => {
            const m = meta[st];
            return (
              <div key={i} className="card" style={{ padding: 14, opacity: st === "cancel" ? .62 : 1 }} data-go={m.go || undefined}>
                <div className="row">
                  <div className="cat-ic"><Icon name={icon} size={22} /></div>
                  <div className="grow">
                    <div style={{ fontWeight: 800, fontSize: 14.5, textDecoration: st === "cancel" ? "line-through" : "none" }}>{title}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{who}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>{m.k}</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>R$ {val}</div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 11, gap: 7 }}>
                  <Icon name="clock" size={15} style={{ color: "var(--ink-3)", flex: "none" }} />
                  <span className="chip xs">{time}</span>
                  <span className="grow" />
                  <span className={"badge dot " + m.cls}>{m.badge}</span>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <div className="muted" style={{ textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>Nada por aqui.</div>}
        </div>
      </div>
      <TabBar role="provider" active="calendar" />
    </>
  );
}

/* ---- screen registry: id → render fn + label + group ---- */
const SCREENS = {
  dashboard:     { c: () => <ProtoDashboard />, label: "Painel do prestador", group: "On-demand" },
  nearby:        { c: () => <NearbyScreen />, label: "Solicitações próximas", group: "On-demand" },
  "nearby-map":  { c: () => <NearbyMapScreen />, label: "Próximas · mapa", group: "On-demand" },
  "nearby-cal":  { c: () => <NearbyCalendarScreen />, label: "Solicitações · calendário", group: "On-demand" },
  agenda:        { c: () => <ProviderAgenda />, label: "Agenda (propostos + fechados)", group: "On-demand" },
  bid:           { c: () => <ProviderBidScreen />, label: "Enviar proposta", group: "On-demand" },
  "bid-sent":     { c: () => <ProviderBidStatus />, label: "Proposta enviada · status", group: "On-demand" },
  "bid-accepted": { c: () => <ProviderBidStatus accepted />, label: "Proposta aceita · status", group: "On-demand" },
  approved:      { c: () => <ProviderJobApproved />, label: "Proposta aceita (clássico)", group: "On-demand" },
  enroute:       { c: () => <ProviderEnRoute />, label: "A caminho", group: "On-demand" },
  verify:        { c: () => <ProviderVerifyStart mode="scan" />, label: "Liberar atendimento", group: "On-demand" },
  active:        { c: () => <ProviderActiveJob />, label: "Trabalho ativo", group: "On-demand" },
  "active-sheet":{ c: () => <ProviderActiveJob sheet />, label: "Adicionar peça", group: "On-demand" },
  rate:          { c: () => <ProviderRateClient />, label: "Avaliar o cliente", group: "On-demand" },
  reqinfo:       { c: () => <ProviderRequestInfo />, label: "Perguntar ao cliente", group: "On-demand" },
  "custom-form": { c: () => <ProviderClientForm />, label: "Formulário do cliente", group: "On-demand" },
  account:       { c: () => <ProviderAccountScreen />, label: "Conta", group: "On-demand" },
  "acct-profile":{ c: () => <ProviderEditProfileScreen />, label: "Editar perfil", group: "On-demand" },
  "acct-services":{ c: () => <ProviderServicesManage />, label: "Meus serviços", group: "On-demand" },
  "acct-earn":   { c: () => <ProviderEarningsScreen />, label: "Ganhos & saques", group: "On-demand" },

  shift:         { c: () => <V2ShiftStart />, label: "Início do turno · equipe", group: "Rotas" },
  equipment:     { c: () => <V2Equipment />, label: "Equipamentos do turno", group: "Rotas" },
  routes:        { c: () => <V2Routes />, label: "Minhas rotas", group: "Rotas" },
  shiftinfo:     { c: () => <V2ShiftInfo />, label: "Turno ativo · equipe", group: "Rotas" },
  "route-detail":{ c: () => <V2RouteDetail />, label: "Detalhe da rota", group: "Rotas" },
  site:          { c: () => <V2SiteDetail />, label: "Ficha do ativo (local)", group: "Rotas" },
  visit:         { c: () => <V2VisitDetail />, label: "Visita em execução", group: "Rotas" },
  "add-service": { c: () => <V2AddService />, label: "Adicionar serviço extra", group: "Rotas" },
  "service-detail":{ c: () => <V2ServiceDetail />, label: "Serviço · passos", group: "Rotas" },
  guided:        { c: () => <V2Guided at={0} />, label: "Execução guiada · leitura", group: "Rotas" },
  guided2:       { c: () => <V2Guided at={1} />, label: "Execução guiada · consumível", group: "Rotas" },
  execution:     { c: () => <V2Execution />, label: "Execução (checklist)", group: "Rotas" },
  vehicle:       { c: () => <V2AssetVehicle />, label: "Ativo móvel (carro)", group: "Rotas" },
  report:        { c: () => <V2ReportScreen />, label: "Relatório do cliente", group: "Rotas" },

  assets:        { c: () => <AssetsScreen />, label: "Meus ativos", group: "Cliente" },
  "asset-civic": { c: () => <AssetDetailScreen id="civic" />, label: "Histórico · Honda Civic", group: "Cliente" },
  "asset-apto":  { c: () => <AssetDetailScreen id="apto" />, label: "Histórico · Apartamento", group: "Cliente" },
  "asset-ac":    { c: () => <AssetDetailScreen id="ac" />, label: "Histórico · Ar-condicionado", group: "Cliente" },
};

/* ---- per-screen navigation rules ---- */
const VT = { idxSel: ".view-toggle .vt", dests: ["nearby", "nearby-map", "nearby-cal"] };
const TABS = { idxSel: ".tabbar .tab", dests: ["dashboard", "nearby", "agenda", "account"] };
const LINKS = {
  dashboard:     [TABS],
  nearby:        [VT, TABS, { sel: ".card", go: "bid" }],
  "nearby-map":  [VT, { sel: ".btn", go: "bid" }, { sel: ".sheet", go: "bid" }],
  "nearby-cal":  [VT, TABS, { sel: ".card", go: "bid" }],
  agenda:        [TABS],
  bid:           [{ sel: ".slide", go: "bid-sent" }],
  "bid-sent":    [{ idxSel: ".btn.ghost", dests: ["reqinfo", "custom-form"] }, { sel: ".card", go: "bid-accepted" }],
  "bid-accepted":[{ sel: ".slide", go: "enroute" }],
  reqinfo:       [{ sel: ".card.flat", go: "custom-form" }, { sel: ".btn.grad", go: "bid-sent" }],
  "custom-form": [{ sel: ".btn.grad", go: "bid-sent" }],
  approved:      [{ sel: ".slide", go: "enroute" }],
  enroute:       [{ sel: ".slide", go: "verify" }],
  verify:        [{ sel: ".btn.grad", go: "active" }],
  active:        [{ sel: ".add-part", go: "active-sheet" }, { sel: ".footer .btn.grad", go: "rate" }],
  "active-sheet":[{ sel: ".modal-sheet .btn.grad", go: "active" }, { sel: ".scrim", go: "active" }],
  rate:          [{ sel: ".btn.grad", go: "__home" }],
  account:       [{ idxSel: ".acct-row", dests: ["acct-profile", "acct-services", null, "acct-earn"] }, TABS],

  shift:         [{ sel: ".btn.grad", go: "equipment" }],
  equipment:     [{ sel: ".slide", go: "routes" }],
  routes:        [{ sel: ".v2-route", go: "route-detail" }, { sel: ".iconbtn", go: "shiftinfo" },
                  { idxSel: ".tabbar .tab", dests: ["routes", null, null, "account"] }],
  "route-detail":[{ sel: ".v2-stoprow", go: "site" }, { sel: ".footer .btn.grad", go: "site" }],
  site:          [{ sel: ".footer .btn.grad", go: "visit" }],
  visit:         [{ idxSel: ".btn.ghost", dests: ["site", "add-service"] }, { sel: ".v2-do", go: "service-detail" }, { sel: ".slide", go: "route-detail" }],
  "add-service": [{ sel: ".addsheet .iconbtn", go: "__back" }, { sel: ".ash-new", go: "visit" }, { sel: ".v2-add", go: "visit" }],
  "service-detail":[{ sel: ".footer .btn.grad", go: "guided" }],
  guided:        [{ sel: ".v2-sc-body .btn.grad", go: "guided2" }, { sel: ".footer .btn.grad", go: "visit" }],
  guided2:       [{ sel: ".v2-sc-body .btn.grad", go: "visit" }, { sel: ".footer .btn.grad", go: "visit" }],
};

function resolveNav(screenId, root, target) {
  // 1 · explicit data-go authored elements
  const dg = target.closest("[data-go]");
  if (dg && root.contains(dg)) return dg.getAttribute("data-go");
  // 2 · universal back (first .backbtn only)
  const bb = target.closest(".backbtn");
  if (bb && root.contains(bb)) {
    const all = [...root.querySelectorAll(".backbtn")];
    if (all.indexOf(bb) === 0) return "__back";
  }
  // 3 · per-screen rules
  const rules = LINKS[screenId] || [];
  for (const r of rules) {
    if (r.idxSel) {
      const el = target.closest(r.idxSel);
      if (el && root.contains(el)) {
        const all = [...root.querySelectorAll(r.idxSel)];
        const dest = r.dests[all.indexOf(el)];
        if (dest) return dest;
      }
    } else if (r.sel) {
      const el = target.closest(r.sel);
      if (el && root.contains(el)) {
        if (r.nth != null) {
          const all = [...root.querySelectorAll(r.sel)];
          if (all.indexOf(el) !== r.nth) continue;
        }
        return r.go;
      }
    }
  }
  return null;
}

const LS_STACK = "wv2_proto_stack", LS_THEME = "wv2_proto_theme";

function Proto() {
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || "sunset");
  const [stack, setStack] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(LS_STACK)); if (Array.isArray(s) && s.length && SCREENS[s[s.length - 1]]) return s; } catch (e) {}
    return ["dashboard"];
  });
  const [menu, setMenu] = useState(false);
  const [tw, setTweak] = useTweaks(WV_DRAWER_DEFAULTS);
  useEffect(() => { setDrawerCfg(tw); }, [tw]);
  const [scale, setScale] = useState(1);
  const [bump, setBump] = useState(0); // re-key screen to reset scroll/state
  const stageRef = useRef(null);
  const screenRef = useRef(null);
  const cur = stack[stack.length - 1];

  useEffect(() => { localStorage.setItem(LS_STACK, JSON.stringify(stack)); }, [stack]);
  useEffect(() => { localStorage.setItem(LS_THEME, theme); }, [theme]);

  const go = useCallback((id) => {
    if (id === "__back") { setStack((s) => s.length > 1 ? s.slice(0, -1) : s); setBump((b) => b + 1); return; }
    if (id === "__home") { setStack(["dashboard"]); setBump((b) => b + 1); return; }
    if (!SCREENS[id]) return;
    setStack((s) => s[s.length - 1] === id ? s : [...s, id]);
    setBump((b) => b + 1);
  }, []);

  const jump = useCallback((id) => { setStack([id]); setMenu(false); setBump((b) => b + 1); }, []);

  const onClick = useCallback((e) => {
    const root = screenRef.current;
    if (!root) return;
    const dest = resolveNav(cur, root, e.target);
    if (dest) { e.preventDefault(); go(dest); }
  }, [cur, go]);

  // fit phone to viewport
  useEffect(() => {
    const fit = () => {
      const availH = window.innerHeight - 58 - 28;
      const availW = window.innerWidth - 28;
      setScale(Math.min(availH / 844, availW / 390, 1.25));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // reset inner scroll on navigation
  useEffect(() => {
    const sc = screenRef.current && screenRef.current.querySelector(".scroll");
    if (sc) sc.scrollTop = 0;
  }, [bump]);

  const groups = {};
  Object.entries(SCREENS).forEach(([id, s]) => { (groups[s.group] = groups[s.group] || []).push([id, s.label]); });

  return (
    <div className="proto-root">
      <header className="proto-bar">
        <button className="pb-btn" disabled={stack.length <= 1} onClick={() => go("__back")} title="Voltar">
          <Icon name="back" size={18} />
        </button>
        <button className="pb-btn" onClick={() => go("__home")} title="Início">
          <Icon name="home-outline" size={18} />
        </button>
        <div className="pb-title">{SCREENS[cur] ? SCREENS[cur].label : cur}</div>
        <span className="grow" />
        <button className="pb-toggle" onClick={() => setTheme((t) => t === "sunset" ? "night" : "sunset")}>
          <Icon name="sunny-outline" size={15} />
          {theme === "sunset" ? "Light" : "Dark"}
        </button>
        <button className="pb-btn wide" onClick={() => setMenu(true)} title="Todas as telas">
          <Icon name="grip" size={16} /> Telas
        </button>
      </header>

      <div className="proto-stage" ref={stageRef}>
        <div className="proto-screen" ref={screenRef} onClickCapture={onClick}
          style={{ transform: `scale(${scale})` }}>
          <Phone theme={theme} key={cur + "-" + theme}>
            {SCREENS[cur] ? SCREENS[cur].c() : null}
          </Phone>
        </div>
      </div>

      {menu && (
        <div className="proto-menu" onClick={() => setMenu(false)}>
          <div className="pm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pm-head">
              <span>Todas as telas</span>
              <button className="pb-btn" onClick={() => setMenu(false)}><Icon name="close" size={16} /></button>
            </div>
            {Object.entries(groups).map(([g, items]) => (
              <div key={g} className="pm-group">
                <div className="pm-glabel">{g}</div>
                {items.map(([id, label]) => (
                  <button key={id} className={"pm-item" + (id === cur ? " on" : "")} onClick={() => jump(id)}>
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Menu lateral" />
        <TweakRadio label="Largura" value={tw.width}
          options={[{ value: "compact", label: "Estreito" }, { value: "standard", label: "Padrão" }, { value: "wide", label: "Largo" }]}
          onChange={(v) => setTweak("width", v)} />
        <TweakRadio label="Densidade" value={tw.density}
          options={[{ value: "cozy", label: "Confortável" }, { value: "compact", label: "Compacto" }]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Ícones nos itens" value={tw.icons} onChange={(v) => setTweak("icons", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Proto />);
