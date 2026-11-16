# Infraestrutura — API + MongoDB

> **Público:** quem desenvolve, faz deploy ou opera o backend na VM OCI.  
> **Decisões de stack:** [POC](poc.md).  
> **Processo de desenvolvimento:** [Guia de estrutura e TDD](guia-estrutura-e-tdd.md).  
> **Segurança, LGPD e riscos residuais:** [Segurança](seguranca.md).

---

## 1. Arquitetura

```text
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

---

## 2. Pré-requisitos do host

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin age
```

Opcional para offsite: `oci` CLI configurado com um bucket privado e versionado.

---

## 3. Primeiro deploy

```bash
git clone https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa.git
cd REQ-2026.2-T02-RedeCafuringa/backend

cp deploy/.env.example deploy/.env
chmod 600 deploy/.env

# Edite: API_DOMAIN, CORS_ORIGINS, MONGO_ROOT_*, MONGO_APP_*, METRICS_TOKEN

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env ps
curl -fsS https://$API_DOMAIN/api/v1/health/ready
```

O Compose **falha** se uma variável obrigatória estiver em branco. O primeiro boot do Mongo executa `deploy/mongo-init/01-app-user.js` e cria o usuário `readWrite` apenas no banco da aplicação.

> **Atenção:** se o volume já existia, o init **não** roda. Crie o usuário manualmente (seção 7) antes de subir a API.

### 3.1. Índices e primeiro administrador (HU03)

Em produção, o Mongoose **não** cria índices no boot. Depois do primeiro `up` (e a cada deploy que altere índices), sincronize-os de forma idempotente:

```bash
./scripts/dev.sh indexes --prod     # na raiz do repositório; usa backend/deploy/.env
```

Bancos anteriores à HU03 têm `cpfHash` único **não esparso**, o que impede mais de um administrador (sem CPF); o comando acima troca o índice. Em desenvolvimento local, o `./scripts/dev.sh up` já roda a sincronização (também disponível como `./scripts/dev.sh indexes`).

O cadastro de administrador (`POST /users/admins`) exige um administrador autenticado. O primeiro nasce das variáveis `ADMIN_BOOTSTRAP_EMAIL` e `ADMIN_BOOTSTRAP_SENHA` (as duas juntas, em `deploy/.env`): a API cria a conta na subida se o e-mail ainda não existir.

Depois de entrar com ela, cadastre os demais administradores pela API e **remova a senha do `.env`**.

### 3.2. E-mail e recuperação de acesso (HU10)

A recuperação de senha envia um link de uso único ao e-mail cadastrado. Em produção, a API **não sobe** sem estas variáveis no `deploy/.env`:

| Variável | Exemplo | Observação |
|---|---|---|
| `APP_PUBLIC_URL` | `https://rede-cafuringa.pages.dev` | Origem do front, somente HTTPS, sem caminho. O link vai para `<APP_PUBLIC_URL>/#/nova-senha?token=...` (rota por hash do app; o token fica no fragmento, que não chega ao servidor do front). |
| `MAIL_FROM` | `Rede Cafuringa <nao-responda@dominio>` | Remetente autorizado no provedor (SPF/DKIM do domínio). |
| `SMTP_HOST`, `SMTP_PORT` | `smtp-relay.brevo.com`, `587` | A porta 587 exige STARTTLS; a 465 usa TLS direto. |
| `SMTP_USER`, `SMTP_PASSWORD` | — | Segredos: mesmo cuidado dos demais (`.env` com permissão `600`). |
| `PASSWORD_RESET_TTL_MINUTES` | `30` | Validade do link (5 a 1440 minutos). |
| `PASSWORD_RESET_COOLDOWN_SECONDS` | `60` | Intervalo mínimo entre pedidos da mesma conta. |
| `MAIL_RETRY_DELAYS_MS` | `2000,10000` | Opcional. Esperas entre os reenvios após falha do SMTP (até 5, cada uma até 10 min; vazio desliga). |

