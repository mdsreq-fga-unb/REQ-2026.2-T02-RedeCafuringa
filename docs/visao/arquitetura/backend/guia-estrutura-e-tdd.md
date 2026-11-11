# Estrutura de Pastas e TDD

> **Leitura obrigatória antes da abertura do primeiro Pull Request (PR) no backend.**
>
> Este documento apresenta a organização do código, as convenções de desenvolvimento, a estratégia de testes e o fluxo de trabalho adotado pela equipe.
>
> Para consultar as decisões arquiteturais e os desafios técnicos do projeto, acesse a [Prova de Conceito (PoC)](poc.md).

---

## 1. Visão geral

Este guia reúne as principais orientações para o desenvolvimento do backend da Rede Cafuringa.

| Aspecto | Definição |
|---|---|
| **Stack tecnológica** | NestJS 12, TypeScript (ESM), MongoDB e Mongoose. |
| **Runtime** | Node.js 24 LTS. |
| **Arquitetura** | Monólito modular, organizado por características do produto. |
| **Organização** | Cada característica do produto (CP) possui seu módulo em `src/modules/`. |
| **API** | REST, com prefixo `/api/v1`. |
| **Documentação** | Swagger disponível em `/api/v1/docs`. |
| **Processo de desenvolvimento** | AUP com TDD (*Test-Driven Development*). |
| **Qualidade** | CI com lint, build, testes unitários, cobertura mínima e testes e2e. |

**Princípio fundamental:** nenhuma regra de negócio deve ser implementada sem que exista um teste que falhe previamente, seguindo o ciclo TDD.

### 1.1 Primeiro uso do backend

Para configurar o ambiente local pela primeira vez, execute os comandos abaixo na sequência:

**1. Configurar a versão do Node.js e acessar o backend:**

```bash
nvm use
cd backend
```

O comando `nvm use` utiliza a versão definida no arquivo `.nvmrc` (Node 24.22.1).

**2. Configurar as variáveis de ambiente:**

```bash
cp .env.example .env
```

**3. Iniciar o banco de dados:**

```bash
docker compose up -d mongo
```

Nesse fluxo, somente o MongoDB será executado em container. A API será iniciada localmente, permitindo o uso de hot reload.

**4. Instalar as dependências:**

```bash
npm ci
```

**5. Iniciar a API:**

```bash
npm run start:dev
```

A API ficará disponível em:

`http://localhost:3000/api/v1`

**6. Executar os testes durante o desenvolvimento:**

Em outro terminal, execute:

```bash
npm run test:watch
```

### 1.2 Observações sobre a execução

> **Execução em container:** caso opte por executar a API dentro de um container, utilize:
>
> ```bash
> docker compose up -d --build
> ```
>
> Não execute `npm run start:dev` simultaneamente, pois os dois processos disputarão a porta 3000.

> **Primeira execução dos testes e2e:** o `mongodb-memory-server` realiza o download do binário do MongoDB, o que pode levar aproximadamente um minuto. Após o primeiro download, o arquivo permanece em cache.
>
> Os testes e2e não dependem do Docker.

---

## 2. Estrutura de pastas

O backend utiliza uma organização modular, separando os componentes de infraestrutura, funcionalidades do produto, testes e implantação.

### 2.1 Organização geral

```text
backend/
├── src/
│   ├── main.ts                 # Inicialização da aplicação
│   ├── app.module.ts           # Configuração principal, Mongo, logger e módulos
│   ├── app.setup.ts            # Configurações globais e Swagger
│   │
│   ├── config/
│   │   ├── env.validation.ts   # Validação das variáveis de ambiente
│   │   └── mongo-uri.ts        # Montagem da URI de conexão do MongoDB
│   │
│   ├── common/                 # Componentes compartilhados
│   │   ├── crypto/             # Hash de senha, cifra e blind index do CPF
│   │   ├── mail/               # Serviço de e-mail
│   │   └── validators/         # Validadores reutilizáveis (CPF, CNPJ etc.)
│   │
│   └── modules/                # Módulos das características do produto
│       ├── auth/               # Autenticação, JWT e controle de acesso
│       │   └── password-reset/ # Recuperação de acesso por e-mail (HU10)
│       ├── users/              # Consumidores, produtores e administradores
│       ├── producer-profile/   # Perfil público e trajetória do produtor (HU12)
│       ├── health/             # Verificação de disponibilidade (live/ready)
│       └── metrics/            # Métricas para Prometheus
│
├── test/
│   ├── setup/                  # Infraestrutura dos testes e2e
│   ├── utils/
│   │   ├── test-app.ts         # Criação da aplicação para testes
│   │   └── auth.ts              # Autenticação e preparação de usuários
│   ├── support/                # Módulos auxiliares exclusivos dos testes
│   ├── factories/              # Geradores de dados de teste
│   └── *.e2e-spec.ts            # Testes de integração por módulo ou história
│
├── deploy/                     # Configurações de produção
├── ../docs/backend/            # Documentação técnica no MkDocs
├── Dockerfile                  # Imagem da API
└── docker-compose.yml          # MongoDB local e API opcional
```

