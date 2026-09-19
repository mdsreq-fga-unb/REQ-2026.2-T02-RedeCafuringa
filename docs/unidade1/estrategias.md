# 4. Estratégias de Engenharia de Software

<span class="version-badge">Unidade 01</span>

## 4.1 Estratégia Priorizada

A estratégia de engenharia de software priorizada para o desenvolvimento do projeto Rede Cafuringa é apresentada no quadro a seguir:

| Elemento                                     | Estratégia Priorizada              |
| -------------------------------------------- | ---------------------------------- |
| **Abordagem de Desenvolvimento de Software** | Híbrida                            |
| **Ciclo de Vida**                            | Iterativo e Incremental  
| **Processo de Engenharia de Software**       | AUP (*Agile Unified Process*)      |

A classificação do projeto em uma abordagem híbrida ocorre por combinarmos elementos de metodologias dirigidas por plano com práticas ágeis adaptativas, calibrando a formalidade de acordo com a criticidade do contexto. Concretamente, esta abordagem se materializa da seguinte forma:

*   **Elementos dirigidos por plano:** O projeto adota um controle rigoroso de governança técnica sobre a arquitetura do sistema e sobre os requisitos regulatórios (como regras de certificação orgânica e LGPD). O avanço do projeto é balizado por marcos formais de revisão (Phase Gates) herdados do Processo Unificado, garantindo validações estruturais antes de avançar de fase.
*   **Elementos ágeis/adaptativos:** O desenvolvimento das interfaces, integrações e funcionalidades de menor risco ocorre de forma iterativa e incremental. Utiliza-se ciclos curtos de feedback, especificação leve baseada em Histórias de Usuário (User Stories) e práticas de código como o Desenvolvimento Orientado a Testes (TDD).
*   **Gestão de Mudanças:** As mudanças de requisitos são acolhidas continuamente e gerenciadas no Backlog do Produto de forma ágil, sendo repriorizadas a cada nova iteração. No entanto, mudanças que afetem a arquitetura central ou as regras legais de negócio passam por uma análise técnica mais estruturada.
*   **Baselines e Marcos controlados:** O projeto controlará formalmente a *Baseline de Arquitetura* (estabelecida ao final da fase de Elaboração para mitigar riscos técnicos) e a *Baseline de Release/Produto* (estabelecida no marco da fase de Transição, após a homologação final).

---

### 4.2 Quadro Comparativo

O quadro a seguir compara o processo selecionado (AUP) com uma alternativa viável de Processo Unificado enxuto (OpenUP), utilizando o mesmo rigor e critérios para evidenciar as nuances que motivaram a escolha:

| Critério de Comparação | Processo A: OpenUP (Open Unified Process) | Processo B: AUP (Agile Unified Process) — Priorizado |
| :--- | :--- | :--- |
| **Categoria e Classificação** | Processo Unificado Leve / Ágil. | Processo Híbrido / Adaptativo Unificado. |
| **Estrutura de Fases / Iterações** | Estruturado nas 4 fases do RUP (*Concepção, Elaboração, Construção, Transição*) divididas em iterações. | Estruturado nas 4 fases do RUP (*Iniciação, Elaboração, Construção, Transição*) com execução em 7 disciplinas paralelas. |
| **Gestão e Organização de Requisitos** | Organizados via Visão de Produto, Casos de Uso leves e Requisitos Técnicos/Não-Funcionais. | Organizados em Histórias de Usuário (*User Stories*) e apoiados por Modelagem Ágil (*Agile Modeling*) quando necessário. |
| **Lidar com Mudanças e Fluxo de Trabalho** | Mudanças tratadas em marcos de iteração e refinadas na fase de Elaboração. | Mudanças gerenciadas de forma ágil ao longo das disciplinas, ajustando o backlog de *User Stories* a cada iteração sem bloquear o fluxo técnico. |
| **Práticas Técnicas de Engenharia** | Enfatiza arquitetura centrada, gerenciamento de riscos e verificação contínua, sem impor práticas de código. | Incorpora Desenvolvimento Orientado a Testes (TDD), Refatoração e Modelagem Ágil, garantindo especificação técnica executável. |
| **Grau de Burocracia e Documentação** | Documentação enxuta, porém exige controle de marcos formais e artefatos de arquitetura. | Documentação viva minimalista centrada nas próprias *User Stories* e nos testes automatizados, reduzindo artefatos formais ao estritamente necessário. |

