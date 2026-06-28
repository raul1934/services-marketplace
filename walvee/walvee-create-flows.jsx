/* walvee-create-flows.jsx — multi-step "create request" flows.
   Three service types with different step counts:
   Roadside (3) · Home/Plumbing (4) · Beauty/Hair (5).
   Sunset (brand) direction. Exposes window.FLOWS. */

const Fld = ({ l, v, ph, big }) => (
  <div className="field" style={big ? { minHeight: 80 } : undefined}>
    <div className="fl">{l}</div>
    <div className={"fv" + (ph ? " ph" : "")} style={{ marginTop: 4 }}>{v}</div>
  </div>
);

const PhotoStrip = () => (
  <div style={{ display: "flex", gap: 10 }}>
    <div className="ph-img" style={{ width: 80, height: 80 }}>photo</div>
    <div className="ph-img" style={{ width: 80, height: 80 }}>photo</div>
    <div className="card flat" style={{ width: 80, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--ink-3)", padding: 0 }}>
      <Icon name="camera" size={20} /><span style={{ fontSize: 11, fontWeight: 700 }}>Add</span>
    </div>
  </div>
);

const Opt = ({ icon, title, sub, sel, onClick }) => (
  <div className={"opt" + (sel ? " sel" : "")} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
    {icon && <span className="opt-ic"><Icon name={icon} size={22} /></span>}
    <div className="grow">
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      {sub && <div className="muted" style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
    <span className="opt-radio">{sel && <Icon name="check" size={13} sw={3} />}</span>
  </div>
);

/* Wizard chrome: back bar + step counter + progress + scroll body + sticky footer. */
function Wiz({ cat, step, total, title, sub, children, primary = "Continuar", footerBack, slide, slideLabel }) {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name={step === 1 ? "close" : "back"} size={20} /></div>
        <span className="bb-title">{cat}</span>
        <span className="grow" />
        <span className="faint" style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".02em", whiteSpace: "nowrap" }}>ETAPA {step}/{total}</span>
      </div>
      <div className="wizard-progress">
        {Array.from({ length: total }).map((_, i) => <div key={i} className={"seg" + (i < step ? " on" : "")} />)}
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 13 }}>
          <div style={{ marginTop: 4 }}>
            <div className="step-title">{title}</div>
            {sub && <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>{sub}</div>}
          </div>
          {children}
        </div>
      </div>
      <div className="footer">
        {slide ? (
          <div style={{ flex: 1 }}><SlideConfirm variant="accept" label={slideLabel || "Arraste para pedir ajuda"} fill={18} /></div>
        ) : (
          <>
            {footerBack && <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="back" size={18} /></button>}
            <button className="btn grad" style={{ flex: 1 }}>{primary} <Icon name="arrowR" size={18} /></button>
          </>
        )}
      </div>
    </>
  );
}

const SecLbl = ({ children }) => <div className="section-label" style={{ marginTop: 4 }}>{children}</div>;
const Banner = ({ icon, title, sub }) => (
  <div className="row" style={{ gap: 12 }}>
    <div className="cat-ic grad"><Icon name={icon} size={26} /></div>
    <div><div style={{ fontWeight: 800, fontSize: 15.5 }}>{title}</div><div className="muted" style={{ fontSize: 13 }}>{sub}</div></div>
  </div>
);

/* Customer payment method: segmented Pix / Card / Cash + selected detail. */
const PayMethod = ({ method = "card" }) => {
  const detail = {
    pix: ["pix", "Pix", "Na hora — pague ao concluir"],
    card: ["card", "Visa •••• 4821", "Crédito · 1× sem juros"],
    cash: ["cash", "Dinheiro no local", "Pague direto ao profissional"],
  }[method];
  return (
    <>
      <SecLbl>Forma de pagamento</SecLbl>
      <div className="segment">
        {[["pix", "Pix"], ["card", "Card"], ["cash", "Cash"]].map(([k, l]) => (
          <div key={k} className={"seg" + (k === method ? " active" : "")}><Icon name={k} size={16} /> {l}</div>
        ))}
      </div>
      <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 12 }}>
        <span className="cat-ic" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={detail[0]} size={20} /></span>
        <div className="grow"><div style={{ fontWeight: 700, fontSize: 14 }}>{detail[1]}</div><div className="muted" style={{ fontSize: 12.5 }}>{detail[2]}</div></div>
        <span className="faint" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)" }}>{method === "card" ? "Change" : "Add"}</span>
      </div>
    </>
  );
};

