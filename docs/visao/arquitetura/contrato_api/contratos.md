# Contrato da API (OpenAPI)

O contrato entre backend e frontend é definido pelo arquivo [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json), **gerado diretamente a partir do código do backend**.

A referência legível de cada endpoint está disponível no [Swagger UI](../../api/index.html){ target="_blank" }, publicado no site e montado a partir desse mesmo arquivo. Consulte também a página [Referência da API](api.md).

## 1. Fluxo de geração

O contrato segue o fluxo abaixo:

```text
Decorators do NestJS (backend)
              |
              v
      shared/openapi.json
              |
              +--------------------------+
              |                          |
              v                          v
app/src/shared/api/schema.ts       Swagger UI no GitHub Pages
       (tipos do front)                    (/api/)
```

### 1.1. Comandos disponíveis

| Etapa | Comando | Quando executar |
|---|---|---|
| Gerar tudo | `./scripts/dev.sh contract` | Sempre que houver alteração em um controller ou DTO |
| Gerar somente o contrato | `cd backend && npm run openapi:export` | Quando for necessário atualizar apenas o OpenAPI |
| Gerar somente os tipos do frontend | `cd app && npm run api:types` | Quando for necessário atualizar apenas os tipos do frontend |

### 1.2. Arquivos gerados

O Swagger UI não é versionado diretamente no repositório. Durante o `mkdocs build`, o arquivo `shared/openapi.json` é copiado para `/api/` pelo hook `scripts/mkdocs_hooks.py`.

Os arquivos gerados do contrato, por outro lado, **devem ser commitados e nunca editados manualmente**.

A geração do contrato:

- Não exige conexão com o banco de dados;
- É determinística, ou seja, produz o mesmo resultado para o mesmo código e configuração.

---

## 2. Verificações automatizadas no CI

O CI possui verificações para garantir que o contrato e os tipos utilizados pelo frontend estejam sincronizados.

| Verificação | Falha quando |
|---|---|
| `backend` → *Contract drift* | O arquivo `shared/openapi.json` difere do documento gerado a partir do código do backend. |
| `frontend` → *Contract types drift* | O arquivo `schema.ts` difere dos tipos gerados a partir do contrato OpenAPI. |
| Teste `openapi.spec.ts` | O documento é inválido; falta resumo, `operationId` ou tag; alguma resposta 4xx não utiliza `ErrorResponse`; há exposição de dados sensíveis; falta descrição ou exemplo em campo de DTO; falta resposta 2xx com schema; ou um campo com `@IsOptional` aparece como obrigatório. |

**Na prática:** sempre que um endpoint for alterado, o CI exige que o contrato OpenAPI **e** os tipos do frontend sejam atualizados no mesmo PR.

Assim, incompatibilidades entre backend e frontend são identificadas durante a compilação e as verificações automatizadas, em vez de se tornarem bugs em produção.

---

## 3. Versionamento do contrato (`info.version`)

O versionamento segue o padrão **Semantic Versioning (SemVer)**.

A versão é definida pela variável `OPENAPI_VERSION`, em `backend/src/app.setup.ts`, e deve ser atualizada **no mesmo PR que modifica o contrato**.

| Tipo de mudança | Exemplos | Incremento |
|---|---|---|
| **Incompatível (breaking change)** | Remover ou renomear campo, rota ou `operationId`; transformar campo opcional em obrigatório; alterar tipo; remover valor de enum; tornar uma validação mais restritiva. | **Major**. Enquanto estiver na versão `0.x`, incrementar o **minor**. |
| **Compatível** | Adicionar nova rota; adicionar campo opcional à resposta; adicionar novo valor de enum somente na saída. | Minor |
| **Sem impacto no contrato** | Alterar textos de descrição ou exemplos. | Patch |

### 3.1. Procedimento para mudanças incompatíveis

Toda alteração que cause quebra de compatibilidade deve seguir estas regras:

1. Avisar o time do frontend na descrição do PR.
2. Atualizar o código em `app/` no mesmo PR, conforme exigido pelo CI.
3. Descrever explicitamente o impacto da alteração na descrição do PR.
4. Sempre que possível, adotar um período de convivência entre as duas formas do contrato, evitando substituí-las de uma só vez.

---

## 4. Convenções da API

As seguintes convenções devem ser respeitadas na implementação dos endpoints:

- **Prefixo:** todas as rotas utilizam `/api/v1`. Uma futura versão incompatível deverá utilizar `/api/v2`.
- **Formato de erros:** as respostas de erro seguem o formato `ErrorResponse`, composto por:
  - `statusCode`;
  - `message`;
  - `error`.

  Nas falhas de validação (`400`), o campo `message` contém uma lista de mensagens.

- **Rastreabilidade:** o cliente pode enviar o cabeçalho `x-request-id`, que deve corresponder ao padrão `[A-Za-z0-9._-]{1,128}`. A API devolve o mesmo identificador ou gera um UUID quando ele não é informado ou não é válido.
- **Limite de tentativas:** as operações de login e cadastro podem responder com status `429`, incluindo o cabeçalho `Retry-After`, cujo valor indica o tempo de espera em segundos.
- **Autenticação:** utiliza o cabeçalho `Authorization: Bearer <JWT>`. Todas as rotas exigem autenticação, exceto aquelas explicitamente marcadas como públicas.
- **Proteção de dados pessoais:** as respostas da API nunca devem incluir hashes de senha nem CPF completo.