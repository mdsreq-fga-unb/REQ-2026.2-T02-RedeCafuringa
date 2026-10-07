# Evidências da Iteração 5

## Elicitação e Descoberta 

??? info "Refinamento Iterativo de Requisitos"  
        
---

## Declaração de Requisitos    

### Requisito de Negócio - Catálogos e Artefatos Técnicos
O catálogo de metas é adequado para consolidar e detalhar os objetivos de negócio que orientam a construção do produto. Ele permite relacionar as metas estratégicas às funcionalidades e aos resultados esperados, mantendo o foco no valor que o sistema deve entregar.
??? info "Catálogo de Metas"
    - ![Catálogo de Metas](../../img/aup-construcao/catalogo_metas.png)

### Requisito de Usuário - Oriantadas a Valor
Os checklists estruturados permitem organizar e verificar as necessidades e condições esperadas pelos usuários de forma sistemática, auxiliando a equipe a garantir que os principais aspectos das interações e expectativas dos usuários sejam contemplados durante a construção.
??? info "Checklist Estruturados - Requisitos Funcionais"
    | ✓ | Código | Necessidade/condição a verificar                                      | Critério de verificação                                                                                                |
    | - | ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
    | ☐ | RF01   | O consumidor consegue criar seu perfil de forma simples?              | O cadastro deve apresentar somente as informações necessárias e permitir sua conclusão sem complexidade desnecessária. |
    | ☐ | RF02   | O produtor consegue criar seu perfil?                                 | O cadastro deve contemplar produtores como empresas e MEIs.                                                            |
    | ☐ | RF03   | O administrador consegue possuir um perfil próprio?                   | Deve ser possível cadastrar usuário com perfil de administrador.                                                       |
    | ☐ | RF04   | O administrador consegue consultar os usuários cadastrados?           | A consulta deve estar disponível exclusivamente para usuários com perfil admin.                                        |
    | ☐ | RF09   | O usuário consegue acessar sua conta?                                 | O usuário deve conseguir autenticar-se utilizando suas credenciais.                                                    |
    | ☐ | RF10   | O usuário consegue recuperar o acesso à conta?                        | A recuperação deve ser realizada por meio do e-mail cadastrado.                                                        |
    | ☐ | RF12   | O produtor consegue registrar sua trajetória?                         | Deve ser possível registrar a trajetória do produtor de forma simplificada.                                            |
    | ☐ | RF14   | O consumidor consegue consultar o perfil de um produtor?              | O perfil deve apresentar as informações pertinentes sem disponibilizar o CPF do produtor.                              |
    | ☐ | RF17   | O produtor consegue cadastrar seus produtos?                          | Deve ser possível inserir e disponibilizar produtos no sistema.                                                        |
    | ☐ | RF21   | O consumidor consegue consultar o catálogo?                           | Deve ser possível visualizar os produtos disponíveis no catálogo.                                                      |
    | ☐ | RF22   | O consumidor consegue consultar informações detalhadas de um produto? | O sistema deve apresentar os detalhes associados ao produto selecionado.                                               |
    | ☐ | RF23   | O produtor consegue cadastrar uma experiência?                        | Deve ser possível disponibilizar experiências para consulta pelos usuários.                                            |
    | ☐ | RF25   | O usuário consegue consultar uma experiência?                         | Deve ser possível visualizar as informações da experiência disponibilizada.                                            |
    | ☐ | RF36   | O usuário consegue encontrar ofertas de seu interesse?                | A busca deve estar disponível por meio da funcionalidade de pesquisa identificada pela lupa.                           |
    | ☐ | RF39   | O usuário consegue entrar em contato diretamente?                     | Deve existir uma forma de contato direto, podendo utilizar o WhatsApp em substituição ao chat interno.                 |
    | ☐ | RF44   | O usuário consegue solicitar uma pré-reserva?                         | Deve ser possível encaminhar uma solicitação de pré-reserva para uma experiência.                                      |
    | ☐ | RF45   | O usuário consegue consultar sua pré-reserva?                         | Deve ser possível visualizar as informações e o estado da solicitação realizada.                                       |
    | ☐ | RF46   | O usuário consegue cancelar uma solicitação?                          | Deve ser possível cancelar uma solicitação de pré-reserva.                                                             |
    | ☐ | RF47   | O responsável pela experiência consegue responder à pré-reserva?      | Deve ser possível responder às solicitações de pré-reserva recebidas.                                                  |
    | ☐ | RF48   | O usuário é informado sobre alterações na pré-reserva?                | O sistema deve notificar o usuário quando houver alteração na solicitação. 
    
