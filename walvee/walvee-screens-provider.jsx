/* walvee-screens-provider.jsx — provider screens, Rate & review, Foundations. */

/* ============================================================ PROVIDER DASHBOARD */
function ProviderDashboard() {
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
        <div className="av-init" style={{ width: 42, height: 42, borderRadius: 14, background: "#3b82f6" }}>RC</div>
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

          <div className="section-label">Em andamento</div>
          <div className="card" style={{ padding: 16 }}>
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
          <div className="card" style={{ padding: 16, border: "1.5px solid var(--accent)" }}>
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

      <div className="fab" style={{ bottom: 100 }}><Icon name="search" size={26} /></div>
      <TabBar role="provider" active="home" />
    </>
  );
}

/* ============================================================ RATE & REVIEW */
function RateScreen() {
  const tags = ["Punctual", "Friendly", "Fair price", "Skilled", "Clean work"];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Rate your service</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16, alignItems: "stretch" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 26, paddingBottom: 24 }}>
            <div className="av-init" style={{ width: 72, height: 72, borderRadius: 24, fontSize: 26, background: "#3b82f6" }}>RC</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Rafael C.</div>
              <div className="muted" style={{ fontSize: 13 }}>Flat tire · completed in 22 min</div>
            </div>
            <div className="stars" style={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={36} fill={i <= 5 ? "current" : "none"} />)}
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>Excellent</div>
          </div>

          <div className="section-label">What went well?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t, i) => <span key={t} className={"chip" + (i < 3 ? " active grad" : "")}>{t}</span>)}
          </div>

          <div className="field" style={{ minHeight: 70 }}>
            <div className="fl">Add a comment</div>
            <div className="fv ph" style={{ marginTop: 5 }}>Fast, professional, and friendly. Saved my afternoon.</div>
          </div>

          <div className="section-label">Add a tip</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["No tip", "R$ 5", "R$ 10", "R$ 20"].map((t, i) => (
              <span key={t} className={"chip" + (i === 2 ? " active" : "")} style={{ flex: 1, justifyContent: "center" }}>{t}</span>
            ))}
          </div>

          <button className="btn grad" style={{ marginTop: 4 }}>Submit review</button>
        </div>
      </div>
    </>
  );
}

/* ============================================================ NEARBY (provider) */
function NearbyJob({ icon, title, sub, dist, avg, urgent }) {
  return (
    <div className="card" style={{ padding: 15 }}>
      <div className="row">
        <div className="cat-ic"><Icon name={icon} size={24} /></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>
        </div>
        {urgent && <span className="badge b-urgent dot" style={{ padding: "4px 9px", fontSize: 11, flex: "none" }}>Urgente</span>}
      </div>
      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 800 }}><Icon name="pin" size={12} fill="current" /> {dist} km</span>
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>Média da área <span style={{ color: "var(--ink)" }}>R$ {avg}</span></div>
        <span className="grow" />
        <button className="btn grad sm">Enviar proposta</button>
      </div>
    </div>
  );
}

const NEARBY_JOBS = [
  { icon: "battery", title: "Bateria descarregada", loc: "Jardins",      mins: 2,  dist: 0.8, avg: 120, urgent: true,  cat: "road", mx: "45%", my: "33%" },
  { icon: "key",     title: "Sem chave no carro",   loc: "Bela Vista",   mins: 6,  dist: 1.4, avg: 110, urgent: false, cat: "road", mx: "74%", my: "46%" },
  { icon: "flash",   title: "Instalação de luminária", loc: "Bela Vista", mins: 9, dist: 1.8, avg: 160, urgent: false, cat: "home", mx: "58%", my: "26%" },
  { icon: "sparkles",title: "Limpeza pesada",       loc: "Pinheiros",    mins: 13, dist: 2.0, avg: 180, urgent: false, cat: "home", mx: "37%", my: "52%" },
  { icon: "drop",    title: "Sem combustível",      loc: "Consolação",   mins: 11, dist: 2.1, avg: 80,  urgent: false, cat: "road", mx: "26%", my: "64%" },
  { icon: "paw",     title: "Banho & tosa",         loc: "Consolação",   mins: 21, dist: 2.4, avg: 90,  urgent: false, cat: "pets", mx: "80%", my: "62%" },
  { icon: "truck",   title: "Precisa de guincho",   loc: "Pinheiros",    mins: 18, dist: 3.0, avg: 300, urgent: true,  cat: "road", mx: "64%", my: "73%" },
];
const NB_CATS = [["all", "Todos"], ["road", "Roadside"], ["home", "Casa"], ["pets", "Pets"]];
const NB_RADIUS = [["all", "Qualquer"], ["1", "1 km"], ["3", "3 km"], ["5", "5 km"]];
const NB_MIN = [["0", "Qualquer"], ["100", "R$ 100+"], ["150", "R$ 150+"], ["250", "R$ 250+"]];
const NB_SORT = [["near", "Mais próximos"], ["value", "Maior valor"], ["recent", "Mais recentes"]];
const NB_DEFAULTS = { cat: "all", radius: "all", min: "0", urgent: false, sort: "near" };

