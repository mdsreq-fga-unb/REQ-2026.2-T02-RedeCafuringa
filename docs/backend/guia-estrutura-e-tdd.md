# Guia do Backend — Estrutura de pastas e TDD

> Leitura obrigatória antes do primeiro PR no backend.
> Decisões de arquitetura e desafios técnicos: [POC](poc.md).

---

## 1. Visão geral em 1 minuto

- **Stack:** NestJS 12 + TypeScript (ESM) + MongoDB/Mongoose, em Node **24 LTS**.
- **Formato:** monólito modular. Cada característica do produto (CP) vira um **módulo** em `src/modules/`.
- **API:** REST, prefixo `/api/v1`, documentação automática em `/api/v1/docs` (Swagger).
- **Processo:** AUP com **TDD**. Nenhuma regra de negócio entra sem um teste que falhou antes.
- **Garantia:** o CI roda lint, build, testes unitários (com cobertura mínima) e testes e2e em todo push e PR. Se algo falhar, o código não é integrado.

### Primeiro uso

```bash
nvm use                       # lê o .nvmrc (Node 24.22.1)
cd backend
cp .env.example .env
docker compose up -d mongo    # só o banco; a API roda local com hot reload
npm ci
npm run start:dev             # API em http://localhost:3000/api/v1

# em outro terminal, durante o desenvolvimento:
npm run test:watch
```

> Para rodar a API **em container**, use `docker compose up -d --build` e **não**
> rode `npm run start:dev` ao mesmo tempo (os dois disputam a porta 3000).
>
> Na primeira execução do `npm run test:e2e`, o `mongodb-memory-server` baixa o
> binário do MongoDB (cerca de 1 minuto). Depois disso, fica em cache. O e2e
> **não precisa** do Docker.

---

## 2. Estrutura de pastas

```
backend/
├── src/
│   ├── main.ts                 # bootstrap da aplicação
│   ├── app.module.ts           # config + Mongo + logger + throttler + módulos
│   ├── app.setup.ts            # config global: trust proxy, CORS, métricas, Swagger
│   │                           #   usada no main.ts E nos testes e2e
│   ├── config/
│   │   ├── env.validation.ts   # variáveis de ambiente obrigatórias
│   │   └── mongo-uri.ts        # monta a URI a partir dos componentes
│   ├── common/                 # código transversal, sem regra de domínio específica
│   │   ├── crypto/             # hash de senha (argon2id) e cifra/blind index do CPF
│   │   └── validators/         # ex.: CPF/CNPJ, @IsCpf() (+ seus .spec.ts)
│   └── modules/                # UM módulo por característica do produto
│       ├── auth/               # login JWT, guards globais, @Public/@Roles/@CurrentUser
│       ├── users/              # contas (consumidor, produtor, administrador)
│       ├── health/             # live/ready
│       └── metrics/            # Prometheus
├── test/
│   ├── setup/                  # infraestrutura dos e2e (Mongo em memória)
│   ├── utils/test-app.ts       # createTestApp(): sobe a API para os e2e
│   ├── utils/auth.ts           # seedUser(), loginAs(), forgeToken()
│   ├── support/                # módulos usados só em teste (ex.: sondagem de RBAC)
│   ├── factories/              # geradores de dados de teste (makeCpf, makeProduto...)
│   └── *.e2e-spec.ts           # testes e2e, um arquivo por módulo/história
├── deploy/                     # produção: compose, Caddy, init do Mongo, backup
├── ../docs/backend/            # POC, este guia, operação e segurança (MkDocs)
├── Dockerfile                  # imagem da API
└── docker-compose.yml          # MongoDB local + API opcional em container
```

### Anatomia de um módulo (modelo a seguir)

Exemplo para a pré-reserva (CP6):

```
src/modules/reservations/
├── reservations.module.ts          # registra controller, service e schema
├── reservations.controller.ts      # SÓ HTTP: rotas, DTOs, guards. Sem regra de negócio
├── reservations.service.ts         # orquestra: busca no banco, aplica regras, salva
├── reservations.service.spec.ts    # teste unitário do service (repositório mockado)
├── domain/                         # regras PURAS (sem Nest, sem banco)
│   ├── reservation-status.ts       # ex.: máquina de estados da pré-reserva
│   └── reservation-status.spec.ts
├── dto/
│   ├── create-reservation.dto.ts   # entrada validada com class-validator
│   └── reservation.response.ts     # saída: decide o que é público (LGPD)
└── schemas/
    └── reservation.schema.ts       # schema Mongoose
```