O arquivo `app.setup.ts` concentra as configurações globais da aplicação, como `trust proxy`, CORS, métricas e Swagger. Ele é utilizado tanto na inicialização da API quanto nos testes e2e.

O diretório `common/` deve conter apenas componentes reutilizáveis e transversais, sem regras específicas de uma característica do produto.

### 2.2 Anatomia de um módulo

Todos os módulos devem seguir uma organização padronizada, separando responsabilidades entre controllers, services, regras de domínio, DTOs e schemas.

A estrutura abaixo utiliza como exemplo o módulo de pré-reservas (CP6):

```text
src/modules/reservations/
├── reservations.module.ts
├── reservations.controller.ts
├── reservations.service.ts
├── reservations.service.spec.ts
│
├── domain/
│   ├── reservation-status.ts
│   └── reservation-status.spec.ts
│
├── dto/
│   ├── create-reservation.dto.ts
│   └── reservation.response.ts
│
└── schemas/
    └── reservation.schema.ts
```

**Responsabilidade de cada componente:**

| Componente | Responsabilidade |
|---|---|
| `*.module.ts` | Registrar controllers, services e schemas do módulo. |
| `*.controller.ts` | Receber requisições HTTP, validar entradas e encaminhar chamadas ao service. |
| `*.service.ts` | Orquestrar operações, acessar o banco e aplicar regras de negócio. |
| `*.service.spec.ts` | Testar isoladamente o comportamento do service. |
| `domain/` | Concentrar regras de negócio puras, independentes do NestJS e do banco. |
| `dto/` | Definir os formatos de entrada e saída da API. |
| `schemas/` | Definir os modelos e a estrutura dos documentos no MongoDB. |

### 2.3 Regras de separação de responsabilidades

A implementação deve respeitar os limites de cada camada.

| Camada | Pode fazer | Não pode fazer |
|---|---|---|
| **Controller** | Receber e validar requisições, chamar services e devolver DTOs. | Implementar regras de negócio ou acessar diretamente o banco. |
| **Service** | Orquestrar acesso ao banco, aplicar regras de domínio e lançar exceções HTTP. | Depender de detalhes específicos de `req` e `res`. |
| **Domain** | Implementar funções e classes puras que representam regras de negócio (RNs). | Importar NestJS, Mongoose ou executar operações de I/O. |
| **DTO de resposta** | Selecionar explicitamente os campos que serão expostos pela API. | Retornar diretamente documentos do MongoDB, expondo dados privados. |

> **Atenção à LGPD:** nunca retorne diretamente um documento do MongoDB como resposta da API. Utilize DTOs de saída para controlar quais informações serão disponibilizadas, evitando exposição indevida de CPF, senhas e outros dados pessoais.

### 2.4 Geração de novos módulos

Para gerar o esqueleto inicial de um módulo, utilize:

```bash
npx nest g resource modules/<nome> --no-spec
```

Durante a geração, selecione a opção **REST API**.

O NestJS criará uma estrutura inicial contendo a pasta `entities/`. Renomeie essa pasta para `schemas/` e ajuste os demais arquivos conforme a anatomia de módulo definida neste guia.

A opção `--no-spec` é intencional: os testes devem ser escritos manualmente e antes da implementação, seguindo o TDD.

### 2.5 Convenções de código

Para manter a consistência entre os módulos, devem ser adotadas as seguintes convenções:

| Elemento | Convenção |
|---|---|
| Arquivos | `kebab-case` |
| Classes | `PascalCase` |
| Imports relativos | Devem terminar em `.js`. |
| Rotas e campos da API | Devem seguir uma nomenclatura única, definida em conjunto pela equipe. |

**Importante sobre ESM:**

Os imports relativos devem utilizar a extensão `.js`, mesmo quando o arquivo de origem for `.ts`.

Exemplo:

```typescript
import { ReservationsService } from './reservations.service.js';
```

A ausência da extensão `.js` pode causar falhas durante o build.

**Sugestão de padronização:** utilizar inglês no código e português nas mensagens apresentadas aos usuários.

---

## 3. Estratégia de testes

O backend utiliza dois tipos principais de testes: unitários e de integração ponta a ponta (*End-to-End — E2E*).

Cada modalidade possui uma finalidade específica dentro da estratégia TDD.

### 3.1 Comparação entre testes unitários e e2e

| Critério | Testes unitários | Testes e2e |
|---|---|---|
| Arquivos | `*.spec.ts`, próximos ao código em `src/`. | `test/*.e2e-spec.ts`. |
| Objetivo | Validar regras de negócio isoladamente. | Validar histórias de usuário por meio da API. |
| Referência | Regras de negócio (RNs). | Histórias de usuário (HUs) e critérios de aceitação (CAs). |
| Banco de dados | Não utilizam banco real; usam mocks ou funções puras. | Utilizam MongoDB em memória. |
| Velocidade | Milissegundos. | Segundos. |
| Execução | `npm test` ou `npm run test:watch`. | `npm run test:e2e`. |
| Cobertura | Mínimo de 80% por arquivo nas camadas definidas. | Não possui meta de cobertura percentual. |

### 3.2 O que deve ser testado em cada modalidade?

| Elemento | Tipo de teste | Exemplo |
|---|---|---|
| Regras de negócio (RN01–RN44) | Unitário | Verificar se uma pré-reserva pode ser cancelada. |
| Critérios de aceitação de uma HU | E2E | Verificar se o cancelamento altera o status da pré-reserva. |
| Permissões e autorização (RNF08) | E2E | Perfil incorreto retorna 403; usuário não autenticado retorna 401. |
| Validação de entrada (RNF03) | E2E | Payload inválido retorna 400 com mensagem de validação. |

**Cobertura mínima de testes unitários:**

A cobertura deve ser de pelo menos **80% por arquivo** nas seguintes camadas:

- Services.
- Guards.
- Policies.
- Diretório `domain/`.
- Diretório `common/`.

O CI verifica essa cobertura automaticamente.

---

## 4. Desenvolvimento orientado a testes (TDD)

O TDD (*Test-Driven Development*) é a abordagem adotada para implementar as funcionalidades do backend.

O desenvolvimento segue três etapas principais: RED, GREEN e REFACTOR.

### 4.1 Ciclo TDD

| Etapa | Objetivo | Resultado esperado |
|---|---|---|
| 🔴 **RED** | Escrever um teste que representa o comportamento esperado. | O teste falha porque a implementação ainda não existe ou está incompleta. |
| 🟢 **GREEN** | Implementar o mínimo necessário para atender ao teste. | O teste passa. |
| 🔵 **REFACTOR** | Melhorar a organização e a qualidade do código. | O código fica mais limpo, mantendo os testes aprovados. |

<pre>
       🔴 RED
   Escrever um teste
       que falha
          |
          v
      🟢 GREEN
  Implementar o mínimo
    para passar
          |
          v
     🔵 REFACTOR
  Melhorar o código
  mantendo os testes
       aprovados
          |
          +----------> Repetir o ciclo
</pre>

### 4.2 Exemplo prático: HU18 — Cancelar pré-reserva

A HU18 será utilizada como exemplo para demonstrar a aplicação do TDD.

**Regra de negócio relacionada:**

> **RN41:** o visitante só pode cancelar uma solicitação de pré-reserva enquanto ela estiver pendente.

#### Etapa 1 — RED: escrever o teste

Antes de implementar a funcionalidade, escreva o teste que representa a regra de negócio.

Arquivo: `src/modules/reservations/domain/reservation-status.spec.ts`

