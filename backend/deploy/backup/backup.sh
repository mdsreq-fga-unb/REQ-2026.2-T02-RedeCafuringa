#!/usr/bin/env bash
set -euo pipefail

# Backup lógico do MongoDB em produção.
# Roda no host, usando o container "mongo" que já está de pé.
#
# Variáveis (via deploy/.env ou ambiente):
#   MONGO_ROOT_USER / MONGO_ROOT_PASSWORD  -> autenticação (obrigatórias em prod)
#   MONGO_DB                               -> banco (default: cafuringa)
#   MONGO_BACKUP_DIR                       -> destino local
#   BACKUP_RETENTION_DAYS                  -> retenção local
#   BACKUP_AGE_RECIPIENT                   -> opcional: chave pública age
#   BACKUP_OCI_BUCKET                      -> opcional: bucket OCI Object Storage
#
# O arquivo é gravado com permissão restrita, com SHA-256 ao lado. Se
# BACKUP_AGE_RECIPIENT estiver definido, o conteúdo é cifrado antes do upload.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/../docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../.env}"
BACKUP_DIR="${MONGO_BACKUP_DIR:-/var/backups/cafuringa}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
MONGO_DB="${MONGO_DB:-cafuringa}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$BACKUP_DIR/cafuringa-$STAMP.archive.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

COMPOSE_ENV_ARGS=()
if [[ -f "$ENV_FILE" ]]; then
  COMPOSE_ENV_ARGS+=(--env-file "$ENV_FILE")
fi

AUTH_ARGS=()
if [[ -n "${MONGO_ROOT_USER:-}" ]]; then
  : "${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD é obrigatório quando MONGO_ROOT_USER existe}"
  AUTH_ARGS+=(--username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin)
fi

docker compose -f "$COMPOSE_FILE" "${COMPOSE_ENV_ARGS[@]}" exec -T mongo \
  mongodump "${AUTH_ARGS[@]}" --db "$MONGO_DB" --gzip --archive > "$ARCHIVE"

if [[ ! -s "$ARCHIVE" ]]; then
  echo "backup vazio: $ARCHIVE" >&2
  exit 1
fi

chmod 600 "$ARCHIVE"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
chmod 600 "$ARCHIVE.sha256"

if [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]]; then
  command -v age >/dev/null 2>&1 || {
    echo "age não encontrado; instale antes de usar BACKUP_AGE_RECIPIENT" >&2
    exit 1
  }
  age -r "$BACKUP_AGE_RECIPIENT" -o "$ARCHIVE.age" "$ARCHIVE"
  rm -f "$ARCHIVE" "$ARCHIVE.sha256"
  ARCHIVE="$ARCHIVE.age"
  chmod 600 "$ARCHIVE"
  sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
  chmod 600 "$ARCHIVE.sha256"
fi

if [[ -n "${BACKUP_OCI_BUCKET:-}" ]]; then
  command -v oci >/dev/null 2>&1 || {
    echo "oci CLI não encontrado; instale antes de usar BACKUP_OCI_BUCKET" >&2
    exit 1
  }
  oci os object put \
    --bucket-name "$BACKUP_OCI_BUCKET" \
    --file "$ARCHIVE" \
    --name "mongo/$(basename "$ARCHIVE")" \
    --force
  oci os object put \
    --bucket-name "$BACKUP_OCI_BUCKET" \
    --file "$ARCHIVE.sha256" \
    --name "mongo/$(basename "$ARCHIVE.sha256")" \
    --force
fi

find "$BACKUP_DIR" -type f \
  \( -name 'cafuringa-*.archive.gz*' -o -name 'cafuringa-*.archive.age*' \) \
  -mtime +"$RETENTION_DAYS" -delete

echo "backup ok: $ARCHIVE"
