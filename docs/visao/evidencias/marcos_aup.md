# Marco de Elaboração e Evidências de Execução do AUP

<span class="version-badge">Unidade 03 · Issue #10 · Rastreabilidade de execução</span>

## 1. Transição da Elaboração para a Construção

| Controle de fase (AUP) | Informação verificável | Situação |
|---|---|---|
| Fim planejado da Elaboração | Iteração 4, de 02/10 a 10/10/2026, conforme o [cronograma](../cronograma.md) | Período registrado |
| Artefatos de requisitos da fase | [Requisitos de software](../requisitos_software.md), [MVP](../mvp.md), [protótipo e evidências da Iteração 4](iteracao4.md) | Artefatos disponíveis; validação individual a verificar |
| Arquitetura candidata | [Prova de conceito do backend](../arquitetura/backend/poc.md) e [visão de infraestrutura](../arquitetura/engenharia/visao-geral.md) | Descrição e componentes disponíveis |
| Identificação da baseline da fase | Commit/tag e versão considerados aprovados **na data do gate**, com registro de decisão | Disponivél no GitHub do Projeto |
| Aprovação técnica do marco | Data, avaliadores e decisão registrada (aprovar, condicionar ou reabrir) | Realizada pela equipe de Desenvolvimento |
| Aceite do cliente para a passagem | Registro de aprovação da versão e dos fluxos abrangidos | Reunião de Validação do Protótipo com Cliente na Iteração 6|


## 2. Riscos técnicos da Elaboração e evidências existentes

| Risco/hipótese | Referência consultável | O que é possível concluir | O que falta demonstrar |
|---|---|---|---|
| Conectividade rural / desempenho | [Frontend: operação e PWA](../arquitetura/frontend/operacao.md), [RNF06](../requisitos_software.md#72-requisitos-nao-funcionais) | Estratégia técnica para PWA e cache está documentada. | Relatório datado de medições sob 1,5 Mbps e 300 ms de latência; 5 s em pelo menos 90% dos cenários previstos no RNF06. |
| Persistência dos dados dos formulários em falhas de conexão | [RNF07 e requisitos](../requisitos_software.md#72-requisitos-nao-funcionais), [guia de testes](../arquitetura/backend/guia-estrutura-e-tdd.md) | Há critérios e orientações técnicas. | Evidência de teste do comportamento específico, com reprodução, resultado e versão. |
| API, banco e infraestrutura | [PoC do backend](../arquitetura/backend/poc.md), [infraestrutura](../arquitetura/engenharia/visao-geral.md) | Componentes, arquitetura e testes de integração estão documentados e presentes no repositório. | Registrar a execução/revisão da PoC no marco histórico e distinguir ambiente local de produção implantada. |
| Autenticação, autorização e dados privados | [Guia de backend](../arquitetura/backend/guia-estrutura-e-tdd.md), [segurança](../arquitetura/backend/seguranca.md) | Existem especificações e testes associados a esses controles. | Resultado identificável do pipeline, revisão da implementação e tratamento de pendências por HU. |
| CI, testes automatizados e TDD | [Workflows de CI](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/actions), [implementações backend](../arquitetura/backend/implementacao/HU09.md) | Configuração de CI, testes unitários e testes e2e podem ser inspecionados. | Vincular runs efetivas e PRs às histórias; evidenciar ordem teste → implementação para alegação específica de TDD. |

**Interpretação:** código-fonte e arquivos de configuração constituem evidência de existência/implementação. Uma execução bem-sucedida exige logs ou resultados identificáveis; TDD exige ainda o histórico da sequência de desenvolvimento. Não foram inferidos resultados de testes a partir da presença dos arquivos.

## 3. Evidências da Construção por Iteração

| Iteração | Planejamento e evidência | Situação documental e próximo passo |
|---|---|---|
| 5 | [Registro da Iteração 5](iteracao5.md) | Realizada de acordo com novo planejamento. |
| 6 | [Registro da Iteração 6](iteracao6.md) | Conferir PR, revisão e DoD e testes por HU; |
| 7 | [Registro da Iteração 7](iteracao7.md) | Relacionar versões, execuções e resultados de integração às histórias. |
| 8 | [Registro da Iteração 8](iteracao8.md) | Vincular PRs, testes, impedimentos e decisões por HU; distinguir planejado de concluído. |
| 9 | [Registro da Iteração 9](iteracao9.md) | Vincular PRs, testes, impedimentos e decisões por HU; distinguir planejado de concluído. |