```typescript
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

Execute:

```bash
npm run test:watch
```

O teste deverá falhar inicialmente, pois a função ainda não foi implementada.

Após confirmar a falha, faça o commit do teste:

```bash
git add .
git commit -m "test: adiciona testes para cancelamento de pré-reserva"
```

#### Etapa 2 — GREEN: implementar o comportamento

Agora implemente somente o necessário para que os testes passem.

Arquivo: `src/modules/reservations/domain/reservation-status.ts`

```typescript
export type ReservationStatus =
  | 'PENDENTE'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CANCELADA';

export function canCancel(status: ReservationStatus): boolean {
  return status === 'PENDENTE';
}
```

Execute novamente os testes. Se todos passarem, faça o commit da implementação:

```bash
git add .
git commit -m "feat: implementa regra de cancelamento de pré-reserva"
```

#### Etapa 3 — REFACTOR: melhorar a implementação

Com os testes aprovados, revise o código para:

- Melhorar nomes de variáveis e funções.
- Eliminar duplicações.
- Simplificar estruturas desnecessariamente complexas.
- Melhorar a legibilidade e a organização.

Após cada alteração, execute novamente os testes para garantir que o comportamento continua correto.

#### Etapa 4 — E2E: validar os critérios de aceitação

Depois do teste unitário, valide o comportamento da funcionalidade por meio da API.

Arquivo: `test/reservations.e2e-spec.ts`

```typescript
import { createTestApp, TestApp } from './utils/test-app.js';

describe('HU18 — Cancelar pré-reserva (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t.close();
  });

  it('CA03: após o cancelamento, a solicitação apresenta status CANCELADA', async () => {
    // arrange: cria visitante e pré-reserva pendente
    // act: PATCH /api/v1/reservations/:id/cancel
    // assert: 200 e body.status === 'CANCELADA'
  });

  it('RN41: retorna 409 ao cancelar pré-reserva já aceita', async () => {
    /* ... */
  });

  it('RNF08: retorna 403 quando outro usuário tenta cancelar', async () => {
    /* ... */
  });
});
```

Cada critério de aceitação deve ser representado por um teste correspondente, contemplando também os cenários negativos relevantes.

### 4.3 Rastreabilidade dos testes

Os nomes dos testes devem começar pelo identificador do requisito relacionado.

Exemplos:

- `HU18`: identifica a história de usuário.
- `CA03`: identifica o critério de aceitação.
- `RN41`: identifica a regra de negócio.
- `RNF08`: identifica o requisito não funcional.

Essa convenção facilita a rastreabilidade entre código, testes e documentação do projeto, além de apoiar a atualização da matriz de rastreabilidade durante a fase de Construção.

---

## 5. Ferramentas e recursos de teste

O projeto disponibiliza ferramentas auxiliares para simplificar a criação dos testes, padronizar a preparação dos dados e evitar duplicação de código.

### 5.1 Criação da aplicação de teste — `createTestApp()`

Arquivo: `test/utils/test-app.ts`

A função `createTestApp()` inicializa a aplicação completa para testes e2e, utilizando a mesma configuração global da API e um banco de dados exclusivo para o arquivo de teste.

Isso permite executar os testes sem interferência entre diferentes arquivos.

**Recursos disponibilizados:**

| Recurso | Finalidade |
|---|---|
| `t.request()` | Disponibiliza o cliente HTTP do Supertest. |
| `t.connection` | Permite acessar a conexão Mongoose para preparação de dados. |
| `t.clearDatabase()` | Limpa as coleções do banco de teste. |
| `t.close()` | Encerra a aplicação e o banco de teste. |

**Exemplo de utilização:**

```typescript
const t = await createTestApp();

t.request().get('/api/v1/...'); // Cliente HTTP
t.connection;                    // Conexão Mongoose

