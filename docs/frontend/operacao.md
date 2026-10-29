# Frontend: operação

O app (`app/`) é um PWA em React 19 + Vite, servido em produção por nginx numa imagem Docker. Esta página é o roteiro para quem chega ao projeto.

## Primeiros passos

Pré-requisitos: Git (com Git Bash no Windows), Node da versão do `.nvmrc` e Docker.

```bash
./scripts/dev.sh setup     # confere pré-requisitos, instala dependências, cria os arquivos de ambiente locais
./scripts/dev.sh up        # mongo + api + app  ->  app em http://localhost:5173, api em http://localhost:3000
./scripts/dev.sh check     # lint, format, typecheck, build e testes, os mesmos passos do CI
./scripts/dev.sh help      # todos os comandos
```

Para ver o front como em produção (nginx, CSP, service worker): `./scripts/dev.sh up --prod` (porta 8080).

## Variáveis de ambiente

Definidas em `app/.env.example`; o `setup` copia para `app/.env.local` (ignorado pelo git).

| Variável | Para quê |
|---|---|
| `VITE_API_URL` | URL base da API, com `/api/v1`. Vazio = mesma origem |
| `VITE_USE_MOCK_AUTH` | `true` usa o login falso (só desenvolvimento) |

**Tudo com prefixo `VITE_` vai para o bundle e é público.** Nunca coloque senha, token ou chave. Valor inválido para-o na inicialização com uma mensagem na tela; variável ausente é aceita.

## Qualidade

| Verificação | Onde |
|---|---|
| lint, format (prettier), typecheck, build | `npm run lint \| format:check \| typecheck \| build` em `app/` |
| testes e cobertura (piso por métrica) | `npm run test:coverage` |
| acessibilidade WCAG 2.1 AA | `tests/a11y/` (axe nas rotas + contraste dos tokens de cor) |
| contrato da API | `npm run api:types`; ver [Contrato da API](../shared/contratos.md) |

Cores: use `--orange-text` (não `--orange`) para texto, e `--ink` sobre fundo laranja ou verde. O teste de contraste avisa se a combinação deixar de passar.

## Imagens Docker

O workflow `Docker CI` valida as imagens em todo PR (hadolint, Trivy, smoke test) e, ao entrar na `dev` ou `main`, publica no GHCR:

`ghcr.io/mdsreq-fga-unb/rede-cafuringa-api` e `…/rede-cafuringa-app`, nas arquiteturas amd64 e arm64, com as tags `dev`, `sha-<curto>`, `latest` (só `main`) e `1.2.3` / `1.2` (tags `v*`).

`./scripts/dev.sh images` constrói as mesmas imagens localmente e `./scripts/dev.sh smoke` roda o smoke test.

## Segurança e PWA

- **CSP restritiva**, gerada no build da imagem (`app/nginx/csp.ts`): sem `unsafe-inline` nem `unsafe-eval`; `connect-src` libera só a origem da API. As fotos de exemplo do Unsplash estão liberadas em `IMAGE_HOSTS` e devem sair quando as imagens vierem da API.
- **Fontes** hospedadas no app (`@fontsource`); nenhuma requisição a terceiros.
- **Cache offline** (`src/pwa/runtime-caching.ts`): só GET público; nunca `/auth/*`, nunca resposta de requisição com `Authorization`, nunca mutações.
- Ícones: `npm run pwa:icons` regenera tudo a partir de `app/public/folha-logo.svg`.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `bad interpreter` num `.sh` | Fim de linha CRLF. O `.gitattributes` força LF; rode `git add --renormalize .` |
| `curl: (23) ... write` no Windows | `curl.exe` não aceita `-o /dev/null`; use redirecionamento do shell |
| Python do Windows cria pastas em `C:\c\...` | Passe o caminho com `cygpath -m` (o `dev.sh` já faz) |
| Testes quebram só na sua máquina | Confira `app/.env.local`; os testes fixam as variáveis, mas scripts próprios podem não fixar |
| Contrato "desatualizado" no CI | Rode `./scripts/dev.sh contract` e commite os arquivos gerados |

## Fora de escopo (por enquanto)

Deploy (Cloudflare Pages, CORS de produção e rollback) e *required status checks* do GitHub ainda não foram configurados.
