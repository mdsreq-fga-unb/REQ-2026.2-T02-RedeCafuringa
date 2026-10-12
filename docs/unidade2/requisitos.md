<span class="version-badge">Unidade 02</span>

Abaixo, são apresentados os requisitos levantados para o desenvolvimento da plataforma da Rede Cafuringa. Este documento está estruturado em duas seções principais: a primeira aborda os Requisitos Funcionais, detalhando as ações e funcionalidades que o sistema deve oferecer para atender às necessidades de produtores, consumidores e administradores (como cadastros, consultas e gestão de reservas). A segunda seção lista os Requisitos Não Funcionais, estabelecendo os critérios de qualidade, segurança, desempenho e usabilidade da aplicação.

## Requisitos Funcionais 

| Código   | Nome                                     | Descrição                                                                                                                                                   | CP  |
| -------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **RF01** | **Cadastrar perfil de consumidor**       | O sistema deve permitir o cadastro do perfil do consumidor, contendo nome, cpf, telefone e email.                                                | CP1 |
| **RF02** | **Cadastrar perfil de produtor**         | O sistema deve permitir o cadastro do perfil do produtor, propriedade, associação ou comunidade, contendo nome, cpf/cnpj, telefone, email e endereço. | CP1 |
| **RF03** | **Cadastrar usuário admin**              | O sistema deve permitir o cadastro de um perfil administrador que tenha controle total do sistema.                 | CP1 |
| **RF04** | **Consultar usuários cadastrados**         |O sistema deve permitir que o administrador consulte os usuários cadastrados na plataforma, incluindo consumidores e produtores.                               | CP1 |
| **RF05** | **Desativar usuário**              | O sistema deve permitir que o administrador desative a conta de um usuário quando houver necessidade administrativa ou descumprimento das regras da plataforma.                 | CP1 |
| **RF06** | **Consultar conteúdos cadastrados**         |O sistema deve permitir que o administrador consulte os produtos, experiências e eventos cadastrados pelos produtores.                                 | CP1 |
| **RF07** | **Remover conteúdo inadequado**         | O sistema deve permitir que o administrador remova produtos, experiências ou eventos que violem as regras da plataforma.                                            | CP1 |
| **RF08** | **Atualizar informações institucionais**         |O sistema deve permitir que o administrador atualize as informações institucionais disponibilizadas pela Rede Cafuringa na plataforma. | CP1 |
| **RF09** | **Autenticar usuário**         | O sistema deve permitir que usuários cadastrados acessem suas contas por meio de autenticação, via cpf e senha. | CP1 |
| **RF10** | **Recuperar acesso à conta**         | O sistema deve permitir que o usuário recupere o acesso à sua conta caso esqueça suas credenciais. | CP1 |
| **RF11** | **Excluir conta**                        | O sistema deve permitir que o usuário possa excluir sua própria conta.                                                                     | CP1 |
| **RF12** | **Registrar trajetória do produtor**     | O sistema deve permitir incluir no perfil do produtor informações sobre sua história, experiência e atividades desenvolvidas.                               | CP1 |
| **RF13** | **Atualizar perfil de produtor**         | O sistema deve permitir que o produtor atualize as informações do próprio perfil.                                                                              | CP1 |
| **RF14** | **Consultar perfil de produtor**         | O sistema deve permitir aos usuários visualizar nome, cpf/cnpj, telefone e email dos produtores e propriedades cadastrados.                                          | CP1 |
| **RF15** | **Informar certificação**   | O sistema deve permitir registrar a situação de certificação do produtor ou propriedade quando aplicável.                                                   | CP1 |
| **RF16** | **Preencher questionário do produtor**   | O sistema deve permitir que o produtor responda a um questionário com informações relacionadas ao seu perfil, produção e atividades.                        | CP1 |
| **RF17** | **Cadastrar produto**                    | O sistema deve permitir que produtos sejam cadastrados e vinculados ao respectivo produtor ou propriedade.                                                  | CP2 |
| **RF18** | **Atualizar produto**                    | O sistema deve permitir a alteração das informações de produtos previamente cadastrados.                                                                    | CP2 |
| **RF19** | **Excluir produto**                      | O sistema deve permitir que o produtor exclua um produto cadastrado em seu catálogo.                                                                                                | CP2 |
| **RF20** | **Informar disponibilidade de produto**  | O sistema deve permitir informar a disponibilidade e, quando aplicável, a sazonalidade dos produtos.                                                        | CP2 |
| **RF21** | **Consultar catálogo de produtos**       | O sistema deve permitir aos usuários consultar os produtos disponibilizados pelos produtores cadastrados.                                                   | CP2 |
| **RF22** | **Consultar detalhes do produto**       | O sistema deve permitir ao usuário visualizar informações detalhadas de um produto, incluindo descrição, produtor responsável e disponibilidade.                                               | CP2 |
| **RF23** | **Cadastrar experiência**          | O sistema deve permitir cadastrar experiências, atividades e atrativos oferecidos pelos produtores ou propriedades.                                         | CP3 |
| **RF24** | **Atualizar experiência**          | O sistema deve permitir que o produtor ou responsável autorizado altere as informações de uma experiência rural cadastrada.                                         | CP3 |
| **RF25** | **Consultar experiência**          | O sistema deve permitir aos usuários visualizar os detalhes das experiências e atividades disponíveis.                                                      | CP3 |
| **RF26** | **Excluir experiência**            | O sistema deve permitir ao responsável excluir uma experiência cadastrada.                                                                              | CP3 |
| **RF27** | **Cadastrar evento**                     | O sistema deve permitir que eventos relacionados aos produtores, propriedades ou à Rede Cafuringa sejam cadastrados na plataforma.                          | CP3 |
| **RF28** | **Atualizar evento**                     | O sistema deve permitir que o responsável altere as informações de um evento cadastrado.                         | CP3 |
| **RF29** | **Consultar evento**                     | O sistema deve permitir aos usuários visualizar informações sobre eventos cadastrados, como descrição, local e período de realização.                       | CP3 |
| **RF30** | **Excluir evento**                       | O sistema deve permitir ao responsável excluir um evento cadastrado.                                                                                          | CP3 |
| **RF31** | **Auxiliar cadastro de atividade**       | O sistema deve fornecer um agente de IA para apoiar o produtor no preenchimento das informações necessárias ao cadastro de atividades e experiências.         | CP3 |
| **RF32** | **Apresentar informações da Cafuringa**  | O sistema deve disponibilizar informações sobre a história e os principais pontos de interesse da região da Cafuringa.                                      | CP3 |
| **RF33** | **Consultar guia de boas práticas**      | O sistema deve disponibilizar aos usuários um guia com orientações e boas práticas relacionadas à utilização da plataforma e às atividades oferecidas.      | CP3 |
| **RF34** | **Notificar eventos**                    | O sistema deve informar aos usuários sobre novos eventos cadastrados ou atualizados, via email.                                                       | CP3 |
| **RF35** | **Visualizar ofertas no mapa**           | O sistema deve apresentar em mapa produtores, propriedades, experiências, atividades e eventos que possuam localização cadastrada.          | CP4 |
| **RF36** | **Buscar ofertas**                  | O sistema deve permitir ao usuário buscar produtores, produtos, experiências, atividades e eventos cadastrados.                                                                            | CP4 |
| **RF37** | **Buscar locais por proximidade**        | O sistema deve permitir encontrar produtores, propriedades, experiências e atrativos considerando localização ou região selecionada.                        | CP4 |
| **RF38** | **Filtrar resultados de busca**          | O sistema deve permitir filtrar os resultados por critérios como tipo de produto, tipo de experiência, atividade, perfil ou outras categorias disponíveis.  | CP4 |
| **RF39** | **Disponibilizar contato direto**        | O sistema deve permitir um contato direto entre consumidor/visitante e produtor ou responsável pela oferta via chat de comunicação direta.                  | CP5 |
| **RF40** | **Enviar feedback ao fornecedor**        | O sistema deve permitir que o usuário envie feedback relacionado à oferta ou experiência diretamente ao fornecedor responsável.                             | CP5 |
| **RF41** | **Visualizar feedback**        | O sistema deve permitir ao usuário e ao produtor visualizar o feedback de uma experiência, produto ou evento que estejam envolvidos.                             | CP5 |
| **RF42** | **Editar feedback**        | O sistema deve permitir ao usuário editar um feedback por ele enviado.                             | CP5 |
| **RF43** | **Excluir feedback ao fornecedor**       | O sistema deve permitir que o usuário exclua seu feedback enviado ao fornecedor.                                                                            | CP5 |
| **RF44** | **Solicitar pré-reserva de experiência** | O sistema deve permitir que visitantes enviem uma solicitação de pré-reserva para uma experiência, visita ou hospedagem.                                    | CP6 |
| **RF45** | **Consultar pré-reserva** | O sistema deve permitir que o visitante e o responsável pela experiência consultem as solicitações de pré-reserva e seus respectivos estados.                                    | CP6 |
| **RF46** | **Cancelar solicitação de pré-reserva** | O sistema deve permitir que o visitante cancele uma solicitação de pré-reserva enquanto ela estiver pendente.                                    | CP6 |
| **RF47** | **Responder pré-reserva de experiência** | O sistema deve permitir ao responsável aceitar ou rejeitar uma solicitação de pré-reserva recebida.                                                         | CP6 |
| **RF48** | **Notificar alteração de pré-reserva**   | O sistema deve notificar os envolvidos quando houver alteração relevante no estado de uma solicitação de pré-reserva.                                       | CP6 |

