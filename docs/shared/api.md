# Referência da API

A referência de cada endpoint (rotas, parâmetros, corpos, respostas e erros) fica no **Swagger UI**, gerado do mesmo contrato que o frontend consome:

- **[Abrir o Swagger UI](../api/index.html){ target=_blank }**: sempre reflete o `shared/openapi.json` desta versão do site.
- **Swagger local** (com *Try it out*): `http://localhost:3000/api/v1/docs`, fora de produção.
- **Contrato bruto:** [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json).

A documentação de cada endpoint é escrita **no código** (decorators `@nestjs/swagger` dos controllers e DTOs), e não nesta página. Convenções, versionamento e guardas de CI estão em [Contrato da API](contratos.md).
