<span class="version-badge">Unidade 02</span>

## 9.1 Definition of Ready (DoR)

O DoR é um acordo entre a equipe Bytelab e o cliente, que atua como Dono do Produto, indicando quando uma História de Usuário (US) está preparada para ser puxada para uma iteração da fase de Construção do AUP. Trata-se de um critério de verificação: se algum dos itens abaixo não for atendido, a US retorna para refinamento e não é comprometida na iteração. Os itens verificados para determinar se uma US está *"Ready"* são:

* **A US possui definição clara e informação necessária para ser trabalhada?** A US deve ter detalhes suficientes para que a equipe entenda o que precisa ser feito, sem ambiguidades e sem dúvidas em aberto. Quando necessário, o esclarecimento com o cliente deve ter sido obtido e registrado.

* **O requisito está representado por uma história de usuário?** O requisito deve estar descrito no formato *"Como [ator], eu quero [ação] para que [valor]"*, com ator, objetivo e valor de negócio claros.

* **A US está rastreada aos requisitos de origem?** A US deve estar vinculada ao(s) Requisito(s) Funcional(is) que a originaram e à Característica do Produto (CP) correspondente, conforme a [lista de requisitos](requisitos.md).

* **A US faz parte do escopo do MVP?** A US deve compor os [requisitos aprovados para o MVP](MVP.md) ou ter sido formalmente repriorizada com o cliente.

* **A US está coberta por critérios de aceite?** Critérios de aceitação objetivos e verificáveis devem estar presentes, servindo de base para os testes escritos no TDD.

* **Os RNFs e as restrições legais aplicáveis estão identificados?** Os Requisitos Não Funcionais que restringem a US (ex.: RNF04 — Acessibilidade, RNF05 — Responsividade, RNF08 — Controle de acesso, RNF11 — Proteção de dados), as regras da LGPD e do ECA Digital e os [ajustes solicitados pelo cliente](MVP.md#75-ajustes-solicitados-pelo-cliente) que impactam a US devem estar registrados.

* **A US está mapeada para uma interface (quando necessário)?** Se a US envolve interface, as telas e fluxos devem estar representados no protótipo navegável e revisados pela equipe.

* **A US cabe em uma iteração?** A US deve ter esforço técnico estimado na escala de 1 a 4 e ser pequena o suficiente para ser concluída dentro de uma única iteração. Itens com esforço **4 (Muito Alto)** devem ser divididos antes de entrar em desenvolvimento.

* **As dependências estão mapeadas?** Dependências técnicas e funcionais com outras US devem estar identificadas e resolvidas ou planejadas na mesma iteração (ex.: autenticação antes da pré-reserva).

* **Os responsáveis estão definidos?** A US deve possuir ao menos um responsável pela implementação e um revisor designados no GitHub Projects.

* **O requisito está implementado no protótipo e validado?** Os requisitos devem ser sempre inseridos e adequados aos protóptipos e devem ser validados com o cliente após sua inclusão.

---

## 9.2 Definition of Done (DoD)

O DoD é um acordo que demonstra a qualidade da US produzida, indicando que *"Done"* comprova que o trabalho realizado está em conformidade com o que foi especificado. Assim como o DoR, trata-se de um critério de verificação, aplicado nas iterações da fase de Construção. Se uma US não atende ao *"Done"*, ela não deve ser liberada nem apresentada ao cliente na demonstração do incremento. Os itens verificados para determinar se uma US está *"Done"* são:

* **Entrega um incremento do produto?** A funcionalidade desenvolvida deve estar integrada à branch principal, com o *build* aprovado no pipeline de CI, e disponível em ambiente de homologação, resultando em um incremento utilizável.

* **Contempla os critérios de aceite estabelecidos?** Todos os critérios de aceitação definidos no DoR devem ser cumpridos, garantindo que o comportamento esperado da US foi atingido.

* **O desenvolvimento foi concluído integralmente?** A funcionalidade deve estar implementada de acordo com os requisitos estabelecidos e em conformidade com o protótipo navegável.

* **Os testes foram executados e aprovados?** Os testes unitários e de integração, escritos seguindo o TDD, devem ter sido executados com sucesso.

* **Está aderente aos padrões de codificação?** O código deve seguir os padrões de codificação estabelecidos pela equipe, garantindo qualidade, consistência e facilidade de manutenção.

* **A funcionalidade foi revisada pela equipe?** O código deve ter sido submetido via *Pull Request* e revisado e aprovado por ao menos um integrante que não participou da implementação, incluindo a revisão visual da interface.

* **Mantém os índices de performance do produto?** A funcionalidade não deve degradar o desempenho do sistema, mantendo o carregamento do conteúdo principal das páginas em até 5 segundos em conexão limitada (RNF06).

* **Atende aos requisitos de acessibilidade e responsividade?** Os fluxos da US devem atender às recomendações aplicáveis da WCAG 2.1 AA (RNF04) e permanecer utilizáveis entre 360 px e 1920 px de largura, sem rolagem horizontal (RNF05).

* **Preserva a segurança e a privacidade dos dados?** O controle de acesso por perfil deve estar aplicado inclusive às rotas e *endpoints* (RNF08), e nenhum dado pessoal deve ser exposto fora do fluxo previsto, como o CPF do produtor (RNF11 e RNF15).

* **Trata os erros do usuário?** Entradas inválidas devem exibir mensagens de validação ou orientação (RNF03), e os dados de formulários não devem ser perdidos em caso de falha de conexão (RNF07), quando aplicável.

* **Está livre de defeitos críticos?** Não deve haver defeitos conhecidos de severidade alta ou crítica associados à US.

* **Está documentado?** O status da US no backlog, a matriz de rastreabilidade e as evidências da iteração no GitPages devem estar atualizados.
