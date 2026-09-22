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

    #### Análise Documental

    - **Descrição:** Estudo do template de entregas da disciplina, da bibliografia de Requisitos de Software e dos canais digitais ativos da Rede Cafuringa para embasar a visão inicial do produto.
    - **Entradas:** Template de entregas, bibliografia e redes sociais ativas da Cafuringa.
    - **Saídas:** Base de conhecimento para a redação do Documento de Visão.
    - **Participantes:** Engenheiros de Requisitos.

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

    #### Inspeção por Pares (Revisão Técnica Cruzada)

    - **Descrição:** Leitura técnica do Documento de Visão entre os membros da equipe para identificar lacunas, ambiguidades e inconsistências.
    - **Entradas:** Minuta do Documento de Visão.
    - **Saídas:** Relatório de inconsistências sanadas.
    - **Participantes:** Engenheiros de Requisitos.

    #### Reuniões de Revisão da Entrega

    - **Descrição:** Reuniões de revisão para confirmação dos objetivos geral e específicos e das decisões de abordagem, ciclo de vida e processo de software.
    - **Entradas:** Minuta do Documento de Visão revisada.
    - **Saídas:** Registro de Decisões e vídeos comprobatórios das reuniões.
    - **Participantes:** Engenheiros de Requisitos e Equipe de Desenvolvimento.

!!! info "Organização e Atualização"

    #### Atribuição de Metadados & Versionamento

    - **Descrição:** Indexação de cada OE e CP com códigos identificadores únicos e atribuição de estado de aprovação, com migração das decisões consolidadas no documento compartilhado para o repositório oficial (GitPages).
    - **Entradas:** Documento de Visão validado.
    - **Saídas:** Baseline 0 - Escopo de Visão Inicial versionado no repositório oficial (GitPages).
    - **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/concepcao.png" alt="Rede Cafuringa - Concepção" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Elaboração

!!! info "Elicitação e Descoberta"

    #### Análise de Domínio e Pesquisa Normativa

    - **Descrição:** Investigação documental de regulamentações do turismo rural, LGPD e regras fiscais/municipais locais.
    - **Entradas:** Legislação de turismo rural e requisitos da Baseline 0.
    - **Saídas:** Mapeamento de regras de negócio normativas e restrições legais.
    - **Participantes:** Engenheiros de Requisitos e Consultores/Fontes Regulatórias.

    #### Grupo Focal (Focus Group)

    - **Descrição:** Reuniões em grupo com anfitriões para mapear processos de campo e restrições operacionais.
    - **Entradas:** Roteiro de tópicos operacionais e mapa de processos locais.
    - **Saídas:** Relatório de restrições operacionais e de conectividade.
    - **Participantes:** Engenheiros de Requisitos, Amostra de Produtores Rurais e Anfitriões.

!!! info "Declaração de Requisitos"

    #### Decomposição Funcional das Características do Produto em User Stories

    - **Descrição:** Estruturação das Características do Produto (CPs) em Histórias de Usuário (_User Stories_) contendo critérios de aceite em linguagem estruturada.
    - **Entradas:** CPs da Baseline 0 e relatório de restrições operacionais.
    - **Saídas:** Backlog de User Stories preliminares (Artefato).
    - **Participantes:** Engenheiros de Requisitos.

    #### Especificação de Requisitos Não Funcionais (RNFs)

    - **Descrição:** Detalhamento de restrições de desempenho, usabilidade, operação _offline_ e segurança.
    - **Entradas:** Relatório de restrições operacionais e arquitetura pretendida.
    - **Saídas:** Especificação Suplementar de RNFs (Artefato).
    - **Participantes:** Engenheiros de Requisitos e Arquitetos de Software.

!!! info "Análise e Consenso"

    #### Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)

    - **Descrição:** Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.
    - **Entradas:** Backlog de User Stories e Especificação Suplementar.
    - **Saídas:** Backlog de MVP Priorizado.
    - **Participantes:** Engenheiros de Requisitos, Arquitetos de Software e Cliente.

!!! info "Representação de Requisitos"

    #### Prototipagem Interativa Navegável

    - **Descrição:** Construção de telas e fluxos interativos no Figma para simular visualmente a navegação do produtor, visitante e administrador.
    - **Entradas:** User Stories do MVP e diretrizes de usabilidade.
    - **Saídas:** Protótipo Navegável de Alta/Média Fidelidade (Artefato).
    - **Participantes:** Designers de UX/UI e Engenheiros de Requisitos.

