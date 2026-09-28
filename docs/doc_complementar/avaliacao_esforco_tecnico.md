A avaliação do esforço técnico foi realizada pela equipe de desenvolvimento a partir da análise individual dos requisitos funcionais e não funcionais. O objetivo foi estimar o impacto de cada requisito sobre a implementação, considerando não apenas o tempo necessário para sua execução, mas também o nível de complexidade envolvido e a capacidade da equipe para realizar a atividade.

Foram considerados três critérios:

- **Esforço:** representa a quantidade estimada de trabalho necessária para implementar o requisito;
- **Complexidade:** representa o nível de dificuldade técnica, dependências e incertezas envolvidas na implementação;
- **Lacuna de capacidade:** representa o quanto a equipe precisa adquirir ou desenvolver novos conhecimentos para implementar o requisito.

A avaliação foi realizada em uma escala de **1 a 4**, na qual valores maiores representam maior esforço, maior complexidade ou maior lacuna de capacidade.

## 2.1 Escala de esforço

O esforço representa a quantidade estimada de trabalho necessária para implementar cada requisito.

| Pontuação | Interpretação | Descrição |
|---|---|---|
| **1** | Esforço baixo | Até 2 horas |
| **2** | Esforço moderado | Entre 2 e 6 horas |
| **3** | Esforço alto | Entre 6 e 12 horas |
| **4** | Esforço muito alto | Mais de 12 horas |

A estimativa considera o trabalho necessário para implementar o requisito dentro do contexto do projeto, incluindo desenvolvimento e atividades técnicas diretamente relacionadas à sua implementação.

## 2.2 Escala de complexidade

A complexidade considera as características técnicas do requisito, incluindo dependências, integrações, regras de negócio e possíveis incertezas durante a implementação.

| Pontuação | Interpretação |
|---|---|
| **1** | Utiliza solução conhecida, com poucas dependências |
| **2** | Exige alguma investigação ou integração |
| **3** | Possui várias dependências ou incertezas técnicas |
| **4** | Apresenta elevada incerteza, integração crítica ou tecnologia não dominada |

## 2.3 Escala de capacidade da equipe

Para manter todas as dimensões orientadas no mesmo sentido, foi utilizada a lacuna de capacidade, representando a necessidade de aquisição ou desenvolvimento de conhecimentos pela equipe.

| Pontuação | Interpretação |
|---|---|
| **1** | A equipe domina plenamente os conhecimentos necessários |
| **2** | A equipe possui conhecimento suficiente, com pouca aprendizagem adicional |
| **3** | A equipe precisa desenvolver conhecimentos relevantes |
| **4** | A equipe ainda não possui os conhecimentos ou recursos necessários |

## 2.4 Consolidação do esforço técnico

Após a atribuição das pontuações, os três critérios foram consolidados por meio da média aritmética:

\[
ET = \frac{E + C + L}{3}
\]

onde:

- **ET** = Esforço Técnico;
- **E** = Esforço;
- **C** = Complexidade;
- **L** = Lacuna de capacidade.

O resultado foi posteriormente convertido para a escala de 1 a 4, utilizada na matriz de priorização. Para isso, foi realizado arredondamento para o inteiro mais próximo, mantendo os valores dentro do intervalo de 1 a 4.

## 2.5 Resultado da avaliação

A aplicação desse procedimento resultou nas avaliações apresentadas nas tabelas a seguir.

## Requisitos Funcionais

