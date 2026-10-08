<span class="version-badge">Unidade 02</span>
## Formas de Declaração de Requisitos

| Tipo de Requisito | Concepção | Elaboração | Construção | Transição |
|---|---|---|---|---|
| **Requisitos de Negócio** | Narrativas Descritivas (Narrativas em Texto Livre) | Narrativas Descritivas (Storyboards Descritivos) | Catálogos e Artefatos Técnicos (Catálogo de Metas) | Catálogos e Artefatos Técnicos (Catálogo de Metas) |
| **Requisitos de Usuário** | Orientadas a Valor (Histórias de Usuário preliminar) | Orientadas a Valor (Histórias de Usuário) | Orientadas a Valor (Checklist Estruturados RFs e RNFs) | Orientadas a Valor (Checklist Estruturados RNFs) |
| **Requisitos de Produto** | **Não realizado nessa fase** | Declarações Estruturadas (Critérios de Aceitação) | Declarações Estruturadas (Critérios de Aceitação) | Declarações Estruturadas (Critérios de Aceitação) |


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

### RNF15 — Adequação ao ECA Digital
**Descrição:**A aplicação deve assegurar a proteção integral de crianças e adolescentes no ambiente digital, garantindo que a exibição de conteúdos, as interações na plataforma e o tratamento de dados estejam em conformidade com as diretrizes do Estatuto da Criança e do Adolescente (ECA).

**Classificação:**URPS+ — Restrição Legal / Sommerville — Requisito Externo.

**Propriedade ou restrição:**Proteção de direitos, segurança de conteúdo e privacidade de menores de idade.

**Critério verificável:**O sistema deve exigir a confirmação de maioridade durante o cadastro de usuários e, caso permita o acesso ou cadastro de menores de 18 anos, deve implementar a exigência de consentimento explícito de um responsável legal. Além disso, a plataforma deve garantir que nenhum dado pessoal de crianças ou adolescentes seja exposto publicamente nas interfaces de busca, perfis ou feedbacks.
