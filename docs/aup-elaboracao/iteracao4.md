# Evidências da Iteração 4

## Representação de Requisitos

??? info "MVP Preliminar - Requisitos Funcionais"
    
    Estruturação da primeira versão reduzida e funcional do sistema, selecionando as funcionalidades essenciais para validar a proposta de valor junto ao cliente com o menor custo e tempo de desenvolvimento possíveis.

    | Código | Requisito | Justificativa |
    | :--- | :--- | :--- |
    | **RF01** | Cadastrar perfil de consumidor | Permite identificar o consumidor e estabelecer sua participação nos fluxos autenticados da plataforma. |
    | **RF02** | Cadastrar perfil de produtor | É necessário para representar os produtores e associar produtos e experiências às suas informações. |
    | **RF03** | Cadastrar usuário admin | Permite estabelecer a gestão administrativa da plataforma desde a primeira versão. |
    | **RF04** | Consultar usuários cadastrados | Fornece ao administrador uma visão básica dos usuários e apoia a manutenção da plataforma. |
    | **RF09** | Autenticar usuário | É uma dependência dos fluxos que exigem identificação do usuário e controle de acesso. |
    | **RF10** | Recuperar acesso à conta | Garante a continuidade de acesso à plataforma quando o usuário perde suas credenciais, evitando bloqueio dos fluxos autenticados do MVP. |
    | **RF12** | Registrar trajetória do produtor | Contribui para apresentar a identidade, a história e a experiência do produtor, fortalecendo sua valorização e contextualizando as ofertas disponibilizadas na plataforma. |
    | **RF14** | Consultar perfil de produtor | Permite conhecer os produtores e relacionar suas informações às ofertas disponíveis. |
    | **RF17** | Cadastrar produto | É um dos principais mecanismos para disponibilizar a produção da agricultura familiar na plataforma. |
    | **RF21** | Consultar catálogo de produtos | Permite aos consumidores conhecerem os produtos disponibilizados pelos produtores. |
    | **RF22** | Consultar detalhes do produto | Complementa a consulta do catálogo, fornecendo informações necessárias para avaliar uma oferta. |
    | **RF23** | Cadastrar experiência | Representa o eixo de turismo rural e permite disponibilizar as experiências oferecidas pelos produtores. |
    | **RF25** | Consultar experiência | Permite aos visitantes conhecerem as experiências disponíveis na Rede Cafuringa. |
    | **RF36** | Buscar ofertas | É importante para conectar usuários às ofertas. Para o MVP, pode ser implementada inicialmente com busca simplificada por termos e categorias. |
    | **RF39** | Disponibilizar contato direto | Apesar do esforço elevado, é diretamente relacionado ao objetivo de aproximar produtores de consumidores e visitantes. Para o MVP, o escopo pode ser reduzido a uma forma simples de contato. |
    | **RF44** | Solicitar pré-reserva de experiência | Permite validar o fluxo de interesse e agendamento de experiências, constituindo parte importante do eixo de turismo rural. |
    | **RF45** | Consultar pré-reserva | É necessário para que os envolvidos acompanhem as solicitações realizadas. |
    | **RF46** | Cancelar solicitação de pré-reserva | Completa o controle básico da solicitação por parte do visitante. |
    | **RF47** | Responder pré-reserva de experiência | Completa o fluxo de pré-reserva ao permitir que o responsável pela experiência aceite ou rejeite a solicitação. |
    | **RF48** | Notificar alteração de pré-reserva | Mantém visitante e responsável informados sobre mudanças no estado da pré-reserva, completando o fluxo básico de acompanhamento e reduzindo a necessidade de consultas manuais. |

??? info "MVP Preliminar - Requisitos Não Funcionais"
    Estruturação da primeira versão reduzida e funcional do sistema, selecionando as funcionalidades essenciais para validar a proposta de valor junto ao cliente com o menor custo e tempo de desenvolvimento possíveis.

    | Código | Requisito | Justificativa |
    | :--- | :--- | :--- |
    | **RNF01** | Eficiência de navegação | Está diretamente relacionado aos fluxos de cadastro, consulta de produtos e experiências, busca e pré-reserva. Uma navegação minimamente eficiente é necessária para que esses fluxos possam ser utilizados. |
    | **RNF02** | Desempenho na execução de tarefas | Aplica-se aos principais fluxos da solução, especialmente cadastro, consulta, busca e pré-reserva. O MVP deverá apresentar desempenho suficiente para a execução dessas operações, enquanto otimizações adicionais poderão ocorrer posteriormente. |
    | **RNF03** | Prevenção e recuperação de erros | É necessário para evitar falhas durante os principais fluxos e orientar o usuário quando ocorrerem entradas inválidas ou problemas durante a execução das operações. |
    | **RNF04** | Acessibilidade digital | Deve ser considerada desde a construção da interface para garantir que a solução possa ser utilizada por pessoas com diferentes necessidades. |
    | **RNF05** | Responsividade da interface | É necessária para garantir a utilização dos principais fluxos em diferentes tamanhos de tela, especialmente considerando o acesso por dispositivos móveis. |
    | **RNF06** | Desempenho em conectividade limitada | Está diretamente relacionado ao contexto rural da Rede Cafuringa, no qual podem ocorrer condições de conexão limitada. O sistema deve manter uma experiência mínima de utilização nessas condições. |
    | **RNF07** | Resiliência à perda de conexão | Possui relação principalmente com cadastros, preenchimento de informações e solicitações de pré-reserva, reduzindo o risco de perda de dados durante esses fluxos. |
    | **RNF08** | Controle de acesso por perfil | É necessário para diferenciar as permissões de consumidores, produtores e administradores e impedir operações incompatíveis com cada perfil. |
    | **RNF10** | Proteção da comunicação | A comunicação entre usuários e plataforma deve ser protegida, especialmente nos fluxos de autenticação, cadastro e interação com dados da plataforma. |
    | **RNF11** | Proteção de dados pessoais | Está relacionado ao tratamento dos dados pessoais dos usuários e, portanto, deve ser considerado desde a concepção e implementação da solução. |
    | **RNF13** | Baixo custo operacional | Está relacionado à sustentabilidade da solução e à capacidade da Rede Cafuringa de manter a plataforma sem custos recorrentes incompatíveis com seu contexto. |

---

## Verificação e Validação

??? info "Prototipagem Interativa Navegável"
    Construção de telas e fluxos interativos no Figma para simular visualmente a navegação do produtor, visitante e administrador.

    <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/design/O9biBXXgG3EQNpEbh4VDzC/Rede-Cafuringa-%E2%80%94-Prot%C3%B3tipos-Iniciais?node-id=17-2&embed-host=share" allowfullscreen></iframe>

??? info "Testes de Usabilidade com Protótipo"

---

## Organização e Atualização

??? info "MVP Totalmente Definido"

    Consolidação e aprovação final do escopo da primeira versão do produto. Garante que as funcionalidades essenciais, o design de interface e os requisitos técnicos estejam alinhados, detalhados e prontos para o início do desenvolvimento.

    - ![MVP Oficial](../../img/aup-elaboracao/mvp_lista.jpeg)

    - ![MVP Oficial](../../img/aup-elaboracao/mvp_visual.jpeg)

---

## Vídeos Comprobatórios