| Código | Requisito | Esforço | Complexidade | Capacidade |
| ----- | ----- | ----- | ----- | ----- |
| RF01 | Cadastrar perfil de consumidor | 2 | 1 | 1 |
| RF02 | Cadastrar perfil de produtor | 2 | 1 | 1 |
| RF03 | Cadastrar usuário admin | 2 | 1 | 1 |
| RF04 | Consultar usuários cadastrados | 2 | 2 | 1 |
| RF05 | Desativar usuário | 1 | 2 | 1 |
| RF06 | Consultar conteúdos cadastrados | 2 | 3 | 1 |
| RF07 | Remover conteúdo inadequado | 2 | 3 | 1 |
| RF08 | Atualizar informações institucionais | 1 | 1 | 1 |
| RF09 | Autenticar usuário | 2 | 3 | 2 |
| RF10 | Recuperar acesso à conta | 2 | 3 | 1 |
| RF11 | Excluir conta | 2 | 3 | 1 |
| RF12 | Registrar trajetória do produtor | 1 | 2 | 1 |
| RF13 | Atualizar perfil de produtor | 2 | 2 | 1 |
| RF14 | Consultar perfil de produtor | 2 | 2 | 1 |
| RF15 | Informar certificação | 2 | 4 | 3 |
| RF16 | Preencher questionário do produtor | 2 | 3 | 3 |
| RF17 | Cadastrar produto | 2 | 2 | 1 |
| RF18 | Atualizar produto | 2 | 2 | 1 |
| RF19 | Excluir produto | 1 | 2 | 1 |
| RF20 | Informar disponibilidade de produto | 2 | 3 | 1 |
| RF21 | Consultar catálogo de produtos | 2 | 2 | 1 |
| RF22 | Consultar detalhes do produto | 2 | 2 | 1 |
| RF23 | Cadastrar experiência | 2 | 2 | 2 |
| RF24 | Atualizar experiência | 2 | 2 | 2 |
| RF25 | Consultar experiência | 2 | 3 | 2 |
| RF26 | Excluir experiência | 1 | 2 | 1 |
| RF27 | Cadastrar evento | 2 | 2 | 2 |
| RF28 | Atualizar evento | 2 | 2 | 1 |
| RF29 | Consultar evento | 1 | 2 | 1 |
| RF30 | Excluir evento | 1 | 2 | 1 |
| RF31 | Auxiliar cadastro de atividade | 4 | 4 | 4 |
| RF32 | Apresentar informações da Cafuringa | 1 | 1 | 1 |
| RF33 | Consultar guia de boas práticas | 1 | 2 | 2 |
| RF34 | Notificar eventos | 3 | 3 | 3 |
| RF35 | Visualizar ofertas no mapa | 4 | 4 | 2 |
| RF36 | Buscar ofertas | 3 | 3 | 2 |
| RF37 | Buscar locais por proximidade | 4 | 3 | 4 |
| RF38 | Filtrar resultados de busca | 2 | 3 | 2 |
| RF39 | Disponibilizar contato direto | 4 | 4 | 4 |
| RF40 | Enviar feedback ao fornecedor | 3 | 3 | 2 |
| RF41 | Visualizar feedback | 2 | 2 | 1 |
| RF42 | Editar feedback | 1 | 2 | 1 |
| RF43 | Excluir feedback ao fornecedor | 1 | 2 | 2 |
| RF44 | Solicitar pré-reserva de experiência | 4 | 3 | 3 |
| RF45 | Consultar pré-reserva | 2 | 2 | 2 |
| RF46 | Cancelar solicitação de pré-reserva | 2 | 3 | 2 |
| RF47 | Responder pré-reserva de experiência | 3 | 3 | 3 |
| RF48 | Notificar alteração de pré-reserva | 3 | 4 | 3 |

## Requisitos Não Funcionais

| Código | Requisito | Esforço (E) | Complexidade (C) | Capacidade (L) |
| ----- | ----- | ----- | ----- | ----- |
| RNF01 | Eficiência de navegação | 2 | 2 | 1 |
| RNF02 | Desempenho na execução de tarefas | 2 | 2 | 1 |
| RNF03 | Prevenção e recuperação de erros | 2 | 2 | 1 |
| RNF04 | Acessibilidade digital | 3 | 3 | 2 |
| RNF05 | Responsividade da interface | 2 | 2 | 1 |
| RNF06 | Desempenho em conectividade limitada | 3 | 3 | 2 |
| RNF07 | Resiliência à perda de conexão | 3 | 3 | 2 |
| RNF08 | Controle de acesso por perfil | 3 | 3 | 2 |
| RNF09 | Privacidade do feedback | 2 | 2 | 1 |
| RNF10 | Proteção da comunicação | 2 | 2 | 1 |
| RNF11 | Proteção de dados pessoais | 3 | 3 | 2 |
| RNF12 | Compatibilidade entre navegadores | 2 | 2 | 1 |
| RNF13 | Baixo custo operacional | 2 | 2 | 1 |
| RNF14 | Disponibilização como aplicação web progressiva | 3 | 3 | 2 |

## 2.6 Considerações sobre a avaliação

A avaliação do esforço técnico deve ser entendida como uma estimativa relativa para apoiar a priorização, e não como uma previsão exata do tempo de desenvolvimento. Os valores podem ser revisados caso surjam novas informações técnicas, alterações de escopo ou mudanças na composição e no domínio de conhecimento da equipe.

Além disso, a pontuação de esforço técnico não determina isoladamente a prioridade de um requisito. Um requisito pode apresentar esforço elevado e ainda assim ser mantido no MVP quando possuir contribuição significativa para os objetivos do projeto. Da mesma forma, um requisito de baixo esforço não será necessariamente priorizado caso apresente baixo valor de negócio ou não contribua para a formação de um fluxo funcional completo.

Os resultados dessa avaliação serão utilizados posteriormente na **matriz 4 × 4**, em conjunto com o valor de negócio atribuído aos requisitos, servindo como subsídio para a definição do escopo do MVP.