**Regras de ouro:**

| Camada | Pode | Não pode |
|---|---|---|
| `controller` | Receber e validar a requisição, chamar o service, devolver o DTO de resposta | Ter `if` de regra de negócio, acessar o banco |
| `service` | Orquestrar banco + regras de domínio, lançar exceções HTTP | Conhecer detalhes de `req`/`res` |
| `domain/` | Funções e classes puras com as regras (RNs) | Importar Nest, Mongoose ou qualquer I/O |
| `dto/*.response.ts` | Escolher explicitamente os campos expostos | Devolver o documento do Mongo direto (risco de vazar CPF/senha) |

> Comando para gerar o esqueleto: `npx nest g resource modules/<nome> --no-spec`
> (escolha "REST API"). Ele cria a pasta `entities/`: renomeie para `schemas/` e
> ajuste o restante à anatomia acima. O `--no-spec` é proposital, porque os testes
> você escreve primeiro e à mão.

### Convenções de código

- **Imports relativos terminam em `.js`**, mesmo apontando para arquivos `.ts` (o projeto é ESM):
  `import { X } from './x.service.js';`. Sem o `.js`, o build quebra.
- Nomes de arquivo em `kebab-case`; classes em `PascalCase`.
- Rotas e campos da API em inglês ou português: **definir em conjunto e manter único** (sugestão: código em inglês, mensagens ao usuário em português).

---

## 3. Os dois tipos de teste

| | **Unitário** | **E2E** |
|---|---|---|
| Arquivo | `*.spec.ts` **ao lado** do código, em `src/` | `test/*.e2e-spec.ts` |
| Testa | Uma regra de negócio isolada (RN) | Uma história de usuário pela API (HU + critérios de aceitação) |
| Banco | Não usa (mocks ou funções puras) | MongoDB em memória real |
| Velocidade | Milissegundos | Segundos |
| Comando | `npm test` / `npm run test:watch` | `npm run test:e2e` |
| Cobertura | **Mínimo de 80% por arquivo** em services, guards, policies, `domain/` e `common/` | Não medida (cobre controllers e integração) |

**Onde cada coisa é testada:**

- Regra de negócio (RN01–RN44) → **unitário**, de preferência em `domain/`.
- Critério de aceitação (CA) de uma HU → **e2e**.
- Permissão por perfil (RNF08: "inclusive por acesso direto ao endpoint") → **e2e**, sempre com o caso negativo (perfil errado → 403; sem login → 401).
- Validação de entrada (RNF03) → **e2e** (payload inválido → 400 com mensagem).

---

## 4. O ciclo TDD na prática

```
 🔴 RED        →     🟢 GREEN          →     🔵 REFACTOR
 escreva um         escreva o MÍNIMO         melhore o código
 teste que FALHA    para o teste passar      com os testes verdes
```

### Exemplo completo: HU18 — cancelar pré-reserva (RN41)

> **RN41:** o visitante só pode cancelar uma solicitação de pré-reserva enquanto ela estiver pendente.

**Passo 1, 🔴 RED.** O teste vem primeiro e falha, porque a função ainda não existe:

```ts
// src/modules/reservations/domain/reservation-status.spec.ts
import { canCancel } from './reservation-status.js';

describe('RN41 — cancelamento de pré-reserva', () => {
  it('permite cancelar quando PENDENTE', () => {
    expect(canCancel('PENDENTE')).toBe(true);
  });

  it.each(['ACEITA', 'RECUSADA', 'CANCELADA'] as const)(
    'não permite cancelar quando %s',
    (status) => {
      expect(canCancel(status)).toBe(false);
    },
  );
});
```

`npm run test:watch` mostra vermelho. **Faça o commit do teste** (`test: ...`).

**Passo 2, 🟢 GREEN.** Escreva o mínimo para passar:

```ts
// src/modules/reservations/domain/reservation-status.ts
export type ReservationStatus = 'PENDENTE' | 'ACEITA' | 'RECUSADA' | 'CANCELADA';

export function canCancel(status: ReservationStatus): boolean {
  return status === 'PENDENTE';
}
```

Ficou verde. Faça o commit (`feat: ...`).

**Passo 3, 🔵 REFACTOR.** Melhore nomes, extraia duplicações etc., sempre com os testes verdes.

