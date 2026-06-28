/* walvee-kit.jsx — icons, phone shell, status bar, small helpers.
   Exposes to window: Icon, Phone, StatusBar, TabBar, Stars, Pin. */

const P = (d, extra) => ({ d, ...extra });
const ICONS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  mic: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0 M12 18v3 M8 21h8",
  route: "M6 19a3 3 0 1 0 0-6h12a3 3 0 1 0 0-6 M6 7a3 3 0 1 0 0-.01 M18 19a3 3 0 1 0 0-.01",
  snow: "M12 2v20 M4 7l16 10 M20 7L4 17 M12 2l-2.5 2.5M12 2l2.5 2.5 M12 22l-2.5-2.5M12 22l2.5-2.5 M4 7l.3 3.4M4 7l3.2-1 M20 17l-.3-3.4M20 17l-3.2 1 M20 7l-3.2-1M20 7l-.3 3.4 M4 17l3.2 1M4 17l.3-3.4",
  clipboard: "M9 4h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V5a1 1 0 0 1 1-1z M9 4a1 1 0 0 0-1 1v1h8V5a1 1 0 0 0-1-1 M9 12l2 2 4-4",
  box: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  users: "M16 20a4 4 0 0 0-8 0 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 20a4 4 0 0 0-3-3.8 M18 4.2a4 4 0 0 1 0 7.6",
  play: "M7 5l12 7-12 7z",
  flag: "M5 21V4 M5 4h12l-2 4 2 4H5",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 8v4l3 2",
  gauge: "M12 14a2 2 0 1 0 0-.01 M12 14l4-4 M4.5 18a9 9 0 1 1 15 0",
  search: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M21 21l-4.3-4.3",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
  back: "M15 18l-6-6 6-6",
  fwd: "M9 18l6-6-6-6",
  home: "M3 10.5L12 3l9 7.5 M5 9.5V21h14V9.5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  user: "M20 21a8 8 0 1 0-16 0 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  flash: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  calendar: "M8 2v4M16 2v4M3 9h18 M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  camera: "M14.5 4l1.5 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  location: "M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z M12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
  navigate: "M3 11l19-9-9 19-2-8-8-2z",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11 M5 11h14v5H5z M7 16v2M17 16v2 M7.5 13.5h.01M16.5 13.5h.01",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.2L3 18v3h3l6.5-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.1-.5-.5-2.1 2.7-2.5z",
  sparkles: "M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z",
  paw: "M8 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 8 9z M16 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 16 9z M5.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 21c2.5 0 4.5-1.8 4.5-3.8 0-1.6-1.4-2.7-3-3.6-.8-.4-1-1-1.5-1s-.7.6-1.5 1c-1.6.9-3 2-3 3.6C7.5 19.2 9.5 21 12 21z",
  star: "M12 3l2.5 5.5L20.5 9l-4.5 4 1.2 6L12 16l-5.2 3 1.2-6L3.5 9l6-0.5L12 3z",
  power: "M12 4v8 M7.5 7.5a7 7 0 1 0 9 0",
  check: "M5 13l4 4L19 7",
  clock: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4",
  phone: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L17 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  chat: "M21 11.5a8 8 0 0 1-11.5 7.2L3 21l2.3-6.5A8 8 0 1 1 21 11.5z",
  grip: "M5 9h14M5 15h14",
  menu: "M4 7h16M4 12h16M4 17h16",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  filter: "M3 5h18l-7 8v6l-4-2v-4L3 5z",
  battery: "M3 8h14v8H3z M20 11v2 M7 9l-1.5 3H8l-1 3",
  key: "M14 7a4 4 0 1 1-3.5 6L7 16.5 5 18l-2-.5L3 15l.5-2L10.5 10A4 4 0 0 1 14 7z",
  briefcase: "M4 8h16v11H4z M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 13h16",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12l1.5 1-1 2.5-1.8-.3a6.7 6.7 0 0 1-1.5.9L15 18h-3l-.3-1.9a6.7 6.7 0 0 1-1.5-.9l-1.8.3-1-2.5L8 12l-1.5-1 1-2.5 1.8.3a6.7 6.7 0 0 1 1.5-.9L12 6h3l.3 1.9a6.7 6.7 0 0 1 1.5.9l1.8-.3 1 2.5z",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  shieldCheck: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
  pin: "M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z",
  dollar: "M12 2v20 M16 6.5C16 5 14.5 4 12.5 4S9 5 9 6.8c0 3.7 7 2.2 7 5.7 0 1.8-1.6 2.8-3.6 2.8S8 14.2 8 12.7",
  edit: "M16 3l5 5L8 21H3v-5L16 3z",
  heart: "M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20z",
  wifi: "M5 12.5a10 10 0 0 1 14 0 M8 15.5a6 6 0 0 1 8 0 M12 19h.01",
  truck: "M3 6h11v9H3z M14 9h4l3 3v3h-7 M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  scissors: "M6 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M6 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M8.2 9.5L20 18 M8.2 14.5L20 6",
  close: "M6 6l12 12M18 6L6 18",
  chevronsR: "M5 17l5-5-5-5 M12 17l5-5-5-5",
  "home-outline": "M3 10.5L12 3l9 7.5 M5 9.5V21h14V9.5",
  "enter-outline": "M14 3h5v18h-5 M3 12h11 M10 8l4 4-4 4",
  "color-palette-outline": "M12 3a9 9 0 1 0 .5 18c1.1 0 1.6-1.3 1-2.2-.6-.9 0-2.1 1-2.1H17a4 4 0 0 0 4-4c0-5-4-9.7-9-9.7z M8 13.5h.01M9.5 9h.01M14.5 9h.01M16 13h.01",
  "sunny-outline": "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8",
  "bag-outline": "M6 8h12l1 12H5L6 8z M9 8a3 3 0 0 1 6 0",
  card: "M2.5 7h19a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M1.5 10.5h21 M5 14h4",
  pix: "M12 3.2l3.4 3.4a2.2 2.2 0 0 0 1.6.6l1.8.0 M12 20.8l3.4-3.4a2.2 2.2 0 0 1 1.6-.6h1.8 M12 3.2L8.6 6.6A2.2 2.2 0 0 1 7 7.2H5.2 M12 20.8l-3.4-3.4A2.2 2.2 0 0 0 7 16.8H5.2 M3.4 9.4L1.8 11a1.4 1.4 0 0 0 0 2l1.6 1.6 M20.6 9.4L22.2 11a1.4 1.4 0 0 1 0 2l-1.6 1.6",
  cash: "M2 6h20v12H2z M12 12m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0 M5 9.5h.01M19 14.5h.01",
};

