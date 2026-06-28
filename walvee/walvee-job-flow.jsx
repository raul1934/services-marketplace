/* walvee-job-flow.jsx — start-of-service flow:
   approved → start travel (slider) → arrived (slider) → unlock with the
   client's QR code / 4-digit password. Plus the customer screen that shows
   the code. Exposes the screens + QRCode. Reuses kit + MiniMap + SlideConfirm. */

/* Deterministic QR-like code (squares only — functional placeholder). */
function QRCode({ size = 188, code = "4821", dark = "#15233b" }) {
  const n = 25, cell = size / n;
  let seed = 7; for (const ch of String(code)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const inBox = (r, c, br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
  const isFinder = (r, c) => inBox(r, c, 0, 0) || inBox(r, c, 0, n - 7) || inBox(r, c, n - 7, 0);
  const rects = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (isFinder(r, c)) continue;
    if (rand() > 0.52) rects.push(<rect key={r + "-" + c} x={c * cell} y={r * cell} width={cell} height={cell} rx={cell * 0.18} />);
  }
  const finder = (br, bc) => (
    <g key={"f" + br + bc}>
      <rect x={bc * cell} y={br * cell} width={7 * cell} height={7 * cell} rx={cell} />
      <rect x={(bc + 1) * cell} y={(br + 1) * cell} width={5 * cell} height={5 * cell} rx={cell * .8} fill="#fff" />
      <rect x={(bc + 2) * cell} y={(br + 2) * cell} width={3 * cell} height={3 * cell} rx={cell * .6} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} fill={dark} aria-label="QR code">
      {rects}
      {finder(0, 0)}{finder(0, n - 7)}{finder(n - 7, 0)}
    </svg>
  );
}

const JobHead = ({ badge, badgeClass = "b-live" }) => (
  <div className="card" style={{ padding: 16 }}>
    <div className="row">
      <div className="cat-ic"><Icon name="battery" size={24} /></div>
      <div className="grow">
        <div style={{ fontWeight: 800, fontSize: 15.5 }}>Veicular · Bateria descarregada</div>
        <div className="muted" style={{ fontSize: 12.5 }}>Mateus A. · Jardins · 0,8 km</div>
      </div>
      <div className="av-init" style={{ width: 36, height: 36, borderRadius: 11, fontSize: 13, background: "#3b82f6" }}>MA</div>
    </div>
    {badge && <div className="row" style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid var(--line)" }}>
      <span className={"badge " + badgeClass + " dot"}>{badge}</span>
      <span className="grow" />
      <span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>R$ 110 · chegada ~10 min</span>
    </div>}
  </div>
);

/* ---- 1 · Approved → start travel ---- */
function ProviderJobApproved() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Proposta aceita</span>
        <span className="grow" />
        <span className="badge b-done dot">Aprovado</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, background: "var(--ok-soft)", color: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={34} sw={2.6} /></div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>O cliente aceitou sua proposta</div>
            <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>Inicie o deslocamento para o local do atendimento.</div>
          </div>
          <JobHead />
          <div className="card" style={{ padding: 0, overflow: "hidden" }}><MiniMap height={170} /></div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="chat" size={18} /></button>
        <div style={{ flex: 1 }}><SlideConfirm variant="accept" label="Arraste para iniciar" fill={16} /></div>
      </div>
    </>
  );
}

/* ---- 2 · En route → arrived ---- */
function ProviderEnRoute() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">A caminho</span>
        <span className="grow" />
        <span className="badge b-live dot">Em deslocamento</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <MiniMap height={250} />
            <div className="row" style={{ padding: 16 }}>
              <Icon name="navigate" size={22} style={{ color: "var(--accent)" }} />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 17 }}>1,2 km até o local</div>
                <div className="muted" style={{ fontSize: 13 }}>Chega em ~4 min</div>
              </div>
              <button className="btn grad sm"><Icon name="navigate" size={16} /> Navegar</button>
            </div>
          </div>
          <JobHead badge="A caminho" />
        </div>
      </div>
      <div className="footer">
        <div style={{ flex: 1 }}><SlideConfirm variant="accept" label="Arraste: cheguei ao local" fill={20} /></div>
      </div>
    </>
  );
}

