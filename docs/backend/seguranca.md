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
| Login sem enumeração (mensagem e custo iguais para CPF inexistente) | `backend/src/modules/auth/auth.service.ts` |
| Rate limit dedicado a login/cadastro (`AUTH_THROTTLE_LIMIT`) | `@AuthThrottle()` |
| Bloqueio de cadastro de menores de 18 anos (RN15, RNF15) | `backend/src/modules/users/domain/age.ts` |

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
   - Não há refresh token nem revogação: o token vale até expirar (15 min). Desativar
     uma conta bloqueia novos logins e o `/auth/me`, mas tokens já emitidos seguem
     válidos nas demais rotas até o `exp`.
   - O índice único de `cpfHash` só é criado automaticamente fora de produção
     (`autoIndex`). Em produção, criá-lo por migração **antes** do primeiro cadastro.
   - `PII_HMAC_SECRET` e `PII_ENCRYPTION_KEY` não têm rotação: perdê-los torna os
     CPFs ilegíveis/inacessíveis. Guardar junto da chave de backup.
9. **Docs:** `mkdocs build` tem warnings de links quebrados pré-existentes; não
   bloqueiam o build, mas devem ser corrigidos à parte.

## 6. Checklist antes de publicar/entregar

- [ ] Nenhum `.env`, chave `age`, token ou dump no histórico (`gitleaks detect`).
- [ ] CI verde (lint, format, typecheck, audit, testes, Docker build, hadolint, actionlint).
- [ ] `npm audit --audit-level=high` = 0.
- [ ] `docker scout cves` da API sem CRITICAL/HIGH não justificados.
- [ ] Backup restore drill executado e registrado.
- [ ] Host auditado (`deploy/host-audit.sh`) e checklist aplicado.
