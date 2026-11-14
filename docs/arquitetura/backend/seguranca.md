# Segurança e auditoria — backend

> Operação: [operação e infraestrutura](operacao.md). Stack: [POC](poc.md).
> Este documento substitui o antigo `SECURITY.md` como fonte única; o arquivo
> na raiz do repositório é apenas o ponteiro exigido pelo GitHub.

## 1. Como reportar uma vulnerabilidade

**Não abra issue pública com detalhes exploráveis.**

Use **Security → Advisories → Report a vulnerability** no GitHub:
`https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/security/advisories/new`

Inclua versão/commit, passos de reprodução, impacto e, se possível, uma PoC mínima.
O time responde em até 5 dias úteis.

## 2. Princípios

- **Custo zero:** nenhuma correção pode introduzir dependência paga obrigatória (RNF13).
- **LGPD:** CPF, e-mail, telefone e geolocalização são dados pessoais. Logs não devem
  conter esses valores; DTOs de resposta nunca serializam o documento do banco.
- **Menor privilégio:** a API usa `cafuringa_app` com `readWrite` apenas em `cafuringa`.
  O root é usado somente por administração/backup.
- **Segredos fora do Git:** `.env` ignorado, permissão `600`; nunca commitar chave
  `age`, token de métricas ou senha de root.
- **TLS obrigatório em produção:** Caddy emite/renova certificado; CORS de produção
  recusa origem HTTP.

## 3. Controles implementados

| Controle | Onde |
|---|---|
| Imagem sem npm/npx/corepack no runtime | `backend/Dockerfile` |
| Usuário não-root `1000:1000` | `backend/Dockerfile` |
| API read-only, `cap_drop: ALL`, `no-new-privileges`, mem/pids | `backend/docker-compose.yml`, `backend/deploy/docker-compose.prod.yml` |
| Mongo read-only, `no-new-privileges`, mem/pids, rede interna | idem |
| Health live/ready | `backend/src/modules/health` |
| Rate limit global + `trust proxy` | `@nestjs/throttler`, `backend/src/app.setup.ts` |
| Logs JSON com request id e redação | `nestjs-pino` em `backend/src/app.module.ts` |
| Métricas Prometheus com token em prod e bloqueio no Caddy | `backend/src/modules/metrics`, `backend/deploy/Caddyfile` |
| CORS validado (sem wildcard, HTTPS em prod) | `backend/src/config/env.validation.ts` |
| URI do Mongo por componentes (`encodeURIComponent`) | `backend/src/config/mongo-uri.ts` |
| Usuário de app `readWrite` no banco | `backend/deploy/mongo-init/01-app-user.js` |
| Compose fail-fast com `${VAR:?}` | `backend/deploy/docker-compose.prod.yml` |
| Backup com SHA-256, `age` opcional, OCI opcional, retenção | `backend/deploy/backup` |
| CI com lint, format, typecheck, audit, testes, Docker build, hadolint | `.github/workflows/backend-ci.yml` |
| Actionlint com checksum | `.github/workflows/actionlint.yml` |
| Imagens pinadas por digest | `Dockerfile`, compose de prod |
| Autenticação JWT HS256 (15 min), algoritmo fixo na verificação | `backend/src/modules/auth` |
| Negação por padrão (`JwtAuthGuard` global + `@Public()`) e RBAC (`RolesGuard` + `@Roles()`) | `backend/src/modules/auth/guards` |
| Senhas com argon2id; política mínima (8–128, letra e número) | `backend/src/common/crypto/password-hasher.ts` |
| CPF como *blind index* HMAC-SHA256 + cifra AES-256-GCM (D1) | `backend/src/common/crypto/pii-cipher.ts` |
| Trajetória do produtor (HU12, RN07): perfil público com DTO explícito (sem e-mail, CPF, CNPJ, responsável, localidade); telefone só com `telefonePublico=true`; escrita só na própria conta (`/producers/me`, `@Roles(PRODUTOR)`), `$set` restrito aos campos do contrato; consultas com projeção (senha e dados cifrados nunca são lidos); texto sem controles, invisíveis nem inversões bidirecionais, com limite de 2000 | `backend/src/modules/producer-profile` |
| Foto de perfil (HU12/RF12): formato pelos bytes (PNG/JPEG/WebP; SVG e arquivos disfarçados dão 415), 5 MB, 50 MP conferidos antes de decodificar (bomba de descompressão), imagem **regravada** em WebP sem EXIF/XMP/GPS; upload em memória (nada em disco); servida com `nosniff` e `CORP: cross-origin` só nas condições do perfil público; só a rota de upload aceita 6 MB no Caddy | `backend/src/modules/producer-profile`, `backend/deploy/Caddyfile` |
| Cadastro de produto (HU15, RN09): dono sempre o `sub` do token (campo `produtor` no corpo dá 400); só `PRODUTOR` (401/403); textos normalizados; números só em decimal simples (`1e3`, `0x10`, vazio recusados); 1 a 10 fotos com o mesmo tratamento da foto de perfil (bytes, 50 MP, WebP sem EXIF/GPS, em memória, uma de cada vez); limites do multer vindos da política da galeria (10 arquivos, 12 campos, 16 KB por campo); `Idempotency-Key` com índice único parcial por produtor; consulta pública expõe só `id` e `nomeIniciativa` do produtor; `POST /products` aceita até 51 MB no Caddy (demais rotas seguem em 1 MB), com teste que confere o Caddy contra a política | `backend/src/modules/products`, `backend/src/common/photos`, `backend/deploy/Caddyfile` |
| Login por e-mail e senha (RN05), sem enumeração (mensagem e custo iguais para e-mail inexistente) | `backend/src/modules/auth/auth.service.ts` |
| Cadastro de administrador só por administrador (`@Roles(ADMINISTRADOR)`, RN03); 1º admin por `ADMIN_BOOTSTRAP_*` | `backend/src/modules/users/users.controller.ts`, `admin-bootstrap.service.ts` |
| Rate limit dedicado a login/cadastro/recuperação de acesso (`AUTH_THROTTLE_LIMIT`) | `@AuthThrottle()` |
| Bloqueio de cadastro de menores de 18 anos (RNF15) | `backend/src/modules/users/domain/age.ts` |
| Recuperação de acesso (HU10, RN05, D11): token de 256 bits, uso único, só o hash SHA-256 no banco, TTL de 30 min, consumo atômico | `backend/src/modules/auth/password-reset` |
| Um pedido por conta (índice único em `userId`) com upsert condicionado ao intervalo mínimo: pedidos simultâneos geram um único link e um único e-mail; novo pedido invalida o anterior | `password-reset.service.ts`, `password-reset-token.schema.ts` |
| Recuperação sem enumeração: resposta 202 idêntica e imediata (todo o processamento roda depois da resposta), para e-mail existente, inexistente ou de conta desativada | `password-reset.service.ts` (`request` → `processRequest`) |
| Token no fragmento do link (`/#/nova-senha?token=`, rota por hash do app), que o navegador não envia ao servidor nem no `Referer`; na API, só no corpo de `POST` | `domain/reset-token.ts` (`buildResetLink`) |
| Índices de `password_reset_tokens` garantidos na subida (`syncIndexes`, idempotente): as proteções por conta não dependem de lembrar do `indexes --prod` | `password-reset.service.ts` (`onModuleInit`) |
| Pedidos em andamento drenados no desligamento (`beforeApplicationShutdown`), antes de o Mongo fechar | `password-reset.service.ts` |
| DTOs recusam campos extras e objetos de operador (NoSQL injection) | `password-reset/dto`, `domain/reset-token.ts` |
| Revogação de sessão: o `JwtAuthGuard` recusa o JWT se a conta foi removida, desativada, mudou de perfil ou trocou a senha depois da emissão (`credenciaisAlteradasEm` × `iat`) | `guards/jwt-auth.guard.ts`, `auth/domain/session.ts` |
| E-mail: reenvio com espera crescente (`MAIL_RETRY_DELAYS_MS`); e-mail perdido desfaz o pedido e incrementa `cafuringa_mail_delivery_failures_total`; transporte `log` proibido em produção; STARTTLS obrigatório em produção; bloqueio de header injection; HTML escapado | `backend/src/common/mail`, `metrics.registry.ts`, `env.validation.ts` |