/* ---- standard filter primitives, shared by every "nearby" screen ---- */
function useFilter(defaults = NB_DEFAULTS) {
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState(defaults);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const reset = () => setF(defaults);
  const active = JSON.stringify(f) !== JSON.stringify(defaults);
  return { open, setOpen, f, set, reset, active };
}

function filterJobs(jobs, f, { sort = true } = {}) {
  let out = jobs.filter((j) =>
    (f.cat === "all" || j.cat === f.cat) &&
    (f.radius === "all" || j.dist <= +f.radius) &&
    (j.avg >= +f.min) &&
    (!f.urgent || j.urgent)
  );
  if (sort) out = out.slice().sort((a, b) =>
    f.sort === "value" ? b.avg - a.avg : f.sort === "recent" ? a.mins - b.mins : a.dist - b.dist
  );
  return out;
}

function FilterButton({ ctl }) {
  return (
    <div className="backbtn nb-filter" onClick={() => ctl.setOpen(true)} style={{ position: "relative" }}>
      <Icon name="filter" size={18} />
      {ctl.active && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--surface)" }} />}
    </div>
  );
}

const FChips = ({ label, opts, val, onPick }) => (
  <div style={{ marginBottom: 14 }}>
    <SecLbl>{label}</SecLbl>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {opts.map(([k, l]) => (
        <span key={k} className={"chip" + (val === k ? " active grad" : "")} onClick={() => onPick(k)}>{l}</span>
      ))}
    </div>
  </div>
);

/* Section config for the provider "nearby jobs" filter — the default. */
const JOB_SECTIONS = [
  { label: "Categoria", key: "cat", opts: NB_CATS },
  { label: "Distância", key: "radius", opts: NB_RADIUS },
  { label: "Valor mínimo", key: "min", opts: NB_MIN },
  { label: "Ordenar por", key: "sort", opts: NB_SORT, sortOnly: true },
];
const JOB_TOGGLE = { key: "urgent", label: "Urgência", chip: "Só urgentes", icon: "flash" };

/* The one standard filter sheet, reused on every list/map/calendar screen.
   Pass `sections` + optional `toggle` to retarget it; defaults to nearby-jobs. */
