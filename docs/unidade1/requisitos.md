<span class="version-badge">Unidade 01</span>

# 5.1 Atividades e Técnicas de Engenharia de Requisitos (ER)

Abaixo apresenta-se a estruturação operacional detalhada das **Atividades e Técnicas de ER** executadas nas fases do _Agile Unified Process_ (AUP). Cada atividade especifica as técnicas aplicadas, insumos necessários (entradas), entregáveis gerados (saídas) e os atores/stakeholders envolvidos.

---

## Fase de Concepção

!!! info "Elicitação e Descoberta"

#### Entrevistas Semiestruturadas

- **Descrição:** Aplicação de roteiros flexíveis de perguntas em sessões individuais com produtores rurais, anfitriões de experiências, consumidores e a cliente para capturar dores e necessidades do ecossistema local.
- **Entradas:** Roteiros de entrevista e mapa de partes interessadas.
- **Saídas:** Transcrições de áudio/texto e lista bruta de necessidades de negócio.
- **Participantes:** Engenheiros de Requisitos, Cliente, Amostra de Produtores Rurais, Anfitriões e Consumidores.

#### Brainstorming Colaborativo

- **Descrição:** Reunião conjunta para geração livre e agrupamento de ideias sobre o catálogo de produtos e atrativos rurais.
- **Entradas:** Lista bruta de necessidades.
- **Saídas:** Mapa mental de funcionalidades potenciais.
- **Participantes:** Equipe de Desenvolvimento, Cliente e Representantes dos Usuários.

!!! info "Declaração de Requisitos"

#### Redação Estruturada & Mapeamento de Épicos

- **Descrição:** Síntese e agrupamento das necessidades brutas em Objetivos Específicos (OEs), Características do Produto (CPs) e Épicos Iniciais.
- **Entradas:** Mapa mental de funcionalidades e transcrições de entrevistas.
- **Saídas:** Minuta do Documento de Visão (Artefato) e Lista Inicial de Épicos (Artefato).
- **Participantes:** Engenheiros de Requisitos.

!!! info "Análise e Consenso"

#### Priorização MoSCoW

- **Descrição:** Classificação colaborativa das intenções de escopo nas categorias _Must_, _Should_, _Could_ e _Won't_.
- **Entradas:** Minuta do Documento de Visão (OEs, CPs e Épicos).
- **Saídas:** Lista de escopo preliminar priorizada.
- **Participantes:** Engenheiros de Requisitos, Cliente, Amostra de Produtores e Consumidores.

!!! info "Verificação e Validação"

#### Inspeção por Pares (Revisão Técnica Cruzada)

- **Descrição:** Leitura técnica do Documento de Visão entre os membros da equipe para identificar lacunas, ambiguidades e inconsistências.
- **Entradas:** Minuta do Documento de Visão.
- **Saídas:** Relatório de inconsistências sanadas.
- **Participantes:** Engenheiros de Requisitos.

#### Walkthrough com Stakeholders

- **Descrição:** Apresentação guiada dos OEs e CPs para a cliente e representantes da comunidade para confirmação de premissas.
- **Entradas:** Minuta do Documento de Visão revisada.
- **Saídas:** Termo de Aceite do Escopo Inicial e Registro de Decisões.
- **Participantes:** Cliente, Amostra de Produtores Rurais e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

#### Atribuição de Metadados & Versionamento

- **Descrição:** Indexação de cada OE, CP e Épico com códigos identificadores únicos e atribuição de estado de aprovação.
- **Entradas:** Documento de Visão validado.
- **Saídas:** Baseline 0 - Escopo de Visão Inicial (Estado de controle).
- **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/concepcao.png" alt="Rede Cafuringa - Concepção" width="90%" style="border-radius: 15px;">
</p>

---

## Fase de Elaboração

!!! info "Elicitação e Descoberta"

#### Análise de Domínio e Pesquisa Normativa

- **Descrição:** Investigação documental de regulamentações do turismo rural, LGPD e regras fiscais/municipais locais.
- **Entradas:** Legislação de turismo rural e requisitos da Baseline 0.
- **Saídas:** Mapeamento de regras de negócio normativas e restrições legais.
- **Participantes:** Engenheiros de Requisitos e Consultores/Fontes Regulatórias.

#### Grupo Focal (Focus Group)

- **Descrição:** Reuniões em grupo com produtores rurais e anfitriões para mapear processos de campo e restrições operacionais (como áreas com baixa conectividade).
- **Entradas:** Roteiro de tópicos operacionais e mapa de processos locais.
- **Saídas:** Relatório de restrições operacionais e de conectividade.
- **Participantes:** Engenheiros de Requisitos, Amostra de Produtores e Anfitriões.

!!! info "Declaração de Requisitos"

#### Decomposição Funcional de Épicos em User Stories

- **Descrição:** Estruturação dos Épicos em Histórias de Usuário (_User Stories_) contendo critérios de aceite em linguagem estruturada.
- **Entradas:** Épicos da Baseline 0 e relatório de restrições operacionais.
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
- **Participantes:** Engenheiros de Requisitos, Arquitetos de Software, Cliente e Amostra de Produtores e Consumidores.

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

- **Descrição:** Vinculação formal entre Necessidades, Épicos, User Stories, RNFs e elementos do protótipo.
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

## Fase de Construção

!!! info "Elicitação e Descoberta"

