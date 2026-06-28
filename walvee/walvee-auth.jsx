/* walvee-auth.jsx — sign up / login (phone or email + Google) and the
   customer onboarding tutorial. Exposes the screens + window.TUTORIAL. */

/* Google "G" mark for the standard sign-in button. */
function GoogleG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const BrandMark = () => (
  <div className="brand-mark">
    <div className="brand-logo"><Icon name="navigate" size={24} style={{ color: "#fff" }} fill="current" /></div>
    <span className="brand-name">walvee</span>
  </div>
);

function Field({ icon, prefix, value, ph, focus }) {
  return (
    <div className={"input" + (focus ? " focus" : "")}>
      {icon && <span className="ic"><Icon name={icon} size={19} /></span>}
      {prefix && <span className="prefix">{prefix}</span>}
      <span className={"val" + (ph ? " ph" : "")}>{value}</span>
    </div>
  );
}

/* ============================================================ SIGN UP */
function SignUpScreen({ mode = "phone" }) {
  return (
    <div className="auth">
      <div className="appbar" style={{ paddingTop: 18 }}><BrandMark /></div>
      <div className="auth-body">
        <div>
          <div className="auth-h1">Crie sua conta</div>
          <div className="auth-sub">Ajuda de profissionais a minutos de você.</div>
        </div>

        <Field icon="user" value="Mateus Almeida" />

        <div className="segment">
          <div className={"seg" + (mode === "phone" ? " active" : "")}><Icon name="phone" size={16} /> Phone</div>
          <div className={"seg" + (mode === "email" ? " active" : "")}><Icon name="chat" size={16} /> E-mail</div>
        </div>
        {mode === "phone"
          ? <Field icon="phone" prefix="+55" value="11 98765-4321" focus />
          : <Field icon="chat" value="mateus@email.com" focus />}
        <div className="faint" style={{ fontSize: 12, fontWeight: 600, marginTop: -4 }}>
          Enviaremos um código. Telefone ou e-mail é obrigatório.
        </div>

        <button className="btn grad" style={{ marginTop: 4 }}>Criar conta <Icon name="arrowR" size={18} /></button>

        <div className="divider-or">or</div>
        <button className="gbtn"><GoogleG /> Cadastrar com o Google</button>

        <span style={{ flex: 1 }} />
        <div className="legal">Ao continuar você aceita os <a>Terms</a> and <a>Política de Privacidade</a>.</div>
        <div className="auth-foot">Já tem conta? <a>Entrar</a></div>
      </div>
    </div>
  );
}

/* ============================================================ LOGIN */
function LoginScreen({ mode = "phone" }) {
  return (
    <div className="auth">
      <div className="appbar" style={{ paddingTop: 18 }}><BrandMark /></div>
      <div className="auth-body">
        <div>
          <div className="auth-h1">Bem-vindo de volta</div>
          <div className="auth-sub">Entrar to request help or track a job.</div>
        </div>

        <div className="segment">
          <div className={"seg" + (mode === "phone" ? " active" : "")}><Icon name="phone" size={16} /> Phone</div>
          <div className={"seg" + (mode === "email" ? " active" : "")}><Icon name="chat" size={16} /> E-mail</div>
        </div>
        {mode === "phone"
          ? <Field icon="phone" prefix="+55" value="11 98765-4321" focus />
          : <Field icon="chat" value="mateus@email.com" focus />}

        <button className="btn grad" style={{ marginTop: 4 }}>Continue <Icon name="arrowR" size={18} /></button>

        <div className="divider-or">or</div>
        <button className="gbtn"><GoogleG /> Continuar com o Google</button>

        <span style={{ flex: 1 }} />
        <div className="auth-foot">Novo na walvee? <a>Criar conta</a></div>
      </div>
    </div>
  );
}

/* ============================================================ VERIFY (OTP) */
function VerifyScreen() {
  const code = ["4", "9", "1", "", "", ""];
  return (
    <div className="auth">
      <div className="backbar" style={{ paddingTop: 14 }}>
        <div className="backbtn"><Icon name="back" size={20} /></div>
        <span className="bb-title">Verificar</span>
      </div>
      <div className="auth-body">
        <div>
          <div className="auth-h1">Digite o código</div>
          <div className="auth-sub">Enviamos um código de 6 dígitos para <b style={{ color: "var(--ink)" }}>+55 11 98765-4321</b>.</div>
        </div>
        <div className="otp-row">
          {code.map((d, i) => (
            <div key={i} className={"otp-box" + (d ? " filled" : "") + (i === 3 ? " active" : "")}>{d}</div>
          ))}
        </div>
        <button className="btn grad" style={{ marginTop: 4 }}>Verify &amp; continue</button>
        <div className="auth-foot" style={{ marginTop: 2 }}>Não recebeu? <a>Reenviar em 0:24</a></div>
        <span style={{ flex: 1 }} />
        <div className="legal">Número errado? <a>Editar</a></div>
      </div>
    </div>
  );
}

/* ============================================================ ONBOARDING TUTORIAL */
/* Mini bid card used in the "compare bids" scene. */
function BidMini({ initials, color, name, rating, price, eta }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div className="av-init" style={{ width: 34, height: 34, borderRadius: 11, fontSize: 12, background: color }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12.5, color: "var(--ink)" }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--accent-2)" }}>
          <Icon name="star" size={11} fill="current" /><span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{rating}</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)", fontFamily: "var(--font-head)", whiteSpace: "nowrap" }}>R$ {price}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{eta} min</div>
      </div>
    </div>
  );
}

