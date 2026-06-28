/* walvee-v3-customer.jsx — NEW customer screens introduced by the v3 flow map.
   Hi-fi, reuses the sunset system (walvee-ui.css) + kit primitives.
   Each screen renders inside <Phone>. Exposes components on window. */

/* ---- small shared bits ---- */
const V3ProvCard = ({ name = "Rafael C.", rating = 4.9, note = "chegou ao local", bg = "#3b82f6", init = "RC" }) => (
  <div className="card" style={{ padding: 14 }}>
    <div className="row">
      <div className="av-init" style={{ background: bg }}>{init}</div>
      <div className="grow">
        <div style={{ fontWeight: 800, fontSize: 15 }}>{name}</div>
        <div className="row" style={{ gap: 6, marginTop: 2 }}><Stars val={rating} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{rating} · {note}</span></div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="iconbtn" style={{ width: 38, height: 38 }}><Icon name="phone" size={17} /></div>
        <div className="iconbtn" style={{ width: 38, height: 38 }}><Icon name="chat" size={17} /></div>
      </div>
    </div>
  </div>
);

const V3Note = ({ icon = "shield", tone = "accent", children }) => {
  const map = { accent: ["var(--accent-soft)", "var(--accent)"], ok: ["var(--ok-soft)", "var(--ok)"], danger: ["var(--danger-soft)", "var(--danger)"], warn: ["color-mix(in oklab,var(--warn) 12%,var(--surface))", "var(--warn)"] };
  const [bg, fg] = map[tone] || map.accent;
  return (
    <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: bg, boxShadow: "none" }}>
      <Icon name={icon} size={19} style={{ color: fg, flex: "none" }} />
      <div style={{ fontSize: 12.5, fontWeight: 600, color: fg, lineHeight: 1.35 }}>{children}</div>
    </div>
  );
};

const V3Bar = ({ title, badge, badgeCls = "b-open" }) => (
  <div className="backbar">
    <div className="backbtn"><Icon name="back" size={20} /></div>
    <span className="bb-title">{title}</span>
    <span className="grow" />
    {badge && <span className={"badge " + badgeCls + " dot"}>{badge}</span>}
  </div>
);

/* reference-price band (mini, reused) */
const V3Band = ({ lo = 90, hi = 160, val = 120, min = 60, max = 300, label = "Seu valor" }) => {
  const pct = (v) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="grow"><div className="sum-k">{label}</div><div className="price" style={{ marginTop: 2 }}><span className="cur">R$</span>{val}</div></div>
        <div style={{ textAlign: "right" }}><div className="sum-k">Faixa da região</div><div style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>R$ {lo}–{hi}</div></div>
      </div>
      <div style={{ position: "relative", height: 8, borderRadius: 6, background: "var(--surface-2)" }}>
        <div style={{ position: "absolute", left: pct(lo) + "%", width: (pct(hi) - pct(lo)) + "%", top: 0, bottom: 0, borderRadius: 6, background: "var(--accent-soft)" }} />
        <div style={{ position: "absolute", left: "calc(" + pct(val) + "% - 7px)", top: -3, width: 14, height: 14, borderRadius: "50%", background: "var(--grad)", border: "2px solid var(--surface)", boxShadow: "var(--shadow-sm)" }} />
      </div>
      <div className="gauge-scale" style={{ marginTop: 8 }}><span>R$ {min}</span><span>R$ {max}</span></div>
    </div>
  );
};

const V3Money = ({ rows, grand }) => (
  <div className="card" style={{ padding: 16 }}>
    {rows.map(([k, v, accent], i) => (
      <div key={i} className="total-line"><span>{k}</span><span className="tk" style={accent ? { color: "var(--accent)" } : undefined}>{v}</span></div>
    ))}
    <div className="total-line grand"><span>{grand[0]}</span><span className="tk">{grand[1]}</span></div>
  </div>
);

