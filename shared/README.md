# shared/ — contrato entre backend e frontend

`openapi.json` é o **contrato da API** (OpenAPI 3). Ele é **gerado a partir do código do backend**; nunca edite à mão.

| Quem | O que faz com o contrato |
|---|---|
| Backend | É a fonte: os decorators do NestJS (`@ApiOperation`, DTOs) produzem o documento |
| Frontend | Gera `app/src/shared/api/schema.ts` a partir dele; não escreva DTO de API à mão |
| Documentação | `docs/shared/api.md` é gerado do mesmo arquivo |

## Regenerar

```bash
cd backend && npm run openapi:export     # atualiza shared/openapi.json
```

A geração não precisa de banco de dados nem sobe servidor (usa o modo `preview` do Nest, com valores *placeholder* para o validador de ambiente). A saída é determinística.

O CI regenera o arquivo e **falha se houver diferença** (`git diff --exit-code`). Mudou um controller ou DTO? Rode o comando acima e commite o `openapi.json` junto.

Versionamento e regras para mudanças que quebram o contrato: [`docs/shared/contratos.md`](../docs/shared/contratos.md).