function FilterSheet({ ctl, count, sections = JOB_SECTIONS, toggle = JOB_TOGGLE, sort = true, noun = ["resultado", "resultados"] }) {
  const { open, setOpen, f, set, reset, active } = ctl;
  if (!open) return null;
  return (
    <div className="scrim" onClick={() => setOpen(false)}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="row">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>Filtros</div>
          <span className="grow" />
          {active && <span onClick={reset} style={{ color: "var(--accent)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Limpar tudo</span>}
        </div>
        <div style={{ height: 14 }} />
        {sections.filter((s) => sort || !s.sortOnly).map((s) => (
          <FChips key={s.key} label={s.label} opts={s.opts} val={f[s.key]} onPick={(k) => set({ [s.key]: k })} />
        ))}
        {toggle && (
          <>
            <SecLbl>{toggle.label}</SecLbl>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span className={"chip" + (f[toggle.key] ? " active grad" : "")} onClick={() => set({ [toggle.key]: !f[toggle.key] })}>
                {toggle.icon && <Icon name={toggle.icon} size={14} />} {toggle.chip}
              </span>
            </div>
          </>
        )}
        <button onClick={() => setOpen(false)} style={{ width: "100%", border: "none", borderRadius: 14, padding: "14px", background: "var(--grad)", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: "pointer", marginTop: toggle ? 0 : 2 }}>
          Ver {count} {count === 1 ? noun[0] : noun[1]}
        </button>
      </div>
    </div>
  );
}

function NearbyScreen() {
  const ctl = useFilter();
  const { f, reset, active } = ctl;
  const jobs = filterJobs(NEARBY_JOBS, f);

  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Solicitações próximas</span>
        <span className="grow" />
        <FilterButton ctl={ctl} />
      </div>
      <div className="scroll" style={{ position: "relative" }}>
        <div className="content" style={{ gap: 13, paddingBottom: 76 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NB_CATS.map(([k, l]) => (
              <span key={k} className={"chip" + (f.cat === k ? " active grad" : "")} onClick={() => ctl.set({ cat: k })}>{l}</span>
            ))}
          </div>
          {active && (
            <div className="row" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "0 2px" }}>
              <span><b style={{ color: "var(--ink)" }}>{jobs.length}</b> {jobs.length === 1 ? "solicitação" : "solicitações"}</span>
              <span className="grow" />
              <span onClick={reset} style={{ color: "var(--accent)", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Limpar <Icon name="close" size={13} />
              </span>
            </div>
          )}
          {jobs.length === 0 ? (
            <div style={{ padding: "34px 26px", textAlign: "center", border: "1.5px dashed var(--line)", borderRadius: 18 }}>
              <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Nenhuma solicitação com esses filtros.</div>
              <span onClick={reset} style={{ display: "inline-block", marginTop: 8, color: "var(--accent)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Limpar filtros</span>
            </div>
          ) : jobs.map((j) => (
            <NearbyJob key={j.title} icon={j.icon} title={j.title} sub={`${j.mins} min atrás · ${j.loc}`} dist={j.dist} avg={j.avg} urgent={j.urgent} />
          ))}
        </div>
      </div>
      <ViewToggle active="list" cls="bottom" />
      <TabBar role="provider" active="briefcase" />
      <FilterSheet ctl={ctl} count={jobs.length} noun={["solicitação", "solicitações"]} />
    </>
  );
}

function ViewToggle({ active, cls }) {
  const tabs = [["list", "List"], ["location", "Map"], ["calendar", "Calendar"]];
  return (
    <div className={"view-toggle " + cls}>
      {tabs.map(([ic, label]) => (
        <div key={label} className={"vt" + (active === label.toLowerCase() ? " on" : "")}><Icon name={ic} size={16} /> {label}</div>
      ))}
    </div>
  );
}

/* ============================================================ NEARBY · CALENDAR VIEW (provider) */
const CAL_GROUPS = [
  ["Amanhã", "Sat, Jun 14", [
    { icon: "sparkles", title: "Limpeza pesada", loc: "Pinheiros", dist: 2.0, windows: ["Morning"], avg: 180, urgent: false, cat: "home", mins: 0 },
    { icon: "drop", title: "Reparo de vazamento", loc: "Jardins", dist: 1.3, windows: ["Morning", "Afternoon"], avg: 140, urgent: true, cat: "home", mins: 0 },
    { icon: "wrench", title: "Conserto de eletro", loc: "Vila Mariana", dist: 3.1, windows: ["Afternoon"], avg: 130, urgent: false, cat: "home", mins: 0 },
  ]],
  ["Tue", "Jun 17", [
    { icon: "flash", title: "Instalação de luminária", loc: "Bela Vista", dist: 1.8, windows: ["Afternoon", "Evening"], avg: 160, urgent: false, cat: "home", mins: 0 },
    { icon: "paw", title: "Banho & tosa", loc: "Consolação", dist: 2.4, windows: ["Morning"], avg: 90, urgent: false, cat: "pets", mins: 0 },
  ]],
];
function NearbyCalendarScreen() {
  const ctl = useFilter();
  const { f, reset } = ctl;
  const week = [["Fri", 13, 0], ["Sat", 14, 3], ["Sun", 15, 1], ["Mon", 16, 2], ["Tue", 17, 4], ["Wed", 18, 1], ["Thu", 19, 2]];
  const groups = CAL_GROUPS
    .map(([rel, date, jobs]) => [rel, date, filterJobs(jobs, f, { sort: false })])
    .filter(([, , jobs]) => jobs.length);
  const total = groups.reduce((n, [, , jobs]) => n + jobs.length, 0);
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Trabalhos agendados</span>
        <span className="grow" />
        <FilterButton ctl={ctl} />
      </div>
      <div className="scroll" style={{ position: "relative" }}>
        <div className="content" style={{ gap: 14, paddingBottom: 76 }}>
          <div className="week-strip">
            {week.map(([dow, d, n]) => (
              <div key={d} className={"wk-day" + (d === 14 ? " sel" : "") + (n === 0 ? " empty" : "")}>
                <span className="wk-dow">{dow}</span>
                <span className="wk-num">{d}</span>
                {n > 0 ? <span className="wk-dot">{n}</span> : <span className="wk-dot ghost" />}
              </div>
            ))}
          </div>

          {ctl.active && (
            <div className="row" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "0 2px" }}>
              <span><b style={{ color: "var(--ink)" }}>{total}</b> {total === 1 ? "trabalho" : "trabalhos"}</span>
              <span className="grow" />
              <span onClick={reset} style={{ color: "var(--accent)", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Limpar <Icon name="close" size={13} />
              </span>
            </div>
          )}

          {groups.length === 0 ? (
            <div style={{ padding: "34px 26px", textAlign: "center", border: "1.5px dashed var(--line)", borderRadius: 18 }}>
              <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Nenhum trabalho com esses filtros.</div>
              <span onClick={reset} style={{ display: "inline-block", marginTop: 8, color: "var(--accent)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Limpar filtros</span>
            </div>
          ) : groups.map(([rel, date, jobs]) => (
            <div key={date}>
              <div className="day-head">
                <span className="dh-rel">{rel}</span>
                <span className="dh-date">{date}</span>
                <span className="grow" />
                <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 800 }}>{jobs.length} abertos</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {jobs.map((j, i) => (
                  <div key={i} className="card" style={{ padding: 14 }}>
                    <div className="row">
                      <div className="cat-ic"><Icon name={j.icon} size={22} /></div>
                      <div className="grow">
                        <div className="row" style={{ gap: 7 }}>
                          <span style={{ fontWeight: 800, fontSize: 14.5 }}>{j.title}</span>
                          {j.urgent && <span className="badge b-urgent dot" style={{ padding: "3px 8px", fontSize: 10.5 }}>Urgente</span>}
                        </div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{j.loc} · {j.dist.toFixed(1)} km</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>média</div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>R$ {j.avg}</div>
                      </div>
                    </div>
                    <div className="row" style={{ marginTop: 11, gap: 7 }}>
                      <Icon name="clock" size={15} style={{ color: "var(--ink-3)", flex: "none" }} />
                      <div className="grow" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {j.windows.map((w) => <span key={w} className="chip xs">{w}</span>)}
                      </div>
                      <button className="btn grad sm">Propor</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ViewToggle active="calendar" cls="bottom" />
      <TabBar role="provider" active="calendar" />
      <FilterSheet ctl={ctl} count={total} sort={false} noun={["trabalho", "trabalhos"]} />
    </>
  );
}

/* ============================================================ NEARBY · MAP VIEW (provider) */
function NearbyMapScreen() {
  const ctl = useFilter();
  const { f } = ctl;
  const jobs = filterJobs(NEARBY_JOBS, f);
  const [selId, setSelId] = React.useState(null);
  const sel = jobs.find((j) => j.title === selId) || jobs[0] || null;
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Solicitações próximas</span>
        <span className="grow" />
        <FilterButton ctl={ctl} />
      </div>
      <div className="scroll" style={{ position: "relative" }}>
        <div className="fullmap">
          <svg className="streets" viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice">
            <g stroke="currentColor" strokeWidth="15" opacity="0.06" fill="none" strokeLinecap="round">
              <path d="M-20 130H410M-20 320H410M-20 500H410" />
              <path d="M70 -20V640M210 -20V640M330 -20V640" />
            </g>
            <g stroke="currentColor" strokeWidth="5" opacity="0.05" fill="none">
              <path d="M-20 225H410M-20 410H410M140 -20V640M270 -20V640" />
            </g>
          </svg>
          <div className="map-me" style={{ left: "49%", top: "57%" }} />
          {jobs.map((j) => (
            <div key={j.title} onClick={() => setSelId(j.title)}
              className={"map-tag" + (j.urgent ? " urgent" : "") + (sel && sel.title === j.title ? " sel" : "")}
              style={{ left: j.mx, top: j.my }}>
              <span className="mt-ic"><Icon name={j.icon} size={14} /></span>R$ {j.avg}
            </div>
          ))}
        </div>
        {sel ? (
          <div className="sheet">
            <div className="handle" />
            <div className="row">
              <div className="cat-ic"><Icon name={sel.icon} size={24} /></div>
              <div className="grow">
                <div className="row" style={{ gap: 7 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{sel.title}</span>
                  {sel.urgent && <span className="badge b-urgent dot" style={{ padding: "3px 8px", fontSize: 11 }}>Urgente</span>}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sel.dist.toFixed(1)} km · {sel.loc} · {sel.mins} min atrás</div>
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>Média da área <span style={{ color: "var(--ink)" }}>R$ {sel.avg}</span></div>
              <span className="grow" />
              <button className="btn grad sm">Enviar proposta</button>
            </div>
          </div>
        ) : (
          <div className="sheet">
            <div className="handle" />
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, textAlign: "center", padding: "6px 0" }}>Nenhuma solicitação nesta área com esses filtros.</div>
          </div>
        )}
        <ViewToggle active="map" cls="above-sheet" />
      </div>
      <FilterSheet ctl={ctl} count={jobs.length} noun={["solicitação", "solicitações"]} />
    </>
  );
}

/* ============================================================ PROVIDER · SEND A BID */
function ProviderBidScreen() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Bateria descarregada</span>
        <span className="grow" />
        <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 800 }}><Icon name="pin" size={12} fill="current" /> 0.8 km</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="battery" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Roadside · Bateria descarregada</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Jardins · Mateus A.</div>
              </div>
              <span className="badge b-urgent dot">Urgente</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 11, lineHeight: 1.4 }}>"Car won't start, dashboard lights are dim. Parked in the building garage."</div>
          </div>

          <div className="section-label">Sua proposta</div>
          <BudgetMeter label="Your price" mode="bid" work="Bateria descarregada" value={110} min={60} max={260} bandLo={90} bandHi={160}
            regionAvg={120} pill="Area average" pillIcon="location" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field"><div className="fl">Chega em</div><div className="fv" style={{ marginTop: 4 }}>12 min</div></div>
            <div className="field"><div className="fl">Taxa de serviço</div><div className="fv" style={{ marginTop: 4 }}>Incluída</div></div>
          </div>
          <div className="field" style={{ minHeight: 64 }}>
            <div className="fl">Mensagem ao cliente</div>
            <div className="fv ph" style={{ marginTop: 4 }}>On my way with a jump pack and tools. 6 years' experience.</div>
          </div>

          <div style={{ marginTop: 2 }}>
            <SlideConfirm variant="accept" label="Arraste para enviar proposta" fill={20} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================ PROVIDER · ACTIVE JOB (add parts) */
function ProviderActiveJob({ sheet }) {
  const parts = [
    ["Battery 60Ah", 1, 320, "battery"],
    ["Cable terminal set", 2, 18, "flash"],
  ];
  const labor = 110;
  const partsTotal = parts.reduce((s, [, q, p]) => s + q * p, 0);
  const fee = Math.round((labor + partsTotal) * 0.025);
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Trabalho ativo</span>
        <span className="grow" />
        <span className="badge b-live dot">Trabalhando</span>
      </div>
      <div className="scroll" style={{ position: "relative" }}>
        <div className="content" style={{ gap: 14, paddingBottom: 96 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="battery" size={24} /></div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Roadside · Bateria descarregada</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Mateus A. · Jardins</div>
              </div>
              <div className="av-init" style={{ width: 36, height: 36, borderRadius: 11, fontSize: 13, background: "#3b82f6" }}>MA</div>
            </div>
            <div className="row" style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid var(--line)", gap: 0 }}>
              <div className="stat" style={{ flex: 1 }}><div className="v" style={{ fontSize: 16 }}>14:32</div><div className="k">Início</div></div>
              <div style={{ width: 1, background: "var(--line)", alignSelf: "stretch" }} />
              <div className="stat" style={{ flex: 1, paddingLeft: 14 }}><div className="v" style={{ fontSize: 16 }}>18 min</div><div className="k">Decorrido</div></div>
              <div style={{ width: 1, background: "var(--line)", alignSelf: "stretch" }} />
              <div className="stat" style={{ flex: 1, paddingLeft: 14 }}><div className="v" style={{ fontSize: 16, color: "var(--ok)" }}>No local</div><div className="k">Status</div></div>
            </div>
          </div>

          <div className="row">
            <div className="section-label">Before &amp; after</div>
            <span className="grow" />
            <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>compartilhado com o cliente</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="ph-img" style={{ height: 116, borderRadius: 14 }}>before</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 12, fontWeight: 700, color: "var(--ok)" }}><Icon name="check" size={14} sw={2.6} /> Antes adicionada</div>
            </div>
            <div>
              <div className="card flat" style={{ height: 116, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, color: "var(--accent)", padding: 0, border: "1.5px dashed var(--line)", boxShadow: "none" }}>
                <Icon name="camera" size={24} /><span style={{ fontSize: 12, fontWeight: 800 }}>Add depois</span>
              </div>
              <div className="muted" style={{ marginTop: 7, fontSize: 12, fontWeight: 700 }}>Tire ao terminar</div>
            </div>
          </div>

          <div className="field" style={{ minHeight: 62 }}>
            <div className="fl">Notas do serviço</div>
            <div className="fv ph" style={{ marginTop: 5 }}>Troquei a bateria 60Ah, limpei os terminais e testei a carga — tudo OK.</div>
          </div>

          <div className="row">
            <div className="section-label">Parts &amp; materials <span className="count">{parts.length}</span></div>
            <span className="grow" />
            <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>cliente aprova</span>
          </div>

          <div className="card" style={{ padding: "4px 16px" }}>
            {parts.map(([name, qty, price, icon], i) => (
              <div key={i} className="part-row">
                <span className="cat-ic" style={{ width: 38, height: 38, borderRadius: 11 }}><Icon name={icon} size={19} /></span>
                <div className="grow">
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{qty} × R$ {price}</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 14 }}>R$ {qty * price}</span>
                <Icon name="close" size={16} className="pr-del" />
              </div>
            ))}
          </div>

          <button className="add-part"><Icon name="plus" size={18} /> Adicionar peça ou material</button>

          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="total-line"><span className="tk">Mão de obra</span><span>R$ {labor}</span></div>
            <div className="total-line"><span className="tk">Peças & materiais</span><span>R$ {partsTotal}</span></div>
            <div className="total-line"><span className="tk" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>comissão <span className="badge" style={{ padding: "2px 7px", fontSize: 11, background: "var(--surface-2)" }}>Pro · 2,5%</span></span><span style={{ color: "var(--ink-2)" }}>− R$ {fee}</span></div>
            <div className="total-line grand"><span className="tk">Seu recebimento</span><span className="price" style={{ fontSize: 19 }}><span className="cur">R$</span>{labor + partsTotal - fee}</span></div>
          </div>
        </div>

        {sheet && (
          <div className="scrim">
            <div className="modal-sheet">
              <div className="grab" />
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>Adicionar peça</div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>O cliente é avisado para aprovar os itens.</div>
              <SecLbl>Peças comuns</SecLbl>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 14px" }}>
                <span className="chip active grad">Battery</span>
                <span className="chip">Fuse</span>
                <span className="chip">Cable</span>
                <span className="chip">Bulb</span>
              </div>
              <div className="field"><div className="fl">Nome da peça</div><div className="fv">Battery 60Ah</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <div className="field">
                  <div className="fl">Quantidade</div>
                  <div className="qty-step" style={{ marginTop: 6 }}>
                    <div className="qb"><Icon name="minus" size={16} sw={2.6} /></div>
                    <span className="qv">1</span>
                    <div className="qb"><Icon name="plus" size={16} sw={2.6} /></div>
                  </div>
                </div>
                <div className="field"><div className="fl">Preço unit.</div><div className="fv" style={{ marginTop: 10 }}><span className="muted" style={{ fontSize: 12 }}>R$ </span>320</div></div>
              </div>
              <button className="btn grad" style={{ marginTop: 16 }}><Icon name="plus" size={18} /> Adicionar ao trabalho · R$ 320</button>
            </div>
          </div>
        )}
      </div>

      {!sheet && (
        <div className="footer">
          <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="chat" size={18} /></button>
          <button className="btn grad" style={{ flex: 1 }}>Pedir aprovação · R$ {labor + partsTotal} <Icon name="arrowR" size={18} /></button>
        </div>
      )}
    </>
  );
}

/* ============================================================ PROVIDER · RATE THE CLIENT */
function ProviderRateClient() {
  const tags = ["Instruções claras", "Acesso fácil", "Educado", "Pagamento em dia", "Boa comunicação"];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Avalie o cliente</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16, alignItems: "stretch" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 26, paddingBottom: 24 }}>
            <div className="av-init" style={{ width: 72, height: 72, borderRadius: 24, fontSize: 26, background: "#3b82f6" }}>MA</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Mateus A.</div>
              <div className="muted" style={{ fontSize: 13 }}>Bateria descarregada · completed in 18 min</div>
            </div>
            <div className="stars" style={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={36} fill={i <= 5 ? "current" : "none"} />)}
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>Ótimo cliente</div>
          </div>

          <div className="section-label">O que se destacou?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t, i) => <span key={t} className={"chip" + (i < 3 ? " active grad" : "")}>{t}</span>)}
          </div>

          <div className="field" style={{ minHeight: 70 }}>
            <div className="fl">Adicionar nota privada</div>
            <div className="fv ph" style={{ marginTop: 5 }}>Easy to find, clear access, paid right away. Would serve again.</div>
          </div>

          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="cat-ic" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="heart" size={20} /></span>
            <div className="grow"><div style={{ fontWeight: 700, fontSize: 14 }}>Adicionar aos clientes preferidos</div><div className="muted" style={{ fontSize: 12.5 }}>Seja avisado primeiro dos trabalhos dele</div></div>
            <span className="toggle on" />
          </div>

          <button className="btn grad" style={{ marginTop: 4 }}>Enviar avaliação</button>
        </div>
      </div>
    </>
  );
}

