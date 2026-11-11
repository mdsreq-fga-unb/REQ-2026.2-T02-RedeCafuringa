# Rede Cafuringa — API

API REST da plataforma Rede Cafuringa, em **NestJS 12 + TypeScript + MongoDB**.
Decisões técnicas e desafios de implementação estão na [POC](../docs/backend/poc.md).
Operação, backup e incidentes estão em [operação e infraestrutura](../docs/backend/operacao.md).

> **Antes de contribuir, leia o [Guia de estrutura e TDD](../docs/backend/guia-estrutura-e-tdd.md).**
> O desenvolvimento é orientado a testes: teste primeiro, cobertura mínima de 80% por
> arquivo nas regras de negócio e CI bloqueando o que não passar.

## Pré-requisitos

- Node.js **24.22.1** (`nvm use` lê o `.nvmrc`)
- Docker (para o MongoDB local e para validar a imagem)
- `age` e `oci` CLI apenas no host de produção (backup/offsite)

## Como rodar

```bash
cp .env.example .env
docker compose up -d mongo    # só o banco; a API roda local com hot reload
npm ci
npm run start:dev
```

> Para rodar a API **em container**: `docker compose up -d --build` e **não** rode
> `npm run start:dev` ao mesmo tempo (os dois disputam a porta 3000). O compose
> aplica read-only rootfs, `cap_drop: ALL`, limites de memória/pids, healthchecks
> e rotação de logs.
> O guia completo de onboarding/TDD está em [`docs/backend/guia-estrutura-e-tdd.md`](../docs/backend/guia-estrutura-e-tdd.md).

- API: http://localhost:3000/api/v1
- Health liveness: http://localhost:3000/api/v1/health/live
- Health readiness: http://localhost:3000/api/v1/health/ready
- Métricas: http://localhost:3000/api/v1/metrics
- Swagger: http://localhost:3000/api/v1/docs (fora de produção)

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com *hot reload* |
| `npm run build` | Compila para `dist/` |
| `npm run typecheck` | `tsc --noEmit` (src + testes) |
| `npm test` | Testes unitários (`*.spec.ts`) |
| `npm run test:watch` | Testes unitários em modo *watch* (ciclo TDD) |
| `npm run test:cov` | Testes unitários + cobertura mínima de 80% por arquivo |
| `npm run test:e2e` | Testes e2e com MongoDB em memória (não precisa de Docker) |
| `npm run lint` | Lint com oxlint |
| `npm run format` | Formata com Prettier |
| `npm run format:check` | Verifica formatação (gate do CI) |

## Infraestrutura

- **Health:** `/health/live` (processo) e `/health/ready` (Mongo). O Docker usa
  `live`; o Caddy usa `ready`.
- **Rate limit:** global via `@nestjs/throttler`; `THROTTLE_TTL`/`THROTTLE_LIMIT`.
- **Logs:** JSON com `x-request-id`, latência e status; campos sensíveis são redigidos.
- **Métricas:** Prometheus em `/api/v1/metrics`. Em produção exige `METRICS_TOKEN`
  e o Caddy responde 404 para acesso público.
- **Segurança:** Helmet, CORS validado por ambiente, `trust proxy` atrás do Caddy,
  imagem sem npm/npx/corepack, usuário `1000:1000`.

## Estrutura

```
src/
├── main.ts               # bootstrap
├── app.module.ts         # config + Mongo + logger + throttler + módulos
├── app.setup.ts          # configuração global compartilhada com os testes e2e
├── config/               # validação de env e montagem da URI do Mongo
├── common/               # código transversal (validadores, guards, decorators...)
└── modules/              # um módulo por característica do produto
    ├── health/
    └── metrics/
test/
├── setup/                # MongoDB em memória para os e2e
├── utils/test-app.ts     # createTestApp(): sobe a API para os e2e
├── factories/            # dados de teste válidos (makeCpf, makeCnpj...)
└── *.e2e-spec.ts         # testes e2e
../docs/backend/          # POC, guia TDD, operação e segurança (MkDocs)
deploy/                   # compose de produção, Caddy, init do Mongo e backup
```

## Deploy (OCI)

```bash
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
# preencha domínio, CORS, root/app do Mongo e METRICS_TOKEN
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env config
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

O Compose **falha** se uma variável obrigatória estiver em branco. O Mongo não
expõe porta; a API usa um usuário `readWrite` apenas no banco `cafuringa`.

### Mongo 8.0 LTS vs volume antigo

A imagem de produção é `mongo:8.0.34` (LTS). Se um volume foi criado por uma
versão 8.3 (rapid release), o `mongod` 8.0 **não abre** o volume
(`featureCompatibilityVersion 8.3`). Nesse caso:

1. suba temporariamente a versão 8.3 que criou o volume;
2. `mongodump` com 8.3;
3. crie um volume novo e restaure com 8.0;
4. valide contagens e índices.

Em desenvolvimento, se o volume só tem dados descartáveis, remova
`backend_mongo-data` e `backend_mongo-config` e suba de novo.

### Backup

```bash
sudo systemctl start cafuringa-backup.service
./deploy/backup/restore.sh /var/backups/cafuringa/<arquivo> cafuringa_restore_test
```

Detalhes, criptografia `age`, upload OCI e drill mensal: [operação — backup](../docs/backend/operacao.md#7-backup-e-restore).

> Nunca use `docker compose down -v` em produção: apaga o volume nomeado.
