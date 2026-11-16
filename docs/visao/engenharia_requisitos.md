<span class="version-badge">Unidade 01</span>

## 5.1 Atividades e Técnicas de Engenharia de Requisitos (ER)

Abaixo apresenta-se a estruturação operacional detalhada das **Atividades e Técnicas de ER** executadas nas fases do _Agile Unified Process_ (AUP). Cada atividade especifica as técnicas aplicadas, insumos necessários (entradas), entregáveis gerados (saídas) e os atores/stakeholders envolvidos.

---

<!-- ISSUE11_ER_INICIO -->
A seção 5.1 classifica a **natureza** das atividades; a seção 5.2 resume as mesmas atividades. A execução efetiva e as decisões ficam em [Evidências e Decisões de ER](evidencias/registro_er.md), sem inferir homologação a partir de uma representação ou vídeo.
<!-- ISSUE11_ER_FIM -->

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

!!! info "Elicitação e Descoberta"

    #### Visita Técnica e Conversa com o Cliente

    - **Descrição:** Contato com o território da APA da Cafuringa e conversa com Jefferson Sooma em 21/09/2026, conforme [evidências da Iteração 3](evidencias/iteracao3.md). Não há, nesta documentação, lista verificada de produtores, consumidores ou anfitriões que tenham participado diretamente.
    - **Entradas:** Contexto e necessidades inicialmente elicitadas.
    - **Saídas:** Impressões e levantamento preliminar registrados na síntese da equipe em 22/09/2026. A autoria de requisitos específicos deve ser vinculada aos registros de alteração para ser considerada comprovada.
    - **Participantes:** Jefferson Sooma e equipe do projeto; outros participantes somente quando houver registro verificável.

!!! info "Declaração de Requisitos"

    #### Especificação de RFs e RNFs

    - **Descrição:** Estruturar as necessidades em requisitos funcionais e não funcionais, com identificação e critérios de verificação quando aplicáveis.
    - **Entradas:** Visão do produto, registros de elicitação e retornos do cliente.
    - **Saídas:** [Especificação de requisitos de software](requisitos_software.md).
    - **Participantes:** Engenheiros de Requisitos e equipe de desenvolvimento.

    #### Histórias de Usuário

    - **Descrição:** Representar as funcionalidades do produto na perspectiva do ator, ação e valor entregue.
    - **Entradas:** RFs, personas e contexto de uso.
    - **Saídas:** [Backlog de HUs](historias_usuario.md) e suas narrativas.
    - **Participantes:** Engenheiros de Requisitos.

    #### Critérios de Aceitação

    - **Descrição:** Detalhar condições testáveis por história, coerentes com ator e objetivo.
    - **Entradas:** HUs e RFs vigentes.
    - **Saídas:** Critérios presentes nas [fichas das HUs](historias_usuario.md); divergências devem voltar a refinamento.
    - **Participantes:** Engenheiros de Requisitos, desenvolvedores e envolvidos na validação.

!!! info "Análise e Consenso"

    #### Priorização MoSCoW

    - **Descrição:** Negociar criticidade dos requisitos nas categorias Must, Should, Could e Won't.
    - **Entradas:** Requisitos elicitados e objetivos do negócio.
    - **Saídas:** [Registro da priorização](evidencias/iteracao3.md) e classificação do backlog.
    - **Participantes:** Equipe e cliente quando houver evidência específica de participação/validação.

    #### Matriz de Valor de Negócio e Esforço Técnico

    - **Descrição:** Avaliar o valor das histórias, o esforço e as dependências; consolidar priorização tecnicamente coerente.
    - **Entradas:** HUs, RFs e restrições do projeto.
    - **Saídas:** [Critérios de priorização e MVP](mvp.md) e histórico em [Organização e Atualização](../organizacao_atualizacao/atualizacao.md).
    - **Participantes:** Equipe de requisitos e desenvolvimento; valores propostos dependem de validação quando não houver aceite documentado.

    #### Delimitação do Escopo do MVP

    - **Descrição:** Selecionar o conjunto de histórias da primeira versão a partir do valor, esforço, dependências e decisões de escopo.
    - **Entradas:** Backlog e priorização.
    - **Saídas:** [MVP vigente](mvp.md), com decisões históricas registradas separadamente.
    - **Participantes:** Equipe e cliente, conforme aprovações comprovadas.

!!! info "Representação de Requisitos"

    #### Prototipagem Interativa Navegável

    - **Descrição:** Construir representações de telas e fluxos que permitam demonstrar o uso da aplicação.
    - **Entradas:** RFs, HUs, critérios e necessidades dos perfis de usuários.
    - **Saídas:** [Protótipo divulgado na Iteração 4](evidencias/iteracao4.md).
    - **Participantes:** Designers e equipe de requisitos.

!!! info "Verificação e Validação"

    #### Revisão da Coerência e Avaliação do Protótipo

    - **Descrição:** Conferir alinhamento entre RF, HU, critérios e protótipo e solicitar feedback de usuários/cliente. Apresentação não é, por si só, aprovação de comportamento.
    - **Entradas:** Protótipo, requisitos e registros de reunião.
    - **Saídas:** [Registro de evidências, decisões e lacunas de validação](evidencias/registro_er.md).
    - **Participantes:** Equipe técnica e participantes identificados em cada evidência.