**Alerta de e-mail:** o contador `cafuringa_mail_delivery_failures_total{purpose="password_reset"}` (em `/api/v1/metrics`) sobe quando um e-mail não sai nem depois dos reenvios.

Regra sugerida:

```promql
increase(cafuringa_mail_delivery_failures_total[15m]) > 0
```

Nesse caso, o pedido é desfeito, e a pessoa pode pedir novamente na hora.

O Compose de produção fixa `MAIL_TRANSPORT=smtp`. O transporte `log` (padrão em desenvolvimento) escreve o e-mail, com o link, no log da API e, por isso, é recusado em produção.

Depois de configurar, valide de ponta a ponta:

```bash
./scripts/dev.sh indexes --prod   # índices únicos (userId, tokenHash) e TTL de password_reset_tokens

curl -fsS -X POST https://$API_DOMAIN/api/v1/auth/password-reset/request \
  -H 'content-type: application/json' \
  -d '{"email":"<conta-de-teste>"}'

# Confira a caixa de entrada da conta de teste; a resposta é 202 exista ou não a conta.
```

**Desenvolvimento local:** com `MAIL_TRANSPORT=log`, o link aparece em `./scripts/dev.sh logs api` (linha `[e-mail de desenvolvimento]`).

Para testar o envio SMTP real sem provedor, suba um Mailpit e aponte a API para ele:

```bash
docker run -d --name mailpit \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:8025:8025 \
  axllent/mailpit

MAIL_TRANSPORT=smtp SMTP_HOST=host.docker.internal SMTP_PORT=1025 \
  docker compose up -d --no-deps --force-recreate api

# Caixa de entrada em http://localhost:8025
```

Os tokens ficam na coleção `password_reset_tokens`, somente como hash SHA-256, com no máximo um pedido por conta (índice único em `userId`, que também impede dois links gerados por pedidos simultâneos).

- O índice TTL em `expiresAt` apaga cada pedido quando ele vence.
- O índice único em `tokenHash` garante que não haja dois tokens iguais.
- A API garante esses três índices na subida (`syncIndexes`, idempotente), então a proteção por conta existe mesmo que o `indexes --prod` seja esquecido.

A troca de senha grava `credenciaisAlteradasEm` na conta. A partir daí, todo JWT emitido antes disso recebe 401 (`Sessão encerrada. Faça login novamente.`).

---

## 4. Atualizar e reverter

```bash
cd /opt/rede-cafuringa/backend
git pull --ff-only

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env build api
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d api caddy

curl -fsS https://$API_DOMAIN/api/v1/health/ready
```

**Rollback:** volte o commit (`git checkout <commit-anterior>`) e repita o `build/up`.

Não há registry/versionamento de imagem nesta fase; por isso, o rollback é por commit.

---

## 5. Saúde

| Endpoint | Uso | Semântica |
|---|---|---|
| `/api/v1/health/live` | Docker HEALTHCHECK | 200 se o processo está de pé; **não** consulta o Mongo. |
| `/api/v1/health/ready` | Caddy active check, uptime, smoke test | 200 somente com Mongo acessível. |
| `/api/v1/health` | Compatibilidade | Igual ao `ready`. |

Com o Mongo parado, `ready` responde **503** e `live` continua **200**.

O Docker não reinicia por `unhealthy`; use um monitor externo para alertar.

---

## 6. Logs, métricas e rate limit

- **Logs da API:** JSON do Pino, com `req.id` (header `x-request-id`), status e latência. Campos sensíveis são redigidos; a query string não entra no log.
- **Logs do Caddy:** JSON no stdout.
- **Rotação:** `json-file` com `max-size=10m` e `max-file=3` em todos os serviços.
- **Métricas:** `GET /api/v1/metrics` (Prometheus). Em produção:
    - Exige `Authorization: Bearer $METRICS_TOKEN`.
    - O Caddy responde **404** para `/api/v1/metrics` vindo da internet.
    - Scrape interno:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec -T api \
  wget -qO- --header="Authorization: Bearer $METRICS_TOKEN" \
  http://127.0.0.1:3000/api/v1/metrics