## 4. Auditoria de 2026-10-24 — o que foi encontrado e corrigido

| Achado | Correção |
|---|---|
| `multer` 2.4.0 (GHSA-q7qp-rjg7-q26m, DoS) transitivo do Nest | override `^2.5.0`; `npm audit` = 0 |
| 5 HIGH na imagem, todos no npm embutido | npm removido do runtime; **0C/0H** no Scout |
| Compose de prod subia com `MONGODB_URI`/CORS vazios | `${VAR:?}`; config falha sem `.env` |
| API usava root do Mongo | app user `readWrite`; root só admin/backup |
| Sem backup/restore | dump/restore + SHA-256 + age + OCI + systemd |
| Logs em texto, sem correlação | pino JSON + request id + redação + URL sem query |
| Sem rate limit / `trust proxy` | throttler global + `trust proxy` atrás do Caddy |
| Sem métricas/alerta | `/metrics` Prometheus + token; SLO no runbook |
| Health único (liveness + readiness) | `/health/live` e `/health/ready` |
| Cache WiredTiger em 50% da RAM | `--wiredTigerCacheSizeGB` configurável |
| Container gravável, sem limites | read-only, cap_drop, no-new-privileges, pids/mem |
| CI sem gates de qualidade/segurança | format, typecheck, audit, Docker build, hadolint, actionlint |
| Docs operacionais fora do MkDocs | consolidados em `docs/backend/` |

