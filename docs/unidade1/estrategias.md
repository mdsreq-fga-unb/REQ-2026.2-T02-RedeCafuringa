# 4. Estratégias de Engenharia de Software

Unidade 01

## 4.1 Estratégia Priorizada

**Abordagem de Desenvolvimento de Software:** Híbrida
**Ciclo de Vida:** Iterativo e Incremental Adaptável
**Processo de Engenharia de Software:** AUP (*Agile Unified Process*)

---

## 4.2 Quadro Comparativo

O quadro a seguir compara o processo selecionado (**AUP**) com uma alternativa viável de Processo Unificado enxuto (**OpenUP**), considerando as particularidades do ecossistema da Rede Cafuringa:

| Critério de Comparação                     | Processo A: OpenUP (Open Unified Process)                                                                    | Processo B: AUP (Agile Unified Process) — Priorizado                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Categoria e Classificação**              | Processo Unificado Leve / Ágil.                                                                              | Processo Híbrido / Adaptativo Unificado.                                                                                                               |
| **Estrutura de Fases / Iterações**         | Estruturado nas 4 fases do RUP (*Concepção, Elaboração, Construção, Transição*) divididas em iterações.      | Estruturado nas 4 fases do RUP (*Iniciação, Elaboração, Construção, Transição*) com execução em 7 disciplinas paralelas.                               |
| **Gestão e Organização de Requisitos**     | Organizados via Visão de Produto, Casos de Uso leves e Requisitos Técnicos/Não-Funcionais.                   | Organizados em Histórias de Usuário (*User Stories*) e apoiados por Modelagem Ágil (*Agile Modeling*) quando necessário.                               |
| **Lidar com Mudanças e Fluxo de Trabalho** | Mudanças tratadas em marcos de iteração e refinadas na fase de Elaboração.                                   | Mudanças gerenciadas de forma ágil ao longo das disciplinas, ajustando o backlog de *User Stories* a cada iteração sem bloquear o fluxo técnico.       |
| **Práticas Técnicas de Engenharia**        | Enfatiza arquitetura centrada, gerenciamento de riscos e verificação contínua, sem impor práticas de código. | Incorpora Desenvolvimento Orientado a Testes (TDD), Refatoração e Modelagem Ágil, garantindo especificação técnica executável.                         |
| **Grau de Burocracia e Documentação**      | Documentação enxuta, porém exige controle de marcos formais e artefatos de arquitetura.                      | Documentação viva minimalista centrada nas próprias *User Stories* e nos testes automatizados, reduzindo artefatos formais ao estritamente necessário. |

---

## 4.3 Justificativa

Fundamentada no princípio da **adaptabilidade contextual**, a estratégia de engenharia de software do projeto Cafuringa afasta-se de adoções dogmáticas para combinar elementos metodológicos que atendam às necessidades específicas do domínio, da cultura da equipe e do produto. A escolha pela **Abordagem Híbrida** justifica-se por oferecer um equilíbrio pragmático entre processos estruturados e flexibilidade situacional. Essa filosofia permite tratar regras de negócio críticas e regulamentações com maior controle e rigor, enquanto os demais componentes do sistema evoluem de forma ágil com base na colaboração direta.

Para materializar essa abordagem no planejamento, adotou-se o **Ciclo de Vida Iterativo, Incremental e Adaptável**. Esse modelo enfatiza a realização do trabalho em ciclos sucessivos de iterações, construindo progressivamente o software funcional, e possui a vantagem de combinar características de ciclos preditivos e ágeis para atingir objetivos específicos em diferentes momentos do desenvolvimento. Como reflexo direto dessa escolha, o **Agile Unified Process (AUP)** foi selecionado como processo de engenharia, pois segue as quatro fases conceituais (*Iniciação, Elaboração, Construção e Transição*) de maneira leve e personalizável.

Avaliando a adoção do AUP pelas dimensões **técnicas, humanas e organizacionais**, a justificativa torna-se ainda mais aderente à realidade do projeto. Na dimensão humana, a organização do AUP em sete disciplinas paralelas ajusta-se com exatidão à distribuição de papéis da equipe **Bytelab**, garantindo que cada um dos sete estudantes assuma responsabilidades claras e que áreas críticas, como infraestrutura e qualidade, não fiquem desamparadas. Além disso, a facilidade de contato com o cliente (**Jefferson Sooma**) viabiliza a representação ágil de requisitos por histórias de usuário, aplicando a modelagem visual apenas quando estritamente necessário para elucidar regras complexas.

Na dimensão técnica, diferentemente de processos mais flexíveis, o AUP incorpora o **Desenvolvimento Orientado a Testes (TDD)**. Isso é imperativo para o contexto da Cafuringa, onde regras sensíveis, como a adequação à **LGPD** e o bloqueio sistêmico da rotulagem "orgânico" para produtores não certificados (**Lei nº 10.831/2003**), exigem especificações executáveis e automatizadas, blindando o software contra regressões legais.

Paralelamente, a fase de **Elaboração** permite mitigar os maiores riscos arquiteturais de forma precoce, estabilizando a resiliência offline do **PWA** e a integração com o **OpenStreetMap** antes da construção em escala das interfaces. Por fim, na dimensão organizacional, as disciplinas técnicas do AUP guiam o versionamento e o *deploy* contínuo em instâncias de nuvem gratuitas, assegurando a viabilidade financeira de orçamento zero, enquanto a fase de **Transição** formaliza a homologação final (**UAT**) validada diretamente pelas comunidades da APA da Cafuringa.
