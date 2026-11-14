<span class="version-badge">Unidade 02</span>

## 10.1 Critérios de Priorização do Backlog

Para a priorização do backlog, foram utilizados os seguintes critérios:

- **VN = Valor de Negócio:** escala de 1 a 4, derivada do Método MoSCoW.
- **ES = Esforço:** escala de 1 a 4.
- **CX = Complexidade:** escala de 1 a 4.
- **CP = Capacidade:** escala de 1 a 4.

- **Prioridade: Alta (Média ≥ 3,00), Média (2,50 ≤ Média < 3,00), Baixa (Média < 2,50).

### 1. Pontuação Técnica (Esforço Técnico)

Para representar o "custo técnico" da História de Usuário (US), foi calculada a média simples das variáveis técnicas:

**Fórmula:**

`ET = (ES + CX + CP) / 3`

Assim, a pontuação técnica (**Esforço Técnico — ET**) se mantém na escala de 1 a 4.

### 2. Índice de Prioridade (Média Geral)

Para definir a prioridade combinando o valor entregue ao usuário com o esforço de construção, utilizou-se a média simples:

**Fórmula:**

`Média = (VN + ET) / 2`

Quanto maior a Média, maior a prioridade no backlog.

### 3. Interpretação dos Resultados

- **Média alta:** Requisito crítico para o negócio (*Must/Should Have*), com alto impacto imediato no MVP.

- **Média média:** Funcionalidade de alto valor, mas que apresenta um equilíbrio razoável e menor urgência técnica relativa.

- **Média baixa:** Funcionalidade importante, mas com o menor impacto comparativo dentro do escopo fechado do MVP.

### 4. Faixas de Decisão

Para refletir adequadamente a concentração de notas altas inerentes a um MVP, a régua de corte foi ajustada da seguinte maneira:

| Média | Classificação |
|---|---|
| Média ≥ 3,00 | **Alta prioridade** |
| 2,50 ≤ Média < 3,00 | **Média prioridade** |
| Média < 2,50 | **Baixa prioridade** |

A partir desses critérios, foi gerada a tabela de **Backlog Priorizado do MVP**, considerando os critérios e fórmulas apresentados e suas relações com as História de Usuário.

---

## 10.2 Requisitos do MVP


<!-- REQUISITOS_MVP_AUTO_INICIO -->
| RF | Requisito funcional | História de usuário correspondente | CP | Prioridade | Iteração |
|---|---|---|---|---|---|
| RF01 | Cadastrar perfil de consumidor | [HU01 — Cadastrar perfil de consumidor](historias/HU1.md) | CP1 | Média | [Iteração 6](evidencias/iteracao6.md) |
| RF02 | Cadastrar perfil de produtor | [HU02 — Cadastrar perfil de produtor](historias/HU2.md) | CP1 | Média | [Iteração 6](evidencias/iteracao6.md) |
| RF03 | Cadastrar usuário administrador | [HU03 — Cadastrar usuário administrador](historias/HU3.md) | CP1 | Média | [Iteração 6](evidencias/iteracao6.md) |
| RF04 | Consultar usuários cadastrados | [HU04 — Consultar usuários cadastrados](historias/HU4.md) | CP1 | Alta | [Iteração 6](evidencias/iteracao6.md) |
| RF09 | Autenticar usuário | [HU09 — Autenticar usuário](historias/HU9.md) | CP1 | Alta | [Iteração 6](evidencias/iteracao6.md) |
| RF10 | Recuperar acesso à conta | [HU10 — Recuperar acesso à conta](historias/HU10.md) | CP1 | Alta | [Iteração 6](evidencias/iteracao6.md) |
| RF12 | Registrar trajetória do produtor | [HU12 — Registrar trajetória do produtor](historias/HU12.md) | CP1 | Baixa | [Iteração 6](evidencias/iteracao6.md) |
| RF14 | Consultar perfil de produtor | [HU14 — Consultar perfil de produtor](historias/HU14.md) | CP1 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF15 | Cadastrar produto | [HU15 — Cadastrar produto](historias/HU15.md) | CP2 | Média | [Iteração 7](evidencias/iteracao7.md) |
| RF19 | Consultar catálogo de produtos | [HU19 — Consultar catálogo de produtos](historias/HU19.md) | CP2 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF20 | Consultar detalhes do produto | [HU20 — Consultar detalhes do produto](historias/HU20.md) | CP2 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF21 | Cadastrar experiência | [HU21 — Cadastrar experiência](historias/HU21.md) | CP3 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF24 | Consultar catálogo de experiências | [HU24 — Consultar catálogo de experiências](historias/HU24.md) | CP3 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF36 | Buscar ofertas | [HU36 — Buscar ofertas](historias/HU36.md) | CP4 | Alta | [Iteração 7](evidencias/iteracao7.md) |
| RF39 | Disponibilizar contato direto | [HU39 — Disponibilizar contato direto](historias/HU39.md) | CP5 | Alta | [Iteração 8](evidencias/iteracao8.md) |
| RF44 | Solicitar pré-reserva de experiência | [HU44 — Solicitar pré-reserva de experiência](historias/HU44.md) | CP6 | Alta | [Iteração 8](evidencias/iteracao8.md) |
| RF45 | Consultar pré-reserva | [HU45 — Consultar pré-reserva](historias/HU45.md) | CP6 | Alta | [Iteração 8](evidencias/iteracao8.md) |
| RF46 | Cancelar pré-reserva | [HU46 — Cancelar pré-reserva](historias/HU46.md) | CP6 | Média | [Iteração 8](evidencias/iteracao8.md) |
| RF47 | Responder pré-reserva de experiência | [HU47 — Responder pré-reserva de experiência](historias/HU47.md) | CP6 | Média | [Iteração 8](evidencias/iteracao8.md) |
| RF48 | Notificar alteração de pré-reserva | [HU48 — Notificar alteração de pré-reserva](historias/HU48.md) | CP6 | Média | [Iteração 8](evidencias/iteracao8.md) |
<!-- REQUISITOS_MVP_AUTO_FIM -->

---

## 10.3 Observações Importantes

No total, ficaram 20 requisitos funcionais no MVP da Rede Cafuringa.

| Prioridade | Quantidade |
| ---------- | ---------- |
| Alta       | 13         |
| Média      | 6          |
| Baixa      | 1          |
| Total      | 20         |

