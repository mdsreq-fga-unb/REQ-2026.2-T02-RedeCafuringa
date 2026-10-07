# Evidências da Iteração 3

## Elicitação e Descoberta 

??? info "Valor de Negócio e Esforço Técnico - Requisitos Funcionais"  
    A escala de 1 a 4 apresentada em ferramentas de priorização e estimativa de requisitos costuma representar o grau de dificuldade, tempo de desenvolvimento ou incerteza técnica associada à entrega. Geralmente, os valores indicam:

    **1 - Muito Baixo:** tarefas simples que exigem até 2 horas de trabalho, soluções conhecidas e domínio pleno por parte da equipa.

    **2 - Baixo:** trabalho moderado (2 a 6 horas), que exige alguma investigação ou integração, mas onde a equipa já possui conhecimento suficiente

    **3 - Alto:** tarefas exigentes (6 a 12 horas), com várias incertezas técnicas e a necessidade de desenvolver novas competências.

    **4 - Muito Alto:** grande desafio (mais de 12 horas), caracterizado por elevada incerteza técnica, tecnologias não dominadas e a atual ausência de conhecimentos ou recursos para a sua execução.

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

??? info "Valor de Negócio e Esforço Técnico - Requisitos Não Funcionais" 

    O cálculo do Esforço Técnico final na tabela foi feito a partir da média aritmética simples das três variáveis avaliadas (Esforço, Complexidade e Capacidade). O resultado fracionado é então arredondado para o número inteiro mais próximo para definir a pontuação final do requisito.

    | Código | Requisito | Esforço | Complexidade | Capacidade | Esforço Técnico |
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

## Declaração de Requisitos

