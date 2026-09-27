<span class="version-badge">Unidade 02</span>

# MVP

## Requisitos Funcionais

| Código | Requisito | Valor | MoSCoW | Justificativa | E | C | L | ET |
|---|---|---:|---|---|---:|---:|---:|---:|
| **RF01** | Cadastrar perfil de consumidor | **4** | Must Have | É necessário para identificar os consumidores e permitir sua participação nos principais fluxos da plataforma. | 2 | 1 | 1 | **1,3 → 1** |
| **RF02** | Cadastrar perfil de produtor | **4** | Must Have | É essencial para representar os produtores e disponibilizar seus produtos, experiências e atividades na plataforma. | 2 | 1 | 1 | **1,3 → 1** |
| **RF03** | Cadastrar usuário admin | **4** | Must Have | É necessário para permitir a inclusão controlada de novos administradores e garantir a continuidade da gestão da plataforma. | 2 | 1 | 1 | **1,3 → 1** |
| **RF04** | Consultar usuários cadastrados | **4** | Must Have | É necessário para que o administrador acompanhe os usuários da plataforma e consiga realizar ações administrativas quando necessário. | 2 | 2 | 1 | **1,7 → 2** |
| **RF05** | Desativar usuário | **3** | Should Have | É uma funcionalidade importante para apoiar a administração e o controle da plataforma, especialmente em situações de uso inadequado ou violação das regras. Entretanto, sua ausência não impede o funcionamento principal do sistema na versão inicial, podendo ser implementada em uma etapa posterior. | 1 | 2 | 1 | **1,3 → 1** |
| **RF06** | Consultar conteúdos cadastrados | **3** | Should Have | Permite acompanhar o conteúdo publicado na plataforma e identificar informações inadequadas ou inconsistentes. | 2 | 3 | 1 | **2,0 → 2** |
| **RF07** | Remover conteúdo inadequado | **3** | Should Have | É importante para manter a qualidade e confiabilidade das informações apresentadas aos consumidores e visitantes. | 2 | 3 | 1 | **2,0 → 2** |
| **RF08** | Atualizar informações institucionais | **2** | Could Have | É útil para manter conteúdos institucionais atualizados, mas não impede o funcionamento das funcionalidades centrais caso seja implementado posteriormente. | 1 | 1 | 1 | **1,0 → 1** |
| **RF09** | Autenticar usuário | **4** | Must Have | Viabiliza o acesso às contas e é uma dependência para funcionalidades relacionadas a perfis e ações autenticadas. | 2 | 3 | 2 | **2,3 → 2** |
| **RF10** | Recuperar acesso à conta | **3** | Should Have | É importante para garantir a continuidade de acesso, mas sua ausência não impede os demais fluxos quando as credenciais estão disponíveis. | 2 | 3 | 1 | **2,0 → 2** |
| **RF11** | Excluir conta | **3** | Should Have | É importante para garantir ao usuário maior controle sobre sua conta e seus dados, embora a plataforma possa funcionar sem essa funcionalidade inicialmente. | 2 | 3 | 1 | **2,0 → 2** |
| **RF12** | Registrar trajetória do produtor | **3** | Should Have | Contribui para apresentar a história e a identidade dos produtores, fortalecendo a valorização da produção local. | 1 | 2 | 1 | **1,3 → 1** |
| **RF13** | Atualizar perfil de produtor | **3** | Should Have | Mantém as informações dos produtores atualizadas, contribuindo para a confiabilidade das informações disponibilizadas. | 2 | 2 | 1 | **1,7 → 2** |
| **RF14** | Consultar perfil de produtor | **4** | Must Have | Permite aos usuários conhecer os produtores e propriedades cadastrados, sendo importante para a conexão entre oferta e usuários. | 2 | 2 | 1 | **1,7 → 2** |
| **RF15** | Informar certificação | **1** | Won't Have Now | Agrega transparência às informações do produtor, mas pode ser postergado sem comprometer os principais fluxos da versão atual. | 2 | 4 | 3 | **3,0 → 3** |
| **RF16** | Preencher questionário do produtor | **3** | Should Have | Contribui para caracterizar os produtores, sua produção e suas atividades, agregando informações relevantes ao perfil. | 2 | 3 | 3 | **2,6 → 3** |
| **RF17** | Cadastrar produto | **4** | Must Have | É fundamental para disponibilizar os produtos da agricultura familiar e cumprir a função de divulgação da oferta da Rede. | 2 | 2 | 1 | **1,7 → 2** |
| **RF18** | Atualizar produto | **3** | Should Have | Garante que as informações dos produtos possam permanecer corretas e atualizadas após o cadastro inicial. | 2 | 2 | 1 | **1,7 → 2** |
| **RF19** | Excluir produto | **2** | Could Have | É útil para manutenção do catálogo, mas sua ausência não impede a disponibilização inicial dos produtos. | 1 | 2 | 1 | **1,3 → 1** |
| **RF20** | Informar disponibilidade de produto | **3** | Should Have | Evita informações desatualizadas sobre produtos disponíveis e permite representar sua sazonalidade. | 2 | 3 | 1 | **2,0 → 2** |
| **RF21** | Consultar catálogo de produtos | **4** | Must Have | Constitui uma das principais formas de conectar consumidores aos produtos oferecidos pelos produtores. | 2 | 2 | 1 | **1,7 → 2** |
| **RF22** | Consultar detalhes do produto | **4** | Must Have | É necessária para que o usuário obtenha informações suficientes sobre produto, produtor e disponibilidade. | 2 | 2 | 1 | **1,7 → 2** |
| **RF23** | Cadastrar experiência | **4** | Must Have | É fundamental para representar o eixo de turismo rural e disponibilizar as experiências oferecidas pelos produtores e propriedades. | 2 | 2 | 2 | **2,0 → 2** |
| **RF24** | Atualizar experiência | **3** | Should Have | Permite manter atualizadas as informações das experiências e evita que os usuários encontrem dados desatualizados. | 2 | 2 | 2 | **2,0 → 2** |
| **RF25** | Consultar experiência | **4** | Must Have | Permite aos visitantes conhecer as atividades e experiências disponíveis, contribuindo diretamente para o turismo rural. | 2 | 3 | 2 | **2,3 → 2** |
| **RF26** | Excluir experiência | **2** | Could Have | Auxilia na manutenção das ofertas, mas sua ausência não inviabiliza os principais fluxos de consulta e divulgação. | 1 | 2 | 1 | **1,3 → 1** |
| **RF27** | Cadastrar evento | **3** | Should Have | Amplia a divulgação das atividades da Rede Cafuringa e permite representar eventos relevantes para os usuários. | 2 | 2 | 2 | **2,0 → 2** |
| **RF28** | Atualizar evento | **2** | Could Have | Facilita a manutenção das informações de eventos, porém pode ser postergado em relação às funcionalidades centrais. | 2 | 2 | 1 | **1,7 → 2** |
| **RF29** | Consultar evento | **3** | Should Have | Permite aos usuários conhecer eventos disponíveis e amplia a divulgação das atividades da Rede. | 1 | 2 | 1 | **1,3 → 1** |
| **RF30** | Excluir evento | **1** | Won't Have Now | É uma função administrativa de manutenção e possui menor impacto sobre os objetivos principais da primeira versão. | 1 | 2 | 1 | **1,3 → 1** |
| **RF31** | Auxiliar cadastro de atividade | **1** | Won't Have Now | O agente de IA pode facilitar o cadastro, mas constitui um recurso complementar e não é necessário para o funcionamento básico. | 4 | 4 | 4 | **4 → 4** |
| **RF32** | Apresentar informações da Cafuringa | **2** | Could Have | Contribui para contextualizar a região e valorizar seu território, mas não é indispensável aos fluxos de oferta e consulta. | 1 | 1 | 1 | **1,0 → 1** |
| **RF33** | Consultar guia de boas práticas | **3** | Should Have | Fornece orientações aos usuários e contribui para o uso adequado da plataforma e das atividades oferecidas. | 1 | 2 | 2 | **1,7 → 2** |
| **RF34** | Notificar eventos | **2** | Could Have | Aumenta o alcance da divulgação de eventos, mas não é necessária para sua consulta e depende da existência de eventos cadastrados. | 3 | 3 | 3 | **3,0 → 3** |
| **RF35** | Visualizar ofertas no mapa | **1** | Won't Have Now | A visualização geográfica agrega valor à descoberta de ofertas, mas pode ser postergada sem comprometer os fluxos essenciais. | 4 | 4 | 2 | **3,3 → 3** |
| **RF36** | Buscar ofertas | **4** | Must Have | É fundamental para permitir que consumidores e visitantes encontrem produtos, produtores, experiências e eventos de forma eficiente. | 3 | 3 | 2 | **2,6 → 3** |
| **RF37** | Buscar locais por proximidade | **1** | Won't Have Now | É um recurso complementar de localização e pode ser desenvolvido posteriormente sem comprometer o funcionamento inicial da plataforma. | 4 | 3 | 4 | **3,6 → 4** |
| **RF38** | Filtrar resultados de busca | **3** | Should Have | Melhora a eficiência da descoberta de ofertas e permite restringir os resultados conforme as necessidades dos usuários. | 2 | 3 | 2 | **2,3 → 2** |
| **RF39** | Disponibilizar contato direto | **4** | Must Have | Viabiliza a conexão direta entre consumidores/visitantes e produtores, sendo central para aproximar oferta e demanda. | 4 | 4 | 4 | **4,0 → 4** |
| **RF40** | Enviar feedback ao fornecedor | **2** | Could Have | Pode contribuir para comunicação e melhoria das ofertas, mas não é necessária para estabelecer a conexão inicial entre usuários e produtores. | 3 | 3 | 2 | **2,6 → 3** |
| **RF41** | Visualizar feedback | **2** | Could Have | Agrega transparência e informação sobre as interações, porém possui menor prioridade diante dos fluxos de cadastro, consulta e contato. | 2 | 2 | 1 | **1,7 → 2** |
| **RF42** | Editar feedback | **1** | Won't Have Now | É uma função complementar ao mecanismo de feedback e pode ser postergada sem afetar os objetivos principais. | 1 | 2 | 1 | **1,3 → 1** |
| **RF43** | Excluir feedback ao fornecedor | **1** | Won't Have Now | Possui caráter complementar e administrativo, não sendo necessária para a disponibilização do núcleo da plataforma. | 1 | 2 | 2 | **1,7 → 2** |
| **RF44** | Solicitar pré-reserva de experiência | **4** | Must Have | Viabiliza a manifestação de interesse do visitante nas experiências e cria um fluxo estruturado para futura realização da atividade. | 4 | 3 | 3 | **3,3 → 3** |
| **RF45** | Consultar pré-reserva | **3** | Should Have | É necessária para acompanhar o estado das solicitações e organizar o relacionamento entre visitante e responsável pela experiência. | 2 | 2 | 2 | **2,0 → 2** |
| **RF46** | Cancelar solicitação de pré-reserva | **4** | Must Have | Permite ao visitante controlar uma solicitação enquanto ela está pendente e completa o gerenciamento do fluxo de pré-reserva. | 2 | 3 | 2 | **2,3 → 2** |
| **RF47** | Responder pré-reserva de experiência | **4** | Must Have | É indispensável para que o responsável possa aceitar ou rejeitar uma solicitação, completando o fluxo de pré-reserva. | 3 | 3 | 3 | **3,0 → 3** |
| **RF48** | Notificar alteração de pré-reserva | **3** | Should Have | Mantém os envolvidos informados sobre mudanças no estado da solicitação e reduz a necessidade de consultas manuais. | 3 | 4 | 3 | **3,3 → 3** |