??? info "Checklist Estruturados - Requisitos Não Funcionais"
    | ✓ | Código | Necessidade/condição a verificar                                      | Critério de verificação                                                                                            |
    | - | ------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
    | ☐ | RNF03  | O usuário consegue se recuperar de situações de erro?                 | O sistema deve apresentar mecanismos adequados de prevenção e recuperação de erros.                                |
    | ☐ | RNF04  | A solução pode ser utilizada de forma acessível?                      | A interface deve contemplar os requisitos de acessibilidade definidos para o MVP.                                  |
    | ☐ | RNF05  | A interface se adapta aos diferentes dispositivos?                    | A aplicação deve apresentar comportamento responsivo.                                                              |
    | ☐ | RNF06  | O usuário consegue utilizar a solução em conectividade limitada?      | O sistema deve manter desempenho adequado nas condições de conectividade consideradas no MVP.                      |
    | ☐ | RNF08  | O usuário acessa somente as funcionalidades permitidas ao seu perfil? | O acesso deve respeitar as permissões associadas a cada perfil.                                                    |
    | ☐ | RNF10  | A comunicação do usuário com o sistema é protegida?                   | A comunicação deve utilizar mecanismos de proteção adequados.                                                      |
    | ☐ | RNF11  | Os dados pessoais do usuário são protegidos?                          | O tratamento e armazenamento dos dados pessoais devem observar os mecanismos de proteção definidos para o sistema. |
    | ☐ | RNF13  | A solução pode ser mantida com baixo custo operacional?               | A implementação deve considerar as restrições de custo operacional estabelecidas para o MVP.                       |
    | ☐ | RNF01  | O usuário consegue navegar pela solução com eficiência?               | As funcionalidades devem estar organizadas de forma a facilitar a localização e execução das tarefas.              |
    | ☐ | RNF02  | O usuário consegue executar suas tarefas com eficiência?              | As operações previstas devem apresentar desempenho adequado à execução das tarefas.                                |
    | ☐ | RNF07  | O sistema mantém comportamento adequado diante da perda de conexão?   | A solução deve apresentar comportamento resiliente diante de interrupções de conectividade.                        |

### Requisito de Produto - Declarações Estruturadas
Os requisitos de produto do MVP são detalhados por meio da estrutura Given/When/Then (Dado/Quando/Então). A técnica permite representar, de maneira padronizada, o contexto inicial, a ação realizada pelo usuário e o comportamento esperado do sistema. Dessa forma, as declarações estruturadas apoiam a implementação e a posterior verificação dos comportamentos previstos para cada requisito.

