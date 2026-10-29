#!/usr/bin/env bash
# Comandos de rotina do repositório Rede Cafuringa.
#
# Uso: ./scripts/dev.sh <comando> [argumentos]      (veja: ./scripts/dev.sh help)
#
# Requer Bash (no Windows, o Git Bash que vem com o Git). Cada comando só orquestra
# npm, docker e git; a lógica de cada app continua nos scripts do próprio package.json.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; RST=$'\033[0m'
else
  BOLD=''; RED=''; YEL=''; GRN=''; RST=''
fi

info() { printf '%s==>%s %s\n' "$BOLD" "$RST" "$*"; }
ok() { printf '%s ok%s %s\n' "$GRN" "$RST" "$*"; }
warn() { printf '%saviso:%s %s\n' "$YEL" "$RST" "$*" >&2; }
die() { printf '%serro:%s %s\n' "$RED" "$RST" "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "'$1' não encontrado. $2"; }

usage() {
  cat <<'EOF'
Uso: ./scripts/dev.sh <comando> [argumentos]

Ambiente
  setup [--force]          Confere pré-requisitos, instala dependências e cria backend/.env
  up [--prod]              Sobe mongo + api + app (Vite, :5173). --prod serve o front via nginx em :8080
  down [-v]                Derruba o ambiente (-v apaga também os volumes, inclusive o banco)
  status                   Mostra os containers
  logs [serviço]           Acompanha os logs (api, app, mongo)

Qualidade (os mesmos passos do CI)
  check [backend|app|all]  lint, format, typecheck, build e testes (sem E2E, audit e Docker)
  test [backend|app|all] [--e2e]   Só os testes; --e2e roda também os E2E do backend
  build [backend|app|all]  Build dos apps (npm run build)
  images                   Constrói as imagens Docker de produção (api e app), como o CI
  smoke                    Smoke test da imagem do app (rode "images" antes)

Docs e git
  docs [serve|build]       MkDocs (ambiente Python isolado fora do repositório)
  branch <tipo>/<nome>     Cria branch a partir de origin/dev. Tipos: feat fix docs chore refactor test ci style perf
  clean [--deps] [--docker] [-y]   Remove artefatos de build (--deps: node_modules; --docker: containers e volumes)
  help                     Esta ajuda
EOF
}

# --- utilitários -------------------------------------------------------------

# Define APPS (lista separada por espaço) a partir de backend|app|all.
resolve_apps() {
  case "${1:-all}" in
    backend | app) APPS="$1" ;;
    all) APPS="backend app" ;;
    *) die "app inválido: '$1' (use backend, app ou all)" ;;
  esac
}

ensure_deps() {
  [ -d "$ROOT/$1/node_modules" ] || die "$1: dependências não instaladas. Rode: ./scripts/dev.sh setup"
}

run_npm() {
  local app="$1" script="$2"
  info "$app: npm run $script"
  (cd "$ROOT/$app" && npm run --silent "$script")
}

ensure_env() {
  if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    ok "backend/.env criado a partir do .env.example (valores apenas para desenvolvimento)"
  fi
}

confirm() {
  [ -t 0 ] || die "sem terminal interativo; repita com -y para confirmar"
  local reply
  read -r -p "Continuar? [s/N] " reply
  [[ "$reply" =~ ^[sSyY]$ ]] || die "cancelado"
}

check_node() {
  local want have
  want="$(tr -d '[:space:]' < .nvmrc)"
  have="$(node -v | sed 's/^v//')"
  [ "${have%%.*}" = "${want%%.*}" ] || die "Node $have em uso, mas o projeto usa a série ${want%%.*}.x (.nvmrc: $want). Instale com: nvm install $want"
  [ "$have" = "$want" ] || warn "Node $have em uso; o projeto fixa $want (.nvmrc). Funciona, mas o CI e o Docker usam $want."
}

# --- comandos ----------------------------------------------------------------

