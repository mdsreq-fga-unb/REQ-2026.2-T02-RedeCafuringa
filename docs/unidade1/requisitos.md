<span class="version-badge">Unidade 01</span>

## 5.1 Atividades e Técnicas de Engenharia de Requisitos (ER)

Abaixo apresenta-se a estruturação operacional detalhada das **Atividades e Técnicas de ER** executadas nas fases do _Agile Unified Process_ (AUP). Cada atividade especifica as técnicas aplicadas, insumos necessários (entradas), entregáveis gerados (saídas) e os atores/stakeholders envolvidos.

---

### Fase de Concepção

!!! info "Elicitação e Descoberta"

    #### Entrevista Semiestruturada com o Cliente

    - **Descrição:** Aplicação de roteiro flexível de perguntas na reunião de primeiro contato com o representante da Rede Cafuringa para capturar dores e necessidades do ecossistema local.
    - **Entradas:** Roteiro de entrevista e mapa de partes interessadas.
    - **Saídas:** Registro da visão inicial e lista bruta de necessidades de negócio.
    - **Participantes:** Engenheiros de Requisitos e Cliente.

    #### Brainstorming Colaborativo

    - **Descrição:** Reuniões internas da equipe para geração livre e agrupamento de ideias sobre o catálogo de produtos e atrativos rurais.
    - **Entradas:** Lista bruta de necessidades.
    - **Saídas:** Mapa mental de funcionalidades potenciais.
    - **Participantes:** Equipe de Desenvolvimento.

!!! info "Declaração de Requisitos"

    #### Redação Estruturada do Documento de Visão

    - **Descrição:** Síntese e agrupamento das necessidades brutas em Objetivo Geral, Objetivos Específicos (OEs) e Características do Produto (CPs).
    - **Entradas:** Mapa mental de funcionalidades e registro da entrevista inicial.
    - **Saídas:** Minuta do Documento de Visão (Artefato).
    - **Participantes:** Engenheiros de Requisitos.

!!! info "Análise e Consenso"

    #### Priorização MoSCoW

    - **Descrição:** Classificação colaborativa das intenções de escopo nas categorias _Must_, _Should_, _Could_ e _Won't_.
    - **Entradas:** Minuta do Documento de Visão (OEs e CPs).
    - **Saídas:** Lista de escopo preliminar priorizada.
    - **Participantes:** Engenheiros de Requisitos.

    #### Validação Assíncrona com a Cliente

    - **Descrição:** Alinhamento, validação de escopo e aprovação das documentações da primeira entrega conduzidos de forma assíncrona por canal de mensagens instantâneas.
    - **Entradas:** Minuta do Documento de Visão priorizada.
    - **Saídas:** Concordância e aval do cliente para seguir com o escopo planejado.
    - **Participantes:** Engenheiros de Requisitos e Cliente.

!!! info "Verificação e Validação"

    #### Reuniões de Revisão da Entrega

    - **Descrição:** Reuniões de revisão para confirmação dos objetivos geral e específicos e das decisões de abordagem, ciclo de vida e processo de software.
    - **Entradas:** Minuta do Documento de Visão revisada.
    - **Saídas:** Registro de Decisões e vídeos comprobatórios das reuniões.
    - **Participantes:** Engenheiros de Requisitos e Equipe de Desenvolvimento.

!!! info "Organização e Atualização"

    #### Atribuição de Metadados & Versionamento

    - **Descrição:** Indexação de cada OE e CP com códigos identificadores únicos e atribuição de estado de aprovação, com migração das decisões consolidadas no documento compartilhado para o repositório oficial (GitPages).
    - **Entradas:** Documento de Visão validado.
    - **Saídas:** Escopo de Visão Inicial versionado no repositório oficial (GitPages).
    - **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/concepcao.png" alt="Rede Cafuringa - Concepção" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Elaboração

