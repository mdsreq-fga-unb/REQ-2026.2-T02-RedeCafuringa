<span class="version-badge">Unidade 02</span>

## 10.1 Critérios de Priorização do Backlog

A priorização do MVP considera **valor de negócio (VN)** e **custo técnico estimado (ET)**. As notas abaixo são uma **reavaliação técnica proposta pela equipe para a Issue #18**, sujeita a validação; a ordem e as classes anteriores estão preservadas somente no [histórico de Organização e Atualização](../organizacao_atualizacao/atualizacao.md#historico-da-repriorizacao-do-mvp-issue-18).

### 10.1.1 Escalas utilizadas

As quatro variáveis usam notas inteiras de **1 a 4**. Para VN, quanto maior o número, maior o valor esperado. Para os fatores técnicos, quanto maior a nota, maior o custo estimado. A correspondência com MoSCoW é uma referência de valor, não um aceite automático de escopo.

| Variável | Significado | Escala de 1 a 4 |
|---|---|---|
| **VN** | Valor de Negócio: contribuição da HU para os objetivos e para a primeira entrega | 1 = baixo; 2 = moderado; 3 = alto; 4 = essencial/elevado |
| **ES** | Esforço previsto para implementar e testar a HU | 1 = muito baixo; 2 = baixo; 3 = alto; 4 = muito alto |
| **CX** | Complexidade técnica e de integração | 1 = muito baixa; 2 = baixa; 3 = alta; 4 = muito alta |
| **CP** | **Demanda de capacidade técnica**, como habilidades, recursos e coordenação necessários; não é disponibilidade da equipe | 1 = muito baixa; 2 = baixa; 3 = alta; 4 = muito alta |

### 10.1.2 Cálculo do custo técnico

O custo técnico médio é calculado por:

`ET = (ES + CX + CP) / 3`

Assim, **ET varia de 1 a 4**: valores maiores representam maior custo estimado.

### 10.1.3 Cálculo do índice de prioridade

`IPA = (VN + (5 - ET)) / 2`

O termo `5 - ET` **inverte o peso do esforço**: duas HUs com VN igual não recebem prioridade maior por serem mais difíceis. Por exemplo, com **VN = 4**, uma HU com **ET = 1** obtém **IPA = 4,00**; com **ET = 4**, obtém **IPA = 2,50**.

**Exemplo real da reavaliação:** HU01 usa VN = 4, ES = 2, CX = 2 e CP = 1. Logo, `ET = (2 + 2 + 1) / 3 = 1,67` e `IPA = (4 + 5 - 1,67) / 2 = 3,67` (prioridade **Alta**). Os valores completos estão na tabela da seção 10.2 e suas justificativas, no histórico.

### 10.1.4 Faixas de prioridade e ordem de implementação

| IPA | Prioridade |
|---|---|
| **IPA ≥ 3,00** | **Alta** |
| **2,50 ≤ IPA < 3,00** | **Média** |
| **IPA < 2,50** | **Baixa** |

A **classificação** vem do IPA. A **ordem de implementação** considera primeiro as dependências funcionais e as iterações 6, 7 e 8 já planejadas; entre histórias prontas na mesma iteração, prevalece o maior IPA. Por isso, a ordem não é necessariamente uma classificação decrescente simples de todos os índices.

## 10.2 Requisitos do MVP