cmd_setup() {
  local force=0
  [ "${1:-}" = "--force" ] && force=1
  info "Verificando pré-requisitos"
  need git "Instale o Git."
  need node "Instale o Node $(tr -d '[:space:]' < .nvmrc) (por exemplo: nvm install)."
  need npm "Vem junto com o Node."
  need docker "Instale o Docker Desktop (ou Docker Engine com o plugin compose)."
  docker compose version >/dev/null 2>&1 || die "'docker compose' (v2) não encontrado."
  check_node
  ok "git, node, npm e docker compose disponíveis"

  local app dir
  for app in backend app; do
    dir="$ROOT/$app"
    if [ "$force" = 0 ] && [ -d "$dir/node_modules" ] && [ "$dir/node_modules/.package-lock.json" -nt "$dir/package-lock.json" ]; then
      ok "$app: dependências em dia"
    else
      info "$app: npm ci"
      (cd "$dir" && npm ci --no-audit --no-fund)
    fi
  done

  if [ -f backend/.env ]; then ok "backend/.env já existe"; else ensure_env; fi

  cat <<'EOF'

Pronto. Próximos passos:
  ./scripts/dev.sh up       sobe o ambiente (app em http://localhost:5173, api em http://localhost:3000)
  ./scripts/dev.sh check    roda os mesmos passos do CI antes de abrir um PR
EOF
}

cmd_up() {
  need docker "Instale o Docker."
  ensure_env
  case "${1:-}" in
    --prod)
      info "Subindo mongo + api + app (nginx, como em produção)"
      docker compose --profile prod up -d --build --wait mongo api app-prod
      ok "app em http://localhost:8080 | api em http://localhost:3000/api/v1/health/live"
      ;;
    '')
      info "Subindo mongo + api + app (Vite com hot reload)"
      docker compose up -d --build --wait
      ok "app em http://localhost:5173 | api em http://localhost:3000/api/v1/health/live"
      ;;
    *) die "opção desconhecida para up: $1 (use --prod)" ;;
  esac
}

cmd_down() {
  need docker "Instale o Docker."
  docker compose --profile prod down "$@"
}

cmd_status() {
  need docker "Instale o Docker."
  docker compose --profile prod ps
}

cmd_logs() {
  need docker "Instale o Docker."
  docker compose --profile prod logs -f --tail=100 "$@"
}

cmd_check() {
  resolve_apps "${1:-all}"
  local app script
  for app in $APPS; do
    ensure_deps "$app"
    case "$app" in
      backend) for script in lint format:check typecheck build test; do run_npm backend "$script"; done ;;
      app) for script in lint build test; do run_npm app "$script"; done ;;
    esac
  done
  ok "check concluído (não inclui E2E, npm audit nem build das imagens Docker)"
}

cmd_test() {
  local target=all e2e=0 arg
  for arg in "$@"; do
    case "$arg" in
      --e2e) e2e=1 ;;
      *) target="$arg" ;;
    esac
  done
  resolve_apps "$target"
  local app
  for app in $APPS; do
    ensure_deps "$app"
    run_npm "$app" test
    if [ "$e2e" = 1 ] && [ "$app" = backend ]; then run_npm backend test:e2e; fi
  done
  if [ "$e2e" = 1 ] && [ "$target" = app ]; then warn "o app não tem testes E2E; --e2e só vale para o backend"; fi
}

cmd_build() {
  resolve_apps "${1:-all}"
  local app
  for app in $APPS; do
    ensure_deps "$app"
    run_npm "$app" build
  done
}

cmd_images() {
  need docker "Instale o Docker."
  info "Imagem da API"
  docker build -t rede-cafuringa-api:local backend
  info "Imagem do app (target prod)"
  docker build -t rede-cafuringa-app:local --target prod app
  ok "rede-cafuringa-api:local e rede-cafuringa-app:local"
}

cmd_smoke() {
  need docker "Instale o Docker."
  need curl "Instale o curl."
  docker image inspect rede-cafuringa-app:local >/dev/null 2>&1 || die "imagem rede-cafuringa-app:local não existe. Rode: ./scripts/dev.sh images"
  bash scripts/smoke-app-image.sh rede-cafuringa-app:local
}

