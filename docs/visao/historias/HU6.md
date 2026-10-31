# HU06 — Consultar conteúdos cadastrados

## 1. Identificação

| Campo | Informação |
|---|---|
| **ID da História** | HU06 |
| **Requisito Funcional** | [RF06 — Consultar conteúdos cadastrados](../requisitos_software.md#71-requisitos-funcionais) |
| **Requisito Não Funcional** | [RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF10, RNF11, RNF12, RNF14](../requisitos_software.md#72-requisitos-nao-funcionais) |
| **Regra de Negócio** | [RN01, RN07, RN09, RN10, RN11, RN15, RN16](../requisitos_software.md#74-lista-de-regras-de-negocio) |
| **Característica de Produto** | [CP2, CP3](../solucao.md#23-caracteristicas-do-produto) |
| **Objetivos Específicos** | [OE2](../solucao.md#22-objetivos-especificos-oe-do-produto) |
| **Prioridade** | Alta |

---

## 2. História de Usuário

*Como consumidor ou visitante, quero consultar os conteúdos cadastrados, para encontrar produtos, experiências e eventos disponíveis na plataforma.*

---

## 3. Critérios de Aceitação

**CA01 — Acesso à consulta de conteúdos**

- **Dado** que estou acessando a plataforma, **quando** entrar na área de consulta de conteúdos, **então** o sistema deve disponibilizar os conteúdos cadastrados para visualização.

**CA02 — Consulta de produtos**

- **Dado** que existem produtos cadastrados e disponíveis na plataforma, **quando** acessar a área de consulta, **então** o sistema deve apresentar os produtos disponíveis para visualização.

**CA03 — Consulta de experiências**

- **Dado** que existem experiências cadastradas e disponíveis na plataforma, **quando** acessar a área de consulta, **então** o sistema deve apresentar as experiências disponíveis para visualização.

**CA04 — Consulta de eventos**

- **Dado** que existem eventos cadastrados e disponíveis na plataforma, **quando** acessar a área de consulta, **então** o sistema deve apresentar os eventos disponíveis para visualização.

**CA05 — Identificação dos tipos de conteúdo**

- **Dado** que existem diferentes tipos de conteúdos cadastrados na plataforma, **quando** o sistema apresentar os resultados da consulta, **então** deve permitir identificar se cada conteúdo corresponde a um produto, uma experiência ou um evento.

**CA06 — Visualização das informações dos conteúdos**

- **Dado** que estou consultando os conteúdos cadastrados, **quando** selecionar um produto, uma experiência ou um evento, **então** o sistema deve apresentar as informações disponibilizadas para o conteúdo selecionado.

**CA07 — Ausência de conteúdos cadastrados**

- **Dado** que não existem conteúdos disponíveis para consulta, **quando** acessar a área de conteúdos, **então** o sistema deve apresentar uma mensagem informando que não há conteúdos disponíveis.

**CA08 — Falha durante a consulta**

- **Dado** que ocorra uma falha durante a recuperação dos conteúdos cadastrados, **quando** tentar acessar a área de consulta, **então** o sistema deve informar que não foi possível carregar os conteúdos.

**CA09 — Exibição de conteúdos disponíveis**

- **Dado** que existem conteúdos cadastrados na plataforma, **quando** realizar a consulta, **então** o sistema deve apresentar somente os conteúdos disponíveis para visualização, respeitando as condições de disponibilização estabelecidas para cada tipo de conteúdo.

---

## 4. Relação com os Requisitos Não Funcionais

**RNF01 — Eficiência de Navegação**

- Relação com a HU: Garante que os usuários consigam acessar os catálogos e as informações dos produtos, experiências e eventos com poucos passos, permitindo que a consulta seja realizada em, no máximo, cinco cliques ou toques a partir da tela inicial.

**RNF02 — Tempo de Execução de Tarefas**

- Relação com a HU: Estabelece que os usuários consigam localizar um produto ou uma experiência específica e acessar sua página de detalhes em até 60 segundos de navegação contínua, contribuindo para uma consulta eficiente.

**RNF03 — Prevenção e Recuperação de Erros**

- Relação com a HU: Garante que o sistema apresente mensagens claras quando ocorrerem falhas durante a busca, recuperação ou visualização dos conteúdos, orientando o usuário sobre o problema encontrado.

**RNF04 — Acessibilidade Digital**

- Relação com a HU: Garante que a interface de consulta e as páginas de detalhes dos conteúdos possam ser utilizadas por pessoas com diferentes necessidades, contemplando contraste adequado, textos alternativos para imagens relevantes, indicação de foco e navegação por teclado.

**RNF05 — Responsividade da Interface**

- Relação com a HU: Garante que os catálogos e as páginas de detalhes dos conteúdos sejam apresentados adequadamente em dispositivos móveis e computadores, mantendo a usabilidade em diferentes dimensões de tela.

**RNF06 — Desempenho em Conectividade Limitada**

- Relação com a HU: Estabelece que as páginas públicas de consulta e os detalhes dos conteúdos sejam carregados em tempo adequado mesmo em conexões móveis ou rurais com baixa velocidade ou alta latência.

**RNF10 — Proteção da Comunicação**

- Relação com a HU: Garante que a comunicação entre os dispositivos dos usuários e os serviços responsáveis pela consulta dos conteúdos ocorra por meio de HTTPS, protegendo os dados transmitidos durante a navegação.

**RNF11 — Proteção de Dados Pessoais**

- Relação com a HU: Garante que as informações apresentadas nos perfis e nas páginas de conteúdos não exponham dados pessoais privados, como CPF, CNPJ e e-mail, restringindo a exibição às informações destinadas à divulgação pública.

**RNF12 — Compatibilidade entre Navegadores**

- Relação com a HU: Garante que os fluxos de consulta e visualização dos conteúdos funcionem adequadamente nos principais navegadores utilizados em computadores e dispositivos móveis.

**RNF14 — Disponibilização como Aplicação Web Progressiva**

- Relação com a HU: Garante que a consulta dos conteúdos possa ser realizada diretamente pelo navegador, em diferentes dispositivos, sem exigir obrigatoriamente a instalação de um aplicativo por meio de lojas de aplicativos.

---

## 5. Relação com as Regras de Negócio

**RN01 — Perfis e permissões**

- Relação com a HU: Determina que o acesso aos conteúdos e às funcionalidades de consulta respeite as permissões estabelecidas para cada perfil de usuário, considerando as diferenças entre consumidores, produtores e administradores.

**RN07 — Informações públicas do produtor**

- Relação com a HU: Determina que os perfis e conteúdos disponibilizados publicamente apresentem somente informações destinadas à divulgação, impedindo a exposição de dados cadastrais privados dos produtores.

**RN09 — Responsabilidade pelas ofertas**

- Relação com a HU: Estabelece que produtos, experiências, atividades e eventos estejam vinculados a um produtor, propriedade ou responsável identificado, permitindo que o usuário conheça a origem e a responsabilidade pelas ofertas consultadas.

**RN10 — Disponibilidade das ofertas**

- Relação com a HU: Determina que produtos, experiências e eventos sejam apresentados conforme sua disponibilidade pública. O responsável pode disponibilizar ou retirar conteúdos da oferta pública sem necessariamente excluir seus registros.

**RN11 — Informações mínimas das ofertas**

- Relação com a HU: Estabelece que as páginas de detalhes apresentem informações suficientes para que o usuário compreenda a oferta, incluindo descrição, responsável e informações de valor, localização ou período, quando aplicáveis ao tipo de conteúdo.

**RN15 — Busca e descoberta**

- Relação com a HU: Determina que os mecanismos de consulta e descoberta considerem os diferentes tipos de ofertas cadastrados na plataforma, permitindo que os usuários encontrem produtos, experiências e eventos conforme os critérios disponibilizados pelo sistema.

**RN16 — Localização**

- Relação com a HU: Estabelece que a representação dos conteúdos em mapas e os recursos de busca por proximidade dependam da existência de uma localização cadastrada para a respectiva oferta, produtor ou propriedade.

---

## 6. Relação com as Características de Produto

**CP2 — Conteúdos**

- Relação com a HU: A consulta dos conteúdos cadastrados permite que os usuários tenham acesso aos produtos, experiências e eventos disponibilizados na plataforma, reunindo as informações das iniciativas locais em um ambiente de fácil acesso.

**CP3 — Divulgação e acesso à oferta local**

- Relação com a HU: A apresentação dos produtos, experiências e eventos permite que consumidores e visitantes conheçam as ofertas disponíveis na Rede Cafuringa, ampliando a divulgação das iniciativas e facilitando o acesso às informações sobre a oferta local.

---

## 7. Relação com os Objetivos Específicos

**OE2 — Visibilidade e oferta local**

- Relação com a HU: A consulta dos conteúdos cadastrados contribui diretamente para ampliar a visibilidade dos produtos, experiências e eventos oferecidos pelas iniciativas locais. Ao reunir essas informações na plataforma, a funcionalidade facilita o acesso dos consumidores e visitantes à oferta da região e fortalece a divulgação das atividades desenvolvidas na APA de Cafuringa.

---

## 8. Atividades Relacionadas

| ID | Atividade | Descrição |
|---|---|---|
| AT01 | Identificar informações dos conteúdos | Definir quais informações devem ser apresentadas para produtos, experiências e eventos. |
| AT02 | Estruturar a interface de consulta | Definir a organização e a disposição dos conteúdos na interface da plataforma. |
| AT03 | Implementar a interface de consulta | Desenvolver a interface responsável por apresentar os conteúdos cadastrados. |
| AT04 | Implementar consulta de produtos | Desenvolver a funcionalidade de recuperação e apresentação dos produtos cadastrados. |
| AT05 | Implementar consulta de experiências | Desenvolver a funcionalidade de recuperação e apresentação das experiências cadastradas. |
| AT06 | Implementar consulta de eventos | Desenvolver a funcionalidade de recuperação e apresentação dos eventos cadastrados. |
| AT07 | Diferenciar os tipos de conteúdo | Implementar a identificação dos conteúdos conforme suas categorias: produtos, experiências e eventos. |
| AT08 | Implementar visualização dos conteúdos | Permitir que o usuário acesse as informações disponibilizadas para cada conteúdo selecionado. |
| AT09 | Implementar tratamento de ausência de conteúdos | Desenvolver mensagens informativas para situações em que não existam conteúdos disponíveis para consulta. |
| AT10 | Implementar tratamento de falhas | Desenvolver mensagens de retorno para falhas durante a recuperação ou apresentação dos conteúdos. |
| AT11 | Adequar a interface | Garantir que a interface de consulta atenda aos critérios de acessibilidade e responsividade definidos para o projeto. |
| AT12 | Executar testes funcionais | Verificar a consulta e a apresentação dos produtos, experiências e eventos cadastrados. |
| AT13 | Executar testes de interface | Verificar a identificação dos tipos de conteúdo, a visualização das informações e o comportamento da interface. |
| AT14 | Documentar e revisar a funcionalidade | Registrar o comportamento implementado, os resultados dos testes e eventuais pendências para revisão pela equipe. |

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
- [ ] As dependências estão mapeadas?
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