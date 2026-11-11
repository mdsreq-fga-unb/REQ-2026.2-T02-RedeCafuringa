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

| RF | Requisito funcional | História de usuário correspondente | CP | Prioridade |
|---|---|---|---|---|
| RF01 | Cadastrar perfil de consumidor | [HU01 — Como consumidor ou visitante, quero cadastrar meu perfil na plataforma, para acessar funcionalidades e interagir com produtores e experiências.](../visao/historias/HU1.md) | CP1 | Média |
| RF02 | Cadastrar perfil de produtor | [HU02 — Como produtor ou responsável por uma iniciativa, quero cadastrar meu perfil de produtor, para divulgar produção, produtos e experiências.](../visao/historias/HU2.md) | CP1 | Média |
| RF03 | Cadastrar usuário administrador | [HU03 — Como responsável pela administração, quero cadastrar usuários administradores, para permitir apoio no gerenciamento da plataforma.](../visao/historias/HU3.md) | CP1 | Média |
| RF04 | Consultar usuários cadastrados | [HU04 — Como administrador, quero consultar os usuários cadastrados, para acompanhar e administrar os perfis existentes.](../visao/historias/HU4.md) | CP1 | Alta |
| RF09 | Autenticar usuário | [HU09 — Como usuário cadastrado, quero autenticar-me na plataforma, para acessar as funcionalidades disponíveis ao meu perfil.](../visao/historias/HU9.md) | CP1 | Alta |
| RF10 | Recuperar acesso à conta | [HU10 — Como usuário cadastrado, quero recuperar o acesso à minha conta, para voltar a utilizar a plataforma caso esqueça minhas credenciais.](../visao/historias/HU10.md) | CP1 | Alta |
| RF12 | Registrar trajetória do produtor | [HU12 — Como produtor ou responsável, quero registrar minha trajetória e atuação, para que os consumidores conheçam minha história e forma de trabalho.](../visao/historias/HU12.md) | CP1 | Baixa |
| RF14 | Consultar perfil de produtor | [HU14 — Como consumidor ou visitante, quero consultar o perfil de um produtor, para conhecer sua trajetória e atuação antes de comprar ou solicitar uma experiência.](../visao/historias/HU14.md) | CP1 | Alta |
| RF15 | Cadastrar produto | [HU15 — Como produtor cadastrado, quero cadastrar meus produtos, para divulgar minha produção e permitir a consulta pelos consumidores.](../visao/historias/HU15.md) | CP2 | Média |
| RF19 | Consultar catálogo de produtos | [HU19 — Como consumidor ou visitante, quero consultar o catálogo de produtos, para encontrar alimentos e outros produtos oferecidos pelos produtores.](../visao/historias/HU19.md) | CP2 | Alta |
| RF20 | Consultar detalhes do produto | [HU20 — Como consumidor ou visitante, quero visualizar os detalhes de um produto, para conhecer suas características e identificar o produtor responsável.](../visao/historias/HU20.md) | CP2 | Alta |
| RF21 | Cadastrar experiência | [HU21 — Como produtor ou responsável, quero cadastrar uma experiência, para divulgar atividades de turismo rural, vivências e outras atividades.](../visao/historias/HU21.md) | CP3 | Alta |
| RF24 | Consultar catálogo de experiências | [HU24 — Como consumidor ou visitante, quero consultar o catálogo de experiências, para conhecer as atividades disponíveis na região da Cafuringa.](../visao/historias/HU24.md) | CP3 | Alta |
| RF36 | Buscar ofertas | [HU36 — Como consumidor ou visitante, quero buscar ofertas na plataforma, para encontrar produtos e experiências de acordo com meu interesse.](../visao/historias/HU36.md) | CP4 | Alta |
| RF39 | Disponibilizar contato direto | [HU39 — Como consumidor ou visitante, quero entrar em contato diretamente com o responsável por uma oferta, para esclarecer dúvidas antes de comprar ou solicitar uma experiência.](../visao/historias/HU39.md) | CP5 | Alta |
| RF44 | Solicitar pré-reserva de experiência | [HU44 — Como consumidor ou visitante, quero solicitar a pré-reserva de uma experiência, para manifestar meu interesse em participar de uma atividade.](../visao/historias/HU44.md) | CP6 | Alta |
| RF45 | Consultar pré-reserva | [HU45 — Como consumidor ou visitante, quero consultar minhas solicitações de pré-reserva, para acompanhar seu andamento e as respostas recebidas.](../visao/historias/HU45.md) | CP6 | Alta |
| RF46 | Cancelar pré-reserva | [HU46 — Como consumidor ou visitante, quero cancelar uma solicitação de pré-reserva, para desistir de uma experiência quando necessário.](../visao/historias/HU46.md) | CP6 | Média |
| RF47 | Responder pré-reserva de experiência | [HU47 — Como produtor ou responsável pela experiência, quero responder às solicitações de pré-reserva, para informar ao interessado se a solicitação foi aceita ou recusada.](../visao/historias/HU47.md) | CP6 | Média |
| RF48 | Notificar alteração de pré-reserva | [HU48 — Como consumidor ou visitante, quero receber notificações sobre alterações na minha pré-reserva, para acompanhar respostas e mudanças na situação da solicitação.](../visao/historias/HU48.md) | CP6 | Média |

---

## 10.3 Observações Importantes

No total, ficaram 20 requisitos funcionais no MVP da Rede Cafuringa.

| Prioridade | Quantidade |
| ---------- | ---------- |
| Alta       | 13         |
| Média      | 6          |
| Baixa      | 1          |
| Total      | 20         |

