# Operação e infraestrutura — API + MongoDB

> Público: quem desenvolve, faz deploy ou opera o backend na VM OCI.
> Decisões de stack: [POC](poc.md). Processo de desenvolvimento: [guia de estrutura e TDD](guia-estrutura-e-tdd.md).
> Segurança, LGPD e riscos residuais: [segurança](seguranca.md).

## 1. Arquitetura

```
PWA (Cloudflare Pages)
        │ HTTPS
        ▼
Caddy :443  ──►  API NestJS :3000  ──►  MongoDB :27017
(TLS, headers,     (read-only,          (rede interna,
 body/timeouts)     não-root)            sem porta pública)
        │
        └──► /api/v1/health/ready (active health check)
```

- Rede `edge`: Caddy + API.
- Rede `internal` (`internal: true`): API + MongoDB. O Mongo não tem rota para a internet.
- O host roda `docker compose` com `restart: unless-stopped`.
- O backup roda no host via systemd timer, fora do Compose.

## 2. Pré-requisitos do host

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin age
```

Opcional para offsite: `oci` CLI configurado com um bucket privado e versionado.

## 3. Primeiro deploy

```bash
git clone https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa.git
cd REQ-2026.2-T02-RedeCafuringa/backend

cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
# edite: API_DOMAIN, CORS_ORIGINS, MONGO_ROOT_*, MONGO_APP_*, METRICS_TOKEN

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env ps
curl -fsS https://$API_DOMAIN/api/v1/health/ready
```

O Compose **falha** se uma variável obrigatória estiver em branco. O primeiro
boot do Mongo executa `deploy/mongo-init/01-app-user.js` e cria o usuário
`readWrite` apenas no banco da aplicação.

> Se o volume já existia, o init **não** roda. Crie o usuário manualmente
> (seção 7) antes de subir a API.

## 4. Atualizar e reverter

```bash
cd /opt/rede-cafuringa/backend
git pull --ff-only
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env build api
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d api caddy
curl -fsS https://$API_DOMAIN/api/v1/health/ready
```

**Rollback:** volte o commit (`git checkout <commit-anterior>`) e repita o build/up.
Não há registry/versionamento de imagem nesta fase; por isso o rollback é por commit.

## 5. Saúde

| Endpoint | Uso | Semântica |
|---|---|---|
| `/api/v1/health/live` | Docker HEALTHCHECK | 200 se o processo está de pé; **não** consulta o Mongo |
| `/api/v1/health/ready` | Caddy active check, uptime, smoke test | 200 só com Mongo acessível |
| `/api/v1/health` | compatibilidade | igual ao `ready` |

Com o Mongo parado, `ready` responde **503** e `live` continua **200**.
O Docker não reinicia por `unhealthy`; use um monitor externo para alertar.

## 6. Logs, métricas e rate limit

- Logs da API: JSON do pino, com `req.id` (header `x-request-id`), status e latência.
  Campos sensíveis são redigidos; a query string não entra no log.
- Logs do Caddy: JSON no stdout.
- Rotação: `json-file` com `max-size=10m`, `max-file=3` em todos os serviços.
- Métricas: `GET /api/v1/metrics` (Prometheus). Em produção:
  - exige `Authorization: Bearer $METRICS_TOKEN`;
  - o Caddy responde **404** para `/api/v1/metrics` vindo da internet.
  - scrape interno:
    ```bash
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec -T api \
      wget -qO- --header="Authorization: Bearer $METRICS_TOKEN" \
      http://127.0.0.1:3000/api/v1/metrics
    ```
- Rate limit global: `THROTTLE_TTL` (segundos) e `THROTTLE_LIMIT` (requisições).
  Rotas de login/reset devem receber `@Throttle` mais restritivo quando existirem.
- Alertas mínimos: `ready` != 200 por 2 min; 5xx > 1% por 5 min; disco > 80%;
  último backup > 26 h; container reiniciando.

## 7. Backup e restore

### 7.1 Instalação

```bash
cd /opt/rede-cafuringa/backend
sudo install -m 700 deploy/backup/backup.sh deploy/backup/backup.sh
sudo install -m 700 deploy/backup/restore.sh deploy/backup/restore.sh
sudo install -m 644 deploy/backup/cafuringa-backup.service /etc/systemd/system/
sudo install -m 644 deploy/backup/cafuringa-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cafuringa-backup.timer
```

Ajuste os caminhos em `cafuringa-backup.service` se o projeto não estiver em
`/opt/rede-cafuringa/backend`.

### 7.2 Variáveis no `deploy/.env`

```dotenv
MONGO_BACKUP_DIR=/var/backups/cafuringa
BACKUP_RETENTION_DAYS=7

# Recomendado: criptografa antes de sair do host
BACKUP_AGE_RECIPIENT=age1...

