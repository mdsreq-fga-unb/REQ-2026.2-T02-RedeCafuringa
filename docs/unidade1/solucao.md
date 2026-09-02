<span class="version-badge">Unidade 01</span>

## **2.1 Objetivo geral do produto**

O objetivo do produto é expandir a conexão direta dos produtores da agricultura familiar e as comunidades da APA da Cafuringa aos consumidores e visitantes do Distrito Federal e Entorno por meio de uma plataforma digital pública, gratuita e sem intermediação financeira. A solução visa eliminar a dependência de atravessadores, dar visibilidade ao catálogo de alimentos agroecológicos e produtos artesanais, e estruturar a oferta do ecoturismo de base comunitária (trilhas, vivências e hospedagens). Com isso, o sistema garante transparência regulatória quanto à certificação orgânica e promove a geração de renda sustentável e a preservação ambiental no território.

---

## 2.2 Objetivos Específicos (OE) do Produto

Os objetivos específicos orientam o desenvolvimento das funcionalidades e servem como critério de avaliação das entregas.

<div class="section-cards">
  <div class="section-card">
      <h3>Objetivo Específico 01</h3>
      <p>Promover a inclusão e a acessibilidade digital para produtores e consumidores no meio rural, assegurando uma experiência intuitiva e utilizável sob condições restritas de conectividade e de dispositivos.</p>
  </div>

  <div class="section-card">
      <h3>Objetivo Específico 02</h3>
      <p>Mapear e visibilizar a produção agroecológica e os atrativos locais, facilitando a descoberta georreferenciada da oferta regional por parte de consumidores e visitantes.</p>
  </div>

  <div class="section-card">
      <h3>Objetivo Específico 03</h3>
      <p>Assegurar a confiabilidade e a conformidade regulatória da rede de comercialização, garantindo o respeito à privacidade dos usuários e a integridade da identificação de produtos orgânicos e agroecológicos.</p>
  </div>

  <div class="section-card">
      <h3>Objetivo Específico 04</h3>
      <p>Fomentar o circuito curto de comercialização e a autonomia dos produtores, viabilizando a aproximação e o contato direto entre as partes sem intermediação financeira.</p>
  </div>
</div>

---

## 2.3 Características do Produto

As características do produto (CPs) foram mapeadas diretamente aos Objetivos Específicos (OEs), garantindo rastreabilidade entre funcionalidades e objetivos de negócio.

| ID | Característica do Produto | Descrição resumida | Valor de negócio principal | OE principal | Contribuição secundária |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **CP1** | Gestão de Perfil e Certificação Transparente | A solução deverá desenvolver uma ferramenta de cadastro de produtores/propriedades com exibição da situação de certificação e verificação. | Conformidade legal (Lei nº 10.831/2003) e geração de confiança para o consumidor urbano. | OE3 | OE2 |
| **CP2** | Catálogo Unificado de Produtos | A solução deverá permitir cadastrar alimentos agrícolas frescos, beneficiados e artesanais, com atualização rápida de estoque e sazonalidade. | Redução de perdas pós-colheita entre dias de feira e eliminação de intermediários comerciais. | OE2 | OE4 |
| **CP3** | Diretório de Atrativos Rurais | A solução deverá conter a ficha detalhada de propriedades com cadastro de atrativos naturais, vivências agroecológicas e hospedagem rústica. | Diversificação das fontes de renda do produtor e fortalecimento do ecoturismo de base comunitária. | OE2 | OE4 |
| **CP4** | Busca e Descoberta Georreferenciada | A solução deverá conter um motor de consulta com mapa interativo e filtros por proximidade, categorias, perfil de interesse e situação de certificação. | Facilidade na localização hiperlocal de produtores e atrativos próximos ao consumidor. | OE2 | OE1, OE4 |
| **CP5** | Motor de Pré-Reserva e Conexão Direta | A solução deverá conter registro de intenções de compra/visita com aceite obrigatório e liberação recíproca dos dados de contato. | Viabilização de transações sem retenção de margem e prevenção contra sobrecarga turística nas ecovilas. | OE4 | OE2, OE3 |
| **CP6** | Interface PWA Acessível e Resiliente | A solução deverá ser uma aplicação web responsiva instalável, leve, otimizada para conexões rurais lentas e acessível. | Inclusão digital de produtores rurais com conectividade instável e baixo letramento tecnológico. | OE1 | OE4 |
| **CP7** | Arquitetura Desacoplada e Custo Zero | A solução deverá ser uma API RESTful em infraestrutura de nuvem gratuita. | Sustentabilidade financeira e operacional do projeto, mantendo autonomia e ausência de taxas para produtores. | OE3 | OE1, OE4 |

