# Evidências da Iteração 3

## Elicitação e Descoberta 

Investigação documental de regulamentações do turismo rural, LGPD e regras fiscais/municipais locais e reuniões em grupo com anfitriões para mapear processos de campo e restrições operacionais.

??? info "1 - Análise de Domínio e Pesquisa Normativa"

    Estas são as diretrizes legais e regulatórias externas que o sistema deve obrigatoriamente cumprir para operar. Em conjunto com as políticas internas que guiam o comportamento do sistema e as interações dos usuários, incluindo o tratamento acordado sobre a infraestrutura de rede.

    - ![Pesquisa Normativa](../../img/aup-elaboracao/pesquisa_normativa.png)

??? info "2 - Grupo Focal"

    Relatório da reuniãos em grupo com anfitriões para mapear processos de campo e restrições operacionais.

    <iframe src="https://docs.google.com/document/d/e/2PACX-1vRPewi-aDY6FvP46HDCdKXbBQbc03EjNIuG30FZyiXB3Ee3CuZAYOfpO1_7hBejX6Izpdqx2c46EkTP/pub?embedded=true"width="100%" height="500" frameborder="0"></iframe>

---

## Declaração de Requisitos

Estruturação das Características do Produto em Histórias de Usuário contendo critérios de aceite em linguagem estruturada e detalhamento de restrições de desempenho, usabilidade, operação offline e segurança.

??? info "1 - Histórias de Usuário"

    

??? info "2 - Valor de Negócio e Esforço Técnico - Requisitos Funcionais"  

    | Código | Requisito | Esforço | Complexidade | Capacidade | Esforço Técnico |
    |---|---|---:|---:|---:|---:|
    | **RF01** | Cadastrar perfil de consumidor | 2 | 1 | 1 | **1,3 → 1** |
    | **RF02** | Cadastrar perfil de produtor | 2 | 1 | 1 | **1,3 → 1** |
    | **RF03** | Cadastrar usuário admin | 2 | 1 | 1 | **1,3 → 1** |
    | **RF04** | Consultar usuários cadastrados | 2 | 2 | 1 | **1,7 → 2** |
    | **RF05** | Desativar usuário | 1 | 2 | 1 | **1,3 → 1** |
    | **RF06** | Consultar conteúdos cadastrados | 2 | 3 | 1 | **2,0 → 2** |
    | **RF07** | Remover conteúdo inadequado | 2 | 3 | 1 | **2,0 → 2** |
    | **RF08** | Atualizar informações institucionais | 1 | 1 | 1 | **1,0 → 1** |
    | **RF09** | Autenticar usuário | 2 | 3 | 2 | **2,3 → 2** |
    | **RF10** | Recuperar acesso à conta | 2 | 3 | 1 | **2,0 → 2** |
    | **RF11** | Excluir conta | 2 | 3 | 1 | **2,0 → 2** |
    | **RF12** | Registrar trajetória do produtor | 1 | 2 | 1 | **1,3 → 1** |
    | **RF13** | Atualizar perfil de produtor | 2 | 2 | 1 | **1,7 → 2** |
    | **RF14** | Consultar perfil de produtor | 2 | 2 | 1 | **1,7 → 2** |
    | **RF15** | Informar certificação | 2 | 4 | 3 | **3,0 → 3** |
    | **RF16** | Preencher questionário do produtor | 2 | 3 | 3 | **2,6 → 3** |
    | **RF17** | Cadastrar produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF18** | Atualizar produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF19** | Excluir produto | 1 | 2 | 1 | **1,3 → 1** |
    | **RF20** | Informar disponibilidade de produto | 2 | 3 | 1 | **2,0 → 2** |
    | **RF21** | Consultar catálogo de produtos | 2 | 2 | 1 | **1,7 → 2** |
    | **RF22** | Consultar detalhes do produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF23** | Cadastrar experiência | 2 | 2 | 2 | **2,0 → 2** |
    | **RF24** | Atualizar experiência | 2 | 2 | 2 | **2,0 → 2** |
    | **RF25** | Consultar experiência | 2 | 3 | 2 | **2,3 → 2** |
    | **RF26** | Excluir experiência | 1 | 2 | 1 | **1,3 → 1** |
    | **RF27** | Cadastrar evento | 2 | 2 | 2 | **2,0 → 2** |
    | **RF28** | Atualizar evento | 2 | 2 | 1 | **1,7 → 2** |
    | **RF29** | Consultar evento | 1 | 2 | 1 | **1,3 → 1** |
    | **RF30** | Excluir evento | 1 | 2 | 1 | **1,3 → 1** |
    | **RF31** | Auxiliar cadastro de atividade | 4 | 4 | 4 | **4 → 4** |
    | **RF32** | Apresentar informações da Cafuringa | 1 | 1 | 1 | **1,0 → 1** |
    | **RF33** | Consultar guia de boas práticas | 1 | 2 | 2 | **1,7 → 2** |
    | **RF34** | Notificar eventos | 3 | 3 | 3 | **3,0 → 3** |
    | **RF35** | Visualizar ofertas no mapa | 4 | 4 | 2 | **3,3 → 3** |
    | **RF36** | Buscar ofertas | 3 | 3 | 2 | **2,6 → 3** |
    | **RF37** | Buscar locais por proximidade | 4 | 3 | 4 | **3,6 → 4** |
    | **RF38** | Filtrar resultados de busca | 2 | 3 | 2 | **2,3 → 2** |
    | **RF39** | Disponibilizar contato direto | 4 | 4 | 4 | **4,0 → 4** |
    | **RF40** | Enviar feedback ao fornecedor | 3 | 3 | 2 | **2,6 → 3** |
    | **RF41** | Visualizar feedback | 2 | 2 | 1 | **1,7 → 2** |
    | **RF42** | Editar feedback | 1 | 2 | 1 | **1,3 → 1** |
    | **RF43** | Excluir feedback ao fornecedor | 1 | 2 | 2 | **1,7 → 2** |
    | **RF44** | Solicitar pré-reserva de experiência | 4 | 3 | 3 | **3,3 → 3** |
    | **RF45** | Consultar pré-reserva | 2 | 2 | 2 | **2,0 → 2** |
    | **RF46** | Cancelar solicitação de pré-reserva | 2 | 3 | 2 | **2,3 → 2** |
    | **RF47** | Responder pré-reserva de experiência | 3 | 3 | 3 | **3,0 → 3** |
    | **RF48** | Notificar alteração de pré-reserva | 3 | 4 | 3 | **3,3 → 3** |