## Requisitos Não Funcionais

| Código | Requisito | Valor | MoSCoW | Justificativa | E | C | L | ET |
|---|---|---:|---|---|---:|---:|---:|---:|
| **RNF01** | Eficiência de navegação | **2** | Could Have | Uma navegação eficiente melhora a experiência, mas o aprimoramento específico da hierarquia pode ser realizado posteriormente sem impedir a utilização da plataforma. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF02** | Desempenho na execução de tarefas | **2** | Could Have | Contribui para uma experiência mais rápida e simples, mas os critérios específicos de desempenho podem ser aprimorados posteriormente. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF03** | Prevenção e recuperação de erros | **4** | Must Have | É necessária para evitar falhas de operação e orientar os usuários durante ações inválidas nos principais fluxos. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF04** | Acessibilidade digital | **3** | Should Have | Amplia a possibilidade de utilização da plataforma por pessoas com diferentes necessidades e níveis de familiaridade tecnológica. | 3 | 3 | 2 | **2,7 → 3** |
| **RNF05** | Responsividade da interface | **4** | Must Have | É necessária para que os principais fluxos permaneçam utilizáveis em diferentes tamanhos de tela, especialmente em dispositivos móveis. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF06** | Desempenho em conectividade limitada | **4** | Must Have | Está diretamente relacionado ao contexto de utilização rural, no qual podem existir condições de baixa velocidade ou alta latência. | 3 | 3 | 2 | **2,7 → 3** |
| **RNF07** | Resiliência à perda de conexão | **3** | Should Have | Reduz o risco de perda de informações durante o preenchimento de formulários em ambientes sujeitos à instabilidade de conexão. | 3 | 3 | 2 | **2,7 → 3** |
| **RNF08** | Controle de acesso por perfil | **4** | Must Have | É indispensável para impedir que usuários executem operações incompatíveis com seus perfis e para proteger funcionalidades restritas. | 3 | 3 | 2 | **2,7 → 3** |
| **RNF09** | Privacidade do feedback | **2** | Could Have | Contribui para a proteção das informações relacionadas aos feedbacks, mas pode ser priorizado após os requisitos essenciais de segurança e proteção de dados. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF10** | Proteção da comunicação | **4** | Must Have | A transmissão segura dos dados é necessária para proteger as informações trafegadas entre usuários e plataforma. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF11** | Proteção de dados pessoais | **4** | Must Have | Trata-se de uma restrição legal relacionada ao tratamento de dados pessoais e deve ser considerada desde a concepção da solução. | 3 | 3 | 2 | **2,7 → 3** |
| **RNF12** | Compatibilidade entre navegadores | **3** | Should Have | Amplia a disponibilidade da plataforma em diferentes ambientes de acesso e reduz restrições tecnológicas aos usuários. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF13** | Baixo custo operacional | **4** | Must Have | Está diretamente relacionado à sustentabilidade da solução e à necessidade de evitar custos recorrentes significativos para a Rede Cafuringa. | 2 | 2 | 1 | **1,7 → 2** |
| **RNF14** | Disponibilização como aplicação web progressiva | **2** | Could Have | A utilização de PWA pode facilitar o acesso e a instalação da aplicação, mas sua ausência não impede a utilização da plataforma como aplicação web. | 3 | 3 | 2 | **2,7 → 3** |