!!! info "Organização e Atualização"

    #### Rastreabilidade e Consolidação do Feedback

    - **Descrição:** Documentar a origem de cada alteração e propagar decisões aos artefatos do produto.
    - **Entradas:** Feedbacks, RFs, HUs e decisões identificáveis.
    - **Saídas:** [Rastreabilidade](../organizacao_atualizacao/rastreabilidade.md), [histórico de mudanças](../organizacao_atualizacao/atualizacao.md) e [registro de evidências de ER](evidencias/registro_er.md).
    - **Participantes:** Equipe de requisitos e revisores designados.

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

    #### Preparação e Revisão dos Cenários de Aceitação

    - **Descrição:** Rever os critérios das HUs e preparar cenários que sustentem os testes de aceitação. **TDD é prática de implementação e teste do software, apoiada por esses critérios, não uma técnica de elicitação de ER nem atividade exclusiva da Transição.**
    - **Entradas:** Versão candidata, HUs e critérios vigentes.
    - **Saídas:** Cenários de aceitação e registro de dúvidas a resolver, quando efetivamente produzidos.
    - **Participantes:** Equipe de requisitos, desenvolvedores, testadores e cliente na validação.

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

A síntese abaixo espelha as atividades da seção **5.1**. A etapa é uma classificação de processo, **não uma declaração de que todas as práticas foram executadas ou homologadas**. Os resultados, quando rastreáveis, são vinculados ao [registro de evidências de ER](evidencias/registro_er.md).

| Fase | Atividade de ER | Técnica/prática da seção 5.1 | Resultado/registro | Evidência ou ressalva |
|---|---|---|---|---|
| Concepção | Elicitação e Descoberta | Entrevista semiestruturada com o cliente | Levantamento inicial | [Iteração 1](evidencias/iteracao1.md) |
| Concepção | Elicitação e Descoberta | Brainstorming colaborativo | Ideias e mapa mental | [Iteração 2](evidencias/iteracao2.md) |
| Concepção | Declaração de Requisitos | Documento estruturado de visão; HUs preliminares | Visão e narrativas preliminares | [Cenário](cenario.md), [Solução](solucao.md) |
| Concepção | Análise e Consenso | MoSCoW preliminar; validação assíncrona | Prioridade inicial e feedback | [Iteração 2](evidencias/iteracao2.md); comprovação de aceite específico a verificar |
| Concepção | Verificação e Validação | Revisões da entrega | Decisões e observações | [Registro de ER](evidencias/registro_er.md) |
| Concepção | Organização e Atualização | Metadados e versionamento | Artefatos versionados | [Histórico](../organizacao_atualizacao/atualizacao.md) |
| Elaboração | Elicitação e Descoberta | Visita técnica e conversa com Jefferson | Síntese de necessidades | [Iteração 3](evidencias/iteracao3.md); demais participantes não identificados |
| Elaboração | Declaração de Requisitos | Especificação de RFs/RNFs; histórias e critérios de aceitação | [Requisitos](requisitos_software.md) e [Backlog](historias_usuario.md) | [Registro de decisões](evidencias/registro_er.md) |
| Elaboração | Análise e Consenso | MoSCoW; matriz valor/esforço; delimitação do MVP | [MVP](mvp.md) e prioridades | [Histórico de priorização](../organizacao_atualizacao/atualizacao.md) |
| Elaboração | Representação de Requisitos | Prototipagem navegável | Protótipo | [Iteração 4](evidencias/iteracao4.md) |
| Elaboração | Verificação e Validação | Revisão da coerência RF/HU e avaliação do protótipo | Feedbacks e pendências | [Registro de evidências](evidencias/registro_er.md); aceite específico não inferido |
| Elaboração | Organização e Atualização | Rastreabilidade e consolidação de feedback | Relações e histórico de mudanças | [Rastreabilidade](../organizacao_atualizacao/rastreabilidade.md) |
| Construção | Declaração de Requisitos | Consulta de histórias, RFs e critérios vigentes | Especificações utilizadas na implementação | [Backlog](historias_usuario.md) e [RFs](requisitos_software.md) |
| Construção | Verificação e Validação | Demonstrações de incrementos; DoR/DoD como acordos de prontidão e conclusão | Critérios e registros de desenvolvimento | [Iterações 5–8](cronograma.md); aprovação e resultados devem ser verificados por HU |
| Construção | Organização e Atualização | Atualização de rastreabilidade | Relacionamento entre HUs e implementações | [Rastreabilidade](../organizacao_atualizacao/rastreabilidade.md) |
| Transição | Verificação e Validação | Preparação/revisão dos cenários e testes de aceitação de usuário | Cenários, resultados e decisão sobre produto entregue | Ainda requer evidências de homologação e aceite; não presumir execução |
| Transição | Organização e Atualização | Registro da entrega e encerramento | Versão e histórico final | Exige referência verificável da versão homologada |