## Requisitos Não Funcionais 

Os requisitos não funcionais definem propriedades de qualidade, restrições e condições que devem ser atendidas pela solução. Para sua classificação, são utilizados os modelos URPS+ e Sommerville.

### RNF01 — Eficiência de Navegação

**Descrição:** A aplicação deve possuir uma hierarquia de navegação rasa, permitindo acesso rápido aos principais catálogos e informações por produtores, consumidores e visitantes.

**Classificação:** URPS+ — Usabilidade (Eficiência) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Limite de interações sistêmicas necessárias para que o usuário alcance seu objetivo.

**Critério verificável:** O fluxo para consultar os detalhes de um produtor, localizar uma experiência ou visualizar um produto deve ser concluído em, no máximo, 5 cliques ou toques a partir da tela inicial.

---

### RNF02 — Desempenho na Execução de Tarefas

**Descrição:** A interface deve ser direta e de fácil compreensão, permitindo que os usuários realizem as principais consultas sem gastar tempo excessivo tentando compreender a organização da aplicação.

**Classificação:** URPS+ — Usabilidade (Eficiência e Apreensibilidade) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tempo máximo aceitável para conclusão de uma tarefa de busca e consulta.

**Critério verificável:** Em teste de usabilidade, um usuário em seu primeiro acesso deve ser capaz de buscar um produto ou experiência específica e acessar sua respectiva página de detalhes em até 60 segundos de navegação contínua.