/* ============================================================ PEDIDO · DETALHE COM ABAS (info / propostas / histórico) */
function V3PedidoDetalhe({ tab: initial = "info", expired = false }) {
  const [tab, setTab] = React.useState(initial);
  const [choice, setChoice] = React.useState("subir");
  const tabs = [["info", "Informações"], ["props", "Propostas", expired ? "0" : "3"], ["hist", "Histórico"]];
  const proposals = [
    { init: "RC", bg: "#3b82f6", name: "Rafael C.", rating: 4.9, val: "R$ 120", tag: "Melhor nota", eta: "~8 min · 1,2 km" },
    { init: "MS", bg: "#10b981", name: "Marcos S.", rating: 4.7, val: "R$ 110", tag: "Mais barato", eta: "~15 min · 2,4 km" },
    { init: "JL", bg: "#f59e0b", name: "Júlia L.", rating: 4.8, val: "R$ 130", tag: "", eta: "~10 min · 1,8 km" },
  ];
  const ev = expired ? [
    { h: "10:00", t: "Pedido criado", s: "Você nomeou R$ 120", ic: "edit", tone: "" },
    { h: "10:01", t: "Publicado para a rede", s: "6 profissionais avisados", ic: "users", tone: "" },
    { h: "10:15", t: "2 profissionais visualizaram", s: "Sem proposta enviada", ic: "search", tone: "" },
    { h: "12:00", t: "Janela encerrada sem propostas", s: "Seu valor ficou abaixo da faixa", ic: "close", tone: "bad" },
  ] : [
    { h: "10:00", t: "Pedido criado", s: "Você nomeou R$ 120", ic: "edit", tone: "" },
    { h: "10:01", t: "Publicado para a rede", s: "6 profissionais avisados", ic: "users", tone: "" },
    { h: "10:03", t: "Rafael C. enviou perguntas", s: "2 perguntas · pediu 1 foto", ic: "chat", tone: "" },
    { h: "10:08", t: "Você respondeu", s: "Enviou foto e detalhes", ic: "check", tone: "ok" },
    { h: "10:14", t: "3 propostas recebidas", s: "Escolha por nota + valor", ic: "gauge", tone: "ok" },
  ];
  return (
    <>
      <V3Bar title="Pneu furado" badge={expired ? "Janela encerrada" : "Aberto"} badgeCls={expired ? "b-urgent" : "b-open"} />
      <div className="tabbar-sub" style={{ display: "flex", gap: 4, padding: "0 16px 2px", borderBottom: "1px solid var(--line)", flex: "none" }}>
        {tabs.map(([k, label, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className="subtab"
            style={{
              flex: 1, padding: "13px 4px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13.5, fontWeight: 800, position: "relative",
              color: tab === k ? "var(--accent)" : "var(--ink-3)",
              borderBottom: tab === k ? "2.5px solid var(--accent)" : "2.5px solid transparent", marginBottom: -1,
            }}>
            {label}{n && <span style={{ marginLeft: 5, fontSize: 11, background: tab === k ? "var(--accent)" : "var(--ink-3)", color: "#fff", padding: "1px 6px", borderRadius: 9 }}>{n}</span>}
          </button>
        ))}
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>

          {tab === "info" && !expired && (
            <>
              <div className="card" style={{ padding: 18, textAlign: "center" }}>
                <div className="proto-wait" style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="clock" size={28} /></div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Aguardando propostas</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>Janela fecha em</div>
                <div style={{ fontFamily: "var(--mono, monospace)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", marginTop: 4 }}>04:32</div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="sum-row" style={{ paddingTop: 0 }}><span className="sum-ic"><Icon name="car" size={18} /></span><div className="grow"><div className="sum-k">Serviço</div><div className="sum-v">Veicular · Pneu furado</div></div></div>
                <div className="sum-row"><span className="sum-ic"><Icon name="map-pin" size={18} /></span><div className="grow"><div className="sum-k">Local</div><div className="sum-v">Av. Paulista, 1500</div></div></div>
                <div className="sum-row"><span className="sum-ic"><Icon name="clock" size={18} /></span><div className="grow"><div className="sum-k">Quando</div><div className="sum-v">Agora · urgente</div></div></div>
              </div>
              <V3Band />
              <V3Note icon="shield">Só prestadores verificados veem o pedido — e os lances são cegos.</V3Note>
              <button className="btn ghost" style={{ width: "100%", color: "var(--danger)", borderColor: "transparent" }}><Icon name="close" size={16} /> Cancelar solicitação</button>
            </>
          )}

          {tab === "info" && expired && (
            <>
              <div className="card" style={{ padding: 20, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, margin: "0 auto 10px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}><Icon name="search" size={26} /></div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Ninguém aceitou R$ 120</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.4 }}>Seu valor ficou abaixo da faixa da região para este serviço.</div>
              </div>
              <V3Band val={120} lo={90} hi={160} label="Você ofereceu" />
              <div className="section-label">O que fazer</div>
              <Opt icon="flash" title="Subir para R$ 150" sub="Dentro da faixa — sugerido" sel={choice === "subir"} onClick={() => setChoice("subir")} />
              <Opt icon="gauge" title="Abrir etapa de lance" sub="Profissionais dão lance cego pelo serviço" sel={choice === "lance"} onClick={() => setChoice("lance")} />
              <Opt icon="clock" title="Manter e esperar mais" sub="Reabrir a janela por +30 min" sel={choice === "esperar"} onClick={() => setChoice("esperar")} />
            </>
          )}

          {tab === "props" && expired && (
            <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, margin: "0 auto 12px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}><Icon name="users" size={24} /></div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Nenhuma proposta</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Ninguém propôs no valor que você nomeou. Veja as saídas na aba Informações.</div>
            </div>
          )}

          {tab === "props" && !expired && (
            <>
              <V3Note icon="gauge" tone="accent">Escolha por nota + histórico + distância — não só pelo preço.</V3Note>
              {proposals.map((p) => (
                <div key={p.init} className="card" style={{ padding: 13 }}>
                  <div className="row">
                    <div className="av-init" style={{ background: p.bg }}>{p.init}</div>
                    <div className="grow">
                      <div className="row" style={{ gap: 6 }}><div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.name}</div>{p.tag && <span className="badge b-done" style={{ fontSize: 10 }}>{p.tag}</span>}</div>
                      <div className="row" style={{ gap: 5, marginTop: 2 }}><Stars val={p.rating} size={12} /><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{p.rating} · {p.eta}</span></div>
                    </div>
                    <div style={{ textAlign: "right" }}><div className="price" style={{ fontSize: 18 }}>{p.val}</div></div>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "hist" && (
            <div className="card" style={{ padding: 16 }}>
              <div className="mtl">
                {ev.map((e, i) => (
                  <div className="mtl-item" key={i}>
                    <div className="mtl-rail"><div className={"mtl-node" + (e.tone === "ok" ? " ok" : "")}><Icon name={e.ic} size={15} /></div></div>
                    <div className="mtl-body">
                      <span className="mtl-date">{e.h}</span>
                      <div className="mtl-title" style={{ fontSize: 14 }}>{e.t}</div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{e.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      {expired ? (
        <div className="footer" style={{ flexDirection: "column", gap: 10 }}>
          <button className="btn ghost" style={{ width: "100%", color: "var(--danger)" }}><Icon name="close" size={16} /> Cancelar solicitação</button>
          <button className="btn grad" style={{ width: "100%" }}>{choice === "lance" ? "Abrir etapa de lance" : choice === "esperar" ? "Esperar mais 30 min" : "Republicar por R$ 150"} <Icon name="arrowR" size={18} /></button>
        </div>
      ) : (
        <div className="footer">
          <button className="btn grad" style={{ flex: 1 }}>{tab === "props" ? "Escolher profissional" : "Ver propostas"} <Icon name="arrowR" size={18} /></button>
        </div>
      )}
    </>
  );
}

/* ============================================================ 1 · PEDIDO PUBLICADO (aguardando propostas) */
function V3PedidoPublicado() {
  return (
    <>
      <V3Bar title="Pneu furado" badge="Aberto" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 18, textAlign: "center" }}>
            <div className="proto-wait" style={{ width: 64, height: 64, margin: "0 auto 12px", borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="clock" size={30} /></div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Aguardando propostas</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Janela de propostas fecha em</div>
            <div style={{ fontFamily: "var(--mono, monospace)", fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", marginTop: 4 }}>04:32</div>
          </div>

          <div className="steps" style={{ justifyContent: "space-between", padding: "0 6px" }}>
            {[["Publicado", "done"], ["Propostas", "now"], ["Escolha", ""], ["Match", ""]].map(([l, s], i) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className={"node " + s}>{s === "done" ? <Icon name="check" size={13} /> : i + 1}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: s ? "var(--ink)" : "var(--ink-3)" }}>{l}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 2, background: i === 0 ? "var(--accent)" : "var(--line)", margin: "0 -2px", marginBottom: 18 }} />}
              </React.Fragment>
            ))}
          </div>

          <V3Band />
          <V3Note icon="shield">Só prestadores verificados veem o seu pedido — e os lances são cegos (um não vê o do outro).</V3Note>

          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="users" size={20} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Avisamos <b>6 profissionais</b> perto de você</div>
            <span className="badge b-live dot">2 vendo</span>
          </div>

          <button className="btn ghost" style={{ width: "100%", color: "var(--danger)", borderColor: "transparent", marginTop: 2 }}><Icon name="close" size={16} /> Cancelar solicitação</button>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="edit" size={17} /></button>
        <button className="btn grad" style={{ flex: 1 }}>Ver propostas <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ 2 · ACRÉSCIMO ANTES DE INICIAR */
function V3Acrescimo() {
  return (
    <>
      <V3Bar title="Acréscimo solicitado" badge="Ação necessária" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3ProvCard note="chegou — antes de iniciar" />
          <V3Note icon="flash" tone="warn">O profissional reavaliou no local e propôs um acréscimo. Você pode aceitar ou recusar.</V3Note>

          <div>
            <div className="section-label">Motivo</div>
            <div className="card" style={{ padding: 15, marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>Suporte do motor danificado — precisa de reparo extra além da troca do pneu.</div>
              <div style={{ marginTop: 12 }}><PhotoStrip /></div>
            </div>
          </div>

          <V3Money rows={[["Serviço combinado", "R$ 120"], ["Acréscimo proposto", "+ R$ 60", true]]} grand={["Novo total", "R$ 180"]} />
        </div>
      </div>
      <div className="footer" style={{ flexDirection: "column", gap: 10 }}>
        <div style={{ width: "100%" }}><SlideConfirm variant="accept" label="Arraste para aprovar R$ 180" fill={16} /></div>
        <button className="btn ghost" style={{ width: "100%" }}>Recusar — manter o combinado</button>
      </div>
    </>
  );
}

/* ============================================================ 3 · APROVAR PEÇA (durante a execução) */
function V3AprovaPeca() {
  return (
    <>
      <V3Bar title="Aprovar peça" badge="Em serviço" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3ProvCard note="executando agora" />
          <V3Note icon="wrench" tone="warn">Durante o serviço o profissional precisou de uma peça fora do orçamento inicial.</V3Note>

          <div className="section-label">Peça / material</div>
          <div className="card" style={{ padding: 6 }}>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: 11 }}>
              <span className="pr-qty">1×</span>
              <div className="grow"><div style={{ fontWeight: 700, fontSize: 14 }}>Válvula de calibragem</div><div className="muted" style={{ fontSize: 12 }}>Original · garantia de 90 dias</div></div>
              <strong style={{ fontSize: 14.5 }}>R$ 45</strong>
            </div>
          </div>

          <V3Money rows={[["Serviço", "R$ 120"], ["Peça já aprovada", "R$ 90"], ["Esta peça", "+ R$ 45", true]]} grand={["Novo total", "R$ 255"]} />
          <V3Note icon="shield" tone="accent">A peça entra no histórico do seu veículo com nota fiscal e garantia.</V3Note>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}>Recusar</button>
        <button className="btn grad" style={{ flex: 1 }}>Aprovar peça · R$ 255</button>
      </div>
    </>
  );
}

/* ============================================================ 4 · NINGUÉM ACEITA → SUBIR VALOR / LANCE */
function V3SemPropostas() {
  return (
    <>
      <V3Bar title="Sem propostas" badge="Janela encerrada" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 22, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}><Icon name="search" size={28} /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Ninguém aceitou R$ 120</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>Seu valor ficou abaixo da faixa da região para este serviço.</div>
          </div>

          <V3Band val={120} lo={90} hi={160} label="Você ofereceu" />

          <div className="section-label">O que fazer</div>
          <Opt icon="flash" title="Subir para R$ 150" sub="Dentro da faixa — sugerido" sel />
          <Opt icon="gauge" title="Abrir etapa de lance" sub="Profissionais dão lance cego pelo serviço" />
          <Opt icon="clock" title="Manter e esperar mais" sub="Reabrir a janela por +30 min" />

          <button className="btn ghost" style={{ width: "100%", color: "var(--danger)", borderColor: "transparent", marginTop: 2 }}><Icon name="close" size={16} /> Cancelar solicitação</button>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Republicar pedido <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ 5 · CANCELAR / JANELA EXPIRA */
function V3Cancelar() {
  const reasons = ["Resolvi sozinho", "Demorou demais", "Mudei de ideia", "Encontrei outro", "Outro"];
  return (
    <>
      <V3Bar title="Cancelar solicitação" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="car" size={24} /></div>
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 15 }}>Veicular · Pneu furado</div><div className="muted" style={{ fontSize: 12.5 }}>Av. Paulista, 1500</div></div>
            </div>
          </div>

          <div className="section-label">Política de cancelamento</div>
          <div className="card" style={{ padding: 6 }}>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px" }}>
              <Icon name="check" size={18} style={{ color: "var(--ok)", flex: "none" }} />
              <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Sem profissional a caminho</div>
              <strong style={{ fontSize: 13.5, color: "var(--ok)" }}>Grátis</strong>
            </div>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px" }}>
              <Icon name="clock" size={18} style={{ color: "var(--warn)", flex: "none" }} />
              <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Após o match / a caminho</div>
              <strong style={{ fontSize: 13.5, color: "var(--warn)" }}>Taxa R$ 15</strong>
            </div>
          </div>

          <div className="section-label">Motivo (opcional)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {reasons.map((r, i) => <span key={r} className={"chip" + (i === 0 ? " active grad" : "")}>{r}</span>)}
          </div>
          <V3Note icon="clock" tone="warn">Se a janela de escolha expirar sem você decidir, fechamos com o profissional mais bem avaliado.</V3Note>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}>Voltar</button>
        <button className="btn" style={{ flex: 1, background: "var(--danger)", color: "#fff" }}>Cancelar solicitação</button>
      </div>
    </>
  );
}

/* ============================================================ 6 · NO-SHOW */
function V3NoShow() {
  return (
    <>
      <V3Bar title="Profissional atrasado" badge="12 min de atraso" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <MiniMap height={180} />
            <div className="row" style={{ padding: "13px 15px" }}>
              <Icon name="clock" size={19} style={{ color: "var(--danger)" }} />
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 15 }}>ETA estourou</div><div className="muted" style={{ fontSize: 12.5 }}>Previsto 14:20 · agora 14:32</div></div>
              <span className="badge b-urgent dot">Atrasado</span>
            </div>
          </div>

          <V3ProvCard note="sem movimento há 8 min" />
          <V3Note icon="shield" tone="accent">Se não comparecer, você reabre o pedido sem custo e o profissional recebe penalidade.</V3Note>

          <div className="section-label">O que fazer</div>
          <Opt icon="clock" title="Aguardar mais 10 min" sub="Avisar o profissional" sel />
          <Opt icon="refresh" title="Reabrir para outro" sub="Volta para as propostas" />
          <Opt icon="dollar" title="Cancelar com reembolso" sub="Estorno integral" />
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Reabrir solicitação <Icon name="refresh" size={17} /></button>
      </div>
    </>
  );
}

/* ============================================================ 7 · ABRIR DISPUTA (bait-and-switch) */
function V3Disputa() {
  return (
    <>
      <V3Bar title="Abrir disputa" badge="Cobrança contestada" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="shield" tone="danger">O valor cobrado não bate com o combinado no pedido. O escopo está congelado — o pedido vale o que foi acordado.</V3Note>

          <V3Money rows={[["Combinado no pedido", "R$ 120"], ["Cobrado pelo profissional", "R$ 200", true]]} grand={["Diferença em disputa", "R$ 80"]} />

          <div className="section-label">O que aconteceu</div>
          <div className="field" style={{ minHeight: 90 }}>
            <div className="fv" style={{ marginTop: 2 }}>Cobrou R$ 200 alegando “serviço maior”, mas fez exatamente o que estava no pedido.</div>
          </div>
          <div className="section-label">Evidências</div>
          <PhotoStrip />
          <V3Note icon="clock" tone="accent">A walvee retém o pagamento (split) até a mediação concluir.</V3Note>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Abrir disputa <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ 8 · FALHA DE PAGAMENTO */
function V3FalhaPagamento() {
  return (
    <>
      <V3Bar title="Pagamento" badge="Recusado" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 18, textAlign: "center" }}>
            <div style={{ width: 58, height: 58, margin: "0 auto 12px", borderRadius: "50%", background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}><Icon name="close" size={28} sw={2.6} /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Cartão recusado</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Visa •••• 4821 — não autorizado pelo banco</div>
          </div>

          <div className="section-label">Trocar forma de pagamento</div>
          <Opt icon="pix" title="Pix" sub="Aprovação na hora" sel />
          <Opt icon="card" title="Outro cartão" sub="Adicionar cartão de crédito" />
          <Opt icon="cash" title="Dinheiro no local" sub="Pague direto ao profissional" />

          <V3Money rows={[["Serviço", "R$ 120"], ["Taxa walvee", "R$ 6"]]} grand={["Total", "R$ 126"]} />
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Tentar novamente <Icon name="refresh" size={17} /></button>
      </div>
    </>
  );
}

/* ============================================================ 9 · GARANTIA / REEMBOLSO */
function V3Garantia() {
  return (
    <>
      <V3Bar title="Garantia walvee" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="cat-ic"><Icon name="car" size={24} /></div>
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 15 }}>Pneu furado · Rafael C.</div><div className="row" style={{ gap: 6, marginTop: 3 }}><Stars val={2} size={13} /><span className="muted" style={{ fontSize: 12 }}>Você avaliou 2,0</span></div></div>
              <span className="badge b-urgent dot">Problema</span>
            </div>
          </div>

          <div className="section-label">O que a garantia cobre</div>
          <div className="card" style={{ padding: 15 }}>
            <div className="total-line" style={{ paddingTop: 0 }}><span style={{ fontWeight: 700 }}>Refazer o serviço</span><Icon name="check" size={17} style={{ color: "var(--ok)" }} /></div>
            <div className="total-line"><span style={{ fontWeight: 700 }}>Reembolso até</span><span className="tk">R$ 300</span></div>
            <div className="total-line" style={{ borderTop: "1px solid var(--line)" }}><span className="muted" style={{ fontSize: 12.5 }}>Prazo de acionamento</span><span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>até 7 dias após o serviço</span></div>
          </div>

          <div className="section-label">Como resolver</div>
          <Opt icon="refresh" title="Refazer o serviço" sub="Outro profissional, sem custo" sel />
          <Opt icon="dollar" title="Pedir reembolso" sub="Estorno do valor pago" />
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Acionar garantia <Icon name="shield" size={17} /></button>
      </div>
    </>
  );
}

/* ============================================================ A · ESCOLHE / CONFIRMA PROPOSTA (match) */
function V3EscolheProposta() {
  return (
    <>
      <V3Bar title="Confirmar profissional" badge="Escolhido" badgeCls="b-open" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="av-init" style={{ background: "#3b82f6", width: 48, height: 48 }}>RC</div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 16 }}>Rafael C.</div>
                <div className="row" style={{ gap: 6, marginTop: 3 }}><Stars val={4.9} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>4.9 · 213 serviços</span></div>
              </div>
              <div style={{ textAlign: "right" }}><div className="price"><span className="cur">R$</span>120</div><div className="faint" style={{ fontSize: 11, fontWeight: 700 }}>chega em ~8 min</div></div>
            </div>
            <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span className="badge b-done"><Icon name="star" size={12} fill="current" /> Melhor nota</span>
              <span className="badge"><Icon name="history" size={12} /> Já te atendeu</span>
              <span className="badge"><Icon name="pin" size={12} /> 1,2 km</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="sum-row" style={{ paddingTop: 0 }}><span className="sum-ic"><Icon name="car" size={18} /></span><div className="grow"><div className="sum-k">Serviço</div><div className="sum-v">Veicular · Pneu furado</div></div></div>
            <div className="sum-row"><span className="sum-ic"><Icon name="clock" size={18} /></span><div className="grow"><div className="sum-k">Quando</div><div className="sum-v">Agora · urgente</div></div></div>
            <div className="sum-row"><span className="sum-ic"><Icon name="wrench" size={18} /></span><div className="grow"><div className="sum-k">Peças</div><div className="sum-v">Mão de obra · peças à parte se houver</div></div></div>
          </div>
          <V3Note icon="shield">Ao confirmar, o profissional é avisado e inicia o deslocamento até você.</V3Note>
        </div>
      </div>
      <div className="footer">
        <div style={{ flex: 1 }}><SlideConfirm variant="accept" label="Arraste para confirmar · R$ 120" fill={16} /></div>
      </div>
    </>
  );
}

/* ============================================================ B · SERVIÇO EM EXECUÇÃO */
function V3EmServico() {
  const tasks = [["Remoção do pneu furado", true], ["Instalação do estepe", true], ["Torque e calibragem", false], ["Teste final", false]];
  return (
    <>
      <V3Bar title="Serviço em andamento" badge="Ao vivo" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3ProvCard note="executando agora" />

          <div className="steps" style={{ justifyContent: "space-between", padding: "0 6px" }}>
            {[["Aceito", "done"], ["A caminho", "done"], ["Em serviço", "now"], ["Concluído", ""]].map(([l, s], i) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className={"node " + s}>{s === "done" ? <Icon name="check" size={13} /> : i + 1}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: s ? "var(--ink)" : "var(--ink-3)" }}>{l}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 2, background: i < 2 ? "var(--accent)" : "var(--line)", margin: "0 -2px", marginBottom: 18 }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="section-label">O que está sendo feito</div>
          <div className="card" style={{ padding: 6 }}>
            {tasks.map(([t, done], i) => (
              <div key={i} className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px" }}>
                <div className={"node " + (done ? "done" : "")} style={{ width: 24, height: 24 }}>{done ? <Icon name="check" size={12} /> : ""}</div>
                <div className="grow" style={{ fontWeight: 700, fontSize: 13.5, color: done ? "var(--ink)" : "var(--ink-2)" }}>{t}</div>
              </div>
            ))}
          </div>

          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="clock" size={19} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Iniciado às 14:25</div>
            <strong style={{ fontSize: 14 }}>18 min</strong>
          </div>

          <div className="section-label">Valores</div>
          <div className="card" style={{ padding: 16 }}>
            <div className="total-line" style={{ paddingTop: 0 }}><span>Serviço contratado</span><span className="tk">R$ 120</span></div>
            <div className="total-line"><span>Peças aprovadas</span><span className="tk">+ R$ 90</span></div>
            <div className="total-line grand"><span>Total até agora</span><span className="tk">R$ 210</span></div>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 8 }}>1 peça aguardando sua aprovação · + R$ 45</div>
          </div>

          <div className="section-label">Peças do serviço</div>
          <div className="card" style={{ padding: 6 }}>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px" }}>
              <span className="cat-ic" style={{ width: 36, height: 36, borderRadius: 11, background: "var(--ok-soft)", color: "var(--ok)" }}><Icon name="check" size={18} /></span>
              <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>Pastilha de freio dianteira</div><div className="muted" style={{ fontSize: 12 }}>Aprovada · 14:31</div></div>
              <strong style={{ fontSize: 13.5 }}>R$ 90</strong>
            </div>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderTop: "1px solid var(--line)" }}>
              <span className="cat-ic" style={{ width: 36, height: 36, borderRadius: 11, background: "color-mix(in oklab,var(--warn) 14%,var(--surface))", color: "var(--warn)" }}><Icon name="wrench" size={18} /></span>
              <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>Válvula de calibragem</div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--warn)" }}>Aguardando aprovação</div></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <strong style={{ fontSize: 13.5 }}>+ R$ 45</strong>
                <button className="btn grad" style={{ width: "auto", padding: "7px 13px", fontSize: 12.5, borderRadius: 10 }}>Aprovar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}><Icon name="phone" size={17} /> Ligar</button>
        <button className="btn grad" style={{ flex: 1 }}><Icon name="chat" size={17} /> Mensagem</button>
      </div>
    </>
  );
}