await t.clearDatabase();         // Limpeza do banco
await t.close();                 // Encerramento
```

**Substituição de dependências externas:**

Quando uma funcionalidade depender de serviços externos, como o envio de e-mails, é possível substituir a dependência por um mock.

```typescript
const t = await createTestApp((builder) =>
  builder.overrideProvider(MailService).useValue({
    send: vi.fn(),
  }),
);
```

> **Importante:** chame `createTestApp()` uma única vez por arquivo de teste, dentro do `beforeAll`.

### 5.2 Autenticação nos testes e2e

Arquivo: `test/utils/auth.ts`

O projeto disponibiliza funções auxiliares para criar usuários, autenticar perfis e gerar tokens utilizados nos testes.

```typescript
import {
  loginAs,
  seedUser,
  forgeToken,
} from './utils/auth.js';
```

**Principais funções:**

| Função | Finalidade |
|---|---|
| `seedUser()` | Cria um usuário para o cenário de teste. |
| `loginAs()` | Cria um usuário e realiza o login, retornando o token JWT. |
| `forgeToken()` | Gera tokens personalizados, inclusive expirados. |

**Exemplo de utilização:**

```typescript
// Cria um produtor e realiza o login
const token = await loginAs(t, Role.PRODUTOR);

// Realiza uma requisição autenticada
t.request()
  .get('/api/v1/...')
  .set('Authorization', `Bearer ${token}`);

// Cria um administrador diretamente
const { user, email, senha } = await seedUser(
  t,
  Role.ADMINISTRADOR,
);

// Gera um token expirado
forgeToken(
  {
    sub: user.id,
    perfil: 'ADMINISTRADOR',
  },
  {
    expiresIn: -60,
  },
);
```

Produtores e administradores ainda não possuem cadastro público (HU02/HU03). Por isso, a função `seedUser()` cria essas contas diretamente por meio do `UsersService`.

### 5.3 Fábricas de dados de teste

Diretório: `test/factories/`

As fábricas são responsáveis por gerar dados de teste válidos e aleatórios, evitando a repetição de objetos extensos e a dependência de valores fixos.

**Exemplo de utilização:**

```typescript
import { makeCpf, makeCnpj } from '@test/factories';

