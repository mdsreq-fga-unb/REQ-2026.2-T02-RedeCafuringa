# Contrato da API (OpenAPI)

O contrato entre backend e frontend é o arquivo [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json), **gerado do código do backend**. A referência legível de cada endpoint está em [Referência da API](api.md).

## Fluxo

```text
decorators do NestJS (backend)  ──►  shared/openapi.json  ──►  app/src/shared/api/schema.ts (front)
                                          │
                                          └──►  docs/shared/api.md (referência)
```

| Etapa | Comando | Quando |
|---|---|---|
| Tudo de uma vez | `./scripts/dev.sh contract` | Sempre que mudar um controller ou DTO |
| Só o contrato | `cd backend && npm run openapi:export` | |
| Só os tipos do front | `cd app && npm run api:types` | |
| Só a referência | `node scripts/gen-api-docs.mjs` | |

Os arquivos gerados **são commitados** e **nunca editados à mão**. A geração não precisa de banco de dados e é determinística.

## Guardas no CI

| Guarda | Falha quando |
|---|---|
| `backend` → *Contract drift* | `shared/openapi.json` difere do que o código gera |
| `frontend` → *Contract types drift* | `schema.ts` difere do que o contrato gera |
| teste `openapi.spec.ts` | o documento é inválido, falta resumo/`operationId`/tag, algum 4xx sem `ErrorResponse`, ou aparece dado sensível |

Na prática: mudou um endpoint? O CI obriga a atualizar o contrato **e** os tipos do front no mesmo PR, então uma incompatibilidade vira erro de compilação, não bug em produção.

## Versionamento (`info.version`, SemVer)

A versão fica em `OPENAPI_VERSION`, em `backend/src/app.setup.ts`. Suba-a **no mesmo PR** que muda o contrato.

| Mudança | Exemplo | Versão |
|---|---|---|
| **Quebra** o contrato | remover ou renomear campo, rota ou `operationId`; campo opcional vira obrigatório; mudar tipo; remover valor de enum; endurecer validação | **major** (enquanto `0.x`: sobe o **minor**) |
| Compatível | nova rota; novo campo opcional na resposta; novo valor de enum só na saída | minor |
| Sem efeito no contrato | texto de descrição, exemplo | patch |

**Mudança que quebra:** avise o time do front no PR, atualize `app/` no mesmo PR (o CI exige) e descreva o impacto na descrição. Prefira um período em que as duas formas convivem a trocar de uma vez.

## Convenções da API

- **Prefixo:** `/api/v1`. Uma versão incompatível futura ganha `/api/v2`.
- **Erros:** corpo `ErrorResponse` (`statusCode`, `message`, `error`); `message` é lista nas falhas de validação (400).
- **Rastreabilidade:** o cliente envia `x-request-id` (`[A-Za-z0-9._-]{1,128}`); a API devolve o mesmo id ou gera um UUID.
- **Limite de tentativas:** login e cadastro respondem 429 com `Retry-After` (segundos).
- **Autenticação:** `Authorization: Bearer <JWT>`; toda rota exige login, exceto as marcadas como públicas.
- **Dados pessoais:** respostas nunca trazem hash de senha nem CPF completo.
