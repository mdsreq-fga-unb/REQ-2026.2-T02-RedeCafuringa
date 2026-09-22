# Evidências da Iteração 3

## Elicitação e Descoberta 

Investigação documental de regulamentações do turismo rural, LGPD e regras fiscais/municipais locais e reuniões em grupo com anfitriões para mapear processos de campo e restrições operacionais.

??? info "1 - Análise de Domínio e Pesquisa Normativa"

    Estas são as diretrizes legais e regulatórias externas que o sistema deve obrigatoriamente cumprir para operar. Em conjunto com as políticas internas que guiam o comportamento do sistema e as interações dos usuários, incluindo o tratamento acordado sobre a infraestrutura de rede.

    - ![Pesquisa Normativa](../../img/aup-elaboracao/pesquisa_normativa.png)

??? info "2 - Grupo Focal (Focus Group)"

    Relatório da reuniãos em grupo com anfitriões para mapear processos de campo e restrições operacionais.

    <iframe src="https://docs.google.com/document/d/e/2PACX-1vRPewi-aDY6FvP46HDCdKXbBQbc03EjNIuG30FZyiXB3Ee3CuZAYOfpO1_7hBejX6Izpdqx2c46EkTP/pub?embedded=true"width="100%" height="500" frameborder="0"></iframe>

---

## Declaração de Requisitos

Estruturação das Características do Produto (CPs) em Histórias de Usuário (User Stories) contendo critérios de aceite em linguagem estruturada e detalhamento de restrições de desempenho, usabilidade, operação offline e segurança.

??? info "1 - Decomposição Funcional das Características do Produto em User Stories"

    Este mapa mental ilustra a hierarquia das funcionalidades (CPs) desmembradas em Histórias de Usuário (US).

    - ![User Stories](../../img/aup-elaboracao/user_stories.png)

??? info "2 - Especificação de Requisitos Não Funcionais (RNFs)" 

    Este mapa mental categoriza as restrições arquiteturais, operacionais e de qualidade do sistema.

    - ![Requisitos Não Funcionais](../../img/aup-elaboracao/requisitos_nao_funcionais.png)

---

## Análise e Consenso

Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.

??? info "Matriz e Quadrantes"

    A priorização considera a contribuição dos requisitos para os objetivos do projeto, especialmente a divulgação dos produtores e de seus produtos, a valorização das experiências rurais e a aproximação entre produtores e consumidores. A complexidade técnica é estimada com base nas funcionalidades envolvidas, nas integrações e nas restrições de qualidade e infraestrutura descritas nos requisitos levantados.

    | Critério | Classificação |
    | :--- | :--- |
    | Valor de negócio alto | Requisito essencial para viabilizar a proposta de valor da Rede Cafuringa, permitindo divulgar ofertas, conectar usuários ou viabilizar atividades centrais. |
    | Valor de negócio baixo/médio | Requisito complementar, informativo ou que agrega valor após a disponibilização das funcionalidades centrais. |
    | Complexidade técnica baixa | Implementação predominantemente baseada em operações de cadastro, consulta, atualização e apresentação de informações. |
    | Complexidade técnica alta | Implementação que envolve maior esforço de integração, geolocalização, fluxos de comunicação, controle de acesso ou tratamento de estados e restrições. |

    Observação: os níveis abaixo são uma estimativa inicial para apoiar a definição do MVP, não uma medição técnica definitiva. A classificação deverá ser validada com os arquitetos de software, engenheiros de requisitos e cliente.

    ![Matriz de Quadrantes](../../img/aup-elaboracao/matriz_quadrantes.png)

---

## Vídeos Comprobatórios

O vídeo abaixo registra a primeira visita presencial na Cafuringa, experiência realizada em 21/09/2026 com objetivo de conhecer o lugar, o próprio Jefferson Sooma e discutir os requisitos do projeto.

<video width="100%" controls>
    <source src="../../img/aup-elaboracao/visitacao.mp4" type="video/mp4">
</video>