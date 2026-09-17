<span class="version-badge">Unidade 01</span>

## 5.1 Atividades e Técnicas de Engenharia de Requisitos (ER)

Para atender às necessidades do ecossistema de turismo rural da **Rede Cafuringa**, adota-se uma abordagem híbrida combinando a governança do **AUP (Agile Unified Process)** com a execução contínua do **Kanban**:

- **Elementos Dirigidos por Plano (_Plan-Driven_):** Definição prévia dos Objetivos Específicos (OEs) e Características do Produto (CPs); mapeamento dos **Épicos/Histórias Macro** para estruturação da arquitetura e do cronograma; congelamento da baseline dos Épicos essenciais ao final da fase de Elaboração.
- **Elementos Ágeis e Adaptativos (_Agile/Adaptive_):** Decomposição e detalhamento _Just-In-Time_ (JIT) dos Épicos em **Histórias de Usuário (_User Stories_) granulares** com critérios de aceite; gestão visual do fluxo de trabalho contínuo via Kanban; repriorização constante do backlog durante a fase de Construção.
- **Mecanismo de Incorporação de Mudanças:** Novas solicitações ou alterações no Kanban passam por análise de impacto em relação à baseline estabelecida na Elaboração. Se a mudança afetar o escopo macro ou a arquitetura, exige alinhamento formal; se afetar apenas critérios de detalhamento interno, é ajustada em nível de _User Story_ no backlog.
- **Baselines e Marcos de Controle (_Milestones_):**
  - _Marco de Objetivos do Ciclo de Vida (Fim da Concepção):_ Alinhamento do Documento de Visão, OEs e CPs.
  - _Marco da Arquitetura do Ciclo de Vida (Fim da Elaboração):_ Congelamento da baseline de requisitos (Épicos essenciais e especificações suplementares), validação dos protótipos e PoC arquitetural.
  - _Marco de Capacidade Operacional Inicial (Fim da Construção):_ Entrega do incremento funcional (MVP) testado para homologação.
  - _Marco do Produto Final (Fim da Transição):_ Aceite oficial e entrega do sistema consolidado.

---

## **Fase de Concepção**

!!! info "Elicitação e Descoberta"
Entrevistas e reuniões de alinhamento com a cliente e stakeholders para capturar as necessidades centrais do ecossistema de turismo rural, mapeando perfis de usuários (produtores, consumidores, visitantes) e regras de negócio essenciais. Sessões de brainstorming com a equipe para idealizar o catálogo de produtos, atrações e mecanismos de incentivo.

!!! info "Declaração de Requisitos"
Elaboração de um Documento de Visão enxuto, registrando de forma macro os Objetivos Específicos (OEs), Características do Produto (CPs) e requisitos iniciais do sistema.

!!! info "Análise e Consenso"
Aplicação de priorização ágil (como MoSCoW) para classificar os requisitos preliminares em essenciais e desejáveis.

!!! info "Verificação e Validação"
Validação preliminar do escopo, OEs e CPs para assegurar o alinhamento inicial com as necessidades reais da comunidade e do projeto.

!!! info "Organização e Atualização"
Estruturação da baseline inicial de escopo para guiar os primeiros ciclos iterativos de desenvolvimento.

<p align="center">
  <img src="../../img/concepcao.png" alt="Rede Cafuringa" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Elaboração**

!!! info "Elicitação e Descoberta"
Análise de domínio aprofundada para estruturar as regras centrais de negócio do novo sistema e identificar premissas arquiteturais e técnicas de alto risco (ex: suporte a baixa conectividade e geolocalização).

!!! info "Declaração de Requisitos"
Compilação da Lista de Requisitos e especificação funcional por meio de User Stories que descrevem as funcionalidades e critérios de aceite para cada ator (produtores, consumidores e administradores). A Especificação Suplementar agrupa os requisitos não funcionais, destacando restrições de desempenho e usabilidade.

!!! info "Análise e Consenso"
Utilização da Matriz de Quadrantes (Valor de Negócio vs. Dificuldade Técnica) para definir objetivamente o escopo do Produto Mínimo Viável (MVP) e mitigar riscos técnicos logo no início do projeto.

!!! info "Representação de Requisitos"
Criação de protótipos navegáveis para simular visualmente a jornada do usuário no novo app, validando a usabilidade com a cliente antes da codificação massiva.

!!! info "Verificação e Validação"
Demonstração e revisão dos protótipos e provas de conceito (PoC) arquiteturais com o representante.

