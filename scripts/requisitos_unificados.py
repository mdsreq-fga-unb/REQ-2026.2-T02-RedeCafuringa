"""Fonte única de metadados das histórias da Rede Cafuringa.

A fonte editável é docs/data/historias.json. RFs/RNFs/RNs mantêm sua
especificação canônica em docs/visao/requisitos_software.md; os critérios e
narrativas continuam nas respectivas docs/visao/historias/HU*.md.

Execução manual opcional, para atualizar snapshots no repositório:
    py -3 scripts/requisitos_unificados.py --sync --repo .
    py -3 scripts/requisitos_unificados.py --check --repo .

Durante o MkDocs build, o hook em organizacao_requisitos_hook.py chama
render_page para gerar as visões diretamente das fontes vigentes.
"""
from __future__ import annotations

import argparse
from collections import Counter
from html import escape, unescape
import json
from pathlib import Path
import re
import sys

START_CARDS = '<!-- REQUISITOS_CARDS_AUTO_INICIO -->'
END_CARDS = '<!-- REQUISITOS_CARDS_AUTO_FIM -->'
START_META = '<!-- REQUISITOS_HU_META_AUTO_INICIO -->'
END_META = '<!-- REQUISITOS_HU_META_AUTO_FIM -->'
START_MVP = '<!-- REQUISITOS_MVP_AUTO_INICIO -->'
END_MVP = '<!-- REQUISITOS_MVP_AUTO_FIM -->'
START_ITER = '<!-- REQUISITOS_ITER_AUTO_INICIO -->'
END_ITER = '<!-- REQUISITOS_ITER_AUTO_FIM -->'


def read_json(repo: Path) -> list[dict]:
    data = json.loads((repo / 'docs/data/historias.json').read_text(encoding='utf-8'))
    if not isinstance(data, list) or len(data) != 48:
        raise ValueError('docs/data/historias.json deve conter exatamente 48 registros')
    seen = set()
    for item in data:
        n = item.get('id')
        if not isinstance(n, int) or n in seen or not 1 <= n <= 48:
            raise ValueError('ID duplicado, não numérico ou fora da faixa nas HUs')
        seen.add(n)
        for attr in ('titulo', 'situacao', 'prioridade'):
            if not isinstance(item.get(attr), str) or not item[attr].strip():
                raise ValueError(f'HU{n:02d}: campo obrigatório {attr} ausente')
        if item['situacao'] not in ('Em execução', 'Planejado'):
            raise ValueError(f'HU{n:02d}: situação desconhecida')
        if item['prioridade'] not in ('Alta', 'Média', 'Baixa'):
            raise ValueError(f'HU{n:02d}: prioridade inválida')
        if item.get('rf') != f'RF{n:02d}':
            raise ValueError(f'HU{n:02d}: RF precisa corresponder a RF{n:02d}')
        for key in ('rnfs', 'regras', 'cps', 'oes'):
            if not isinstance(item.get(key), list):
                raise ValueError(f'HU{n:02d}: lista de {key} ausente')
            pattern = {'rnfs': r'RNF\d\d', 'regras': r'RN\d\d', 'cps': r'CP\d+', 'oes': r'OE\d+'}[key]
            if any(not re.fullmatch(pattern, x) for x in item[key]):
                raise ValueError(f'HU{n:02d}: identificador inválido em {key}')
        if not item['cps'] or not item['oes']:
            raise ValueError(f'HU{n:02d}: CP e OE são obrigatórios')
        if not isinstance(item.get('mvp'), bool):
            raise ValueError(f'HU{n:02d}: mvp precisa ser booleano')
        if item['mvp']:
            if item.get('iteracao') not in (6, 7, 8):
                raise ValueError(f'HU{n:02d}: iteração inválida para MVP')
            if not isinstance(item.get('ordem'), int) or not 1 <= item['ordem'] <= 20:
                raise ValueError(f'HU{n:02d}: ordem inválida')
        elif item.get('iteracao') is not None or item.get('ordem') is not None:
            raise ValueError(f'HU{n:02d}: fora do MVP não deve ter iteração/ordem')
    if sorted(seen) != list(range(1, 49)):
        raise ValueError('HUs não vão de 1 a 48')
    if Counter(x['ordem'] for x in data if x['mvp']) != Counter(range(1,21)):
        raise ValueError('Ordens de 1º a 20º devem ser únicas')
    if sum(x['mvp'] for x in data) != 20:
        raise ValueError('MVP deve ter 20 histórias')
    return sorted(data, key=lambda x: x['id'])