/* ============================================================ FOUNDATIONS */
function Foundations({ name, tagline, fonts }) {
  return (
    <div className="phone" style={{ height: 980, padding: "30px 26px", gap: 0, justifyContent: "flex-start", display: "flex", flexDirection: "column", borderRadius: 40, overflow: "hidden" }}>
      <div className="row" style={{ marginBottom: 4 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--grad)" }} />
        <div className="grow">
          <div className="type-spec" style={{ fontWeight: 800, fontSize: 22 }}>walvee</div>
          <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{name} · {tagline}</div>
        </div>
      </div>
      <hr className="hr" style={{ margin: "18px 0" }} />

      <div className="section-label" style={{ marginBottom: 12 }}>Color</div>
      <div className="swatch-row">
        <div className="swatch" style={{ background: "var(--accent)" }}>accent</div>
        <div className="swatch" style={{ background: "var(--accent-2)" }}>accent 2</div>
        <div className="swatch" style={{ background: "var(--grad)" }}>gradient</div>
        <div className="swatch" style={{ background: "var(--ok)" }}>online</div>
      </div>
      <div className="swatch-row" style={{ marginTop: 8 }}>
        <div className="swatch" style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line)" }}>bg</div>
        <div className="swatch" style={{ background: "var(--surface)", color: "var(--ink-3)", border: "1px solid var(--line)" }}>surface</div>
        <div className="swatch" style={{ background: "var(--ink)", color: "#fff" }}>ink</div>
        <div className="swatch" style={{ background: "var(--ink-2)", color: "#fff" }}>muted</div>
      </div>

      <div className="section-label" style={{ margin: "22px 0 10px" }}>Type · {fonts}</div>
      <div className="type-spec" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>Help, fast.</div>
      <div style={{ fontSize: 15, marginTop: 8, color: "var(--ink-2)", lineHeight: 1.5 }}>Trusted pros for roadside, home &amp; pets — minutes away.</div>
      <div className="mono" style={{ fontFamily: "var(--mono)", fontSize: 12, marginTop: 8, color: "var(--ink-3)" }}>R$ 120 · 4.9 ★ · 6 min</div>

      <div className="section-label" style={{ margin: "22px 0 12px" }}>Components</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button className="btn grad" style={{ flex: 1 }}>Request help</button>
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="chat" size={18} /></button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="badge b-open dot">5 bids</span>
        <span className="badge b-urgent dot">Urgente</span>
        <span className="badge b-live dot">Live</span>
        <span className="chip active grad">Roadside</span>
        <span className="chip">Home</span>
      </div>

      <div className="section-label" style={{ margin: "22px 0 11px" }}>Slide to confirm</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SlideConfirm variant="accept" compact label="Slide to accept" fill={22} />
        <SlideConfirm variant="success" compact done label="Accepted" />
        <SlideConfirm variant="error" compact label="Slide to decline" fill={14} />
      </div>
    </div>
  );
}

Object.assign(window, { ProviderDashboard, NearbyJob, NearbyScreen, NearbyMapScreen, NearbyCalendarScreen, ProviderBidScreen, ProviderActiveJob, ProviderRateClient, RateScreen, Foundations,
  useFilter, FilterButton, FilterSheet, FChips });
