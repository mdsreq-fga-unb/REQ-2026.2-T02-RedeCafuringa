# Prova de Conceito — Backend da Rede Cafuringa

> Documento técnico que valida a stack definida na seção **2.4 Tecnologias** da Visão do Produto
> contra os requisitos do MVP (seção 9.3 do Backlog), as regras de negócio (RN01–RN44) e os RNFs.
> Para cada risco técnico, ele propõe a abordagem de implementação.

---

## 1. Escopo da PoC

O que esta PoC **comprova com código executável** (branch `develop-backend`):

| Hipótese | Evidência |
|---|---|
| NestJS 12 + TypeScript sobe e roda no Node 24 LTS com ESM | `npm run build` / `npm run start:dev` |
| Conexão com MongoDB via Mongoose e verificação de saúde | `GET /api/v1/health` → `{ status: "ok", mongodb: "up" }` |
| Documentação da API gerada automaticamente | Swagger em `/api/v1/docs` (fora de produção) |
| TDD viável no fluxo do AUP | Vitest (unitário, cobertura mínima por arquivo) + Supertest + `mongodb-memory-server` (e2e sem Docker), `createTestApp()` e fábricas de dados — ver [guia de estrutura e TDD](guia-estrutura-e-tdd.md) |
| Validação de identificação (RN02, RN03, RN08) | Validador de CPF e CNPJ **alfanumérico** com 22 testes |
| Esteira de CI gratuita | `.github/workflows/backend-ci.yml` (lint, build, testes) |
| Implantação conteinerizada com TLS automático | `Dockerfile`, `deploy/docker-compose.prod.yml`, `deploy/Caddyfile` |

---

## 2. Tecnologias

### 2.1 Definidas na documentação (seção 2.4)

| Camada | Tecnologia | Versão adotada | Observação |
|---|---|---|---|
| Runtime | **Node.js** | 24 LTS | Node 20 saiu de suporte em abr/2026; o tooling do Nest 12 exige ≥ 20.19. |
| Framework | **NestJS** + **TypeScript** | Nest 12 / TS 6 | A documentação cita "Nest.ts"; o nome correto é **NestJS**. Projeto em ESM. |
| Banco | **MongoDB** | 8 | Índices `2dsphere` para geolocalização (RF35, RF37) e índices de texto (RF36). |
| ODM | **Mongoose** (`@nestjs/mongoose`) | 9 | Schemas tipados, *discriminators* para os tipos de produtor. |
| Contêineres | **Docker Compose** | — | Dev: só o Mongo. Prod: Mongo + API + Caddy. |
| Proxy / TLS | **Caddy** | 2 | Certificado Let's Encrypt automático e redirecionamento HTTP→HTTPS (RNF10). |
| Hospedagem | **Oracle Cloud** Always Free | ARM Ampere A1 (SP) | Sem *cold start*; imagens `node:24-alpine` e `mongo:8` têm build ARM64. |
| Mapa | OpenStreetMap + Leaflet | — | Responsabilidade do front; a API entrega GeoJSON. |

### 2.2 Complementares (propostas por esta PoC)

| Necessidade | Biblioteca | Requisito atendido |
|---|---|---|
| Validação de variáveis de ambiente | `@nestjs/config` + `joi` | Falha rápida na inicialização |
| Validação de entrada (DTOs) | `class-validator` + `class-transformer` | RNF03 (mensagens de validação em 100% dos erros) |
| Documentação da API | `@nestjs/swagger` (OpenAPI 3) | Contrato com o front |
| Healthcheck | `@nestjs/terminus` | Monitoramento e `HEALTHCHECK` do Docker |
| Cabeçalhos de segurança | `helmet` | RNF10, RNF11 |
| Testes | `vitest`, `supertest`, `mongodb-memory-server` | TDD (AUP) |
| Lint / formatação | `oxlint`, `prettier` | Padrão do template Nest 12 |
| **Implementado (2026-10-28)** — autenticação | `@nestjs/jwt` + `argon2` (guards próprios, sem Passport) | RF09, RNF08 |
| **Implementado (2026-10-24)** - rate limit | `@nestjs/throttler` | Proteção do login e da recuperação de senha |
| **A adicionar** — e-mail | `nodemailer` + SMTP gratuito (ex.: Brevo, 300/dia) | RF10, RF34, RF48 |
| **A adicionar** — tarefas agendadas | `@nestjs/schedule` | Fila de e-mails sem Redis (RNF13) |
| **A adicionar** — imagens | OCI Object Storage (20 GB grátis) + `sharp` | Fotos de produtos e experiências |

---

## 3. Arquitetura

