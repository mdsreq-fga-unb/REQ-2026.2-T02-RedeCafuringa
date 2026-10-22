<span class="version-badge">Unidade 01</span>

## **2.1 Objetivo geral do produto**

O objetivo do produto é expandir a conexão direta dos produtores da agricultura familiar e as comunidades da APA da Cafuringa aos consumidores e visitantes do Distrito Federal e Entorno por meio de uma plataforma digital pública e gratuita. A solução visa reduzir a dependência de atravessadores, dar visibilidade ao catálogo de alimentos agroecológicos e produtos artesanais, e estruturar a oferta do ecoturismo de base comunitária (trilhas, vivências e hospedagens). Com isso, o sistema busca contribuir para a geração de renda sustentável e para a preservação ambiental no território. Esses resultados dependem também de fatores externos ao software, como adoção, manutenção do catálogo e atuação contínua dos produtores.

---

## 2.2 Objetivos Específicos (OE) do Produto

Os objetivos específicos orientam o desenvolvimento das funcionalidades e servem como critério de avaliação das entregas.

* **OE1 — Promover inclusão e acessibilidade digital:** promover a inclusão e a acessibilidade digital para produtores e consumidores no meio rural, assegurando uma experiência intuitiva e utilizável sob condições restritas de conectividade e de dispositivos.

* **OE2 — Ampliar a visibilidade e descoberta da oferta local:** mapear e dar visibilidade à produção agroecológica, aos produtores e aos atrativos locais, facilitando a descoberta da oferta regional por consumidores e visitantes.

* **OE3 — Fortalecer a conexão direta e a autonomia dos produtores:** fomentar o circuito curto de comercialização e o ecoturismo de base comunitária, viabilizando a aproximação, a manifestação de interesse e o contato direto entre produtores, consumidores e visitantes, sem intermediação financeira pela plataforma.

---

## 2.3 Características do Produto

As Características do Produto (CPs) representam as principais capacidades que a solução deverá oferecer para atingir os objetivos específicos definidos.

Uma característica pode contribuir para mais de um objetivo, sendo identificado um objetivo principal e, quando aplicável, objetivos para os quais ela também contribui de forma secundária.

| ID | Característica do Produto | Descrição resumida | OE principal | Contribuição secundária |
| :---: | :--- | :--- | :---: | :---: |
| **CP1** | Perfis | Permitir a representação de produtores, propriedades, associações e comunidades na plataforma, apresentando suas informações de forma clara para consumidores e visitantes. | **OE2** | OE1 |
| **CP2** | Catálogo e Disponibilidade de Produtos | Permitir a divulgação organizada dos produtos oferecidos pelos participantes da Rede Cafuringa, contemplando características, categorias, disponibilidade e sazonalidade. | **OE2** | OE1, OE3 |
| **CP3** | Atrativos e Experiências Rurais | Permitir a divulgação de atrativos e experiências oferecidos no território, como trilhas, visitas, vivências agroecológicas, passeios e hospedagens. | **OE2** | OE1, OE3 |
| **CP4** | Busca e Descoberta | Permitir que consumidores e visitantes encontrem produtores, produtos, propriedades e atrativos por meio de critérios de busca. | **OE2** | OE1, OE3 |
| **CP5** | Intenção de Compra e Conexão Direta | Permitir que consumidores manifestem interesse nos produtos e estabeleçam contato direto com os respectivos produtores para continuidade da negociação fora da plataforma. | **OE3** | OE1 |
| **CP6** | Pré-reserva de Experiências | Permitir que visitantes manifestem interesse e solicitem previamente participação em visitas, experiências ou hospedagens, sujeitas à confirmação do respectivo responsável. | **OE3** | OE1 |

### Matriz de Rastreabilidade OE × CP