function SceneHelp() {
  const cats = [["car", "Roadside"], ["drop", "Home"], ["key", "Locksmith"], ["paw", "Pets"]];
  return (
    <div className="tut-scene">
      <div className="tmini" style={{ width: 238, transform: "rotate(-4deg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
          <span className="cat-ic" style={{ width: 30, height: 30, borderRadius: 9 }}><Icon name="search" size={16} /></span>
          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)" }}>What do you need?</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {cats.map(([ic, n]) => (
            <div key={n} className="tmini-tile">
              <span className="cat-ic" style={{ width: 30, height: 30, borderRadius: 9 }}><Icon name={ic} size={16} /></span>
              <span style={{ fontWeight: 700, fontSize: 12, color: "var(--ink)" }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tut-float" style={{ position: "absolute", bottom: 20, right: 14, transform: "rotate(3deg)" }}>
        <span style={{ color: "var(--accent)" }}><Icon name="flash" size={15} fill="current" /></span> Profissional em ~6 min
      </div>
    </div>
  );
}

function SceneBids() {
  return (
    <div className="tut-scene">
      <div className="tmini" style={{ position: "absolute", width: 216, transform: "translate(40px, 50px) rotate(6deg)", opacity: .94 }}>
        <BidMini initials="JS" color="#10b981" name="João S." rating="4.7" price="95" eta="12" />
      </div>
      <div className="tmini" style={{ position: "absolute", width: 224, transform: "translate(-26px, -34px) rotate(-3deg)" }}>
        <span className="badge b-open" style={{ position: "absolute", top: -9, right: 14, fontSize: 10 }}>Best match</span>
        <BidMini initials="RC" color="#3b82f6" name="Rafael C." rating="4.9" price="120" eta="8" />
      </div>
    </div>
  );
}

function SceneTrack() {
  return (
    <div className="tut-scene">
      <div className="tmini" style={{ width: 240, padding: 0, overflow: "hidden", transform: "rotate(-3deg)" }}>
        <div style={{ position: "relative", height: 124, background: "var(--surface-2)" }}>
          <svg viewBox="0 0 240 124" width="100%" height="124" preserveAspectRatio="xMidYMid slice">
            <g stroke="var(--ink)" strokeWidth="8" opacity="0.06" fill="none" strokeLinecap="round"><path d="M-10 44H250M-10 92H250M70 -10V134M170 -10V134" /></g>
            <path d="M40 96 C 90 96, 96 50, 150 44 S 200 30, 214 26" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" />
            <circle cx="40" cy="96" r="6" fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
            <circle cx="214" cy="26" r="7" fill="var(--ink)" stroke="#fff" strokeWidth="2.5" />
          </svg>
          <div className="tut-float" style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", fontSize: 11 }}>
            <span style={{ color: "var(--accent)" }}><Icon name="navigate" size={13} /></span> 6 min de distância
          </div>
        </div>
        <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 9 }}>
          <span className="cat-ic" style={{ width: 30, height: 30, borderRadius: 9 }}><Icon name="pix" size={15} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 12, color: "var(--ink)" }}>Pago com Pix</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ok)" }}>Protegido pela walvee</div>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, fontFamily: "var(--font-head)", color: "var(--ink)" }}>R$ 120</span>
        </div>
      </div>
    </div>
  );
}

const TUT_SLIDES = [
  { eyebrow: "01 · Peça ajuda", Scene: SceneHelp, title: "Ajuda a um toque", body: "Veicular, casa ou pets — chame um profissional em segundos, onde você estiver." },
  { eyebrow: "02 · Compare", Scene: SceneBids, title: "Compare propostas reais", body: "Veja ofertas de profissionais próximos com preço e nota, e escolha a que cabe no seu bolso." },
  { eyebrow: "03 · Acompanhe & pague", Scene: SceneTrack, title: "Acompanhe e pague com segurança", body: "Acompanhe no mapa e pague por Pix, cartão ou dinheiro ao concluir." },
];

function TutorialScreen({ i = 0 }) {
  const s = TUT_SLIDES[i];
  const last = i === TUT_SLIDES.length - 1;
  const Scene = s.Scene;
  return (
    <div className="tut">
      <div className="tut-hero">
        <div className="blob" style={{ width: 220, height: 220, top: -60, right: -50 }} />
        <div className="blob" style={{ width: 140, height: 140, bottom: 30, left: -40 }} />
        <Scene />
      </div>
      <div className="tut-card">
        <div className="dots">
          {TUT_SLIDES.map((_, k) => <span key={k} className={"d" + (k === i ? " on" : "")} />)}
        </div>
        <div className="tut-eyebrow">{s.eyebrow}</div>
        <div className="tut-h">{s.title}</div>
        <div className="tut-b">{s.body}</div>
        <div className="row" style={{ gap: 12, marginTop: 4 }}>
          <span className="auth-foot" style={{ flex: 1, textAlign: "left", color: "var(--ink-3)" }}>{last ? "" : "Pular"}</span>
          <button className="btn grad" style={{ width: "auto", padding: "15px 26px" }}>
            {last ? "Começar" : "Próximo"} <Icon name="arrowR" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GoogleG, SignUpScreen, LoginScreen, VerifyScreen, TutorialScreen, TUT_SLIDES });
