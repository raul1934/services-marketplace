# -*- coding: utf-8 -*-
"""Aponta o texto em português da landing que o dicionário EN não traduz.

O dicionário de `index.html` é indexado pelo texto PT exato do nó — trocar uma
vírgula na copy silenciosamente derruba a tradução daquela frase, e nada avisa.
Este script compara os dois lados e lista o que ficou de fora.

    python landing/check-i18n.py            # lista o que falta
    python landing/check-i18n.py --strict   # sai com 1 se faltar algo (CI)

Falsos positivos são esperados em nomes próprios, marcas e mockups de tela
("Av. Paulista", "Honda Civic"), que não devem mesmo ser traduzidos. O sinal
útil é frase de copy aparecendo aqui depois de uma edição.
"""
import argparse
import html.parser
import io
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, 'index.html')

# Texto que é conteúdo de mockup de tela ou nome próprio: aparece na página mas
# não é copy de marketing e não entra no dicionário de propósito.
IGNORE = {
    'Av. Paulista', 'Honda Civic', 'Rafael C.', 'João S.', 'Marina', 'Camila A.',
    'Diego R.', 'Auto Center Vila', 'Chama Fácil', 'Mateus Almeida',
}
IGNORE_RE = re.compile(r'^(R\$|★|·|—|\d|Placa |ABC-)|^[A-Z]{2}$')

ACENTO = re.compile(r'[çãáéíóúâêôàõÇÃÁÉÍÓÚÂÊÔÀÕ]')
PALAVRA_PT = re.compile(
    r'\b(de|da|do|em|para|com|voc[êe]|seu|sua|n[ãa]o|na|no|um|uma|os|as|que|por|'
    r'quando|se|ao|dos|das|pelo|pela)\b', re.I)


class TextNodes(html.parser.HTMLParser):
    """Coleta os mesmos nós que o walkText() da página percorre."""

    def __init__(self):
        super().__init__()
        self.skip = 0
        self.out = []

    # <title> entra aqui porque a página o reescreve pelo objeto META, não pelo
    # dicionário — cobrado à parte, não é buraco de tradução.
    SKIP = ('script', 'style', 'title')

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip:
            return
        v = data.strip()
        if v:
            self.out.append(v)


def dict_keys(src):
    """Chaves do `var EN = {...}` — o lado traduzido."""
    blk = re.search(r'var EN = \{(.*?)\n  \};', src, re.S)
    if not blk:
        print('não achei o bloco `var EN = {`; o script precisa de ajuste')
        sys.exit(2)
    # Chave é a string entre aspas antes de ':' — respeitando \" escapado.
    pat = re.compile(r'"((?:[^"\\]|\\.)*)"\s*:')
    return set(m.group(1).replace('\\"', '"') for m in pat.finditer(blk.group(1)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--strict', action='store_true',
                    help='sai com código 1 se faltar tradução (para CI)')
    args = ap.parse_args()

    src = io.open(INDEX, encoding='utf-8').read()
    keys = dict_keys(src)

    parser = TextNodes()
    parser.feed(src)

    faltando, vistos = [], set()
    for v in parser.out:
        if v in keys or v in IGNORE or v in vistos:
            continue
        if len(v) < 3 or IGNORE_RE.match(v):
            continue
        # Só reclama do que parece português; "Pix", "Android" e afins passam.
        if not (ACENTO.search(v) or PALAVRA_PT.search(v)):
            continue
        vistos.add(v)
        faltando.append(v)

    print('chaves no dicionário EN: %d' % len(keys))
    print('nós de texto na página:  %d' % len(parser.out))
    if not faltando:
        print('\nnada sem tradução.')
        return 0
    print('\nsem tradução (%d):' % len(faltando))
    for v in faltando:
        print('  %s' % (v if len(v) <= 96 else v[:93] + '...'))
    return 1 if args.strict else 0


if __name__ == '__main__':
    sys.exit(main())
