# -*- coding: utf-8 -*-
"""Gera as páginas de serviço × cidade a partir de _dados.json.

Por que existem: socorro veicular é busca de intenção local com urgência máxima
("guincho 24h rio preto", "chaveiro automotivo perto de mim"). Essas buscas têm
a maior intenção comercial do funil e CPC caro. Com uma página só, o site não
ranqueia para nada disso e o CAC fica 100% pago para sempre.

Por que geradas e não escritas à mão: quando a segunda praça abrir, é editar o
JSON e rodar de novo — não é duplicar seis arquivos e esquecer de atualizar
metade.

Por que só seis, e não as doze categorias do catálogo: página de serviço×cidade
sem conteúdo próprio é doorway page, e o Google trata como spam — o efeito é o
oposto do pretendido. Cada página aqui responde o que só ela responde: quando
chamar, o que muda o preço, o que fazer enquanto espera, e três perguntas
específicas daquele serviço. Se não houver o que dizer de específico, é melhor
não gerar a página.

    python landing/servicos/gerar.py

Regenera tudo. Os arquivos gerados são versionados: o deploy é um file_server
servindo o diretório, não há build no servidor.
"""
import html
import io
import json
import os
import shutil
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://chamafacil.app'


def esc(t):
    return html.escape(str(t), quote=True)


