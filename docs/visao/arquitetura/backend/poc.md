# Prova de Conceito (PoC) 

## 1. Apresentação

A Prova de Conceito (*Proof of Concept — PoC*) do backend da Rede Cafuringa tem como objetivo avaliar a viabilidade técnica da stack tecnológica definida na seção **2.4 — Tecnologias** da Visão do Produto, verificando sua adequação aos requisitos funcionais do MVP (seção 9.3 do Backlog), às regras de negócio (RN01–RN44) e aos requisitos não funcionais (RNFs).

Este documento reúne as tecnologias selecionadas, as evidências de validação técnica, a arquitetura proposta, os principais riscos de implementação e as estratégias definidas para enfrentá-los.

A PoC também estabelece uma base técnica para orientar o desenvolvimento incremental do backend, reduzindo incertezas relacionadas à integração entre tecnologias, segurança, persistência de dados, testes e implantação.

### 1.1 Objetivos

- Validar a viabilidade das tecnologias selecionadas para o backend.
- Comprovar, por meio de código executável, o funcionamento dos componentes fundamentais da aplicação.
- Identificar riscos técnicos relacionados aos requisitos do produto.
- Definir estratégias de implementação para os principais desafios identificados.
- Estabelecer uma arquitetura modular que facilite a evolução do sistema.
- Orientar a implementação incremental das funcionalidades do MVP.

### 1.2 Relação com os artefatos do projeto

A PoC utiliza como referência os seguintes documentos:

| Artefato | Relação com a PoC |
|---|---|
| Visão do Produto | Fundamenta as tecnologias e a arquitetura selecionadas. |
| Backlog do Produto | Identifica as funcionalidades contempladas no MVP. |
| Requisitos de Software | Fornece os RFs, RNFs e regras de negócio que orientam as decisões técnicas. |
| Histórias de Usuário | Auxiliam na identificação dos comportamentos que precisam ser implementados e validados. |

---

## 2. Escopo e evidências da Prova de Conceito

A PoC concentra-se na validação da infraestrutura e dos componentes fundamentais do backend. As evidências apresentadas correspondem à implementação existente no diretório `backend/`, na branch `dev`.

### 2.1 Funcionalidades e capacidades validadas

| Hipótese técnica | Evidência de validação |
|---|---|
| O NestJS 12 com TypeScript funciona no Node.js 24 LTS com ESM. | Execução de `npm run build` e `npm run start:dev`. |
| A aplicação consegue estabelecer conexão com o MongoDB por meio do Mongoose. | Endpoint `GET /api/v1/health`, que retorna `{ status: "ok", mongodb: "up" }`. |
| A documentação da API pode ser gerada automaticamente. | Swagger disponível em `/api/v1/docs`, fora do ambiente de produção. |
| A aplicação permite a adoção de TDD no fluxo de desenvolvimento AUP. | Vitest para testes unitários, Supertest para testes e2e, `mongodb-memory-server` para execução sem Docker, `createTestApp()` e fábricas de dados. |
| A validação de identificadores atende aos formatos de CPF e CNPJ. | Validador de CPF e CNPJ alfanumérico, contemplando RN02, RN03 e RN08, com 22 testes. |
| É possível manter uma esteira de integração contínua gratuita. | Workflow `.github/workflows/backend-ci.yml`, contemplando lint, build e testes. |
| A aplicação pode ser conteinerizada e preparada para implantação com TLS automático. | Arquivos `Dockerfile`, `deploy/docker-compose.prod.yml` e `deploy/Caddyfile`. |

**Documentação complementar:** a organização dos testes e a estratégia de TDD estão detalhadas no [Guia de Estrutura e TDD](guia-estrutura-e-tdd.md).

### 2.2 Limites da validação

A comprovação do funcionamento dos componentes fundamentais não representa a conclusão do backend.

A PoC valida a base tecnológica e apresenta soluções para os desafios de implementação identificados. As funcionalidades de negócio serão desenvolvidas progressivamente, conforme o planejamento dos incrementos apresentado neste documento.

