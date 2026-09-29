A definição dos requisitos funcionais que compõem o MVP foi realizada a partir da análise da matriz 4 × 4, considerando não apenas a relação entre valor de negócio e esforço técnico, mas também as dependências entre funcionalidades, os objetivos do projeto, a necessidade de estabelecer fluxos de uso completos e a capacidade de implementação da equipe.

O MVP foi estruturado de forma a representar o núcleo de valor da Rede Cafuringa, permitindo que produtores disponibilizem seus produtos e experiências e que consumidores e visitantes possam conhecer essas ofertas, consultar suas informações, entrar em contato com os produtores e demonstrar interesse em experiências por meio de uma pré-reserva.

Dessa forma, foram priorizados os requisitos necessários para formar um fluxo minimamente completo, enquanto funcionalidades complementares ou de maior esforço foram mantidas para etapas posteriores ou tiveram seu escopo reduzido.

## 5.1 RFs selecionados para o MVP

| Código   | Requisito                            | Valor | Esforço | Justificativa para o MVP                                                                                                                                                                      |
| -------- | ------------------------------------ | ----: | ------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF01** | Cadastrar perfil de consumidor       |     4 |       1 | Permite identificar o consumidor e estabelecer sua participação nos fluxos autenticados da plataforma.                                                                                        |
| **RF02** | Cadastrar perfil de produtor         |     4 |       1 | É necessário para representar os produtores e associar produtos e experiências às suas informações.                                                                                           |
| **RF03** | Cadastrar usuário admin              |     4 |       1 | Permite estabelecer a gestão administrativa da plataforma desde a primeira versão.                                                                                                            |
| **RF04** | Consultar usuários cadastrados       |     4 |       2 | Fornece ao administrador uma visão básica dos usuários e apoia a manutenção da plataforma.                                                                                                    |
| **RF09** | Autenticar usuário                   |     4 |       2 | É uma dependência dos fluxos que exigem identificação do usuário e controle de acesso.                                                                                                        |
| **RF10** | Recuperar acesso à conta             |     4 |       2 | Garante a continuidade de acesso à plataforma quando o usuário perde suas credenciais, evitando bloqueio dos fluxos autenticados do MVP.                                                     |
| **RF12** | Registrar trajetória do produtor     |     4 |       1 | Registrar trajetória do produtor | 4 | 1 | Contribui para apresentar a identidade, a história e a experiência do produtor, fortalecendo sua valorização e contextualizando as ofertas disponibilizadas na plataforma.                                                                                                        |
| **RF14** | Consultar perfil de produtor         |     4 |       2 | Permite conhecer os produtores e relacionar suas informações às ofertas disponíveis.                                                                                                          |
| **RF17** | Cadastrar produto                    |     4 |       2 | É um dos principais mecanismos para disponibilizar a produção da agricultura familiar na plataforma.                                                                                          |
| **RF21** | Consultar catálogo de produtos       |     4 |       2 | Permite aos consumidores conhecerem os produtos disponibilizados pelos produtores.                                                                                                            |
| **RF22** | Consultar detalhes do produto        |     4 |       2 | Complementa a consulta do catálogo, fornecendo informações necessárias para avaliar uma oferta.                                                                                               |
| **RF23** | Cadastrar experiência                |     4 |       2 | Representa o eixo de turismo rural e permite disponibilizar as experiências oferecidas pelos produtores.                                                                                      |
| **RF25** | Consultar experiência                |     4 |       2 | Permite aos visitantes conhecerem as experiências disponíveis na Rede Cafuringa.                                                                                                              |
| **RF36** | Buscar ofertas                       |     4 |       3 | É importante para conectar usuários às ofertas. Para o MVP, pode ser implementada inicialmente com busca simplificada por termos e categorias.                                                |
| **RF39** | Disponibilizar contato direto        |     4 |       4 | Apesar do esforço elevado, é diretamente relacionado ao objetivo de aproximar produtores de consumidores e visitantes. Para o MVP, o escopo pode ser reduzido a uma forma simples de contato. |
| **RF44** | Solicitar pré-reserva de experiência |     4 |       3 | Permite validar o fluxo de interesse e agendamento de experiências, constituindo parte importante do eixo de turismo rural.                                                                   |
| **RF45** | Consultar pré-reserva                |     3 |       2 | É necessário para que os envolvidos acompanhem as solicitações realizadas.                                                                                                                    |
| **RF46** | Cancelar solicitação de pré-reserva  |     4 |       2 | Completa o controle básico da solicitação por parte do visitante.                                                                                                                             |
| **RF47** | Responder pré-reserva de experiência |     4 |       3 | Completa o fluxo de pré-reserva ao permitir que o responsável pela experiência aceite ou rejeite a solicitação.                                                                               |
| **RF48** | Notificar alteração de pré-reserva   |     4 |       3 | Mantém visitante e responsável informados sobre mudanças no estado da pré-reserva, completando o fluxo básico de acompanhamento e reduzindo a necessidade de consultas manuais.                                                                               |

## 5.2 Fluxos contemplados pelo MVP

A seleção dos requisitos permite estabelecer três fluxos principais.

### Fluxo 1 — Cadastro e disponibilização de ofertas

O produtor poderá:

**Cadastrar-se → acessar a plataforma → possuir seu perfil → cadastrar produtos e experiências → disponibilizar essas ofertas para consulta.**

Esse fluxo é sustentado principalmente pelos:

* **RF02 — Cadastrar perfil de produtor**
* **RF09 — Autenticar usuário**
* **RF14 — Consultar perfil de produtor**
* **RF17 — Cadastrar produto**
* **RF23 — Cadastrar experiência**

### Fluxo 2 — Descoberta de produtos e experiências

O consumidor ou visitante poderá:

