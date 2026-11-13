# Rastreabilidade e Análise de Impacto

<span class="version-badge">Unidade 02 · Organização e Atualização</span>

Rastrear um requisito significa conseguir recuperar sua origem, seus vínculos, suas condições de verificação e o planejamento da entrega. No projeto Rede Cafuringa, essas informações estão distribuídas entre a visão do produto, os requisitos, o backlog e as páginas das histórias.

## Exemplo aplicado: HU01

<div class="orc-example-grid">
  <a href="../visao/solucao.md#22-objetivos-especificos-oe-do-produto"><small>Objetivo</small><strong>OE2</strong><span>Consultar definição</span></a>
  <a href="../visao/solucao.md#23-caracteristicas-do-produto"><small>Característica</small><strong>CP1</strong><span>Consultar definição</span></a>
  <a href="../visao/requisitos_software.md#71-requisitos-funcionais"><small>Requisito funcional</small><strong>RF01</strong><span>Consultar declaração</span></a>
  <a href="../visao/historias/HU1.md"><small>História</small><strong>HU01</strong><span>Critérios, RNFs e regras vinculadas</span></a>
  <a href="../visao/mvp.md#102-requisitos-do-mvp"><small>Planejamento</small><strong>MVP</strong><span>Consultar o recorte</span></a>
  <a href="../../visao/evidencias/iteracao6/"><small>Iteração</small><strong>Iteração 6</strong><span>Consultar evidências</span></a>
</div>

Os vínculos acima estão presentes na documentação da HU01 e no planejamento do backlog. Para conferir cada RNF e regra aplicável, consulte a [identificação e as relações da HU01](../visao/historias/HU1.md).

## Percurso de análise de impacto

Ao surgir uma mudança, a equipe deve localizar o registro primário e verificar, conforme a alteração:

| Etapa da consulta | O que verificar | Fonte |
|---|---|---|
| Origem | Qual OE/CP motivou o comportamento? | [Solução Proposta](../visao/solucao.md) |
| Declaração | Qual RF/RNF/RN está em vigor? | [Requisitos de Software](../visao/requisitos_software.md) |
| Recorte | Quais HUs e critérios são afetados? | [Backlog](../visao/historias_usuario.md) e páginas individuais |
| Planejamento | Prioridade, MVP, dependências e iteração mudam? | [MVP](../visao/mvp.md) e [Cronograma](../visao/cronograma.md) |
| Evidências | Testes, revisão e registro da decisão foram atualizados? | [Critérios DoR/DoD](../visao/dor_dod.md) e [histórico](../index.md#historico-de-revisao) |

## Função das representações

O projeto prioriza histórias de usuário como recortes de valor, com critérios de aceitação verificáveis. Caso haja cenários ou casos de uso complementares, eles devem acrescentar detalhes de fluxo e exceções relevantes, mantendo vínculos explícitos, em vez de duplicar a narrativa principal.


Consulte também o [Backlog em tabela](../visao/historias_usuario.md) e a [rotina de atualização](atualizacao.md).