??? info "Given/When/Then"
    #### RF01 — Cadastrar perfil de consumidor

    - **Given:** Dado que o usuário está na tela de cadastro de consumidor;
    - **When:** Quando preencher os dados obrigatórios e confirmar o cadastro;
    - **Then:** Então o sistema deve criar o perfil de consumidor e informar que o cadastro foi realizado com sucesso.

    #### RF02 — Cadastrar perfil de produtor

    - **Given:** Dado que o usuário está na tela de cadastro de produtor;
    - **When:** Quando preencher as informações necessárias e indicar se o cadastro corresponde a produtor, empresa ou MEI;
    - **Then:** Então o sistema deve criar o perfil do produtor e disponibilizar seu cadastro na plataforma.

    #### RF03 — Cadastrar usuário administrador

    - **Given:** Dado que existe um usuário autorizado a realizar a criação de administradores;
    - **When:** Quando os dados do novo administrador forem preenchidos e o cadastro for confirmado;
    - **Then:** Então o sistema deve criar o perfil administrador com as permissões administrativas correspondentes.

    #### RF04 — Consultar usuários cadastrados

    - **Given:** Dado que o usuário está autenticado com perfil de administrador;
    - **When:** Quando acessar a área de usuários cadastrados;
    - **Then:** Então o sistema deve apresentar a lista de consumidores e produtores cadastrados.

    #### RF09 — Autenticar usuário

    - **Given:** Dado que o usuário possui uma conta cadastrada;
    - **When:** Quando informar suas credenciais válidas e solicitar o acesso;
    - **Then:** Então o sistema deve autenticar o usuário e direcioná-lo para a área correspondente ao seu perfil.

    #### RF10 — Recuperar acesso à conta

    - **Given:** Dado que o usuário possui uma conta cadastrada e não consegue acessar suas credenciais;
    - **When:** Quando solicitar a recuperação de acesso e informar o e-mail cadastrado;
    - **Then:** Então o sistema deve disponibilizar as instruções necessárias para recuperação da conta.

    #### RF12 — Registrar trajetória do produtor

    - **Given:** Dado que o produtor está autenticado e acessando seu perfil;
    - **When:** Quando preencher as informações sobre sua história, experiência e atividades desenvolvidas;
    - **Then:** Então o sistema deve registrar essas informações no perfil do produtor.

    #### RF14 — Consultar perfil de produtor

    - **Given:** Dado que o usuário está consultando um produtor cadastrado;
    - **When:** Quando acessar o perfil do produtor;
    - **Then:** Então o sistema deve apresentar as informações públicas autorizadas do produtor, sem expor dados pessoais que não devam ser divulgados.

    #### RF17 — Cadastrar produto

    - **Given:** Dado que o produtor está autenticado e possui acesso ao cadastro de produtos;
    - **When:** Quando preencher as informações do produto e confirmar o cadastro;
    - **Then:** Então o sistema deve registrar o produto e vinculá-lo ao respectivo produtor.

    #### RF21 — Consultar catálogo de produtos

    - **Given:** Dado que existem produtos cadastrados na plataforma;
    - **When:** Quando o usuário acessar o catálogo de produtos;
    - **Then:** Então o sistema deve apresentar os produtos disponibilizados pelos produtores.

    #### RF22 — Consultar detalhes do produto

    - **Given:** Dado que o usuário está visualizando o catálogo de produtos;
    - **When:** Quando selecionar um produto;
    - **Then:** Então o sistema deve apresentar seus detalhes, incluindo informações sobre o produto, produtor responsável e disponibilidade.

    #### RF23 — Cadastrar experiência

    - **Given:** Dado que o produtor ou responsável autorizado está autenticado;
    - **When:** Quando preencher as informações de uma experiência e confirmar o cadastro;
    - **Then:** Então o sistema deve registrar a experiência e disponibilizá-la para consulta na plataforma.

    #### RF25 — Consultar experiência

    - **Given:** Dado que existem experiências cadastradas na plataforma;
    - **When:** Quando o usuário selecionar uma experiência;
    - **Then:** Então o sistema deve apresentar as informações disponíveis sobre a experiência e suas atividades.

    #### RF36 — Buscar ofertas

    - **Given:** Dado que existem produtores, produtos ou experiências cadastrados na plataforma;
    - **When:** Quando o usuário utilizar a funcionalidade de busca e informar um termo;
    - **Then:** Então o sistema deve apresentar as ofertas relacionadas ao termo pesquisado.

    #### RF39 — Disponibilizar contato direto

    - **Given:** Dado que o usuário está visualizando uma oferta de um produtor;
    - **When:** Quando selecionar a opção de contato direto;
    - **Then:** Então o sistema deve disponibilizar um meio de comunicação entre o usuário e o produtor ou responsável pela oferta.

    #### RF44 — Solicitar pré-reserva de experiência

    - **Given:** Dado que o visitante está visualizando uma experiência disponível para pré-reserva;
    - **When:** Quando selecionar a opção de pré-reserva e informar os dados necessários;
    - **Then:** Então o sistema deve registrar a solicitação de pré-reserva e informar que ela foi enviada ao responsável.

    #### RF45 — Consultar pré-reserva

    - **Given:** Dado que existe uma solicitação de pré-reserva vinculada ao visitante ou ao responsável pela experiência;
    - **When:** Quando acessar a área de pré-reservas;
    - **Then:** Então o sistema deve apresentar as solicitações correspondentes e seus respectivos estados.

    #### RF46 — Cancelar solicitação de pré-reserva

    - **Given:** Dado que o visitante possui uma solicitação de pré-reserva com status pendente;
    - **When:** Quando selecionar a opção de cancelamento e confirmar a ação;
    - **Then:** Então o sistema deve cancelar a solicitação e atualizar seu estado.

    #### RF47 — Responder pré-reserva de experiência

    - **Given:** Dado que o responsável possui uma solicitação de pré-reserva pendente;
    - **When:** Quando selecionar a solicitação e optar por aceitá-la ou rejeitá-la;
    - **Then:** Então o sistema deve atualizar o estado da solicitação conforme a resposta registrada.

    #### RF48 — Notificar alteração de pré-reserva

    - **Given:** Dado que existe uma solicitação de pré-reserva vinculada a um visitante e a um responsável;
    - **When:** Quando ocorrer uma alteração relevante no estado da solicitação;
    - **Then:** Então o sistema deve notificar os envolvidos sobre a alteração.


---

## Vídeos Comprobatórios