def rf_catalog(repo: Path) -> dict[str, str]:
    text = (repo / 'docs/visao/requisitos_software.md').read_text(encoding='utf-8')
    matches = re.findall(r'^\|\s*\*\*(RF\d{1,2})\*\*\s*\|\s*([^|\n]+)\|', text, re.M)
    result = {f'RF{int(k[2:]):02d}': value.strip() for k, value in matches}
    if len(result) < 48:
        raise ValueError('Requisitos de Software: tabela RF incompleta; esperado RF01–RF48')
    return result


def replace_between(text: str, start: str, end: str, html: str, where: str) -> str:
    if text.count(start) != 1 or text.count(end) != 1 or text.index(end) < text.index(start):
        raise ValueError(f'{where}: marcadores de geração ausentes ou duplicados')
    a = text.index(start) + len(start)
    b = text.index(end)
    return text[:a] + '\n' + html.rstrip() + '\n' + text[b:]


def link_ids(items: list[str], target: str) -> str:
    return ', '.join(f'[{x}]({target})' for x in items) if items else '—'


def render_hu_meta(item: dict, names: dict[str, str]) -> str:
    rf = item['rf']
    rows = [
        ('ID da História', f'HU{item["id"]:02d}'),
        ('Requisito Funcional', f'[{rf} — {names.get(rf, rf)}](../requisitos_software.md#71-requisitos-funcionais)'),
        ('Requisito Não Funcional', link_ids(item['rnfs'], '../requisitos_software.md#72-requisitos-nao-funcionais')),
        ('Regra de Negócio', link_ids(item['regras'], '../requisitos_software.md#73-lista-de-regras-de-negocio')),
        ('Característica de Produto', link_ids(item['cps'], '../solucao.md#23-caracteristicas-do-produto')),
        ('Objetivos Específicos', link_ids(item['oes'], '../solucao.md#22-objetivos-especificos-oe-do-produto')),
        ('Prioridade', item['prioridade']),
        ('Escopo', 'MVP' if item['mvp'] else 'Fora do MVP'),
        ('Iteração', f'[Iteração {item["iteracao"]}](../evidencias/iteracao{item["iteracao"]}.md)' if item['mvp'] else 'Não atribuída'),
    ]
    return '| Campo | Informação |\n|---|---|\n' + '\n'.join(f'| **{a}** | {b} |' for a,b in rows)


def render_cards(data: list[dict]) -> str:
    result = []
    for item in data:
        n=item['id']; title = f'HU{n:02d} — {item["titulo"]}'
        parts = []
        order = item['ordem']
        it = item['iteracao']
        attrs = (f' data-priority-order="{order}" data-iteration="{it}"' if item['mvp'] else '')
        # Metadados de rastreabilidade lidos pela visualização Tabela; nenhuma lista paralela.
        for key in ('rf','rnfs','regras','cps','oes'):
            val = item[key]
            attrs += f' data-{key}="{escape(" ".join(val) if isinstance(val,list) else val, quote=True)}"'
        parts.append(f'      <span class="hu-status hu-status-{ "execucao" if item["situacao"]=="Em execução" else "planejada" }">{escape(item["situacao"])}</span>')
        if item['mvp']:
            parts.append('      <span class="hu-status hu-status-mvp">MVP</span>')
        parts.append(f'      <span class="hu-status hu-status-prioridade">{escape(item["prioridade"])}</span>')
        if item['mvp']:
            parts.append(f'      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração {it}">{order}º</span>')
            parts.append(f'      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao{it}/" title="Ver evidências da Iteração {it}">Iteração {it}</a>')
        result.append('\n'.join([
            f'<div class="hu-card"{attrs}>',
            '  <div class="hu-card-header">',
            '    <div class="hu-card-status">',
            *parts,
            '    </div>',
            f'    <h3><a class="hu-card-title-link" href="../historias/HU{n}/">{escape(title)}</a></h3>',
            '  </div>',
            '</div>',
        ]))
    return '\n\n'.join(result)