---

### RNF03 — Prevenção e Recuperação de Erros

**Descrição:** A interface deve prevenir erros de operação e fornecer orientações claras ao usuário quando forem realizadas ações inválidas durante os processos de busca, consulta ou preenchimento de informações.

**Classificação:** URPS+ — Usabilidade (Taxa de Erro) / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Prevenção e recuperação de erros durante a interação do usuário com o sistema.

**Critério verificável:** Durante a execução das funções de busca e consulta, a ocorrência de ações inválidas não deve ultrapassar 1 erro por tarefa, e o sistema deve apresentar mensagens de validação ou orientação em 100% das ocorrências identificadas como inválidas.

---

### RNF04 — Acessibilidade Digital

**Descrição:** As funcionalidades principais da aplicação devem ser acessíveis a usuários com diferentes necessidades e níveis de familiaridade com tecnologia.

**Classificação:** URPS+ — Usabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Acessibilidade da interface.

**Critério verificável:** Os principais fluxos da aplicação devem atender às recomendações aplicáveis da WCAG 2.1 nível AA, contemplando, quando aplicável, contraste adequado, identificação dos campos de formulário, textos alternativos para imagens relevantes, indicação de foco e navegação por teclado.

---

### RNF05 — Responsividade da Interface

**Descrição:** A aplicação deve adaptar sua apresentação a diferentes tamanhos de tela, permitindo sua utilização em dispositivos móveis e computadores.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Adaptação da interface a diferentes dimensões de tela.