---

## 3. Stack tecnológica

A stack tecnológica foi organizada conforme as responsabilidades de cada componente da aplicação, considerando as tecnologias definidas na Visão do Produto e as ferramentas complementares identificadas durante a PoC.

### 3.1 Tecnologias principais

| Camada | Tecnologia | Versão | Responsabilidade |
|---|---|---|---|
| Runtime | Node.js | 24 LTS | Ambiente de execução do backend. |
| Framework | NestJS | 12 | Estruturação da API e organização modular da aplicação. |
| Linguagem | TypeScript | 6 | Desenvolvimento com tipagem estática. |
| Banco de dados | MongoDB | 8 | Persistência dos dados da aplicação. |
| ODM | Mongoose (`@nestjs/mongoose`) | 9 | Modelagem, validação e interação com o MongoDB. |
| Conteinerização | Docker Compose | — | Gerenciamento dos contêineres de desenvolvimento e produção. |
| Proxy reverso e TLS | Caddy | 2 | Gerenciamento de requisições HTTPS e emissão automática de certificados. |
| Hospedagem | Oracle Cloud Infrastructure (OCI) | Always Free | Hospedagem da API e do banco de dados em infraestrutura ARM Ampere A1, na região de São Paulo. |
| Mapas | OpenStreetMap e Leaflet | — | Exibição de mapas no frontend, utilizando dados geográficos fornecidos pela API. |

**Observações técnicas:**

- O projeto utiliza ESM (*ECMAScript Modules*).
- O MongoDB contará com índices `2dsphere` para consultas geográficas (RF35 e RF37) e índices de texto para funcionalidades de busca (RF36).
- O Mongoose utilizará *discriminators* para representar os diferentes tipos de produtor.
- No ambiente de desenvolvimento, o Docker Compose será utilizado para executar o MongoDB. Em produção, será utilizado para gerenciar o MongoDB, a API e o Caddy.
- A hospedagem considera a arquitetura ARM64, utilizando imagens compatíveis, como `node:24-alpine` e `mongo:8`.

### 3.2 Tecnologias complementares

As bibliotecas complementares foram selecionadas para atender necessidades específicas de validação, segurança, documentação, testes e manutenção.

| Necessidade | Tecnologia | Finalidade |
|---|---|---|
| Configuração e variáveis de ambiente | `@nestjs/config` e `joi` | Validar configurações e interromper a inicialização diante de variáveis inválidas. |
| Validação de entrada | `class-validator` e `class-transformer` | Validar DTOs e atender ao RNF03. |
| Documentação da API | `@nestjs/swagger` | Gerar documentação OpenAPI 3 e estabelecer o contrato com o frontend. |
| Monitoramento | `@nestjs/terminus` | Disponibilizar verificações de saúde da aplicação e do banco. |
| Segurança HTTP | `helmet` | Configurar cabeçalhos de segurança, atendendo aos RNFs 10 e 11. |
| Testes | `vitest`, `supertest` e `mongodb-memory-server` | Viabilizar testes unitários e de integração sem dependência de uma instância externa do MongoDB. |
| Padronização de código | `oxlint` e `prettier` | Aplicar regras de qualidade, lint e formatação. |
| Autenticação | `@nestjs/jwt` e `argon2` | Implementar autenticação com JWT e armazenamento seguro de senhas, atendendo ao RF09 e RNF08. |
| Limitação de requisições | `@nestjs/throttler` | Proteger endpoints de login e recuperação de senha contra excesso de requisições. |
| Envio de e-mails | `nodemailer` e SMTP gratuito | Viabilizar notificações e recuperação de senha, contemplando RF10, RF34 e RF48. |
| Tarefas agendadas | `@nestjs/schedule` | Executar tarefas periódicas e processamento de notificações sem Redis. |
| Processamento de imagens | `sharp` | Processar imagens de perfil dos produtores, conforme HU12. |
| Armazenamento de imagens | OCI Object Storage | Armazenar fotos de produtos e experiências, considerando a disponibilidade de 20 GB gratuitos. |