def render_mvp(data: list[dict], names: dict[str,str]) -> str:
    lines = [
        '| RF | Requisito funcional | História de usuário correspondente | CP | Prioridade | Iteração |',
        '|---|---|---|---|---|---|',
    ]
    for item in sorted((x for x in data if x['mvp']),key=lambda r:r['ordem']):
        n = item['id']
        lines.append(f'| {item["rf"]} | {names.get(item["rf"], item["titulo"])} | '
                     f'[HU{n:02d} — {item["titulo"]}](historias/HU{n}.md) | '
                     f'{", ".join(item["cps"])} | {item["prioridade"]} | '
                     f'[Iteração {item["iteracao"]}](evidencias/iteracao{item["iteracao"]}.md) |')
    return '\n'.join(lines)


def render_iteration_cell(data: list[dict], n: int) -> str:
    matching = sorted((x for x in data if x['iteracao'] == n), key=lambda x:x['ordem'])
    return ', '.join(f'[HU{x["id"]:02d}](historias/HU{x["id"]}.md)' for x in matching)


def render_page(text: str, uri: str, data: list[dict], names: dict[str,str]) -> str:
    uri = uri.replace('\\','/')
    if uri == 'visao/historias_usuario.md':
        return replace_between(text, START_CARDS, END_CARDS, render_cards(data), uri)
    match=re.fullmatch(r'visao/historias/HU(\d+)\.md',uri)
    if match:
        item=data[int(match.group(1))-1]
        text = replace_between(text, START_META, END_META, render_hu_meta(item,names),uri)
        # O título também é mantido na fonte única; nunca altera critérios.
        return re.sub(r'^#\s*HU0*\d+\s*[—–-].*$', f'# HU{item["id"]:02d} — {item["titulo"]}', text, count=1, flags=re.M)
    if uri=='visao/mvp.md':
        return replace_between(text,START_MVP,END_MVP,render_mvp(data,names),uri)
    if uri=='visao/cronograma.md':
        if text.count(START_ITER)!=3 or text.count(END_ITER)!=3:
            raise ValueError('Cronograma: esperados marcadores para três iterações')
        for n in (6,7,8):
            pat=(rf'(\|\s*\*\*Iteração {n}\*\*<br>[^\n]*?\|\s*)'
                 + re.escape(START_ITER) + r'.*?' + re.escape(END_ITER))
            val=render_iteration_cell(data,n)
            text, count=re.subn(pat, lambda m:m.group(1)+START_ITER+' '+val+' '+END_ITER,text,count=1)
            if count!=1:raise ValueError(f'Cronograma: não encontrei célula da iteração {n}')
        return text
    return text


def sync(repo:Path,check:bool=False)->list[Path]:
    data=read_json(repo);names=rf_catalog(repo)
    paths = [repo/'docs/visao/historias_usuario.md',repo/'docs/visao/mvp.md',repo/'docs/visao/cronograma.md'] + [repo/f'docs/visao/historias/HU{n}.md' for n in range(1,49)]
    changes=[]
    for path in paths:
        uri=path.relative_to(repo/'docs').as_posix()
        text=path.read_text(encoding='utf-8')
        updated=render_page(text,uri,data,names)
        if updated!=text:changes.append((path,updated))
    if check and changes:
        raise ValueError(f'{len(changes)} arquivo(s) gerados desatualizados; execute --sync')
    if not check:
        for path,content in changes:path.write_text(content,encoding='utf-8',newline='\n')
    return [p for p,_ in changes]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    action=parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--sync',action='store_true')
    action.add_argument('--check',action='store_true')
    parser.add_argument('--repo',default='.')
    args=parser.parse_args()
    repo=Path(args.repo).resolve()
    changed=sync(repo,check=args.check)
    print(f'Fonte: 48 HUs; arquivos gerados {"a atualizar" if args.check else "atualizados"}: {len(changed)}')
    for p in changed:print('  ',p.relative_to(repo))

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,IndexError) as e:
        print('Erro:',e,file=sys.stderr);sys.exit(1)
