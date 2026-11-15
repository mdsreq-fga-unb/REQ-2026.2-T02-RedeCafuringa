# Marco de Elaboração e Evidências de Execução do AUP

<span class="version-badge">Unidade 02 · Issue #10 · Rastreabilidade de execução</span>

Este registro separa **prática planejada**, **artefato existente** e **resultado efetivamente verificado**. A revisão documental não substitui a homologação técnica nem a aprovação do cliente. Para histórico de requisitos, consulte também [Organização e Atualização](../../organizacao_atualizacao/atualizacao.md).

## 1. Transição da Elaboração para a Construção

| Controle de fase (AUP) | Informação verificável | Situação |
|---|---|---|
| Fim planejado da Elaboração | Iteração 4, de 02/10 a 10/10/2026, conforme o [cronograma](../cronograma.md) | Período registrado |
| Artefatos de requisitos da fase | [Requisitos de software](../requisitos_software.md), [MVP](../mvp.md), [protótipo e evidências da Iteração 4](iteracao4.md) | Artefatos disponíveis; validação individual a verificar |
| Arquitetura candidata | [Prova de conceito do backend](../../arquitetura/backend/poc.md) e [visão de infraestrutura](../../arquitetura/infra/visao-geral.md) | Descrição e componentes disponíveis; **não constituem sozinhos uma baseline aprovada** |
| Identificação da baseline da fase | Commit/tag e versão considerados aprovados **na data do gate**, com registro de decisão | **Não comprovada:** inserir referência histórica real após conferência |
| Aprovação técnica do marco | Data, avaliadores e decisão registrada (aprovar, condicionar ou reabrir) | **Não comprovada** |
| Aceite do cliente para a passagem | Registro de aprovação da versão e dos fluxos abrangidos | **Não comprovado**; apresentação do protótipo não equivale a aceite |
| Pendências da passagem | Divergências em critérios, autenticação e contato direto apontadas nas revisões; riscos de conectividade, persistência e infraestrutura | Requer resolução ou aceite explícito de risco |

**Regra de passagem:** enquanto não houver a versão histórica, responsáveis e registro formal do marco, o estado documental deve ser **“gate não comprovado”**; não é correto retroagir uma aprovação usando um commit produzido depois da Iteração 4. A [Iteração 5](iteracao5.md) já registra impedimento na validação do protótipo, coerente com essa ressalva.

## 2. Riscos técnicos da Elaboração e evidências existentes

| Risco/hipótese | Referência consultável | O que é possível concluir | O que falta demonstrar |
|---|---|---|---|
| Conectividade rural / desempenho | [Frontend: operação e PWA](../../arquitetura/frontend/operacao.md), [RNF06](../requisitos_software.md#72-requisitos-nao-funcionais) | Estratégia técnica para PWA e cache está documentada. | Relatório datado de medições sob 1,5 Mbps e 300 ms de latência; 5 s em pelo menos 90% dos cenários previstos no RNF06. |
| Persistência dos dados dos formulários em falhas de conexão | [RNF07 e requisitos](../requisitos_software.md#72-requisitos-nao-funcionais), [guia de testes](../../arquitetura/backend/guia-estrutura-e-tdd.md) | Há critérios e orientações técnicas. | Evidência de teste do comportamento específico, com reprodução, resultado e versão. |
| API, banco e infraestrutura | [PoC do backend](../../arquitetura/backend/poc.md), [infraestrutura](../../arquitetura/infra/visao-geral.md) | Componentes, arquitetura e testes de integração estão documentados e presentes no repositório. | Registrar a execução/revisão da PoC no marco histórico e distinguir ambiente local de produção implantada. |
| Autenticação, autorização e dados privados | [Guia de backend](../../arquitetura/backend/guia-estrutura-e-tdd.md), [segurança](../../arquitetura/backend/seguranca.md) | Existem especificações e testes associados a esses controles. | Resultado identificável do pipeline, revisão da implementação e tratamento de pendências por HU. |
| CI, testes automatizados e TDD | [Workflows de CI](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/actions), [implementações backend](../../arquitetura/backend/implementacao/HU09.md) | Configuração de CI, testes unitários e testes e2e podem ser inspecionados. | Vincular runs efetivas e PRs às histórias; evidenciar ordem teste → implementação para alegação específica de TDD. |

**Interpretação:** código-fonte e arquivos de configuração constituem evidência de existência/implementação. Uma execução bem-sucedida exige logs ou resultados identificáveis; TDD exige ainda o histórico da sequência de desenvolvimento. Não foram inferidos resultados de testes a partir da presença dos arquivos.

## 3. Evidências da Construção por iteração

| Iteração | Planejamento e evidência | Situação documental e próximo passo |
|---|---|---|
| 5 | [Registro da Iteração 5](iteracao5.md) | Impedimentos de validação registrados; não declarar incremento concluído. |
| 6 | [Registro da Iteração 6](iteracao6.md) · [HU09 — implementação](../../arquitetura/backend/implementacao/HU09.md) · [HU10](../../arquitetura/backend/implementacao/HU10.md) · [HU12](../../arquitetura/backend/implementacao/HU12.md) | Conferir PR, revisão e testes por HU; a presença do documento de implementação não equivale a DoD aprovado. |
| 7 | [Registro da Iteração 7](iteracao7.md) · [HU15 — implementação](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/docs/arquitetura/backend/implementacao/HU15.md) · [HU19](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/docs/arquitetura/backend/implementacao/HU19.md) | Relacionar versões, execuções e resultados de integração às histórias. |
| 8 | [Registro da Iteração 8](iteracao8.md) | Vincular PRs, testes, impedimentos e decisões por HU; distinguir planejado de concluído. |

Para consultar a gestão operacional: [GitHub Projects da equipe](https://github.com/orgs/mdsreq-fga-unb/projects/115) (acesso sujeito às permissões do repositório), [Backlog de HUs](../historias_usuario.md) e [Pull Requests](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/pulls). Os metadados das HUs no Backlog descrevem o **planejamento**; o estado real de entrega deve ser comprovado por PR/CI e aceite.

## 4. Registro pendente de aprovação do marco

Quando houver comprovação, preencher e vincular nesta página: **(a)** versão histórica/tag da baseline e data; **(b)** decisões e riscos residuais; **(c)** nomes e papéis dos avaliadores; **(d)** aprovação, aprovação condicionada ou reprovação; **(e)** links de testes/PRs; **(f)** comunicação ao cliente. Até lá, nenhuma aprovação foi atribuída à equipe ou ao cliente.