---

## **2.4 Tecnologias a serem utilizadas**

!!! info "1. Front-end & PWA"
    Desenvolvido em **React.js** e configurado como **Progressive Web App (PWA)**, oferecendo interface responsiva para smartphones de entrada sem necessidade de lojas de aplicativos. Hospedado no **Cloudflare Pages** com CDN no Brasil e custo zero.

!!! info "2. Back-end & API"
    Estruturado como uma API RESTful desacoplada em **Nest.js** e **TypeScript**, isolando a lógica de negócios. Conta com conteinerização via **Docker Compose** e gerenciamento de tráfego pelo **Caddy Server** para certificados SSL/TLS automáticos.

!!! info "3. Infraestrutura & Dados"
    Hospedado na **Oracle Cloud Infrastructure** (Always Free Tier em São Paulo) para eliminar tempos de inicialização a frio (*cold start*). Utiliza **MongoDB** para consultas geoespaciais e **OpenStreetMap** com **Leaflet.js** para mapeamento.

---

## **2.5 Pesquisa de mercado e análise competitiva**

No contexto de comercialização de produtos agroecológicos e promoção do ecoturismo de base comunitária, as alternativas indiretas à plataforma Cafuringa incluem canais como feiras rurais tradicionais (como a Feira do Produtor de Ceilândia ou feiras orgânicas do DF), plataformas genéricas de comércio (como o WhatsApp/Instagram e iFood) e aplicações comerciais globais de turismo e aluguel por temporada (como o Airbnb). Embora essas alternativas já possuam grande adoção e infraestrutura tecnológica consolidada, elas apresentam fragilidades críticas para o contexto da agricultura familiar e das ecovilas:

* **Feiras Tradicionais e Vendas por Redes Sociais (WhatsApp/Instagram):** Apresentam alta informalidade, falta de consulta georreferenciada de produtores e dependência de comunicação manual individual, o que gera perda de alimentos pós-feira, limitação geográfica do alcance de clientes e ausência de mecanismos de validação pública da certificação orgânica.

* **Plataformas Comerciais de Delivery e Marketplace (iFood / Mercado Livre):** Cobram comissões expressivas sobre as vendas, exigem rotinas logísticas de entrega imediata incompatíveis com o ritmo produtivo do campo e não contemplam a oferta de atrativos do ecoturismo de base comunitária.

* **Plataformas Comerciais de Turismo e Experiências (Airbnb / Booking):** Focam exclusivamente em meios de hospedagem urbanos ou comerciais de alto padrão, cobram taxas de reserva abusivas e ignoram a integração do turismo com a produção agrícola familiar local e o ecossistema comunitário da APA.

A solução da Cafuringa irá se diferenciar por:

* **Integração Territorial Híbrida (Alimento + Ecoturismo):** Reúne em uma única plataforma a oferta de alimentos frescos agroecológicos, produtos artesanais beneficiados e vivências rurais (trilhas, passeios e hospedagens), fortalecendo a economia local de forma integrada.

* **Isenção Total de Comissões e Custo Zero:** Opera sem a cobrança de taxas de adesão, mensalidades ou retenção de margem financeira sobre os produtores e visitantes, direcionando o contato diretamente para a negociação sem intermediários.

* **Transparência Regulatória de Orgânicos:** Garante a validação técnica da situação do produtor e o bloqueio automático de rotulagem indevida de "orgânico" para não certificados (em conformidade com a Lei nº 10.831/2003), aumentando a confiança do consumidor urbano.

* **Acessibilidade e Geolocalização Hiperlocal:** Oferece um mapa interativo leve com busca por proximidade via OpenStreetMap, otimizado para funcionar sob conexões rurais lentas e em dispositivos móveis de entrada via PWA.

---

## **2.6 Viabilidade da proposta**


**Gestão de riscos preliminar da equipe** 

---

## **2.7 Benefícios Esperados**