/* Map our internal icon names → Lucide icon names (PascalCase).
   Names not listed here are auto-PascalCased (e.g. "wrench" → "Wrench").
   Anything Lucide doesn't ship (e.g. "pix") falls back to the ICONS path above. */
const LU_ALIAS = {
  back: "ArrowLeft", fwd: "ChevronRight", arrowR: "ArrowRight", chevronsR: "ChevronsRight",
  home: "House", "home-outline": "House", "enter-outline": "LogIn", "sunny-outline": "Sun",
  "color-palette-outline": "Palette", "bag-outline": "ShoppingBag", card: "CreditCard",
  flash: "Zap", location: "MapPin", pin: "MapPin", navigate: "Navigation", drop: "Droplets",
  paw: "PawPrint", chat: "MessageCircle", grip: "LayoutGrid", logout: "LogOut", menu: "Menu",
  filter: "Filter", battery: "BatteryWarning", dollar: "DollarSign", edit: "SquarePen",
  refresh: "RefreshCw", snow: "Snowflake", clipboard: "ClipboardCheck", box: "Package",
  cash: "Banknote", close: "X", check: "Check", shieldCheck: "ShieldCheck",
};

function Icon({ name, size = 24, sw = 2, fill = "none", className, style }) {
  // Primary source: the Lucide icon library (loaded as window.lucide UMD).
  // Custom names map to Lucide PascalCase via LU_ALIAS; anything Lucide lacks
  // (e.g. "pix") falls back to the hand-authored path in ICONS.
  const lib = (typeof window !== "undefined" && window.lucide) || null;
  const pas = LU_ALIAS[name] || name.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
  let node = lib && (lib[pas] || (lib.icons && lib.icons[pas]));
  const common = {
    className, style, width: size, height: size, viewBox: "0 0 24 24",
    fill: fill === "current" ? "currentColor" : "none",
    stroke: fill === "current" ? "none" : "currentColor",
    strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
  };
  // Lucide UMD shape: ["svg", attrs, [ [tag, attrs], ... ]]. icons[Name] is the bare child list.
  if (Array.isArray(node)) {
    let kids = node;
    if (typeof node[0] === "string" && node[0].toLowerCase() === "svg") kids = node[2];
    if (Array.isArray(kids) && kids.every((k) => Array.isArray(k))) {
      return (
        <svg {...common}>
          {kids.map(([tag, attrs], i) => {
            const a = {};
            for (const k in attrs) {
              if (k === "key" || k.startsWith("stroke") || k === "fill" || k === "xmlns") continue;
              a[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
            }
            return React.createElement(tag, { key: i, ...a });
          })}
        </svg>
      );
    }
  }
  // fallback — hand-authored path
  const d = ICONS[name] || "";
  return (
    <svg {...common}>
      {d.split(" M").map((seg, i) => <path key={i} d={(i ? "M" : "") + seg} />)}
    </svg>
  );
}

function StatusBar({ onAccent }) {
  return (
    <div className={"sb" + (onAccent ? " on-accent" : "")}>
      <span className="sb-time">9:41</span>
      <span className="sb-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 2.5c2.3 0 4.4.9 6 2.4l1.1-1.2A10.4 10.4 0 0 0 8.5 0 10.4 10.4 0 0 0 1.4 3.7L2.5 5A8.4 8.4 0 0 1 8.5 2.5z" opacity="0.9"/><path d="M8.5 6c1.2 0 2.3.5 3.1 1.3l1.1-1.2A6 6 0 0 0 8.5 4 6 6 0 0 0 4.3 6.1l1.1 1.2A4.4 4.4 0 0 1 8.5 6z"/><circle cx="8.5" cy="10" r="1.6"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="21" height="12" rx="3" stroke="currentColor" opacity="0.45"/><rect x="2" y="2" width="16" height="9" rx="1.5" fill="currentColor"/><rect x="23" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/></svg>
      </span>
    </div>
  );
}

function Phone({ theme, children, accentStatus, height }) {
  return (
    <div className={"phone t-" + theme} style={height ? { height } : undefined}>
      <StatusBar onAccent={accentStatus} />
      {children}
      <div className="home-ind" />
    </div>
  );
}

function TabBar({ role = "customer", active, tabs }) {
  const list = tabs || (role === "customer"
    ? [["home", "Início"], ["list", "Pedidos"], ["user", "Perfil"]]
    : [["home", "Painel"], ["briefcase", "Trabalhos"], ["calendar", "Agenda"], ["user", "Perfil"]]);
  return (
    <div className="tabbar">
      {list.map(([ic, label, dot]) => (
        <div key={label} className={"tab" + (active === ic ? " active" : "")}>
          <span style={{ position: "relative" }}>
            <Icon name={ic} size={24} />
            {dot && <span style={{ position: "absolute", top: -2, right: -3, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--surface)" }} />}
          </span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Stars({ n = 5, val = 5, size = 16 }) {
  return (
    <span className="stars">
      {Array.from({ length: n }).map((_, i) => (
        <Icon key={i} name="star" size={size} fill={i < Math.round(val) ? "current" : "none"} />
      ))}
    </span>
  );
}

/* Slide-to-confirm control. variant: accept | success | error. */
function SlideConfirm({ variant = "accept", label, done = false, compact = false, fill = 0 }) {
  const cls = variant === "success" ? "ok" : (variant === "error" || variant === "end") ? "err" : "acc";
  const thumbIcon = done ? "check" : variant === "error" ? "close" : "chevronsR";
  return (
    <div className={"slide " + cls + (done ? " done" : "") + (compact ? " compact" : "")}>
      {!done && fill > 0 && <div className="fill" style={{ width: fill + "%" }} />}
      <div className="thumb"><Icon name={thumbIcon} size={compact ? 20 : 22} sw={2.4} /></div>
      <span className="lbl" style={{ marginLeft: done ? 0 : 26 }}>{label}</span>
    </div>
  );
}

/* Budget meter as a traffic-light speedometer: red/yellow/green zones around
   the regional average, a needle at the chosen value, and a plain-language
   likelihood line. Interactive — a currency field (+/- steppers) drives the
   needle, and dragging the needle updates the field. mode 'budget' (customer:
   higher = greener) or 'bid' (provider: lower = greener). */
function BudgetMeter({ label = "Orçamento máx.", work = "This job", min = 60, max = 300, value = 180, step = 5, bandLo = 90, bandHi = 160, regionAvg, mode = "budget", pill = "Sugerido pela walvee", pillIcon = "sparkles" }) {
  const avgV = regionAvg != null ? regionAvg : Math.round((bandLo + bandHi) / 2);
  const RED = "#ef4444", YEL = "#f5a524", GRN = "#18b368";
  const cx = 110, cy = 98, r = 80, sw = 15;
  const cl = (v) => Math.max(min, Math.min(max, v));
  const [val, setVal] = React.useState(cl(value));
  const [editing, setEditing] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const svgRef = React.useRef(null);
  const drag = React.useRef(false);

  const ang = (v) => 180 - 180 * ((cl(v) - min) / (max - min));
  const polar = (a, rr = r) => [cx + rr * Math.cos(a * Math.PI / 180), cy - rr * Math.sin(a * Math.PI / 180)];
  const arc = (a0, a1, rr = r) => {
    const [x0, y0] = polar(a0, rr), [x1, y1] = polar(a1, rr);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a0 > a1 ? 1 : 0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} ${sweep} ${x1} ${y1}`;
  };
  const fromPointer = (e) => {
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * 220;
    const py = (e.clientY - rect.top) / rect.height * 112;
    let a = Math.atan2(cy - py, px - cx) * 180 / Math.PI;
    a = Math.max(0, Math.min(180, a));
    const v = min + ((180 - a) / 180) * (max - min);
    setVal(cl(Math.round(v / step) * step));
  };
  const onDown = (e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); };
  const onMove = (e) => { if (drag.current) fromPointer(e); };
  const onUp = () => { drag.current = false; };
  const onInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setEditing(true);
    setVal(raw === "" ? "" : parseInt(raw, 10));
  };
  const commit = () => { setEditing(false); setFocus(false); setVal((v) => cl(v === "" || isNaN(v) ? avgV : v)); };
  const shown = editing ? val : cl(val || avgV);

  // zone colors low→high value; for a bid, low price is the good (green) end
  const lowC = mode === "bid" ? GRN : RED, highC = mode === "bid" ? RED : GRN;
  const zones = [[min, bandLo, lowC], [bandLo, bandHi, YEL], [bandHi, max, highC]];
  const zc = shown < bandLo ? lowC : shown <= bandHi ? YEL : highC;
  const word = zc === GRN ? "high" : zc === YEL ? "fair" : "low";
  const zcls = zc === GRN ? "z-green" : zc === YEL ? "z-yellow" : "z-red";
  const av = ang(shown);
  const [nx, ny] = polar(av, r - 12);
  const [ax, ay] = polar(ang(avgV), r + sw / 2 + 1);
  const [ax2, ay2] = polar(ang(avgV), r - sw / 2 - 1);
  const [alx, aly] = polar(ang(avgV), r + 15);
  return (
    <div className="card flat gauge">
      <div className="budget-top">
        <span className="fl" style={{ fontSize: 13 }}>{label}</span>
        <span className="sugg-pill"><Icon name={pillIcon} size={12} fill="current" /> {pill}</span>
      </div>
      <div className="gauge-wrap">
        <svg viewBox="0 0 220 112" ref={svgRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {zones.map(([z0, z1, c], i) => (
            <path key={i} d={arc(ang(z0) - 1.2, ang(z1) + 1.2)} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          ))}
          <line x1={ax} y1={ay} x2={ax2} y2={ay2} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <text x={alx} y={aly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-3)" fontFamily="var(--mono)">avg</text>
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <circle cx={nx} cy={ny} r="6" fill={zc} stroke="var(--surface)" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="7.5" fill="var(--ink)" />
          <circle cx={cx} cy={cy} r="3.2" fill="var(--surface)" />
        </svg>
      </div>
      <div className="gauge-input">
        <div className="step" onClick={() => { setEditing(false); setVal((v) => cl((parseInt(v, 10) || avgV) - step)); }}><Icon name="minus" size={20} sw={2.6} /></div>
        <div className={"cur-field" + (focus ? " focus" : "")}>
          <span className="cf-cur">R$</span>
          <input type="text" inputMode="numeric" value={shown} style={{ color: zc }}
            onFocus={() => { setFocus(true); setEditing(true); }} onBlur={commit}
            onChange={onInput} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
        </div>
        <div className="step" onClick={() => { setEditing(false); setVal((v) => cl((parseInt(v, 10) || avgV) + step)); }}><Icon name="plus" size={20} sw={2.6} /></div>
      </div>
      <div className="gauge-scale"><span>R$ {min}</span><span>R$ {max}</span></div>
      <div className={"gauge-info " + zcls}>
        <span className="gi-ic" style={{ background: zc }}><Icon name={word === "low" ? "flash" : word === "fair" ? "clock" : "check"} size={15} sw={2.6} /></span>
        <div>
          {mode === "bid"
            ? <span><b>{work}</b> custa em média <b>R$ {avgV}</b> nesta área. Sua proposta de <b>R$ {cl(shown)}</b> tem <b>{word}</b> de chance de ganhar o trabalho.</span>
            : <span><b>{work}</b> custa em média <b>R$ {avgV}</b> nesta região. Seu orçamento de <b>R$ {cl(shown)}</b> tem <b>{word}</b> de chance de ser atendido.</span>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Hamburger drawer — shared across customer & provider screens.
   Variant config (width / icons / density) lives in a tiny external
   store so the Tweaks panel can drive it from outside the screen tree. */
const WV_DRAWER_LS = "wv_drawer_cfg";
const WV_DRAWER_DEFAULTS = { width: "standard", icons: true, density: "cozy" };
let _wvDrawerCfg = (() => {
  try { return { ...WV_DRAWER_DEFAULTS, ...(JSON.parse(localStorage.getItem(WV_DRAWER_LS)) || {}) }; }
  catch (e) { return { ...WV_DRAWER_DEFAULTS }; }
})();
const _wvDrawerSubs = new Set();
function setDrawerCfg(patch) {
  _wvDrawerCfg = { ..._wvDrawerCfg, ...patch };
  try { localStorage.setItem(WV_DRAWER_LS, JSON.stringify(_wvDrawerCfg)); } catch (e) {}
  _wvDrawerSubs.forEach((f) => f());
}
function useDrawerCfg() {
  const [, force] = React.useState(0);
  React.useEffect(() => { const f = () => force((n) => n + 1); _wvDrawerSubs.add(f); return () => _wvDrawerSubs.delete(f); }, []);
  return _wvDrawerCfg;
}

const DRAWER_MENUS = {
  customer: {
    head: { name: "Mateus A.", sub: "São Paulo · SP", av: "MA", link: "Ver perfil" },
    groups: [
      { label: "Conta", items: [
        { ic: "user", t: "Meu perfil" },
        { ic: "bag-outline", t: "Meus pedidos" },
        { ic: "location", t: "Endereços salvos" },
        { ic: "card", t: "Pagamentos" },
      ] },
      { label: "Atividade", items: [
        { ic: "history", t: "Meus ativos", go: "assets" },
        { ic: "bell", t: "Notificações", badge: "3" },
      ] },
      { label: "Mais", items: [
        { ic: "briefcase", t: "Quero ser prestador" },
        { ic: "shield", t: "Ajuda & garantia" },
        { ic: "settings", t: "Configurações" },
      ] },
    ],
  },
  provider: {
    head: { name: "Rafael C.", sub: "Credenciado", av: "RC", avbg: "#3b82f6", rating: 4.9, link: "Ver perfil", go: "acct-profile" },
    groups: [
      { label: "Conta", items: [
        { ic: "user", t: "Perfil profissional", go: "acct-profile" },
        { ic: "briefcase", t: "Meus serviços", go: "acct-services" },
        { ic: "dollar", t: "Ganhos & saques", go: "acct-earn" },
      ] },
      { label: "Atividade", items: [
        { ic: "calendar", t: "Agenda", go: "agenda" },
        { ic: "star", t: "Avaliações" },
        { ic: "bell", t: "Notificações", badge: "2" },
      ] },
      { label: "Mais", items: [
        { ic: "shield", t: "Ajuda & garantia" },
        { ic: "settings", t: "Configurações" },
      ] },
    ],
  },
};
const DRAWER_W = { compact: 264, standard: 296, wide: 332 };

function AppMenu({ role = "customer" }) {
  const cfg = useDrawerCfg();
  const [open, setOpen] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);
  const close = () => { setShown(false); window.setTimeout(() => setOpen(false), 240); };
  const menu = DRAWER_MENUS[role] || DRAWER_MENUS.customer;
  const head = menu.head;
  const W = DRAWER_W[cfg.width] || DRAWER_W.standard;
  return (
    <React.Fragment>
      <button type="button" className="iconbtn wvd-burger" aria-label="Abrir menu"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <Icon name="menu" size={22} />
      </button>
      {open && (
        <div className={"wvd-scrim" + (shown ? " in" : "")} onClick={close}>
          <aside className={"wvd-panel d-" + cfg.density + (cfg.icons ? "" : " no-ic") + (shown ? " in" : "")}
            style={{ width: W }} onClick={(e) => e.stopPropagation()}>
            <div className="wvd-head">
              <div className={"wvd-av" + (head.avbg ? "" : " soft")} style={head.avbg ? { background: head.avbg } : undefined}>{head.av}</div>
              <div className="wvd-id">
                <div className="wvd-name">{head.name}</div>
                <div className="wvd-sub">{head.rating ? <React.Fragment><Icon name="star" size={12} fill="current" /> {head.rating} · </React.Fragment> : null}{head.sub}</div>
              </div>
              <button type="button" className="wvd-x" onClick={close} aria-label="Fechar"><Icon name="close" size={18} /></button>
            </div>
            <button type="button" className="wvd-view" {...(head.go ? { "data-go": head.go } : {})} onClick={() => { if (!head.go) close(); }}>
              <span>{head.link}</span><Icon name="arrowR" size={15} />
            </button>
            <nav className="wvd-nav">
              {menu.groups.map((g) => (
                <div key={g.label} className="wvd-group">
                  <div className="wvd-glabel">{g.label}</div>
                  {g.items.map((it) => (
                    <button key={it.t} type="button" className="wvd-item" {...(it.go ? { "data-go": it.go } : {})} onClick={() => { if (!it.go) close(); }}>
                      {cfg.icons && <span className="wvd-ic"><Icon name={it.ic} size={19} /></span>}
                      <span className="wvd-t">{it.t}</span>
                      {it.badge && <span className="wvd-badge">{it.badge}</span>}
                      <Icon name="fwd" size={16} className="wvd-chev" />
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <button type="button" className="wvd-foot" onClick={close}><Icon name="logout" size={18} /> Sair</button>
          </aside>
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { Icon, StatusBar, Phone, TabBar, Stars, SlideConfirm, BudgetMeter, AppMenu, setDrawerCfg, useDrawerCfg, WV_DRAWER_DEFAULTS });