**Situação das tecnologias complementares:**

- **Implementadas:** autenticação com JWT e Argon2 (28/10/2026), limitação de requisições (24/10/2026) e processamento de imagens com Sharp.
- **A implementar:** envio de e-mails, tarefas agendadas e armazenamento de imagens no OCI Object Storage.

A foto de perfil do produtor será armazenada diretamente no MongoDB, considerando a previsão de uma imagem por produtor. A estratégia está relacionada à implementação da [HU12](implementacao/HU12.md).

---

## 4. Arquitetura do backend

### 4.1 Visão geral da arquitetura

A aplicação adotará uma arquitetura cliente-servidor, na qual o frontend será responsável pela interface e interação com os usuários, enquanto o backend concentrará as regras de negócio, autenticação, autorização e persistência dos dados.

A comunicação ocorrerá por meio de requisições HTTPS, utilizando JSON como formato de troca de informações.

```text
              PWA React
          (Cloudflare Pages)
                  |
                  | HTTPS / JSON
                  v
       +--------------------------------+
       |       Oracle Cloud (OCI)       |
       |                                |
       |  Caddy :443                    |
       |      |                         |
       |      v                         |
       |  API NestJS :3000              |
       |      |                         |
       |      v                         |
       |  MongoDB :27017                |
       |                                |
       +--------------------------------+
                  |
          +-------+-------+
          |               |
          v               v
     Provedor SMTP   OCI Object Storage
                     (Backups e arquivos)
```

O Caddy será responsável pelo proxy reverso e gerenciamento automático de certificados TLS. A API NestJS processará as requisições e acessará o MongoDB para persistência dos dados.

O envio de notificações ocorrerá por meio de um provedor SMTP. O armazenamento de imagens e arquivos será realizado no OCI Object Storage, conforme a estratégia definida para cada tipo de conteúdo.

### 4.2 Organização modular

O backend adotará o padrão de **monólito modular**, organizando a aplicação em módulos independentes por característica do produto.

Essa abordagem permite separar responsabilidades e manter fronteiras claras entre os componentes, sem introduzir a complexidade operacional de microsserviços, considerada desnecessária para o escopo do MVP.

| Módulo | Característica do produto | Requisitos do MVP |
|---|---|---|
| `auth` | CP1 — Gestão de usuários | RF09, RF10 |
| `users` | CP1 — Gestão de usuários | RF01, RF02, RF03, RF04, RF12, RF14 |
| `products` | CP2 — Produtos | RF17, RF21, RF22 |
| `experiences` | CP3 — Experiências e eventos | RF23, RF25 |
| `search` | CP4 — Busca e localização | RF36 |
| `contact` | CP5 — Contato e comunicação | RF39 |
| `reservations` | CP6 — Pré-reservas | RF44, RF45, RF46, RF47, RF48 |
| `notifications` | Serviço transversal | RF48 e futuro RF34 |
| `health` | Monitoramento | Verificação da disponibilidade da API e do banco |

### 4.3 Convenções e padrões arquiteturais

Para manter a consistência da implementação, serão adotadas as seguintes convenções:

- **Versionamento da API:** utilização do prefixo `/api/v1`.
- **Validação de dados:** aplicação de `ValidationPipe` global, com `whitelist` e `forbidNonWhitelisted`, impedindo a entrada de propriedades não previstas nos DTOs.
- **Autorização por papel:** utilização de guards para verificar o papel do usuário autenticado.
- **Autorização por propriedade:** verificação, na camada de serviços, de que o usuário possui autorização para acessar ou modificar determinado recurso.
- **Separação de responsabilidades:** controllers responsáveis pelas requisições, services pelas regras de negócio e schemas pela modelagem dos dados.

A autorização será realizada em duas camadas complementares: verificação do papel do usuário (*role*) e verificação da propriedade do recurso (*ownership*).

---

## 5. Análise de riscos e estratégias de implementação

Esta seção apresenta os principais desafios técnicos identificados durante a análise dos requisitos e da stack tecnológica.

