## 7.1 Registro da validação

| Informação | Registro |
|---|---|
| **Projeto** | Rede Cafuringa |
| **Data da validação** | 28/09/2026 |
| **Participantes da equipe** | Todos |
| **Participantes do cliente** | Jefferson Sooma |
| **Forma de validação** | Reunião / apresentação do MVP / revisão colaborativa |
| **Documento utilizado** | Matriz 4 × 4 e definição dos RFs e RNFs do MVP |

## 7.2 RFs aprovados para o MVP

Após a apresentação da proposta de MVP ao cliente, deverão ser registrados os requisitos funcionais aprovados para compor a primeira versão da solução.

| Código | Requisito | Status da validação | Observação |
|---|---|---|---|
| RF01 | Cadastrar perfil de consumidor | Validado | Emplementar de forma à ficar mais simplificado possível, e ser possível cadastrar empresas e MEIs e permitir uma categorização melhor dos Produtores |
| RF02 | Cadastrar perfil de produtor | Validado | — |
| RF03 | Cadastrar usuário admin | Validado | — |
| RF04 | Consultar usuários cadastrados | Validado | — |
| RF09 | Autenticar usuário | Validado | — |
| RF10 | Recuperar acesso à conta | Validado | — |
| RF12 | Registrar trajetória do produtor | Validado | Simplificar esse requisito de apresentação |
| RF14 | Consultar perfil de produtor | Validado | Não disponibilizar o CPF do produtor |
| RF17 | Cadastrar produto | Validado | — |
| RF21 | Consultar catálogo de produtos | Validado | — |
| RF22 | Consultar detalhes do produto | Validado | — |
| RF23 | Cadastrar experiência | Validado | — |
| RF25 | Consultar experiência | Validado | — |
| RF36 | Buscar ofertas | Validado | — |
| RF39 | Disponibilizar contato direto | Validado | O chat direto por ser trocado por uma implementação utilizando o Whatsapp |
| RF44 | Solicitar pré-reserva de experiência | Validado | — |
| RF45 | Consultar pré-reserva | Validado | — |
| RF46 | Cancelar solicitação de pré-reserva | Validado | — |
| RF47 | Responder pré-reserva de experiência | Validado | — |
| RF48 | Notificar alteração de pré-reserva | Validado | — |

## 7.3 RNFs aplicáveis ao MVP

Os seguintes requisitos não funcionais deverão ser considerados durante a implementação do MVP:

### RNFs obrigatórios

- **RNF03 — Prevenção e recuperação de erros**
- **RNF04 — Acessibilidade digital**
- **RNF05 — Responsividade da interface**
- **RNF06 — Desempenho em conectividade limitada**
- **RNF08 — Controle de acesso por perfil**
- **RNF10 — Proteção da comunicação**
- **RNF11 — Proteção de dados pessoais**
- **RNF13 — Baixo custo operacional**

### RNFs associados aos RFs do MVP

- **RNF01 — Eficiência de navegação**
- **RNF02 — Desempenho na execução de tarefas**
- **RNF07 — Resiliência à perda de conexão**

### RNFs evolutivos

- **RNF12 — Compatibilidade entre navegadores**
- **RNF14 — Disponibilização como aplicação web progressiva**

### RNF não aplicável ao MVP

- **RNF09 — Privacidade do feedback**, devido à não inclusão das funcionalidades de feedback no escopo inicial.

## 7.4 Requisitos destinados a entregas futuras

Os requisitos que não fizerem parte do MVP deverão ser registrados para posterior planejamento e priorização.

