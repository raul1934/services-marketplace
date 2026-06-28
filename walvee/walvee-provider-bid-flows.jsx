/* walvee-provider-bid-flows.jsx — provider "Send a bid" as multi-step flows
   that vary by job type:
   Roadside / urgent (2) · Home / scheduled (4) · Beauty (5).
   Reuses the shared Wiz chrome + helpers. Exposes window.BID_FLOWS. */

const JobReview = ({ icon, title, loc, name, rating, jobs, quote, urgent }) => (
  <div className="card" style={{ padding: 16 }}>
    <div className="row">
      <div className="cat-ic"><Icon name={icon} size={24} /></div>
      <div className="grow">
        <div style={{ fontWeight: 800, fontSize: 15.5 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12.5 }}>{loc}</div>
      </div>
      {urgent && <span className="badge b-urgent dot">Urgent</span>}
    </div>
    {quote && <div className="muted" style={{ fontSize: 13, marginTop: 11, lineHeight: 1.4 }}>"{quote}"</div>}
    <div className="row" style={{ marginTop: 12, gap: 9, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
      <div className="av-init" style={{ width: 34, height: 34, borderRadius: 11, fontSize: 13, background: "#7c8aa0" }}>{name.split(" ").map(s => s[0]).join("")}</div>
      <div className="grow">
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</div>
        <div className="row" style={{ gap: 5 }}><Stars val={rating} size={12} /><span className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{rating} · {jobs} jobs</span></div>
      </div>
    </div>
  </div>
);

const SumCard = ({ rows }) => (
  <div className="card" style={{ padding: 16 }}>
    {rows.map(([ic, k, v], i) => (
      <div key={i} className="sum-row" style={i === 0 ? { paddingTop: 0 } : undefined}>
        <span className="sum-ic"><Icon name={ic} size={18} /></span>
        <div className="grow"><div className="sum-k">{k}</div><div className="sum-v">{v}</div></div>
      </div>
    ))}
  </div>
);

const MsgField = () => (
  <div className="field" style={{ minHeight: 64 }}>
    <div className="fl">Mensagem ao cliente</div>
    <div className="fv ph" style={{ marginTop: 4 }}>A caminho com as ferramentas certas. Anos de experiência — você está em boas mãos.</div>
  </div>
);

/* Provider payout breakdown — walvee commission depends on the plan (Pro shown). */
const Payout = ({ gross, grossLabel = "Seu preço", netLabel = "Você recebe", note }) => {
  const fee = Math.round(gross * 0.025);
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="total-line"><span className="tk">{grossLabel}</span><span>R$ {gross}</span></div>
      <div className="total-line">
        <span className="tk" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>comissão <span className="badge" style={{ padding: "2px 7px", fontSize: 11, background: "var(--surface-2)" }}>Pro · 2,5%</span></span>
        <span style={{ color: "var(--ink-2)" }}>− R$ {fee}</span>
      </div>
      <div className="total-line grand"><span className="tk">{netLabel}</span><span className="price" style={{ fontSize: 19 }}><span className="cur">R$</span>{gross - fee}</span></div>
      {note && <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.35 }}>{note}</div>}
    </div>
  );
};

/* ============================================================ ROADSIDE · URGENT (2) */
function PB_RS1() {
  return (
    <Wiz cat="Bateria descarregada" step={1} total={2} title="Seu preço & chegada" sub="Faça uma proposta competitiva — é urgente.">
      <JobReview icon="battery" title="Veicular · Bateria descarregada" loc="Jardins · 0.8 km" name="Mateus A." rating={4.8} jobs={32} urgent
        quote="O carro não liga, luzes do painel fracas. Na garagem do prédio." />
      <BudgetMeter label="Your price" mode="bid" work="Dead battery" value={110} min={60} max={260} bandLo={90} bandHi={160} regionAvg={120} pill="Area average" pillIcon="location" />
      <SecLbl>Horário de chegada</SecLbl>
      <div className="segment">
        <div className="seg active"><Icon name="flash" size={16} /> 10 min</div>
        <div className="seg">20 min</div>
        <div className="seg">30 min</div>
      </div>
    </Wiz>
  );
}
function PB_RS2() {
  return (
    <Wiz cat="Bateria descarregada" step={2} total={2} title="Revisar & enviar proposta" sub="Confirme sua oferta antes de enviar." footerBack slide slideLabel="Arraste para enviar proposta">
      <SumCard rows={[["battery", "Trabalho", "Veicular · Bateria descarregada"], ["dollar", "Seu preço", "R$ 110"], ["clock", "Chegada", "~10 min"], ["pin", "Distância", "0.8 km · Jardins"]]} />
      <Payout gross={110} />
      <MsgField />
    </Wiz>
  );
}