Os desafios foram classificados conforme seu nível de risco:

- 🔴 **Alto:** pode comprometer funcionalidades essenciais, segurança ou viabilidade da solução.
- 🟡 **Médio:** exige atenção durante a implementação, mas possui estratégias de mitigação definidas.
- 🟢 **Baixo:** apresenta menor complexidade ou possui solução técnica relativamente bem estabelecida.

### 5.1 Riscos de alta prioridade

#### D1 — Identificação de usuários e proteção de dados pessoais

**Requisitos relacionados:** RF09, RF14, RN08, RNF11 e RN12.

O uso do CPF como identificador de usuários exige atenção especial à proteção de dados pessoais. Além disso, a previsão inicial de exibição de CPF/CNPJ nos perfis públicos apresenta conflito com as diretrizes de privacidade estabelecidas nos requisitos.

**Estratégia de implementação:**

- Utilizar um *blind index* baseado em `HMAC-SHA256(cpf, segredo)` para permitir buscas e garantir unicidade sem armazenar o CPF em texto aberto.
- Armazenar o CPF cifrado com AES-256-GCM.
- Utilizar DTOs de saída explícitos para impedir a exposição indevida de informações pessoais.
- Permitir a visualização dos dados completos somente em contextos autorizados.

**Atualização após revisão dos requisitos (HU01–HU03):**

A RN05 vigente estabelece autenticação por e-mail e senha. Portanto, o CPF passa a atuar exclusivamente como identificador, não como credencial de autenticação.

O login realiza a busca pelo e-mail, enquanto o *blind index* permanece responsável pela unicidade do CPF, utilizando índice esparso para permitir que administradores não possuam CPF cadastrado.

**Pendência:** validar com o cliente a proposta de não exibir CPF publicamente, mantendo a possibilidade de exibição do CNPJ, e atualizar o RF14 conforme a decisão.

#### D2 — Busca unificada, proximidade geográfica e filtros

**Requisitos relacionados:** RF36, RF37 e RF38.

A busca da Rede Cafuringa precisa contemplar diferentes tipos de entidades, permitindo pesquisar produtos, experiências, produtores e outras informações, além de considerar localização geográfica e filtros.

O MongoDB apresenta limitações específicas para a combinação de consultas textuais e geográficas: o estágio `$geoNear` precisa ser o primeiro do pipeline de agregação e não pode ser combinado diretamente com `$text` na mesma consulta.

**Estratégia de implementação:**

Criar uma coleção desnormalizada chamada `search_index`, contendo:

- Tipo da entidade.
- Título.
- Termos normalizados e sem acentuação.
- Categorias.
- Localização em formato GeoJSON.
- Identificador do proprietário (`ownerId`).

Essa coleção será atualizada pelos services sempre que ocorrer uma operação de escrita nas entidades correspondentes.

As consultas serão realizadas da seguinte maneira:

| Tipo de busca | Estratégia |
|---|---|
| Textual | Índice de texto com `default_language: 'portuguese'`. |
| Geográfica | Utilização de `$geoNear`, com filtros de categorias. |
| Busca combinada | Utilização de prefixos nos termos normalizados para complementar a consulta geográfica. |
| Paginação | Limite máximo de 50 resultados por consulta, atendendo ao RNF06. |

O Atlas Search não será utilizado, pois não está disponível na configuração de MongoDB auto-hospedado escolhida para o projeto.

#### D3 — Infraestrutura gratuita da Oracle Cloud

**Requisito relacionado:** RNF13.

A hospedagem na infraestrutura Always Free da Oracle Cloud apresenta limitações de capacidade e disponibilidade que podem dificultar a implantação da aplicação.

**Estratégia de implementação:**