!!! info "Verificação e Validação"

    #### Testes de Usabilidade com Protótipo

    - **Descrição:** Execução de simulações de tarefas reais com usuários para avaliar a facilidade de uso do protótipo.
    - **Entradas:** Protótipo Navegável e roteiro de tarefas de teste.
    - **Saídas:** Relatório de Usabilidade e Lista de Ajustes de Interface.
    - **Participantes:** Amostra de Produtores Rurais, Consumidores, Anfitriões e Designers de UX/UI.

    #### Sessão de Homologação Regulatória e Negocial

    - **Descrição:** Validação direta das regras jurídicas e de negócio do sistema com especialistas e a cliente.
    - **Entradas:** Mapeamento de regras normativas e especificações das User Stories.
    - **Saídas:** Termo de Aprovação Regulatória e Negocial.
    - **Participantes:** Cliente, Fontes Competentes/Especialistas e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

    #### Mapeamento de Rastreabilidade Bidirecional

    - **Descrição:** Vinculação formal entre Necessidades, OEs, CPs, User Stories, RNFs e elementos do protótipo.
    - **Entradas:** User Stories aprovadas, RNFs e Protótipo validado.
    - **Saídas:** Matriz de Rastreabilidade - Versão Inicial (Artefato).
    - **Participantes:** Engenheiros de Requisitos.

    #### Formalização de Baseline Arquitetural e Funcional

    - **Descrição:** Congelamento do escopo e requisitos estruturantes aprovados para a fase de construção.
    - **Entradas:** Matriz de Rastreabilidade e Termos de Aceite.
    - **Saídas:** Baseline 1 - Requisitos e Arquitetura Congelados (Estado de controle).
    - **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/elaboracao.png" alt="Rede Cafuringa - Elaboração" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Construção

!!! info "Elicitação e Descoberta"

    #### Refinamento Iterativo de Backlog (_Backlog Refinement_)

    - **Descrição:** Análise técnica detalhada das User Stories prestes a entrar em desenvolvimento para esclarecimento de dúvidas e cenários de exceção.
    - **Entradas:** User Stories da Baseline 1.
    - **Saídas:** User Stories refinadas com detalhes operacionais.
    - **Participantes:** Engenheiros de Requisitos, Desenvolvedores, Testadores e Amostra de Produtores Rurais/Usuários.

!!! info "Declaração de Requisitos"

    #### Detalhamento _Just-In-Time_ (JIT) de Critérios de Aceite

    - **Descrição:** Redação de cenários de comportamento e dados de entrada nos cartões de tarefas do GitHub Projects.
    - **Entradas:** User Stories refinadas.
    - **Saídas:** Cartões de User Stories preenchidos com critérios de aceite completos (Atendimento ao DoR - _Definition of Ready_).
    - **Participantes:** Engenheiros de Requisitos, Desenvolvedores e Testadores.

!!! info "Análise e Consenso"

    #### Repriorização Adaptativa de Fluxo

    - **Descrição:** Negociação de ajustes e trocas no backlog do produto (GitHub Projects) com base no aprendizado obtido nos incrementos já construídos.
    - **Entradas:** Solicitações de mudança e feedback de entregas incrementais.
    - **Saídas:** Backlog do produto (GitHub Projects) repriorizado.
    - **Participantes:** Engenheiros de Requisitos, Cliente e Desenvolvedores.

!!! info "Verificação e Validação"

    #### Verificação Técnica por Checklists (DoR/DoD)

    - **Descrição:** Avaliação de conformidade das histórias antes do desenvolvimento (_Definition of Ready_) e após a codificação (_Definition of Done_).
    - **Entradas:** Código-fonte, suíte de testes e checklists DoR/DoD.
    - **Saídas:** Checklist de verificação preenchido e aprovado.
    - **Participantes:** Engenheiros de Requisitos, Desenvolvedores e Testadores.

    #### Demonstração do Incremental (_Sprint/Flow Demo_)

    - **Descrição:** Apresentação prática das funcionalidades prontas no ambiente de desenvolvimento.
    - **Entradas:** Software funcional testado.
    - **Saídas:** Registro de Aceite Incremental e lista de melhorias.
    - **Participantes:** Cliente, Amostra de Produtores Rurais, Consumidores, Desenvolvedores e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

    #### Atualização Dinâmica de Rastreabilidade

    - **Descrição:** Associação dos módulos de código, suítes de testes automatizados e commits às User Stories correspondentes.
    - **Entradas:** User Stories concluídas (DoD atingido) e código aprovado.
    - **Saídas:** Matriz de Rastreabilidade Atualizada (Artefato).
    - **Participantes:** Engenheiros de Requisitos e Desenvolvedores.

