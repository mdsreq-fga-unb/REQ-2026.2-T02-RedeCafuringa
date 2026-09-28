
Os requisitos não funcionais foram analisados separadamente dos requisitos funcionais, considerando que seu papel está relacionado às condições de qualidade, segurança, operação e utilização da solução. Dessa forma, um RNF não precisa necessariamente apresentar alto valor de negócio de forma isolada para fazer parte do MVP.

A classificação considerou sua relação com os RFs selecionados, sua necessidade para garantir uma operação mínima da plataforma e a possibilidade de evolução em versões posteriores.

## 6.1 Classificação dos RNFs

| Código    | Requisito                                       | Classificação                | Justificativa                                                                                                                                                                                                                                      |
| --------- | ----------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RNF01** | Eficiência de navegação                         | **Associado aos RFs do MVP** | Está diretamente relacionado aos fluxos de cadastro, consulta de produtos e experiências, busca e pré-reserva. Uma navegação minimamente eficiente é necessária para que esses fluxos possam ser utilizados.                                       |
| **RNF02** | Desempenho na execução de tarefas               | **Associado aos RFs do MVP** | Aplica-se aos principais fluxos da solução, especialmente cadastro, consulta, busca e pré-reserva. O MVP deverá apresentar desempenho suficiente para a execução dessas operações, enquanto otimizações adicionais poderão ocorrer posteriormente. |
| **RNF03** | Prevenção e recuperação de erros                | **Obrigatório para o MVP**   | É necessário para evitar falhas durante os principais fluxos e orientar o usuário quando ocorrerem entradas inválidas ou problemas durante a execução das operações.                                                                               |
| **RNF04** | Acessibilidade digital                          | **Obrigatório para o MVP**   | Deve ser considerada desde a construção da interface para garantir que a solução possa ser utilizada por pessoas com diferentes necessidades.                                                                                                      |
| **RNF05** | Responsividade da interface                     | **Obrigatório para o MVP**   | É necessária para garantir a utilização dos principais fluxos em diferentes tamanhos de tela, especialmente considerando o acesso por dispositivos móveis.                                                                                         |
| **RNF06** | Desempenho em conectividade limitada            | **Obrigatório para o MVP**   | Está diretamente relacionado ao contexto rural da Rede Cafuringa, no qual podem ocorrer condições de conexão limitada. O sistema deve manter uma experiência mínima de utilização nessas condições.                                                |
| **RNF07** | Resiliência à perda de conexão                  | **Associado aos RFs do MVP** | Possui relação principalmente com cadastros, preenchimento de informações e solicitações de pré-reserva, reduzindo o risco de perda de dados durante esses fluxos.                                                                                 |
| **RNF08** | Controle de acesso por perfil                   | **Obrigatório para o MVP**   | É necessário para diferenciar as permissões de consumidores, produtores e administradores e impedir operações incompatíveis com cada perfil.                                                                                                       |
| **RNF09** | Privacidade do feedback                         | **Não aplicável ao MVP**     | O mecanismo de feedback não foi selecionado para a primeira versão. Portanto, o requisito poderá ser tratado quando as funcionalidades de feedback forem incorporadas.                                                                             |
| **RNF10** | Proteção da comunicação                         | **Obrigatório para o MVP**   | A comunicação entre usuários e plataforma deve ser protegida, especialmente nos fluxos de autenticação, cadastro e interação com dados da plataforma.                                                                                              |
| **RNF11** | Proteção de dados pessoais                      | **Obrigatório para o MVP**   | Está relacionado ao tratamento dos dados pessoais dos usuários e, portanto, deve ser considerado desde a concepção e implementação da solução.                                                                                                     |
| **RNF12** | Compatibilidade entre navegadores               | **Evolutivo**                | O MVP deverá ser validado nos ambientes de acesso definidos pela equipe, mas a ampliação da compatibilidade para diferentes navegadores e versões poderá ocorrer progressivamente.                                                                 |
| **RNF13** | Baixo custo operacional                         | **Obrigatório para o MVP**   | Está relacionado à sustentabilidade da solução e à capacidade da Rede Cafuringa de manter a plataforma sem custos recorrentes incompatíveis com seu contexto.                                                                                      |
| **RNF14** | Disponibilização como aplicação web progressiva | **Evolutivo**                | A aplicação poderá funcionar inicialmente como uma aplicação web responsiva. Recursos específicos de PWA podem ser incorporados posteriormente sem impedir a validação do núcleo do produto.                                                       |

