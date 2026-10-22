

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