| Código | Requisito | Motivo para não inclusão no MVP | Possível entrega |
|---|---|---|---|
| RF05 | Desativar usuário | Manutenção administrativa complementar | Futuro |
| RF06 | Consultar conteúdos cadastrados | Gestão complementar de conteúdo | Futuro |
| RF07 | Remover conteúdo inadequado | Gestão complementar de conteúdo | Futuro |
| RF08 | Atualizar informações institucionais | Funcionalidade complementar | Futuro |
| RF11 | Excluir conta | Não essencial para validação inicial | Futuro |
| RF13 | Atualizar perfil de produtor | Manutenção posterior dos dados | Futuro |
| RF15 | Informar certificação | Baixo valor na primeira versão e maior esforço | Futuro |
| RF16 | Preencher questionário do produtor | Complementar à caracterização do produtor | Futuro |
| RF18 | Atualizar produto | Manutenção posterior do catálogo | Futuro |
| RF19 | Excluir produto | Manutenção complementar | Futuro |
| RF20 | Informar disponibilidade de produto | Evolução do gerenciamento do catálogo | Futuro |
| RF24 | Atualizar experiência | Manutenção posterior das experiências | Futuro |
| RF26 | Excluir experiência | Manutenção complementar | Futuro |
| RF27 | Cadastrar evento | Expansão do escopo de ofertas | Futuro |
| RF28 | Atualizar evento | Manutenção de eventos | Futuro |
| RF29 | Consultar evento | Expansão da consulta de ofertas | Futuro |
| RF30 | Excluir evento | Manutenção complementar | Futuro |
| RF31 | Auxiliar cadastro de atividade | Alto esforço e caráter complementar | Futuro |
| RF32 | Apresentar informações da Cafuringa | Complementar aos fluxos principais | Futuro |
| RF33 | Consultar guia de boas práticas | Conteúdo complementar | Futuro |
| RF34 | Notificar eventos | Depende da estrutura de eventos e notificações | Futuro |
| RF35 | Visualizar ofertas no mapa | Alto esforço e funcionalidade complementar | Futuro |
| RF37 | Buscar locais por proximidade | Alto esforço e funcionalidade complementar | Futuro |
| RF38 | Filtrar resultados de busca | Aprimoramento da busca | Futuro |
| RF40 | Enviar feedback ao fornecedor | Funcionalidade complementar | Futuro |
| RF41 | Visualizar feedback | Depende da implementação de feedback | Futuro |
| RF42 | Editar feedback | Depende da implementação de feedback | Futuro |
| RF43 | Excluir feedback ao fornecedor | Depende da implementação de feedback | Futuro |


## 7.5 Ajustes solicitados pelo cliente

Durante a validação, deverão ser registrados eventuais ajustes solicitados pelo cliente.

| Data | Requisito relacionado | Ajuste solicitado | Impacto no MVP | Responsável |
|---|---|---|---|---|
| 28/09/2026 | Visualização de Perfil | Retirar CPF da visualização do produtor | Baixo | Equipe Completa |
| 28/09/2026 | Geração de Contrato | Na hora do contrato, exibir o CPF/CNPJ do consumidor | Médio | Equipe Completa |
| 28/09/2026 | Cadastro de Produtor | Adicionar opção de Pessoa Jurídica (Empresa, MEI) no cadastro | Médio | Equipe Completa |
| 28/09/2026 | Catálogo / Filtros | Criar categorias de produtores (ex: alimentos, experiências, etc.) | Médio | Equipe Completa |
| 28/09/2026 | Requisitos Não Funcionais | Criar uma RNF sobre o ECA Digital em relação ao banco de dados | Alto | Equipe Completa |
| 28/09/2026 | Recuperar acesso à conta | Incluir RF10 (Recuperar acesso à conta) no escopo | Médio | Equipe Completa |
| 28/09/2026 | Registrar trajetória do produtor | Incluir RF12 (Registrar trajetória do produtor) de forma simplificada (usar embed para vídeo do YouTube) | Médio | Equipe Completa |
| 28/09/2026 | Comunicação / Chat | Substituir chat interno da plataforma por embed/redirecionamento do WhatsApp | Médio | Equipe Completa |
| 28/09/2026 | Notificar alteração de pré-reserva | Incluir RF48 (Notificar alteração de pré-reserva) no escopo | Alto | Equipe Completa |
| 28/09/2026 | Deploy / Geral | Lançamento da plataforma Cafuringa | Alto | Equipe completa |


## 7.6 Decisões e divergências

As decisões tomadas durante a validação deverão ser registradas para manter a rastreabilidade das alterações realizadas no escopo.

| Data | Tema | Decisão / divergência | Participantes | Encaminhamento |
|---|---|---|---|---|
| Equipe Completa | Equipe Completa | Equipe Completa | Equipe Completa | Equipe Completa |

Caso não existam divergências:

> **Não foram registradas divergências quanto à composição do MVP durante a validação.**

## 7.7 Resultado da validação

Após a reunião com o cliente, o resultado final deverá ser registrado em uma das seguintes situações:

- **MVP aprovado:** o cliente concordou com a composição dos RFs e RNFs apresentados;
- **MVP aprovado com ajustes:** o cliente concordou com a proposta, condicionando a aprovação à realização dos ajustes registrados;
- **MVP pendente de validação:** foram identificados pontos que precisam de nova discussão antes da aprovação;
- **MVP revisado:** a validação resultou em alterações significativas na composição inicialmente proposta.

### Registro final

> **Resultado:** Validado
>
> **Observações:** As observações podem ser visualizadas no topico 7.5, onde foram registradas as solicitações de ajustes feitas pelo cliente durante a validação do MVP.
>
> **Data de aprovação:** 28/09/2026
>
> **Responsável pela validação:** Jefferson Sooma