<p align="center">
  <img src="../../img/construcao.png" alt="Rede Cafuringa - Construção" width="90%" style="border-radius: 15px;">
</p>

---

### Fase de Transição

!!! info "Verificação e Validação"

    #### Testes de Aceitação de Usuário (TAU / Homologação Final)

    - **Descrição:** Execução de roteiros práticos de teste em ambiente de homologação pelos usuários finais para validação do sistema completo.
    - **Entradas:** Versão final do software (_Release Candidate_) e Roteiro de TAU.
    - **Saídas:** Relatório de Homologação Final e Termo de Aceite do Produto (Artefato).
    - **Participantes:** Cliente, Produtores Rurais, Consumidores, Anfitriões e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

    #### Consolidação de Documentação _As-Built_ e Baseline Final

    - **Descrição:** Atualização final de todos os artefatos para refletir a versão exata do software em produção.
    - **Entradas:** Termo de Aceite do Produto e Matriz de Rastreabilidade do GitHub Projects.
    - **Saídas:** Baseline Final - _As-Built_ (Estado de controle) e Matriz de Rastreabilidade Consolidada (Artefato).
    - **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/transicao.png" alt="Rede Cafuringa - Transição" width="90%" style="border-radius: 15px;">
</p>

---

## 5.2 Engenharia de Requisitos e o AUP

A tabela a seguir sintetiza, para cada fase do AUP, como as atividades de Engenharia de Requisitos detalhadas na seção 5.1 se desdobram em prática, técnica/instrumento e resultado/artefato.