!!! info "Organização e Atualização"
Estabelecimento da baseline formal de requisitos e início da Matriz de Rastreabilidade leve.

<p align="center">
  <img src="../../img/elaboracao.png" alt="Rede Cafuringa" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Construção**

!!! info "Elicitação e Descoberta"
Descoberta contínua e refinamento iterativo de novos detalhes e regras de negócio (como fluxo de pré-reservas e catálogo) à medida que cada micro-incremento é construído.

!!! info "Declaração de Requisitos"
Detalhamento pontual de novos cenários de User Stories e critérios de aceitação necessários para orientar os ciclos incrementais de código.

!!! info "Análise e Consenso"
Negociação flexível de mudanças de escopo e repriorização baseada nos feedbacks obtidos nas validações periódicas de cada entrega.

!!! info "Verificação e Validação"
Verificação contínua utilizando checklists de qualidade (DOR/DOD) e demonstrações práticas de telas e funcionalidades à medida que ficam prontas.

!!! info "Organização e Atualização"
Manutenção simplificada da Matriz de Rastreabilidade para preservar o conhecimento arquitetural e funcional durante os ciclos de desenvolvimento.

<p align="center">
  <img src="../../img/construcao.png" alt="Rede Cafuringa" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Transição**

!!! info "Verificação e Validação"
Realização de testes de aceitação e demonstração final da versão consolidada do sistema para validação e homologação oficial pelo cliente e utilizadores.

!!! info "Organização e Atualização"
Fechamento da documentação essencial (as-built) e atualização final da rastreabilidade para refletir a entrega exata do Cafuringa.

<p align="center">
  <img src="../../img/transicao.png" alt="Rede Cafuringa" width="90%" style="border-radius: 15px;">
</p>

---Agile/Adaptive*):\*\* Decomposição e detalhamento \_Just-In-Time* (JIT) dos Épicos em **Histórias de Usuário (_User Stories_) granulares** com critérios de aceite; gestão visual do fluxo de trabalho contínuo via Kanban; repriorização constante do backlog durante a fase de Construção.

- **Mecanismo de Incorporação de Mudanças:** Novas solicitações ou alterações no Kanban passam por análise de impacto em relação à baseline estabelecida na Elaboração. Se a mudança afetar o escopo macro ou a arquitetura, exige alinhamento formal; se afetar apenas critérios de detalhamento interno, é ajustada em nível de _User Story_ no backlog.
- **Baselines e Marcos de Controle (_Milestones_):**
  - _Marco de Objetivos do Ciclo de Vida (Fim da Concepção):_ Alinhamento do Documento de Visão, OEs e CPs.
  - _Marco da Arquitetura do Ciclo de Vida (Fim da Elaboração):_ Congelamento da baseline de requisitos (Épicos essenciais e especificações suplementares), validação dos protótipos e PoC arquitetural.
  - _Marco de Capacidade Operacional Inicial (Fim da Construção):_ Entrega do incremento funcional (MVP) testado para homologação.
  - _Marco do Produto Final (Fim da Transição):_ Aceite oficial e entrega do sistema consolidado.

---

## **Fase de Concepção**

!!! info "Elicitação e Descoberta"
• **Entrevistas Semiestruturadas e Reuniões de Alinhamento:** Realizadas com a cliente e _stakeholders_ para capturar as necessidades centrais do turismo rural e mapear os perfis de usuários (produtores, consumidores e visitantes) e regras de negócio de alto nível.  
 • **Brainstorming:** Sessões colaborativas com a equipe do projeto para idealizar o catálogo de produtos, atrações e mecanismos de engajamento da comunidade.

!!! info "Declaração de Requisitos"
• **Documento de Visão:** Registro formal enxuto contendo os Objetivos Específicos (OEs), Características do Produto (CPs) e a delimitação preliminar do escopo.

!!! info "Análise e Consenso"
• **Priorização MoSCoW:** Classificação dos requisitos e expectativas preliminares em categorias de prioridade (_Must have_, _Should have_, _Could have_, _Would have_) para alinhar a visão inicial do produto.

!!! info "Verificação e Validação"
• **Revisão de Escopo:** Checagem dos OEs e CPs junto à cliente e representantes da comunidade para assegurar a aderência inicial ao ecossistema local.

!!! info "Organização e Atualização"
• **Baseline de Escopo Inicial:** Estruturação da primeira versão do escopo funcional para orientar a investigação técnica na fase seguinte.