---

## 6.2 RNFs obrigatórios para o MVP

Os seguintes requisitos serão considerados condições obrigatórias da primeira versão:

* **RNF03 — Prevenção e recuperação de erros**
* **RNF04 — Acessibilidade digital**
* **RNF05 — Responsividade da interface**
* **RNF06 — Desempenho em conectividade limitada**
* **RNF08 — Controle de acesso por perfil**
* **RNF10 — Proteção da comunicação**
* **RNF11 — Proteção de dados pessoais**
* **RNF13 — Baixo custo operacional**

Esses requisitos não serão tratados como funcionalidades independentes do MVP. Eles deverão ser considerados restrições e critérios de qualidade durante a implementação dos RFs selecionados.

Por exemplo, o cadastro de um produtor não será considerado concluído apenas porque o usuário consegue preencher e enviar um formulário. O fluxo também deverá respeitar as condições mínimas de acessibilidade, responsividade, proteção dos dados, controle de acesso e tratamento de erros estabelecidas pelos RNFs correspondentes.

---

## 6.3 RNFs associados aos RFs do MVP

Alguns RNFs possuem relação direta com determinados fluxos funcionais e deverão ser considerados durante sua implementação:

| RNF                                           | RFs principalmente relacionados                |
| --------------------------------------------- | ---------------------------------------------- |
| **RNF01 — Eficiência de navegação**           | RF14, RF21, RF22, RF25, RF36, RF44, RF45       |
| **RNF02 — Desempenho na execução de tarefas** | RF01, RF02, RF09, RF17, RF21, RF23, RF36, RF44 |
| **RNF07 — Resiliência à perda de conexão**    | RF01, RF02, RF17, RF23, RF44, RF45, RF46, RF47 |

Essa associação não significa que os RNFs estejam restritos exclusivamente a esses requisitos. Ela indica os fluxos em que sua aplicação possui maior impacto durante a construção do MVP.

---

## 6.4 RNFs evolutivos

Os requisitos classificados como evolutivos não serão ignorados. Eles serão considerados no planejamento da solução, porém poderão receber níveis mais avançados de implementação em entregas posteriores.

São eles:

* **RNF12 — Compatibilidade entre navegadores**
* **RNF14 — Disponibilização como aplicação web progressiva**

A compatibilidade básica necessária para a execução do MVP deverá ser garantida. Entretanto, a ampliação sistemática para diferentes navegadores e versões poderá ocorrer conforme a evolução da plataforma.

Da mesma forma, o MVP poderá ser disponibilizado como aplicação web responsiva, enquanto recursos específicos de uma aplicação web progressiva, como instalação e capacidades adicionais de funcionamento no dispositivo, poderão ser incorporados posteriormente.

---

## 6.5 RNF não aplicável ao MVP

O **RNF09 — Privacidade do feedback** foi classificado como não aplicável à primeira versão porque as funcionalidades relacionadas ao mecanismo de feedback (**RF40, RF41, RF42 e RF43**) não foram selecionadas para o MVP.

Isso não significa que a privacidade deixe de ser uma preocupação da solução. Pelo contrário, a proteção dos dados pessoais e das comunicações permanece obrigatória por meio dos **RNF10 e RNF11**. O RNF09 será incorporado quando o mecanismo específico de feedback for implementado.

---

## 6.6 Síntese

A análise dos RNFs demonstra que a qualidade do MVP não será determinada apenas pela quantidade de funcionalidades entregues. Os requisitos funcionais selecionados deverão ser implementados dentro das condições mínimas de segurança, privacidade, acessibilidade, responsividade, confiabilidade, desempenho e sustentabilidade operacional estabelecidas pelos requisitos não funcionais obrigatórios.

Assim, os RNFs obrigatórios e aqueles associados aos RFs selecionados integram o escopo do MVP, mesmo não tendo sido posicionados individualmente na matriz 4 × 4.

Essa abordagem evita que requisitos essenciais sejam postergados apenas por não representarem uma funcionalidade diretamente perceptível pelo usuário. Ao mesmo tempo, permite que características evolutivas, como PWA e ampliação da compatibilidade entre navegadores, sejam desenvolvidas progressivamente sem comprometer a validação inicial da solução.

> **Dessa forma, o MVP da Rede Cafuringa será constituído não apenas pelos RFs selecionados, mas também pelas condições não funcionais necessárias para que esses requisitos possam ser utilizados de maneira segura, acessível, responsiva e adequada ao contexto rural do projeto.**
