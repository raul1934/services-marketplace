/* walvee-provider-onboarding.jsx — provider sign-up + setup wizard
   (categories → service area → documents → submit) and the "pending admin
   approval" locked state. Reuses Wiz + shared helpers. Exposes the screens
   and window.PROVIDER_ONB. */

/* Provider account creation (role-flavored sign up). */
function ProviderSignUpScreen({ mode = "phone" }) {
  return (
    <div className="auth">
      <div className="appbar" style={{ paddingTop: 18 }}>
        <div className="brand-mark">
          <div className="brand-logo"><Icon name="navigate" size={24} style={{ color: "#fff" }} fill="current" /></div>
          <span className="brand-name">walvee <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>pro</span></span>
        </div>
      </div>
      <div className="auth-body">
        <div>
          <div className="auth-h1">Seja um profissional walvee</div>
          <div className="auth-sub">Ganhe atendendo perto de você. O cadastro leva poucos minutos.</div>
        </div>
        <div className="input"><span className="ic"><Icon name="user" size={19} /></span><span className="val">Rafael Costa</span></div>
        <div className="segment">
          <div className={"seg" + (mode === "phone" ? " active" : "")}><Icon name="phone" size={16} /> Telefone</div>
          <div className={"seg" + (mode === "email" ? " active" : "")}><Icon name="chat" size={16} /> Email</div>
        </div>
        {mode === "phone"
          ? <div className="input focus"><span className="ic"><Icon name="phone" size={19} /></span><span className="prefix">+55</span><span className="val">11 99123-4567</span></div>
          : <div className="input focus"><span className="ic"><Icon name="chat" size={19} /></span><span className="val">rafael@email.com</span></div>}
        <div className="faint" style={{ fontSize: 12, fontWeight: 600, marginTop: -4 }}>Telefone or email is required — we'll verify it.</div>
        <button className="btn grad" style={{ marginTop: 4 }}>Continue <Icon name="arrowR" size={18} /></button>
        <div className="divider-or">or</div>
        <button className="gbtn"><GoogleG /> Continuar com o Google</button>
        <span style={{ flex: 1 }} />
        <div className="auth-foot">Procurando ajuda? <a>Usar a walvee como cliente</a></div>
      </div>
    </div>
  );
}

/* ---- Step 1 · Categorias (grouped subcategories, like the client side) ---- */
const PROV_CAT_GROUPS = [
  ["Roadside", "car", ["Pneu furado", "Bateria", "Sem combustível", "Sem chave", "Guincho", "Não liga"]],
  ["Casa & imóvel", "drop", ["Encanamento", "Elétrica", "Chaveiro", "Limpeza", "Internet", "Eletrodoméstico"]],
  ["Pets", "paw", ["Passeio", "Veterinário", "Banho & tosa"]],
];