<!-- REQUISITOS_MVP_AUTO_INICIO -->
| Ordem | RF | Requisito funcional | História de usuário | VN | ES | CX | CP | ET | IPA | Prioridade | Iteração |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| 1º | RF01 | Cadastrar perfil de consumidor | [HU01 — Cadastrar perfil de consumidor](historias/HU1.md) | 4 | 2 | 2 | 1 | 1.67 | 3.67 | **Alta** | [Iteração 6](evidencias/iteracao6.md) |
| 2º | RF02 | Cadastrar perfil de produtor | [HU02 — Cadastrar perfil de produtor](historias/HU2.md) | 4 | 2 | 2 | 2 | 2.00 | 3.50 | **Alta** | [Iteração 6](evidencias/iteracao6.md) |
| 3º | RF09 | Autenticar usuário | [HU09 — Autenticar usuário](historias/HU9.md) | 4 | 3 | 3 | 3 | 3.00 | 3.00 | **Alta** | [Iteração 6](evidencias/iteracao6.md) |
| 4º | RF12 | Registrar trajetória do produtor | [HU12 — Registrar trajetória do produtor](historias/HU12.md) | 2 | 2 | 2 | 1 | 1.67 | 2.67 | **Média** | [Iteração 6](evidencias/iteracao6.md) |
| 5º | RF03 | Cadastrar usuário administrador | [HU03 — Cadastrar usuário administrador](historias/HU3.md) | 3 | 3 | 3 | 3 | 3.00 | 2.50 | **Média** | [Iteração 6](evidencias/iteracao6.md) |
| 6º | RF04 | Consultar usuários cadastrados | [HU04 — Consultar usuários cadastrados](historias/HU4.md) | 3 | 3 | 3 | 3 | 3.00 | 2.50 | **Média** | [Iteração 6](evidencias/iteracao6.md) |
| 7º | RF10 | Recuperar acesso à conta | [HU10 — Recuperar acesso à conta](historias/HU10.md) | 3 | 3 | 3 | 3 | 3.00 | 2.50 | **Média** | [Iteração 6](evidencias/iteracao6.md) |
| 8º | RF15 | Cadastrar produto | [HU15 — Cadastrar produto](historias/HU15.md) | 4 | 3 | 3 | 2 | 2.67 | 3.17 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 9º | RF19 | Consultar catálogo de produtos | [HU19 — Consultar catálogo de produtos](historias/HU19.md) | 4 | 2 | 2 | 2 | 2.00 | 3.50 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 10º | RF20 | Consultar detalhes do produto | [HU20 — Consultar detalhes do produto](historias/HU20.md) | 3 | 2 | 2 | 2 | 2.00 | 3.00 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 11º | RF21 | Cadastrar experiência | [HU21 — Cadastrar experiência](historias/HU21.md) | 4 | 3 | 3 | 3 | 3.00 | 3.00 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 12º | RF24 | Consultar catálogo de experiências | [HU24 — Consultar catálogo de experiências](historias/HU24.md) | 4 | 2 | 3 | 2 | 2.33 | 3.33 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 13º | RF36 | Buscar ofertas | [HU36 — Buscar ofertas](historias/HU36.md) | 4 | 3 | 3 | 3 | 3.00 | 3.00 | **Alta** | [Iteração 7](evidencias/iteracao7.md) |
| 14º | RF14 | Consultar perfil de produtor | [HU14 — Consultar perfil de produtor](historias/HU14.md) | 3 | 2 | 3 | 2 | 2.33 | 2.83 | **Média** | [Iteração 7](evidencias/iteracao7.md) |
| 15º | RF39 | Disponibilizar contato direto | [HU39 — Disponibilizar contato direto](historias/HU39.md) | 4 | 2 | 2 | 1 | 1.67 | 3.67 | **Alta** | [Iteração 8](evidencias/iteracao8.md) |
| 16º | RF44 | Solicitar pré-reserva de experiência | [HU44 — Solicitar pré-reserva de experiência](historias/HU44.md) | 4 | 4 | 4 | 4 | 4.00 | 2.50 | **Média** | [Iteração 8](evidencias/iteracao8.md) |
| 17º | RF45 | Consultar pré-reserva | [HU45 — Consultar pré-reserva](historias/HU45.md) | 3 | 2 | 2 | 2 | 2.00 | 3.00 | **Alta** | [Iteração 8](evidencias/iteracao8.md) |
| 18º | RF46 | Cancelar pré-reserva | [HU46 — Cancelar pré-reserva](historias/HU46.md) | 3 | 2 | 2 | 2 | 2.00 | 3.00 | **Alta** | [Iteração 8](evidencias/iteracao8.md) |
| 19º | RF47 | Responder pré-reserva de experiência | [HU47 — Responder pré-reserva de experiência](historias/HU47.md) | 3 | 2 | 3 | 2 | 2.33 | 2.83 | **Média** | [Iteração 8](evidencias/iteracao8.md) |
| 20º | RF48 | Notificar alteração de pré-reserva | [HU48 — Notificar alteração de pré-reserva](historias/HU48.md) | 3 | 3 | 3 | 3 | 3.00 | 2.50 | **Média** | [Iteração 8](evidencias/iteracao8.md) |
<!-- REQUISITOS_MVP_AUTO_FIM -->

## 10.3 Requisitos não funcionais transversais do MVP

| RNF | Aplicação ao MVP |
|---|---|
| [RNF12 — Compatibilidade entre Navegadores](requisitos_software.md#72-requisitos-nao-funcionais) | Aplicável aos fluxos principais, com validação em Chrome, Firefox e Edge. |
| [RNF14 — Aplicação Web Progressiva](requisitos_software.md#72-requisitos-nao-funcionais) | Aplicável à entrega web; manifesto e instalabilidade onde suportados. |
| [RNF15 — Proteção de Crianças e Adolescentes](requisitos_software.md#72-requisitos-nao-funcionais) | Aplicável aos cadastros e tratamento de dados; verificação de maioridade e proteção de informações. |