```
 PWA React (Cloudflare Pages)
            │ HTTPS / JSON
            ▼
 ┌────────────── VM OCI (ARM, São Paulo) ──────────────┐
 │  Caddy :443 ──► API NestJS :3000 ──► MongoDB :27017 │
 │  (TLS auto)      (container)          (volume)      │
 └──────────────────────────────────────────────────────┘
            │ SMTP                       │ backup diário (mongodump)
            ▼                            ▼
     Provedor de e-mail          OCI Object Storage
```

**Monólito modular**: um módulo Nest por característica do produto, com fronteiras claras e sem microsserviços (que seriam um custo operacional injustificável para o MVP).

| Módulo | CP | RFs do MVP |
|---|---|---|
| `auth` | CP1 | RF09, RF10 |
| `users` (consumidor, produtor, admin) | CP1 | RF01, RF02, RF03, RF04, RF12, RF14 |
| `products` | CP2 | RF17, RF21, RF22 |
| `experiences` | CP3 | RF23, RF25 |
| `search` | CP4 | RF36 |
| `contact` | CP5 | RF39 |
| `reservations` | CP6 | RF44, RF45, RF46, RF47, RF48 |
| `notifications` | transversal | RF48 (e futuro RF34) |
| `health` | transversal | ✅ implementado |

Convenções: prefixo `/api/v1`, `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`, e regra de autorização em duas camadas: **papel** (guard) e **propriedade do recurso** (service).

---

## 4. Desafios de implementação

Classificação: 🔴 alto risco · 🟡 médio · 🟢 baixo

### 🔴 D1 — CPF como login × LGPD (RF09, RN08, RNF11, RN12)
O CPF é o identificador de login. Por isso precisa ser **pesquisável** e, ao mesmo tempo, é dado pessoal sensível. Além disso, o RF14 prevê exibir CPF/CNPJ no perfil público, o que conflita com o RNF11 e a RN12.
**Abordagem:** guardar um *blind index* (`HMAC-SHA256(cpf, segredo)`) para a busca no login, com índice único, e o CPF cifrado (AES-256-GCM) apenas para exibição ao próprio titular ou ao admin. As respostas públicas usam DTOs de saída explícitos, que nunca serializam o documento do schema.
**Ação de requisitos:** levar ao cliente a proposta de **não exibir CPF publicamente** (CNPJ pode ser público) e atualizar o RF14.

### 🔴 D2 — Busca unificada + proximidade + filtros (RF36, RF37, RF38)
No MongoDB, `$geoNear` precisa ser o **primeiro estágio** do pipeline e **não pode ser combinado com `$text`** na mesma consulta. Além disso, a busca abrange cinco tipos de entidade.
**Abordagem:** manter uma coleção desnormalizada `search_index` (tipo, título, termos normalizados sem acento, categorias, `location` GeoJSON, `ownerId`), atualizada pelos services a cada escrita. A partir dela:
- busca textual: índice de texto com `default_language: 'portuguese'`;
- proximidade: `$geoNear` com filtro de categorias em `query` e busca por termos via prefixo nos termos normalizados;
- paginação obrigatória (limite máximo de 50) para atender o RNF06.

O Atlas Search não está disponível no Mongo auto-hospedado, por isso fica descartado.

### 🔴 D3 — Infraestrutura Always Free da OCI (RNF13)
- **Capacidade ARM esgotada** em São Paulo é frequente ("Out of capacity"). Criar a VM **o quanto antes** e manter um plano B: VM AMD *micro* (1 GB) com Mongo limitado (`--wiredTigerCacheSizeGB 0.25`).
- **Domínio:** o Caddy precisa de um nome DNS para emitir o certificado. Usar um subdomínio da Rede Cafuringa ou um DNS gratuito (ex.: DuckDNS).
- **Backup:** não há serviço gerenciado. Agendar um `mongodump` diário via cron para o Object Storage, com teste de restauração.
- **Contas ociosas:** a Oracle pode recuperar instâncias Always Free com uso muito baixo. Monitorar a instância.

### 🟡 D4 — Controle de acesso por papel e por propriedade (RNF08, RN01, RN17, RN22, RN25, RN38)
O RNF08 exige bloqueio inclusive por **acesso direto ao endpoint**.
**Abordagem:** JWT de curta duração (15 min) + refresh token rotativo armazenado com hash. `RolesGuard` global com `@Roles()` e negação por padrão (rotas públicas marcadas com `@Public()`). A verificação de propriedade fica no service (`resource.ownerId === user.id`). Cada endpoint protegido ganha um teste e2e que tenta o acesso com o papel errado.