/* ============================================================ ROADSIDE · FLAT TIRE (3) */
function RS1() {
  return (
    <Wiz cat="Flat tire" step={1} total={3} title="O que aconteceu?" sub="Uma descrição ajuda o profissional a se preparar.">
      <Banner icon="car" title="Veicular · Pneu furado" sub="Ajuda urgente, a caminho" />
      <Fld l="Descreva o problema" big v="Pneu dianteiro esquerdo estourou. Carro no acostamento com pisca-alerta." />
      <SecLbl>Seu veículo</SecLbl>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Fld l="Marca & modelo" v="VW Golf 2021" />
        <Fld l="Plate" v="BRA2E19" />
        <Fld l="Color" v="Silver" />
        <Fld l="Medida do pneu" v="205/55 R16" />
      </div>
      <SecLbl>Fotos</SecLbl>
      <PhotoStrip />
    </Wiz>
  );
}
function RS2() {
  return (
    <Wiz cat="Flat tire" step={2} total={3} title="Onde você está?" sub="Arraste o pino para ajustar o local." footerBack>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <MiniMap height={240} route={false} puck={false} />
        <div className="row" style={{ padding: "12px 14px" }}>
          <Icon name="location" size={18} style={{ color: "var(--accent)" }} />
          <div className="grow" style={{ fontSize: 13, fontWeight: 600 }}>Localização GPS obtida</div>
          <Icon name="check" size={18} style={{ color: "var(--ok)" }} />
        </div>
      </div>
      <Fld l="Address" v="Av. Paulista, 1500 — São Paulo" />
      <Fld l="Observação de acesso" big v="Carro no acostamento perto do posto, pisca-alerta ligado." />
    </Wiz>
  );
}
function RS3() {
  return (
    <Wiz cat="Flat tire" step={3} total={3} title="Confirmar e solicitar" sub="Avisaremos profissionais verificados perto de você." footerBack slide>
      <div className="card" style={{ padding: 16 }}>
        <div className="sum-row" style={{ paddingTop: 0 }}>
          <span className="sum-ic"><Icon name="car" size={18} /></span>
          <div className="grow"><div className="sum-k">Serviço</div><div className="sum-v">Veicular · Pneu furado</div></div>
        </div>
        <div className="sum-row"><span className="sum-ic"><Icon name="location" size={18} /></span>
          <div className="grow"><div className="sum-k">Localização</div><div className="sum-v">Av. Paulista, 1500</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="wrench" size={18} /></span>
          <div className="grow"><div className="sum-k">Veículo</div><div className="sum-v">VW Golf · BRA2E19</div></div></div>
      </div>
      <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, background: "var(--accent-soft)", boxShadow: "none" }}>
        <Icon name="flash" size={20} style={{ color: "var(--accent)" }} fill="current" />
        <div className="grow" style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>Urgente — buscar ajuda agora</div>
        <span className="badge b-urgent">ASAP</span>
      </div>
      <BudgetMeter work="Um pneu furado" value={190} min={60} max={300} bandLo={90} bandHi={160} regionAvg={120} />
      <PayMethod method="pix" />
    </Wiz>
  );
}

