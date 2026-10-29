# Referência da API

> Gerado automaticamente de [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json) por `scripts/gen-api-docs.mjs`. **Não edite à mão**: mude os decorators do backend e rode `./scripts/dev.sh contract`.

**Rede Cafuringa API** · versão do contrato `0.1.0` · servidor `http://localhost:3000`

API REST da plataforma **Rede Cafuringa**.

**Autenticação.** `POST /auth/login` troca CPF e senha por um JWT. Envie-o em `Authorization: Bearer <token>`. Toda rota exige login, exceto as marcadas como públicas (negação por padrão).

**Rastreabilidade.** Envie `x-request-id` (1 a 128 caracteres de `A-Za-z0-9._-`). A API devolve o mesmo id no cabeçalho da resposta e nos logs; sem o cabeçalho, ou com valor inválido, gera um UUID.

**Erros.** Todo erro tem o corpo `ErrorResponse` (`statusCode`, `message`, `error`). Nas falhas de validação (400), `message` é uma lista.

**Limites.** Rotas de login e cadastro têm limite estrito de tentativas por IP; ao exceder, a resposta é 429 com `Retry-After` (segundos).

**Dados pessoais.** Respostas nunca trazem hash de senha nem o CPF completo (vem mascarado).

**Versão do contrato.** SemVer, em `info.version`. Veja docs/shared/contratos.md.

## auth

Login e dados da sessão (RN08)

### `POST /api/v1/auth/login`

**Autenticar com CPF e senha** · `operationId: authLogin` · pública

Troca CPF e senha (RN08) por um JWT, válido por `expiresIn` segundos. Rota pública com limite estrito de tentativas por IP.

**Corpo da requisição:** [LoginDto](#logindto)

| Status | Descrição | Corpo |
|---|---|---|
| 200 | Autenticado | [LoginResponse](#loginresponse) |
| 400 | Payload inválido (as mensagens vêm em `message`) | [ErrorResponse](#errorresponse) |
| 401 | CPF ou senha inválidos | [ErrorResponse](#errorresponse) |
| 403 | Conta desativada | [ErrorResponse](#errorresponse) |
| 429 | Muitas tentativas Cabeçalho `Retry-After`. | [ErrorResponse](#errorresponse) |

### `GET /api/v1/auth/me`

**Dados do usuário autenticado** · `operationId: authMe` · exige **Bearer JWT**

Devolve o perfil de quem é dono do token. CPF sempre mascarado.

| Status | Descrição | Corpo |
|---|---|---|
| 200 | Perfil do usuário | [UserResponse](#userresponse) |
| 401 | Sem token ou token inválido | [ErrorResponse](#errorresponse) |

## users

Cadastro de usuários (RN02, RN15)

### `POST /api/v1/users/consumers`

**Cadastrar consumidor** · `operationId: usersCreateConsumer` · pública

Cadastro público (HU01): dados obrigatórios (RN02), maioridade (RN15) e senha. O CPF é validado, normalizado e guardado cifrado; a resposta traz o CPF mascarado.

**Corpo da requisição:** [CreateConsumerDto](#createconsumerdto)

| Status | Descrição | Corpo |
|---|---|---|
| 201 | Consumidor criado | [UserResponse](#userresponse) |
| 400 | Dados inválidos ou menor de 18 anos | [ErrorResponse](#errorresponse) |
| 409 | CPF já cadastrado | [ErrorResponse](#errorresponse) |
| 429 | Muitas tentativas Cabeçalho `Retry-After`. | [ErrorResponse](#errorresponse) |

## health

Saúde do serviço, para o Docker e monitores externos

### `GET /api/v1/health`

**Prontidão (alias de /health/ready)** · `operationId: healthReady` · pública

Responde 200 só quando o MongoDB está acessível.

| Status | Descrição | Corpo |
|---|---|---|
| 200 | The Health Check is successful | objeto (veja o contrato) |
| 503 | The Health Check is not successful | objeto (veja o contrato) |

### `GET /api/v1/health/ready`

**Prontidão** · `operationId: healthReadyAlias` · pública

Responde 200 só quando o MongoDB está acessível. Usado pelo proxy (tráfego) e por monitores externos.

| Status | Descrição | Corpo |
|---|---|---|
| 200 | The Health Check is successful | objeto (veja o contrato) |
| 503 | The Health Check is not successful | objeto (veja o contrato) |

### `GET /api/v1/health/live`

**Vivacidade** · `operationId: healthLive` · pública

Responde 200 enquanto o processo está de pé, sem consultar o banco. Usado pelo HEALTHCHECK do Docker.

| Status | Descrição | Corpo |
|---|---|---|
| 200 | The Health Check is successful | objeto (veja o contrato) |
| 503 | The Health Check is not successful | objeto (veja o contrato) |

## Schemas

### CreateConsumerDto

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | string | sim |  Ex.: `"Maria das Graças"`. |
| `cpf` | string | sim | Com ou sem máscara Ex.: `"529.982.247-25"`. |
| `telefone` | string | sim | DDD + número Ex.: `"61999990000"`. |
| `email` | string | sim |  Ex.: `"maria@exemplo.com"`. |
| `dataNascimento` | string | sim | AAAA-MM-DD Ex.: `"1990-05-10"`. |
| `senha` | string | sim | 8 a 128 caracteres, com pelo menos uma letra e um número Ex.: `"SenhaForte123"`. |

### UserResponse

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | sim |  |
| `nome` | string | sim |  |
| `email` | string | sim |  |
| `telefone` | string | sim |  |
| `perfil` | `CONSUMIDOR` \| `PRODUTOR` \| `ADMINISTRADOR` | sim |  |
| `cpf` | string | sim | CPF mascarado Ex.: `"***.982.247-**"`. |

### ErrorResponse

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `statusCode` | number | sim | Mesmo valor do status HTTP Ex.: `400`. |
| `message` | string \| string[] | sim | Texto do erro. Nas falhas de validação (400) é uma lista, uma mensagem por campo inválido. |
| `error` | string | sim | Nome do status HTTP Ex.: `"Bad Request"`. |

### LoginDto

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `cpf` | string | sim | Com ou sem máscara Ex.: `"529.982.247-25"`. |
| `senha` | string | sim |  Ex.: `"SenhaForte123"`. |

### LoginResponse

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `accessToken` | string | sim | JWT a enviar em Authorization: Bearer <token> |
| `tokenType` | string | sim |  Ex.: `"Bearer"`. |
| `expiresIn` | number | sim | Validade do token, em segundos Ex.: `900`. |
| `usuario` | [UserResponse](#userresponse) | sim |  |