**Passo 4, e2e do critério de aceitação.** Cada CA da HU vira um `it`:

```ts
// test/reservations.e2e-spec.ts
import { createTestApp, TestApp } from './utils/test-app.js';

describe('HU18 — Cancelar pré-reserva (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => { t = await createTestApp(); });
  beforeEach(async () => { await t.clearDatabase(); });
  afterAll(async () => { await t.close(); });

  it('CA03: após o cancelamento, a solicitação apresenta status CANCELADA', async () => {
    // arrange: cria visitante + pré-reserva pendente (via fábricas)
    // act:     PATCH /api/v1/reservations/:id/cancel
    // assert:  200 e body.status === 'CANCELADA'
  });

  it('RN41: retorna 409 ao cancelar pré-reserva já aceita', async () => { /* ... */ });

  it('RNF08: retorna 403 quando outro usuário tenta cancelar', async () => { /* ... */ });
});
```

### Rastreabilidade no nome do teste

Comece o `describe`/`it` com o código do requisito: `HU18`, `CA03`, `RN41`, `RNF08`.
Isso liga o teste à documentação e facilita a **atualização da matriz de rastreabilidade** exigida na fase de Construção.

---

## 5. Ferramentas de teste disponíveis

### `createTestApp()` — `test/utils/test-app.ts`

Sobe a aplicação **completa** (mesma configuração de produção) com um banco exclusivo para o arquivo de teste. Assim, os arquivos rodam em paralelo sem interferir uns nos outros.

```ts
const t = await createTestApp();
t.request().get('/api/v1/...')   // cliente HTTP (Supertest)
t.connection                     // conexão Mongoose (para preparar dados direto no banco)
await t.clearDatabase();         // limpa as coleções (use no beforeEach)
await t.close();                 // derruba o banco e a app (use no afterAll)
```

Para substituir uma dependência externa (ex.: e-mail):

```ts
const t = await createTestApp((builder) =>
  builder.overrideProvider(MailService).useValue({ send: vi.fn() }),
);
```

⚠️ Chame **uma vez por arquivo**, no `beforeAll`.

### Autenticação nos e2e — `test/utils/auth.ts`

```ts
import { loginAs, seedUser, forgeToken } from './utils/auth.js';

const token = await loginAs(t, Role.PRODUTOR);      // semeia + faz login
t.request().get('/api/v1/...').set('Authorization', `Bearer ${token}`);

const { user, cpf, senha } = await seedUser(t, Role.ADMINISTRADOR);
forgeToken({ sub: user.id, perfil: 'ADMINISTRADOR' }, { expiresIn: -60 }); // token expirado
```

Produtor e administrador ainda não têm cadastro público (HU02/HU03), por isso
`seedUser` cria a conta direto pelo `UsersService`.

### Fábricas — `test/factories/`

Geram dados **válidos** e **aleatórios**, assim os testes não repetem objetos enormes nem dependem de valores fixos.

```ts
import { makeCpf, makeCnpj } from '@test/factories';

makeCpf();                           // '52998224725'
makeCnpj({ alfanumerico: true });    // '12ABC34501DE35'
```

**Ao criar uma entidade nova, crie a fábrica junto**, seguindo o padrão `make<Entidade>(overrides)`:

```ts
// test/factories/produto.factory.ts
export function makeProduto(overrides: Partial<CreateProdutoDto> = {}): CreateProdutoDto {
  return {
    nome: 'Alface crespa orgânica',
    categoria: 'hortalica',
    disponivel: true,
    ...overrides,               // o teste muda só o que importa para ele
  };
}
```

E exporte em `test/factories/index.ts`.

### Comandos

| Comando | Quando usar |
|---|---|
| `npm run start:dev` | API local com hot reload (exige `docker compose up -d mongo`) |
| `npm run test:watch` | **Durante o desenvolvimento**: reexecuta a cada arquivo salvo |
| `npm test` | Rodar todos os unitários uma vez |
| `npm run test:cov` | Antes do PR: confere a cobertura mínima (relatório HTML em `coverage/`) |
| `npm run test:e2e` | Antes do PR: testes da API com Mongo em memória |
| `npm run lint` | Antes do PR |
| `npm run format:check` | Antes do PR: valida a formatação sem alterar arquivos |
| `npm run typecheck` | Antes do PR: `tsc --noEmit` em `src` + `test` |
| `npm run build` | Antes do PR: compila para `dist/` |

---

## 6. Autenticação e proteção de rotas