def pagina(servico, cidade, irmaos):
    url = f"{BASE}/servicos/{servico['slug']}/{cidade['slug']}/"
    caminho_raiz = '../../..'

    quando = '\n'.join(
        f'        <li>{esc(i)}</li>' for i in servico['quando'])
    preco = '\n'.join(
        f'        <li>{esc(i)}</li>' for i in servico['preco'])
    enquanto = '\n'.join(
        f'        <li>{esc(i)}</li>' for i in servico['enquanto'])

    faq_html = '\n'.join(
        f'''      <div class="sv-faqitem">
        <h3>{esc(f['p'])}</h3>
        <p>{esc(f['r'])}</p>
      </div>''' for f in servico['faq'])

    # O schema tem que repetir o texto visível: resposta estruturada diferente
    # da que está na página é motivo de perder o rich result.
    faq_ld = {
        '@type': 'FAQPage',
        'mainEntity': [
            {'@type': 'Question', 'name': f['p'],
             'acceptedAnswer': {'@type': 'Answer', 'text': f['r']}}
            for f in servico['faq']
        ],
    }
    servico_ld = {
        '@type': 'Service',
        'name': f"{servico['nome']} em {cidade['nome']}",
        'serviceType': servico['nome'],
        'description': servico['descricao'],
        'areaServed': {'@type': 'City', 'name': cidade['nome'],
                       'addressRegion': cidade['uf'], 'addressCountry': 'BR'},
        'provider': {'@type': 'Organization', 'name': 'Chama Fácil',
                     'url': BASE + '/'},
    }
    trilha_ld = {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': BASE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Serviços', 'item': BASE + '/#services'},
            {'@type': 'ListItem', 'position': 3,
             'name': f"{servico['nome']} em {cidade['curto']}", 'item': url},
        ],
    }
    ld = json.dumps({'@context': 'https://schema.org',
                     '@graph': [servico_ld, faq_ld, trilha_ld]},
                    ensure_ascii=False, indent=2)

    outros = '\n'.join(
        f'''      <a class="sv-outro" href="../../{o['slug']}/{cidade['slug']}/">'''
        f'''<span data-ic="{esc(o['icone'])}" data-sz="18"></span>{esc(o['nome'])}</a>'''
        for o in irmaos)

    return f'''<!DOCTYPE html>
<!-- GERADO por landing/servicos/gerar.py — não edite à mão.
     O conteúdo vem de landing/servicos/_dados.json. -->
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{esc(servico['titulo'])}</title>
<link rel="icon" type="image/svg+xml" href="{caminho_raiz}/logo.svg" />
<meta name="description" content="{esc(servico['descricao'])}" />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index,follow" />

<meta property="og:type" content="website" />
<meta property="og:url" content="{url}" />
<meta property="og:site_name" content="Chama Fácil" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:title" content="{esc(servico['titulo'])}" />
<meta property="og:description" content="{esc(servico['descricao'])}" />
<meta property="og:image" content="{BASE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="preload" href="{caminho_raiz}/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="{caminho_raiz}/fonts/fonts.css" />
<link rel="stylesheet" href="{caminho_raiz}/servicos/servico.css" />
<script>
  (function () {{
    try {{
      var t = localStorage.getItem("cf_theme");
      if (t !== "dark" && t !== "light") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", t);
    }} catch (e) {{}}
  }})();
</script>
<script type="application/ld+json">
{ld}
</script>
</head>
<body>

<nav class="sv-nav"><div class="sv-wrap">
  <a class="sv-logo" href="{caminho_raiz}/"><img src="{caminho_raiz}/logo.svg" alt="" />Chama Fácil</a>
  <span class="sv-spacer"></span>
  <a class="sv-btn" href="{caminho_raiz}/#join">Entrar na lista</a>
</div></nav>

<main>
  <nav class="sv-trilha" aria-label="Você está aqui"><div class="sv-wrap">
    <a href="{caminho_raiz}/">Início</a> <span>›</span>
    <a href="{caminho_raiz}/#services">Serviços</a> <span>›</span>
    <span aria-current="page">{esc(servico['nome'])} em {esc(cidade['curto'])}</span>
  </div></nav>

  <header class="sv-hero"><div class="sv-wrap">
    <span class="sv-eyebrow">{esc(cidade['nome'])} · {esc(cidade['uf'])}</span>
    <h1>{servico['h1']}</h1>
    <p class="sv-lead">{esc(servico['lead'])}</p>
    <a class="sv-btn grad" href="{caminho_raiz}/#join">Quero ser avisado quando abrir</a>
    <p class="sv-nota">Estamos abrindo em Rio Preto. Entre na lista e avisamos assim que ativarmos.</p>
  </div></header>

  <section class="sv-sec"><div class="sv-wrap sv-grid">
    <div>
      <h2>Quando chamar</h2>
      <ul>
{quando}
      </ul>
    </div>
    <div>
      <h2>O que muda o preço</h2>
      <ul>
{preco}
      </ul>
    </div>
  </div></section>

  <section class="sv-sec sv-alt"><div class="sv-wrap">
    <h2>O que fazer enquanto espera</h2>
    <ul class="sv-check">
{enquanto}
    </ul>
  </div></section>

  <section class="sv-sec"><div class="sv-wrap">
    <h2>Perguntas sobre {esc(servico['nome'].lower())}</h2>
    <div class="sv-faq">
{faq_html}
    </div>
  </div></section>

  <section class="sv-sec sv-alt"><div class="sv-wrap">
    <h2>Outros socorros em {esc(cidade['curto'])}</h2>
    <div class="sv-outros">
{outros}
    </div>
  </div></section>

  <section class="sv-cta"><div class="sv-wrap">
    <h2>A Chama Fácil abre primeiro em {esc(cidade['curto'])}.</h2>
    <p>Entre na lista e avisamos assim que ativarmos a cidade — quem entra cedo tem prioridade.</p>
    <a class="sv-btn grad" href="{caminho_raiz}/#join">Entrar na lista de espera</a>
  </div></section>
</main>

<footer class="sv-footer"><div class="sv-wrap">
  <a href="{caminho_raiz}/">Início</a>
  <a href="{caminho_raiz}/prestadores.html">Seja prestador</a>
  <a href="{caminho_raiz}/contato.html">Contato</a>
  <a href="{caminho_raiz}/termos.html">Termos</a>
  <a href="{caminho_raiz}/privacidade.html">Privacidade</a>
  <span class="sv-spacer"></span>
  <span class="sv-c">© Chama Fácil</span>
</div></footer>

<script src="{caminho_raiz}/vendor/lucide.min.js"></script>
<script>
  (function () {{
    var L = {{ truck: "Truck", battery: "BatteryCharging", car: "Car", key: "Key", drop: "Droplet", wrench: "Wrench" }};
    document.querySelectorAll("[data-ic]").forEach(function (el) {{
      var n = window.lucide && window.lucide.icons && window.lucide.icons[L[el.dataset.ic]];
      if (!n) return;
      var s = el.dataset.sz || 18;
      el.innerHTML = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + n.map(function (t) {{ var o = "<" + t[0], a = t[1]; for (var k in a) {{ if (k !== "key") o += " " + k + '="' + a[k] + '"'; }} return o + "/>"; }}).join("")
        + "</svg>";
    }});
  }})();
</script>
</body>
</html>
'''


def main():
    dados = json.load(io.open(os.path.join(AQUI, '_dados.json'), encoding='utf-8'))
    cidade = dados['cidade']
    servicos = dados['servicos']

    gerados = []
    for s in servicos:
        irmaos = [o for o in servicos if o['slug'] != s['slug']]
        destino = os.path.join(AQUI, s['slug'], cidade['slug'])
        if os.path.isdir(destino):
            shutil.rmtree(destino)
        os.makedirs(destino)
        alvo = os.path.join(destino, 'index.html')
        io.open(alvo, 'w', encoding='utf-8', newline='\n').write(
            pagina(s, cidade, irmaos))
        rel = f"servicos/{s['slug']}/{cidade['slug']}/"
        gerados.append(rel)
        print(f"  {rel}")

    print(f"\n{len(gerados)} páginas geradas.")
    print('Lembre de acrescentá-las ao landing/sitemap.xml se a lista mudou.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
