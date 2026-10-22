# Rede Cafuringa — API

API REST da plataforma Rede Cafuringa, em **NestJS 12 + TypeScript + MongoDB**.
Decisões técnicas e desafios de implementação estão em [POC.md](POC.md).

> **Antes de contribuir, leia o [Guia de estrutura e TDD](docs/guia-estrutura-e-tdd.md).**
> O desenvolvimento é orientado a testes: teste primeiro, cobertura mínima de 80% por
> arquivo nas regras de negócio e CI bloqueando o que não passar.

## Pré-requisitos

- Node.js **24 LTS** (`nvm use` lê o `.nvmrc`)
- Docker (opcional, para subir o MongoDB localmente)

## Como rodar

```bash
cp .env.example .env
docker compose up -d mongo
npm install
npm run start:dev
```

- API: http://localhost:3000/api/v1
- Healthcheck: http://localhost:3000/api/v1/health
- Swagger: http://localhost:3000/api/v1/docs

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com *hot reload* |
| `npm run build` | Compila para `dist/` |
| `npm test` | Testes unitários (`*.spec.ts`) |
| `npm run test:watch` | Testes unitários em modo *watch* (ciclo TDD) |
| `npm run test:cov` | Testes unitários + cobertura mínima de 80% por arquivo |
| `npm run test:e2e` | Testes e2e com MongoDB em memória (não precisa de Docker) |
| `npm run lint` | Lint com oxlint |
| `npm run format` | Formata com Prettier |

## Estrutura

```
src/
├── main.ts               # bootstrap
├── app.module.ts         # módulo raiz (config + Mongo + módulos de domínio)
├── app.setup.ts          # configuração global compartilhada com os testes e2e
├── config/               # validação das variáveis de ambiente
├── common/               # código transversal (validadores, guards, decorators...)
└── modules/              # um módulo por característica do produto
    └── health/
test/
├── setup/                # MongoDB em memória para os e2e
├── utils/test-app.ts     # createTestApp(): sobe a API para os e2e
├── factories/            # dados de teste válidos (makeCpf, makeCnpj...)
└── *.e2e-spec.ts         # testes e2e
docs/                     # guia de estrutura e TDD
deploy/                   # compose de produção + Caddyfile (OCI)
```

Testes unitários ficam ao lado do código (`*.spec.ts`); testes e2e ficam em `test/` (`*.e2e-spec.ts`).

## Deploy (OCI)

```bash
cp deploy/.env.example deploy/.env   # preencher domínio, CORS e senha do Mongo
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```
