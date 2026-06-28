/* walvee-v2-report.jsx — Rotas add-on, customer site report (mobile).
   What was done at the site after a visit: services, consumables, before/after
   photos, next scheduled visit. Exposes window.V2ReportScreen. */

function V2ReportScreen() {
  return (
    <>
      <div className="v2-report-hero">
        <div className="blob" style={{ width: 180, height: 180, top: -70, right: -50 }} />
        <div className="blob" style={{ width: 110, height: 110, bottom: -40, left: -20 }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 15, letterSpacing: "-.02em" }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="route" size={15} /></span>
            walvee
          </div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em", marginTop: 16 }}>Relatório de serviço</div>
          <div style={{ fontSize: 13.5, opacity: .94, marginTop: 4 }}>Condomínio Vista · Al. Santos, 45</div>
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <div><div style={{ fontWeight: 800, fontSize: 15 }}>17 jun · 09:48</div><div style={{ fontSize: 11.5, opacity: .85, fontWeight: 700 }}>CONCLUÍDO</div></div>
            <div><div style={{ fontWeight: 800, fontSize: 15 }}>Rafael C. +2</div><div style={{ fontSize: 11.5, opacity: .85, fontWeight: 700 }}>EQUIPE</div></div>
          </div>
        </div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div>
            <div className="v2-label" style={{ marginBottom: 9 }}>Serviços realizados</div>
            <div className="card flat" style={{ padding: "4px 14px" }}>
              {[["Aspiração da piscina", true], ["Dosagem química", true], ["Limpeza de bordas", true]].map(([t], i) => (
                <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none", gap: 10 }}>
                  <span className="si" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--ok-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ok)", flex: "none" }}><Icon name="check" size={13} sw={3} /></span>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="v2-label" style={{ marginBottom: 9 }}>Consumíveis utilizados</div>
            <div className="card flat" style={{ padding: "4px 14px" }}>
              {[["Cloro granulado", "2 kg"], ["Algicida", "300 ml"]].map(([n, q], i) => (
                <div key={i} className="row" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none", gap: 10 }}>
                  <span className="si" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", flex: "none" }}><Icon name="box" size={13} /></span>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }} className="grow">{n}</span>
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--accent)" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="v2-label" style={{ marginBottom: 9 }}>Antes &amp; depois</div>
            <div className="v2-ba">
              <div><div className="lbl">Antes</div><div className="ph-img">antes</div></div>
              <div><div className="lbl">Depois</div><div className="ph-img">depois</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: 15, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="cat-ic"><Icon name="calendar" size={20} /></span>
            <div className="grow"><div style={{ fontWeight: 800, fontSize: 14.5 }}>Próxima visita</div><div className="muted" style={{ fontSize: 12.5 }}>Segunda, 24 jun · manhã</div></div>
            <span className="badge b-open">Agendada</span>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <button className="btn ghost" style={{ flex: 1 }}><Icon name="star" size={17} /> Avaliar</button>
            <button className="btn grad" style={{ flex: 1 }}><Icon name="chat" size={17} /> Falar com a equipe</button>
          </div>
        </div>
      </div>
    </>
  );
}
Object.assign(window, { V2ReportScreen });
