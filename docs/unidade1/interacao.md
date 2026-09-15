<span class="version-badge">Unidade 01</span>

## 7.1 Composição da Equipe
* **Dono do Produto (Product Owner) e Stakeholders (Cliente):** O cliente e suas partes interessadas permanecem fortemente envolvidos durante todo o processo de especificação e desenvolvimento do software. Eles colaboram estreitamente com o fornecedor dentro de um modelo participativo, iterativo e exploratório.
* **Engenheiros de Requisitos e Desenvolvedores:** Profissionais técnicos que mantêm uma interação contínua com as partes interessadas e o Dono do Produto. A equipe opera com uma filosofia pragmática e ágil, focando na natureza colaborativa do desenvolvimento.

| Papel | Descrição | Responsáveis |
| :--- | :--- | :--- |
| **Gerente de projeto/facilitador** | Coordena o projeto dentro do ciclo estruturado do AUP, garante a comunicação contínua entre cliente e equipe, e controla prazos e entregas. | Paulo Filho |
| **Desenvolvedor Frontend** | Responsável pela interface do usuário, design e implementação das funcionalidades no lado do cliente. | Lucas Gabriel, Pedro Augusto, Paulo Filho, Beatriz Lins |
| **Desenvolvedor Backend** | Implementa a lógica de negócios, integração com banco de dados e APIs. | Pedro Luiz, Ítalo Alves, Luccas Rodrigues, Pedro Augusto |
| **Analista de QA** | Garante a qualidade do produto, executando testes de funcionalidade, performance e usabilidade. | Beatriz Lins, Ítalo Alves, Lucas Gabriel, Luccas Rodrigues, Paulo Filho, Pedro Augusto, Pedro Luiz |
| **Analista de Requisitos** | Define os requisitos funcionais e não funcionais do sistema e garante que eles sejam atendidos. | Beatriz Lins, Ítalo Alves, Lucas Gabriel, Luccas Rodrigues, Paulo Filho, Pedro Augusto, Pedro Luiz |

---

## 7.2 Comunicação
A comunicação do projeto é baseada em um fluxo de informações participativo, garantindo uma interação contínua entre todas as partes (stakeholders, dono do produto e equipe técnica). Esse formato iterativo permite uma adaptação contínua e uma altíssima velocidade de validação, aproveitando a proximidade com o cliente.

Para sustentar essa dinâmica, a comunicação substitui a documentação formal e engessada por artefatos mais leves geridos no Backlog do Produto (como histórias de usuários e protótipos), que funcionam como estímulos para conversações diárias.

Para viabilizar esse fluxo, o projeto utiliza as seguintes ferramentas e rotinas:

* **WhatsApp:** Canal prioritário para a comunicação diária da equipe técnica e interações contínuas com o cliente. É utilizado para o esclarecimento rápido de dúvidas, compartilhamento de arquivos, aprovação de histórias de usuário e validação ágil de requisitos.

* **Microsoft Teams:** Ferramenta oficial para as videoconferências. A equipe de desenvolvimento realiza duas reuniões internas semanais para acompanhar o progresso e solucionar impedimentos.

* **GitHub Projects:** Ferramenta oficial para gerenciar o quadro Kanban, centralizando a criação, priorização e movimentação das tarefas durante o desenvolvimento.

* **Reuniões de Revisão com o Cliente:** Ocorrem com uma frequência de 7 a 15 dias, dependendo da necessidade. Nessas reuniões, o cliente participa ativamente para revisar os cartões concluídos, testar funcionalidades, fornecer feedbacks e ajudar a priorizar os próximos itens do backlog.

---

## 7.3 Processo de Validação
O processo de validação não ocorre apenas na entrega final, ele acontece de forma contínua e precoce, com foco na entrega iterativa e incremental de um software funcional que agregue valor. Para garantir a qualidade de ponta a ponta e a rastreabilidade visual (uso de storyboards validados com usuários reais), o fluxo de trabalho é regido por políticas explícitas em diferentes estágios:

* **Critérios de Puxada (Definition of Ready):** Ponto de comprometimento. Para que um cartão do GitHub Projects seja puxado para a etapa de desenvolvimento, os requisitos devem estar bem definidos, documentados e com critérios de aceitação previamente estabelecidos.

* **Integração de Práticas Técnicas (TDD):** A equipe emprega validação por meio de testes de aceitação e aplica fortemente o Desenvolvimento Orientado a Testes (TDD), permitindo validar requisitos técnicos por testes automatizados antes da implementação completa.

* **Critérios de Saída (Definition of Done):** Um cartão só avança para a etapa de entrega se cumprir as políticas de saída da engenharia. Isso exige que a funcionalidade seja aprovada em testes unitários e de integração, além de passar por uma revisão técnica e visual por parte da equipe.

* **Homologação pelo Cliente (UAT) e Feedback Rápido:** Na etapa final, o produto é disponibilizado ao cliente para testes de aceitação diretos. O feedback coletado é imediatamente incorporado nas iterações seguintes, permitindo ajustes constantes no produto e garantindo total coerência com a visão de uso inicial.