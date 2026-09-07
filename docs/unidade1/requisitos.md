<span class="version-badge">Unidade 01</span>

## 5.1 Atividades e Técnicas de ER 

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

---

## 5.2 Engenharia de Requisitos e o AUP

| Fases do Processo | Atividades da ER | Prática | Técnica | Resultados Esperados |
| :--- | :--- | :--- | :--- | :--- |
| **Concepção** | Elicitação e Descoberta | Alinhamento de Domínio | Entrevistas, Brainstorming, Análise de Domínio | Necessidades do ecossistema rural mapeadas e escopo inicial estabelecido do zero. |
| | Análise e Consenso | Priorização de Escopo | Técnica MoSCoW | MVP genericamente definido, separando o essencial do desejável para a primeira versão. |
| | Declaração | Registro Inicial | Documento de Visão Enxuto | Objetivos Específicos e Características de Produto documentados. |
| **Elaboração** | Elicitação e Descoberta | Análise de Viabilidade e Domínio | Estudo de Domínio e Requisitos | Premissas arquiteturais e riscos técnicos iniciais identificados. |
| | Análise e Consenso | Análise de Viabilidade | Matriz de Quadrantes | MVP consolidado cruzando valor de negócio e complexidade técnica. |
| | Declaração | Especificação Funcional | User Stories e Especificação Suplementar | Requisitos funcionais e técnicos (ex: baixa conectividade e geolocalização) formalizados. |
| | Representação | Modelagem Visual | Protótipos e Wireframes Navegáveis | Jornadas dos usuários validadas visualmente antes do desenvolvimento. |
| **Construção** | Elicitação e Descoberta | Descoberta Contínua | Reuniões de Feedback Periódico | Regras de negócio refinadas iterativamente a cada incremento entregue. |
| | Verificação e Validação | Controle de Qualidade Ágil | Demonstrações, Checklists e Testes | Incrementos validados continuamente em aderência aos Objetivos Específicos. |
| **Transição** | Verificação e Validação | Homologação | Testes de Aceitação e Demonstração Final | Sistema testado, homologado e pronto para uso pelos produtores, consumidores e visitantes. |