/* ============================================================ C · PAGAMENTO (sucesso + recibo) */
function V3PagamentoOk() {
  return (
    <>
      <V3Bar title="Pagamento" badge="Pago" badgeCls="b-done" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--ok-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ok)" }}><Icon name="check" size={30} sw={2.6} /></div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Serviço concluído</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Pneu furado · Rafael C.</div>
          </div>

          <V3Money rows={[["Serviço", "R$ 120"], ["Taxa walvee", "R$ 6"]]} grand={["Total pago", "R$ 126"]} />

          <div className="section-label">Split — cada parte recebe na hora</div>
          <div className="card" style={{ padding: 6 }}>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px" }}>
              <span className="sum-ic"><Icon name="user" size={17} /></span>
              <div className="grow" style={{ fontWeight: 700, fontSize: 13.5 }}>Profissional</div>
              <strong style={{ fontSize: 13.5 }}>R$ 120</strong>
            </div>
            <div className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px" }}>
              <span className="sum-ic"><Icon name="shield" size={17} /></span>
              <div className="grow" style={{ fontWeight: 700, fontSize: 13.5 }}>walvee (comissão)</div>
              <strong style={{ fontSize: 13.5 }}>R$ 6</strong>
            </div>
          </div>

          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="cat-ic" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="pix" size={20} /></span>
            <div className="grow"><div style={{ fontWeight: 700, fontSize: 14 }}>Pago via Pix</div><div className="muted" style={{ fontSize: 12.5 }}>Recibo enviado por e-mail</div></div>
            <Icon name="check" size={18} style={{ color: "var(--ok)" }} />
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Avaliar profissional <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ D · PERGUNTAS PEDIDAS (aviso pré-resposta) */
function V3PerguntasPendentes() {
  const pros = [
    { init: "RC", bg: "#3b82f6", name: "Rafael C.", rating: 4.9, ask: "2 perguntas · pediu 1 foto" },
    { init: "JS", bg: "#10b981", name: "Auto Já · João", rating: 4.7, ask: "1 pergunta" },
  ];
  return (
    <>
      <V3Bar title="Informações pedidas" badge="2 pendentes" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="chat">Antes de propor, alguns profissionais querem entender melhor o serviço. Responder aumenta a chance de boas propostas.</V3Note>
          <div className="section-label">Quem perguntou</div>
          {pros.map((p) => (
            <div key={p.init} className="card" style={{ padding: 14 }}>
              <div className="row">
                <div className="av-init" style={{ background: p.bg }}>{p.init}</div>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.name}</div>
                  <div className="row" style={{ gap: 6, marginTop: 2 }}><Stars val={p.rating} size={12} /><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{p.ask}</span></div>
                </div>
                <span className="badge b-open dot">Responder</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Responder agora <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ E · DETALHE DA PROPOSTA (perfil) */
function V3PropostaDetalhe() {
  const incl = [["Mão de obra", true], ["Deslocamento", true], ["Peças / materiais", false]];
  const reviews = [["Carla M.", 5, "Rápido e resolveu de primeira."], ["Pedro A.", 5, "Educado e preço justo."]];
  return (
    <>
      <V3Bar title="Proposta" badge="R$ 120" badgeCls="b-open" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <div className="av-init" style={{ background: "#3b82f6", width: 50, height: 50 }}>RC</div>
              <div className="grow">
                <div className="row" style={{ gap: 6 }}><div style={{ fontWeight: 800, fontSize: 16 }}>Rafael C.</div><Icon name="shieldCheck" size={16} style={{ color: "var(--ok)" }} /></div>
                <div className="row" style={{ gap: 6, marginTop: 3 }}><Stars val={4.9} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>4.9 · 213 serviços</span></div>
              </div>
              <div style={{ textAlign: "right" }}><div className="price"><span className="cur">R$</span>120</div><div className="faint" style={{ fontSize: 11, fontWeight: 700 }}>~8 min · 1,2 km</div></div>
            </div>
          </div>

          <div className="section-label">Incluso no valor</div>
          <div className="card" style={{ padding: 6 }}>
            {incl.map(([t, yes], i) => (
              <div key={i} className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px" }}>
                <Icon name={yes ? "check" : "close"} size={17} style={{ color: yes ? "var(--ok)" : "var(--ink-3)", flex: "none" }} />
                <div className="grow" style={{ fontWeight: 700, fontSize: 13.5, color: yes ? "var(--ink)" : "var(--ink-2)" }}>{t}</div>
                {!yes && <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>cobrado à parte</span>}
              </div>
            ))}
          </div>

          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="history" size={19} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Nesta categoria</div>
            <strong style={{ fontSize: 13.5 }}>18 trocas de pneu · 4.9</strong>
          </div>

          <div className="section-label">Avaliações recentes</div>
          {reviews.map(([who, st, txt], i) => (
            <div key={i} className="card" style={{ padding: 13 }}>
              <div className="row" style={{ gap: 8 }}><strong style={{ fontSize: 13.5 }}>{who}</strong><Stars val={st} size={12} /></div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{txt}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="chat" size={17} /></button>
        <button className="btn grad" style={{ flex: 1 }}>Escolher este profissional</button>
      </div>
    </>
  );
}

/* ============================================================ F · DETALHE DE UM SERVIÇO (registro do histórico) */
function V3ServicoDetalhe() {
  const parts = [["Pneu 195/65 R15", "1×", "R$ 0", "incluído"], ["Pastilha de freio dianteira", "1×", "R$ 90", ""], ["Válvula de calibragem", "1×", "R$ 45", ""]];
  return (
    <>
      <V3Bar title="Detalhe do serviço" badge="Concluído" badgeCls="b-done" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row">
              <span className="cat-ic"><Icon name="car" size={24} /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 16 }}>Troca de pneu + 2 peças</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>19 jun 2026 · 14:25 · 58.400 km</div>
              </div>
            </div>
            <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span className="badge b-done"><Icon name="shieldCheck" size={12} /> Garantia 90 dias</span>
              <span className="badge"><Icon name="map-pin" size={12} /> Av. Paulista, 1500</span>
            </div>
          </div>

          <div className="section-label">Profissional</div>
          <div className="card" style={{ padding: 14 }}>
            <div className="row">
              <div className="av-init" style={{ background: "#3b82f6" }}>RC</div>
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 15 }}>Rafael C.</div><div className="row" style={{ gap: 6, marginTop: 2 }}><Stars val={4.9} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Você avaliou 5,0</span></div></div>
              <button className="btn ghost" style={{ width: "auto", padding: "9px 13px", fontSize: 12.5, borderRadius: 10 }}>Contratar de novo</button>
            </div>
          </div>

          <div className="section-label">Peças & materiais</div>
          <div className="card" style={{ padding: 6 }}>
            {parts.map(([t, q, v, tag], i) => (
              <div key={i} className="part-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="pr-qty">{q}</span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div>{tag && <div className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>{tag}</div>}</div>
                <strong style={{ fontSize: 13.5 }}>{v}</strong>
              </div>
            ))}
          </div>

          <div className="section-label">Valores</div>
          <V3Money rows={[["Mão de obra", "R$ 120"], ["Peças", "R$ 135"], ["Taxa walvee", "R$ 6"]]} grand={["Total pago", "R$ 261"]} />

          <div className="section-label">Comprovantes</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost" style={{ flex: 1 }}><Icon name="file-text" size={17} /> Nota fiscal</button>
            <button className="btn ghost" style={{ flex: 1 }}><Icon name="image" size={17} /> Fotos (3)</button>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}><Icon name="shield" size={17} /> Garantia</button>
        <button className="btn grad" style={{ flex: 1 }}>Repetir serviço</button>
      </div>
    </>
  );
}

/* ============================================================ HISTÓRICO DO PEDIDO (linha do tempo) */
function V3PedidoHistorico() {
  const ev = [
    { h: "10:00", t: "Pedido criado", s: "Pneu furado · você nomeou R$ 120", ic: "edit", tone: "" },
    { h: "10:01", t: "Publicado para a rede", s: "6 profissionais avisados perto de você", ic: "users", tone: "" },
    { h: "10:03", t: "Rafael C. enviou perguntas", s: "2 perguntas · pediu 1 foto", ic: "chat", tone: "" },
    { h: "10:08", t: "Você respondeu", s: "Enviou a foto e os detalhes", ic: "check", tone: "ok" },
    { h: "10:15", t: "2 profissionais visualizaram", s: "Sem proposta enviada ainda", ic: "search", tone: "" },
    { h: "12:00", t: "Janela encerrada sem propostas", s: "Seu valor ficou abaixo da faixa", ic: "close", tone: "bad" },
  ];
  return (
    <>
      <V3Bar title="Histórico do pedido" badge="Pneu furado" badgeCls="b-open" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="mtl">
              {ev.map((e, i) => (
                <div className="mtl-item" key={i}>
                  <div className="mtl-rail"><div className={"mtl-node" + (e.tone === "ok" ? " ok" : e.tone === "bad" ? " bad" : "")}><Icon name={e.ic} size={15} /></div></div>
                  <div className="mtl-body">
                    <div className="row" style={{ alignItems: "baseline" }}>
                      <span className="mtl-date">{e.h}</span>
                    </div>
                    <div className="mtl-title" style={{ fontSize: 14.5 }}>{e.t}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{e.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <V3Note icon="clock" tone="accent">Tudo que acontece no pedido fica registrado aqui — propostas, perguntas, mudanças de valor e cancelamentos.</V3Note>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>O que fazer agora <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ MEUS PEDIDOS (listagem) */
function V3MeusPedidos() {
  const ativos = [
    { ic: "car", grad: true, title: "Pneu furado", sub: "Av. Paulista, 1500", status: "Aguardando propostas", badge: "Aberto", cls: "b-live", val: "R$ 120" },
    { ic: "drop", grad: false, title: "Vazamento na pia", sub: "Casa · Jardins", status: "Profissional a caminho", badge: "Ativo", cls: "b-open", val: "R$ 160" },
  ];
  const passados = [
    { ic: "car", grad: true, title: "Troca de pneu + 2 peças", sub: "Rafael C. · 19 jun", status: "Concluído", val: "R$ 261" },
    { ic: "snow", grad: false, title: "Limpeza do ar-condicionado", sub: "Refrigera SP · 18 jan", status: "Concluído", val: "R$ 160" },
  ];
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <div><div className="ab-sub">Seus chamados</div><h1 className="ab-title">Meus pedidos</h1></div>
        <span className="spacer" />
        <div className="iconbtn"><Icon name="search" size={20} /></div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 13 }}>
          <div className="section-label">Em andamento · 2</div>
          {ativos.map((p) => (
            <div key={p.title} className="card" style={{ padding: 14 }}>
              <div className="row">
                <span className={"cat-ic" + (p.grad ? " grad" : "")}><Icon name={p.ic} size={24} /></span>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.title}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{p.sub}</div>
                </div>
                <span className={"badge dot " + p.cls}>{p.badge}</span>
              </div>
              <div className="asset-foot" style={{ marginTop: 11, paddingTop: 11 }}>
                <Icon name="clock" size={15} style={{ color: "var(--accent)" }} />
                <span className="grow" style={{ fontWeight: 700, color: "var(--ink-2)" }}>{p.status}</span>
                <strong style={{ fontSize: 14 }}>{p.val}</strong>
                <Icon name="fwd" size={16} style={{ color: "var(--ink-3)" }} />
              </div>
            </div>
          ))}

          <div className="section-label" style={{ marginTop: 4 }}>Anteriores</div>
          {passados.map((p) => (
            <div key={p.title} className="card" style={{ padding: 14 }}>
              <div className="row">
                <span className={"cat-ic" + (p.grad ? " grad" : "")}><Icon name={p.ic} size={24} /></span>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.title}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{p.sub}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.val}</div>
                  <span className="badge b-done" style={{ fontSize: 10, marginTop: 4 }}><Icon name="check" size={11} /> {p.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar role="customer" active="list" />
    </>
  );
}

/* ============================================================ DESFECHOS DOS CAMINHOS RUINS */

/* opção A · subiu o valor → republicado */
function V3Republicado() {
  return (
    <>
      <V3Bar title="Pedido republicado" badge="Aguardando" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 18, textAlign: "center" }}>
            <div className="proto-wait" style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="refresh" size={28} /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Republicado por R$ 150</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Agora dentro da faixa da região</div>
          </div>
          <V3Money rows={[["Valor anterior", "R$ 120"], ["Novo valor", "R$ 150", true]]} grand={["Publicado por", "R$ 150"]} />
          <V3Note icon="users" tone="accent">Reavisamos os profissionais com o novo valor. Boas propostas costumam chegar em minutos.</V3Note>
          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="clock" size={19} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Nova janela de propostas</div>
            <strong style={{ fontSize: 15, fontFamily: "var(--mono, monospace)" }}>05:00</strong>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px", color: "var(--danger)" }}><Icon name="close" size={16} /></button>
        <button className="btn grad" style={{ flex: 1 }}>Acompanhar propostas <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* opção C · manter e esperar → janela reaberta */
function V3JanelaReaberta() {
  return (
    <>
      <V3Bar title="Janela reaberta" badge="Aguardando" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 18, textAlign: "center" }}>
            <div className="proto-wait" style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="clock" size={28} /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Esperando mais 30 min</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Mantivemos seu valor de R$ 120</div>
            <div style={{ fontFamily: "var(--mono, monospace)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", marginTop: 8 }}>29:48</div>
          </div>
          <V3Note icon="flash" tone="warn">No valor atual a procura é menor. Se ninguém aceitar, sugerimos subir para a faixa ou abrir lance.</V3Note>
          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="users" size={20} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Profissionais avisados de novo</div>
            <span className="badge b-live dot">1 vendo</span>
          </div>
          <button className="btn ghost" style={{ width: "100%", color: "var(--danger)", borderColor: "transparent" }}><Icon name="close" size={16} /> Cancelar solicitação</button>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}>Subir valor</button>
        <button className="btn grad" style={{ flex: 1 }}>Abrir lance</button>
      </div>
    </>
  );
}

/* lance aberto (após ninguém aceitar) */
function V3LanceAberto() {
  const bids = [
    { init: "RC", bg: "#3b82f6", name: "Rafael C.", rating: 4.9, val: "R$ 145", tag: "Melhor avaliado" },
    { init: "MS", bg: "#10b981", name: "Marcos S.", rating: 4.7, val: "R$ 138", tag: "Mais barato" },
    { init: "JL", bg: "#f59e0b", name: "Júlia L.", rating: 4.8, val: "R$ 150", tag: "" },
  ];
  return (
    <>
      <V3Bar title="Lance aberto" badge="Recebendo" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="gauge">Você abriu para lance. Profissionais disputam pelo serviço — você escolhe por nota + valor, não só preço.</V3Note>
          <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="clock" size={19} style={{ color: "var(--accent)" }} />
            <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Encerra em</div>
            <strong style={{ fontSize: 15, fontFamily: "var(--mono, monospace)" }}>02:14</strong>
          </div>
          <div className="section-label">Lances recebidos · 3</div>
          {bids.map((b) => (
            <div key={b.init} className="card" style={{ padding: 13 }}>
              <div className="row">
                <div className="av-init" style={{ background: b.bg }}>{b.init}</div>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}><div style={{ fontWeight: 800, fontSize: 14.5 }}>{b.name}</div>{b.tag && <span className="badge b-done" style={{ fontSize: 10 }}>{b.tag}</span>}</div>
                  <div className="row" style={{ gap: 5, marginTop: 2 }}><Stars val={b.rating} size={12} /><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{b.rating}</span></div>
                </div>
                <div style={{ textAlign: "right" }}><div className="price" style={{ fontSize: 18 }}>{b.val}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Escolher profissional</button>
      </div>
    </>
  );
}

/* cancelamento confirmado */
function V3CanceladoOk() {
  return (
    <>
      <V3Bar title="Solicitação cancelada" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 22, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}><Icon name="close" size={28} /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Pedido cancelado</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Veicular · Pneu furado</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="total-line" style={{ paddingTop: 0 }}><span>Taxa de cancelamento</span><span className="tk" style={{ color: "var(--ok)" }}>Grátis</span></div>
            <div className="total-line grand"><span>Cobrado</span><span className="tk">R$ 0</span></div>
          </div>
          <V3Note icon="refresh" tone="accent">Mudou de ideia? Você pode publicar o pedido de novo a qualquer momento.</V3Note>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}>Voltar ao início</button>
        <button className="btn grad" style={{ flex: 1 }}>Publicar de novo</button>
      </div>
    </>
  );
}

/* reaberto após no-show (+ reembolso/penalidade) */
function V3Reaberto() {
  return (
    <>
      <V3Bar title="Pedido reaberto" badge="Buscando" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="shield" tone="ok">Sem custo para você. O profissional anterior recebeu penalidade por não comparecer.</V3Note>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div className="proto-wait" style={{ width: 56, height: 56, margin: "0 auto 10px", borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="search" size={26} /></div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Procurando outro profissional</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>Priorizamos quem está mais perto e disponível agora</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="total-line" style={{ paddingTop: 0 }}><span>Valor pago antes</span><span className="tk">R$ 120</span></div>
            <div className="total-line"><span>Reembolso</span><span className="tk" style={{ color: "var(--ok)" }}>R$ 120</span></div>
            <div className="total-line grand"><span>Saldo</span><span className="tk">R$ 0 retido</span></div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}>Cancelar</button>
        <button className="btn grad" style={{ flex: 1 }}>Ver novas propostas</button>
      </div>
    </>
  );
}

/* disputa em mediação (status) */
function V3DisputaStatus() {
  const steps = [["Disputa aberta", "Hoje, 15:02", "done"], ["Em análise pela walvee", "Pagamento retido", "now"], ["Resolução", "Em até 48h", ""]];
  return (
    <>
      <V3Bar title="Disputa em análise" badge="Pagamento retido" badgeCls="b-urgent" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="shield" tone="accent">A walvee retém o split até concluir a mediação. Você não é cobrado enquanto isso.</V3Note>
          <div className="section-label">Andamento</div>
          <div className="card" style={{ padding: 16 }}>
            <div className="mtl">
              {steps.map(([t, d, st], i) => (
                <div className="mtl-item" key={i}>
                  <div className="mtl-rail"><div className={"mtl-node" + (st === "done" ? " ok" : "")}>{st === "done" ? <Icon name="check" size={15} /> : <Icon name="clock" size={15} />}</div></div>
                  <div className="mtl-body">
                    <div className="mtl-title" style={{ fontSize: 14 }}>{t}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <V3Money rows={[["Combinado", "R$ 120"], ["Em disputa", "R$ 80"]]} grand={["Retido", "R$ 200"]} />
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ flex: 1 }}><Icon name="chat" size={17} /> Falar com a walvee</button>
      </div>
    </>
  );
}

/* garantia em acompanhamento (status) */
function V3GarantiaStatus() {
  const steps = [["Garantia acionada", "Hoje", "done"], ["Profissional designado", "Sem custo", "done"], ["Reparo agendado", "Amanhã, 10h", "now"]];
  return (
    <>
      <V3Bar title="Garantia acionada" badge="Em andamento" badgeCls="b-live" />
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <V3Note icon="shieldCheck" tone="ok">Sua garantia foi aceita. Um novo profissional vai refazer o serviço sem custo.</V3Note>
          <div className="section-label">Andamento</div>
          <div className="card" style={{ padding: 16 }}>
            <div className="mtl">
              {steps.map(([t, d, st], i) => (
                <div className="mtl-item" key={i}>
                  <div className="mtl-rail"><div className={"mtl-node" + (st === "done" ? " ok" : "")}>{st === "done" ? <Icon name="check" size={15} /> : <Icon name="clock" size={15} />}</div></div>
                  <div className="mtl-body">
                    <div className="mtl-title" style={{ fontSize: 14 }}>{t}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="row">
              <div className="av-init" style={{ background: "#10b981" }}>BL</div>
              <div className="grow"><div style={{ fontWeight: 800, fontSize: 15 }}>Beatriz L.</div><div className="row" style={{ gap: 6, marginTop: 2 }}><Stars val={4.9} size={13} /><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>4.9 · refará o serviço</span></div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Acompanhar reparo</button>
      </div>
    </>
  );
}

Object.assign(window, {
  V3LanceAberto, V3CanceladoOk, V3Reaberto, V3DisputaStatus, V3GarantiaStatus,
  V3Republicado, V3JanelaReaberta, V3MeusPedidos, V3PedidoHistorico, V3PedidoDetalhe,
});

Object.assign(window, {
  V3PedidoPublicado, V3Acrescimo, V3AprovaPeca, V3SemPropostas, V3Cancelar,
  V3NoShow, V3Disputa, V3FalhaPagamento, V3Garantia,
  V3EscolheProposta, V3EmServico, V3PagamentoOk, V3PerguntasPendentes, V3PropostaDetalhe, V3ServicoDetalhe,
  V3ProvCard, V3Note, V3Bar, V3Band, V3Money,
});