/* ============================================================ HOME · SCHEDULED (4) */
function PB_HM1() {
  return (
    <Wiz cat="Serviço de encanamento" step={1} total={4} title="Revisar a solicitação" sub="Veja os detalhes antes de propor.">
      <JobReview icon="drop" title="Casa · Reparo de vazamento" loc="Rua Augusta, 920 · 1.3 km" name="Carla M." rating={4.9} jobs={61}
        quote="Pia da cozinha vazando embaixo do armário, escoando devagar." />
      <button className="btn ghost"><Icon name="chat" size={18} /> Perguntar ao cliente</button>
      <SecLbl>Fotos do cliente</SecLbl>
      <PhotoStrip />
    </Wiz>
  );
}
function PB_HM2() {
  return (
    <Wiz cat="Serviço de encanamento" step={2} total={4} title="Escolha quando vai" sub="Escolha uma das janelas do cliente." footerBack>
      <SecLbl>Cliente disponível</SecLbl>
      <Opt icon="calendar" title="Ter, 15 jun" sub="Tarde · 12:00–18:00" sel />
      <Opt icon="calendar" title="Qui, 17 jun" sub="Tarde · 12:00–18:00" />
      <Opt icon="calendar" title="Qui, 17 jun" sub="Noite · 18:00–21:00" />
      <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="clock" size={18} style={{ color: "var(--accent)" }} />
        <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>Duração estimada</div>
        <strong style={{ fontSize: 14 }}>1–2 h</strong>
      </div>
    </Wiz>
  );
}
function PB_HM3() {
  return (
    <Wiz cat="Serviço de encanamento" step={3} total={4} title="Seu preço & peças" sub="Proponha a mão de obra e adicione peças se precisar." footerBack>
      <BudgetMeter label="Labor price" mode="bid" work="Sink leak repair" value={180} min={100} max={420} bandLo={150} bandHi={260} regionAvg={200} pill="Area average" pillIcon="location" />
      <SecLbl>Peças & materiais</SecLbl>
      <div className="opt sel">
        <span className="opt-ic"><Icon name="wrench" size={22} /></span>
        <div className="grow"><div style={{ fontWeight: 700, fontSize: 15 }}>Estimar peças à parte</div><div className="muted" style={{ fontSize: 12.5 }}>Cobradas a custo após o diagnóstico</div></div>
        <span className="toggle on" />
      </div>
      <Fld l="Peças estimadas" v={<span><span className="muted" style={{ fontSize: 12 }}>R$ </span>40–80</span>} />
    </Wiz>
  );
}
function PB_HM4() {
  return (
    <Wiz cat="Serviço de encanamento" step={4} total={4} title="Revisar & enviar proposta" sub="Confirme sua oferta antes de enviar." footerBack slide slideLabel="Arraste para enviar proposta">
      <SumCard rows={[["drop", "Trabalho", "Reparo de vazamento"], ["calendar", "Quando", "Ter, 15 jun · Tarde"], ["dollar", "Mão de obra", "R$ 180"], ["wrench", "Peças", "~R$ 40–80 (a custo)"]]} />
      <Payout gross={180} grossLabel="Mão de obra" note="A comissão incide só sobre a mão de obra. Peças são repassadas ao cliente a custo." />
      <MsgField />
    </Wiz>
  );
}

/* ============================================================ BEAUTY · HAIR (5) */
function PB_BT1() {
  return (
    <Wiz cat="Hair at home" step={1} total={5} title="Revisar a solicitação" sub="See what the client is looking for.">
      <JobReview icon="scissors" title="Beauty · Hair at home" loc="Alameda Santos, 45 · 2.2 km" name="Bruno R." rating={4.7} jobs={18}
        quote="Haircut, keep length on top, tidy sides and neckline. Matte finish." />
      <SecLbl>Requested</SecLbl>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="chip">Haircut</span>
        <span className="chip">Medium length</span>
        <span className="chip">+ Beard</span>
      </div>
    </Wiz>
  );
}
function PB_BT2() {
  return (
    <Wiz cat="Hair at home" step={2} total={5} title="Confirm your scope" sub="Select the services you'll provide." footerBack>
      <Opt icon="scissors" title="Haircut" sub="Wash, cut & finish" sel />
      <Opt icon="sparkles" title="Beard trim" sub="Shape & line up" sel />
      <Opt icon="sunny-outline" title="Styling" sub="Optional add-on" />
    </Wiz>
  );
}
function PB_BT3() {
  const slots = [["09:00"], ["10:30", true], ["12:00"], ["14:00", false, true], ["15:30"], ["17:00"]];
  return (
    <Wiz cat="Hair at home" step={3} total={5} title="Pick a time" sub="Choose a slot within the client's window." footerBack>
      <SecLbl>Client available · Sat, Jun 19</SecLbl>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {slots.map(([t, sel, off]) => <div key={t} className={"slot" + (sel ? " sel" : "") + (off ? " off" : "")}>{t}</div>)}
      </div>
      <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="clock" size={18} style={{ color: "var(--accent)" }} />
        <div className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>You'll block</div>
        <strong style={{ fontSize: 14 }}>~50 min</strong>
      </div>
    </Wiz>
  );
}
function PB_BT4() {
  return (
    <Wiz cat="Hair at home" step={4} total={5} title="Your price" sub="Set your bid for this appointment." footerBack>
      <BudgetMeter label="Your price" mode="bid" work="Haircut + beard" value={120} min={60} max={240} bandLo={90} bandHi={150} regionAvg={110} pill="Area average" pillIcon="location" />
      <SecLbl>Deposit</SecLbl>
      <div className="opt sel">
        <span className="opt-ic"><Icon name="shield" size={22} /></span>
        <div className="grow"><div style={{ fontWeight: 700, fontSize: 15 }}>Require 20% deposit</div><div className="muted" style={{ fontSize: 12.5 }}>Reduces no-shows · R$ 24</div></div>
        <span className="toggle on" />
      </div>
    </Wiz>
  );
}
function PB_BT5() {
  return (
    <Wiz cat="Hair at home" step={5} total={5} title="Revisar & enviar proposta" sub="Confirme sua oferta antes de enviar." footerBack slide slideLabel="Arraste para enviar proposta">
      <SumCard rows={[["scissors", "Service", "Haircut + beard trim"], ["calendar", "When", "Sat, Jun 19 · 10:30"], ["dollar", "Price", "R$ 120"], ["shield", "Deposit", "R$ 24 (20%)"]]} />
      <Payout gross={120} />
      <MsgField />
    </Wiz>
  );
}