| Fase           | Atividade de ER             | Prática/Operação                                                                                | Técnica/Instrumento                                                   | Resultado/Artefato                                                                                                |
| :------------- | :-------------------------- | :---------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Concepção**  | Elicitação e Descoberta     | Capturar dores e necessidades do ecossistema local na reunião de contato inicial com o cliente. | Entrevista Semiestruturada com o Cliente                              | Registro da visão inicial e lista bruta de necessidades de negócio.                                               |
|                | Elicitação e Descoberta     | Gerar e agrupar ideias sobre o catálogo de produtos e atrativos rurais.                         | Brainstorming Colaborativo                                            | Mapa mental de funcionalidades potenciais.                                                                        |
|                | Elicitação e Descoberta     | Embasar a visão inicial do produto em fontes documentais.                                       | Análise Documental                                                    | Base de conhecimento para o Documento de Visão.                                                                   |
|                | Declaração de Requisitos    | Sintetizar necessidades em Objetivo Geral, OEs e CPs.                                           | Redação Estruturada do Documento de Visão                             | Minuta do Documento de Visão (OEs e CPs).                                                                         |
|                | Análise e Consenso          | Classificar colaborativamente as intenções de escopo.                                           | Priorização MoSCoW                                                    | Lista de escopo preliminar priorizada.                                                                            |
|                | Análise e Consenso          | Validar escopo e documentações com o cliente.                                                   | Validação Assíncrona com o Cliente                                    | Concordância e aval do cliente para seguir com o escopo.                                                          |
|                | Verificação e Validação     | Revisar tecnicamente o Documento de Visão e sanar lacunas, ambiguidades e inconsistências.      | Inspeção por Pares (Revisão Técnica Cruzada)                          | Relatório de inconsistências sanadas.                                                                             |
|                | Verificação e Validação     | Confirmar objetivos e decisões de processo nas reuniões de revisão.                             | Reuniões de Revisão da Entrega                                        | Registro de Decisões e vídeos comprobatórios.                                                                     |
|                | Organização e Atualização   | Indexar OEs e CPs, atribuir estado de aprovação e registrar no repositório oficial.             | Atribuição de Metadados & Versionamento                               | Baseline 0 - Escopo de Visão Inicial.                                                                             |
| **Elaboração** | Elicitação e Descoberta     | Investigar regulamentações, LGPD e regras fiscais/municipais locais.                            | Análise de Domínio e Pesquisa Normativa                               | Mapeamento de regras de negócio normativas e restrições legais.                                                   |
|                | Elicitação e Descoberta     | Mapear processos de campo e restrições operacionais, incluindo baixa conectividade.             | Grupo Focal (Focus Group)                                             | Relatório de restrições operacionais e de conectividade.                                                          |
|                | Declaração de Requisitos    | Estruturar as Características do Produto em Histórias de Usuário com critérios de aceite.       | Decomposição Funcional das Características do Produto em User Stories | Backlog de User Stories preliminares.                                                                             |
|                | Declaração de Requisitos    | Detalhar restrições de desempenho, usabilidade, operação offline e segurança.                   | Especificação de Requisitos Não Funcionais (RNFs)                     | Especificação Suplementar de RNFs.                                                                                |
|                | Análise e Consenso          | Ponderar valor para os usuários e esforço de engenharia para delimitar o MVP.                   | Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)      | Backlog de MVP Priorizado.                                                                                        |
|                | Representação de Requisitos | Simular visualmente a navegação de produtor, visitante e administrador.                         | Prototipagem Interativa Navegável                                     | Protótipo Navegável de Alta/Média Fidelidade.                                                                     |
|                | Verificação e Validação     | Simular tarefas reais com usuários e avaliar a facilidade de uso.                               | Testes de Usabilidade com Protótipo                                   | Relatório de Usabilidade e Lista de Ajustes de Interface.                                                         |
|                | Verificação e Validação     | Validar regras jurídicas e de negócio com especialistas e cliente.                              | Sessão de Homologação Regulatória e Negocial                          | Termo de Aprovação Regulatória e Negocial.                                                                        |
|                | Organização e Atualização   | Vincular Necessidades, OEs, CPs, User Stories, RNFs e protótipo.                                | Mapeamento de Rastreabilidade Bidirecional                            | Matriz de Rastreabilidade - Versão Inicial.                                                                       |
|                | Organização e Atualização   | Congelar escopo e requisitos estruturantes aprovados para a Construção.                         | Formalização de Baseline Arquitetural e Funcional                     | Baseline 1 - Requisitos e Arquitetura Congelados.                                                                 |
| **Construção** | Elicitação e Descoberta     | Esclarecer dúvidas e cenários de exceção das histórias próximas do desenvolvimento.             | Refinamento Iterativo de Backlog (Backlog Refinement)                 | User Stories refinadas com detalhes operacionais.                                                                 |
|                | Declaração de Requisitos    | Redigir cenários de comportamento e dados de entrada nos cartões de tarefas do GitHub Projects. | Detalhamento Just-In-Time (JIT) de Critérios de Aceite                | Cartões de User Stories preenchidos com critérios de aceite completos (Atendimento ao DoR - Definition of Ready). |
|                | Análise e Consenso          | Negociar ajustes e trocas no backlog com base no aprendizado dos incrementos.                   | Repriorização Adaptativa de Fluxo                                     | Backlog do produto (GitHub Projects) repriorizado.                                                                |
|                | Verificação e Validação     | Avaliar conformidade antes do desenvolvimento e após a codificação.                             | Verificação Técnica por Checklists (DoR/DoD)                          | Checklist de verificação preenchido e aprovado.                                                                   |
|                | Verificação e Validação     | Apresentar funcionalidades prontas no ambiente de desenvolvimento.                              | Demonstração do Incremental (Sprint/Flow Demo)                        | Registro de Aceite Incremental e lista de melhorias.                                                              |
|                | Organização e Atualização   | Associar módulos, testes automatizados e commits às User Stories.                               | Atualização Dinâmica de Rastreabilidade                               | Matriz de Rastreabilidade Atualizada.                                                                             |
| **Transição**  | Verificação e Validação     | Executar roteiros práticos com usuários finais em ambiente de homologação.                      | Testes de Aceitação de Usuário (TAU / Homologação Final)              | Relatório de Homologação Final e Termo de Aceite do Produto.                                                      |
|                | Organização e Atualização   | Atualizar artefatos para refletir a versão exata do software em produção.                       | Consolidação de Documentação As-Built e Baseline Final                | Baseline Final - As-Built e Matriz de Rastreabilidade Consolidada.                                                |
