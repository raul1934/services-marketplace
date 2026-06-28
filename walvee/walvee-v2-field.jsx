/* walvee-v2-field.jsx — Rotas add-on, mobile crew (field) app.
   Reuses Phone, Icon, MiniMap, SlideConfirm, TabBar from the kit/customer files.
   Exposes screens + window.V2_FIELD. */

const ShiftClock = ({ t = "13h:12m:23s" }) => (
  <span className="v2-clock"><Icon name="clock" size={13} /> {t}</span>
);

const V2Bar = ({ title, back = true, right, clock = true }) => (
  <div className="backbar" style={{ paddingTop: 6, alignItems: "flex-start" }}>
    {back && <div className="backbtn"><Icon name="back" size={20} /></div>}
    <div className="bb-stack">
      <span className="bb-title">{title}</span>
      {(right || clock) && (
        <div className="bb-meta">
          {right}
          {clock && <ShiftClock />}
        </div>
      )}
    </div>
    <span className="grow" />
  </div>
);

/* ---- 1 · Start shift → crew leader + select crew ---- */
function V2ShiftStart() {
  const crew = [
    ["Lucas P.", "Técnico", "#3b82f6", true],
    ["Bianca R.", "Técnica", "#12b981", true],
    ["Diego M.", "Auxiliar", "#f59e0b", false],
    ["Paulo S.", "Auxiliar", "#a855f7", false],
  ];
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <div>
          <div className="ab-sub">Começar turno</div>
          <h1 className="ab-title">Olá, Rafael</h1>
        </div>
        <span className="spacer" />
        <span className="v2-badge"><Icon name="route" size={13} /> Rotas</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="v2-leader">
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="users" size={22} /></div>
            <div className="grow">
              <div style={{ fontWeight: 800, fontSize: 15.5 }}>Você é o líder da equipe</div>
              <div style={{ fontSize: 12.5, opacity: .92 }}>Monte a equipe do turno de hoje</div>
            </div>
            <span className="toggle on" style={{ background: "rgba(255,255,255,.35)" }} />
          </div>

          <div className="v2-label" style={{ marginTop: 4 }}>Selecione a equipe <span className="c">2</span></div>
          <div className="v2-search"><Icon name="search" size={16} /> Buscar membro da equipe…</div>
          {crew.map(([name, role, color, sel]) => (
            <div key={name} className={"v2-crew" + (sel ? " sel" : "")}>
              <span className="av" style={{ background: color }}>{name.split(" ").map((s) => s[0]).join("")}</span>
              <div><div className="cn">{name}</div><div className="cr">{role}</div></div>
              <span className="cbox">{sel && <Icon name="check" size={13} sw={3} />}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Continuar para equipamentos <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ---- 1b · Select equipment being taken ---- */
function V2Equipment() {
  const gear = [
    ["Kit de teste de água", "Análise", "gauge", true],
    ["Aspirador de piscina", "Limpeza", "drop", true],
    ["Bomba dosadora portátil", "Dosagem", "settings", true],
    ["Escova e cabo telescópico", "Limpeza", "sparkles", false],
    ["Multímetro", "Elétrica", "battery", false],
    ["Furadeira", "Reparo", "wrench", false],
  ];
  return (
    <>
      <V2Bar title="Equipamentos do turno" clock={false} />
      <div className="scroll">
        <div className="content" style={{ gap: 11 }}>
          <div className="v2-leader" style={{ background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="box" size={22} /></div>
            <div className="grow">
              <div style={{ fontWeight: 800, fontSize: 15 }}>O que você está levando?</div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Confirme os equipamentos no veículo</div>
            </div>
          </div>

          <div className="v2-label" style={{ marginTop: 2 }}>Equipamentos <span className="c">3</span></div>
          <div className="v2-search"><Icon name="search" size={16} /> Buscar equipamento…</div>
          {gear.map(([name, cat, ic, sel]) => (
            <div key={name} className={"v2-equip" + (sel ? " sel" : "")}>
              <span className="ei"><Icon name={ic} size={18} /></span>
              <div className="grow"><div className="en">{name}</div><div className="es">{cat}</div></div>
              <span className="cbox">{sel && <Icon name="check" size={13} sw={3} />}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <div style={{ flex: 1 }}><SlideConfirm variant="success" label="Arraste para iniciar o turno" fill={18} /></div>
      </div>
    </>
  );
}

/* ---- 1c · Active shift info — team & equipment summary (opened from the crew icon) ---- */
function V2ShiftInfo() {
  const crew = [
    ["Rafael C.", "Líder", "#c3641f"],
    ["Lucas P.", "Técnico", "#3b82f6"],
    ["Bianca R.", "Técnica", "#12b981"],
  ];
  const gear = [
    ["Kit de teste de água", "Análise", "gauge"],
    ["Aspirador de piscina", "Limpeza", "drop"],
    ["Bomba dosadora portátil", "Dosagem", "settings"],
  ];
  return (
    <>
      <V2Bar title="Turno ativo" right={<span className="badge b-live dot">Em rota</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 12 }}>
          <div className="v2-label">Equipe <span className="c">{crew.length}</span></div>
          {crew.map(([name, role, color]) => (
            <div key={name} className="v2-crew">
              <span className="av" style={{ background: color }}>{name.split(" ").map((s) => s[0]).join("")}</span>
              <div><div className="cn">{name}</div><div className="cr">{role}</div></div>
            </div>
          ))}

          <div className="v2-label" style={{ marginTop: 4 }}>Equipamentos <span className="c">{gear.length}</span></div>
          {gear.map(([name, cat, ic]) => (
            <div key={name} className="v2-equip">
              <span className="ei"><Icon name={ic} size={18} /></span>
              <div className="grow"><div className="en">{name}</div><div className="es">{cat}</div></div>
              <Icon name="check" size={15} sw={3} style={{ color: "var(--ok)", flex: "none" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- 2 · Today's routes ---- */
const RouteCard = ({ icon, name, meta, done, total, status }) => {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="v2-route">
      <div className="rt-top">
        <span className="rt-ic"><Icon name={icon} size={22} /></span>
        <div className="grow">
          <div className="rt-name">{name}</div>
          <div className="rt-meta">{meta}</div>
        </div>
        <span className={"badge " + (status === "run" ? "b-live" : status === "done" ? "b-done" : "")} style={status === "idle" ? { background: "var(--surface-2)", color: "var(--ink-2)" } : undefined}>
          {status === "run" ? "Em rota" : status === "done" ? "Concluída" : "A iniciar"}
        </span>
      </div>
      <div className="v2-progress"><i style={{ width: pct + "%" }} /></div>
      <div className="row" style={{ marginTop: 9 }}>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>{done}/{total} paradas</span>
        <span className="grow" />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--accent)" }}>{pct}%</span>
      </div>
    </div>
  );
};

function V2Routes() {
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <div>
          <div className="ab-sub">Sexta, 17 jun · Turno ativo</div>
          <h1 className="ab-title">Minhas rotas</h1>
        </div>
        <span className="spacer" />
        <ShiftClock />
        <div className="iconbtn"><Icon name="users" size={20} /></div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 13 }}>
          <div className="v2-search"><Icon name="search" size={16} /> Buscar rota ou bairro…</div>
          <RouteCard icon="snow" name="Rota Norte · Neve" meta="Centro & Jardins · 6 paradas" done={2} total={6} status="run" />
          <RouteCard icon="drop" name="Rota Piscinas" meta="Pinheiros · 7 paradas" done={0} total={7} status="idle" />
          <RouteCard icon="sparkles" name="Rota Limpeza" meta="Vila Mariana · 5 paradas" done={5} total={5} status="done" />
        </div>
      </div>
      <TabBar role="provider" active="home" tabs={[["route", "Rotas"], ["calendar", "Agenda"], ["box", "Estoque"], ["user", "Perfil"]]} />
    </>
  );
}

/* ---- 3 · Route detail — ordered stops ---- */
function V2RouteDetail() {
  const stops = [
    ["done", "Edifício Aurora", "Av. Paulista, 1500", "3", "2", ""],
    ["done", "Residência Lima", "R. Augusta, 920", "2", "1", ""],
    ["now", "Condomínio Vista", "Al. Santos, 45", "4", "", ""],
    ["", "Edifício Sol", "R. Haddock Lobo, 300", "2", "", "cobertura"],
    ["", "Praça Central", "Pç. da Sé, s/n", "1", "", "aberto"],
    ["", "Galpão Oeste", "R. Clélia, 88", "3", "", ""],
  ];
  return (
    <>
      <V2Bar title="Rota Norte · Neve" right={<span className="badge b-live dot">Em rota</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              <MiniMap height={150} />
              <button style={{ position: "absolute", right: 12, bottom: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999, border: "none", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, fontSize: 13, boxShadow: "var(--shadow)" }}><Icon name="navigate" size={15} style={{ color: "var(--accent)" }} /> Ver no mapa</button>
            </div>
            <div className="v2-statbar" style={{ border: "none", borderRadius: 0, borderTop: "1px solid var(--line)" }}>
              <div className="v2-stat"><div className="v">2/6</div><div className="k">Paradas</div></div>
              <div className="v2-stat"><div className="v">12 km</div><div className="k">Restante</div></div>
              <div className="v2-stat"><div className="v">3</div><div className="k">Equipe</div></div>
            </div>
          </div>

          <div className="v2-label">Paradas em ordem</div>
          <div className="card flat" style={{ padding: "2px 0" }}>
            {stops.map(([st, name, addr, svc, when, ct], i) => (
              <div key={i} className={"v2-stoprow" + (st === "now" ? " now" : "")}>
                <span className={"v2-idx " + st}>{st === "done" ? <Icon name="check" size={12} sw={3} /> : i + 1}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="v2-sr-name">{name}</div>
                  <div className="v2-sr-sub">{addr}{ct === "aberto" ? " · contrato encerrado" : ct === "cobertura" ? " · cobertura pontual" : ""}</div>
                </div>
                {ct === "aberto" && <span className="badge b-open" style={{ fontSize: 10.5, padding: "3px 8px" }}>Em aberto</span>}
                {ct === "cobertura" && <span className="badge b-urgent" style={{ fontSize: 10.5, padding: "3px 8px" }}>Cobertura</span>}
                {svc && <span className="v2-svccount" title={svc + " serviços obrigatórios"}><Icon name="clipboard" size={12} /> {svc}</span>}
                {st === "now"
                  ? <span className="v2-times" style={{ color: "var(--accent)", background: "var(--accent-soft)" }}>Em atendimento</span>
                  : st === "done"
                    ? <span className="v2-times">{when}× hoje</span>
                    : null}
                <Icon name="fwd" size={17} style={{ color: "var(--ink-3)", flex: "none" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Iniciar rota <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ---- 4 · Site detail — equipment + history + photos ---- */
function V2SiteDetail() {
  return (
    <>
      <V2Bar title="Condomínio Vista" right={<span className="badge b-open dot">Parada 3</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 15 }}>
            <div className="row">
              <span className="cat-ic"><Icon name="home-outline" size={22} /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Condomínio Vista</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Ativo fixo · Al. Santos, 45 · Sr. Antônio</div>
              </div>
              <div className="iconbtn" style={{ width: 38, height: 38 }}><Icon name="navigate" size={17} /></div>
              <div className="iconbtn" style={{ width: 38, height: 38 }}><Icon name="phone" size={17} /></div>
            </div>
          </div>

          <div className="v2-label">Contrato do ativo</div>
          <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row">
              <span className="av" style={{ width: 38, height: 38, borderRadius: 11, background: "#3b82f6" }}>RC</span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14 }}>Você atende este ativo</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Contrato até 30 set · 2× por mês</div>
              </div>
            </div>
          </div>

          <div className="v2-label">Serviços obrigatórios <span className="c">4</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {[["Aspirar a piscina", "drop", "Toda visita"], ["Dosagem química", "settings", "Toda visita"], ["Limpeza de bordas", "sparkles", "Toda visita"], ["Verificar bomba dosadora", "wrench", "Mensal"]].map(([n, ic, freq], i) => (
              <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="v2-subrow"><span className="si"><Icon name={ic} size={15} /></span></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{n}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{freq}</div></div>
                <span className="v2-svccount">obrigatório</span>
              </div>
            ))}
          </div>

          <div className="v2-label">Equipamentos no local <span className="c">3</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {[["Piscina 25m³", "wrench", "Última: 10 jun"], ["Bomba Jacuzzi", "settings", "Última: 10 jun"], ["Aquecedor solar", "sunny-outline", "Última: 28 mai"]].map(([n, ic, last], i) => (
              <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="v2-subrow"><span className="si"><Icon name={ic} size={15} /></span></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{n}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{last}</div></div>
                <Icon name="fwd" size={16} style={{ color: "var(--ink-3)" }} />
              </div>
            ))}
          </div>

          <div className="v2-label">Histórico de atendimentos <span className="c">8</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {[["Limpeza + dosagem", "10 jun · Lucas P."], ["Troca de filtro", "28 mai · Rafael C."], ["Limpeza + dosagem", "12 mai · Bianca R."]].map(([t, w], i) => (
              <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="si" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ok)" }}><Icon name="check" size={13} sw={3} /></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{w}</div></div>
              </div>
            ))}
          </div>

          <div className="v2-label">Fotos do local <span className="faint" style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>· referência / acesso</span></div>
          <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>portão</div>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>área téc.</div>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>medidor</div>
            <div className="v2-shoot" style={{ width: 92, height: 92, flex: "none", gap: 3, fontSize: 11.5 }}><Icon name="plus" size={20} /> Add</div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Iniciar visita <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ---- 4a · Visit in progress — the active visit hub ---- */
function V2VisitDetail() {
  const svc = [
    ["Aspirar a piscina", "Concluído 09:48", true],
    ["Dosagem química", "Concluído 10:05", true],
    ["Limpeza de bordas", "Pendente", false],
  ];
  return (
    <>
      <V2Bar title="Visita · Condomínio Vista" right={<span className="badge b-live dot">Em atendimento</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="row">
              <span className="cat-ic"><Icon name="navigate" size={20} /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Rota Norte · Neve · Parada 3</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Iniciada às 09:32 · Al. Santos, 45</div>
              </div>
            </div>
          </div>

          <button className="btn ghost" style={{ width: "100%", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><Icon name="home-outline" size={17} /> Ver informações do local</span>
            <Icon name="fwd" size={16} style={{ color: "var(--ink-3)" }} />
          </button>

          <div className="v2-label">Fotos <span className="faint" style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>· antes / depois</span></div>
          <div className="v2-ba">
            <div><div className="lbl done"><Icon name="check" size={12} sw={3} /> Antes</div><div className="ph-img">antes</div></div>
            <div><div className="lbl">Depois</div><div className="v2-shoot"><Icon name="camera" size={24} /> Tirar foto</div></div>
          </div>

          <div className="v2-label">Observação da visita</div>
          <div className="field" style={{ minHeight: 88, position: "relative" }}>
            <div className="fv ph" style={{ paddingRight: 46 }}>Nota para o cliente / próxima visita…</div>
            <button style={{ position: "absolute", right: 10, bottom: 10, width: 38, height: 38, borderRadius: 12, border: "none", background: "var(--grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="mic" size={18} /></button>
          </div>

          <div className="v2-label">Serviços prestados <span className="c">2/3</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {svc.map(([n, st, done], i) => (
              <div key={i} className="row" style={{ padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="si" style={{ width: 26, height: 26, borderRadius: 50, border: done ? "none" : "1.5px solid var(--line)", background: done ? "var(--ok)" : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{done && <Icon name="check" size={13} sw={3} />}</span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5, color: done ? "var(--ink)" : "var(--ink-2)" }}>{n}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{st}</div></div>
                {done ? <Icon name="fwd" size={16} style={{ color: "var(--ink-3)" }} /> : <button className="v2-do"><Icon name="play" size={13} fill="current" /> Registrar</button>}
              </div>
            ))}
          </div>

          <button className="btn ghost" style={{ width: "100%", borderStyle: "dashed", color: "var(--accent)" }}><Icon name="plus" size={17} /> Adicionar serviço extra</button>
        </div>
      </div>
      <div className="footer">
        <div style={{ flex: 1 }}><SlideConfirm variant="end" label="Arraste para concluir a parada" fill={20} /></div>
      </div>
    </>
  );
}

/* ---- 4a-bis · Add extra service — catalog bottom sheet over the visit ---- */
function V2AddService() {
  const cat = [
    ["Troca de filtro", "settings", "Manutenção"],
    ["Reparo de vazamento", "wrench", "Reparo"],
    ["Limpeza de skimmer", "sparkles", "Limpeza"],
    ["Troca de lâmpada da piscina", "battery", "Elétrica"],
    ["Aspiração extra de fundo", "drop", "Limpeza"],
  ];
  return (
    <>
      <V2Bar title="Visita · Condomínio Vista" right={<span className="badge b-live dot">Em atendimento</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 12, opacity: .4, pointerEvents: "none" }}>
          <div className="v2-label">Serviços prestados <span className="c">2/3</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {["Aspirar a piscina", "Dosagem química", "Limpeza de bordas"].map((n, i) => (
              <div key={i} className="row" style={{ padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="si" style={{ width: 26, height: 26, borderRadius: 50, background: "var(--surface-2)", border: "1px solid var(--line)", flex: "none" }} />
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{n}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, background: "rgba(12,18,28,.5)", zIndex: 20 }} />
      <div className="addsheet" style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 21 }}>
        <div className="ash-handle" />
        <div className="row">
          <div className="grow">
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, letterSpacing: "-.02em" }}>Adicionar serviço extra</div>
            <div className="faint" style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>Fora dos obrigatórios · o cliente aprova o valor</div>
          </div>
          <div className="iconbtn" style={{ width: 34, height: 34 }}><Icon name="close" size={16} /></div>
        </div>

        <div className="ash-search"><Icon name="search" size={16} /> Buscar serviço…</div>

        <div className="ash-new"><span className="v2-add" style={{ background: "var(--surface)", border: "1px solid var(--accent)" }}><Icon name="plus" size={17} /></span>Criar serviço novo</div>

        <div className="v2-label" style={{ marginTop: 2 }}>Do catálogo</div>
        <div className="card flat" style={{ padding: "2px 14px", boxShadow: "none" }}>
          {cat.map(([n, ic, c], i) => (
            <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <span className="cat-ic" style={{ width: 38, height: 38, borderRadius: 11, flex: "none" }}><Icon name={ic} size={18} /></span>
              <div className="grow"><div style={{ fontWeight: 700, fontSize: 14 }}>{n}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{c}</div></div>
              <button className="v2-add"><Icon name="plus" size={17} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- 4b · Asset detail — mobile asset (vehicle), contract open ---- */
function V2AssetVehicle() {
  return (
    <>
      <V2Bar title="Caminhão #3" right={<span className="badge b-open dot">Em aberto</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 15 }}>
            <div className="row">
              <span className="cat-ic"><Icon name="car" size={22} /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Caminhão #3</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Ativo móvel · Placa ABC-1D23 · Acme Serviços</div>
              </div>
              <div className="iconbtn" style={{ width: 38, height: 38 }}><Icon name="phone" size={17} /></div>
            </div>
          </div>

          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="location" size={18} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Ativo móvel — local de atendimento definido a cada visita.</div>
          </div>

          <div className="v2-label">Contrato do ativo</div>
          <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row">
              <span className="cat-ic" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}><Icon name="users" size={20} /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14 }}>Sem pro atribuído</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Contrato encerrado em 31 mai</div>
              </div>
              <span className="badge b-open dot">Em aberto</span>
            </div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>O gestor define o pro ou publica como chamado.</div>
          </div>

          <div className="v2-label">Serviços obrigatórios <span className="c">4</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {[["Troca de óleo", "drop", "Trimestral"], ["Revisão de freios", "settings", "Semestral"], ["Rodízio de pneus", "settings", "A cada 10.000 km"], ["Checagem elétrica", "battery", "Semestral"]].map(([n, ic, freq], i) => (
              <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="v2-subrow"><span className="si"><Icon name={ic} size={15} /></span></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{n}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{freq}</div></div>
                <span className="v2-svccount">obrigatório</span>
              </div>
            ))}
          </div>

          <div className="v2-label">Histórico de atendimentos <span className="c">5</span></div>
          <div className="card flat" style={{ padding: "4px 14px" }}>
            {[["Troca de óleo + filtros", "31 mai · Rafael C."], ["Revisão de freios", "12 abr · Lucas P."], ["Troca de óleo", "28 fev · Rafael C."]].map(([t, w], i) => (
              <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="si" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ok)" }}><Icon name="check" size={13} sw={3} /></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{w}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---- 4c · Service detail — customer notes, reference photos, steps to follow ---- */
function V2ServiceDetail() {
  const steps = [
    ["Medir pH e cloro com o kit de teste", true],
    ["Registrar a leitura no app", true],
    ["Adicionar cloro conforme a tabela", false],
    ["Adicionar algicida (300 ml)", false],
    ["Aguardar 15 min e medir novamente", false],
  ];
  return (
    <>
      <V2Bar title="Dosagem química" right={<span className="v2-svccount">obrigatório</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="av-init" style={{ background: "#0ea5a5", width: 34, height: 34 }}>AN</span>
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 13.5 }}>Sr. Antônio · cliente</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Observação do local</div></div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>“A casa de máquinas fica nos fundos, portão lateral. A bomba faz barulho ao ligar — me avisem se piorar.”</div>
          </div>

          <div className="v2-label">Passos a seguir <span className="c">2/5</span></div>
          <div className="card flat" style={{ padding: "2px 14px" }}>
            {steps.map(([txt, done], i) => (
              <div key={i} className="row" style={{ alignItems: "flex-start", padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className={"v2-idx" + (done ? " done" : "")} style={{ flex: "none" }}>{done ? <Icon name="check" size={12} sw={3} /> : i + 1}</span>
                <div className="grow" style={{ fontWeight: 600, fontSize: 13.5, paddingTop: 2, color: done ? "var(--ink-3)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{txt}</div>
              </div>
            ))}
          </div>

          <div className="v2-label">Fotos de referência <span className="faint" style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>· enviadas pelo cliente</span></div>
          <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>casa de máq.</div>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>quadro elétr.</div>
            <div className="ph-img" style={{ width: 104, height: 92, flex: "none" }}>acesso</div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Iniciar execução <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ---- 5 · Stop execution — services checklist (+ equipment & consumables) ---- */
function V2Execution() {
  return (
    <>
      <V2Bar title="Serviços · Vista" right={<span className="v2-mini"><Icon name="clipboard" size={13} /> 3 registros</span>} />
      <div className="scroll">
        <div className="content" style={{ gap: 10 }}>
          <div className="v2-label">Serviços da parada</div>

          <div className="v2-svc done">
            <div className="grow"><div className="nm">Aspirar a piscina</div><div className="mt">Última 09:48</div></div>
            <span className="v2-times">2×</span>
            <button className="v2-add"><Icon name="plus" size={17} /></button>
          </div>

          <div className="v2-svc-card">
            <span className="v2-tag">Executando</span>
            <div className="row"><div className="grow"><div className="nm" style={{ fontWeight: 800, fontSize: 14.5 }}>Dosagem química</div></div><span className="v2-times">1×</span></div>
            <div className="v2-sub" style={{ marginTop: 10 }}>
              <div className="v2-subrow"><span className="si"><Icon name="settings" size={14} /></span> Bomba dosadora <span className="faint" style={{ marginLeft: "auto", fontSize: 11.5 }}>equip.</span></div>
              <div className="v2-subrow"><span className="si"><Icon name="box" size={14} /></span> Cloro granulado
                <span className="v2-qty"><span className="v2-qb"><Icon name="minus" size={14} /></span><span className="v2-qv">2 kg</span><span className="v2-qb"><Icon name="plus" size={14} /></span></span>
              </div>
              <div className="v2-subrow"><span className="si"><Icon name="box" size={14} /></span> Algicida
                <span className="v2-qty"><span className="v2-qb"><Icon name="minus" size={14} /></span><span className="v2-qv">300 ml</span><span className="v2-qb"><Icon name="plus" size={14} /></span></span>
              </div>
            </div>
            <button className="btn grad sm" style={{ width: "100%", marginTop: 12 }}><Icon name="check" size={16} sw={2.6} /> Registrar execução (+1)</button>
          </div>

          <div className="v2-svc">
            <div className="grow"><div className="nm">Limpeza de bordas</div><div className="mt">Ainda não registrado</div></div>
            <button className="v2-do"><Icon name="play" size={13} fill="current" /> Registrar</button>
          </div>

          <div className="v2-label" style={{ marginTop: 4 }}>Observações</div>
          <div className="field" style={{ minHeight: 76, position: "relative" }}>
            <div className="fv ph" style={{ paddingRight: 46 }}>Nota para o cliente / próxima visita…</div>
            <button style={{ position: "absolute", right: 10, bottom: 10, width: 38, height: 38, borderRadius: 12, border: "none", background: "var(--grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="mic" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="footer">
        <div style={{ flex: 1 }}><SlideConfirm variant="end" label="Arraste para concluir a parada" fill={20} /></div>
      </div>
    </>
  );
}

/* ---- 5b · Guided execution — steps stacked, current one expanded ---- */
function V2Guided({ at = 0 }) {
  const active = at === 0 ? 0 : 2;
  const steps = [
    { t: "Medir pH e cloro", done: "pH 7.4 · Cloro 0.6 ppm" },
    { t: "Registrar a leitura no app", done: "Leitura salva" },
    { t: "Adicionar cloro granulado", done: "2,0 kg registrados" },
    { t: "Adicionar algicida (300 ml)", done: "300 ml registrados" },
    { t: "Aguardar 15 min e medir novamente", done: "pH 7.4 · Cloro 2.1 ppm" },
  ];
  const pct = Math.round(active / steps.length * 100);
  return (
    <>
      <V2Bar title="Dosagem química" right={<span className="v2-svccount"><Icon name="clipboard" size={12} /> {active}/{steps.length}</span>} />
      <div style={{ padding: "0 16px" }}><div className="v2-progress" style={{ marginTop: 2 }}><i style={{ width: pct + "%" }} /></div></div>
      <div className="scroll">
        <div className="content" style={{ gap: 9 }}>
          {steps.map((s, i) => {
            const state = i < active ? "done" : i === active ? "now" : "todo";
            return (
              <div key={i} className={"v2-stepcard " + state}>
                <div className="v2-sc-head">
                  <span className={"v2-idx" + (state === "done" ? " done" : state === "now" ? " now" : "")} style={{ flex: "none" }}>{state === "done" ? <Icon name="check" size={12} sw={3} /> : i + 1}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="v2-sc-title" style={{ color: state === "todo" ? "var(--ink-3)" : "var(--ink)" }}>{s.t}</div>
                    {state === "done" && <div className="v2-sc-meta">{s.done}</div>}
                  </div>
                </div>
                {state === "now" && (
                  <div className="v2-sc-body">
                    {active === 0 ? (
                      <div style={{ display: "flex", gap: 12 }}>
                        <div className="v2-read"><div className="rl">pH</div><div className="rv">7.4</div><div className="rtag ok">ideal 7.2–7.6</div></div>
                        <div className="v2-read"><div className="rl">Cloro (ppm)</div><div className="rv">0.6</div><div className="rtag warn">baixo · meta 1–3</div></div>
                      </div>
                    ) : (
                      <>
                        <div className="v2-gconsum">
                          <span className="si"><Icon name="box" size={18} /></span>
                          <div className="grow"><div style={{ fontWeight: 800, fontSize: 14 }}>Cloro granulado</div><div className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Estoque do caminhão · 8 kg</div></div>
                        </div>
                        <div className="v2-gqty">
                          <button className="v2-qb lg"><Icon name="minus" size={20} /></button>
                          <div className="qv">2,0 kg</div>
                          <button className="v2-qb lg"><Icon name="plus" size={20} /></button>
                        </div>
                        <div className="v2-grec">Recomendado pela leitura: 1,8–2,2 kg</div>
                      </>
                    )}
                    <button className="btn grad sm" style={{ width: "100%" }}>Concluir passo <Icon name="arrowR" size={16} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1, opacity: active >= steps.length ? 1 : .5 }}><Icon name="check" size={17} sw={2.6} /> Concluir serviço · {active}/{steps.length}</button>
      </div>
    </>
  );
}

/* ---- 6 · Before / after photos (site level) ---- */
function V2Photos() {
  return (
    <>
      <V2Bar title="Fotos · Vista" />
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="camera" size={19} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Registre antes e depois — vão no relatório do cliente.</div>
          </div>

          <div>
            <div className="v2-label" style={{ marginBottom: 9 }}>Antes</div>
            <div className="v2-ba">
              <div><div className="lbl done"><Icon name="check" size={12} sw={3} /> Adicionada</div><div className="ph-img">antes 1</div></div>
              <div><div className="lbl done"><Icon name="check" size={12} sw={3} /> Adicionada</div><div className="ph-img">antes 2</div></div>
            </div>
          </div>

          <div>
            <div className="v2-label" style={{ marginBottom: 9 }}>Depois</div>
            <div className="v2-ba">
              <div><div className="lbl done"><Icon name="check" size={12} sw={3} /> Adicionada</div><div className="ph-img">depois 1</div></div>
              <div><div className="lbl">Pendente</div><div className="v2-shoot"><Icon name="camera" size={24} /> Tirar foto</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Salvar fotos</button>
      </div>
    </>
  );
}

window.V2_FIELD = {
  title: "Rotas · App do técnico (mobile)",
  subtitle: "Início do turno → rotas → paradas em ordem → site → execução (serviços + consumíveis) → fotos antes/depois.",
  steps: [
    ["Início do turno · equipe", V2ShiftStart],
    ["Equipamentos do turno", V2Equipment],
    ["Minhas rotas", V2Routes],
    ["Turno ativo · equipe & equipamentos", V2ShiftInfo, 940],
    ["Detalhe da rota", V2RouteDetail],
    ["Detalhe do ativo · local", V2SiteDetail, 1480],
    ["Visita em execução", V2VisitDetail, 1180],
    ["Serviço · passos & observações", V2ServiceDetail, 1020],
    ["Execução da parada", V2Execution],
  ],
};
Object.assign(window, { V2ShiftStart, V2Equipment, V2ShiftInfo, V2Routes, V2RouteDetail, V2SiteDetail, V2VisitDetail, V2AddService, V2AssetVehicle, V2ServiceDetail, V2Guided, V2Execution, V2Photos, RouteCard });