**Critério verificável:** As funcionalidades principais devem permanecer utilizáveis em telas com largura entre 360 px e 1920 px, sem sobreposição de componentes e sem necessidade de rolagem horizontal para utilização dos fluxos principais.

---

### RNF06 — Desempenho em Conectividade Limitada

**Descrição:** A plataforma deve manter condições adequadas de utilização em conexões móveis ou rurais caracterizadas por baixa velocidade ou alta latência.

**Classificação:** URPS+ — Desempenho / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tempo de carregamento em condições de conectividade limitada.

**Critério verificável:** As principais páginas públicas da aplicação devem apresentar seu conteúdo principal em até 5 segundos em pelo menos 90% das medições, considerando conexão limitada a aproximadamente 1,5 Mbps e latência de até 300 ms.

---

### RNF07 — Resiliência à Perda de Conexão

**Descrição:** O sistema deve minimizar a perda de informações durante interrupções temporárias ou instabilidade da conexão com a internet.

**Classificação:** URPS+ — Confiabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Tolerância a falhas temporárias de comunicação.

**Critério verificável:** Caso ocorra perda de conexão durante o preenchimento de um formulário, os dados já preenchidos pelo usuário não devem ser apagados automaticamente antes de uma nova tentativa de envio.

---

### RNF08 — Controle de Acesso por Perfil

**Descrição:** O sistema deve controlar o acesso às funcionalidades e informações conforme o perfil do usuário.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Autorização de acesso às funcionalidades do sistema.

**Critério verificável:** Funcionalidades exclusivas de produtores não devem poder ser executadas por contas classificadas exclusivamente como consumidores ou visitantes, inclusive por meio de acesso direto às respectivas rotas ou endpoints.

---

### RNF09 — Privacidade do Feedback

**Descrição:** Os feedbacks enviados aos fornecedores devem permanecer privados, não sendo apresentados publicamente como avaliações da plataforma.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Confidencialidade das informações fornecidas pelos usuários.

**Critério verificável:** Um usuário não relacionado ao feedback não deve conseguir visualizá-lo pela interface nem por requisição direta ao serviço responsável por seu armazenamento ou consulta.

---

### RNF10 — Proteção da Comunicação

**Descrição:** A comunicação entre os dispositivos dos usuários e os serviços da plataforma deve ocorrer de maneira segura.

**Classificação:** URPS+ — Confiabilidade e Segurança / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Transmissão segura dos dados.

**Critério verificável:** Em ambiente de produção, todas as comunicações da aplicação devem utilizar HTTPS, e requisições realizadas por HTTP devem ser redirecionadas para HTTPS.

---

### RNF11 — Proteção de Dados Pessoais

**Descrição:** O tratamento dos dados pessoais de produtores, consumidores e visitantes deve respeitar os princípios aplicáveis da Lei Geral de Proteção de Dados Pessoais — LGPD.

**Classificação:** URPS+ — Restrição Legal / Sommerville — Requisito Externo.

**Propriedade ou restrição:** Privacidade e minimização dos dados pessoais coletados.

**Critério verificável:** Todo dado pessoal solicitado pelo sistema deve estar relacionado a uma finalidade funcional documentada, e dados classificados como privados não devem ser apresentados publicamente sem previsão no fluxo correspondente.

---

### RNF12 — Compatibilidade entre Navegadores

**Descrição:** A aplicação deve funcionar adequadamente nos principais navegadores utilizados em computadores e dispositivos móveis.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Compatibilidade entre navegadores e plataformas.

**Critério verificável:** Os principais fluxos da aplicação devem ser executados com sucesso nas versões estáveis utilizadas para teste do Google Chrome, Mozilla Firefox e Microsoft Edge, além do Google Chrome em dispositivo Android ou emulação equivalente.

---

### RNF13 — Baixo Custo Operacional

