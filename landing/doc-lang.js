/* Troca de idioma das páginas de texto (termos, privacidade, sobre, contato).
 *
 * Diferente da index, que troca os text-nodes por dicionário, aqui cada idioma
 * tem a sua própria URL — documento jurídico precisa de endereço estável para
 * ser linkado e para provar qual versão alguém aceitou. Este arquivo só cuida
 * de duas coisas:
 *
 *   1. Guardar a escolha em `cf_lang`, a mesma chave que a index usa, para que
 *      quem clicou em EN aqui continue em inglês ao voltar para a home.
 *   2. Na primeira visita, se o navegador está em inglês e a pessoa caiu na
 *      página em português, oferecer a versão em inglês — oferecer, não
 *      redirecionar: redirecionar automático em página jurídica esconde da
 *      pessoa qual documento ela está lendo.
 */
(function () {
  "use strict";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Clicar no seletor de idioma registra a preferência antes de navegar.
  document.querySelectorAll("[data-set-lang]").forEach(function (a) {
    a.addEventListener("click", function () { set("cf_lang", a.getAttribute("data-set-lang")); });
  });

  var alt = document.querySelector('link[rel="alternate"][hreflang="en"]');
  var isEN = document.documentElement.lang === "en";
  if (isEN || !alt) return;

  // Já escolheu antes? Respeita e não pergunta de novo.
  var saved = get("cf_lang");
  if (saved === "pt" || saved === "en") return;
  if ((navigator.language || "pt").toLowerCase().indexOf("en") !== 0) return;

  var bar = document.createElement("div");
  bar.className = "doc-langbar";
  bar.innerHTML = '<span>This page is available in English.</span>' +
    '<a href="' + alt.getAttribute("href") + '" data-set-lang="en">Read in English</a>' +
    '<button type="button" aria-label="Dismiss">×</button>';
  bar.querySelector("a").addEventListener("click", function () { set("cf_lang", "en"); });
  bar.querySelector("button").addEventListener("click", function () {
    set("cf_lang", "pt");
    bar.remove();
  });
  document.body.insertBefore(bar, document.body.firstChild);
})();