```

- **Rate limit global:** `THROTTLE_TTL` (segundos) e `THROTTLE_LIMIT` (requisições).
- **Rotas de autenticação:** login, cadastro e as três rotas de recuperação de acesso usam o limite mais restrito `AUTH_THROTTLE_LIMIT` (`@AuthThrottle()`), contado por IP e por rota.
- **Alertas mínimos:**
    - `ready` diferente de 200 por 2 minutos.
    - 5xx acima de 1% por 5 minutos.
    - Disco acima de 80%.
    - Último backup com mais de 26 horas.
    - Container reiniciando.

### Swagger UI no ambiente de desenvolvimento

A UI em `/api/v1/docs` (e o JSON em `/api/v1/docs-json`) vem **desligada** em produção.

Para ligá-la no ambiente de desenvolvimento:

1. Gere o hash da senha:

   ```bash
   docker run --rm caddy:2.11.7-alpine caddy hash-password
   ```

2. No `deploy/.env`, configure:

   ```dotenv
   SWAGGER_ENABLED=true
   SWAGGER_USER=docs
   SWAGGER_PASSWORD_HASH='<hash>'
   ```

   Use aspas simples por causa dos caracteres `$`.

3. Recrie os serviços:

   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d api caddy
   ```

O Caddy exige basic auth em `/api/v1/docs*`. Sem `SWAGGER_PASSWORD_HASH`, ele usa um hash de senha descartada, então ninguém entra.

**Não ligue em produção real:** a UI expõe toda a superfície da API e o *Try it out* escreve em dados reais.

A referência permanente, sem servidor, é o Swagger UI estático do site (`/api/`).

---

## 7. Backup e restore

### 7.1. Instalação

```bash
cd /opt/rede-cafuringa/backend

sudo install -m 700 deploy/backup/backup.sh deploy/backup/backup.sh
sudo install -m 700 deploy/backup/restore.sh deploy/backup/restore.sh

sudo install -m 644 deploy/backup/cafuringa-backup.service /etc/systemd/system/
sudo install -m 644 deploy/backup/cafuringa-backup.timer /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now cafuringa-backup.timer
```

Ajuste os caminhos em `cafuringa-backup.service` se o projeto não estiver em `/opt/rede-cafuringa/backend`.

### 7.2. Variáveis no `deploy/.env`

```dotenv
MONGO_BACKUP_DIR=/var/backups/cafuringa
BACKUP_RETENTION_DAYS=7

# Recomendado: criptografa antes de sair do host
BACKUP_AGE_RECIPIENT=age1...

# Opcional: bucket privado e versionado no OCI Object Storage
BACKUP_OCI_BUCKET=rede-cafuringa-backups
```

**Gerar chaves `age`:**

```bash
age-keygen -o ~/.config/age/cafuringa.key

# Copie a chave pública (age1...) para BACKUP_AGE_RECIPIENT.
# Guarde a chave privada FORA da VM.
```

### 7.3. Primeira execução

```bash
sudo systemctl start cafuringa-backup.service
sudo journalctl -u cafuringa-backup.service -n 50 --no-pager

ls -lh /var/backups/cafuringa/
sha256sum -c /var/backups/cafuringa/*.sha256
```

### 7.4. Drill mensal (obrigatório)

```bash
cd /opt/rede-cafuringa/backend

set -a
source deploy/.env
set +a

export BACKUP_AGE_IDENTITY=~/.config/age/cafuringa.key   # se usar age

./deploy/backup/restore.sh /var/backups/cafuringa/<arquivo> cafuringa_restore_test
```

O script restaura em `cafuringa_restore_test` e **recusa** o banco de produção.

Ele é para drill; em DR real, faça uma janela, pare a API, preserve o estado atual e restaure para produção (ou para um banco temporário e renomeie).

Compare a contagem de coleções/documentos com a origem e registre:

- Data.
- Arquivo.
- Tamanho.
- Resultado.