**Descrição:** A solução deve priorizar tecnologias e serviços que não imponham custos recorrentes significativos aos participantes e responsáveis pela Rede Cafuringa.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito Organizacional.

**Propriedade ou restrição:** Custo de implantação, utilização e manutenção da solução.

**Critério verificável:** As funcionalidades essenciais definidas para o MVP não devem depender obrigatoriamente de licenças proprietárias, APIs pagas ou serviços que realizem cobrança por usuário ou por transação.

---

### RNF14 — Disponibilização como Aplicação Web Progressiva

**Descrição:** A plataforma deve utilizar recursos de **Progressive Web App (PWA)** quando compatíveis com o ambiente do usuário, permitindo acesso diretamente pelo navegador e instalação no dispositivo quando suportada.

**Classificação:** URPS+ — Suportabilidade / Sommerville — Requisito de Produto.

**Propriedade ou restrição:** Portabilidade e forma de disponibilização da aplicação.

**Critério verificável:** A aplicação deve possuir manifesto web válido e os recursos necessários para ser reconhecida como instalável em navegadores compatíveis, sem exigir obrigatoriamente sua distribuição por lojas de aplicativos.

---

### RNF15 — Adequação ao ECA Digital
**Descrição:**A aplicação deve assegurar a proteção integral de crianças e adolescentes no ambiente digital, garantindo que a exibição de conteúdos, as interações na plataforma e o tratamento de dados estejam em conformidade com as diretrizes do Estatuto da Criança e do Adolescente (ECA).

**Classificação:**URPS+ — Restrição Legal / Sommerville — Requisito Externo.

**Propriedade ou restrição:**Proteção de direitos, segurança de conteúdo e privacidade de menores de idade.

**Critério verificável:**O sistema deve exigir a confirmação de maioridade durante o cadastro de usuários e, caso permita o acesso ou cadastro de menores de 18 anos, deve implementar a exigência de consentimento explícito de um responsável legal. Além disso, a plataforma deve garantir que nenhum dado pessoal de crianças ou adolescentes seja exposto publicamente nas interfaces de busca, perfis ou feedbacks.

---

## Tabela de Regras de Negócio


