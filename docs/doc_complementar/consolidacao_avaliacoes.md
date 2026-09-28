
Após a avaliação individual dos requisitos, os resultados foram consolidados pela equipe com o objetivo de estabelecer uma visão única sobre o valor de negócio e o esforço técnico associado a cada requisito.

A consolidação considera as avaliações de **Esforço (E)**, **Complexidade (C)** e **Lacuna de Capacidade (L)**. O **Esforço Técnico Consolidado (ET)** é obtido por meio da média aritmética desses três critérios:

\[
ET = \frac{E + C + L}{3}
\]

O resultado é apresentado inicialmente em escala decimal e, posteriormente, arredondado para uma escala inteira de 1 a 4, conforme os níveis definidos anteriormente. Dessa forma, quanto maior o valor de ET, maior é o esforço técnico relativo esperado para implementação do requisito.

As avaliações não foram realizadas apenas com base no nome dos requisitos. Para cada item, foram considerados sua descrição, finalidade, dependências, contexto de uso e as condições técnicas necessárias para sua implementação. A consolidação permite, portanto, comparar os requisitos de forma padronizada e fornece uma base objetiva para as etapas posteriores de priorização e definição do MVP.

## 3.1 Requisitos Funcionais

| Código | Requisito | Esforço (E) | Complexidade (C) | Lacuna de Capacidade (L) | Esforço Técnico (ET) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| RF01 | Cadastrar perfil de consumidor | 2 | 1 | 1 | 1,3 → 1 |
| RF02 | Cadastrar perfil de produtor | 2 | 1 | 1 | 1,3 → 1 |
| RF03 | Cadastrar usuário admin | 2 | 1 | 1 | 1,3 → 1 |
| RF04 | Consultar usuários cadastrados | 2 | 2 | 1 | 1,7 → 2 |
| RF05 | Desativar usuário | 1 | 2 | 1 | 1,3 → 1 |
| RF06 | Consultar conteúdos cadastrados | 2 | 3 | 1 | 2,0 → 2 |
| RF07 | Remover conteúdo inadequado | 2 | 3 | 1 | 2,0 → 2 |
| RF08 | Atualizar informações institucionais | 1 | 1 | 1 | 1,0 → 1 |
| RF09 | Autenticar usuário | 2 | 3 | 2 | 2,3 → 2 |
| RF10 | Recuperar acesso à conta | 2 | 3 | 1 | 2,0 → 2 |
| RF11 | Excluir conta | 2 | 3 | 1 | 2,0 → 2 |
| RF12 | Registrar trajetória do produtor | 1 | 2 | 1 | 1,3 → 1 |
| RF13 | Atualizar perfil de produtor | 2 | 2 | 1 | 1,7 → 2 |
| RF14 | Consultar perfil de produtor | 2 | 2 | 1 | 1,7 → 2 |
| RF15 | Informar certificação | 2 | 4 | 3 | 3,0 → 3 |
| RF16 | Preencher questionário do produtor | 2 | 3 | 3 | 2,7 → 3 |
| RF17 | Cadastrar produto | 2 | 2 | 1 | 1,7 → 2 |
| RF18 | Atualizar produto | 2 | 2 | 1 | 1,7 → 2 |
| RF19 | Excluir produto | 1 | 2 | 1 | 1,3 → 1 |
| RF20 | Informar disponibilidade de produto | 2 | 3 | 1 | 2,0 → 2 |
| RF21 | Consultar catálogo de produtos | 2 | 2 | 1 | 1,7 → 2 |
| RF22 | Consultar detalhes do produto | 2 | 2 | 1 | 1,7 → 2 |
| RF23 | Cadastrar experiência | 2 | 2 | 2 | 2,0 → 2 |
| RF24 | Atualizar experiência | 2 | 2 | 2 | 2,0 → 2 |
| RF25 | Consultar experiência | 2 | 3 | 2 | 2,3 → 2 |
| RF26 | Excluir experiência | 1 | 2 | 1 | 1,3 → 1 |
| RF27 | Cadastrar evento | 2 | 2 | 2 | 2,0 → 2 |
| RF28 | Atualizar evento | 2 | 2 | 1 | 1,7 → 2 |
| RF29 | Consultar evento | 1 | 2 | 1 | 1,3 → 1 |
| RF30 | Excluir evento | 1 | 2 | 1 | 1,3 → 1 |
| RF31 | Auxiliar cadastro de atividade | 4 | 4 | 4 | 4,0 → 4 |
| RF32 | Apresentar informações da Cafuringa | 1 | 1 | 1 | 1,0 → 1 |
| RF33 | Consultar guia de boas práticas | 1 | 2 | 2 | 1,7 → 2 |
| RF34 | Notificar eventos | 3 | 3 | 3 | 3,0 → 3 |
| RF35 | Visualizar ofertas no mapa | 4 | 4 | 2 | 3,3 → 3 |
| RF36 | Buscar ofertas | 3 | 3 | 2 | 2,7 → 3 |
| RF37 | Buscar locais por proximidade | 4 | 3 | 4 | 3,7 → 4 |
| RF38 | Filtrar resultados de busca | 2 | 3 | 2 | 2,3 → 2 |
| RF39 | Disponibilizar contato direto | 4 | 4 | 4 | 4,0 → 4 |
| RF40 | Enviar feedback ao fornecedor | 3 | 3 | 2 | 2,7 → 3 |
| RF41 | Visualizar feedback | 2 | 2 | 1 | 1,7 → 2 |
| RF42 | Editar feedback | 1 | 2 | 1 | 1,3 → 1 |
| RF43 | Excluir feedback ao fornecedor | 1 | 2 | 2 | 1,7 → 2 |
| RF44 | Solicitar pré-reserva de experiência | 4 | 3 | 3 | 3,3 → 3 |
| RF45 | Consultar pré-reserva | 2 | 2 | 2 | 2,0 → 2 |
| RF46 | Cancelar solicitação de pré-reserva | 2 | 3 | 2 | 2,3 → 2 |
| RF47 | Responder pré-reserva de experiência | 3 | 3 | 3 | 3,0 → 3 |
| RF48 | Notificar alteração de pré-reserva | 3 | 4 | 3 | 3,3 → 3 |

