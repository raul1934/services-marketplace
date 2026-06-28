/* walvee-v2-web.jsx — Rotas add-on, web management console.
   Wraps each screen in ChromeWindow (browser-window.jsx). Uses .wv2-* classes
   inside a .t-sunset.wv2-web shell. Exposes screens + window.V2_WEB. */

function WebShell({ active, title, actions, children }) {
  const nav = [
    ["route", "Rotas", "routes"],
    ["calendar", "Agenda", "calendar"],
    ["users", "Equipes", "crew"],
    ["home-outline", "Sites", "sites"],
    ["box", "Equipamentos", "equip"],
  ];
  return (
    <div className="t-sunset wv2-web">
      <aside className="wv2-side">
        <div className="wv2-brand"><span className="mk"><Icon name="route" size={18} style={{ color: "#fff" }} /></span>walvee <span style={{ color: "var(--accent)", fontSize: 13, alignSelf: "center" }}>rotas</span></div>
        {nav.map(([ic, label, k]) => (
          <div key={k} className={"wv2-nav" + (active === k ? " on" : "")}><Icon name={ic} size={18} /> {label}</div>
        ))}
        <span style={{ flex: 1 }} />
        <div className="wv2-nav"><Icon name="settings" size={18} /> Ajustes</div>
        <div className="wv2-nav"><Icon name="user" size={18} /> Acme Serviços</div>
      </aside>
      <div className="wv2-main">
        <div className="wv2-top">
          <h1>{title}</h1>
          <span style={{ flex: 1 }} />
          {actions}
        </div>
        <div className="wv2-body">{children}</div>
      </div>
    </div>
  );
}

const Pill = ({ k, children }) => <span className={"wv2-pill " + k}>{children}</span>;

