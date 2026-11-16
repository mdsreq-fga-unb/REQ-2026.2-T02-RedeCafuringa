# Infraestrutura: visão geral

## 1. Estrutura do repositório

A estrutura principal do repositório está organizada da seguinte forma:

```text
backend/        API NestJS + MongoDB (Dockerfile, compose de desenvolvimento e deploy/ de produção)
app/            Frontend React + Vite (PWA), Dockerfile e nginx
shared/         Contrato OpenAPI gerado a partir do backend (openapi.json)
scripts/        dev.sh (comandos de rotina), smoke test da imagem e hook do MkDocs que publica o Swagger UI
docs/           Documentação do projeto (MkDocs)
.github/        Workflows de CI/CD
compose.yaml    Ambiente local completo: MongoDB + API + app
```

### 1.1. Branches permanentes

O repositório mantém três branches permanentes:

- `main`: branch principal;
- `dev`: branch de desenvolvimento e integração (tronco);
- `gh-pages`: branch que armazena o site gerado.

As demais branches são criadas para atividades específicas e devem ser curtas, sendo encerradas após o merge.

---

## 2. Esteiras de CI/CD

Os workflows de CI/CD automatizam a validação, construção e publicação dos componentes do projeto.

| Workflow | Jobs | Em PR (`dev`/`main`) | Em push |
|---|---|---|---|
| `ci.yml` (docs) | `docs-build`, `docs-deploy` | Build | Build e **deploy no GitHub Pages**, nas branches `dev` e `main` |
| `backend-ci.yml` | `backend` | Sim | `dev`, `main` |
| `frontend-ci.yml` | `frontend` | Sim | `dev`, `main` |
| `docker-ci.yml` | `docker-build`, `docker-publish`, `docker-manifest` | Somente build, scan e smoke test | Publicação no GHCR (`dev`, `main` e tags `v*`) |
| `actionlint.yml`, `shellcheck.yml` | `actionlint`, `shellcheck` | Sim | `dev`, `main` |

### 2.1. Regras gerais dos workflows

- Todos os workflows de verificação são executados em **todos os pull requests**, sem filtros por pastas. Isso evita que um check obrigatório deixe de ser executado e, consequentemente, bloqueie o PR.
- Todas as GitHub Actions são fixadas por SHA de commit.
- As permissões seguem o princípio do menor privilégio:
  - `contents: read` como permissão padrão;
  - `packages: write` somente nos workflows responsáveis pela publicação;
  - `pages` e `id-token` somente no deploy da documentação.

---

## 3. Imagens Docker (GHCR)

As imagens são publicadas no GitHub Container Registry (GHCR):

- `ghcr.io/mdsreq-fga-unb/rede-cafuringa-api`
- `ghcr.io/mdsreq-fga-unb/rede-cafuringa-app`

Ambas são disponibilizadas para as arquiteturas `amd64` e `arm64`, utilizando runners nativos, sem emulação.

### 3.1. Estratégia de tags

| Tag | Condição |
|---|---|
| `dev` | Imagem publicada a partir da branch `dev` |
| `main` | Imagem identificada pela branch `main` |
| `sha-<curto>` | Identificador curto do commit |
| `latest` | Publicada somente a partir da branch `main` |
| `1.2.3` e `1.2` | Publicadas a partir de tags no padrão `v*` |

**Visibilidade dos pacotes:** os pacotes são criados como privados. Torná-los públicos exige uma ação manual na página de cada pacote.

---

## 4. Proteção do repositório

As branches `main` e `dev` possuem rulesets de proteção com as seguintes regras:

- Exigem pull request para integração de alterações.
- Bloqueiam force-push e exclusão das branches.
- Exigem que os **7 checks obrigatórios estejam verdes**:
  1. `docs-build`;
  2. `backend`;
  3. `frontend`;
  4. `docker-build (api)`;
  5. `docker-build (app)`;
  6. `actionlint`;
  7. `shellcheck`.
- Não possuem exceção para administradores.
- Não exigem aprovação de revisores (mínimo de 0 aprovações).
- Não exigem que a branch esteja atualizada com a branch-base.

Após o merge, as branches de trabalho são excluídas automaticamente.

O GitHub Actions utiliza `read` como permissão padrão.

---

## 5. Registro de decisões

A tabela a seguir registra as principais decisões de infraestrutura, seus motivos e os locais relacionados no repositório.

| Decisão | Motivo | Onde |
|---|---|---|
| Merge commit, sem squash | Preserva os commits e a autoria da equipe. | [Como contribuir](../contribuindo.md) |
| Histórico do backend reescrito somente nos 2 commits que continham `.venv-preview` (88 MB) | O ambiente virtual foi versionado por engano. A recriação somente dos commits afetados preservou os outros 246 commits, seus SHAs e assinaturas. | Histórico da branch `dev` |
| Contrato OpenAPI gerado a partir do código, com verificações de drift no CI | Evita divergências silenciosas entre frontend e backend. | [Contrato da API](../shared/contratos.md) |
| Lint específico por app (oxlint no backend e ESLint no frontend) | Cada aplicação já possuía sua configuração. A migração não traria ganhos relevantes. | `backend/`, `app/` |
| Trivy utilizado como imagem fixada por digest, e não como action | Evita o risco de utilizar tags mutáveis de actions de terceiros na cadeia de suprimentos. | `docker-ci.yml` |
| Imagem-base do nginx `1.30-alpine-slim` | A versão `1.29-alpine` apresentava CVEs HIGH/CRITICAL com correção disponível. A versão slim não apresentava vulnerabilidades identificadas na análise e é aproximadamente 3 vezes menor. | `app/Dockerfile` |
| CSP gerada durante o build da imagem | A origem da API só é conhecida no momento do build, e o nginx é executado com `read_only`. | `app/nginx/csp.ts` |
| Cache offline restrito a GET público | Por requisitos de LGPD, respostas autenticadas não devem permanecer no dispositivo após o logout. | `app/src/pwa/runtime-caching.ts` |
| Token de cor `--orange-text` | O laranja original da marca apresenta contraste de 2,2:1 como texto. O tom escuro mantém o matiz e atende ao WCAG AA. | `app/src/App.css` |
| Variável de ambiente ausente é aceita, mas variável inválida não | A imagem é publicada antes do deploy da API. | `app/src/shared/config/env.ts` |
| Login falso (`VITE_USE_MOCK_AUTH`) restrito ao desenvolvimento | O login real já foi integrado, mas o login falso permanece disponível para demonstrações. | `compose.yaml`, `app/.env.example` |

---

## 6. Fora de escopo (por enquanto)

As seguintes atividades ainda não foram implementadas:

- Deploy do frontend e da API em produção, incluindo Cloudflare Pages;
- Configuração de CORS para produção;
- Estratégia de rollback;
- Testes E2E em navegador no CI;
- Lighthouse;
- Detecção automática de breaking changes por meio do `oasdiff`.