| Código | Regra de negócio | RF(s) relacionado(s) |
|---|---|---|
| **RN01** | **Tipos de perfil.** Os perfis de acesso previstos na plataforma são consumidor, produtor e administrador; cada operação deve respeitar as permissões atribuídas ao perfil. | RF01, RF02, RF03, RF09 | 
| **RN02** | **Dados do consumidor.** O cadastro de consumidor deve contemplar nome, CPF, telefone e e-mail. | RF01 | 
| **RN03** | **Dados do produtor.** O cadastro de produtor, propriedade, associação ou comunidade deve contemplar nome, CPF ou CNPJ, telefone, e-mail e endereço, conforme a natureza do cadastro. | RF02 |
| **RN04** | **Gestão administrativa.** A consulta administrativa de usuários e conteúdos e as intervenções administrativas sobre contas e conteúdos devem ser executadas por perfil administrador. | RF03, RF04, RF05, RF06, RF07 | 
| **RN05** | **Motivos para desativação.** A desativação administrativa de usuários deve estar vinculada a necessidade administrativa ou descumprimento das regras da plataforma. | RF05 | 
| **RN06** | **Remoção de conteúdo irregular.** A remoção administrativa de produtos, experiências e eventos deve estar relacionada à violação das regras da plataforma. | RF06, RF07 | 
| **RN07** | **Responsabilidade institucional.** A atualização das informações institucionais da Rede Cafuringa compete ao administrador. | RF08 | 
| **RN08** | **Identificação para acesso.** A autenticação das contas cadastradas utiliza CPF e senha, conforme a especificação atual. | RF09 | 
| **RN09** | **Recuperação de conta.** A recuperação de acesso deve restabelecer o acesso somente à conta do seu titular, mediante verificação adequada de titularidade. | RF10 | 
| **RN10** | **Exclusão pelo titular.** A solicitação de exclusão de conta deve partir do próprio usuário titular da conta. | RF11 | 
| **RN11** | **Gestão da trajetória e perfil.** As informações de trajetória e as alterações do perfil do produtor devem estar vinculadas ao respectivo produtor e sob sua responsabilidade. | RF12, RF13 | 
| **RN12** | **Dados públicos do produtor.** A divulgação de dados de contato e identificação dos produtores deve distinguir informações públicas e privadas; a possibilidade de exibir CPF/CNPJ prevista no RF14 precisa ser harmonizada com a proteção de dados pessoais. | RF14 | 
| **RN13** | **Certificação aplicável.** A situação de certificação só deve ser informada quando aplicável ao produtor ou à propriedade, sem presumir que todo produtor possua certificação. | RF15 | 
| **RN14** | **Questionário de produtor.** As respostas ao questionário devem tratar de informações do perfil, da produção e das atividades do produtor que o preenche. | RF16 | 
| **RN15** | **Proteção no cadastro de menores.** No cadastro deve haver confirmação de maioridade e, se houver cadastro de menores de 18 anos, devem ser observados os controles de consentimento de responsável legal definidos na especificação de proteção de menores. | RF01, RF02 | 
| **RN16** | **Vínculo de produto.** Todo produto cadastrado deve estar associado a um produtor ou propriedade responsável. | RF17 | 
| **RN17** | **Responsável pela gestão de produto.** A atualização e exclusão de um produto devem ser realizadas pelo produtor responsável por ele, ou por usuário autorizado a atuar em seu nome. | RF18, RF19 | 
| **RN18** | **Disponibilidade e sazonalidade.** A informação de disponibilidade dos produtos deve ser mantida pelo responsável; a sazonalidade deve ser informada quando aplicável. | RF20 |
| **RN19** | **Origem do catálogo.** O catálogo deve apresentar os produtos oferecidos pelos produtores cadastrados na Rede Cafuringa. | RF21 | 
| **RN20** | **Informações do produto.** A consulta aos detalhes de um produto deve identificar sua descrição, o produtor responsável e a disponibilidade informada. | RF22 | 
| **RN21** | **Vínculo de experiência.** As experiências, atividades e atrativos cadastrados devem corresponder a ofertas de produtores ou propriedades participantes. | RF23 |
| **RN22** | **Responsável pela experiência.** A alteração ou exclusão de uma experiência deve ser feita por seu produtor ou responsável autorizado. | RF24, RF26 | 
| **RN23** | **Consulta de experiências.** A consulta de experiências deve disponibilizar os detalhes das atividades e experiências cadastradas e oferecidas. | RF25 |
| **RN24** | **Vínculo de eventos.** Eventos cadastrados devem estar relacionados a produtores, propriedades ou à própria Rede Cafuringa. | RF27 |
| **RN25** | **Responsável pelo evento.** A atualização e a exclusão de um evento competem ao responsável pelo respectivo cadastro. | RF28, RF30 |
| **RN26** | **Dados de divulgação de eventos.** A consulta de um evento deve apresentar, no mínimo, descrição, local e período de realização. | RF29 | 
| **RN27** | **Autonomia do produtor no uso da IA.** O agente de IA deve apoiar o preenchimento de cadastros de atividades e experiências, mas a revisão e confirmação das informações antes da publicação devem permanecer com o produtor. | RF31 |
| **RN28** | **Conteúdo sobre a região.** As informações regionais disponibilizadas devem abordar a história e os principais pontos de interesse da Cafuringa. | RF32 |
| **RN29** | **Orientações aos usuários.** O guia de boas práticas deve reunir orientações relacionadas à utilização da plataforma e às atividades oferecidas. | RF33 |
| **RN30** | **Avisos de eventos.** As notificações de eventos devem tratar de eventos novos ou atualizados e utilizar e-mail como canal previsto. | RF34 |
| **RN31** | **Localização exigida para o mapa.** Somente produtores, propriedades, atividades, experiências e eventos com localização cadastrada podem ser representados no mapa. | RF35 | 
| **RN32** | **Escopo da busca.** A busca deve abranger produtores, produtos, experiências, atividades e eventos cadastrados. | RF36 | Derivada |
| **RN33** | **Critério de proximidade.** A busca por proximidade deve considerar a localização informada ou a região selecionada pelo usuário para localizar produtores, propriedades, experiências e atrativos. | RF37 |
| **RN34** | **Critérios de filtragem.** Os resultados de busca devem poder ser refinados pelas categorias disponíveis, como tipo de produto, experiência, atividade ou perfil. | RF38 | 
| **RN35** | **Participantes do contato.** O canal de contato direto deve conectar consumidor ou visitante ao produtor ou responsável pela oferta consultada, por meio de chat conforme o RF atual. | RF39 | 
| **RN36** | **Destinatário do feedback.** O feedback referente a produto, experiência ou oferta deve ser direcionado ao fornecedor responsável. | RF40 |
| **RN37** | **Confidencialidade do feedback.** O feedback não deve ser divulgado publicamente como avaliação; sua consulta é limitada aos usuários e produtores envolvidos. | RF41 | 
| **RN38** | **Autoria de feedback.** Somente o autor de um feedback pode editá-lo ou excluí-lo. | RF42, RF43 |
| **RN39** | **Escopo da pré-reserva.** As solicitações de pré-reserva destinam-se a experiências, visitas ou hospedagens oferecidas na plataforma. | RF44 |
| **RN40** | **Acesso às solicitações.** A consulta a uma pré-reserva e a seu estado deve ser disponibilizada ao visitante solicitante e ao responsável pela experiência. | RF45 |
| **RN41** | **Condição para cancelamento.** O visitante só pode cancelar uma solicitação de pré-reserva enquanto ela estiver pendente. | RF46 |
| **RN42** | **Decisão sobre a solicitação.** A aceitação ou rejeição de uma pré-reserva cabe ao responsável pela experiência. | RF47 | 
| **RN43** | **Comunicação de alterações.** Mudanças relevantes no estado da pré-reserva devem ser informadas às pessoas envolvidas na solicitação. | RF48 |
| **RN44** | **Pré-reserva não é confirmação automática.** O envio da pré-reserva não deve ser tratado como reserva confirmada até que haja resposta de aceitação pelo responsável. | RF44, RF47 |