??? info "Priorização MoScoW"
    Reunião de negociação para classificar os requisitos do sistema em quatro níveis de criticidade (Must Have, Should Have, Could Have, Won't Have), visando alinhar as expectativas e definir o escopo do Produto Mínimo Viável.

    - ![MoScoW](../../img/aup-elaboracao/moscow_final.png)

### Requisito de Negócio - Narrativas Descritivas
O storyboard organiza a narrativa em passos sequenciais, ilustrando como o fluxo de valor do negócio é realizado e como as restrições ou metas estratégicas são atendidas, sem ainda detalhar telas ou cliques específicos de sistema.
??? info "Storyboard"
    - ![Storyboard](../../img/aup-elaboracao/storyboard.png)

### Requisito de Usuário - Oriantadas a Valor
As histórias de usuário são interessantes para o nível de Requisito de Usuário porque focam no "O Quê" (necessidades, expectativas e serviços esperados na interação), conectando diretamente a tecnologia ao valor percebido pelas pessoas.
??? info "Histórias de Usuário"
    - ![Histórias de Usuário](../../img/aup-elaboracao/historias_usuario.jpeg)

### Requisito de Produto - Declarações Estruturadas
Os critérios de aceitação são a técnica ideal para o nível de Requisito de Produto porque têm a função principal de transformar intenções ou necessidades humanas num conjunto de condições objetivas, lógicas e estritamente verificáveis.
??? info "Critérios de Aceitação"
    | História de Usuário | Critérios de Aceitação |
    |---|---|
    | **US01** | - Permitir o cadastro de consumidor com os dados obrigatórios.<br>- Validar os campos preenchidos antes de concluir o cadastro.<br>- Impedir o cadastro de e-mail já utilizado.<br>- Exibir confirmação após o cadastro realizado com sucesso. |
    | **US02** | - Permitir o cadastro de produtor com seus dados obrigatórios.<br>- Permitir informar os dados da propriedade vinculada ao produtor.<br>- Validar os campos obrigatórios.<br>- Exibir confirmação após o cadastro. |
    | **US03** | - Permitir o cadastro de usuário administrativo.<br>- Restringir o acesso administrativo a usuários autorizados.<br>- Validar os dados obrigatórios do administrador.<br>- Confirmar a criação do usuário. |
    | **US04** | - Permitir o cadastro de perfil coletivo, como associação ou ecovila.<br>- Permitir vincular propriedades e informações do grupo.<br>- Permitir informar os dados de identificação do coletivo.<br>- Exibir o perfil cadastrado corretamente. |
    | **US05** | - Permitir que usuários cadastrados realizem login.<br>- Validar e-mail/usuário e senha.<br>- Informar quando as credenciais forem inválidas.<br>- Redirecionar o usuário para sua área correspondente após autenticação. |
    | **US06** | - Permitir solicitar a recuperação de acesso.<br>- Validar a existência do usuário informado.<br>- Disponibilizar mecanismo para redefinição da senha.<br>- Permitir acesso novamente após a redefinição. |
    | **US07** | - Permitir ao produtor cadastrar sua propriedade/negócio.<br>- Permitir informar nome, descrição, localização e demais dados necessários.<br>- Permitir editar as informações posteriormente.<br>- Exibir os dados cadastrados no perfil público. |
    | **US08** | - Permitir consultar o perfil de um produtor.<br>- Exibir informações de identificação, localização e descrição.<br>- Exibir a situação de certificação informada.<br>- Permitir acessar os produtos e/ou experiências vinculados ao produtor. |
    | **US09** | - Permitir ao produtor cadastrar produtos.<br>- Permitir informar nome, descrição, unidade, preço, disponibilidade e demais dados obrigatórios.<br>- Permitir adicionar imagem do produto.<br>- Validar os campos obrigatórios antes de salvar. |
    | **US10** | - Permitir consultar os produtos cadastrados por um produtor.<br>- Exibir informações relevantes do produto, incluindo disponibilidade e preço.<br>- Permitir visualizar diferentes produtos do mesmo produtor.<br>- Não exibir produtos indisponíveis como disponíveis. |
    | **US11** | - Permitir informar e visualizar a situação de certificação do produtor.<br>- Exibir de forma clara se o produtor é certificado, está em processo ou não possui certificação formal.<br>- Permitir informar o mecanismo de certificação quando aplicável.<br>- Exibir o número de cadastro quando houver. |
    | **US12** | - Permitir cadastrar experiências/atividades oferecidas pelo produtor ou propriedade.<br>- Permitir informar descrição, localização, condições e disponibilidade.<br>- Permitir editar ou remover uma experiência cadastrada.<br>- Exibir a experiência no perfil da propriedade. |
    | **US13** | - Permitir cadastrar uma propriedade com sua localização geográfica.<br>- Permitir informar descrição e características da propriedade.<br>- Permitir associar produtos, atrativos e experiências à propriedade.<br>- Exibir a propriedade corretamente no sistema. |
    | **US14** | - Permitir realizar busca por produtores, produtos ou experiências.<br>- Permitir utilizar filtros disponíveis na plataforma.<br>- Retornar resultados compatíveis com os critérios informados.<br>- Informar quando não houver resultados. |
    | **US15** | - Permitir ao consumidor visualizar os canais de contato disponibilizados pelo produtor após a conexão.<br>- Exibir os dados de contato somente conforme as regras de privacidade definidas.<br>- Permitir utilizar o canal de contato informado.<br>- Não cobrar comissão ou taxa pela conexão. |
    | **US16** | - Permitir ao consumidor solicitar uma pré-reserva de produto, visita ou experiência.<br>- Exigir o preenchimento das informações necessárias para a solicitação.<br>- Registrar a solicitação com data e status.<br>- Informar ao consumidor que a solicitação foi enviada. |
    | **US17** | - Permitir ao produtor visualizar as solicitações de pré-reserva recebidas.<br>- Exibir informações necessárias para análise da solicitação.<br>- Permitir aceitar ou recusar a solicitação.<br>- Atualizar o status da solicitação após a decisão. |
    | **US18** | - Permitir ao produtor consultar e gerenciar suas pré-reservas.<br>- Exibir solicitações pendentes, aceitas e recusadas.<br>- Permitir identificar data, horário e tipo da solicitação.<br>- Manter o histórico das solicitações realizadas. |
    | **US19** | - Permitir o acompanhamento do status de uma pré-reserva.<br>- Informar ao consumidor quando a solicitação estiver pendente, aceita ou recusada.<br>- Atualizar o status após a resposta do produtor.<br>- Manter o consumidor informado sobre alterações relevantes. |
    | **US20** | - Permitir a conexão direta entre consumidor e produtor após a confirmação da solicitação.<br>- Liberar os dados de contato conforme as regras estabelecidas.<br>- Não inserir intermediários na comunicação entre as partes.<br>- Não cobrar taxas ou comissões pela conexão. |





---

## Análise e Consenso

??? info "Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)"
    
    Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.

    - ![Matriz de Quadrantes](../../img/aup-elaboracao/matriz_quadrantes.png)

---

## Vídeos Comprobatórios

O vídeo abaixo registra a primeira visita presencial na Cafuringa, experiência realizada em 21/09/2026 com objetivo de conhecer o lugar, o próprio Jefferson Sooma e discutir os requisitos do projeto.

<video width="100%" controls>
    <source src="../../img/aup-elaboracao/visitacao.mp4" type="video/mp4">
</video>