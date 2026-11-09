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

    #### Documento Estruturado de Visão

    - **Descrição:** Síntese e agrupamento das necessidades brutas em Objetivo Geral, Objetivos Específicos (OEs) e Características do Produto (CPs).
    - **Entradas:** Mapa mental de funcionalidades e registro da entrevista inicial.
    - **Saídas:** Narrativas em texto livre.
    - **Participantes:** Engenheiros de Requisitos.

    #### Histórias de Usuário (Preliminar)

    - **Descrição:** Tradução e escrita das necessidades elicitadas em formato narrativo sob a perspectiva do usuário final (focando em quem, o que e por que), incluindo a definição dos critérios de aceitação para cada funcionalidade.
    - **Entradas:** Escopo inicial (como o resultado do MoSCoW preliminar).
    - **Saídas:** Histórias de Usuário documentadas (no padrão "Como [ator], eu quero [ação] para que [valor]") e seus respectivos critérios de aceitação.
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

---

### Fase de Elaboração

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

    #### Critérios de Aceitação

    - **Descrição:** Transforma intenções ou necessidades humanas num conjunto de condições objetivas, lógicas e estritamente verificáveis.
    - **Entradas:** Histórias de usuário.
    - **Saídas:** Quadro com os critérios de aceitação das histórias de usuário previamente definidas.
    - **Participantes:** Engenheiros de Requisitos.

!!! info "Análise e Consenso"

    #### Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)

    - **Descrição:** Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.
    - **Entradas:** Backlog de User Stories e Especificação Suplementar.
    - **Saídas:** Backlog de MVP Priorizado.
    - **Participantes:** Engenheiros de Requisitos, Arquitetos de Software e Cliente.

!!! info "Representação de Requisitos"

    #### MVP 

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

---

### Fase de Construção

!!! info "Verificação e Validação"

    #### Demonstração dos Incrementos

    - **Descrição:** Apresentação das funcionalidades implementadas para validação junto ao cliente e coleta de feedback sobre o incremento desenvolvido.
    - **Entradas:** Incremento funcional e requisitos correspondentes.
    - **Saídas:** Registro de feedback, aceite do incremento ou solicitações de ajustes.
    - **Participantes:** Cliente, Desenvolvedores, Engenheiros de Requisitos e representantes dos usuários.

    #### DoR e DoD

    - **Descrição:** Apresentação e validação das funcionalidades implementadas junto ao cliente, garantindo que os itens atendam aos critérios de prontidão antes do desenvolvimento e aos critérios de conclusão antes da entrega final.
    - **Entradas:** Incremento funcional, backlog priorizado e requisitos correspondentes.
    - **Saídas:** Registro de feedback, aceite do incremento, histórico de itens prontos para desenvolvimento e solicitações de ajustes.
    - **Participantes:** Cliente, Desenvolvedores e Engenheiros de RequisitoS.

!!! info "Organização e Atualização"

    #### Atualização da Rastreabilidade

    - **Descrição:** Atualização das relações entre requisitos, User Stories, funcionalidades implementadas, testes e alterações realizadas durante a construção.
    - **Entradas:** Requisitos atualizados, código-fonte, resultados dos testes e registros de mudanças.
    - **Saídas:** Matriz de Rastreabilidade atualizada.
    - **Participantes:** Engenheiros de Requisitos e Desenvolvedores.

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

---

## 5.2 Engenharia de Requisitos e o AUP

A tabela a seguir sintetiza, para cada fase do AUP, como as atividades de Engenharia de Requisitos detalhadas na seção 5.1 se desdobram em prática, técnica/instrumento e resultado/artefato.

