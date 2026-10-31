

# HU08 — Atualizar informações institucionais

## 1. Identificação

| Campo | Informação |
|---|---|
| **ID da História** | HU08 |
| **Requisito Funcional** | [RF08 — Atualizar informações institucionais](../requisitos_software.md#71-requisitos-funcionais) |
| **Requisito Não Funcional** | [RNF03, RNF07, RNF08](../requisitos_software.md#72-requisitos-nao-funcionais) |
| **Regra de Negócio** | [RN03, RN13](../requisitos_software.md#74-lista-de-regras-de-negocio) |
| **Característica de Produto** | [CP3](../solucao.md#23-caracteristicas-do-produto) |
| **Objetivos Específicos** | [OE2](../solucao.md#22-objetivos-especificos-oe-do-produto) |
| **Prioridade** | Baixa |

---

## 2. História de Usuário

*Como administrador, quero atualizar as informações institucionais da Rede Cafuringa, para manter os conteúdos informativos da plataforma corretos e atualizados.*

---

## 3. Critérios de Aceitação

**CA01 — Acesso à funcionalidade de atualização**

- **Dado** que estou autenticado na plataforma com um perfil de administrador, **quando** acessar o gerenciamento das informações institucionais, **então** o sistema deve disponibilizar a funcionalidade de atualização dessas informações.

**CA02 — Visualização das informações institucionais**

- **Dado** que estou na interface de gerenciamento das informações institucionais, **quando** acessar as informações cadastradas, **então** o sistema deve apresentar os conteúdos institucionais atualmente registrados na plataforma.

**CA03 — Edição das informações institucionais**

- **Dado** que estou na interface de gerenciamento das informações institucionais, **quando** selecionar uma informação para atualização, **então** o sistema deve permitir a edição do conteúdo selecionado.

**CA04 — Salvamento das alterações**

- **Dado** que realizei alterações em uma informação institucional, **quando** confirmar a atualização, **então** o sistema deve salvar as modificações e informar que a operação foi concluída com sucesso.

**CA05 — Atualização com dados inválidos**

- **Dado** que estou atualizando uma informação institucional, **quando** tentar salvar dados inválidos ou deixar de preencher informações obrigatórias, **então** o sistema deve impedir a atualização e apresentar uma mensagem indicando a necessidade de correção.

**CA06 — Restrição de acesso**

- **Dado** que estou autenticado com um perfil de consumidor ou produtor, **quando** tentar acessar ou executar a funcionalidade de atualização das informações institucionais, **então** o sistema deve impedir a operação.

**CA07 — Falha durante a atualização**

- **Dado** que estou realizando a atualização de uma informação institucional, **quando** ocorrer uma falha de conexão durante a operação, **então** o sistema deve preservar os dados preenchidos sempre que possível e informar que a atualização não foi concluída.

**CA08 — Disponibilização das informações atualizadas**

- **Dado** que as informações institucionais foram atualizadas com sucesso, **quando** um usuário consultar os conteúdos institucionais da plataforma, **então** o sistema deve apresentar as informações atualizadas.

---

## 4. Relação com os Requisitos Não Funcionais

**RNF03 — Prevenção e Recuperação de Erros**

- Relação com a HU: Garante que o administrador receba mensagens claras durante o processo de atualização, incluindo orientações sobre dados inválidos e falhas no salvamento, permitindo identificar e corrigir problemas sem comprometer a operação.

**RNF07 — Resiliência à Perda de Conexão**

- Relação com a HU: Contribui para que os dados preenchidos durante a atualização não sejam automaticamente apagados em caso de perda de conexão, permitindo que o administrador recupere as informações inseridas e tente concluir a operação novamente.

**RNF08 — Controle de Acesso por Perfil**

- Relação com a HU: Contribui para que as funcionalidades sejam protegidas conforme as permissões dos perfis. Na atualização das informações institucionais, o acesso deve ser restrito ao administrador, impedindo que consumidores e produtores executem essa operação.

---

## 5. Relação com as Regras de Negócio

**RN03 — Gestão administrativa**

- Relação com a HU: Estabelece que consultas e intervenções administrativas sobre informações institucionais sejam realizadas exclusivamente por administradores, garantindo que a atualização dos conteúdos oficiais seja restrita aos usuários autorizados.

**RN13 — Informações institucionais e regionais**

- Relação com a HU: Determina a disponibilização de informações institucionais e regionais na plataforma. A atualização desses conteúdos permite manter as informações sobre a Rede Cafuringa e a região corretas e atualizadas para consulta dos usuários.

---

## 6. Relação com as Características de Produto

**CP3 — Divulgação e acesso à oferta local**

- Relação com a HU: A atualização das informações institucionais contribui para manter os conteúdos sobre a Rede Cafuringa e seu contexto regional corretos e atualizados, fortalecendo a comunicação da plataforma e apoiando a divulgação das iniciativas locais.

---

## 7. Relação com os Objetivos Específicos

**OE2 — Visibilidade e oferta local**

- Relação com a HU: A atualização das informações institucionais contribui para manter a apresentação da Rede Cafuringa e de seu contexto regional adequada e confiável. Dessa forma, a plataforma fortalece sua comunicação e oferece informações atualizadas aos consumidores, visitantes e demais interessados na oferta local.

---

## 8. Atividades Relacionadas

| ID | Atividade | Descrição |
|---|---|---|
| AT01 | Disponibilizar a funcionalidade de atualização | Implementar a opção de atualização das informações institucionais na interface de gerenciamento administrativo. |
| AT02 | Implementar consulta das informações | Permitir que o administrador visualize as informações institucionais atualmente cadastradas. |
| AT03 | Implementar edição das informações | Desenvolver a funcionalidade que permite ao administrador editar os conteúdos institucionais disponíveis. |
| AT04 | Implementar salvamento das alterações | Desenvolver a operação responsável por registrar as informações institucionais atualizadas. |
| AT05 | Implementar validação dos dados | Verificar os dados informados pelo administrador antes de permitir o salvamento das alterações. |
| AT06 | Aplicar controle de acesso | Garantir que somente usuários autenticados com perfil de administrador possam executar a funcionalidade. |
| AT07 | Implementar recuperação de dados | Aplicar medidas para evitar a perda automática dos dados preenchidos em caso de interrupção da conexão. |
| AT08 | Implementar mensagens de retorno | Informar o administrador sobre a conclusão da atualização ou a ocorrência de falhas durante a operação. |
| AT09 | Executar testes de atualização | Verificar se as informações institucionais podem ser consultadas, editadas e atualizadas corretamente. |
| AT10 | Executar testes de autorização | Verificar se consumidores e produtores são impedidos de acessar e executar a funcionalidade administrativa. |
| AT11 | Executar testes de validação e recuperação | Verificar o tratamento de dados inválidos e a preservação das informações preenchidas em caso de perda de conexão. |
| AT12 | Documentar e revisar a funcionalidade | Registrar o comportamento implementado, os resultados dos testes e eventuais pendências para revisão pela equipe. |

---

## 9. Checklist do Definition of Ready (DoR)

Marque os itens conforme a história atender a cada condição.

- [x] A HU possui definição clara e informação necessária para ser trabalhada?
- [x] O requisito está representado por uma história de usuário?
- [x] A HU está rastreada aos requisitos de origem?
- [ ] A HU faz parte do escopo do MVP?
- [x] A HU está coberta por critérios de aceite?
- [x] Os RNFs e as restrições legais aplicáveis estão identificados?
- [ ] A HU está mapeada para uma interface, quando necessário?
- [x] A HU cabe em uma iteração?
- [ ] As dependências estão mapeadas?
- [ ] Os responsáveis estão definidos?
- [ ] O requisito está implementado no protótipo e validado?

---

## 10. Checklist do Definition of Done (DoD)

Marque os itens após a verificação da entrega.

- [ ] Entrega um incremento do produto?
- [ ] Contempla os critérios de aceite estabelecidos?
- [ ] O desenvolvimento foi concluído integralmente?
- [ ] Os testes foram executados e aprovados?
- [ ] Está aderente aos padrões de codificação?
- [ ] A funcionalidade foi revisada pela equipe?
- [ ] Mantém os índices de performance do produto?
- [ ] Atende aos requisitos de acessibilidade e responsividade?
- [ ] Preserva a segurança e a privacidade dos dados?
- [ ] Trata os erros do usuário?
- [ ] Está livre de defeitos críticos?
- [ ] Está documentado?

