# Evidências da Iteração 8

[Voltar para o Cronograma](../cronograma.md)

## Descrição das Atividades Realizadas

A **Iteração 8** integrou a fase de Construção do AUP e teve como foco o desenvolvimento de funcionalidades voltadas à consulta de experiências, à busca por ofertas e à visualização dos perfis dos produtores cadastrados na Rede Cafuringa.

Nesta etapa, foram trabalhados recursos que facilitam a descoberta do que é oferecido na plataforma e permitem que os usuários conheçam melhor os produtores responsáveis pelos produtos e experiências divulgados. O desenvolvimento contemplou a consulta ao catálogo de experiências, a busca por ofertas disponíveis e a consulta aos perfis dos produtores.

As atividades foram organizadas em torno dos seguintes fluxos:

- **Consulta ao catálogo de experiências:** desenvolvimento da funcionalidade que permite aos usuários visualizar as experiências cadastradas na plataforma, conhecendo as atividades oferecidas pelos produtores e comunidades participantes.
- **Busca por ofertas:** implementação de um mecanismo de busca que facilita a localização de produtos e experiências disponibilizados na Rede Cafuringa, tornando a navegação mais prática e ajudando os usuários a encontrar ofertas de seu interesse.
- **Consulta ao perfil do produtor:** desenvolvimento da visualização dos perfis dos produtores, permitindo que os usuários acessem informações sobre quem está por trás dos produtos e experiências apresentados na plataforma.
- **Contato direto com produtores:** desenvolvimento do recurso que permite aos usuários entrar em contato diretamente com os produtores, facilitando a comunicação e reduzindo a dependência de intermediários na interação entre as partes.

Essas funcionalidades complementam os recursos desenvolvidos nas iterações anteriores. Enquanto as etapas anteriores estabeleceram os cadastros de produtos, produtores e experiências, esta iteração avançou na disponibilização dessas informações para consulta e descoberta pelos usuários.

Com isso, a plataforma evolui como um ambiente de aproximação entre consumidores e produtores locais, facilitando o acesso às ofertas da região, ampliando a visibilidade dos participantes da Rede Cafuringa e contribuindo para a divulgação da produção e das experiências locais.

---

## Evidências

### Verificação e Validação

??? info "Funcionalidades Desenvolvidas na Iteração"

    A tabela relaciona as funcionalidades trabalhadas nesta etapa às respectivas histórias de usuário.

    | HU | Funcionalidade | Descrição |
    |---|---|---|
    | [HU24](../historias/HU24.md) | Consultar catálogo de experiências | Visualização das experiências cadastradas e oferecidas na Rede Cafuringa. |
    | [HU36](../historias/HU36.md) | Buscar ofertas | Busca por ofertas disponibilizadas na plataforma, facilitando sua localização pelos usuários. |
    | [HU14](../historias/HU14.md) | Consultar perfil de produtor | Acesso às informações dos produtores cadastrados na plataforma. |
    | [HU39](../historias/HU39.md) | Disponibilizar contato direto | Comunicação direta entre usuários e produtores da plataforma. |

    Na HU39, o contato pelo WhatsApp aparece no detalhe do produto, da experiência e no perfil público só quando o produtor autoriza a divulgação do número, e só usuários autenticados iniciam a conversa (RN17). A mesma entrega corrigiu o redirect pós-login para a página principal e, após a revisão do PR, o contato no modo de demonstração do frontend. Evidências: [PR #77](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/pull/77) e a seção Evidências da [HU39](../historias/HU39.md).

    O desenvolvimento dessas funcionalidades também contou com a estrutura técnica e as orientações descritas no [Guia do Backend — Estrutura de pastas e TDD](../arquitetura/backend/guia-estrutura-e-tdd.md). As práticas de integração e validação do projeto estão documentadas na [Visão Geral de Engenharia](../arquitetura/engenharia/visao-geral.md).

??? info "Validação da HU24"

    O catálogo de experiências (HU24) foi conferido critério a critério com testes automatizados (E2E do backend e testes do app, incluindo acessibilidade com axe) e com teste manual no ambiente Docker usando a API real, em celular, tablet e computador. O desempenho em conexão limitada (RNF06) foi medido com Lighthouse em 3G. O código está no [PR #78](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/pull/78) e as capturas e commits estão na seção Evidências da [HU24](../historias/HU24.md#evidencias).

### Organização e Atualização

??? info "Revisão e Refinamento dos Requisitos"

    Durante a Iteração 8, não foram identificadas necessidades de alteração nos requisitos definidos para as funcionalidades planejadas. Dessa forma, as histórias de usuário e seus critérios foram mantidos, concentrando-se o trabalho no desenvolvimento dos fluxos previstos.

---

## Vídeos Comprobatórios

O vídeo a seguir registra uma reunião de alinhamento do grupo, documentando as atividades de comunicação e organização entre os integrantes durante o desenvolvimento do projeto.

<iframe width="800" height="450" src="https://www.youtube.com/embed/SVerI_gHiyw" title="Reunião de alinhamento do Grupo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>