- Provisionar a máquina virtual ARM Ampere A1 na região de São Paulo o quanto antes, considerando a possibilidade de indisponibilidade de capacidade.
- Manter como alternativa uma VM AMD Micro com 1 GB de memória, utilizando configuração reduzida do MongoDB (`--wiredTigerCacheSizeGB 0.25`).
- Configurar um domínio ou subdomínio para permitir a emissão de certificados TLS pelo Caddy.
- Considerar o uso de DNS gratuito, como DuckDNS, caso não exista domínio próprio.
- Agendar backups diários com `mongodump`, armazenando os arquivos no OCI Object Storage.
- Realizar testes periódicos de restauração dos backups.
- Monitorar o uso da instância para reduzir o risco de recuperação de recursos ociosos pela Oracle.

### 5.2 Riscos de média prioridade

#### D4 — Controle de acesso por papel e propriedade

**Requisitos relacionados:** RNF08, RN01, RN17, RN22, RN25 e RN38.

O sistema precisa garantir que usuários acessem somente funcionalidades e recursos autorizados, inclusive quando tentarem acessar diretamente os endpoints da API.

**Estratégia de implementação:**

- Utilizar JWT com tempo de expiração curto (15 minutos).
- Implementar refresh tokens rotativos, armazenados por meio de hash.
- Utilizar `RolesGuard` global com o decorator `@Roles()`.
- Adotar negação de acesso por padrão, permitindo acesso público somente em rotas identificadas com `@Public()`.
- Verificar a propriedade dos recursos diretamente nos services, por exemplo, por meio da comparação entre `resource.ownerId` e `user.id`.
- Criar testes e2e para verificar tentativas de acesso com papéis não autorizados.

#### D5 — Máquina de estados das pré-reservas

**Requisitos relacionados:** RF44–RF47, RN41, RN42 e RN44.

O processo de pré-reserva precisa controlar as transições de estado e impedir operações incompatíveis.

O fluxo previsto é:

```text
             +-------- ACEITA
             |
PENDENTE ----+-------- RECUSADA
             |
             +-------- CANCELADA
```

Um dos principais riscos é a ocorrência de condições de corrida, como uma solicitação ser aceita e cancelada simultaneamente.

**Estratégia de implementação:**

Utilizar transições atômicas no MongoDB, verificando o estado atual antes de realizar a atualização.

Exemplo:

```typescript
findOneAndUpdate(
  {
    _id,
    status: 'PENDENTE',
    visitanteId
  },
  {
    $set: {
      status: 'CANCELADA'
    }
  }
);
```

Caso nenhum documento corresponda às condições, a API deverá retornar `409 Conflict`.

O histórico das transições será armazenado no próprio documento, permitindo auditoria das alterações.

#### D6 — Notificações por e-mail sem infraestrutura paga

**Requisitos relacionados:** RF48, RF10 e RF34.

O envio de notificações precisa funcionar sem depender de serviços pagos de filas ou infraestrutura adicional, respeitando a restrição de custos do RNF13.

**Estratégia de implementação:**

Adotar o padrão *Outbox* utilizando o próprio MongoDB.

O fluxo será:

1. Uma alteração de estado gera um registro na coleção `outbox`.
2. Uma tarefa agendada pelo `@nestjs/schedule` identifica as notificações pendentes.
3. O serviço realiza o envio por meio do Nodemailer e de um provedor SMTP.
4. Em caso de falha, são realizadas novas tentativas com intervalos progressivos (*retry* e *backoff*).
5. Após o envio, o registro é atualizado.

Essa abordagem evita a necessidade de Redis ou de uma fila gerenciada externamente.

#### D7 — Contato direto entre consumidores e produtores

**Requisito relacionado:** RF39.

A implementação de um chat em tempo real pode aumentar a complexidade do sistema, especialmente em relação à reconexão, sincronização de mensagens e instabilidade de conexão.

**Estratégia para o MVP:**

Considerar duas alternativas:

- **Mensagens assíncronas:** utilização de threads REST, com atualização periódica (*polling*) ou atualização ao abrir a tela.
- **Integração com WhatsApp:** disponibilização de links `wa.me` para direcionar o consumidor ao contato do produtor.

A segunda alternativa aproveita um canal já utilizado pelos produtores, reduzindo a complexidade de desenvolvimento.

