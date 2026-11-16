# Evidências da Iteração 6

[Voltar para o Cronograma](../cronograma.md)

## Descrição das Atividades Realizadas

A Iteração 6 integrou a fase de Construção do AUP e teve como foco o desenvolvimento dos recursos de gerenciamento de usuários e controle de acesso à plataforma Rede Cafuringa.

Nesta etapa, foram trabalhadas funcionalidades essenciais para permitir que diferentes perfis utilizem a plataforma de acordo com suas necessidades. O desenvolvimento contemplou o cadastro de consumidores e produtores, a criação e consulta de usuários administradores, a autenticação de usuários, a recuperação de acesso às contas e o registro da trajetória dos produtores.

As atividades foram organizadas em torno dos seguintes fluxos:

- **Cadastro de consumidores:** desenvolvimento do fluxo de registro de novos consumidores, permitindo sua identificação como usuários da plataforma e o acesso às funcionalidades destinadas a esse perfil.

- **Cadastro de produtores:** implementação do cadastro de produtores, contemplando a criação de perfis que representam os responsáveis pela oferta de produtos e experiências na Rede Cafuringa.

- **Autenticação de usuários:** desenvolvimento do mecanismo de acesso à plataforma, permitindo que os usuários identificados realizem login em suas contas.

- **Registro da trajetória do produtor:** desenvolvimento do recurso destinado ao registro das informações sobre a trajetória do produtor, contribuindo para apresentar sua história e fortalecer a identificação de sua atuação na rede.

- **Gerenciamento de administradores:** implementação de funcionalidades para cadastrar usuários administradores e consultar os usuários registrados, apoiando a gestão e a organização dos acessos à plataforma.

- **Recuperação de acesso:** desenvolvimento do fluxo para recuperação de acesso à conta, oferecendo uma alternativa ao usuário que não consegue entrar na plataforma.

Essas funcionalidades representam uma etapa importante na construção da Rede Cafuringa, pois estabelecem os mecanismos necessários para identificação dos usuários, diferenciação dos perfis e gerenciamento dos acessos. Também preparam a plataforma para as demais funcionalidades que dependem da existência de contas e de informações cadastradas.

---

## Evidências

### Verificação e Validação

??? info "Relação Entre Planejamento e Evidência"  
    A lista a seguir é extraída das atribuições da fonte única de HUs; não é uma relação de itens aprovados no DoD.

    | HU | Funcionalidade planejada | Situação da comprovação neste registro |
    |---|---|---|
    | [HU01](../historias/HU1.md) | Cadastrar perfil de consumidor | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU02](../historias/HU2.md) | Cadastrar perfil de produtor | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU09](../historias/HU9.md) | Autenticar usuário | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU12](../historias/HU12.md) | Registrar trajetória do produtor | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU03](../historias/HU3.md) | Cadastrar usuário administrador | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU04](../historias/HU4.md) | Consultar usuários cadastrados | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |
    | [HU10](../historias/HU10.md) | Recuperar acesso à conta | Planejada nesta iteração; comprovação individual de entrega a vincular ao PR, teste e revisão. |

    Há [código, testes e implementação técnica](../arquitetura/backend/guia-estrutura-e-tdd.md) e [esteiras automatizadas](../arquitetura/engenharia/visao-geral.md) no repositório. Para afirmar a conclusão de cada HU, consulte os [PRs do projeto](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/pulls?q=is%3Apr) e registre o link específico e o resultado do check correspondente.

### Organização e Atualização

??? info "Refinamento Iterativo de Requisitos"  
    Não foi preciso refinar os requisitos nessa etapa, pois permaneceram os mesmos.

---

## Vídeos Comprobatórios

<iframe width="800" height="450" src="https://www.youtube.com/embed/Upym_cfxbUQ" title="Vídeo de Validação do Protótipo do MVP" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