makeCpf();                        // CPF válido
makeCnpj({ alfanumerico: true }); // CNPJ alfanumérico
```

**Regra para novas entidades:**

Sempre que uma nova entidade for criada, sua respectiva fábrica também deverá ser implementada, seguindo o padrão:

`make<Entidade>(overrides)`

Exemplo: `test/factories/produto.factory.ts`

```typescript
export function makeProduto(
  overrides: Partial<CreateProdutoDto> = {},
): CreateProdutoDto {
  return {
    nome: 'Alface crespa orgânica',
    categoria: 'hortalica',
    disponivel: true,
    ...overrides,
  };
}
```

O parâmetro `overrides` permite modificar somente os campos necessários para cada cenário de teste.

Após criar uma fábrica, exporte-a em:

`test/factories/index.ts`

### 5.4 Comandos disponíveis

| Comando | Finalidade |
|---|---|
| `npm run start:dev` | Inicia a API local com hot reload. Exige o MongoDB em execução. |
| `npm run test:watch` | Executa os testes unitários continuamente durante o desenvolvimento. |
| `npm test` | Executa todos os testes unitários uma única vez. |
| `npm run test:cov` | Gera o relatório de cobertura, verificando o mínimo exigido. |
| `npm run test:e2e` | Executa os testes e2e com MongoDB em memória. |
| `npm run lint` | Verifica problemas de lint no código. |
| `npm run format:check` | Verifica a formatação sem modificar os arquivos. |
| `npm run typecheck` | Executa `tsc --noEmit` em `src/` e `test/`. |
| `npm run build` | Compila a aplicação para o diretório `dist/`. |

---

## 6. Autenticação e proteção de rotas

A API adota a política de **negação de acesso por padrão**.

Isso significa que toda rota exige autenticação, exceto aquelas explicitamente identificadas como públicas.

O `JwtAuthGuard` é global e verifica o token JWT enviado no cabeçalho:

```http
Authorization: Bearer <token>
```

O token é obtido por meio do endpoint:

`POST /api/v1/auth/login`

### 6.1 Ordem de execução dos guards

Os guards globais são executados na seguinte ordem:

1. `ThrottlerGuard`: controla a quantidade de requisições.
2. `JwtAuthGuard`: verifica a autenticação.
3. `RolesGuard`: verifica as permissões do perfil.

### 6.2 Como configurar o acesso de uma rota?

| Necessidade | Implementação |
|---|---|
| Rota pública, acessível sem autenticação | `@Public()` |
| Rota acessível a qualquer usuário autenticado | Não utilizar decorator adicional. |
| Rota exclusiva de determinados perfis | `@Roles(Role.PRODUTOR)` |
| Rota compartilhada entre produtor e administrador | `@Roles(Role.PRODUTOR, Role.ADMINISTRADOR)` |
| Rota sensível a tentativas excessivas | `@AuthThrottle()` |

O decorator `@Roles()` deve refletir os perfis explicitamente autorizados para determinada operação.

### 6.3 Exemplo de implementação

```typescript
@Roles(Role.PRODUTOR)
@ApiBearerAuth()
@Post()
create(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CreateProdutoDto,
) {
  return this.produtos.create(user.id, dto);
}
```

Nesse exemplo, somente usuários com perfil de produtor podem acessar a rota. O identificador do proprietário é obtido diretamente do token autenticado, nunca do corpo da requisição.

### 6.4 Regras importantes de segurança

**1. Não existe hierarquia automática entre perfis.**

Um administrador não possui acesso automático às rotas exclusivas de produtores. Para permitir esse acesso, o perfil `ADMINISTRADOR` precisa estar explicitamente listado em `@Roles()`.

**2. Papel e propriedade são verificações diferentes.**

O guard verifica se o usuário possui o perfil adequado. Entretanto, a verificação de que determinado recurso pertence ao usuário é responsabilidade do service.

Exemplo:

```typescript
recurso.ownerId === user.id
```

Caso o recurso pertença a outro usuário, a operação deverá retornar `403 Forbidden`.

Essa verificação está relacionada às RN17, RN22, RN25 e RN38 e deve possuir testes unitários.

**3. O token deve conter somente informações necessárias.**

O JWT deve carregar apenas:

- `sub`: identificador do usuário.
- `perfil`: papel do usuário.

Não inclua CPF, e-mail ou nome no token.

**4. Proteção do CPF.**

O CPF deve ser armazenado utilizando duas representações:

| Campo | Finalidade |
|---|---|
| `cpfHash` | Blind index utilizado para busca e verificação de unicidade. |
| `cpfCifrado` | CPF cifrado com AES-GCM, utilizado quando necessário para exibição autorizada e mascarada. |

Conforme a RN05, o CPF identifica o usuário, mas não é utilizado para autenticação. O login é realizado por e-mail, por meio de `UsersService.findByEmail()`.

As contas administrativas (HU03) não possuem CPF. Por isso, o índice único de `cpfHash` deve ser esparso.

---

## 7. Combinados da equipe

As seguintes regras devem ser respeitadas por todos os integrantes durante o desenvolvimento.

1. **Teste primeiro:** o commit do teste (`test:`) deve ocorrer antes do commit da implementação (`feat:`). Essa sequência registra a aplicação do TDD no histórico do Git.
2. **Cobertura mínima:** manter pelo menos 80% de cobertura por arquivo nas camadas de regras de negócio. O CI bloqueará a integração caso o mínimo não seja atingido.
3. **Testes negativos obrigatórios:** toda rota protegida deve possuir testes e2e verificando acesso sem autenticação (401) e com perfil incorreto (403).
4. **Não utilizar testes exclusivos ou ignorados:** não enviar PRs contendo `it.skip` ou `it.only`. O CI já bloqueia automaticamente o uso de `it.only`.
5. **Todo bug deve gerar um teste:** reproduzir o problema por meio de um teste que falha antes de implementar a correção, utilizando o prefixo `fix:` no commit da implementação.
6. **Branches e Pull Requests:** criar branches `feat/<descricao>` a partir da `dev`, utilizando o script `./scripts/dev.sh branch feat/<descricao>`, e abrir o PR direcionado à branch `dev`.

Para mais detalhes sobre o fluxo de contribuição, consulte [Como Contribuir](../contribuindo.md).

### 7.1 Checklist obrigatório do Pull Request

Antes de abrir um PR, confirme todos os itens abaixo:

- [ ] Os testes foram escritos antes da implementação, com commits `test:` seguidos de `feat:`.
- [ ] Os nomes dos testes identificam as respectivas HUs, CAs, RNs ou RNFs.
- [ ] `npm run lint` executou sem erros.
- [ ] `npm run format:check` executou sem erros.
- [ ] `npm run typecheck` executou sem erros.
- [ ] `npm run test:cov` executou sem erros e atingiu a cobertura mínima.
- [ ] `npm run test:e2e` executou sem erros.
- [ ] `npm run build` executou sem erros.
- [ ] Uma fábrica foi criada para cada nova entidade.
- [ ] Os DTOs de resposta não expõem dados privados, como CPF, senha ou e-mail de terceiros.
- [ ] As novas rotas estão documentadas corretamente no Swagger.
- [ ] Os campos dos DTOs possuem descrição e exemplo.
- [ ] As respostas de sucesso 2xx possuem `type` documentado.

> O teste `openapi.spec.ts` verifica automaticamente se os requisitos de documentação da API estão sendo respeitados.

O PR somente poderá ser integrado à `dev` quando todas as verificações do CI estiverem aprovadas.

---

## 8. Problemas comuns no primeiro uso

Esta seção reúne problemas que podem ocorrer durante a configuração do ambiente ou a execução dos testes, indicando suas possíveis causas e soluções.

| Sintoma | Causa provável | Solução |
|---|---|---|
| `EADDRINUSE:3000` | API do Compose e `npm run start:dev` executados simultaneamente. | Para desenvolvimento local, utilize `docker compose up -d mongo`. Para execução em container, utilize `docker compose up -d --build`, sem iniciar a API localmente. |
| `MongoServerError` ou `ECONNREFUSED` | MongoDB não está em execução. | Execute `docker compose up -d mongo` e verifique com `docker compose ps`. |
| `featureCompatibilityVersion 8.3` | Volume criado com MongoDB 8.3, enquanto a imagem atual utiliza MongoDB 8.0 LTS. | Recrie o volume de desenvolvimento ou realize dump/restore. Consulte [Operação — Volume criado por Mongo 8.3](operacao.md#75-volume-criado-por-mongo-83). |
| `Config validation error: "JWT_SECRET" is required` | Arquivo `.env` criado antes da inclusão das configurações de autenticação. | Copie as variáveis de autenticação presentes no `.env.example` para o `.env`. |
| `"MAIL_TRANSPORT" must be [smtp]` ou `"APP_PUBLIC_URL" is required` | API executada com `NODE_ENV=production` sem as configurações de e-mail da HU10. | Preencha a seção de recuperação de acesso no `deploy/.env`. Consulte [Operação](operacao.md). |
| Link de recuperação não chega no ambiente de desenvolvimento. | `MAIL_TRANSPORT=log` está configurado como padrão. | Procure por `[e-mail de desenvolvimento]` nos logs de `./scripts/dev.sh logs api`. |
| `vitest: command not found` | Dependências ausentes ou instalação incompleta. | Execute `npm ci` dentro da pasta `backend/`. |
| Primeira execução de `test:e2e` demora. | `mongodb-memory-server` está baixando o binário do MongoDB. | Aguarde o download. Nas próximas execuções, o arquivo será reutilizado do cache. |
| Docker não mostra os containers no WSL. | Contexto de execução diferente do Docker Desktop. | Utilize o PowerShell ou o Docker Desktop para acessar o ambiente Docker do projeto. |
| `npm ci` falha por incompatibilidade de versão do Node.js. | Versão do Node diferente da especificada no `.nvmrc`. | Execute `nvm use` para utilizar a versão 24.22.1. |

---

## 9. Referências e documentação complementar

Este guia deve ser utilizado em conjunto com os demais documentos técnicos e de desenvolvimento da Rede Cafuringa.

| Documento | Finalidade |
|---|---|
| [Prova de Conceito (PoC)](poc.md) | Decisões arquiteturais, tecnologias e análise de riscos técnicos. |
| [Como Contribuir](../contribuindo.md) | Orientações sobre branches, commits e Pull Requests. |
| [Operação](operacao.md) | Configuração, execução e manutenção do ambiente. |
| [Documentação de implementação](implementacao/) | Detalhamento técnico das histórias de usuário implementadas. |

**Orientação final:** todos os integrantes devem seguir as convenções deste guia para garantir consistência, qualidade, rastreabilidade e facilidade de manutenção do backend da Rede Cafuringa.