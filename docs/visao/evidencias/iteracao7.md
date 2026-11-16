# Evidências da Iteração 7

[Voltar para o Cronograma](../cronograma.md)

## Descrição das Atividades Realizadas

A **Iteração 7** integrou a fase de Construção do AUP e teve como foco o desenvolvimento das funcionalidades relacionadas ao cadastro e à consulta de produtos e experiências oferecidos pelos produtores da Rede Cafuringa.

Nesta etapa, foram trabalhados os recursos que permitem aos produtores apresentar seus produtos na plataforma e aos consumidores conhecer as opções disponíveis. O desenvolvimento contemplou o cadastro de produtos, a visualização do catálogo e a consulta de informações detalhadas sobre cada item. Também foi abordado o cadastro de experiências, ampliando as possibilidades de divulgação das atividades oferecidas pelos produtores e comunidades participantes.

As atividades foram organizadas em torno dos seguintes fluxos:

- **Cadastro de produtos:** desenvolvimento do fluxo para que os produtores possam registrar produtos na plataforma, disponibilizando informações que permitam sua identificação e apresentação aos consumidores.
- **Consulta ao catálogo de produtos:** implementação da funcionalidade de visualização dos produtos cadastrados, permitindo que os usuários conheçam as opções disponíveis na Rede Cafuringa.
- **Consulta aos detalhes dos produtos:** desenvolvimento da visualização individual de cada produto, possibilitando o acesso a informações mais específicas sobre os itens apresentados no catálogo.
- **Cadastro de experiências:** desenvolvimento do fluxo de registro de experiências oferecidas pelos produtores e comunidades, permitindo ampliar a divulgação de atividades e oportunidades de visitação na região.

Essas funcionalidades contribuem diretamente para o objetivo da Rede Cafuringa de dar visibilidade à produção local e aproximar produtores e consumidores. Com o cadastro e a organização dos produtos e experiências em um ambiente digital, a plataforma passa a oferecer meios para que os produtores divulguem suas ofertas e os usuários descubram o que está disponível na rede.

---

## Evidências

### Verificação e Validação

??? info "Funcionalidades Desenvolvidas na Iteração"

    A tabela relaciona as funcionalidades trabalhadas nesta etapa às respectivas histórias de usuário.

    | HU | Funcionalidade | Descrição |
    |---|---|---|
    | [HU15](../historias/HU15.md) | Cadastrar produto | Registro de produtos pelos produtores na plataforma. |
    | [HU19](../historias/HU19.md) | Consultar catálogo de produtos | Visualização dos produtos cadastrados e disponíveis na Rede Cafuringa. |
    | [HU20](../historias/HU20.md) | Consultar detalhes do produto | Acesso às informações específicas de um produto selecionado. |
    | [HU21](../historias/HU21.md) | Cadastrar experiência | Registro de experiências oferecidas pelos produtores e comunidades participantes. |

    O desenvolvimento dessas funcionalidades também contou com a estrutura técnica e as orientações descritas no [Guia do Backend — Estrutura de pastas e TDD](../arquitetura/backend/guia-estrutura-e-tdd.md). As práticas de integração e validação do projeto estão documentadas na [Visão Geral de Engenharia](../arquitetura/engenharia/visao-geral.md).

??? info "Validação das HU19, HU20 e HU21"

    Antes da integração na `dev`, os critérios de aceite das três histórias foram conferidos com testes automatizados (backend e front) e com teste manual no ambiente Docker usando a API real. A matriz de rastreabilidade, as capturas de tela e os achados da integração estão em [Validação das HU19, HU20 e HU21](validacao_hu19_hu21.md).

### Organização e Atualização

??? info "Revisão e Refinamento dos Requisitos"

    Durante a Iteração 7, não foram identificadas necessidades de alteração nos requisitos definidos para as funcionalidades planejadas. Assim, as histórias de usuário e seus critérios foram mantidos, concentrando-se o trabalho no desenvolvimento dos fluxos previstos.

---

## Vídeos Comprobatórios

O vídeo a seguir registra um alinhamento entre as equipes de desenvolvimento, servindo como evidência complementar das atividades de comunicação e organização realizadas durante o andamento do projeto.

<iframe width="800" height="450" src="https://www.youtube.com/embed/krf_uStQ5Pw" title="Vídeo de alinhamento entre as equipes de Desenvolvimento" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>