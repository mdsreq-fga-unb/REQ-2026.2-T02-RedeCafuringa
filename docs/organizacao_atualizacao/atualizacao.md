# Atualização de Requisitos e Histórico

<span class="version-badge">Unidade 02 · Organização e Atualização</span>

A proposta de atualização segue a abordagem híbrida e iterativa descrita nas [Estratégias de Engenharia de Software](../../visao/estrategias/): acolher mudanças, avaliar impactos, decidir o que passa a valer e atualizar os registros relacionados, preservando o histórico necessário.

## Fluxo de tratamento de mudanças

<div class="orc-flow" aria-label="Processo de atualização de requisitos">
  <div><span>01</span><strong>Identificar</strong><p>Feedback do cliente, teste, revisão ou nova demanda.</p></div>
  <div><span>02</span><strong>Analisar</strong><p>Verificar RFs, HUs, regras, critérios, MVP e dependências.</p></div>
  <div><span>03</span><strong>Decidir</strong><p>Registrar aprovação, adiamento ou recusa e a justificativa.</p></div>
  <div><span>04</span><strong>Propagar</strong><p>Atualizar declarações, relações, protótipo e planejamento afetados.</p></div>
  <div><span>05</span><strong>Comunicar</strong><p>Revisar por PR, informar envolvidos e vincular evidências.</p></div>
</div>

Esse fluxo é uma **rotina proposta/documentada**; não representa a afirmação de que toda mudança histórica já percorreu formalmente cada etapa.

## Fonte única de metadados e atualização automática

A sincronização estruturada **já está implementada** com uma fonte central e visões derivadas. Há **três fontes por responsabilidade**, em vez de copiar as mesmas informações em várias tabelas:

| Fonte de manutenção | O que editar nela | O que é atualizado no build do MkDocs |
|---|---|---|
| `docs/data/historias.json` | Título, RF relacionado, RNFs, regras, OE, CP, prioridade, escopo MVP, situação, ordem e iteração | Cards, tabela enriquecida, identificação das HUs, composição do MVP e HUs listadas no cronograma |
| [Requisitos de Software](../../visao/requisitos_software/) (`docs/visao/requisitos_software.md`) | Declaração e denominação vigente dos RFs, RNFs e regras | Nomes dos RFs nas fichas de identificação e na tabela derivada do MVP |
| [Páginas das HUs](../../visao/historias_usuario/) (`docs/visao/historias/HU*.md`) | Narrativa, critérios de aceitação, protótipos, DoR/DoD e demais detalhes da HU | Conteúdo completo da página da HU e da janela modal, que consulta essa mesma página |

**Não edite manualmente as tags dos cards, as linhas derivadas do MVP, as atribuições do cronograma nem o bloco de identificação gerado nas HUs.** Eles são apenas apresentações dos metadados mantidos em `historias.json`.

### Como realizar uma atualização

1. Identifique a HU e registre a mudança em issue ou PR, com justificativa e pessoas envolvidas.
2. Altere **uma vez** os atributos em `docs/data/historias.json` (ex.: `iteracao`, `prioridade`, `rnfs`). Se mudar a declaração de RF ou os critérios da HU, edite também **a fonte textual própria daquele conteúdo**.
3. Valide e atualize os snapshots rastreados no Git: `py -3 scripts/requisitos_unificados.py --sync --repo .`.
4. Execute `py -3 scripts/requisitos_unificados.py --check --repo .` e `py -3 -m mkdocs build --clean`. O hook `scripts/organizacao_requisitos_hook.py` regenera as visões publicadas a partir das fontes a cada build.
5. Revise o diff, os efeitos no MVP e na iteração, e registre a decisão no PR. Após merge e deploy, as páginas publicadas consultam a mesma versão dos dados.

Uma alteração em um **atributo central** aparece automaticamente nas demais visões; **não** se trata de edição direta pelo navegador do Pages, que é um site estático. Trechos narrativos, protótipos e testes que sofram impacto continuam exigindo revisão humana — o gerador não presume decisões ou aprovações.

### Garantias de integridade

O validador bloqueia IDs duplicados, RF incoerente com a HU, 48 registros incompletos, ordens repetidas, atribuições de iteração a HUs fora do MVP e dados estruturados inválidos. A integração não substitui a validação de conteúdo com a equipe e o cliente.

---

## Pontos de controle ao longo do AUP

| Momento | Conferência | Registros de apoio |
|---|---|---|
| Planejamento | Prioridade, escopo, dependências e prontidão (DoR) | [Backlog](../../visao/historias_usuario/) e [DoR/DoD](../../visao/dor_dod/) |
| Decisão sobre mudança | Motivo, impacto, responsável e o entendimento que passa a vigorar | Issue, revisão, comunicação e PR, quando registrados |
| Revisão da iteração | Critérios, resultados, feedback e pendências (DoD) | [Evidências das iterações](../../visao/cronograma/) |
| Fechamento | Entregas, itens adiados/retirados e versão identificável | [Histórico de revisão](../../#historico-de-revisao) e repositório |

## Modelo para registrar uma mudança

> Este é um modelo para uso em uma issue ou registro de decisão. Não representa uma mudança aprovada ou já executada.

| Campo | Preenchimento sugerido |
|---|---|
| Referência | Identificador da issue, PR ou registro de reunião |
| Descoberta | Solicitação, problema ou evidência e sua origem |
| Situação anterior | Comportamento e registro antes da mudança |
| Decisão | Novo entendimento, justificativa, participantes e situação |
| Impacto | OEs, CPs, RFs, RNFs, RNs, HUs, critérios, dependências e iterações atingidos |
| Atualização | Arquivos, protótipo, código e testes alterados conforme o impacto |
| Comunicação | Quem foi informado, quando e por qual canal |
| Fechamento | Revisão, data/versão e pendências remanescentes |

## Avaliação do processo

A equipe pode testar a estrutura com quatro exercícios: **consultar uma HU**, **percorrer um vínculo**, **simular uma mudança** e **recuperar uma decisão histórica**. Em cada exercício, deve registrar o achado, a evidência, a situação e o encaminhamento. Ausência de evidência não equivale automaticamente à ausência da prática.


Para avaliar os vínculos afetados por uma alteração, veja [Rastreabilidade](../rastreabilidade/). Para localizar uma HU específica, consulte o [Backlog](../../visao/historias_usuario/).