| Objetivo Específico | CP1 | CP2 | CP3 | CP4 | CP5 | CP6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **OE1 — Inclusão e acessibilidade digital** | **X** | **X** | **X** | **X** | **X** | **X** |
| **OE2 — Visibilidade e descoberta da oferta local** | **X** | **X** | **X** | **X** | | |
| **OE3 — Conexão direta e autonomia dos produtores** | | **X** | **X** | **X** | **X** | **X** |



## **2.4 Tecnologias a serem utilizadas**

!!! info "1. Front-end & PWA"
    Desenvolvido em **React.js** e configurado como **Progressive Web App (PWA)**, oferecendo interface responsiva para smartphones de entrada sem necessidade de lojas de aplicativos. Hospedado no **Cloudflare Pages** com CDN no Brasil e custo zero.

!!! info "2. Back-end & API"
    Estruturado como uma API RESTful desacoplada em **Nest.ts** e **TypeScript**, isolando a lógica de negócios. Conta com conteinerização via **Docker Compose** e gerenciamento de tráfego pelo **Caddy Server** para certificados SSL/TLS automáticos.

!!! info "3. Infraestrutura & Dados"
    Hospedado na **Oracle Cloud Infrastructure** (Always Free Tier em São Paulo) para eliminar tempos de inicialização a frio (*cold start*). Utiliza **MongoDB** para consultas geoespaciais e **OpenStreetMap** com **Leaflet.js** para mapeamento.

---

## **2.5 Pesquisa de mercado e análise competitiva**

No contexto de comercialização de produtos agroecológicos e promoção do ecoturismo de base comunitária, as alternativas indiretas à plataforma Cafuringa incluem canais como feiras rurais tradicionais (como a Feira do Produtor de Ceilândia ou feiras orgânicas do DF), plataformas genéricas de comércio (como o WhatsApp/Instagram e iFood) e aplicações comerciais globais de turismo e aluguel por temporada (como o Airbnb). Embora essas alternativas já possuam grande adoção e infraestrutura tecnológica consolidada, elas apresentam fragilidades críticas para o contexto da agricultura familiar e das ecovilas:

* **Feiras Tradicionais e Vendas por Redes Sociais (WhatsApp/Instagram):** Apresentam alta informalidade de comunicação de divulgação das informações, além de dependência da comunicação manual individual.

* **Plataformas Comerciais de Delivery e Marketplace (iFood / Mercado Livre):** Cobram comissões expressivas sobre as vendas, exigem rotinas logísticas de entrega imediata incompatíveis com o ritmo produtivo do campo e não contemplam a oferta de atrativos do ecoturismo de base comunitária.

* **Plataformas Comerciais de Turismo e Experiências (Airbnb / Booking):** Concentram sua oferta majoritariamente em hospedagens urbanas e comerciais, com baixa representatividade de propriedades rurais de base comunitária. Cobram comissões sobre reservas.

<small>¹ Airbnb, *Host service fee*: taxa padrão de 15,5% sobre o valor da diária (16% para anúncios no Brasil e México). ² Booking.com, *Commission fees for partners*: comissão típica entre 10% e 25% por reserva, com média em torno de 15%. Valores sujeitos a alteração pelas plataformas; devem ser reconfirmados nas políticas oficiais vigentes no momento do uso como referência.</small>

---

## **2.6 Viabilidade da proposta**

A proposta é considerada viável no contexto da disciplina, tendo em vista o escopo dimensionado de forma realista e a capacidade técnica da equipe com dedicação parcial ao longo de dezesseis semanas letivas. A viabilidade é sustentada, primeiramente, pelo acesso contínuo à parte interessada por meio de reuniões periódicas de alinhamento e canal direto de mensagens, mitigando riscos de validação de requisitos.

