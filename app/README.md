# Rede Cafuringa: app (frontend)

PWA em React 19 + TypeScript + Vite. Em produção é servido por nginx numa imagem Docker.

```bash
./scripts/dev.sh setup   # na raiz do repositório: dependências e arquivos de ambiente
./scripts/dev.sh up      # app em http://localhost:5173 (com API e banco)
./scripts/dev.sh check   # lint, format, typecheck, build e testes
```

Scripts do app (`npm run ...`): `dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:coverage`, `api:types` (tipos gerados do contrato da API), `pwa:icons` (ícones do PWA).

Variáveis de ambiente: veja `.env.example` (tudo com prefixo `VITE_` é público).

Documentação completa: [Frontend: operação](../docs/frontend/operacao.md), [Contrato da API](../docs/shared/contratos.md) e [Como contribuir](../docs/contribuindo.md).
