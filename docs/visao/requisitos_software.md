<span class="version-badge">Unidade 02</span>

Abaixo, são apresentados os requisitos levantados para o desenvolvimento da plataforma da Rede Cafuringa. Este documento está estruturado em duas seções principais: a primeira aborda os Requisitos Funcionais, detalhando as ações e funcionalidades que o sistema deve oferecer para atender às necessidades de produtores, consumidores e administradores (como cadastros, consultas e gestão de reservas). A segunda seção lista os Requisitos Não Funcionais, estabelecendo os critérios de qualidade, segurança, desempenho e usabilidade da aplicação.

## 7.1 Requisitos Funcionais

| **Código** | **Nome do requisito** | **Descrição** | **CP** | **OE principal** |
|---|---|---|---|---|
| **RF01** | Cadastrar perfil de consumidor | O sistema deve permitir o cadastro do perfil do consumidor contendo nome completo, CPF, e-mail e senha. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF02** | Cadastrar perfil de produtor | O sistema deve permitir o cadastro do perfil do produtor ou comunidade contendo nome da iniciativa, quando houver, nome do responsável, CPF, CNPJ, quando aplicável, localidade, categorias ofertadas, formas de pagamento, e-mail e senha. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF03** | Cadastrar usuário administrador | O sistema deve permitir o cadastro do perfil de administrador contendo e-mail e senha. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF04** | Consultar usuários cadastrados | O sistema deve permitir que o administrador consulte os usuários cadastrados e seus respectivos dados, exceto as senhas de acesso, incluindo consumidores, produtores e administradores. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF05** | Excluir usuário | O sistema deve permitir que o administrador exclua a conta de um usuário quando houver necessidade administrativa ou descumprimento das regras da plataforma. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF06** | Consultar conteúdos cadastrados | O sistema deve permitir que os usuários consultem os produtos, experiências e eventos cadastrados na plataforma. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto), [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF07** | Remover conteúdo inadequado | O sistema deve permitir que o administrador remova produtos, experiências ou eventos que violem as regras da plataforma. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto), [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF08** | Atualizar informações institucionais | O sistema deve permitir que o administrador atualize as informações institucionais disponibilizadas pela Rede Cafuringa na plataforma. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF09** | Autenticar usuário | O sistema deve permitir que usuários cadastrados acessem suas contas por meio do e-mail e da senha cadastrados. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE1](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF10** | Recuperar acesso à conta | O sistema deve permitir que o usuário recupere o acesso à sua conta em caso de esquecimento da senha. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE1](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF11** | Excluir própria conta | O sistema deve permitir que o usuário exclua sua própria conta. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE1](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF12** | Registrar trajetória do produtor | O sistema deve permitir que o produtor registre informações sobre sua trajetória, atividades desenvolvidas, telefone de contato, quando desejar disponibilizá-lo, e foto de perfil. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF13** | Atualizar perfil de produtor | O sistema deve permitir que o produtor atualize as informações do próprio perfil. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF14** | Consultar perfil de produtor | O sistema deve permitir a consulta pública do perfil do produtor ou iniciativa, incluindo nome, categorias ofertadas, trajetória, atividades desenvolvidas e telefone de contato, quando disponibilizado. Dados como CPF, CNPJ e e-mail devem permanecer privados. | [CP1](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF15** | Cadastrar produto | O sistema deve permitir que o produtor cadastre produtos e os vincule ao seu perfil ou à propriedade associada. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF16** | Atualizar produto | O sistema deve permitir que o produtor altere as informações de um produto cadastrado. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF17** | Excluir produto | O sistema deve permitir que o produtor exclua um produto cadastrado em seu catálogo. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF18** | Informar disponibilidade de produto | O sistema deve permitir que o produtor marque um produto como disponível ou indisponível e, quando aplicável, informe sua sazonalidade. Produtos indisponíveis não devem ser apresentados como ofertas disponíveis, mas devem permanecer cadastrados. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF19** | Consultar catálogo de produtos | O sistema deve permitir que os usuários consultem os produtos disponibilizados pelos produtores cadastrados. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF20** | Consultar detalhes do produto | O sistema deve permitir que os usuários visualizem informações detalhadas de um produto, incluindo descrição, produtor responsável e preço por unidade. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF21** | Cadastrar experiência | O sistema deve permitir que o produtor cadastre experiências, atividades e atrativos oferecidos por ele ou pela propriedade associada. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF22** | Atualizar experiência | O sistema deve permitir que o produtor altere as informações de uma experiência cadastrada. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF23** | Excluir experiência | O sistema deve permitir que o produtor exclua uma experiência cadastrada em seu catálogo. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF24** | Consultar catálogo de experiências | O sistema deve permitir que os usuários consultem as experiências disponibilizadas pelos produtores cadastrados. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF25** | Consultar detalhes da experiência | O sistema deve permitir que os usuários visualizem informações detalhadas de uma experiência, incluindo descrição, produtor ou anfitrião responsável e valor por pessoa. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF26** | Cadastrar evento | O sistema deve permitir que o produtor cadastre eventos oferecidos por ele ou pela propriedade associada. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF27** | Atualizar evento | O sistema deve permitir que o produtor altere as informações de um evento cadastrado. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF28** | Excluir evento | O sistema deve permitir que o produtor exclua um evento cadastrado em seu catálogo. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF29** | Consultar catálogo de eventos | O sistema deve permitir que os usuários consultem os eventos disponibilizados pelos produtores cadastrados. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF30** | Consultar detalhes do evento | O sistema deve permitir que os usuários visualizem informações detalhadas de um evento, incluindo descrição, produtor ou responsável e valor por pessoa, quando aplicável. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF31** | Auxiliar cadastro de ofertas | O sistema deve fornecer um agente de inteligência artificial para auxiliar o produtor no preenchimento das informações necessárias ao cadastro de produtos, experiências e eventos. | [CP2](../visao/solucao.md#23-caracteristicas-do-produto), [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE1](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF32** | Apresentar informações da Cafuringa | O sistema deve disponibilizar informações sobre a história, as características e os principais pontos de interesse da região da Cafuringa. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF33** | Consultar guia de boas práticas | O sistema deve disponibilizar aos usuários um guia com orientações e boas práticas relacionadas à utilização da plataforma e às atividades oferecidas na região. | [CP3](../visao/solucao.md#23-caracteristicas-do-produto) | [OE1](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF34** | Notificar novos eventos | O sistema deve informar os usuários, por meio de e-mail, sobre novos eventos cadastrados na plataforma. | [CP4](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF35** | Visualizar ofertas no mapa | O sistema deve apresentar em mapa os produtores, propriedades, produtos, experiências e eventos que possuam localização cadastrada. | [CP4](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF36** | Buscar ofertas | O sistema deve permitir que os usuários pesquisem por produtores, produtos, experiências e eventos cadastrados na plataforma. | [CP4](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF37** | Filtrar ofertas | O sistema deve permitir que os usuários filtrem os resultados de produtos, experiências e eventos de acordo com os critérios disponibilizados pela plataforma. | [CP4](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF38** | Buscar ofertas por localização | O sistema deve permitir que os usuários encontrem produtores, propriedades, experiências e atrativos considerando uma localização ou região selecionada. | [CP4](../visao/solucao.md#23-caracteristicas-do-produto) | [OE2](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF39** | Disponibilizar contato direto | O sistema deve disponibilizar, nos perfis e detalhes das ofertas, um botão para iniciar uma conversa externa pelo WhatsApp com o produtor ou responsável, quando este tiver optado por divulgar seu contato. Apenas usuários autenticados poderão utilizar o recurso de contato. | [CP5](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF40** | Enviar feedback | O sistema deve permitir que usuários autenticados enviem feedback relacionado a produtos, experiências ou eventos, conforme as regras definidas pela plataforma. | [CP5](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF41** | Visualizar feedback | O sistema deve permitir que usuários e produtores visualizem os feedbacks relacionados às ofertas com as quais estejam envolvidos. | [CP5](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF42** | Editar feedback | O sistema deve permitir que o usuário edite um feedback enviado anteriormente por ele. | [CP5](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF43** | Excluir feedback | O sistema deve permitir que o usuário exclua um feedback enviado anteriormente por ele. | [CP5](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF44** | Solicitar pré-reserva de experiência | O sistema deve permitir que um consumidor autenticado solicite uma pré-reserva de experiência informando a data, o horário, a quantidade de participantes e a forma de pagamento. A solicitação deve iniciar com o status **Pendente** e não deve confirmar automaticamente a reserva. | [CP6](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF45** | Consultar pré-reserva | O sistema deve permitir que o solicitante e o produtor responsável consultem os dados e o estado da solicitação de pré-reserva, incluindo os estados **Pendente, Aceita e Recusada**, além da identificação de eventual cancelamento realizado pelo solicitante ou pelo responsável. | [CP6](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF46** | Cancelar pré-reserva | O sistema deve permitir que o solicitante cancele uma solicitação de pré-reserva pendente. Após o envio, a data, o horário e a quantidade de participantes não poderão ser editados; para solicitar outra data ou horário, o solicitante deverá cancelar a solicitação anterior e realizar uma nova solicitação. | [CP6](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF47** | Responder pré-reserva de experiência | O sistema deve permitir que o produtor aceite ou recuse uma solicitação de pré-reserva pendente. Em caso de recusa, o produtor poderá informar uma justificativa. Solicitações aceitas não poderão ser recusadas posteriormente pela plataforma, e solicitações referentes a datas e horários já passados não poderão ser aceitas. | [CP6](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |
| **RF48** | Notificar alteração de pré-reserva | O sistema deve notificar, por e-mail, o solicitante e o produtor responsável sobre alterações no estado da pré-reserva, incluindo aceitação, recusa ou cancelamento. A solicitação não deve expirar automaticamente. | [CP6](../visao/solucao.md#23-caracteristicas-do-produto) | [OE3](../visao/solucao.md#22-objetivos-especificos-oe-do-produto) |

---

## 7.2 Requisitos Não Funcionais

Os requisitos não funcionais definem propriedades de qualidade, restrições e condições que devem ser atendidas pela solução. Para sua classificação, são utilizados os modelos URPS+ e Sommerville.

### RNF01 — Eficiência de Navegação

**Descrição:** A aplicação deve possuir uma hierarquia de navegação rasa, permitindo acesso rápido aos principais catálogos e informações por produtores, consumidores e visitantes.

**Classificação:** URPS+ — Usabilidade (Eficiência) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Limite de interações sistêmicas necessárias para que o usuário alcance seu objetivo.

**Critério verificável:** O fluxo para consultar os detalhes de um produtor, localizar uma experiência ou visualizar um produto deve ser concluído em, no máximo, 5 cliques ou toques a partir da tela inicial.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF02 — Tempo de Execução de Tarefas

**Descrição:** A aplicação deve permitir que os usuários realizem as principais tarefas de busca e consulta em tempo compatível com uma utilização eficiente da plataforma.

**Classificação:** URPS+ — Usabilidade (Eficiência e Apreensibilidade) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tempo máximo aceitável para conclusão de uma tarefa de busca e consulta.

**Critério verificável:** Em teste de usabilidade, um usuário em seu primeiro acesso deve ser capaz de buscar um produto ou experiência específica e acessar sua respectiva página de detalhes em até 60 segundos de navegação contínua.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF03 — Prevenção e Recuperação de Erros

**Descrição:** A interface deve prevenir erros de operação e fornecer orientações claras ao usuário quando forem realizadas ações inválidas durante os processos de busca, consulta ou preenchimento de informações.

**Classificação:** URPS+ — Usabilidade (Taxa de Erro) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Prevenção e recuperação de erros durante a interação do usuário com o sistema.

**Critério verificável:** Para 100% das entradas inválidas previstas nos principais formulários e fluxos de busca, o sistema deve apresentar uma mensagem de erro ou orientação que identifique o problema e indique como corrigi-lo, sem perda dos dados já preenchidos.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF04 — Acessibilidade Digital

**Descrição:** As funcionalidades principais da aplicação devem ser acessíveis a usuários com diferentes necessidades e níveis de familiaridade com tecnologia.

**Classificação:** URPS+ — Usabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Acessibilidade da interface.

**Critério verificável:** Os principais fluxos da aplicação devem atender às recomendações aplicáveis da WCAG 2.1, nível AA, contemplando, quando aplicável, contraste adequado, identificação dos campos de formulário, textos alternativos para imagens relevantes, indicação de foco e navegação por teclado.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF05 — Responsividade da Interface

**Descrição:** A aplicação deve adaptar sua apresentação a diferentes tamanhos de tela, permitindo sua utilização em dispositivos móveis e computadores.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Adaptação da interface a diferentes dimensões de tela.

**Critério verificável:** As funcionalidades principais devem permanecer utilizáveis em telas com largura entre 360 px e 1920 px, sem sobreposição de componentes e sem necessidade de rolagem horizontal para utilização dos fluxos principais.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF06 — Desempenho em Conectividade Limitada

**Descrição:** A plataforma deve manter condições adequadas de utilização em conexões móveis ou rurais caracterizadas por baixa velocidade ou alta latência.

**Classificação:** URPS+ — Desempenho / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tempo de carregamento em condições de conectividade limitada.

**Critério verificável:** As principais páginas públicas da aplicação devem apresentar seu conteúdo principal em até 5 segundos em pelo menos 90% das medições, considerando conexão limitada a aproximadamente 1,5 Mbps e latência de até 300 ms.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF07 — Resiliência à Perda de Conexão

**Descrição:** O sistema deve minimizar a perda de informações durante interrupções temporárias ou instabilidade da conexão com a internet.

**Classificação:** URPS+ — Confiabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tolerância a falhas temporárias de comunicação.

**Critério verificável:** Caso ocorra perda de conexão durante o preenchimento de um formulário, os dados já preenchidos pelo usuário não devem ser apagados automaticamente antes de uma nova tentativa de envio.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF08 — Controle de Acesso por Perfil

**Descrição:** O sistema deve controlar o acesso às funcionalidades e informações conforme o perfil do usuário.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Autorização de acesso às funcionalidades do sistema.

**Critério verificável:** Funcionalidades exclusivas de produtores não devem poder ser executadas por contas classificadas exclusivamente como consumidores ou visitantes, inclusive por meio de acesso direto às respectivas rotas ou endpoints.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF09 — Privacidade do Feedback

**Descrição:** Os feedbacks enviados aos fornecedores devem permanecer privados, não sendo apresentados publicamente como avaliações da plataforma.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Confidencialidade das informações fornecidas pelos usuários.

**Critério verificável:** O feedback deve ser acessível somente ao usuário que o enviou, ao fornecedor relacionado e aos administradores autorizados da plataforma. Usuários não relacionados ao feedback não devem conseguir visualizá-lo pela interface nem por requisição direta ao serviço responsável por seu armazenamento ou consulta.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF10 — Proteção da Comunicação

**Descrição:** A comunicação entre os dispositivos dos usuários e os serviços da plataforma deve ocorrer de maneira segura.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Transmissão segura dos dados.

**Critério verificável:** Em ambiente de produção, todas as comunicações da aplicação devem utilizar HTTPS, e requisições realizadas por HTTP devem ser redirecionadas para HTTPS.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF11 — Proteção de Dados Pessoais

**Descrição:** O tratamento dos dados pessoais de produtores, consumidores e visitantes deve respeitar os princípios aplicáveis da Lei Geral de Proteção de Dados Pessoais — LGPD.

**Classificação:** URPS+ — Restrição Legal / Sommerville — Requisito Externo.

**Propriedade ou restrição:** Privacidade e minimização dos dados pessoais coletados.

**Critério verificável:** Todo dado pessoal solicitado pelo sistema deve estar relacionado a uma finalidade funcional documentada. O sistema não deve disponibilizar publicamente CPF, CNPJ, e-mail ou outros dados pessoais classificados como privados nos perfis e resultados de busca.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF12 — Compatibilidade entre Navegadores

**Descrição:** A aplicação deve funcionar adequadamente nos principais navegadores utilizados em computadores e dispositivos móveis.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Compatibilidade entre navegadores e plataformas.

**Critério verificável:** Os principais fluxos da aplicação devem ser executados com sucesso nas versões estáveis mais recentes disponíveis para teste do Google Chrome, Mozilla Firefox e Microsoft Edge, além do Google Chrome em dispositivo Android ou emulação equivalente.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF13 — Baixo Custo Operacional

**Descrição:** A solução deve priorizar tecnologias e serviços que não imponham custos recorrentes significativos aos participantes e responsáveis pela Rede Cafuringa.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito Organizacional.

**Propriedade ou restrição:** Custo de implantação, utilização e manutenção da solução.

**Critério verificável:** As funcionalidades essenciais definidas para o MVP devem poder ser disponibilizadas sem cobrança obrigatória por usuário ou por transação e sem dependência de licença proprietária para sua execução.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF14 — Disponibilização como Aplicação Web Progressiva

**Descrição:** A plataforma deve utilizar recursos de **Progressive Web App (PWA)** quando compatíveis com o ambiente do usuário, permitindo acesso diretamente pelo navegador e instalação no dispositivo quando suportada.

**Classificação:** URPS+ — Portabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Portabilidade e forma de disponibilização da aplicação.

**Critério verificável:** A aplicação deve possuir manifesto web válido e os recursos necessários para ser reconhecida como instalável em navegadores compatíveis, sem exigir obrigatoriamente sua distribuição por lojas de aplicativos.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

### RNF15 — Proteção de Crianças e Adolescentes

**Descrição:** A aplicação deve adotar medidas de proteção à privacidade, segurança e integridade de crianças e adolescentes que possam acessar ou utilizar seus recursos, observando a legislação aplicável ao ambiente digital.

**Classificação:** URPS+ — Restrição Legal / Sommerville — Requisito Externo.

**Propriedade ou restrição:** Proteção de direitos, segurança de conteúdo e privacidade de crianças e adolescentes.

**Critério verificável:** Os fluxos de cadastro, acesso, interação e exposição de conteúdo devem impedir a disponibilização pública de dados pessoais de crianças e adolescentes e aplicar as medidas de proteção e aferição de idade exigíveis ao serviço, conforme a legislação vigente e regulamentação aplicável.

??? info "Visualizar Evidência"
    A evidência do requisito acima será anexada assim que a fase de construção for finalizada.

---

## 7.3 Matriz-Síntese de Rastreabilidade

A matriz, a seguir, representa a rastreabilidade entre os objetivos específicos (OE), as características do produto (CP), os requisitos funcionais (RFs) e os requisitos não funcionais (RNFs).

| **Contribuição principal** | **Contribuição secundária** | **CP** | **RFs relacionados** | **RNFs relacionados** |
| :---: | :---: | :---: | :--- | :--- |
| OE2 | OE1 | **CP1** | RF01, RF02, RF03, RF04, RF05, RF09, RF10, RF11, RF12, RF13, RF14 | RNF03, RNF04, RNF05, RNF07, RNF08, RNF10, RNF11, RNF12, RNF13, RNF14, RNF15 |
| OE2 | OE1, OE3 | **CP2** | RF06, RF07, RF15, RF16, RF17, RF18, RF19, RF20, RF31 | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF08, RNF11, RNF12, RNF13, RNF14 |
| OE2 | OE1, OE3 | **CP3** | RF06, RF07, RF08, RF21, RF22, RF23, RF24, RF25, RF26, RF27, RF28, RF29, RF30, RF31, RF32, RF33 | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF08, RNF11, RNF12, RNF13, RNF14, RNF15 |
| OE2 | OE1, OE3 | **CP4** | RF34, RF35, RF36, RF37, RF38 | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF12, RNF13, RNF14 |
| OE3 | OE1 | **CP5** | RF39, RF40, RF41, RF42, RF43 | RNF03, RNF04, RNF05, RNF07, RNF08, RNF09, RNF10, RNF11, RNF12, RNF13, RNF14, RNF15 |
| OE3 | OE1 | **CP6** | RF44, RF45, RF46, RF47, RF48 | RNF03, RNF04, RNF05, RNF07, RNF08, RNF10, RNF11, RNF12, RNF13, RNF14, RNF15 |

---

## 7.4 Lista de Regras de Negócio

As regras de negócio consolidam restrições, condições e políticas do domínio que orientam a execução dos requisitos e dos casos de uso.

| **ID** | **REGRA DE NEGÓCIO** |
|---|---|
| **RN01** | **Perfis e permissões.** A plataforma possui os perfis consumidor, produtor e administrador, e cada perfil deve acessar somente as funcionalidades compatíveis com suas permissões. |
| **RN02** | **Dados de cadastro.** Os dados solicitados no cadastro devem corresponder ao tipo de perfil. Consumidores devem fornecer seus dados de identificação e contato, enquanto produtores devem fornecer as informações necessárias à sua identificação, apresentação e oferta na plataforma. |
| **RN03** | **Gestão administrativa.** Consultas e intervenções administrativas sobre usuários, conteúdos e informações institucionais são de responsabilidade exclusiva dos administradores. |
| **RN04** | **Exclusão administrativa.** A exclusão administrativa de usuários ou a remoção de conteúdos deve ocorrer somente quando houver necessidade administrativa ou descumprimento das regras da plataforma. |
| **RN05** | **Autenticação e recuperação de acesso.** O acesso às contas deve utilizar e-mail e senha. O CPF ou CNPJ não constitui credencial de acesso. A recuperação da conta deve verificar a titularidade antes de permitir a redefinição das credenciais. |
| **RN06** | **Exclusão pelo titular.** A exclusão de uma conta deve ser solicitada pelo próprio titular, não podendo ser realizada por outro usuário por meio das funcionalidades destinadas ao usuário comum. |
| **RN07** | **Informações públicas do produtor.** O perfil público deve apresentar somente informações destinadas à divulgação, como nome ou nome da iniciativa, categoria ofertada, trajetória, atividades desenvolvidas e contato quando autorizado. Dados cadastrais privados não devem ser exibidos publicamente. |
| **RN08** | **Proteção de dados de menores.** O cadastro e o tratamento de dados de crianças e adolescentes devem observar as medidas de proteção, privacidade e consentimento aplicáveis, conforme a legislação vigente e as regras definidas para a plataforma. |
| **RN09** | **Responsabilidade pelas ofertas.** Produtos, experiências, atividades e eventos devem estar vinculados a um produtor, propriedade ou responsável identificado, que será responsável pela manutenção das respectivas informações. |
| **RN10** | **Disponibilidade das ofertas.** O responsável pode disponibilizar ou retirar produtos, experiências e eventos da oferta pública sem necessariamente excluir seus registros. Produtos podem possuir informações de sazonalidade quando aplicável. |
| **RN11** | **Informações mínimas das ofertas.** As páginas de detalhes devem apresentar as informações necessárias para que o usuário compreenda a oferta, incluindo descrição, responsável e informações de valor, localização ou período quando aplicáveis ao tipo de oferta. |
| **RN12** | **Assistência por inteligência artificial.** O agente de IA pode auxiliar o produtor no preenchimento das informações de atividades e experiências, mas a revisão e a confirmação das informações antes da publicação permanecem sob responsabilidade do produtor. |
| **RN13** | **Informações institucionais e regionais.** As informações institucionais da Rede Cafuringa e os conteúdos sobre a região devem ser mantidos por usuários autorizados e apresentar informações relacionadas à história, características e pontos de interesse da Cafuringa. |
| **RN14** | **Boas práticas.** As orientações disponibilizadas pela plataforma devem contemplar boas práticas relacionadas à utilização do sistema e às atividades oferecidas na região. |
| **RN15** | **Busca e descoberta.** A busca e os mecanismos de descoberta devem considerar os tipos de ofertas cadastrados na plataforma e permitir seu refinamento conforme os critérios disponibilizados pelo sistema. |
| **RN16** | **Localização.** A representação no mapa e os recursos de busca por proximidade dependem da existência de uma localização cadastrada para a respectiva oferta, produtor ou propriedade. |
| **RN17** | **Contato direto.** O contato com o produtor ou responsável deve ocorrer externamente à plataforma, por meio do WhatsApp, somente quando houver autorização explícita para divulgação do contato. Apenas usuários autenticados podem iniciar esse contato, e seu conteúdo não é armazenado pela plataforma. |
| **RN18** | **Feedback privado.** O feedback deve ser direcionado ao fornecedor responsável pela oferta e permanecer privado, não sendo apresentado publicamente como avaliação. Somente os usuários envolvidos e administradores autorizados podem consultá-lo, e apenas seu autor pode editá-lo ou excluí-lo. |
| **RN19** | **Pré-reserva.** A solicitação de pré-reserva deve iniciar como pendente e não representa confirmação automática da experiência. A confirmação depende da aceitação do responsável, e as solicitações devem estar vinculadas às experiências oferecidas na plataforma. |
| **RN20** | **Alteração e cancelamento de pré-reserva.** O solicitante não pode alterar os dados de uma solicitação após seu envio. Solicitações pendentes podem ser canceladas pelo solicitante, enquanto solicitações aceitas podem ser canceladas pelo responsável conforme as condições estabelecidas pela plataforma. |
| **RN21** | **Estados da pré-reserva.** As solicitações devem possuir estados definidos de acordo com seu ciclo de vida, não sendo permitido retornar uma solicitação recusada ou cancelada ao estado pendente. Solicitações referentes a datas e horários passados não podem ser aceitas. |
| **RN22** | **Comunicação de pré-reservas.** Aceitações, recusas e cancelamentos devem ser comunicados por e-mail aos envolvidos. A falha no envio da notificação não deve desfazer a alteração de estado registrada na plataforma. |