## Matriz-síntese de Rastreabilidade

A matriz, a seguir, representa a rastreabilidade entre objetivos específicos (OE), características de produto (CP), requisitos funcionais (RFs) e não funcionais (RNFs). 

| **Contribuição principal** | **Contribuição secundária** | **CP** | **RFs relacionados** | **RNFs relacionados** |
|:---|:---|:---:|:---|:---|
| OE2 | OE1 | CP1 | RF01, RF02, RF03, RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF11, RF12, RF13, RF14, RF15, RF16 | RNF03, RNF07, RNF08, RNF11, RNF15 |
| OE2 | OE1, OE3 | CP2 | RF17, RF18, RF19, RF20, RF21, RF22 | RNF01, RNF02, RNF06 |
| OE2 | OE1, OE3 | CP3 | RF23, RF24, RF25, RF26, RF27, RF28, RF29, RF30, RF31, RF32, RF33, RF34 | RNF01, RNF02, RNF06 |
| OE2 | OE1, OE3 | CP4 | RF35, RF36, RF37, RF38 | RNF02, RNF03 |
| OE3 | OE1 | CP5 | RF39, RF40, RF41, RF42, RF43 | RNF08, RNF09, RNF10, RNF11 |
| OE3 | OE1 | CP6 | RF44, RF45, RF46, RF47, RF48 | RNF03, RNF07, RNF08, RNF11 |

---

## Formas de Declaração de Requisitos

| Tipo de Requisito | Concepção | Elaboração | Construção | Transição |
|---|---|---|---|---|
| **Requisitos de Negócio** | Narrativas Descritivas (Narrativas em Texto Livre) | Narrativas Descritivas (Storyboards Descritivos) | **---------**| **---------** |
| **Requisitos de Usuário** | Orientadas a Valor (Histórias de Usuário preliminar) | Orientadas a Valor (Histórias de Usuário) | Orientadas a Valor (Histórias de Usuário) | **---------** |
| **Requisitos de Produto** | **---------** | Declarações Estruturadas (Critérios de Aceitação) | Declarações Estruturadas (Critérios de Aceitação) | **---------** |