#### Refinamento Iterativo de Backlog (_Backlog Refinement_)

- **Descrição:** Análise técnica detalhada das User Stories prestes a entrar em desenvolvimento para esclarecimento de dúvidas e cenários de exceção.
- **Entradas:** User Stories da Baseline 1.
- **Saídas:** User Stories refinadas com detalhes operacionais.
- **Participantes:** Engenheiros de Requisitos, Desenvolvedores, Testadores e Amostra de Produtores/Usuários.

!!! info "Declaração de Requisitos"

#### Detalhamento _Just-In-Time_ (JIT) de Critérios de Aceite

- **Descrição:** Redação de cenários de comportamento e dados de entrada nos cartões do Kanban.
- **Entradas:** User Stories refinadas.
- **Saídas:** Cartões de User Stories preenchidos com critérios de aceite completos (Atendimento ao DoR - _Definition of Ready_).
- **Participantes:** Engenheiros de Requisitos, Desenvolvedores e Testadores.

!!! info "Análise e Consenso"

#### Repriorização Adaptativa de Fluxo

- **Descrição:** Negociação de ajustes e trocas no backlog do Kanban com base no aprendizado obtido nos incrementos já construídos.
- **Entradas:** Solicitações de mudança e feedback de entregas incrementais.
- **Saídas:** Backlog do Kanban repriorizado.
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
- **Participantes:** Cliente, Amostra de Produtores, Consumidores, Desenvolvedores e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

#### Atualização Dinâmica de Rastreabilidade

- **Descrição:** Associação dos módulos de código, suítes de teste automatizado e commits às User Stories correspondentes.
- **Entradas:** User Stories concluídas (DoD atingido) e código aprovado.
- **Saídas:** Matriz de Rastreabilidade Atualizada (Artefato).
- **Participantes:** Engenheiros de Requisitos e Desenvolvedores.

<p align="center">
  <img src="../../img/construcao.png" alt="Rede Cafuringa - Construção" width="90%" style="border-radius: 15px;">
</p>

---

## Fase de Transição

!!! info "Verificação e Validação"

#### Testes de Aceitação de Usuário (TAU / Homologação Final)

- **Descrição:** Execução de roteiros práticos de teste em ambiente de homologação pelos usuários finais para validação do sistema completo.
- **Entradas:** Versão final do software (_Release Candidate_) e Roteiro de TAU.
- **Saídas:** Relatório de Homologação Final e Termo de Aceite do Produto (Artefato).
- **Participantes:** Cliente, Produtores Rurais, Consumidores, Anfitriões e Engenheiros de Requisitos.

!!! info "Organização e Atualização"

#### Consolidação de Documentação _As-Built_ e Baseline Final

- **Descrição:** Atualização final de todos os artefatos para refletir a versão exata do software em produção.
- **Entradas:** Termo de Aceite do Produto e Matriz de Rastreabilidade do Kanban.
- **Saídas:** Baseline Final - _As-Built_ (Estado de controle) e Matriz de Rastreabilidade Consolidada (Artefato).
- **Participantes:** Engenheiros de Requisitos (Gerência de Configuração).

<p align="center">
  <img src="../../img/transicao.png" alt="Rede Cafuringa - Transição" width="90%" style="border-radius: 15px;">
</p>

## 5.2 Engenharia de Requisitos e o AUP

| Fases do Processo | Atividades da ER        | Prática                          | Técnica                                        | Resultados Esperados                                                                       |
| :---------------- | :---------------------- | :------------------------------- | :--------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Concepção**     | Elicitação e Descoberta | Alinhamento de Domínio           | Entrevistas, Brainstorming, Análise de Domínio | Necessidades do ecossistema rural mapeadas e escopo inicial estabelecido do zero.          |
|                   | Análise e Consenso      | Priorização de Escopo            | Técnica MoSCoW                                 | MVP genericamente definido, separando o essencial do desejável para a primeira versão.     |
|                   | Declaração              | Registro Inicial                 | Documento de Visão Enxuto                      | Objetivos Específicos e Características de Produto documentados.                           |
| **Elaboração**    | Elicitação e Descoberta | Análise de Viabilidade e Domínio | Estudo de Domínio e Requisitos                 | Premissas arquiteturais e riscos técnicos iniciais identificados.                          |
|                   | Análise e Consenso      | Análise de Viabilidade           | Matriz de Quadrantes                           | MVP consolidado cruzando valor de negócio e complexidade técnica.                          |
|                   | Declaração              | Especificação Funcional          | User Stories e Especificação Suplementar       | Requisitos funcionais e técnicos (ex: baixa conectividade e geolocalização) formalizados.  |
|                   | Representação           | Modelagem Visual                 | Protótipos e Wireframes Navegáveis             | Jornadas dos usuários validadas visualmente antes do desenvolvimento.                      |
| **Construção**    | Elicitação e Descoberta | Descoberta Contínua              | Reuniões de Feedback Periódico                 | Regras de negócio refinadas iterativamente a cada incremento entregue.                     |
|                   | Verificação e Validação | Controle de Qualidade Ágil       | Demonstrações, Checklists e Testes             | Incrementos validados continuamente em aderência aos Objetivos Específicos.                |
| **Transição**     | Verificação e Validação | Homologação                      | Testes de Aceitação e Demonstração Final       | Sistema testado, homologado e pronto para uso pelos produtores, consumidores e visitantes. |
