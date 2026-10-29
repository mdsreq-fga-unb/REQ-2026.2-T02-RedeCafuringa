# Infraestrutura: visão geral

## Estrutura do repositório

```text
backend/        API NestJS + MongoDB (Dockerfile, compose de dev, deploy/ de produção)
app/            Frontend React + Vite (PWA), Dockerfile e nginx
shared/         Contrato OpenAPI gerado do backend (openapi.json)
scripts/        dev.sh (comandos de rotina), smoke test da imagem, gerador da referência da API
docs/           Este site (MkDocs)
.github/        Workflows de CI/CD
compose.yaml    Ambiente local completo: mongo + api + app
```

Branches permanentes: `main`, `dev` (tronco) e `gh-pages` (site gerado). O resto é branch curta de trabalho.

## Esteiras de CI/CD

| Workflow | Jobs | Em PR (dev/main) | Em push |
|---|---|---|---|
| `ci.yml` (docs) | `docs-build`, `docs-deploy` | build | build e **deploy no GitHub Pages**, na `dev` e na `main` |
| `backend-ci.yml` | `backend` | sim | `dev`, `main` |
| `frontend-ci.yml` | `frontend` | sim | `dev`, `main` |
| `docker-ci.yml` | `docker-build`, `docker-publish`, `docker-manifest` | só build, scan e smoke | publica no GHCR (`dev`, `main`, tags `v*`) |
| `actionlint.yml`, `shellcheck.yml` | `actionlint`, `shellcheck` | sim | `dev`, `main` |

Todas as actions são fixadas por SHA de commit, com permissões mínimas (`contents: read`; `packages: write` só em quem publica; `pages`/`id-token` só no deploy das docs).

## Imagens (GHCR)

`ghcr.io/mdsreq-fga-unb/rede-cafuringa-api` e `…-app`, em `amd64` e `arm64` (runners nativos, sem emulação). Tags: `dev`, `main`, `sha-<curto>`, `latest` (só `main`) e `1.2.3` / `1.2` (tags `v*`). Os pacotes nascem privados; torná-los públicos é uma ação manual na página do pacote.

## Proteção do repositório

Ruleset nas branches `main` e `dev`: exige PR, bloqueia force-push e exclusão. **Ainda não há *required status checks*** nem aprovações obrigatórias (0). O GitHub Actions roda com permissão padrão `read`. Branches são apagadas após o merge.

## Registro de decisões

| Decisão | Motivo | Onde |
|---|---|---|
| Merge commit, sem squash | Preserva commits e autoria da equipe | [Como contribuir](../contribuindo.md) |
| Histórico do backend reescrito só nos 2 commits com `.venv-preview` (88 MB) | O venv foi versionado por engano; recriar só os afetados preservou os outros 246 commits, seus SHAs e assinaturas | histórico da `dev` |
| Contrato OpenAPI gerado do código, com guardas de drift no CI | Front e back não divergem em silêncio | [Contrato da API](../shared/contratos.md) |
| Lint por app (oxlint no backend, eslint no front) | Cada um já estava configurado; migrar não trazia ganho | `backend/`, `app/` |
| Trivy como imagem fixada por digest, não como action | Tags mutáveis de action de terceiros são risco de cadeia de suprimentos | `docker-ci.yml` |
| Base do nginx `1.30-alpine-slim` | A `1.29-alpine` tinha CVEs HIGH/CRITICAL com correção; a slim tem 0 e é 3x menor | `app/Dockerfile` |
| CSP gerada no build da imagem | A origem da API só é conhecida no build e o nginx roda `read_only` | `app/nginx/csp.ts` |
| Cache offline só de GET público | LGPD: resposta autenticada não pode ficar no aparelho depois do logout | `app/src/pwa/runtime-caching.ts` |
| Tokens de cor `--orange-text` | A laranja da marca dá 2,2:1 como texto; o tom escuro mantém o matiz e passa no WCAG AA | `app/src/App.css` |
| Variável de ambiente ausente é aceita; inválida não | A imagem é publicada antes do deploy da API | `app/src/shared/config/env.ts` |
| Login falso (`VITE_USE_MOCK_AUTH`) só em desenvolvimento | O login real foi integrado; o falso segue para demonstrações | `compose.yaml`, `app/.env.example` |

## Fora de escopo por enquanto

Deploy do app e da API em produção (Cloudflare Pages, CORS de produção, rollback), *required status checks*, E2E em navegador no CI, Lighthouse e detecção automática de breaking changes (oasdiff).
