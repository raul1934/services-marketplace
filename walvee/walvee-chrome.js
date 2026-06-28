/* walvee-chrome.js — injects the shared nav + footer into landing sub-pages.
   Usage: <body data-page="services"> ... <div id="wv-nav"></div> ... <div id="wv-footer"></div>
   then <script src="walvee-chrome.js"></script> at end of body. */
(function () {
  var page = document.body.getAttribute("data-page") || "";
  var logo = '<a class="lp-logo" href="walvee Landing.html"><span class="lp-mk"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg></span>walvee</a>';

  var navLinks = [
    ["Plataforma", "walvee Landing.html#why", ""],
    ["Serviços", "walvee Servicos.html", "services"],
    ["Planos", "walvee Planos.html", "pricing"],
    ["Seja prestador", "walvee Prestador.html", "pro"],
    ["Sobre", "walvee Sobre.html", "about"],
  ];
  var linksHtml = navLinks.map(function (l) {
    return '<a href="' + l[1] + '"' + (l[2] === page ? ' class="on"' : "") + ">" + l[0] + "</a>";
  }).join("");

  var nav = document.getElementById("wv-nav");
  if (nav) {
    nav.outerHTML =
      '<nav class="lp-nav"><div class="lp-wrap">' + logo +
      '<div class="lp-links">' + linksHtml + "</div>" +
      '<span class="lp-spacer"></span>' +
      '<a class="lp-btn grad" href="walvee Landing.html#join">Acesso antecipado</a>' +
      "</div></nav>";
  }

  var foot = document.getElementById("wv-footer");
  if (foot) {
    foot.outerHTML =
      '<footer class="lp-footer"><div class="lp-wrap">' +
      '<div class="lp-col">' + logo.replace('class="lp-logo"', 'class="lp-logo" style="margin-bottom:12px"') +
        '<p style="color:var(--ink-3);font-size:13.5px;margin:0">Ajuda, rápido. Profissionais de confiança para serviços veiculares, casa e pets.</p></div>' +
      '<span class="lp-spacer"></span>' +
      '<div class="lp-col"><h4>Empresa</h4><a href="walvee Sobre.html">Sobre</a><a href="walvee Sobre.html#equipe">Carreiras</a><a href="walvee Suporte.html">Contato</a></div>' +
      '<div class="lp-col"><h4>Serviços</h4><a href="walvee Servicos.html#veicular">Veicular</a><a href="walvee Servicos.html#casa">Casa</a><a href="walvee Servicos.html#pets">Pets</a></div>' +
      '<div class="lp-col"><h4>Prestadores</h4><a href="walvee Prestador.html">Seja prestador</a><a href="walvee Planos.html">Planos</a><a href="walvee Suporte.html">Suporte</a></div>' +
      '<div class="lp-col"><h4>Jurídico</h4><a href="walvee Legal.html#termos">Termos</a><a href="walvee Legal.html#privacidade">Privacidade</a></div>' +
      "</div></footer>";
  }

  // reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // faq accordion
  document.querySelectorAll(".lp-faqq").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement, open = item.classList.contains("open");
      document.querySelectorAll(".lp-faqitem.open").forEach(function (i) { i.classList.remove("open"); });
      if (!open) item.classList.add("open");
    });
  });

  // inline icons
  var ICONS = {
    car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11 M5 11h14v5H5z M7 16v2M17 16v2 M7.5 13.5h.01M16.5 13.5h.01",
    drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
    paw: "M8 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 8 9z M16 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 16 9z M5.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 21c2.5 0 4.5-1.8 4.5-3.8 0-1.6-1.4-2.7-3-3.6-.8-.4-1-1-1.5-1s-.7.6-1.5 1c-1.6.9-3 2-3 3.6C7.5 19.2 9.5 21 12 21z",
    flash: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    dollar: "M12 2v20 M16 6.5C16 5 14.5 4 12.5 4S9 5 9 6.8c0 3.7 7 2.2 7 5.7 0 1.8-1.6 2.8-3.6 2.8S8 14.2 8 12.7",
    star: "M12 3l2.5 5.5L20.5 9l-4.5 4 1.2 6L12 16l-5.2 3 1.2-6L3.5 9l6-0.5L12 3z",
    navigate: "M3 11l19-9-9 19-2-8-8-2z",
    pix: "M12 3.2l3.4 3.4a2.2 2.2 0 0 0 1.6.6h1.8 M12 20.8l3.4-3.4a2.2 2.2 0 0 1 1.6-.6h1.8 M12 3.2L8.6 6.6A2.2 2.2 0 0 1 7 7.2H5.2 M12 20.8l-3.4-3.4A2.2 2.2 0 0 0 7 16.8H5.2 M3.4 9.4L1.8 11a1.4 1.4 0 0 0 0 2l1.6 1.6 M20.6 9.4L22.2 11a1.4 1.4 0 0 1 0 2l-1.6 1.6",
    shieldCheck: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4",
    check: "M5 13l4 4L19 7",
    pin: "M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z M12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
    clock: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    chat: "M21 11.5a8 8 0 0 1-11.5 7.2L3 21l2.3-6.5A8 8 0 1 1 21 11.5z",
    phone: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L17 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
    key: "M14 7a4 4 0 1 1-3.5 6L7 16.5 5 18l-2-.5L3 15l.5-2L10.5 10A4 4 0 0 1 14 7z",
    wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.2L3 18v3h3l6.5-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.1-.5-.5-2.1 2.7-2.5z",
    sparkles: "M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z",
    truck: "M3 6h11v9H3z M14 9h4l3 3v3h-7 M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    battery: "M3 8h14v8H3z M20 11v2 M7 9l-1.5 3H8l-1 3",
    heart: "M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20z",
    location: "M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z",
    mail: "M3 6h18v12H3z M3 7l9 6 9-6",
    fwd: "M9 18l6-6-6-6",
    users: "M16 20a4 4 0 0 0-8 0 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 20a4 4 0 0 0-3-3.8 M18 4.2a4 4 0 0 1 0 7.6",
    rocket: "M5 15c-1.5 1-2 5-2 5s4-.5 5-2c.6-.8.5-2-.2-2.8-.8-.7-2-.8-2.8-.2z M9 13l-2-2c1-3 4-7 9-8 1 5-3 8-6 9z M14 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
    headset: "M4 13a8 8 0 0 1 16 0 M4 13v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 1 M20 13v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 1",
  };
  document.querySelectorAll("[data-ic]").forEach(function (el) {
    var d = ICONS[el.getAttribute("data-ic")]; if (!d) return;
    var size = el.getAttribute("data-sz") || 26;
    var paths = d.split(" M").map(function (seg, i) { return '<path d="' + (i ? "M" : "") + seg + '"/>'; }).join("");
    el.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
  });
})();
