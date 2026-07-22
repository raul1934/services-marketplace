# -*- coding: utf-8 -*-
"""Baixa Manrope e Space Mono do Google Fonts para dentro de landing/fonts/.

Por que hospedar em vez de linkar: o <link> do Google Fonts é render-blocking e
custa duas conexões a mais (fonts.googleapis.com + fonts.gstatic.com) antes do
primeiro texto aparecer — caro no 4G brasileiro. De quebra, tira um terceiro do
caminho de quem visita a página, o que também simplifica o lado da LGPD.

Só os subsets latin e latin-ext entram: o site é pt-BR/en e os blocos cirílico,
grego e vietnamita seriam ~60% dos bytes sem servir a ninguém.

Os arquivos são deduplicados por hash do conteúdo, e isso não é detalhe: a
Manrope é variável, então os quatro pesos que o CSS do Google declara apontam
para o MESMO woff2. Salvar um arquivo por peso faria o browser baixar quatro
vezes a mesma coisa (URLs diferentes, entradas de cache diferentes) — pior do
que o Google Fonts, que serve uma URL só. Quando um arquivo cobre vários pesos,
os @font-face viram um só com `font-weight: menor maior`.

    python landing/fonts/fetch-fonts.py

Regera fonts.css e os .woff2 ao lado. Rode de novo quando quiser atualizar a
versão das fontes (o Google versiona no path: .../manrope/v20/...).
"""
import collections
import hashlib
import io
import os
import re
import sys
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HERE = os.path.dirname(os.path.abspath(__file__))
CSS_URL = ('https://fonts.googleapis.com/css2'
           '?family=Manrope:wght@500;600;700;800'
           '&family=Space+Mono:wght@400;700&display=swap')
# Sem UA de browser moderno o Google devolve TTF em vez de woff2.
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')
SUBSETS = ('latin', 'latin-ext')


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
    return raw if binary else raw.decode('utf-8')


def main():
    css = get(CSS_URL)

    # O CSS vem como "/* subset */\n@font-face {...}" repetido; cortar por esse
    # comentário é o que dá para saber qual bloco é de qual subset.
    blocos = re.findall(r'/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})', css, re.S)
    print('blocos no CSS do Google: %d' % len(blocos))

    # Primeiro passo: baixar tudo que interessa e agrupar por conteúdo.
    # chave = (família, subset, hash) -> lista de pesos que aquele arquivo cobre.
    porArquivo = collections.OrderedDict()
    conteudo, faixas = {}, {}
    for subset, bloco in blocos:
        if subset not in SUBSETS:
            continue
        url = re.search(r'url\((https://[^)]+\.woff2)\)', bloco).group(1)
        familia = re.search(r"font-family:\s*'([^']+)'", bloco).group(1)
        peso = int(re.search(r'font-weight:\s*(\d+)', bloco).group(1))
        # unicode-range vem do próprio Google: é a definição oficial do subset,
        # e reescrever à mão seria só chance de errar.
        rng = re.search(r'unicode-range:\s*([^;]+);', bloco).group(1)

        dados = get(url, binary=True)
        h = hashlib.sha256(dados).hexdigest()[:8]
        chave = (familia, subset, h)
        porArquivo.setdefault(chave, []).append(peso)
        conteudo[chave] = dados
        faixas[chave] = rng

    saida, total = [], 0
    for (familia, subset, h), pesos in porArquivo.items():
        base = familia.lower().replace(' ', '-')
        # Um arquivo por peso só faz sentido quando o arquivo é mesmo daquele
        # peso; se cobre vários (fonte variável), o nome não carrega peso nenhum.
        nome = ('%s-%s.woff2' % (base, subset) if len(pesos) > 1
                else '%s-%d-%s.woff2' % (base, pesos[0], subset))
        dados = conteudo[(familia, subset, h)]
        io.open(os.path.join(HERE, nome), 'wb').write(dados)
        total += len(dados)

        faixa = str(pesos[0]) if len(pesos) == 1 else '%d %d' % (min(pesos), max(pesos))
        print('  %-30s %5.1f KB  peso %s' % (nome, len(dados) / 1024, faixa))

        rng = faixas[(familia, subset, h)]
        saida.append(
            '/* %s · %s */\n'
            '@font-face {\n'
            "  font-family: '%s';\n"
            '  font-style: normal;\n'
            '  font-weight: %s;\n'
            '  font-display: swap;\n'
            '  src: url(%s) format(\'woff2\');\n'
            '  unicode-range: %s;\n'
            '}' % (familia, subset, familia, faixa, nome, rng))

    cabecalho = (
        '/* GERADO POR fetch-fonts.py — não edite à mão.\n'
        ' *\n'
        ' * Manrope e Space Mono servidas do próprio domínio, subsets latin e\n'
        ' * latin-ext apenas. A Manrope é variável: um arquivo por subset cobre\n'
        ' * a faixa 500-800 inteira. Para atualizar, rode o script de novo.\n'
        ' */\n\n')
    io.open(os.path.join(HERE, 'fonts.css'), 'w', encoding='utf-8', newline='\n').write(
        cabecalho + '\n\n'.join(saida) + '\n')

    print('\n%d arquivos, %.1f KB no total -> fonts.css' % (len(porArquivo), total / 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
