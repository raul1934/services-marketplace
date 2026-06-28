/* walvee-provider-account.jsx — the Pro "Account" area, divided into screens:
   a profile hub that links out to Editar perfil, Meus serviços (categories),
   Área de atendimento, Documentos, Ganhos & saques, and Settings.
   Reuses kit + shared helpers + the grouped category picker. */

const AcctRow = ({ icon, name, val, danger, last }) => (
  <div className="acct-row" style={last ? { borderTop: "1px solid var(--line)" } : undefined}>
    <span className={"ar-ic" + (danger ? " danger" : "")}><Icon name={icon} size={19} /></span>
    <span className="ar-name grow" style={danger ? { color: "var(--danger)" } : undefined}>{name}</span>
    {val && <span className="ar-val">{val}</span>}
    {!danger && <Icon name="fwd" size={18} style={{ color: "var(--ink-3)", flex: "none" }} />}
  </div>
);

/* ---- Account hub ---- */
function ProviderAccountScreen() {
  return (
    <>
      <div className="appbar" style={{ paddingTop: 10 }}>
        <h1 className="ab-title">Conta</h1>
        <span className="spacer" />
        <div className="iconbtn"><Icon name="settings" size={20} /></div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="row">
              <div className="av-init" style={{ width: 58, height: 58, borderRadius: 18, fontSize: 21, background: "#3b82f6" }}>RC</div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 18 }}>Rafael Costa</div>
                <div className="row" style={{ gap: 6, marginTop: 3 }}>
                  <Stars val={4.9} size={13} />
                  <span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>4.9 · 213 jobs</span>
                </div>
              </div>
              <span className="acct-verified"><Icon name="shieldCheck" size={13} fill="current" /> Verificado</span>
            </div>
            <div className="row" style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid var(--line)", gap: 0 }}>
              <div className="stat" style={{ flex: 1 }}><div className="v" style={{ fontSize: 18 }}>R$ 6.4k</div><div className="k">Este mês</div></div>
              <div style={{ width: 1, background: "var(--line)", alignSelf: "stretch" }} />
              <div className="stat" style={{ flex: 1, paddingLeft: 14 }}><div className="v" style={{ fontSize: 18 }}>5</div><div className="k">Serviços</div></div>
              <div style={{ width: 1, background: "var(--line)", alignSelf: "stretch" }} />
              <div className="stat" style={{ flex: 1, paddingLeft: 14 }}><div className="v" style={{ fontSize: 18, color: "var(--ok)" }}>Online</div><div className="k">Status</div></div>
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Perfil</div>
            <div className="card" style={{ padding: "2px 16px" }}>
              <AcctRow icon="user" name="Editar perfil" val="Nome, foto, bio" />
              <AcctRow icon="briefcase" name="Meus serviços" val="5 selected" />
              <AcctRow icon="location" name="Área de atendimento" val="8 km · 4 areas" />
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Trabalho & pagamentos</div>
            <div className="card" style={{ padding: "2px 16px" }}>
              <AcctRow icon="dollar" name="Ganhos & saques" val="R$ 1.2k available" />
              <AcctRow icon="shield" name="Documentos" val="Verificado" />
              <AcctRow icon="calendar" name="Disponibilidade" />
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>App</div>
            <div className="card" style={{ padding: "2px 16px" }}>
              <AcctRow icon="bell" name="Notificações" />
              <AcctRow icon="chat" name="Ajuda & suporte" />
              <AcctRow icon="power" name="Sair" danger />
            </div>
          </div>
        </div>
      </div>
      <TabBar role="provider" active="user" />
    </>
  );
}

/* ---- Account · Meus serviços (manage categories) ---- */
function ProviderServicesManage() {
  const sel = new Set(["Flat tire", "Battery", "Tow", "Sem chave", "Locksmith"]);
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Meus serviços</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="shieldCheck" size={19} style={{ color: "var(--accent)", flex: "none" }} fill="current" />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Mudanças nos serviços são revisadas por um admin antes de entrar no ar.</div>
          </div>
          <ProvCategoryPicker selected={sel} />
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="close" size={18} /></button>
        <button className="btn grad" style={{ flex: 1 }}>Salvar alterações</button>
      </div>
    </>
  );
}