??? info "3 - Valor de Negócio e Esforço Técnico - Requisitos Não Funcionais"  
    | Código | Requisito | E | C | L | ET |
    |---|---|---:|---:|---:|---:|
    | **RNF01** | Eficiência de navegação | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF02** | Desempenho na execução de tarefas | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF03** | Prevenção e recuperação de erros | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF04** | Acessibilidade digital | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF05** | Responsividade da interface | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF06** | Desempenho em conectividade limitada | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF07** | Resiliência à perda de conexão | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF08** | Controle de acesso por perfil | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF09** | Privacidade do feedback | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF10** | Proteção da comunicação | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF11** | Proteção de dados pessoais | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF12** | Compatibilidade entre navegadores | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF13** | Baixo custo operacional | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF14** | Disponibilização como aplicação web progressiva | 3 | 3 | 2 | **2,7 → 3** |
        
---

## Análise e Consenso

A priorização considera a contribuição dos requisitos para os objetivos do projeto, especialmente a divulgação dos produtores e de seus produtos, a valorização das experiências rurais e a aproximação entre produtores e consumidores. A complexidade técnica é estimada com base nas funcionalidades envolvidas, nas integrações e nas restrições de qualidade e infraestrutura descritas nos requisitos levantados.

??? info "Matriz e Quadrantes"

    | **Valor de negócio x Esforço técnico** | **Baixo** | **Moderado** | **Alto** | **Muito alto** |
    | ---- | ---- | ---- | ---- | ---- |
    | **Muito alto** | RF01 - Cadastrar perfil de consumidor<br>RF02 - Cadastrar perfil de produtor<br>RF03 - Cadastrar usuário admin | RF04 - Consultar usuários cadastrados<br>RF09 - Autenticar usuário<br>RF14 - Consultar perfil de produtor<br>RF17 - Cadastrar produto<br>RF21 - Consultar catálogo de produtos<br>RF22 - Consultar detalhes do produto<br>RF23 - Cadastrar experiência<br>RF25 - Consultar experiência | RF36 - Buscar ofertas<br>RF44 - Solicitar pré-reserva de experiência<br>RF46 - Cancelar solicitação de pré-reserva<br>RF47 - Responder pré-reserva de experiência | RF39 - Disponibilizar contato direto |
    | **Alto** | RF05 - Desativar usuário<br>RF12 - Registrar trajetória do produtor<br>RF29 - Consultar evento | RF06 - Consultar conteúdos cadastrados<br>RF07 - Remover conteúdo inadequado<br>RF10 - Recuperar acesso à conta<br>RF11 - Excluir conta<br>RF13 - Atualizar perfil de produtor<br>RF18 - Atualizar produto<br>RF20 - Informar disponibilidade de produto<br>RF24 - Atualizar experiência<br>RF27 - Cadastrar evento<br>RF33 - Consultar guia de boas práticas<br>RF38 - Filtrar resultados de busca<br>RF41 - Visualizar feedback<br>RF45 - Consultar pré-reserva | RF16 - Preencher questionário do produtor<br>RF48 - Notificar alteração de pré-reserva | — |
    | **Moderado** | RF08 - Atualizar informações institucionais<br>RF19 - Excluir produto<br>RF26 - Excluir experiência<br>RF32 - Apresentar informações da Cafuringa | RF28 - Atualizar evento | RF34 - Notificar eventos<br>RF40 - Enviar feedback ao fornecedor | — |
    | **Baixo** | RF30 - Excluir evento<br>RF42 - Editar feedback | RF43 - Excluir feedback ao fornecedor | RF15 - Informar certificação<br>RF35 - Visualizar ofertas no mapa | RF31 - Auxiliar cadastro de atividade<br>RF37 - Buscar locais por proximidade |
   
---

## Vídeos Comprobatórios

O vídeo abaixo registra a primeira visita presencial na Cafuringa, experiência realizada em 21/09/2026 com objetivo de conhecer o lugar, o próprio Jefferson Sooma e discutir os requisitos do projeto.

<video width="100%" controls>
    <source src="../../img/aup-elaboracao/visitacao.mp4" type="video/mp4">
</video>