### 🟡 D5 — Máquina de estados da pré-reserva (RF44–RF47, RN41, RN42, RN44)
`PENDENTE → ACEITA | RECUSADA | CANCELADA`. Os riscos são condições de corrida, como cancelar e aceitar ao mesmo tempo.
**Abordagem:** transições atômicas com pré-condição de estado no filtro:
`findOneAndUpdate({ _id, status: 'PENDENTE', visitanteId }, { $set: { status: 'CANCELADA' } })`. Se não houver documento, a resposta é **409 Conflict**. O histórico de transições fica embutido no documento, para auditoria.

### 🟡 D6 — Notificações por e-mail sem infraestrutura paga (RF48, RF10, RF34)
Não usar Redis ou fila gerenciada (custo). **Padrão Outbox no próprio Mongo:** a transição de estado grava um documento `outbox` e um job do `@nestjs/schedule` envia com *retry* e *backoff*. Isso respeita o limite diário do SMTP gratuito e não perde e-mails se o provedor cair.

### 🟡 D7 — Contato direto / chat (RF39)
Chat em tempo real (WebSocket) adiciona estado, reconexão em rede rural instável e moderação.
**Abordagem para o MVP:** mensagens assíncronas (threads REST com *polling* leve ou atualização ao abrir a tela) **ou** link `wa.me` para o WhatsApp do produtor, que é o canal que os produtores já usam. Validar com o cliente. O WebSocket (`@nestjs/websockets`) fica para incremento posterior.

### 🟡 D8 — Resiliência em conexão instável (RNF06, RNF07)
O PWA vai reenviar requisições após quedas, o que gera risco de **duplicar** cadastros e pré-reservas.
**Abordagem:** cabeçalho `Idempotency-Key` nos `POST` críticos, com coleção de chaves com TTL de 24 h. Também: respostas enxutas (DTOs), compressão no Caddy, `ETag` e `Cache-Control` nos GETs públicos.

### 🟡 D9 — Perfis heterogêneos de produtor (RF02, RN03)
Produtor PF, propriedade, associação e comunidade (CPF **ou** CNPJ, com campos diferentes).
**Abordagem:** *discriminators* do Mongoose sobre uma coleção `users`, com validação condicional nos DTOs.
**Atenção:** desde **jul/2026 a Receita emite CNPJ alfanumérico**. O validador desta PoC já suporta esse formato, mas o campo **nunca** deve ser tratado como numérico.

### 🟢 D10 — ECA Digital e exclusão de conta (RNF15, RF11, RN10, RN15)
Coletar a data de nascimento e bloquear menores de 18 anos no MVP, o que evita implementar o fluxo de consentimento parental. A exclusão de conta será **anonimização** (soft delete + remoção de dados pessoais), preservando a integridade de pré-reservas e feedbacks de terceiros.

### 🟢 D11 — Recuperação de senha (RF10, RN09)
Token aleatório de uso único, guardado como hash, com índice TTL de 30 min, enviado ao e-mail cadastrado. A resposta é sempre genérica, para não revelar se o CPF existe. Rate limit no endpoint.

### 🟢 D12 — Agente de IA (RF31) — fora do MVP
O RNF13 proíbe dependência obrigatória de API paga. Se for retomado, deve ser opcional e desligável por *feature flag*.

---

## 5. Plano de incrementos sugerido

| Incremento | Entregas | Desafios tratados |
|---|---|---|
| **0 — Fundação** ✅ | Estrutura, config, Mongo, health, Swagger, CI, Docker, validadores | — |
| **1 — Identidade** | Cadastro de consumidor/produtor/admin, login JWT, RBAC, recuperação de senha | D1, D4, D9, D10, D11 |
| **2 — Oferta** | Produtos, experiências, perfil público do produtor, upload de imagens | D4, D8 |
| **3 — Descoberta** | `search_index`, busca textual, proximidade, filtros, GeoJSON para o mapa | D2 |
| **4 — Conexão** | Pré-reserva (máquina de estados), outbox de e-mails, contato direto | D5, D6, D7 |
| **5 — Implantação** | VM OCI, Caddy + domínio, backup, homologação | D3 |

> Recomendação: provisionar a VM na OCI **em paralelo ao Incremento 1** por causa do risco D3.

---

## 6. Decisões pendentes com o cliente

1. Exibição pública de CPF no perfil do produtor (RF14 × RNF11), ver D1.
2. Formato do contato direto no MVP: chat interno, mensagens assíncronas ou WhatsApp (D7).
3. Permitir menores de 18 anos no MVP? (D10)
4. Domínio próprio para a API (D3).
