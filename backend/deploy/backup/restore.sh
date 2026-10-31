#!/usr/bin/env bash
set -euo pipefail

# Restore de um backup gerado por backup.sh.
# Por padrão restaura em um banco separado (cafuringa_restore_test) para
# validar sem tocar no banco de produção.
#
# Uso:
#   ./restore.sh /var/backups/cafuringa/20261024T031500Z.archive.gz
#   ./restore.sh /var/backups/cafuringa/20261024T031500Z.archive.age cafuringa_restore_test
#
# Para .age, defina BACKUP_AGE_IDENTITY com o caminho da chave privada.

ARCHIVE="${1:?uso: restore.sh <arquivo> [banco_destino]}"
TARGET_DB="${2:-cafuringa_restore_test}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/../docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../.env}"
MONGO_DB="${MONGO_DB:-cafuringa}"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "arquivo não encontrado: $ARCHIVE" >&2
  exit 1
fi

if [[ "$TARGET_DB" == "$MONGO_DB" ]]; then
  echo "recusando restaurar por cima do banco de produção ($MONGO_DB)" >&2
  echo "use outro nome de banco para o drill" >&2
  exit 1
fi

COMPOSE_ENV_ARGS=()
if [[ -f "$ENV_FILE" ]]; then
  COMPOSE_ENV_ARGS+=(--env-file "$ENV_FILE")
fi

AUTH_ARGS=()
MONGO_SH_AUTH=()
if [[ -n "${MONGO_ROOT_USER:-}" ]]; then
  : "${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD é obrigatório quando MONGO_ROOT_USER existe}"
  AUTH_ARGS+=(--username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin)
  MONGO_SH_AUTH+=(-u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin)
fi

WORK_FILE="$ARCHIVE"
TEMP_FILE=""
cleanup() {
  if [[ -n "$TEMP_FILE" ]]; then
    rm -f "$TEMP_FILE"
  fi
}
trap cleanup EXIT

if [[ "$ARCHIVE" == *.age ]]; then
  : "${BACKUP_AGE_IDENTITY:?BACKUP_AGE_IDENTITY é obrigatório para arquivos .age}"
  command -v age >/dev/null 2>&1 || {
    echo "age não encontrado" >&2
    exit 1
  }
  TEMP_FILE="$(mktemp)"
  age -d -i "$BACKUP_AGE_IDENTITY" -o "$TEMP_FILE" "$ARCHIVE"
  WORK_FILE="$TEMP_FILE"
fi

gunzip -c "$WORK_FILE" | docker compose -f "$COMPOSE_FILE" "${COMPOSE_ENV_ARGS[@]}" exec -T mongo \
  mongorestore "${AUTH_ARGS[@]}" \
  --archive \
  --nsFrom="${MONGO_DB}.*" \
  --nsTo="${TARGET_DB}.*"

echo "restore ok em $TARGET_DB"
docker compose -f "$COMPOSE_FILE" "${COMPOSE_ENV_ARGS[@]}" exec -T mongo \
  mongosh "${MONGO_SH_AUTH[@]}" --quiet --eval \
  "const d=db.getSiblingDB('$TARGET_DB'); print('coleções=' + d.getCollectionNames().length)"