---

### 4.3 Justificativa

Fundamentada no princípio da adaptabilidade contextual, a estratégia de engenharia de software do projeto Cafuringa afasta-se de adoções dogmáticas para combinar elementos metodológicos que atendam às necessidades específicas do domínio, da cultura da equipe e do produto. A escolha pela Abordagem Híbrida justifica-se por oferecer um equilíbrio pragmático entre processos estruturados e flexibilidade situacional. Essa filosofia permite tratar regras de negócio críticas e regulamentações com maior controle e rigor, enquanto os demais componentes do sistema evoluem de forma ágil com base na colaboração direta.

Para materializar essa abordagem no planejamento, adotou-se o Ciclo de Vida Iterativo, Incremental e Adaptável. Esse modelo enfatiza a realização do trabalho em ciclos sucessivos de iterações, construindo progressivamente o software funcional, e possui a vantagem de combinar características de ciclos preditivos e ágeis para atingir objetivos específicos em diferentes momentos do desenvolvimento. Como reflexo direto dessa escolha, o Agile Unified Process (AUP) foi selecionado como processo de engenharia, pois segue as quatro fases conceituais (Iniciação, Elaboração, Construção e Transição) de maneira leve e personalizável.

Avaliando a adoção do AUP pelas dimensões técnicas, humanas e organizacionais, a justificativa torna-se ainda mais aderente à realidade do projeto. Na dimensão humana: Diferentemente de mapear disciplinas como cargos isolados, a adoção do AUP compreende que suas sete disciplinas (Modelo, Implementação, Teste, Implantação, Gerenciamento de Configuração, Gerenciamento de Projeto e Ambiente) funcionam como fluxos de trabalho contínuos e paralelos. A equipe Bytelab, composta por sete desenvolvedores, atuará de forma colaborativa e multifuncional (cross-functional) ao longo dessas disciplinas, garantindo que áreas críticas de infraestrutura e qualidade sejam responsabilidade compartilhada da equipe ao longo de todas as iterações. Além disso, para manter a coerência metodológica, a equipe utilizará exclusivamente Histórias de Usuário (User Stories) como unidade de requisito funcional, facilitando o diálogo direto com o cliente (Jefferson Sooma).

Na dimensão técnica: O AUP se destacou frente ao OpenUP por prescrever ferramentas técnicas claras para o dia a dia do desenvolvimento, como o Desenvolvimento Orientado a Testes (TDD). No contexto da Cafuringa, existem restrições severas, como a LGPD e a conformidade com a Lei nº 10.831/2003 (rotulagem orgânica). O TDD contribuirá ativamente para a verificação automatizada dessas regras no código. Contudo, a conformidade final não provém apenas da ferramenta, mas sim da correta interpretação da regra de negócio validada junto ao cliente e a especialistas, cujos critérios de aceitação serão traduzidos nos testes derivados. Além disso, a fase de Elaboração explícita do AUP justifica-se pela necessidade de estabilizar precocemente a resiliência offline do PWA e a integração arquitetural com o OpenStreetMap, riscos muito altos para serem empurrados para a fase de construção.
Na dimensão organizacional: As disciplinas técnicas do AUP (Implantação, Ambiente e Gestão de Configuração) guiam fortemente a esteira de CI/CD em instâncias de nuvem gratuitas, adequando-se à restrição inegociável de orçamento zero do projeto. Por fim, a demarcação clara da fase de Transição fornece ao cliente e às comunidades da APA da Cafuringa um ambiente seguro e controlado para a homologação e validação da plataforma antes do lançamento definitivo.

---