/* ---- Routes planning ---- */
function V2WebRoutes() {
  const rows = [
    ["snow", "Rota Norte · Neve", "Rafael C. +2", "6", "run", "Em rota", "Hoje · 07:00"],
    ["drop", "Rota Piscinas", "Lucas P. +1", "7", "idle", "A iniciar", "Hoje · 09:30"],
    ["sparkles", "Rota Limpeza", "Bianca R.", "5", "ok", "Concluída", "Hoje · 06:00"],
    ["wrench", "Rota Manutenção", "—", "4", "idle", "Não atribuída", "Amanhã · 08:00"],
  ];
  const cols = "28px 1.6fr 1.2fr .5fr .9fr 1fr";
  return (
    <WebShell active="routes" title="Rotas" actions={<><button className="wv2-btn ghost"><Icon name="filter" size={15} /> Filtrar</button><button className="wv2-btn grad"><Icon name="plus" size={15} /> Nova rota</button></>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <div className="wv2-kpi"><div className="v">12</div><div className="k">Rotas hoje</div></div>
        <div className="wv2-kpi"><div className="v">68</div><div className="k">Paradas</div></div>
        <div className="wv2-kpi"><div className="v">9</div><div className="k">Técnicos ativos</div></div>
        <div className="wv2-kpi"><div className="v">94%</div><div className="k">No prazo</div></div>
      </div>
      <div className="wv2-card">
        <div className="wv2-th" style={{ gridTemplateColumns: cols }}><span></span><span>Rota</span><span>Equipe</span><span>Paradas</span><span>Status</span><span>Agendada</span></div>
        {rows.map(([ic, name, crew, stops, st, label, when], i) => (
          <div key={i} className="wv2-tr" style={{ gridTemplateColumns: cols }}>
            <span className="wv2-eq" style={{ width: 28, height: 28, borderRadius: 8, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent)", border: "none" }}><Icon name={ic} size={15} /></span>
            <span style={{ fontWeight: 800 }}>{name}</span>
            <span style={{ color: crew === "—" ? "var(--ink-3)" : "var(--ink-2)", fontWeight: 600 }}>{crew}</span>
            <span style={{ fontWeight: 700 }}>{stops}</span>
            <span><Pill k={st}>{label}</Pill></span>
            <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{when}</span>
          </div>
        ))}
      </div>
    </WebShell>
  );
}

/* ---- Calendar of scheduled routes ---- */
function V2WebCalendar() {
  const dows = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const evts = {
    16: [["Rota Norte", ""], ["Piscinas", "b"]],
    17: [["Rota Norte", ""], ["Piscinas", "b"], ["Limpeza", "g"]],
    18: [["Manutenção", ""]],
    19: [["Rota Norte", ""], ["Limpeza", "g"]],
    20: [["Piscinas", "b"]],
    23: [["Rota Norte", ""], ["Manutenção", ""]],
    24: [["Limpeza", "g"], ["Piscinas", "b"]],
  };
  const cells = []; for (let d = 1; d <= 28; d++) cells.push(d);
  return (
    <WebShell active="calendar" title="Agenda" actions={<><button className="wv2-btn ghost"><Icon name="back" size={15} /></button><span style={{ fontWeight: 800, fontSize: 14 }}>Junho 2026</span><button className="wv2-btn ghost"><Icon name="fwd" size={15} /></button><button className="wv2-btn grad"><Icon name="plus" size={15} /> Agendar</button></>}>
      <div className="wv2-cal" style={{ marginBottom: 8 }}>{dows.map((d) => <div key={d} className="wv2-calhead">{d}</div>)}</div>
      <div className="wv2-cal">
        {cells.map((d) => (
          <div key={d} className={"wv2-day" + (d < 16 ? " dim" : "")}>
            <span className="dn">{d}</span>
            {(evts[d] || []).map(([n, c], i) => <span key={i} className={"wv2-evt " + c}>{n}</span>)}
          </div>
        ))}
      </div>
    </WebShell>
  );
}

/* ---- Crew assignment (assign team to a route) ---- */
function V2WebCrew() {
  const people = [
    ["Rafael C.", "Líder · Veicular", "#3b82f6", "assigned"],
    ["Lucas P.", "Técnico · Piscina", "#12b981", "assigned"],
    ["Bianca R.", "Técnica · Limpeza", "#f59e0b", "assigned"],
    ["Diego M.", "Auxiliar", "#a855f7", "free"],
    ["Paulo S.", "Auxiliar", "#ec4899", "free"],
    ["Marina T.", "Técnica · Neve", "#0ea5a5", "free"],
  ];
  return (
    <WebShell active="crew" title="Atribuir equipe — Rota Norte · Neve" actions={<><button className="wv2-btn ghost">Cancelar</button><button className="wv2-btn grad"><Icon name="check" size={15} /> Salvar equipe</button></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="v2-label" style={{ marginBottom: 12 }}>Equipe da rota <span className="c">3</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {people.filter((p) => p[3] === "assigned").map(([n, r, c]) => (
              <div key={n} className="wv2-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 13 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: c, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{n.split(" ").map((x) => x[0]).join("")}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 13.5 }}>{n}</div><div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{r}</div></div>
                {n === "Rafael C." ? <Pill k="run">Líder</Pill> : <Icon name="close" size={16} style={{ color: "var(--ink-3)" }} />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="v2-label" style={{ marginBottom: 12 }}>Disponíveis</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {people.filter((p) => p[3] === "free").map(([n, r, c]) => (
              <div key={n} className="wv2-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 13 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: c, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{n.split(" ").map((x) => x[0]).join("")}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 13.5 }}>{n}</div><div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{r}</div></div>
                <button className="wv2-btn ghost" style={{ padding: "7px 12px" }}><Icon name="plus" size={14} /> Add</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WebShell>
  );
}

/* ---- Equipment catalog ---- */
function V2WebEquip() {
  const eq = [
    ["wrench", "Bomba dosadora", "8 em uso · 2 manutenção", "drop"],
    ["snow", "Lâmina de neve 2.4m", "4 unidades", ""],
    ["settings", "Aspirador de piscina", "12 unidades", ""],
    ["truck", "Caminhão #3", "Rota Norte", ""],
    ["sparkles", "Lavadora alta pressão", "6 unidades", ""],
    ["battery", "Gerador portátil", "3 unidades · 1 baixa", ""],
  ];
  return (
    <WebShell active="equip" title="Equipamentos" actions={<button className="wv2-btn grad"><Icon name="plus" size={15} /> Novo equipamento</button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {eq.map(([ic, n, meta], i) => (
          <div key={i} className="wv2-eq">
            <div className="ei"><Icon name={ic} size={22} /></div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{n}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, marginTop: 4 }}>{meta}</div>
          </div>
        ))}
      </div>
    </WebShell>
  );
}

window.V2_WEB = {
  title: "Rotas · Console de gestão (web)",
  subtitle: "Planejamento de rotas, agenda de rotas agendadas, atribuição de equipe e catálogo de equipamentos.",
  screens: [
    ["Planejamento de rotas", V2WebRoutes],
    ["Agenda (rotas agendadas)", V2WebCalendar],
    ["Atribuir equipe à rota", V2WebCrew],
    ["Catálogo de equipamentos", V2WebEquip],
  ],
};
Object.assign(window, { WebShell, V2WebRoutes, V2WebCalendar, V2WebCrew, V2WebEquip });