!!! info "Elicitação e Descoberta"

    #### Especificação de Requisitos Funcionais e Não Funcionais

    - **Descrição:** Detalhamento de restrições de desempenho, usabilidade, operação _offline_ e segurança.
    - **Entradas:** Relatório de restrições operacionais e arquitetura pretendida.
    - **Saídas:** Especificação suplementar dos requisitos de acordo com complexidade, capacidade e esforço.
    - **Participantes:** Engenheiros de Requisitos.

!!! info "Declaração de Requisitos"

    #### Priorização MoScoW

    - **Descrição:** Reunião de negociação para classificar os requisitos do sistema em quatro níveis de criticidade (Must Have, Should Have, Could Have, Won't Have), visando alinhar as expectativas e definir o escopo do Produto Mínimo Viável.
    - **Entradas:** Lista de requisitos elicitados, objetivos de negócio do projeto e restrições conhecidas.
    - **Saídas:** Backlog de requisitos devidamente categorizado e priorizado e escopo de entrega.
    - **Participantes:** Engenheiros de Requisitos.

    #### Histórias de Usuário

    - **Descrição:** Tradução e escrita das necessidades elicitadas em formato narrativo sob a perspectiva do usuário final (focando em quem, o que e por que), incluindo a definição dos critérios de aceitação para cada funcionalidade.
    - **Entradas:** Requisitos brutos elicitados, perfis de usuários/personas (produtores, consumidores, admin) e o escopo priorizado (como o resultado do MoSCoW).
    - **Saídas:** Backlog do produto contendo as Histórias de Usuário documentadas (no padrão "Como [ator], eu quero [ação] para que [valor]") e seus respectivos critérios de aceitação.
    - **Participantes:** Engenheiros de Requisitos.
        
!!! info "Análise e Consenso"

    #### Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)

    - **Descrição:** Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.
    - **Entradas:** Backlog de User Stories e Especificação Suplementar.
    - **Saídas:** Backlog de MVP Priorizado.
    - **Participantes:** Engenheiros de Requisitos, Arquitetos de Software e Cliente.

!!! info "Representação de Requisitos"

    #### MVP Preliminar 

    - **Descrição:** Estruturação da primeira versão reduzida e funcional do sistema, selecionando as funcionalidades essenciais para validar a proposta de valor junto ao cliente com o menor custo e tempo de desenvolvimento possíveis.
    - **Entradas:** Matriz 4x4 (Valor/Impacto vs. Esforço/Custo) e Histórias de Usuário priorizadas.
    - **Saídas:** Escopo fechado do MVP preliminar e plano inicial de validação no campo.
    - **Participantes:** Engenheiros de Requisitos, Equipe Técnica (Desenvolvedores/Designers) e Stakeholders (Product Owner).

!!! info "Verificação e Validação"

    #### Prototipagem Interativa Navegável

    - **Descrição:** Construção de telas e fluxos interativos no Figma para simular visualmente a navegação do produtor, visitante e administrador.
    - **Entradas:** User Stories do MVP e diretrizes de usabilidade.
    - **Saídas:** Protótipo Navegável de Alta/Média Fidelidade.
    - **Participantes:** Designers de UX/UI e Engenheiros de Requisitos.

    #### Testes de Usabilidade com Protótipo

    - **Descrição:** Execução de simulações de tarefas reais com usuários para avaliar a facilidade de uso do protótipo.
    - **Entradas:** Protótipo Navegável e roteiro de tarefas de teste.
    - **Saídas:** Relatório de Usabilidade e Lista de Ajustes de Interface.
    - **Participantes:** Amostra de Produtores Rurais, Consumidores, Anfitriões e Designers de UX/UI.

!!! info "Organização e Atualização"

    #### MVP Totalmente Definido

    - **Descrição:** Consolidação e aprovação final do escopo da primeira versão do produto. Garante que as funcionalidades essenciais, o design de interface e os requisitos técnicos estejam alinhados, detalhados e prontos para o início do desenvolvimento.
    - **Entradas:** Escopo do MVP Preliminar, Histórias de Usuário refinadas (com critérios de aceitação), Requisitos Não Funcionais (RNFs) estabelecidos e Protótipos validados.
    - **Saídas:** Backlog do MVP finalizado e aprovado (pronto para desenvolvimento).
    - **Participantes:** Engenheiros de Requisitos, Cliente e Equipe Técnica (Desenvolvedores e Designers).


<p align="center">
  <img src="../../img/elaboracao.png" alt="Rede Cafuringa - Elaboração" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Construção

!!! info "Elicitação e Descoberta"

    #### Refinamento Iterativo de Requisitos

    - **Descrição:** Revisão dos requisitos e User Stories selecionados para o próximo incremento, esclarecendo dúvidas, regras de negócio, dependências e cenários de exceção identificados durante o desenvolvimento.
    - **Entradas:** Backlog do MVP, User Stories priorizadas e critérios de aceitação.
    - **Saídas:** User Stories refinadas e esclarecidas para implementação.
    - **Participantes:** Engenheiros de Requisitos, Desenvolvedores e Testadores.

!!! info "Implementação"

    #### Desenvolvimento Incremental

    - **Descrição:** Implementação das funcionalidades priorizadas para cada incremento, utilizando como referência os requisitos, critérios de aceitação e protótipos definidos nas fases anteriores.
    - **Entradas:** User Stories refinadas, critérios de aceitação, protótipos e requisitos não funcionais.
    - **Saídas:** Incrementos funcionais do sistema e código-fonte correspondente aos requisitos implementados.
    - **Participantes:** Desenvolvedores, Engenheiros de Requisitos e Designers.

!!! info "Verificação e Validação"

    #### Demonstração dos Incrementos

    - **Descrição:** Apresentação das funcionalidades implementadas para validação junto ao cliente e coleta de feedback sobre o incremento desenvolvido.
    - **Entradas:** Incremento funcional e requisitos correspondentes.
    - **Saídas:** Registro de feedback, aceite do incremento ou solicitações de ajustes.
    - **Participantes:** Cliente, Desenvolvedores, Engenheiros de Requisitos e representantes dos usuários.

!!! info "Análise e Consenso"

    #### Gerenciamento de Mudanças e Repriorização

    - **Descrição:** Análise das solicitações de alteração identificadas durante o desenvolvimento e das novas necessidades observadas a partir dos incrementos entregues.
    - **Entradas:** Feedback do cliente, resultados dos testes e solicitações de mudança.
    - **Saídas:** Requisitos atualizados e backlog repriorizado.
    - **Participantes:** Engenheiros de Requisitos, Cliente e Desenvolvedores.

!!! info "Organização e Atualização"

    #### Atualização da Rastreabilidade

    - **Descrição:** Atualização das relações entre requisitos, User Stories, funcionalidades implementadas, testes e alterações realizadas durante a construção.
    - **Entradas:** Requisitos atualizados, código-fonte, resultados dos testes e registros de mudanças.
    - **Saídas:** Matriz de Rastreabilidade atualizada.
    - **Participantes:** Engenheiros de Requisitos e Desenvolvedores.

<p align="center">
  <img src="../../img/construcao.png" alt="Rede Cafuringa - Construção" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Transição

!!! info "Verificação e Validação"

    #### Desenvolvimento Orientado a Testes (TDD)

    - **Descrição:** Aplicação do ciclo de desenvolvimento orientado a testes para implementar e ajustar as funcionalidades da versão final, escrevendo os testes antes da implementação ou correção do código e verificando continuamente o comportamento esperado do sistema.
    - **Entradas:** Requisitos aprovados, critérios de aceitação, casos de uso, cenários de teste e funcionalidades da versão candidata à entrega.
    - **Saídas:** Suíte de testes automatizados, funcionalidades implementadas ou corrigidas e evidências de aprovação dos testes.
    - **Participantes:** Desenvolvedores, Testadores e Engenheiros de Requisitos.

    #### Testes de Aceitação de Usuário 

    - **Descrição:** Execução de cenários de teste em ambiente de homologação para verificar se o produto atende aos requisitos e critérios de aceitação definidos para o MVP.
    - **Entradas:** Versão candidata à entrega, requisitos aprovados, critérios de aceitação, roteiro de testes e resultados dos testes automatizados.
    - **Saídas:** Relatório de Homologação Final, registro de não conformidades e Termo de Aceite do Produto, condicionado à aprovação da versão.
    - **Participantes:** Cliente, Produtores Rurais, Consumidores, Anfitriões, Testadores e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

    #### Registro da Entrega e Encerramento dos Requisitos

    - **Descrição:** Registro da versão disponibilizada, do aceite do cliente e da situação final dos requisitos, incluindo eventuais limitações ou funcionalidades previstas para versões futuras.
    - **Entradas:** Baseline Final, Termo de Aceite do Produto e registros de homologação.
    - **Saídas:** Registro de Entrega do Produto, aceite final e backlog residual documentado.
    - **Participantes:** Engenheiros de Requisitos, Desenvolvedores e Cliente.

<p align="center">
  <img src="../../img/transicao.png" alt="Rede Cafuringa - Transição" width="90%" style="border-radius: 15px;">
</p>

---

## 5.2 Engenharia de Requisitos e o AUP

A tabela a seguir sintetiza, para cada fase do AUP, como as atividades de Engenharia de Requisitos detalhadas na seção 5.1 se desdobram em prática, técnica/instrumento e resultado/artefato.

| Fase | Atividade de ER | Prática/Operação | Técnica/Instrumento | Resultado/Artefato |
| :--- | :--- | :--- | :--- | :--- |
| **Concepção** | Elicitação e Descoberta | Capturar dores e necessidades do ecossistema local na reunião de contato inicial com o cliente. | Entrevista Semiestruturada com o Cliente | Registro da visão inicial e lista bruta de necessidades de negócio. |
| | Elicitação e Descoberta | Gerar e agrupar ideias sobre o catálogo de produtos e atrativos rurais. | Brainstorming Colaborativo | Mapa mental de funcionalidades potenciais. |
| | Elicitação e Descoberta | Embasar a visão inicial do produto em fontes documentais. | Análise Documental | Base de conhecimento para o Documento de Visão. |
| | Declaração de Requisitos | Sintetizar necessidades em Objetivo Geral, OEs e CPs. | Redação Estruturada do Documento de Visão | Minuta do Documento de Visão (OEs e CPs). |
| | Análise e Consenso | Classificar colaborativamente as intenções de escopo. | Priorização MoSCoW | Lista de escopo preliminar priorizada. |
| | Análise e Consenso | Validar escopo e documentações com o cliente. | Validação Assíncrona com o Cliente | Concordância e aval do cliente para seguir com o escopo. |
| | Verificação e Validação | Revisar tecnicamente o Documento de Visão e sanar lacunas, ambiguidades e inconsistências. | Inspeção por Pares (Revisão Técnica Cruzada) | Relatório de inconsistências sanadas. |
| | Verificação e Validação | Confirmar objetivos e decisões de processo nas reuniões de revisão. | Reuniões de Revisão da Entrega | Registro de Decisões e vídeos comprobatórios. |
| | Organização e Atualização | Indexar OEs e CPs, atribuir estado de aprovação e registrar no repositório oficial. | Atribuição de Metadados & Versionamento | Baseline 0 - Escopo de Visão Inicial. |
| **Elaboração** | Elicitação e Descoberta | Investigar regulamentações, LGPD e regras fiscais/municipais locais. | Análise de Domínio e Pesquisa Normativa | Mapeamento de regras de negócio normativas e restrições legais. |
| | Elicitação e Descoberta | Mapear processos de campo e restrições operacionais, incluindo baixa conectividade. | Grupo Focal (Focus Group) | Relatório de restrições operacionais e de conectividade. |
| | Declaração de Requisitos | Estruturar as Características do Produto em Histórias de Usuário com critérios de aceite. | Decomposição Funcional das Características do Produto em User Stories | Backlog de User Stories preliminares. |
| | Declaração de Requisitos | Detalhar restrições de desempenho, usabilidade, operação offline e segurança. | Especificação de Requisitos Não Funcionais (RNFs) | Especificação Suplementar de RNFs. |
| | Análise e Consenso | Ponderar valor para os usuários e esforço de engenharia para delimitar o MVP. | Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica) | Backlog de MVP Priorizado. |
| | Representação de Requisitos | Simular visualmente a navegação de produtor, visitante e administrador. | Prototipagem Interativa Navegável | Protótipo Navegável de Alta/Média Fidelidade. |
| | Verificação e Validação | Simular tarefas reais com usuários e avaliar a facilidade de uso. | Testes de Usabilidade com Protótipo | Relatório de Usabilidade e Lista de Ajustes de Interface. |
| | Verificação e Validação | Validar regras jurídicas e de negócio com especialistas e cliente. | Sessão de Homologação Regulatória e Negocial | Termo de Aprovação Regulatória e Negocial. |
| | Organização e Atualização | Vincular Necessidades, OEs, CPs, User Stories, RNFs e protótipo. | Mapeamento de Rastreabilidade Bidirecional | Matriz de Rastreabilidade - Versão Inicial. |
| | Organização e Atualização | Congelar escopo e requisitos estruturantes aprovados para a Construção. | Formalização de Baseline Arquitetural e Funcional | Baseline 1 - Requisitos e Arquitetura Congelados. |
| **Construção** | Elicitação e Descoberta | Revisar os requisitos e User Stories selecionados para o próximo incremento, esclarecendo dúvidas, regras de negócio, dependências e cenários de exceção. | Refinamento Iterativo de Requisitos | User Stories refinadas e esclarecidas para implementação. |
| | Implementação | Implementar as funcionalidades priorizadas para cada incremento com base nos requisitos, critérios de aceitação, protótipos e requisitos não funcionais. | Desenvolvimento Incremental | Incrementos funcionais do sistema e código-fonte correspondente aos requisitos implementados. |
| | Verificação e Validação | Apresentar as funcionalidades implementadas para validação junto ao cliente e coletar feedback sobre o incremento desenvolvido. | Demonstração dos Incrementos | Registro de feedback, aceite do incremento ou solicitações de ajustes. |
| | Análise e Consenso | Analisar solicitações de alteração e novas necessidades identificadas durante o desenvolvimento e os incrementos entregues. | Gerenciamento de Mudanças e Repriorização | Requisitos atualizados e backlog repriorizado. |
| | Organização e Atualização | Atualizar as relações entre requisitos, User Stories, funcionalidades implementadas, testes e alterações realizadas durante a construção. | Atualização da Rastreabilidade | Matriz de Rastreabilidade atualizada. |
| **Transição** | Verificação e Validação | Aplicar o ciclo de desenvolvimento orientado a testes para implementar e ajustar funcionalidades da versão final, verificando continuamente o comportamento esperado do sistema. | Desenvolvimento Orientado a Testes (TDD) | Suíte de testes automatizados, funcionalidades implementadas ou corrigidas e evidências de aprovação dos testes. |
| | Verificação e Validação | Executar cenários de teste em ambiente de homologação para verificar se o produto atende aos requisitos e critérios de aceitação definidos para o MVP. | Testes de Aceitação de Usuário (TAU / Homologação Final) | Relatório de Homologação Final, registro de não conformidades e Termo de Aceite do Produto. |
| | Organização e Atualização | Registrar a versão disponibilizada, o aceite do cliente e a situação final dos requisitos, incluindo limitações ou funcionalidades previstas para versões futuras. | Registro da Entrega e Encerramento dos Requisitos | Registro de Entrega do Produto, aceite final e backlog residual documentado. |