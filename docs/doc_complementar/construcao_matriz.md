
A partir dos valores de negócio e dos níveis de esforço técnico consolidados, foi construída uma matriz 4 × 4 para apoiar a análise e a priorização dos requisitos funcionais da Rede Cafuringa.

A matriz relaciona duas dimensões:

- **eixo vertical:** valor de negócio, variando de 1 a 4;
- **eixo horizontal:** esforço técnico, variando de 1 a 4.

O valor de negócio representa a contribuição percebida do requisito para os objetivos do produto, enquanto o esforço técnico representa o nível relativo de trabalho necessário para sua implementação, considerando esforço, complexidade e lacuna de capacidade.

| Valor de negócio ↓ / Esforço técnico → | 1 — Baixo | 2 — Moderado | 3 — Alto | 4 — Muito alto |
| :--- | :--- | :--- | :--- | :--- |
| **4 — Muito alto** | Prioridade máxima | Forte candidato ao MVP | Avaliar viabilidade | Planejar, reduzir ou decompor |
| **3 — Alto** | Forte candidato ao MVP | Candidato ao MVP | Avaliar contexto | Entrega futura |
| **2 — Moderado** | Avaliar oportunidade | Entrega futura | Entrega futura | Baixa prioridade |
| **1 — Baixo** | Avaliar oportunidade | Baixa prioridade | Baixa prioridade | Não priorizar agora |

Com base nessa classificação, os principais candidatos ao MVP concentram-se nos quadrantes que apresentam **alto valor de negócio associado a baixo ou moderado esforço técnico**, especialmente:

- **valor de negócio 4 e esforço técnico 1;**
- **valor de negócio 4 e esforço técnico 2;**
- **valor de negócio 3 e esforço técnico 1;**
- **valor de negócio 3 e esforço técnico 2.**

Entretanto, a posição de um requisito na matriz não determina isoladamente sua inclusão no MVP. A decisão final também considera **dependências entre requisitos, riscos técnicos, coerência dos fluxos de uso, restrições do projeto e necessidade de composição de um produto minimamente funcional**.

## 4.1 Matriz de valor de negócio × esforço técnico

| **Valor de negócio × Esforço técnico** | **Baixo** | **Moderado** | **Alto** | **Muito alto** |
| :--- | :--- | :--- | :--- | :--- |
| **Muito alto** | RF01 - Cadastrar perfil de consumidor<br>RF02 - Cadastrar perfil de produtor<br>RF03 - Cadastrar usuário admin | RF04 - Consultar usuários cadastrados<br>RF09 - Autenticar usuário<br>RF14 - Consultar perfil de produtor<br>RF17 - Cadastrar produto<br>RF21 - Consultar catálogo de produtos<br>RF22 - Consultar detalhes do produto<br>RF23 - Cadastrar experiência<br>RF25 - Consultar experiência | RF36 - Buscar ofertas<br>RF44 - Solicitar pré-reserva de experiência<br>RF46 - Cancelar solicitação de pré-reserva<br>RF47 - Responder pré-reserva de experiência | RF39 - Disponibilizar contato direto |
| **Alto** | RF05 - Desativar usuário<br>RF12 - Registrar trajetória do produtor<br>RF29 - Consultar evento | RF06 - Consultar conteúdos cadastrados<br>RF07 - Remover conteúdo inadequado<br>RF10 - Recuperar acesso à conta<br>RF11 - Excluir conta<br>RF13 - Atualizar perfil de produtor<br>RF18 - Atualizar produto<br>RF20 - Informar disponibilidade de produto<br>RF24 - Atualizar experiência<br>RF27 - Cadastrar evento<br>RF33 - Consultar guia de boas práticas<br>RF38 - Filtrar resultados de busca<br>RF41 - Visualizar feedback<br>RF45 - Consultar pré-reserva | RF16 - Preencher questionário do produtor<br>RF48 - Notificar alteração de pré-reserva | — |
| **Moderado** | RF08 - Atualizar informações institucionais<br>RF19 - Excluir produto<br>RF26 - Excluir experiência<br>RF32 - Apresentar informações da Cafuringa | RF28 - Atualizar evento | RF34 - Notificar eventos<br>RF40 - Enviar feedback ao fornecedor | — |
| **Baixo** | RF30 - Excluir evento<br>RF42 - Editar feedback | RF43 - Excluir feedback ao fornecedor | RF15 - Informar certificação<br>RF35 - Visualizar ofertas no mapa | RF31 - Auxiliar cadastro de atividade<br>RF37 - Buscar locais por proximidade |

## 4.2 Análise da matriz

A distribuição dos requisitos evidencia que os itens de maior valor de negócio e menor esforço técnico concentram-se principalmente nos fluxos básicos de cadastro, autenticação, consulta de produtores, produtos e experiências. Esses requisitos apresentam condições favoráveis para compor o núcleo inicial da solução.

Os requisitos posicionados em valor de negócio 4 e esforço técnico 3 também apresentam relevância significativa, porém demandam uma análise adicional de viabilidade e escopo. Nesse grupo estão funcionalidades relacionadas à busca de ofertas e ao fluxo de pré-reserva de experiências. Por apresentarem alto valor de negócio, sua exclusão não deve ocorrer exclusivamente em função do esforço técnico; uma alternativa é reduzir seu escopo para uma implementação inicial mais simples.

O requisito RF39 – Disponibilizar contato direto, por exemplo, apresenta valor de negócio muito alto, mas também esforço técnico muito alto. Por esse motivo, sua implementação deve ser analisada considerando possíveis simplificações ou decomposição da funcionalidade, em vez de sua inclusão automática no MVP.

Já os requisitos com baixo valor de negócio e alto esforço técnico, como RF31 e RF37, apresentam menor atratividade para a primeira versão, podendo ser direcionados para etapas posteriores do desenvolvimento.

Assim, a matriz funciona como um instrumento de apoio à decisão, permitindo visualizar a relação entre benefício esperado e esforço de implementação, sem substituir a análise qualitativa da equipe. A definição definitiva do MVP será realizada considerando também a dependência entre requisitos e a necessidade de garantir fluxos completos e utilizáveis.