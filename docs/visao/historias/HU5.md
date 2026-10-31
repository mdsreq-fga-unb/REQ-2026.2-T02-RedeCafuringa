# HU05 — Excluir usuário

## 1. Identificação

| Campo | Informação |
|---|---|
| **ID da História** | HU05 |
| **Requisito Funcional** | [RF05 — Excluir usuário](../requisitos_software.md#71-requisitos-funcionais) |
| **Requisito Não Funcional** | [RNF03, RNF08, RNF11](../requisitos_software.md#72-requisitos-nao-funcionais) |
| **Regra de Negócio** | [RN01, RN03, RN04](../requisitos_software.md#74-lista-de-regras-de-negocio) |
| **Característica de Produto** | [CP1](../solucao.md#23-caracteristicas-do-produto) |
| **Objetivos Específicos** | [OE2](../solucao.md#22-objetivos-especificos-oe-do-produto) |
| **Prioridade** | Baixa |

---

## 2. História de Usuário

*Como administrador, quero excluir uma conta de usuário, para que eu possa realizar ações administrativas quando necessário ou diante do descumprimento das regras da plataforma.*

---

## 3. Critérios de Aceitação

**CA01 — Acesso à funcionalidade de exclusão**

- **Dado** que estou autenticado na plataforma com um perfil de administrador, **quando** acessar o gerenciamento de usuários e selecionar uma conta cadastrada, **então** o sistema deve disponibilizar a funcionalidade de exclusão.

**CA02 — Seleção do usuário**

- **Dado** que estou na interface de gerenciamento de usuários, **quando** selecionar um usuário cadastrado, **então** o sistema deve identificar a conta que será submetida à exclusão.

**CA03 — Confirmação da exclusão**

- **Dado** que selecionei uma conta para exclusão, **quando** solicitar a operação, **então** o sistema deve apresentar uma mensagem de confirmação antes de executar a ação.

**CA04 — Exclusão confirmada**

- **Dado** que selecionei uma conta e confirmei a exclusão, **quando** o sistema processar a operação, **então** deve realizar a exclusão do usuário selecionado e informar que a operação foi concluída com sucesso.

**CA05 — Cancelamento da exclusão**

- **Dado** que estou diante da confirmação de exclusão de uma conta, **quando** cancelar a operação, **então** o sistema deve interromper a ação e manter o usuário cadastrado.

**CA06 — Restrição de acesso**

- **Dado** que estou autenticado com um perfil de consumidor ou produtor, **quando** tentar acessar ou executar a funcionalidade de exclusão administrativa, **então** o sistema deve impedir a operação.

**CA07 — Exclusão de usuário indisponível**

- **Dado** que a conta selecionada não esteja disponível para exclusão, **quando** o administrador tentar realizar a operação, **então** o sistema deve informar que não foi possível concluir a exclusão.

**CA08 — Exclusão concluída**

- **Dado** que a exclusão tenha sido realizada com sucesso, **quando** o administrador consultar novamente os usuários cadastrados, **então** a conta excluída não deve permanecer disponível como usuário ativo para acesso à plataforma.

---

## 4. Relação com os Requisitos Não Funcionais

**RNF03 — Prevenção e Recuperação de Erros**

- Relação com a HU: Garante que o administrador receba mensagens claras durante o processo de exclusão, incluindo avisos de confirmação, cancelamento e falhas na operação, evitando ações equivocadas.

**RNF08 — Controle de Acesso por Perfil**

- Relação com a HU: Garante que somente usuários autenticados com perfil de administrador possam executar a exclusão de contas, impedindo que consumidores e produtores realizem intervenções administrativas.

**RNF11 — Proteção de Dados Pessoais**

- Relação com a HU: Garante que a exclusão de contas seja realizada de maneira adequada, considerando a proteção dos dados pessoais dos usuários e as finalidades de tratamento estabelecidas pela plataforma.

---

## 5. Relação com as Regras de Negócio

**RN01 — Perfis e permissões**

- Relação com a HU: Determina que a funcionalidade de exclusão administrativa seja disponibilizada exclusivamente ao perfil de administrador, respeitando as permissões estabelecidas para cada categoria de usuário.

**RN03 — Gestão administrativa**

- Relação com a HU: Estabelece que intervenções administrativas sobre usuários sejam de responsabilidade exclusiva dos administradores, garantindo que consumidores e produtores não possam excluir contas de terceiros por meio das funcionalidades comuns da plataforma.

**RN04 — Exclusão administrativa**

- Relação com a HU: Determina que a exclusão administrativa de usuários ocorra somente quando houver necessidade administrativa ou descumprimento das regras da plataforma, evitando exclusões arbitrárias ou sem justificativa.

---

## 6. Relação com as Características de Produto

**CP1 — Perfis**

- Relação com a HU: A exclusão administrativa permite que os responsáveis pela Rede Cafuringa realizem o gerenciamento dos perfis cadastrados, mantendo a organização dos usuários da plataforma e possibilitando intervenções quando houver necessidade administrativa ou descumprimento das regras estabelecidas.

---

## 7. Relação com os Objetivos Específicos

**OE2 — Visibilidade e oferta local**

- Relação com a HU: A exclusão administrativa contribui indiretamente para a organização e a confiabilidade das informações disponibilizadas na Rede Cafuringa, permitindo que a administração intervenha em contas que não estejam de acordo com as regras da plataforma. Dessa forma, apoia a manutenção de um ambiente adequado para a divulgação das iniciativas e ofertas locais.

---

## 8. Atividades Relacionadas

| ID | Atividade | Descrição |
|---|---|---|
| AT01 | Disponibilizar a funcionalidade de exclusão | Implementar a opção de exclusão de usuários na interface de gerenciamento administrativo. |
| AT02 | Implementar seleção de usuários | Permitir que o administrador selecione a conta que deseja excluir. |
| AT03 | Implementar confirmação da exclusão | Desenvolver uma etapa de confirmação antes da execução da operação, informando qual conta será excluída. |
| AT04 | Implementar processamento da exclusão | Desenvolver a operação responsável por excluir a conta selecionada, conforme as regras estabelecidas para o sistema. |
| AT05 | Implementar cancelamento da operação | Permitir que o administrador cancele a exclusão antes da confirmação, mantendo a conta cadastrada. |
| AT06 | Aplicar controle de acesso | Garantir que somente usuários autenticados com perfil de administrador possam executar a funcionalidade. |
| AT07 | Aplicar medidas de proteção de dados | Garantir que a operação de exclusão considere os requisitos de proteção de dados pessoais e as finalidades de tratamento da plataforma. |
| AT08 | Implementar mensagens de retorno | Informar o administrador sobre a confirmação, conclusão, cancelamento ou ocorrência de falhas durante a exclusão. |
| AT09 | Executar testes de exclusão | Testar a exclusão de contas selecionadas, verificando o resultado da operação e a indisponibilidade da conta excluída para acesso. |
| AT10 | Executar testes de autorização | Verificar se consumidores e produtores são impedidos de acessar e executar a exclusão administrativa. |
| AT11 | Executar testes de confirmação e cancelamento | Verificar se a exclusão somente ocorre após confirmação e se o cancelamento mantém a conta cadastrada. |
| AT12 | Documentar e revisar a funcionalidade | Registrar o comportamento implementado, os resultados dos testes e eventuais pendências para revisão pela equipe. |

---

## 9. Checklist do Definition of Ready (DoR)

Marque os itens conforme a história atender a cada condição.

- [x] A HU possui definição clara e informação necessária para ser trabalhada?
- [x] O requisito está representado por uma história de usuário?
- [x] A HU está rastreada aos requisitos de origem?
- [ ] A HU faz parte do escopo do MVP?
- [x] A HU está coberta por critérios de aceite?
- [x] Os RNFs e as restrições legais aplicáveis estão identificados?
- [x] A HU está mapeada para uma interface, quando necessário?
- [x] A HU cabe em uma iteração?
- [x] As dependências estão mapeadas?
- [ ] Os responsáveis estão definidos?
- [x] O requisito está implementado no protótipo e validado?

---

## 10. Checklist do Definition of Done (DoD)

Marque os itens após a verificação da entrega.

- [ ] Entrega um incremento do produto?
- [ ] Contempla os critérios de aceite estabelecidos?
- [ ] O desenvolvimento foi concluído integralmente?
- [ ] Os testes foram executados e aprovados?
- [ ] Está aderente aos padrões de codificação?
- [ ] A funcionalidade foi revisada pela equipe?
- [ ] Mantém os índices de performance do produto?
- [ ] Atende aos requisitos de acessibilidade e responsividade?
- [ ] Preserva a segurança e a privacidade dos dados?
- [ ] Trata os erros do usuário?
- [ ] Está livre de defeitos críticos?
- [ ] Está documentado?