**Pendência:** validar com o cliente qual alternativa deverá ser adotada no MVP. A implementação de WebSockets fica reservada para incrementos posteriores.

#### D8 — Resiliência em conexões instáveis

**Requisitos relacionados:** RNF06 e RNF07.

Considerando as condições de conectividade de algumas regiões atendidas pela Rede Cafuringa, o sistema precisa lidar com interrupções de rede sem comprometer a integridade dos dados.

Um dos riscos é a repetição de requisições após falhas de conexão, ocasionando cadastros ou pré-reservas duplicadas.

**Estratégia de implementação:**

- Utilizar o cabeçalho `Idempotency-Key` em operações POST críticas.
- Armazenar as chaves em uma coleção específica, com TTL de 24 horas.
- Utilizar DTOs de resposta enxutos.
- Configurar compressão no Caddy.
- Utilizar `ETag` e `Cache-Control` nas consultas GET públicas.

#### D9 — Diferentes perfis de produtores

**Requisitos relacionados:** RF02 e RN03.

A Rede Cafuringa contempla diferentes categorias de produtores, como pessoa física, propriedade, associação e comunidade. Cada categoria pode possuir informações e regras de validação específicas.

**Estratégia de implementação:**

Utilizar *discriminators* do Mongoose em uma coleção `users`, permitindo representar os diferentes tipos de produtor com estruturas específicas.

Os DTOs deverão aplicar validações condicionais de acordo com a categoria cadastrada.

**Atenção:** desde julho de 2026, a Receita Federal passou a emitir CNPJs alfanuméricos. Portanto, o campo de CNPJ deverá ser tratado como texto, e não como valor numérico. O validador implementado na PoC já contempla esse formato.

### 5.3 Riscos de baixa prioridade

#### D10 — Proteção de menores e exclusão de contas

**Requisitos relacionados:** RNF15, RF11 e RN10.

O sistema precisa considerar as regras relacionadas à proteção de menores de idade e ao tratamento dos dados pessoais após a exclusão de uma conta.

**Estratégia de implementação:**

- Coletar a data de nascimento durante o cadastro.
- Considerar o bloqueio de usuários menores de 18 anos no MVP, evitando inicialmente a necessidade de implementar um fluxo de consentimento parental.
- Adotar a anonimização dos dados na exclusão da conta, utilizando *soft delete* e remoção de informações pessoais.
- Preservar a integridade de pré-reservas e feedbacks realizados por terceiros.

**Pendência:** validar com o cliente a restrição de idade para utilização da plataforma.

#### D11 — Recuperação de senha

**Requisitos relacionados:** RF10 e RN09.

O processo de recuperação de senha precisa garantir que somente o titular da conta consiga redefinir suas credenciais, evitando também a exposição de informações sobre usuários cadastrados.

**Estratégia de implementação:**

- Gerar um token aleatório de uso único.
- Armazenar somente o hash do token.
- Utilizar índice TTL de 30 minutos para expiração.
- Enviar o token ao e-mail cadastrado.
- Retornar mensagens genéricas, evitando revelar a existência ou não de determinada conta.
- Aplicar limitação de requisições (*rate limit*) no endpoint.

#### D12 — Agente de Inteligência Artificial

**Requisito relacionado:** RF31.

A integração com um agente de IA não faz parte do MVP e precisa considerar a restrição de dependências obrigatórias de serviços pagos estabelecida pelo RNF13.

**Estratégia de implementação:**

Caso a funcionalidade seja retomada em incrementos futuros, sua utilização deverá ser opcional e controlada por uma *feature flag*, permitindo desativá-la sem comprometer o funcionamento das demais funcionalidades.

---

## 6. Planejamento de implementação incremental

Com base na arquitetura proposta e nos riscos identificados, foi estabelecida uma sugestão de organização do desenvolvimento do backend em incrementos.

Essa divisão permite construir e validar os componentes gradualmente, priorizando inicialmente a infraestrutura e os recursos fundamentais da aplicação.