window.BID_FLOWS = {
  roadside: { title: "Enviar proposta · Veicular / urgente (2 etapas)", subtitle: "Proposta rápida para urgência — preço & chegada → revisar & enviar.", steps: [["Step 1 · Price & ETA", PB_RS1], ["Step 2 · Send", PB_RS2]] },
  home: { title: "Enviar proposta · Casa / agendado (4 etapas)", subtitle: "Revisar → janela → preço & peças → enviar.", steps: [["Step 1 · Review", PB_HM1], ["Step 2 · Window", PB_HM2], ["Step 3 · Price & parts", PB_HM3], ["Step 4 · Send", PB_HM4]] },
};

/* ============================================================ PROVIDER · ASK THE CLIENT FOR MORE INFO */
function ProviderRequestInfo() {
  const qs = [
    ["Pode enviar uma foto do vazamento embaixo da pia?", true],
    ["Qual a marca/modelo da torneira?", true],
    ["O registro está acessível?", false],
    ["Há água acumulada agora?", false],
  ];
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Perguntar ao cliente</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <JobReview icon="drop" title="Casa · Reparo de vazamento" loc="Rua Augusta, 920 · 1.3 km" name="Carla M." rating={4.9} jobs={61}
            quote="Kitchen sink leaking under the cabinet, draining slowly." />
          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11, background: "var(--accent-soft)", boxShadow: "none" }}>
            <Icon name="chat" size={19} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Precisa de mais detalhes para orçar? Pergunte antes de propor.</div>
          </div>

          <SecLbl>Perguntas sugeridas</SecLbl>
          {qs.map(([q, sel], i) => (
            <div key={i} className={"qrow" + (sel ? " sel" : "")}>
              <span className="qbox">{sel && <Icon name="check" size={13} sw={3} />}</span>
              <span className="qtext grow">{q}</span>
            </div>
          ))}

          <SecLbl>Escreva a sua</SecLbl>
          <div className="field" style={{ minHeight: 56 }}>
            <div className="fv ph">Escreva uma pergunta ao cliente…</div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn ghost" style={{ width: "auto", padding: "15px 18px" }}><Icon name="dollar" size={18} /></button>
        <button className="btn grad" style={{ flex: 1 }}>Enviar 2 perguntas <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

/* ============================================================ CUSTOMER · ANSWER PROVIDER QUESTIONS */
function CustomerAnswerInfo() {
  return (
    <>
      <div className="backbar">
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Perguntas de Rafael C.</span>
      </div>
      <div className="scroll">
        <div className="content" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 15 }}>
            <div className="row">
              <div className="av-init" style={{ width: 40, height: 40, borderRadius: 13, fontSize: 14, background: "#3b82f6" }}>RC</div>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Rafael C. quer detalhes</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Responda para um orçamento preciso</div>
              </div>
              <span className="badge b-open dot">Pré-proposta</span>
            </div>
          </div>

          <div className="q-ans">
            <div className="qq">Pode enviar uma foto do vazamento embaixo da pia?</div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <div className="ph-img" style={{ width: 72, height: 72 }}>photo</div>
              <div className="card flat" style={{ width: 72, height: 72, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: "var(--ink-3)", padding: 0 }}>
                <Icon name="camera" size={20} /><span style={{ fontSize: 10.5, fontWeight: 700 }}>Add</span>
              </div>
            </div>
          </div>

          <div className="q-ans">
            <div className="qq">Qual a marca/modelo da torneira?</div>
            <div className="aa">Deca, monocomando — cerca de 4 anos.</div>
          </div>

          <div className="card flat" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="shield" size={19} style={{ color: "var(--ok)", flex: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600 }} className="muted">Suas respostas são vistas só por quem está propondo neste trabalho.</div>
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn grad" style={{ flex: 1 }}>Enviar respostas <Icon name="arrowR" size={18} /></button>
      </div>
    </>
  );
}

Object.assign(window, { ProviderRequestInfo, CustomerAnswerInfo });