Do ponto de vista tecnológico, a viabilidade é sustentada pela maturidade das tecnologias escolhidas: React, PWA, Nest.ts, TypeScript e o MongoDB são soluções de código aberto, amplamente adotadas pelo mercado e com farta documentação, o que reduz a curva de aprendizado da equipe e o risco de decisões arquiteturais experimentais. Além disso, nenhuma das capacidades previstas exige o desenvolvimento de tecnologia nova: a resiliência offline do PWA e a integração com provedores de nuvem gratuitos são recursos consolidados de suas respectivas bibliotecas e serviços. Isso caracteriza um desafio de integração e de gestão de escopo, não de inovação tecnológica, o que torna o projeto tecnicamente executável dentro do prazo.

Ainda assim, o conjunto de capacidades previsto é extenso: PWA resiliente a baixa conectividade, autenticação, catálogo e controle de disponibilidade, pré-reservas, acessibilidade, front-end e back-end desacoplados, infraestrutura distribuída entre provedores gratuitos e conteinerização com Docker, Caddy e MongoDB. Esse volume de funcionalidades representa um escopo elevado para ser integralmente implementado em um único semestre letivo por uma equipe com dedicação parcial. Por isso, a viabilidade técnica está condicionada à definição objetiva de um MVP que priorize o subconjunto de maior valor de negócio e menor complexidade técnica. Esse recorte deve postergar ou simplificar explicitamente as funcionalidades de menor prioridade.

Dessa forma, a viabilidade da proposta está condicionada aos seguintes fatores-chave:

* A manutenção de um escopo controlado, com foco rigoroso nas características essenciais e corte inflexível de escopos secundários para garantir a entrega do MVP;

* A estruturação da reserva de experiências e hospedagem estritamente como pré-reserva com aceite do anfitrião, sem pagamentos ou contratos integrados;

* A definição clara de um responsável (dono) pela conferência dos cadastros e auditoria contínua de conteúdo.


### Gestão de Riscos Preliminar da Equipe 

Para garantir a integridade da plataforma, a conformidade regulamentar e o sucesso do MVP, o projeto adota uma gestão de riscos ativa focada nas seguintes frentes:

| ID | Descrição do Risco | Tipo | Impacto | Probabilidade | Ação de Mitigação |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **R1** | Moderação e Responsabilidade Operacional: a tecnologia isolada não elimina riscos de uso indevido ou inserção de dados falsos pelos produtores. | Operacional | Alto | Médio | Definir claramente um responsável (dono) operacional pela conferência de cadastros e auditoria contínua de anúncios. |
| **R2** | Escopo e Cronograma: riscos associados a atrasos por desvios de escopo ou complexidade técnica imprevista no MVP, dado o volume elevado de capacidades tecnológicas previstas. | Gerencial / Técnico | Médio | Alto | Foco no conjunto de características essenciais, priorização rígida do MVP por valor de negócio e complexidade técnica, e adoção de marcos de revisão claros ao final de cada iteração curta. |

---

## **2.7 Benefícios Esperados**


**1) Para a gestão da Rede Cafuringa (Cliente/Organização):** 

Centraliza e dá visibilidade pública à produção e aos atrativos do território (antes dispersos em redes sociais e grupos), atuando como um complemento estratégico à Cafuringa Store. A solução organiza a visitação por agendamento prévio e consolida dados estruturados da oferta local, facilitando a articulação institucional com órgãos como Emater-DF e IBRAM.

**2) Para os produtores rurais e ecovilas (Usuários da Oferta):** 

Cria uma nova via de escoamento contínuo para reduzir perdas pós-colheita e sem retenção de margem pela plataforma (ausência de taxas de intermediação). A ferramenta contribui para a diversificação de renda ao unir produtos e turismo rural, favorece maior previsibilidade de fluxo por meio do pré-agendamento de visitantes e fortalece a reputação digital dos produtores.

**3) Para os consumidores e visitantes (Usuários da Demanda):** 

Facilita a descoberta e o acesso a produtos agroecológicos e atrativos rurais, rompendo a restrição de horários das feiras tradicionais. Oferece previsibilidade sobre as regras de visitação e contato direto com os produtores.