## 3.2 Requisitos Não Funcionais

| Código | Requisito | Esforço (E) | Complexidade (C) | Lacuna de Capacidade (L) | Esforço Técnico (ET) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| RNF01 | Eficiência de navegação | 2 | 2 | 1 | 1,7 → 2 |
| RNF02 | Desempenho na execução de tarefas | 2 | 2 | 1 | 1,7 → 2 |
| RNF03 | Prevenção e recuperação de erros | 2 | 2 | 1 | 1,7 → 2 |
| RNF04 | Acessibilidade digital | 3 | 3 | 2 | 2,7 → 3 |
| RNF05 | Responsividade da interface | 2 | 2 | 1 | 1,7 → 2 |
| RNF06 | Desempenho em conectividade limitada | 3 | 3 | 2 | 2,7 → 3 |
| RNF07 | Resiliência à perda de conexão | 3 | 3 | 2 | 2,7 → 3 |
| RNF08 | Controle de acesso por perfil | 3 | 3 | 2 | 2,7 → 3 |
| RNF09 | Privacidade do feedback | 2 | 2 | 1 | 1,7 → 2 |
| RNF10 | Proteção da comunicação | 2 | 2 | 1 | 1,7 → 2 |
| RNF11 | Proteção de dados pessoais | 3 | 3 | 2 | 2,7 → 3 |
| RNF12 | Compatibilidade entre navegadores | 2 | 2 | 1 | 1,7 → 2 |
| RNF13 | Baixo custo operacional | 2 | 2 | 1 | 1,7 → 2 |
| RNF14 | Disponibilização como aplicação web progressiva | 3 | 3 | 2 | 2,7 → 3 |

## 3.3 Síntese da consolidação

A consolidação evidencia diferentes níveis de esforço técnico entre os requisitos. Os itens classificados com **ET = 1** apresentam menor esforço relativo, enquanto aqueles com **ET = 4** demandam maior esforço, complexidade ou conhecimento técnico para implementação.

Essa classificação não representa, isoladamente, a prioridade de implementação. O esforço técnico será posteriormente analisado em conjunto com o **valor de negócio**, permitindo identificar os requisitos que apresentam maior contribuição para o produto em relação ao esforço necessário para sua implementação. Essa análise servirá de base para a construção da matriz de priorização e para a definição do escopo do MVP.