/* ---- 3 · Verify with QR / 4-digit code ---- */
function ProviderVerifyStart({ mode = "scan", entered = "" }) {
  const digits = [0, 1, 2, 3].map((i) => entered[i] || "");
  const activeIdx = entered.length;
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Liberar atendimento</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="shieldCheck" size={19} fill="current" style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Peça o QR Code ou a senha de 4 dígitos ao cliente para começar.</div>
          </div>

          <div className="segment">
            <div className={"seg" + (mode === "scan" ? " active" : "")}><Icon name="camera" size={16} /> Escanear QR</div>
            <div className={"seg" + (mode === "code" ? " active" : "")}><Icon name="grip" size={16} /> Digitar senha</div>
          </div>

          {mode === "scan" ? (
            <div className="scanvp">
              <div className="vframe"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
              <div className="scanline" />
              <div className="scanhint">Aponte para o QR Code do cliente</div>
            </div>
          ) : (
            <>
              <div className="code-big">
                {digits.map((d, i) => (
                  <div key={i} className={"code-cell" + (d ? " accent" : " empty") + (i === activeIdx ? " active" : "")}>{d || "•"}</div>
                ))}
              </div>
              <div className="keypad">
                {["1","2","3","4","5","6","7","8","9"].map((k) => <div key={k} className="key">{k}</div>)}
                <div className="key fn">limpar</div>
                <div className="key">0</div>
                <div className="key fn"><Icon name="back" size={18} /></div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }} disabled={mode === "code" && entered.length < 4}>
          {mode === "scan" ? "Confirmar leitura" : "Confirmar senha"} <Icon name="arrowR" size={18} />
        </button>
      </div>
    </>
  );
}

/* ---- Customer side · show the code to the provider ---- */
function CustomerJobCode() {
  const code = "4821".split("");
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Liberar atendimento</span>
        <span className="grow" />
        <span className="badge b-live dot">No local</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16, alignItems: "stretch" }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="row">
              <div className="av-init" style={{ width: 44, height: 44, borderRadius: 14, fontSize: 15, background: "#3b82f6" }}>RC</div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>Rafael C. chegou</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Mostre o código para iniciar o serviço</div>
              </div>
              <Icon name="shieldCheck" size={22} fill="current" style={{ color: "var(--ok)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div className="qr-card"><QRCode size={188} code="4821" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
              <span className="hr" style={{ flex: 1 }} /><span className="faint" style={{ fontSize: 12, fontWeight: 800 }}>OU SENHA</span><span className="hr" style={{ flex: 1 }} />
            </div>
            <div className="code-big">
              {code.map((d, i) => <div key={i} className="code-cell accent">{d}</div>)}
            </div>
          </div>

          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="shield" size={19} style={{ color: "var(--ink-2)", flex: "none" }} />
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Só compartilhe quando o profissional estiver com você. Isso confirma o início do atendimento.</div>
          </div>
        </div>
      </div>
    </>
  );
}

window.JOB_START = {
  title: "Atendimento · Início com QR / senha",
  subtitle: "Aprovado → iniciar deslocamento → cheguei → liberar com o QR Code ou a senha de 4 dígitos do cliente.",
  steps: [
    ["1 · Proposta aceita", ProviderJobApproved],
    ["2 · A caminho", ProviderEnRoute],
    ["3 · Escanear QR", () => <ProviderVerifyStart mode="scan" />],
    ["3 · Digitar senha", () => <ProviderVerifyStart mode="code" entered="48" />],
    ["Cliente · mostra o código", CustomerJobCode],
  ],
};
Object.assign(window, { QRCode, ProviderJobApproved, ProviderEnRoute, ProviderVerifyStart, CustomerJobCode });