| Incremento | Escopo e entregas | Desafios relacionados |
|---|---|---|
| **0 — Fundação** | Estrutura do projeto, configurações, conexão com MongoDB, healthcheck, Swagger, CI, Docker e validadores. | Base técnica da aplicação. |
| **1 — Identidade** | Cadastro de consumidores, produtores e administradores; autenticação JWT; controle de acesso; recuperação de senha. | D1, D4, D9, D10 e D11. |
| **2 — Oferta** | Cadastro e gerenciamento de produtos, experiências e perfis públicos dos produtores; upload de imagens. | D4 e D8. |
| **3 — Descoberta** | Implementação do `search_index`, busca textual, proximidade geográfica, filtros e disponibilização de GeoJSON para o mapa. | D2. |
| **4 — Conexão** | Implementação das pré-reservas, máquina de estados, notificações por e-mail e contato direto. | D5, D6 e D7. |
| **5 — Implantação** | Provisionamento da VM na OCI, configuração do Caddy e domínio, backups e homologação. | D3. |

**Recomendação técnica:** iniciar o provisionamento da VM na Oracle Cloud em paralelo ao Incremento 1, devido ao risco de indisponibilidade de capacidade na infraestrutura Always Free.

### 6.1 Relação entre incrementos e evolução do produto

A divisão proposta procura acompanhar a evolução das características do produto:

- **CP1 — Gestão de usuários:** estabelece a identidade e o acesso à plataforma.
- **CP2 — Produtos:** permite disponibilizar a oferta dos produtores.
- **CP3 — Experiências e eventos:** amplia a divulgação das atividades disponíveis na região.
- **CP4 — Busca e localização:** permite encontrar produtos, produtores e experiências.
- **CP5 — Contato e comunicação:** aproxima consumidores e produtores.
- **CP6 — Pré-reservas:** permite gerenciar solicitações de agendamento.

Dessa forma, a implementação do backend acompanha a estrutura funcional definida para o produto.

---

## 7. Decisões pendentes e validações com o cliente

Algumas decisões técnicas dependem de alinhamento com o cliente, pois afetam diretamente o comportamento esperado da plataforma e a interpretação dos requisitos.

| Nº | Decisão pendente | Referência | Impacto |
|---|---|---|---|
| 1 | Definir se o CPF será ocultado dos perfis públicos dos produtores, mantendo ou não a exibição do CNPJ. | RF14, RNF11, RN12 e D1. | Privacidade e exposição de dados pessoais. |
| 2 | Definir o formato do contato direto no MVP: chat interno, mensagens assíncronas ou WhatsApp. | RF39 e D7. | Arquitetura e complexidade do módulo de comunicação. |
| 3 | Confirmar se menores de 18 anos poderão utilizar a plataforma no MVP. | RNF15 e D10. | Cadastro, validações e proteção de usuários. |
| 4 | Definir o domínio que será utilizado pela API. | D3. | Implantação, DNS e configuração de HTTPS. |

As decisões deverão ser registradas e, quando necessário, refletidas nos requisitos funcionais, nas regras de negócio e na arquitetura da aplicação antes da implementação definitiva das funcionalidades correspondentes.

---

## 8. Considerações finais

A Prova de Conceito do backend da Rede Cafuringa estabelece uma base técnica para o desenvolvimento da plataforma, permitindo avaliar a compatibilidade das tecnologias escolhidas com as necessidades do produto e identificar antecipadamente possíveis dificuldades de implementação.

As evidências executáveis demonstram a viabilidade dos componentes fundamentais da aplicação, incluindo inicialização do servidor, conexão com o banco de dados, documentação da API, testes automatizados, validação de identificadores e preparação da infraestrutura de implantação.

Além disso, a análise dos riscos permite antecipar desafios relacionados à segurança, privacidade, controle de acesso, buscas geográficas, conectividade, comunicação e infraestrutura.

As estratégias propostas e o planejamento incremental fornecem uma orientação para a continuidade da construção do backend, mantendo o alinhamento entre as decisões técnicas, os requisitos do produto e as necessidades dos usuários da Rede Cafuringa.