/* Reusable grouped subcategory picker (used in onboarding + account). */
function ProvCategoryPicker({ selected }) {
  const sel = selected instanceof Set ? selected : new Set(selected);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {PROV_CAT_GROUPS.map(([group, ic, subs]) => {
        const onCount = subs.filter((s) => sel.has(s)).length;
        return (
          <div key={group}>
            <div className="row" style={{ gap: 9, marginBottom: 11 }}>
              <span className="cat-ic" style={{ width: 30, height: 30, borderRadius: 9, flex: "none" }}><Icon name={ic} size={16} /></span>
              <span className="section-label" style={{ margin: 0 }}>{group}</span>
              {onCount > 0 && <span className="count" style={{ color: "var(--accent)", fontWeight: 800, fontSize: 12 }}>{onCount}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {subs.map((s) => {
                const on = sel.has(s);
                return (
                  <span key={s} className={"chip" + (on ? " active grad" : "")} style={{ gap: 7 }}>
                    {on && <Icon name="check" size={13} sw={3} />}{s}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PO1() {
  const sel = new Set(["Pneu furado", "Bateria", "Guincho", "Sem chave", "Chaveiro"]);
  return (
    <Wiz cat="Provider setup" step={1} total={4} title="O que você oferece?" sub="Escolha os serviços que você domina. O admin verifica.">
      <ProvCategoryPicker selected={sel} />
      <div className="faint" style={{ fontSize: 12, fontWeight: 600 }}>5 serviços selecionados · pode mudar quando quiser</div>
    </Wiz>
  );
}

/* ---- Step 2 · Área de atendimento (interactive radius reveals covered areas) ---- */
const SP_AREAS = [
  { name: "Jardins", km: 2 }, { name: "Pinheiros", km: 4 }, { name: "Bela Vista", km: 5 },
  { name: "Itaim Bibi", km: 6 }, { name: "Consolação", km: 7 }, { name: "Vila Mariana", km: 9 },
  { name: "Moema", km: 11 }, { name: "Lapa", km: 13 }, { name: "Santana", km: 16 },
  { name: "Guarulhos", km: 20, city: true }, { name: "Osasco", km: 23, city: true },
];
function PO2() {
  const [km, setKm] = React.useState(8);
  const covered = SP_AREAS.filter((a) => a.km <= km);
  const hoods = covered.filter((a) => !a.city);
  const cities = covered.filter((a) => a.city);
  const circle = Math.min(168, 36 + km * 6); // visual diameter on the mini map
  const pct = ((km - 2) / (25 - 2)) * 100;
  return (
    <Wiz cat="Provider setup" step={2} total={4} title="Onde você atende?" sub="Defina o raio de cobertura — mostramos as áreas atendidas. O admin confirma." footerBack>
      <div className="input"><span className="ic"><Icon name="location" size={19} /></span><span className="val">São Paulo · SP</span></div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="map" style={{ height: 168, position: "relative" }}>
          <svg className="streets" viewBox="0 0 390 168" preserveAspectRatio="xMidYMid slice">
            <g stroke="currentColor" strokeWidth="10" opacity="0.06" fill="none" strokeLinecap="round"><path d="M-20 56H410M-20 120H410M70 -20V190M260 -20V190" /></g>
          </svg>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: circle, height: circle, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 16%, transparent)", border: "2px solid var(--accent)", transition: "width .15s, height .15s" }} />
          <div className="map-me" style={{ left: "50%", top: "50%" }} />
        </div>
      </div>

      <div className="card flat" style={{ padding: 16 }}>
        <div className="row" style={{ alignItems: "baseline" }}>
          <span className="fl" style={{ fontSize: 13 }}>Raio de cobertura</span>
          <span className="grow" />
          <span className="radius-val">{km}<span className="u">km</span></span>
        </div>
        <input className="range" type="range" min="2" max="25" value={km} step="1"
          onChange={(e) => setKm(parseInt(e.target.value, 10))}
          style={{ marginTop: 14, background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line) ${pct}%)` }} />
        <div className="row" style={{ marginTop: 8 }}><span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>2 km</span><span className="grow" /><span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>25 km</span></div>
      </div>

      <SecLbl>Áreas que você atende <span className="count" style={{ color: "var(--accent)" }}>{covered.length}</span></SecLbl>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {hoods.map((a) => <span key={a.name} className="chip active grad">{a.name}</span>)}
      </div>
      {cities.length > 0 && (
        <>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>Cidades vizinhas</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cities.map((a) => <span key={a.name} className="chip"><Icon name="pin" size={12} fill="current" /> {a.name}</span>)}
          </div>
        </>
      )}
    </Wiz>
  );
}

/* ---- Step 3 · Documentos ---- */
function PO3() {
  const docs = [
    ["user", "Documento (RG / CNH)", "Enviado", true],
    ["briefcase", "Comprovante de residência", "Enviado", true],
    ["shield", "Selfie de verificação", "Enviado", true],
    ["sparkles", "Certificado da categoria", "Adicionar (opcional)", false],
  ];
  return (
    <Wiz cat="Provider setup" step={3} total={4} title="Verifique sua identidade" sub="Verificamos documentos para segurança dos clientes." footerBack>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {docs.map(([ic, name, status, done], i) => (
          <div key={i} className={"doc-row" + (done ? " done" : "")}>
            <span className="doc-ic"><Icon name={done ? "check" : ic} size={20} sw={done ? 2.6 : 2} /></span>
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
            </div>
            <span className={"doc-status " + (done ? "up" : "todo")}>{status}</span>
          </div>
        ))}
      </div>
      <div className="locked-banner" style={{ background: "var(--surface-2)" }}>
        <Icon name="shield" size={18} style={{ color: "var(--ok)", flex: "none" }} />
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Documentos are reviewed by walvee's team, never shared with clients.</div>
      </div>
    </Wiz>
  );
}

/* ---- Step 4 · Review & submit ---- */
function PO4() {
  return (
    <Wiz cat="Provider setup" step={4} total={4} title="Enviar para aprovação" sub="Um admin revisa seu perfil antes de você atender." footerBack slide slideLabel="Arraste para enviar">
      <div className="card" style={{ padding: 16 }}>
        <div className="sum-row" style={{ paddingTop: 0 }}><span className="sum-ic"><Icon name="briefcase" size={18} /></span>
          <div className="grow"><div className="sum-k">Categorias</div><div className="sum-v">Roadside · Chaveiro · Guincho</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="location" size={18} /></span>
          <div className="grow"><div className="sum-k">Área de atendimento</div><div className="sum-v">São Paulo · 8 km · 4 areas</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="shield" size={18} /></span>
          <div className="grow"><div className="sum-k">Documentos</div><div className="sum-v">3 enviados · verificação pendente</div></div></div>
      </div>
      <div className="locked-banner">
        <Icon name="clock" size={19} style={{ color: "var(--accent)", flex: "none" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Review usually takes up to 48 hours. You'll be notified when you're approved.</div>
      </div>
    </Wiz>
  );
}

/* ---- Pending admin approval — locked state ---- */
function ProviderPendingScreen() {
  return (
    <div className="pending">
      <div className="pending-hero">
        <div className="blob" style={{ width: 200, height: 200, top: -70, right: -60 }} />
        <div className="blob" style={{ width: 120, height: 120, bottom: -40, left: -30 }} />
        <div className="pending-badge"><Icon name="clock" size={40} /></div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 24, letterSpacing: "-.02em" }}>Conta em análise</div>
        <div style={{ fontSize: 14, opacity: .92, marginTop: 8, lineHeight: 1.5 }}>Obrigado, Rafael. Estamos revisando suas categorias e área. <b>Você ainda não pode atender</b> — avisaremos assim que aprovado.</div>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="lock-step">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                <div className="ls-node done"><Icon name="check" size={14} sw={3} /></div>
                <div className="ls-line grow" />
              </div>
              <div style={{ paddingBottom: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Perfil enviado</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Categorias, area & documents received</div>
              </div>
            </div>
            <div className="lock-step">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                <div className="ls-node now"><Icon name="search" size={14} /></div>
                <div className="ls-line grow" />
              </div>
              <div style={{ paddingBottom: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Análise do admin <span className="badge b-open" style={{ fontSize: 11 }}>Em andamento</span></div>
                <div className="muted" style={{ fontSize: 12.5 }}>Verificando documentos e cobertura · até 48h</div>
              </div>
            </div>
            <div className="lock-step">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="ls-node">3</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink-3)" }}>Começar a atender</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Fique online e proponha após aprovação</div>
              </div>
            </div>
          </div>

          <div className="locked-banner">
            <Icon name="shield" size={19} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Seu painel, trabalhos e propostas ficam bloqueados até a aprovação.</div>
          </div>

          <button className="btn ghost" style={{ opacity: .6 }}><Icon name="power" size={18} /> Ficar online — bloqueado</button>
          <div className="auth-foot">Precisa corrigir algo? <a>Editar envio</a> · <a>Falar com suporte</a></div>
        </div>
      </div>
    </div>
  );
}

window.PROVIDER_ONB = {
  title: "Provider · Sign up & setup (4 steps)",
  subtitle: "Account → categories → service area → documents → submit for admin approval.",
  steps: [["Step 1 · Categorias", PO1, 980], ["Step 2 · Área de atendimento", PO2, 968], ["Step 3 · Documentos", PO3], ["Step 4 · Submit", PO4]],
};
Object.assign(window, { ProviderSignUpScreen, ProviderPendingScreen, ProvCategoryPicker, PROV_CAT_GROUPS });
