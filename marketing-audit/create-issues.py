# -*- coding: utf-8 -*-
"""
Create one GitHub issue per open marketing finding, from findings.json.

Same mechanics as `ux-audit/create-issues.py` — see that file for the reasoning
behind the bookkeeping. Run `--dry-run` first: issues cannot be bulk-deleted
afterwards (only closed), so the dry run is the place to catch mistakes.

    python marketing-audit/create-issues.py --dry-run
    python marketing-audit/create-issues.py --labels     # create the labels first
    python marketing-audit/create-issues.py              # create the issues

Already-created findings are skipped on re-run: the issue number is written back
into findings.json under `issue`, so the script is safe to resume after a failure.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys
import time
import collections

# The Windows console is cp1252 and dies on "→". Never let logging be able to
# break the bookkeeping.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(HERE, 'findings.json')
GH = os.path.join(os.environ.get('ProgramFiles', r'C:\Program Files'), 'GitHub CLI', 'gh.exe')
if not os.path.exists(GH):
    GH = 'gh'

TOPIC_LABEL = 'auditoria-marketing'
SEVERITY_COLOR = {'Crítico': 'b60205', 'Alto': 'd93f0b', 'Médio': 'fbca04', 'Baixo': '0e8a16'}
EFFORT_NAME = {'P': 'esforço: P (pequeno)', 'M': 'esforço: M (médio)', 'G': 'esforço: G (grande)'}


def load():
    with io.open(JSON_PATH, encoding='utf-8') as fh:
        return json.load(fh, object_pairs_hook=collections.OrderedDict)


def save(doc):
    io.open(JSON_PATH, 'w', encoding='utf-8').write(
        json.dumps(doc, ensure_ascii=False, indent=2) + '\n')


def body_for(f):
    lines = []
    lines.append('> **%s** · esforço **%s** · impacto **%s** · área `%s`'
                 % (f['severity'], f['effort'], f['impact'], f['module']))
    lines.append('')
    lines.append('## Problema')
    lines.append(f['description'])
    lines.append('')
    lines.append('## Evidência')
    lines.append(f['evidence'])
    lines.append('')
    lines.append('## Solução proposta')
    lines.append(f['solution'])
    if f['status'] == 'partial':
        lines.append('')
        lines.append('## Já entregue em parte')
        lines.append('%s' % (f.get('note') or '—'))
        if f.get('commits'):
            lines.append('')
            lines.append('Commits: %s' % ', '.join('`%s`' % c for c in f['commits']))
    lines.append('')
    lines.append('---')
    lines.append('')
    lines.append('Achado `%s` da auditoria de marketing/growth da landing (chamafacil.app). '
                 'Fonte da verdade do status: `marketing-audit/findings.json`.' % f['id'])
    return '\n'.join(lines)


def labels_for(f):
    out = [TOPIC_LABEL, 'severidade: %s' % f['severity'].lower(),
           'área: %s' % f['module'].lower()]
    if f['effort'] in EFFORT_NAME:
        out.append(EFFORT_NAME[f['effort']])
    return out


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, encoding='utf-8', **kw)


def reconcile(doc):
    """Adopt issues that already exist on GitHub, matching on the `[ID]` title prefix."""
    r = run([GH, 'issue', 'list', '--limit', '400', '--state', 'all',
             '--json', 'number,title'])
    if r.returncode != 0:
        print('aviso: nao consegui listar issues (%s) — seguindo sem reconciliar'
              % r.stderr.strip()[:80])
        return 0
    on_hub = {}
    for i in json.loads(r.stdout or '[]'):
        m = re.match(r'\[([A-Z0-9-]+)\]', i['title'])
        if m:
            on_hub[m.group(1)] = i['number']
    adopted = 0
    for f in doc['findings']:
        if not f.get('issue') and f['id'] in on_hub:
            f['issue'] = on_hub[f['id']]
            adopted += 1
    if adopted:
        save(doc)
        print('reconciliadas: %d issue(s) que ja existiam e nao estavam registradas' % adopted)
    return adopted


def ensure_labels(findings, dry):
    wanted = collections.OrderedDict()
    wanted[TOPIC_LABEL] = ('0e8a16', 'Achado da auditoria de marketing/growth da landing')
    for f in findings:
        wanted['severidade: %s' % f['severity'].lower()] = (
            SEVERITY_COLOR.get(f['severity'], 'ededed'), 'Severidade %s' % f['severity'])
        wanted['área: %s' % f['module'].lower()] = ('c5def5', 'Área %s' % f['module'])
        if f['effort'] in EFFORT_NAME:
            wanted[EFFORT_NAME[f['effort']]] = ('bfd4f2', 'Esforço estimado')
    print('%d labels' % len(wanted))
    for name, (color, desc) in wanted.items():
        if dry:
            print('  [dry] label', name)
            continue
        r = run([GH, 'label', 'create', name, '--color', color, '--description', desc, '--force'])
        print('  %-42s %s' % (name, 'ok' if r.returncode == 0 else r.stderr.strip()[:60]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--labels', action='store_true', help='only create/refresh labels')
    ap.add_argument('--limit', type=int, default=0, help='stop after N issues (smoke test)')
    ap.add_argument('--delay', type=float, default=2.0, help='seconds between creations')
    args = ap.parse_args()

    doc = load()
    findings = doc['findings']
    if not args.labels:
        reconcile(doc)
    todo = [f for f in findings if f['status'] != 'done' and not f.get('issue')]

    if args.labels:
        ensure_labels(findings, args.dry_run)
        return 0

    print('abertos sem issue: %d' % len(todo))
    if args.dry_run:
        for f in todo[:2]:
            print('\n' + '=' * 70)
            print('TITULO: [%s] %s' % (f['id'], f['title']))
            print('LABELS: %s' % ', '.join(labels_for(f)))
            print('-' * 70)
            print(body_for(f))
        print('\n' + '=' * 70)
        print('... e mais %d. Nada foi criado.' % max(0, len(todo) - 2))
        print('por severidade:', dict(collections.Counter(f['severity'] for f in todo)))
        return 0

    created = 0
    for f in todo:
        if args.limit and created >= args.limit:
            print('parando em --limit %d' % args.limit)
            break
        cmd = [GH, 'issue', 'create',
               '--title', '[%s] %s' % (f['id'], f['title']),
               '--body', body_for(f)]
        for l in labels_for(f):
            cmd += ['--label', l]
        r = run(cmd)
        if r.returncode != 0:
            print('FALHOU %s: %s' % (f['id'], r.stderr.strip()[:200]))
            save(doc)
            return 1
        url = r.stdout.strip().splitlines()[-1]
        m = re.search(r'/issues/(\d+)', url)
        f['issue'] = int(m.group(1)) if m else url
        save(doc)  # before anything that can throw, logging included
        created += 1
        print('%-14s #%-5s %s' % (f['id'], f.get('issue'), f['title'][:52]))
        time.sleep(args.delay)

    print('criadas: %d' % created)
    return 0


if __name__ == '__main__':
    sys.exit(main())
