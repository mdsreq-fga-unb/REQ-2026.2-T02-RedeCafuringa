# Referência da API

A documentação de cada endpoint — incluindo rotas, parâmetros, corpos das requisições, respostas e erros — está disponível no **Swagger UI**, gerado a partir do mesmo contrato OpenAPI consumido pelo frontend.

## 1. Acessos à documentação

- **[Abrir o Swagger UI](../../api/index.html){ target="_blank" }**: apresenta a documentação correspondente ao arquivo `shared/openapi.json` utilizado nesta versão do site.
- **Swagger local:** [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs) — disponível durante a execução local do backend, com suporte à funcionalidade *Try it out*.
- **Contrato OpenAPI bruto:** [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json).

---

## 2. Manutenção da documentação

A documentação dos endpoints é escrita **diretamente no código**, por meio dos decorators `@nestjs/swagger` aplicados aos controllers e DTOs do backend.

Portanto, esta página não replica a documentação técnica de cada rota. O Swagger UI é a referência para consultar os detalhes atualizados da API.

As convenções, o versionamento do contrato e as verificações automatizadas no CI estão descritos em [Contrato da API](contratos.md).