**Evidências:** 37 testes unitários + 8 e2e; `npm audit` 0; Docker Scout da API
0C/0H; `hadolint` 0; `actionlint` 0; `shellcheck` 0; `caddy validate` válido;
Compose de dev/prod healthy; restore de 1 documento validado; app user negado no `admin`.

## 5. Riscos residuais (aceitos ou dependentes do host)

1. **Host OCI:** firewall, SSH, fail2ban, updates e disco não foram auditados nesta
   sessão. Rodar `sudo bash deploy/host-audit.sh` e seguir o checklist do runbook.
2. **CVEs de base images:**
   - Caddy 2.11.7: 4 CRITICAL / 13 HIGH (Go stdlib/brotli Alpine).
   - Mongo 8.0.34: 7 CRITICAL / 46 HIGH (ferramentas Go e `js-yaml` do `mongosh`).
   - São majoritariamente ferramentas/base, não o `mongod`; não há imagem corrigida
     hoje. Mitigação: rede interna do Mongo, Caddy na borda, rebuild a cada release,
     scan manual (`docker scout`) e acompanhamento upstream.
3. **Mongo `cap_drop: ALL`:** não aplicado porque o entrypoint oficial precisa de
   `setuid/setgid`. Aplicados read-only, no-new-privileges, mem/pids e rede isolada.
4. **Deploy:** manual (`build` + `up -d`). Não há registry/rollback por tag nesta fase;
   rollback é por commit. Se isso mudar, versionar imagem e testar rollback.
5. **Migrations/índices:** `autoIndex` off em produção; os índices reais dependem do
   primeiro schema. Adotar `migrate-mongo` quando a primeira coleção existir.
6. **`docker compose down`** deixa volumes anônimos (`/data/configdb`, testes com
   `docker run`). Nunca usar `down -v` em produção; limpar órfãos com `docker volume prune`.
7. **Métricas:** o Caddy bloqueia `/metrics` publicamente; o scrape precisa ser interno.
8. **Autenticação (incremento 1, parcial):**
   - Não há refresh token nem logout explícito. Desde a HU10, o `JwtAuthGuard`
     consulta a conta a cada requisição autenticada (busca por `_id` com projeção
     de 3 campos): conta removida, desativada, com perfil alterado ou com senha
     trocada depois da emissão do token recebe 401. Custo: uma leitura indexada por
     requisição autenticada. A comparação usa o claim `sat` (instante do login em
     ms), então nem um login feito no mesmo segundo, antes da troca, sobrevive.
     Tokens antigos, sem `sat`, caem para o `iat` e são encerrados na dúvida.
   - O índice único (esparso, HU03) de `cpfHash` só é criado automaticamente fora de
     produção (`autoIndex`). Em produção, criá-lo com `./scripts/dev.sh indexes --prod` **antes** do
     primeiro cadastro (ver [operação, 3.1](operacao.md)).
   - `ADMIN_BOOTSTRAP_SENHA` é segredo de uso único: remova-a do `.env` depois do
     primeiro login.
   - `PII_HMAC_SECRET` e `PII_ENCRYPTION_KEY` não têm rotação: perdê-los torna os
     CPFs ilegíveis/inacessíveis. Guardar junto da chave de backup.
9. **Recuperação de acesso (HU10).** Tratados nesta HU (antes eram riscos residuais):
   troca de senha encerra sessões (item 8), corrida entre pedidos (índice único por
   conta), enumeração por tempo (resposta antes do processamento), token fora de
   logs e `Referer` (fragmento `#`) e falha passageira do SMTP (reenvio + métrica).
   O que ainda resta:
   - **Fila persistente de e-mail (D6):** o reenvio vive na memória do processo. Se
     a API reiniciar no meio das tentativas, o e-mail se perde; como o pedido só é
     gravado antes do envio, a pessoa espera o intervalo mínimo (60 s) para pedir de
     novo. Alerta: `increase(cafuringa_mail_delivery_failures_total[15m]) > 0`.
   - **Histórico do navegador:** o fragmento fica no histórico local até o front
     limpá-lo; o front deve chamar `history.replaceState` logo após ler o token.
   - **Reinício no meio do reenvio:** o desligamento normal (SIGTERM, deploy) espera os
     pedidos em andamento; um encerramento forçado (OOM, `kill -9`) ainda pode perder
     o e-mail, caso coberto pelo item da fila persistente acima.
10. **Docs:** `mkdocs build` tem warnings de links quebrados pré-existentes; não
   bloqueiam o build, mas devem ser corrigidos à parte.

## 6. Checklist antes de publicar/entregar

- [ ] Nenhum `.env`, chave `age`, token ou dump no histórico (`gitleaks detect`).
- [ ] CI verde (lint, format, typecheck, audit, testes, Docker build, hadolint, actionlint).
- [ ] `npm audit --audit-level=high` = 0.
- [ ] `docker scout cves` da API sem CRITICAL/HIGH não justificados.
- [ ] Backup restore drill executado e registrado.
- [ ] Host auditado (`deploy/host-audit.sh`) e checklist aplicado.