**Cadastrar-se → autenticar-se → buscar ofertas → consultar catálogo → visualizar detalhes → conhecer o produtor → entrar em contato.**

Esse fluxo utiliza:

* **RF01 — Cadastrar perfil de consumidor**
* **RF09 — Autenticar usuário**
* **RF14 — Consultar perfil de produtor**
* **RF21 — Consultar catálogo de produtos**
* **RF22 — Consultar detalhes do produto**
* **RF25 — Consultar experiência**
* **RF36 — Buscar ofertas**
* **RF39 — Disponibilizar contato direto**

### Fluxo 3 — Interesse e pré-reserva de experiência

Para o turismo rural, o MVP deverá permitir:

**Consultar experiência → solicitar pré-reserva → acompanhar solicitação → responsável responder → visitante cancelar, quando necessário.**

Esse fluxo é composto por:

* **RF23 — Cadastrar experiência**
* **RF25 — Consultar experiência**
* **RF44 — Solicitar pré-reserva de experiência**
* **RF45 — Consultar pré-reserva**
* **RF46 — Cancelar solicitação de pré-reserva**
* **RF47 — Responder pré-reserva de experiência**

Assim, o MVP não fica limitado à apresentação de informações. Ele permite testar a interação entre produtores, consumidores e visitantes, que constitui uma das principais hipóteses de valor da solução.

---

## 5.3 Tratamento dos RFs de maior esforço

A análise da matriz também identificou requisitos de alto valor de negócio que apresentam esforço técnico elevado. Esses requisitos não foram automaticamente excluídos do MVP.

O principal caso é o **RF39 — Disponibilizar contato direto**, classificado com valor de negócio 4 e esforço técnico 4. Embora esteja no quadrante de maior esforço, a funcionalidade possui relação direta com o objetivo de aproximar produtores e consumidores. Por isso, sua implementação no MVP deverá ocorrer com **escopo reduzido**, priorizando uma forma simples de contato, em vez de desenvolver inicialmente um sistema completo de comunicação interna.

O mesmo princípio será aplicado ao **RF36 — Buscar ofertas**, cujo esforço técnico foi classificado como alto. Para a primeira versão, a busca poderá possuir uma implementação simplificada, priorizando a localização das principais ofertas sem incorporar todos os mecanismos avançados de filtragem e localização.

Para o fluxo de pré-reserva, os requisitos **RF44** e **RF47** também possuem esforço elevado. Entretanto, ambos são necessários para que a funcionalidade não seja apenas uma tela de solicitação sem continuidade. Assim, o escopo inicial será concentrado no **envio, consulta, resposta e cancelamento da solicitação**, deixando mecanismos mais sofisticados para versões posteriores.

---

## 5.4 RFs não selecionados para o MVP

Os demais requisitos não foram descartados definitivamente. Eles foram classificados como funcionalidades de evolução da plataforma, considerando seu valor de negócio, esforço técnico, dependências ou caráter complementar.

| Grupo                                | Requisitos                   | Motivo geral                                                                                                                             |
| ------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Manutenção e administração**       | RF05, RF06, RF07, RF08       | Podem complementar os mecanismos administrativos e de manutenção após a validação do núcleo da solução.                                  |
| **Gestão de contas**                 | RF11                   | São importantes para uma versão mais completa, mas não são indispensáveis para validar os fluxos centrais.                               |
| **Manutenção de produtor e ofertas** | RF13, RF18, RF19, RF20 | Permitem maior autonomia e manutenção dos dados após a disponibilização inicial.                                                         |
| **Gestão de eventos**                | RF27, RF28, RF29, RF30       | O eixo de eventos amplia a plataforma, mas não é necessário para validar inicialmente os fluxos principais de produtos e experiências.   |
| **Funcionalidades complementares**   | RF16, RF26, RF32, RF33, RF34 | Agregam informação, manutenção ou divulgação, mas não são essenciais para o primeiro fluxo funcional.                                    |
| **Busca e interação avançada**       | RF38, RF40, RF41, RF42, RF43 | Podem aprimorar a descoberta, comunicação e avaliação das ofertas após a validação inicial.                                              |
| **Funcionalidades de maior esforço** | RF15, RF31, RF35, RF37       | Apresentam menor valor de negócio na primeira versão ou esforço técnico elevado em relação à necessidade de validação inicial.           |

---

## 5.5 Síntese da definição do MVP

Dessa forma, o MVP será composto por 17 requisitos funcionais, selecionados para garantir que a solução apresente um fluxo de uso coerente e seja capaz de validar as principais hipóteses do projeto.

A composição prioriza o núcleo formado por:

**cadastro e autenticação → perfil do produtor → produtos e experiências → consulta e busca → contato → pré-reserva.**

A seleção também demonstra que o MVP não foi definido exclusivamente pelos requisitos de menor esforço. Requisitos como **RF36 — Buscar ofertas**, **RF39 — Disponibilizar contato direto**, **RF44 — Solicitar pré-reserva de experiência** e **RF47 — Responder pré-reserva de experiência** apresentam esforço técnico elevado, mas foram mantidos devido à sua contribuição para os objetivos centrais da solução.

Por outro lado, funcionalidades como mapa, localização por proximidade, agente de IA, certificação, feedback e notificações foram mantidas para evoluções posteriores, permitindo que a equipe concentre os recursos disponíveis na validação do núcleo do produto.

> **Assim, o MVP proposto representa uma versão mínima, porém funcional, da Rede Cafuringa, capaz de conectar produtores às suas ofertas e permitir que consumidores e visitantes descubram produtos e experiências, estabeleçam contato e iniciem o processo de pré-reserva. A implementação das funcionalidades complementares poderá ocorrer posteriormente, a partir dos resultados obtidos na validação da primeira versão.**