# Opcional: bucket privado e versionado no OCI Object Storage
BACKUP_OCI_BUCKET=rede-cafuringa-backups
```

Gerar chaves `age`:

```bash
age-keygen -o ~/.config/age/cafuringa.key
# copie a chave pública (age1...) para BACKUP_AGE_RECIPIENT
# guarde a chave privada FORA da VM
```

### 7.3 Primeira execução

```bash
sudo systemctl start cafuringa-backup.service
sudo journalctl -u cafuringa-backup.service -n 50 --no-pager
ls -lh /var/backups/cafuringa/
sha256sum -c /var/backups/cafuringa/*.sha256
```

### 7.4 Drill mensal (obrigatório)

```bash
cd /opt/rede-cafuringa/backend
set -a; source deploy/.env; set +a
export BACKUP_AGE_IDENTITY=~/.config/age/cafuringa.key   # se usar age

./deploy/backup/restore.sh /var/backups/cafuringa/<arquivo> cafuringa_restore_test
```

O script restaura em `cafuringa_restore_test` e **recusa** o banco de produção.
Ele é para drill; em DR real, faça uma janela, pare a API, preserve o estado
atual e restaure para produção (ou para um banco temporário e renomeie).
Compare a contagem de coleções/documentos com a origem e registre data,
arquivo, tamanho e resultado.

### 7.5 Volume criado por Mongo 8.3

O `mongod` 8.0 **não abre** volume com `featureCompatibilityVersion` 8.3.
Não é senha/permissão. Caminho seguro: subir 8.3 temporariamente → `mongodump`
→ volume novo 8.0 → `mongorestore` → validar. Em dev, se os dados forem
descartáveis, remova `backend_mongo-data` e `backend_mongo-config`.

### 7.6 Volume que já existia

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec -T mongo \
  mongosh -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --quiet \
  --eval 'const d=db.getSiblingDB("cafuringa"); if (!d.getUser("cafuringa_app")) d.createUser({user:"cafuringa_app",pwd:process.env.MONGO_APP_PASSWORD,roles:[{role:"readWrite",db:"cafuringa"}]})'
```

### 7.7 Retenção e offsite

- Local: `BACKUP_RETENTION_DAYS` (default 7).
- Offsite: bucket OCI privado, versionado, com lifecycle próprio.
- Sem `BACKUP_OCI_BUCKET`, o backup fica só no host — **não é DR**.
- **Nunca** use `docker compose down -v` em produção: apaga o volume nomeado.

## 8. Segredos

- `.env` com `600`, dono do usuário de deploy.
- `MONGO_APP_PASSWORD`: criar/trocar no Mongo, atualizar `.env`, recriar `api`, validar `ready`, remover usuário antigo.
- `METRICS_TOKEN`: `openssl rand -hex 32`, atualizar `.env`, recriar `api`.
- Root do Mongo: `db.changeUserPassword` em janela + atualizar `.env`.
- OCI Vault é a evolução; `.env` é o mínimo aceitável no free tier.

## 9. Incidente — checklist

1. `docker compose ... ps` — o que está unhealthy/reiniciando?
2. `docker compose ... logs --since 15m api mongo caddy` — erro, OOM, disco?
3. `curl -i https://$API_DOMAIN/api/v1/health/live` e `/ready`.
4. `df -h`, `free -m`, `docker stats --no-stream`.
5. `docker inspect --format '{{json .State.Health}}' <container>`.
6. Mongo caiu: disco, OOM, logs; reiniciar; validar `ready`.
7. Caddy sem TLS: DNS, portas 80/443, rate limit do Let's Encrypt.
8. Registrar linha do tempo e causa raiz; postmortem sem culpa.

## 10. Hardening do host

Evidência inicial (read-only): **na VM OCI**, rode `sudo bash deploy/host-audit.sh`.
Não rode no WSL/local: lá os dados de disco, firewall e Docker são da sua máquina
de desenvolvimento, não do servidor (o script avisa quando detecta WSL).

- [ ] Security List/NSG da OCI: apenas 22 (restrito ao seu IP), 80 e 443.
- [ ] SSH somente com chave; `PasswordAuthentication no`; `PermitRootLogin no`.
- [ ] `fail2ban` para SSH.
- [ ] `unattended-upgrades` habilitado.
- [ ] `ufw`/iptables coerente com a Security List.
- [ ] Docker apenas via socket local; sem `2375` exposto.
- [ ] `df -h` e `free -m` monitorados; alerta em 80%.
- [ ] NTP ativo (`timedatectl`).
- [ ] `docker system prune` agendado (com cuidado).
- [ ] `lynis audit system` e tratar achados altos.

## 11. SLO inicial

| Indicador | Alvo |
|---|---|
| Disponibilidade da API (ready) | 99,5% mensal |
| Erros 5xx | < 1% das requisições |
| Latência p95 (API interna) | < 300 ms |
| RPO | 24 h |
| RTO | 2 h |
| Restore drill | 1/mês |

## 12. Comandos úteis

```bash
# config renderizada (falha se faltar variável)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env config

# health e headers
curl -i https://$API_DOMAIN/api/v1/health/ready
curl -i -H "Origin: $CORS_ORIGINS" https://$API_DOMAIN/api/v1/health/live

# mongo
docker compose ... exec -T mongo mongosh -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --quiet --eval 'db.serverStatus().wiredTiger.cache["maximum bytes configured"]'

# espaço/volume
docker system df -v
docker volume ls
```