A API **nega por padrão**: o `JwtAuthGuard` é global, então toda rota nova já
exige `Authorization: Bearer <token>` (obtido em `POST /api/v1/auth/login`).
Ordem dos guards globais: `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`.

| Quero que a rota seja... | Use |
|---|---|
| Aberta a qualquer pessoa | `@Public()` |
| De qualquer usuário logado | nada (padrão) |
| Exclusiva de um ou mais perfis (RN01, RNF08) | `@Roles(Role.PRODUTOR)` ou `@Roles(Role.PRODUTOR, Role.ADMINISTRADOR)` |
| Sensível a força bruta (login, cadastro, recuperação) | `@AuthThrottle()` (limite `AUTH_THROTTLE_LIMIT`) |

```ts
@Roles(Role.PRODUTOR)
@ApiBearerAuth()
@Post()
create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProdutoDto) {
  return this.produtos.create(user.id, dto);   // o dono vem do token, nunca do body
}
```

- **Não há hierarquia de perfis:** administrador só acessa rota de produtor se ela listar `ADMINISTRADOR`.
- **Papel ≠ propriedade:** o guard só garante o perfil. Verificar se o recurso é
  do usuário (RN17, RN22, RN25, RN38) é responsabilidade do **service**
  (`recurso.ownerId === user.id`, senão `403`), com teste unitário.
- O token carrega apenas `sub` (id) e `perfil`. Nunca coloque CPF, e-mail ou nome nele.
- O CPF é gravado como *blind index* (`cpfHash`, usado na busca) + cifra AES-GCM
  (`cpfCifrado`). Para buscar por CPF use `UsersService.findByCpf()`; nunca consulte
  o campo diretamente.

## 7. Combinados do time

1. **Teste primeiro.** O commit do teste (`test:`) vem antes do commit da implementação (`feat:`). É a evidência do TDD no histórico, que o AUP pede.
2. **Cobertura mínima de 80% por arquivo** nas camadas de regra de negócio. O CI barra quem ficar abaixo.
3. **Toda rota protegida tem teste e2e negativo** (401 sem login, 403 com perfil errado).
4. **Nada de `it.skip` ou `it.only` no PR.** O `it.only` já é barrado automaticamente no CI.
5. **Bug encontrado vira teste.** Primeiro reproduza com um teste que falha, depois corrija (`fix:`).
6. **Branch e PR:** crie `feat/<descricao>` a partir da `dev` (`./scripts/dev.sh branch feat/<descricao>`) e abra o PR para a `dev`; veja [Como contribuir](../contribuindo.md). O PR só é integrado com o CI verde.

### Checklist do PR

- [ ] Testes escritos antes da implementação (commits `test:` → `feat:`)
- [ ] Nomes dos testes citam HU/CA/RN/RNF
- [ ] `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:cov`, `npm run test:e2e` e `npm run build` passando localmente
- [ ] Fábrica criada para entidades novas
- [ ] DTO de resposta não expõe dados privados (CPF, senha, e-mail de terceiros)
- [ ] Rota aparece corretamente no Swagger

## 8. Problemas comuns no primeiro uso

| Sintoma | Causa provável | Solução |
|---|---|---|
| `EADDRINUSE:3000` | API do Compose e `npm run start:dev` rodando juntos | use `docker compose up -d mongo` para o fluxo local, ou `docker compose up -d --build` sem `start:dev` |
| `MongoServerError`/`ECONNREFUSED` | Mongo não está de pé | `docker compose up -d mongo` e confira `docker compose ps` |
| `featureCompatibilityVersion 8.3` | volume criado por Mongo 8.3, imagem atual é 8.0 LTS | recrie o volume de dev ou faça dump/restore (ver [operação](operacao.md#75-volume-criado-por-mongo-83)) |
| `Config validation error: "JWT_SECRET" is required` | `.env` criado antes da autenticação | copie as variáveis de autenticação do `.env.example` para o seu `.env` |
| `vitest: command not found` | `node_modules` ausente/incompleto | `npm ci` na pasta `backend/` |
| primeiro `test:e2e` demora | `mongodb-memory-server` baixando o binário | aguarde; depois fica em cache |
| `docker` não mostra os containers no WSL | contexto diferente do Docker Desktop | use o PowerShell/Docker Desktop para o Docker do projeto |
| `npm ci` falha por versão do Node | Node diferente do `.nvmrc` | `nvm use` (24.22.1) |
