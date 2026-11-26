"""Recalcula e confere a prioridade das 21 HUs do MVP a partir do JSON.

Método técnico: ET=(ES+CX+CP)/3; IPA=(VN+5-ET)/2.
A ordem operacional respeita as dependências e as iterações planejadas.
As estimativas precisam de validação pela equipe/cliente, registrada no histórico.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

# Dependências funcionais explícitas para a proposta de planejamento da Issue #18.
# A decomposição/execução definitiva será detalhada na Issue #17.
DEPENDENCIAS = {
    4: (3, 9), 9: (1,), 10: (9,), 12: (2,),
    14: (2, 12), 15: (2, 9), 19: (15,), 20: (19,),
    21: (2, 9), 24: (21,), 36: (19, 24),
    39: (14, 19, 24), 44: (1, 9, 24),
    45: (44,), 46: (44,), 47: (2, 44), 48: (45, 47),
    49: (12, 21, 47),
}


def pontuar(item):
    a = item.get('avaliacao_priorizacao') or {}
    notas = {}
    for k in ('vn', 'es', 'cx', 'cp'):
        v = a.get(k)
        if type(v) is not int or not (1 <= v <= 4):
            raise ValueError(f'HU{item["id"]:02d}: {k} precisa ser nota inteira entre 1 e 4')
        notas[k] = v
    et = (notas['es'] + notas['cx'] + notas['cp']) / 3
    ip = (notas['vn'] + 5 - et) / 2
    faixa = 'Alta' if ip >= 3 else 'Média' if ip >= 2.5 else 'Baixa'
    return et, ip, faixa


def calcular(data):
    mvp = [x for x in data if x.get('mvp')]
    if len(data) != 49 or len(mvp) != 21:
        raise ValueError('Esperadas 49 histórias e 21 histórias no MVP.')
    por_id = {x['id']: x for x in mvp}
    if len(por_id) != 21:
        raise ValueError('IDs do MVP duplicados')
    notas = {n: pontuar(x) for n, x in por_id.items()}
    for n, deps in DEPENDENCIAS.items():
        if n not in por_id:
            raise ValueError(f'HU{n:02d} necessária ao plano do MVP não encontrada')
        for dep in deps:
            if dep not in por_id:
                raise ValueError(f'Dependência HU{dep:02d} de HU{n:02d} fora do MVP')
            if por_id[dep]['iteracao'] > por_id[n]['iteracao']:
                raise ValueError(f'HU{n:02d} depende de HU{dep:02d} planejada para iteração posterior')
    concluidas = set()
    ordem = []
    for iteracao in (6, 7, 8):
        pendentes = {n for n, x in por_id.items() if x['iteracao'] == iteracao}
        while pendentes:
            prontas = [n for n in pendentes if all(d in concluidas for d in DEPENDENCIAS.get(n, ())) ]
            if not prontas:
                raise ValueError(f'Dependências circulares ou sem atendimento na iteração {iteracao}: {sorted(pendentes)}')
            # A pontuação ordena os itens viáveis; a ordem existente desempata.
            escolhido = min(prontas, key=lambda n: (-notas[n][1], por_id[n]['ordem'], n))
            ordem.append(escolhido)
            pendentes.remove(escolhido)
            concluidas.add(escolhido)
    return {n: (pos, *notas[n]) for pos, n in enumerate(ordem, start=1)}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    op = p.add_mutually_exclusive_group(required=True)
    op.add_argument('--status', action='store_true', help='Exibe notas e ordem atual sem alterar')
    op.add_argument('--check', action='store_true', help='Verifica consistência de ordem e prioridade')
    op.add_argument('--apply', action='store_true', help='Recalcula ordem e classes no JSON e regenera páginas')
    p.add_argument('--repo', default='.')
    args = p.parse_args()
    repo = Path(args.repo).resolve()
    path = repo / 'docs/data/historias.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    resultado = calcular(data)
    alteradas = []
    print('HU   Ordem  VN   ET    IPA   Prioridade  Situação')
    print('-' * 66)
    for n, (ordem, et, ip, faixa) in sorted(resultado.items(), key=lambda x: x[1][0]):
        x = next(item for item in data if item['id'] == n)
        a = x['avaliacao_priorizacao']
        dif = x['ordem'] != ordem or x['prioridade'] != faixa
        if dif: alteradas.append((x, ordem, faixa))
        revisao = 'proposta técnica' if not a.get('revisor') or a['revisor'].strip().lower() in ('pendente', 'a confirmar') else 'revisada'
        print(f'HU{n:02d} {ordem:>4}º   {a["vn"]:>2}  {et:>4.2f}  {ip:>4.2f}  {faixa:<10} {revisao}' + (' *' if dif else ''))
    print(f'\nDivergências entre fonte e cálculo: {len(alteradas)}')
    if args.check and alteradas:
        raise ValueError('Prioridades ou ordem divergentes; execute --apply depois da revisão.')
    if args.apply:
        if alteradas:
            for x, ordem, faixa in alteradas:
                x['ordem'] = ordem
                x['prioridade'] = faixa
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
        sys.path.insert(0, str(repo / 'scripts'))
        from requisitos_unificados import sync
        atualizados = sync(repo, check=False)
        print(f'Prioridades/ordens alteradas: {len(alteradas)}; visões sincronizadas: {len(atualizados)}')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, ImportError, json.JSONDecodeError) as e:
        print('Erro:', e, file=sys.stderr)
        sys.exit(1)