# Python 3.9+ (descarta o atalho da Microsoft Store, que existe mas não executa).
docs_python() {
  local candidate
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 \
      && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

# Caminho no formato que o programa nativo entende (no Git Bash, o Python do Windows
# não aceita /c/Users/...; cygpath converte para C:/Users/...).
native_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

cmd_docs() {
  local sub="${1:-serve}" py venv stamp want pybin
  py="$(docs_python)" || die "Python 3.9+ não encontrado (necessário para o MkDocs)."
  venv="${XDG_CACHE_HOME:-$HOME/.cache}/rede-cafuringa/docs-venv"
  stamp="$venv/.requirements.sha256"
  want="$(sha256sum requirements.txt | cut -d' ' -f1)"

  if [ ! -d "$venv" ] || [ "$(cat "$stamp" 2>/dev/null || true)" != "$want" ]; then
    info "Preparando o ambiente do MkDocs em $venv (fora do repositório)"
    "$py" -m venv "$(native_path "$venv")"
    pybin="$venv/bin/python"
    [ -x "$pybin" ] || pybin="$venv/Scripts/python.exe"
    "$pybin" -m pip install --quiet --disable-pip-version-check -r requirements.txt
    echo "$want" > "$stamp"
  fi

  pybin="$venv/bin/python"
  [ -x "$pybin" ] || pybin="$venv/Scripts/python.exe"
  case "$sub" in
    serve) "$pybin" -m mkdocs serve -a 127.0.0.1:8000 ;;
    build) "$pybin" -m mkdocs build ;;
    *) die "uso: dev.sh docs [serve|build]" ;;
  esac
}

cmd_branch() {
  local name="${1:-}"
  [ -n "$name" ] || die "uso: ./scripts/dev.sh branch <tipo>/<descricao>   (ex.: feat/cadastro-produtor)"
  [[ "$name" =~ ^(feat|fix|docs|chore|refactor|test|ci|style|perf)/[a-z0-9][a-z0-9._-]*$ ]] \
    || die "nome inválido: '$name'. Use <tipo>/<descricao> em minúsculas, tipos: feat fix docs chore refactor test ci style perf"
  if git show-ref --verify --quiet "refs/heads/$name"; then die "a branch '$name' já existe localmente"; fi
  info "Atualizando origin/dev"
  git fetch --quiet origin dev
  if git ls-remote --exit-code --heads origin "$name" >/dev/null 2>&1; then die "a branch '$name' já existe no remoto"; fi
  if ! git diff --quiet || ! git diff --cached --quiet; then
    warn "há alterações não commitadas; elas vão junto para a nova branch"
  fi
  git switch -c "$name" --no-track origin/dev
  ok "branch '$name' criada a partir de origin/dev ($(git rev-parse --short HEAD))"
  echo "Quando terminar: git push -u origin $name  e abra o PR para a dev."
}

cmd_clean() {
  local deps=0 dockerr=0 yes=0 arg
  for arg in "$@"; do
    case "$arg" in
      --deps) deps=1 ;;
      --docker) dockerr=1 ;;
      -y | --yes) yes=1 ;;
      *) die "opção desconhecida para clean: $arg" ;;
    esac
  done
  info "Será removido: app/dist backend/dist app/coverage backend/coverage site/"
  [ "$deps" = 1 ] && echo "  + app/node_modules backend/node_modules"
  [ "$dockerr" = 1 ] && echo "  + containers e VOLUMES do ambiente (inclui o banco de desenvolvimento)"
  [ "$yes" = 1 ] || confirm
  rm -rf app/dist backend/dist app/coverage backend/coverage site
  if [ "$deps" = 1 ]; then rm -rf app/node_modules backend/node_modules; fi
  if [ "$dockerr" = 1 ]; then
    need docker "Instale o Docker."
    docker compose --profile prod down -v
  fi
  ok "limpeza concluída"
}

main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    setup) cmd_setup "$@" ;;
    up) cmd_up "$@" ;;
    down) cmd_down "$@" ;;
    status) cmd_status ;;
    logs) cmd_logs "$@" ;;
    check) cmd_check "$@" ;;
    test) cmd_test "$@" ;;
    build) cmd_build "$@" ;;
    images) cmd_images ;;
    smoke) cmd_smoke ;;
    docs) cmd_docs "$@" ;;
    branch) cmd_branch "$@" ;;
    clean) cmd_clean "$@" ;;
    help | -h | --help) usage ;;
    *) usage >&2; die "comando desconhecido: $cmd" ;;
  esac
}

main "$@"