/* ---- Account · Ganhos & saques ---- */
function ProviderEarningsScreen() {
  const txns = [
    ["Bateria descarregada · Mateus A.", "Hoje · 14:50", "+R$ 107", false],
    ["Saque via Pix", "Ontem", "−R$ 800", true],
    ["Sem chave · Bruno R.", "Jun 11", "+R$ 116", false],
    ["Tow · Ana P.", "Jun 10", "+R$ 291", false],
  ];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Ganhos & saques</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="online-card">
            <div className="pulse" />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, opacity: .9, letterSpacing: ".04em" }}>SALDO DISPONÍVEL</div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 38, letterSpacing: "-.02em", marginTop: 4 }}>R$ 1.240</div>
              <div style={{ fontSize: 13, opacity: .92, marginTop: 2 }}>R$ 6.4k ganhos este mês · após comissão do plano</div>
            </div>
          </div>
          <button className="btn grad" style={{ gap: 10 }}><Icon name="pix" size={18} /> <span style={{ whiteSpace: "nowrap" }}>Sacar via Pix</span></button>

          <div className="card" style={{ padding: 16 }}>
            <div className="row" style={{ alignItems: "stretch" }}>
              <div className="stat"><div className="v" style={{ whiteSpace: "nowrap" }}>R$ 6.4k</div><div className="k">Este mês</div></div>
              <div style={{ width: 1, background: "var(--line)" }} />
              <div className="stat" style={{ paddingLeft: 16 }}><div className="v">58</div><div className="k">Trabalhos</div></div>
              <div style={{ width: 1, background: "var(--line)" }} />
              <div className="stat" style={{ paddingLeft: 16 }}><div className="v">R$ 198</div><div className="k">walvee fee</div></div>
            </div>
          </div>

          <div className="section-label">Atividade recente</div>
          <div className="card" style={{ padding: "4px 16px" }}>
            {txns.map(([t, d, amt, out], i) => (
              <div key={i} className="txn-row">
                <span className={"txn-ic" + (out ? " out" : "")}><Icon name={out ? "arrowR" : "dollar"} size={18} /></span>
                <div className="grow"><div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div><div className="muted" style={{ fontSize: 12 }}>{d}</div></div>
                <span style={{ fontWeight: 800, fontSize: 14, color: out ? "var(--ink-2)" : "var(--ok)" }}>{amt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar role="provider" active="user" />
    </>
  );
}

/* ---- Account · Editar perfil ---- */
function ProviderEditProfileScreen() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Editar perfil</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0 6px" }}>
            <div style={{ position: "relative" }}>
              <div className="av-init" style={{ width: 84, height: 84, borderRadius: 28, fontSize: 30, background: "#3b82f6" }}>RC</div>
              <div className="iconbtn" style={{ position: "absolute", right: -4, bottom: -4, width: 32, height: 32 }}><Icon name="camera" size={15} /></div>
            </div>
            <span className="acct-verified"><Icon name="shieldCheck" size={13} fill="current" /> Verificado pro</span>
          </div>

          <div className="field"><div className="fl">Full name</div><div className="fv">Rafael Costa</div></div>
          <div className="field" style={{ minHeight: 72 }}><div className="fl">Bio</div><div className="fv" style={{ marginTop: 4 }}>Especialista veicular, 6 anos de estrada. Rápido, cuidadoso e simpático.</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field"><div className="fl">Phone</div><div className="fv">+55 11 99123-4567</div></div>
            <div className="field"><div className="fl">Email</div><div className="fv" style={{ fontSize: 13.5 }}>rafael@email.com</div></div>
          </div>
          <div className="field"><div className="fl">Cidade</div><div className="fv">São Paulo · SP</div></div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Salvar perfil</button>
      </div>
    </>
  );
}

Object.assign(window, { ProviderAccountScreen, ProviderServicesManage, ProviderEarningsScreen, ProviderEditProfileScreen });