/* ============================================================ HOME · PLUMBING (4) */
function HM1() {
  return (
    <Wiz cat="Plumbing" step={1} total={4} title="Descreva o problema" sub="Fotos help pros quote accurately.">
      <Banner icon="drop" title="Casa · Encanamento" sub="Vazamento, entupimento e mais" />
      <Fld l="O que está acontecendo?" big v="Pia da cozinha vazando embaixo do armário e escoando devagar." />
      <SecLbl>Tipo de problema</SecLbl>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="chip active grad">Vazamento</span>
        <span className="chip">Entupimento</span>
        <span className="chip">Instalação</span>
        <span className="chip">Sem água quente</span>
      </div>
      <SecLbl>Fotos</SecLbl>
      <PhotoStrip />
    </Wiz>
  );
}
function HM2() {
  return (
    <Wiz cat="Plumbing" step={2} total={4} title="Endereço & acesso" sub="Quem vai receber o profissional?" footerBack>
      <Fld l="Address" v="Rua Augusta, 920 — Apt 142" />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}><MiniMap height={130} route={false} puck={false} /></div>
      <SecLbl>Quem recebe o profissional?</SecLbl>
      <Opt icon="key" title="Adulto com chave" sub="Alguém 18+ estará em casa" sel />
      <Opt icon="enter-outline" title="Código de acesso" sub="Informe o código do prédio/porta" />
      <Fld l="Código de portaria" v="1420#" ph />
    </Wiz>
  );
}
const SCHED_PERIODS = [["Manhã", "8–12"], ["Tarde", "12–18"], ["Noite", "18–21"]];
const SCHED_DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* Month calendar (multi-day select) + per-day time windows that podem variar. */
function Scheduler() {
  const today = 12;
  const selDays = [
    { d: 15, p: ["Manhã", "Tarde"] },
    { d: 17, p: ["Tarde"] },
    { d: 19, p: ["Noite"] },
  ];
  const selSet = new Set(selDays.map((s) => s.d));
  const dowOf = (d) => SCHED_DOW[(d - 1) % 7];
  const cells = [null]; // Jun 1 2026 = Monday → 1 leading blank in a Sun-start grid
  for (let d = 1; d <= 30; d++) cells.push(d);
  return (
    <>
      <SecLbl>1 · Escolha os dias</SecLbl>
      <div className="card flat" style={{ padding: 14 }}>
        <div className="cal-month">
          <span className="m">June 2026</span>
          <div className="cal-nav"><div className="nb"><Icon name="back" size={16} /></div><div className="nb"><Icon name="fwd" size={16} /></div></div>
        </div>
        <div className="cal-dow">{["S", "M", "T", "W", "T", "F", "S"].map((x, i) => <span key={i}>{x}</span>)}</div>
        <div className="cal-grid">
          {cells.map((d, i) => d == null
            ? <div key={i} className="cal-cell empty" />
            : <div key={i} className={"cal-cell" + (d < today ? " past" : "") + (d === today ? " today" : "") + (selSet.has(d) ? " sel" : "")}>{d}</div>)}
        </div>
      </div>

      <SecLbl>2 · Horários de cada dia <span className="faint" style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>· podem variar</span></SecLbl>
      {selDays.map(({ d, p }) => (
        <div key={d} className="card flat" style={{ padding: 10 }}>
          <div className="row" style={{ gap: 10 }}>
            <div className="date-badge" style={{ width: 38, height: 38 }}><span className="dn">{d}</span><span className="dd">{dowOf(d)}</span></div>
            <div className="grow" style={{ fontWeight: 800, fontSize: 13.5 }}>{dowOf(d)}, Jun {d}</div>
            <Icon name="close" size={16} style={{ color: "var(--ink-3)", flex: "none" }} />
          </div>
          <div className="period-set">
            {SCHED_PERIODS.map(([name, range]) => (
              <div key={name} className={"pseg" + (p.includes(name) ? " on" : "")}>{name}<small>{range}</small></div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function HM3() {
  return (
    <Wiz cat="Plumbing" step={3} total={4} title="Quando fica bom?" sub="Escolha os dias e os horários de cada um." footerBack>
      <Scheduler />
    </Wiz>
  );
}
function HM4() {
  return (
    <Wiz cat="Plumbing" step={4} total={4} title="Orçamento & confirmação" sub="Revise antes de publicar a solicitação." footerBack slide slideLabel="Arraste para publicar">
      <div className="card" style={{ padding: 16 }}>
        <div className="sum-row" style={{ paddingTop: 0 }}><span className="sum-ic"><Icon name="drop" size={18} /></span>
          <div className="grow"><div className="sum-k">Serviço</div><div className="sum-v">Plumbing · Leak</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="location" size={18} /></span>
          <div className="grow"><div className="sum-k">Onde</div><div className="sum-v">Rua Augusta, 920 · Apt 142</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="calendar" size={18} /></span>
          <div className="grow"><div className="sum-k">Quando</div><div className="sum-v">Tue 15 / Thu 17 · Tarde</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="key" size={18} /></span>
          <div className="grow"><div className="sum-k">Acesso</div><div className="sum-v">Adulto com chave</div></div></div>
      </div>
      <BudgetMeter work="Plumbing" value={320} min={120} max={500} bandLo={180} bandHi={300} regionAvg={240} />
      <PayMethod method="card" />
    </Wiz>
  );
}

/* ============================================================ BEAUTY · HAIR (5) */
function BT1() {
  return (
    <Wiz cat="Hair at home" step={1} total={5} title="Escolha um serviço" sub="What would you like done?">
      <Banner icon="scissors" title="Beauty · Hair" sub="A stylist comes to you" />
      <Opt icon="scissors" title="Haircut" sub="Wash, cut & finish" sel />
      <Opt icon="color-palette-outline" title="Color" sub="Full color or roots" />
      <Opt icon="sparkles" title="Highlights" sub="Foils / balayage" />
      <Opt icon="sunny-outline" title="Blow-dry & style" sub="Wash and style only" />
      <SecLbl>For whom?</SecLbl>
      <div className="segment">
        <div className="seg active">Me</div>
        <div className="seg">Someone else</div>
        <div className="seg">Kids</div>
      </div>
    </Wiz>
  );
}
function BT2() {
  return (
    <Wiz cat="Hair at home" step={2} total={5} title="Style preferences" sub="Help the stylist tailor your look." footerBack>
      <SecLbl>Hair length</SecLbl>
      <div className="segment">
        <div className="seg">Short</div>
        <div className="seg active">Medium</div>
        <div className="seg">Long</div>
      </div>
      <SecLbl>Add-ons</SecLbl>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="chip active grad">Wash</span>
        <span className="chip active grad">Beard trim</span>
        <span className="chip">Treatment</span>
        <span className="chip">Styling</span>
      </div>
      <Fld l="Notes for the stylist" big v="Keep some length on top, tidy the sides and neckline. Matte finish." />
      <SecLbl>Reference photo</SecLbl>
      <PhotoStrip />
    </Wiz>
  );
}
function BT3() {
  return (
    <Wiz cat="Hair at home" step={3} total={5} title="Where should we come?" sub="At your place or meet at a salon." footerBack>
      <Opt icon="home-outline" title="At my home" sub="Stylist travels to you" sel />
      <Opt icon="bag-outline" title="At a salon" sub="Choose from nearby partners" />
      <Fld l="Address" v="Alameda Santos, 45 — Apt 78" />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}><MiniMap height={150} route={false} puck={false} /></div>
    </Wiz>
  );
}
function BT4() {
  const days = [["Fri", "18"], ["Sat", "19", true], ["Sun", "20"], ["Mon", "21"]];
  const slots = [["09:00"], ["10:30", true], ["12:00"], ["14:00"], ["15:30", false, true], ["17:00"]];
  return (
    <Wiz cat="Hair at home" step={4} total={5} title="Pick a time" sub="Choose a day and an open slot." footerBack>
      <SecLbl>Day</SecLbl>
      <div style={{ display: "flex", gap: 8 }}>
        {days.map(([dow, num, sel]) => (
          <div key={num} className={"day" + (sel ? " sel" : "")}><span className="d-dow">{dow}</span><span className="d-num">{num}</span></div>
        ))}
      </div>
      <SecLbl>Available slots · Sat 19</SecLbl>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {slots.map(([t, sel, off]) => <div key={t} className={"slot" + (sel ? " sel" : "") + (off ? " off" : "")}>{t}</div>)}
      </div>
      <div className="card flat" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="clock" size={18} style={{ color: "var(--accent)" }} />
        <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Approx. duration</div>
        <strong style={{ fontSize: 14 }}>45–60 min</strong>
      </div>
    </Wiz>
  );
}
function BT5() {
  return (
    <Wiz cat="Hair at home" step={5} total={5} title="Confirm booking" sub="Review your appointment details." footerBack slide slideLabel="Arraste para agendar">
      <div className="card" style={{ padding: 16 }}>
        <div className="sum-row" style={{ paddingTop: 0 }}><span className="sum-ic"><Icon name="scissors" size={18} /></span>
          <div className="grow"><div className="sum-k">Serviço</div><div className="sum-v">Haircut · Medium · +Beard</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="calendar" size={18} /></span>
          <div className="grow"><div className="sum-k">Quando</div><div className="sum-v">Sat 19 · 10:30 (~50 min)</div></div></div>
        <div className="sum-row"><span className="sum-ic"><Icon name="home-outline" size={18} /></span>
          <div className="grow"><div className="sum-k">Onde</div><div className="sum-v">At home · Alameda Santos, 45</div></div></div>
      </div>
      <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div className="grow">
          <div className="sum-k">Estimated total</div>
          <div className="muted" style={{ fontSize: 12 }}>Final price confirmed by stylist</div>
        </div>
        <div className="price"><span className="cur">R$</span>120</div>
      </div>
      <PayMethod method="card" />
    </Wiz>
  );
}

window.FLOWS = {
  roadside: { title: "Create · Roadside (3 steps)", subtitle: "Urgent flat-tire request — problem & vehicle → location → confirm.", steps: [["Step 1 · Problem", RS1], ["Step 2 · Location", RS2], ["Step 3 · Confirm", RS3, 1040]] },
  home: { title: "Create · Home / Plumbing (4 steps)", subtitle: "Adds access (who lets the pro in) and scheduling.", steps: [["Step 1 · Problem", HM1], ["Step 2 · Access", HM2], ["Step 3 · Schedule", HM3, 1000], ["Step 4 · Confirm", HM4, 1080]] },
};

/* Shared wizard chrome + form helpers, exposed for the provider bid flows. */
Object.assign(window, { Wiz, Fld, Opt, PhotoStrip, SecLbl, Banner });
