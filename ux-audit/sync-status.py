# -*- coding: utf-8 -*-
"""
Propaga o status de `findings.json` para as colunas Status de `findings.md` e
`quick-wins.md`.

Por que existe: as duas listas nasceram separadas, sem se referenciar, e saíram
de sincronia — a ponto de dois quick wins não existirem no arquivo que se diz
canônico, e de 20 itens já entregues aparecerem como abertos. Status agora mora
num lugar só (o JSON); os markdowns são gerados a partir dele.

Uso:
    python ux-audit/sync-status.py          # aplica
    python ux-audit/sync-status.py --check  # falha se os .md estiverem defasados

Fluxo de trabalho: terminou um achado -> edite `status`/`commits` no JSON -> rode
este script -> commite os três arquivos juntos.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(HERE, 'findings.json')
FINDINGS_MD = os.path.join(HERE, 'findings.md')
QUICKWINS_MD = os.path.join(HERE, 'quick-wins.md')


def load():
    with io.open(JSON_PATH, encoding='utf-8') as fh:
        return json.load(fh)['findings']


def cell_for(item, short=False):
    """The Status cell. `short` is the terser form used by quick-wins.md."""
    shas = ', '.join('`%s`' % c for c in item.get('commits') or [])
    if item['status'] == 'done':
        return ('✔ %s' % shas).strip() if short else ('✔ feito (%s)' % shas if shas else '✔ feito')
    if item['status'] == 'partial':
        if short:
            return ('◐ %s' % shas).strip() or '◐ parcial'
        return '◐ parcial — %s' % (item.get('note') or 'ver findings.json')
    return 'aberto'


def rewrite_last_cell(line, value):
    """Replace the final cell of a markdown table row, leaving the rest intact."""
    body = line.rstrip('\n').rstrip()
    assert body.endswith('|')
    head = body[:-1].rstrip()
    head = head[:head.rfind('|')]
    return '%s| %s |\n' % (head, value)


def apply_to(path, match, value_for):
    out, changed = [], False
    for line in io.open(path, encoding='utf-8'):
        key = match(line)
        if key is None:
            out.append(line)
            continue
        new = rewrite_last_cell(line, value_for(key))
        changed = changed or new != line
        out.append(new)
    return ''.join(out), changed


def main():
    check = '--check' in sys.argv
    by_id = {i['id']: i for i in load()}
    by_qw = {i['quick_win']: i for i in by_id.values() if i.get('quick_win')}

    targets = [
        (FINDINGS_MD,
         lambda l: (re.match(r'^\| ([A-Z0-9]+-\d{2}) \|', l) or [None, None])[1],
         lambda k: cell_for(by_id[k]) if k in by_id else 'aberto'),
        (QUICKWINS_MD,
         lambda l: (lambda m: int(m.group(1)) if m and int(m.group(1)) in by_qw else None)(
             re.match(r'^\| (\d+) \|', l)),
         lambda k: cell_for(by_qw[k], short=True)),
    ]

    stale = []
    for path, match, value_for in targets:
        content, changed = apply_to(path, match, value_for)
        if changed:
            stale.append(os.path.basename(path))
            if not check:
                io.open(path, 'w', encoding='utf-8').write(content)

    if check and stale:
        print('defasado(s): %s — rode `python ux-audit/sync-status.py`' % ', '.join(stale))
        return 1
    print('em dia' if not stale else 'atualizado(s): %s' % ', '.join(stale))
    return 0


if __name__ == '__main__':
    sys.exit(main())