<p align="center">
  <img src="../../img/concepcao.png" alt="Rede Cafuringa - Concepção" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Elaboração**

!!! info "Elicitação e Descoberta"
• **Análise de Domínio e Leitura Normativa:** Investigação aprofundada das regras de negócio do turismo rural, suporte a operações _offline_ (baixa conectividade) e restrições legais/regulatórias aplicáveis.

!!! info "Declaração de Requisitos"
• **Mapeamento de Épicos (Histórias Macro):** Estruturação macro das principais capacidades do sistema em Épicos funcionais para balizar o escopo, orientar a arquitetura e estruturar as entregas no cronograma.  
 • **Especificação de Histórias de Usuário (User Stories):** Decomposição inicial dos Épicos em Histórias de Usuário contendo critérios de aceite (_Acceptance Criteria_) preliminares para alinhamento e alimentação do backlog.  
 • **Especificação Suplementar:** Documentação dos Requisitos Não Funcionais (RNFs), detalhando restrições de desempenho, usabilidade, operação offline e segurança.

!!! info "Análise e Consenso"
• **Matriz de Quadrantes (Valor de Negócio vs. Dificuldade Técnica):** Análise e seleção objetiva dos Épicos e Histórias constitutivos do Produto Mínimo Viável (MVP) e mitigação de riscos arquiteturais.

!!! info "Representação de Requisitos"
• **Prototipagem Navegável (Alta/Média Fidelidade):** Simulação visual interativa das jornadas do usuário (produtor, visitante e administrador) para validar fluxos antes da codificação.

!!! info "Verificação e Validação"
• **Demonstração e Validação de Protótipos:** Sessões práticas de validação das telas e fluxos navegáveis com a cliente.  
 • **Análise de Conformidade Legal e Regras de Negócio:** Validação direta das regras regulatórias com a cliente e fontes competentes, garantindo a interpretação correta das normas antes da implementação.

!!! info "Organização e Atualização"
• **Estabilização da Baseline de Requisitos:** Congelamento formal da lista de Épicos prioritários e RNFs para balizar a fase de Construção.  
 • **Matriz de Rastreabilidade (Versão Inicial):** Mapeamento do alinhamento entre Necessidades de Negócio, Épicos e Histórias de Usuário.

<p align="center">
  <img src="../../img/elaboracao.png" alt="Rede Cafuringa - Elaboração" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Construção**

!!! info "Elicitação e Descoberta"
• **Refinamento Iterativo (Backlog Grooming):** Descoberta detalhada e ajuste de regras finas de negócio conduzidos de forma contínua no início de cada ciclo de desenvolvimento.

!!! info "Declaração de Requisitos"
• **Detalhamento de User Stories JIT (_Just-In-Time_):** Especificação detalhada de cenários de teste, dados de entrada e critérios de aceite das Histórias de Usuário antes de entrarem em desenvolvimento no Kanban.

!!! info "Análise e Consenso"
• **Gestão Adaptativa de Mudanças:** Negociação e repriorização de itens do backlog ágil com base no _feedback_ de incrementos entregues, sem violar os Objetivos Específicos estipulados na baseline.

!!! info "Verificação e Validação"
• **Listas de Verificação (Checklists DoR / DoD):** Validação técnica contínua para garantir que as histórias atendem aos critérios de pronto (_Definition of Done_) e preparadas (_Definition of Ready_).  
 • **Demonstrações Incrementais:** Apresentação periódica das telas e funcionalidades construídas para validação prática junto à cliente.

!!! info "Organização e Atualização"
• **Manutenção da Matriz de Rastreabilidade:** Atualização contínua das relações entre Histórias de Usuário implementadas, Épicos de origem e módulos de código correspondentes.

<p align="center">
  <img src="../../img/construcao.png" alt="Rede Cafuringa - Construção" width="90%" style="border-radius: 15px;">
</p>

## **Fase de Transição**

!!! info "Verificação e Validação"
• **Testes de Aceitação de Usuário (TAU / Homologação):** Validação final da versão consolidada do sistema frente aos critérios de aceite das Histórias de Usuário e Épicos acordados com a cliente e utilizadores reais.

!!! info "Organização e Atualização"
• **Documentação _As-Built_ e Baseline Final:** Consolidação final da documentação, alinhando as Histórias de Usuário, Épicos e a Matriz de Rastreabilidade com a versão exata entregue em produção.

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