| Fase | Atividade de ER | Prática/Operação | Técnica/Instrumento | Resultado/Artefato |
| :--- | :--- | :--- | :--- | :--- |
| **Concepção** | Elicitação e Descoberta | Capturar dores e necessidades do ecossistema local na reunião de contato inicial com o cliente. | Entrevista Semiestruturada com o Cliente | Registro da visão inicial e lista bruta de necessidades de negócio. |
| | Elicitação e Descoberta | Gerar e agrupar ideias sobre o catálogo de produtos e atrativos rurais. | Brainstorming Colaborativo | Mapa mental de funcionalidades potenciais. |
| | Elicitação e Descoberta | Consultar documentos e informações de referência para ampliar a compreensão do contexto do projeto. | Análise Documental | Informações de apoio à construção da visão inicial do produto. |
| | Declaração de Requisitos | Sintetizar as necessidades identificadas em objetivos e características iniciais do produto. | Redação de Narrativas em Texto Livre | Documento de Visão Inicial, com Objetivos Gerais, Objetivos Específicos e Características do Produto. |
| | Declaração de Requisitos | Representar preliminarmente as necessidades sob a perspectiva dos usuários. | Histórias de Usuário Preliminares | Registro inicial das necessidades dos usuários. |
| | Análise e Consenso | Classificar colaborativamente as intenções de escopo. | Priorização MoSCoW | Lista de escopo preliminar priorizada. |
| | Análise e Consenso | Validar o escopo e as documentações com o cliente. | Validação Assíncrona com o Cliente | Registros de alinhamento e aprovação das documentações iniciais. |
| | Verificação e Validação | Revisar objetivos e decisões relacionadas à abordagem, ao ciclo de vida e ao processo de software. | Reuniões de Revisão da Entrega | Registros de decisões e vídeos comprobatórios. |
| | Organização e Atualização | Identificar, organizar e versionar os documentos e decisões consolidados. | Atribuição de Metadados e Versionamento | Documentação inicial centralizada no repositório oficial e publicada no GitHub Pages. |
| **Elaboração** | Elicitação e Descoberta | Aprofundar o entendimento do contexto local e identificar necessidades durante a visita presencial à APA de Cafuringa. | Visita Técnica e Conversa com o Cliente | Informações complementares sobre a realidade local e necessidades dos stakeholders. |
| | Declaração de Requisitos | Estruturar as necessidades identificadas em requisitos funcionais e não funcionais. | Especificação de Requisitos (RFs e RNFs) | Documento de Requisitos de Software. |
| | Declaração de Requisitos | Traduzir as necessidades dos usuários em histórias estruturadas e verificáveis. | Elaboração de Histórias de Usuário e Critérios de Aceitação | Backlog de Histórias de Usuário com respectivos critérios de aceitação. |
| | Declaração de Requisitos | Classificar os requisitos conforme sua criticidade e contribuição para o produto. | Priorização MoSCoW | Requisitos classificados em Must Have, Should Have, Could Have e Won't Have. |
| | Análise e Consenso | Ponderar o valor para os usuários e o esforço de engenharia necessário para cada requisito. | Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica) | Requisitos avaliados e priorizados para composição do MVP. |
| | Representação de Requisitos | Consolidar as funcionalidades essenciais para a primeira versão do produto. | Definição e Estruturação do MVP | Escopo formalizado do Produto Mínimo Viável. |
| | Verificação e Validação | Simular visualmente a navegação dos diferentes perfis de usuários. | Prototipagem Interativa Navegável no Figma | Protótipo navegável das principais funcionalidades da plataforma. |
| | Verificação e Validação | Apresentar a representação visual das funcionalidades para apoiar a compreensão e validação da solução proposta. | Apresentação do Protótipo do MVP | Protótipo apresentado e submetido à validação do cliente. |
| | Organização e Atualização | Organizar os critérios para início e conclusão das atividades de desenvolvimento. | Definition of Ready (DoR) e Definition of Done (DoD) | Checklists de prontidão e conclusão das atividades. |
| **Construção** | Declaração de Requisitos | Consultar as histórias de usuário e especificações aprovadas como referência para o desenvolvimento dos incrementos. | Histórias de Usuário e Critérios de Aceitação | Especificações utilizadas como base para implementação. |
| | Implementação | Desenvolver incrementalmente as funcionalidades previstas no MVP, conforme as histórias de usuário planejadas para cada iteração. | Desenvolvimento Incremental | Funcionalidades implementadas e código-fonte correspondente. |
| | Verificação e Validação | Verificar se as funcionalidades concluídas atendem às condições estabelecidas para sua conclusão. | Definition of Done (DoD) | Registros de verificação e conclusão das histórias de usuário. |
| | Verificação e Validação | Avaliar a prontidão das atividades antes do início do desenvolvimento. | Definition of Ready (DoR) | Critérios documentados para preparação das histórias de usuário. |
| | Organização e Atualização | Manter os registros das histórias de usuário, critérios de aceitação e evidências de conclusão atualizados. | Atualização da Documentação e Rastreabilidade | Histórias de usuário documentadas e registros de conclusão associados. |
| **Transição** | Verificação e Validação | Aplicar testes orientados ao desenvolvimento para verificar o comportamento esperado das funcionalidades e identificar possíveis inconsistências. | Desenvolvimento Orientado a Testes (TDD) | Registros e evidências dos testes realizados. |
| | Verificação e Validação | Avaliar a conformidade do produto com as necessidades dos usuários e os critérios de aceitação definidos para o MVP. | Testes de Aceitação de Usuário (TAU / UAT) | Registros de testes e resultados da avaliação de aceitação. |
| | Organização e Atualização | Consolidar os registros de entrega, documentar a situação final dos requisitos e organizar os artefatos do produto. | Registro da Entrega e Encerramento dos Requisitos | Documentação consolidada, registro de entrega e situação final dos requisitos. |