### 7.5. Volume criado por Mongo 8.3

O `mongod` 8.0 **não abre** volume com `featureCompatibilityVersion` 8.3.

Não é senha/permissão. Caminho seguro:

1. Subir 8.3 temporariamente.
2. Executar `mongodump`.
3. Criar um volume novo 8.0.
4. Executar `mongorestore`.
5. Validar.

Em desenvolvimento, se os dados forem descartáveis, remova `backend_mongo-data` e `backend_mongo-config`.

### 7.6. Volume que já existia

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec -T mongo \
  mongosh -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --quiet \
  --eval 'const d=db.getSiblingDB("cafuringa"); if (!d.getUser("cafuringa_app")) d.createUser({user:"cafuringa_app",pwd:process.env.MONGO_APP_PASSWORD,roles:[{role:"readWrite",db:"cafuringa"}]})'
```

### 7.7. Retenção e offsite

- **Local:** `BACKUP_RETENTION_DAYS` (padrão: 7).
- **Offsite:** bucket OCI privado, versionado, com lifecycle próprio.
- Sem `BACKUP_OCI_BUCKET`, o backup fica somente no host — **não é DR**.
- **Nunca** use `docker compose down -v` em produção: apaga o volume nomeado.

---

## 8. Segredos

- `.env` com permissão `600`, dono do usuário de deploy.
- `MONGO_APP_PASSWORD`: criar/trocar no Mongo, atualizar `.env`, recriar `api`, validar `ready` e remover usuário antigo.
- `METRICS_TOKEN`: gerar com `openssl rand -hex 32`, atualizar `.env` e recriar `api`.
- `SMTP_PASSWORD`: trocar no provedor, atualizar `.env`, recriar `api` e pedir uma recuperação de teste (seção 3.2).
- **Root do Mongo:** usar `db.changeUserPassword` em janela de manutenção e atualizar `.env`.
- **OCI Vault:** é a evolução prevista; `.env` é o mínimo aceitável no free tier.

---

## 9. Incidente — checklist

1. `docker compose ... ps` — o que está `unhealthy` ou reiniciando?
2. `docker compose ... logs --since 15m api mongo caddy` — verificar erros, OOM e disco.
3. `curl -i https://$API_DOMAIN/api/v1/health/live` e `/ready`.
4. `df -h`, `free -m` e `docker stats --no-stream`.
5. `docker inspect --format '{{json .State.Health}}' <container>`.
6. **Mongo caiu:** verificar disco, OOM e logs; reiniciar e validar `ready`.
7. **Caddy sem TLS:** verificar DNS, portas 80/443 e rate limit do Let's Encrypt.
8. Registrar linha do tempo e causa raiz; realizar postmortem sem culpa.

---

## 10. Hardening do host

**Evidência inicial (read-only):** na VM OCI, rode:

```bash
sudo bash deploy/host-audit.sh
```

Não rode no WSL/local: lá os dados de disco, firewall e Docker são da sua máquina de desenvolvimento, não do servidor (o script avisa quando detecta WSL).

**Checklist de hardening:**

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

---

## 11. SLO inicial

| Indicador | Alvo |
|---|---|
| Disponibilidade da API (`ready`) | 99,5% mensal |
| Erros 5xx | Menos de 1% das requisições |
| Latência p95 (API interna) | Menos de 300 ms |
| RPO | 24 h |
| RTO | 2 h |
| Restore drill | 1 por mês |

---

## 12. Comandos úteis

```bash
# Configuração renderizada (falha se faltar variável)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env config

# Health e headers
curl -i https://$API_DOMAIN/api/v1/health/ready
curl -i -H "Origin: $CORS_ORIGINS" https://$API_DOMAIN/api/v1/health/live

# Mongo
docker compose ... exec -T mongo mongosh \
  -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --quiet \
  --eval 'db.serverStatus().wiredTiger.cache["maximum bytes configured"]'

# Espaço e volumes
docker system df -v
docker volume ls
```