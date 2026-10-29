#!/usr/bin/env bash
# Smoke test da imagem do frontend (target prod).
# Sobe o container com as mesmas restrições do compose (read-only, sem capabilities)
# e confere health, fallback de SPA, cabeçalhos de segurança e cache do service worker.
#
# Uso: scripts/smoke-app-image.sh <imagem> [porta]
# Portável: evita `curl -o /dev/null`, que falha no curl.exe do Windows (Git Bash).
set -euo pipefail

IMAGE="${1:?uso: $0 <imagem> [porta]}"
PORT="${2:-18080}"
NAME="app-smoke-$$"
BASE="http://127.0.0.1:${PORT}"

# shellcheck disable=SC2329 # chamada via trap
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

fail() {
  echo "FALHOU: $*" >&2
  docker logs "$NAME" 2>&1 | tail -20 >&2 || true
  exit 1
}

# Valor do cabeçalho $2 da resposta de GET $1 (vazio se ausente).
header() {
  curl -fsSI "${BASE}$1" | tr -d '\r' | grep -i "^$2:" | head -1 | cut -d: -f2- | sed 's/^ //' || true
}

expect() {
  local path="$1" name="$2" want="$3" got
  got="$(header "$path" "$name")"
  [ "$got" = "$want" ] || fail "$path $name: esperado '$want', veio '${got:-<ausente>}'"
  echo "ok  $path  $name: $got"
}

docker run -d --name "$NAME" --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges -p "127.0.0.1:${PORT}:8080" "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  curl -fsS "${BASE}/healthz" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "${BASE}/healthz" >/dev/null || fail "/healthz não respondeu em 30 s"
echo "ok  /healthz  200"

expect / x-content-type-options nosniff
expect / x-frame-options DENY
expect / cache-control no-cache
expect /sw.js cache-control no-cache
expect /manifest.webmanifest content-type application/manifest+json

# Content-Security-Policy restritiva, também no service worker
for path in / /sw.js; do
  csp="$(header "$path" content-security-policy)"
  [ -n "$csp" ] || fail "$path sem Content-Security-Policy"
  grep -q "default-src 'self'" <<<"$csp" || fail "$path: CSP sem default-src 'self'"
  grep -q "frame-ancestors 'none'" <<<"$csp" || fail "$path: CSP sem frame-ancestors 'none'"
  if grep -qE "unsafe-inline|unsafe-eval" <<<"$csp"; then fail "$path: CSP permite unsafe-inline/unsafe-eval"; fi
  echo "ok  $path  Content-Security-Policy restritiva"
done

# Rota do SPA devolve o mesmo index.html
[ "$(curl -fsS "${BASE}/conta/perfil" | sha256sum)" = "$(curl -fsS "${BASE}/" | sha256sum)" ] \
  || fail "rota /conta/perfil não caiu no index.html"
echo "ok  /conta/perfil  fallback de SPA"

# PWA: manifesto da marca e ícones realmente servidos como PNG
index="$(curl -fsS "${BASE}/")"
grep -q '<html lang="pt-BR"' <<<"$index" || fail 'index.html sem lang="pt-BR"'
grep -q '<title>Rede Cafuringa</title>' <<<"$index" || fail "index.html sem o título Rede Cafuringa"
echo "ok  index.html  lang e título"

manifest="$(curl -fsS "${BASE}/manifest.webmanifest")"
grep -q '"name":"Rede Cafuringa"' <<<"$manifest" || fail "manifest sem o nome Rede Cafuringa"
grep -q '"purpose":"maskable"' <<<"$manifest" || fail "manifest sem ícone maskable"
icons="$(grep -oE '"src":"[^"]+"' <<<"$manifest" | cut -d'"' -f4)"
[ -n "$icons" ] || fail "manifest sem ícones"
for icon in $icons; do
  expect "/${icon}" content-type image/png
done

# Asset com hash: cache longo e imutável
asset="$(curl -fsS "${BASE}/" | grep -oE '/assets/[^"]+\.js' | head -1)"
[ -n "$asset" ] || fail "nenhum /assets/*.js referenciado no index.html"
expect "$asset" cache-control "public, max-age=31536000, immutable"

# Asset inexistente é 404 (não pode cair no index.html)
code="$(curl -sI "${BASE}/assets/nao-existe.js" | head -1 | awk '{print $2}')"
[ "$code" = "404" ] || fail "asset inexistente devolveu $code (esperado 404)"
echo "ok  /assets/nao-existe.js  404"

# O HEALTHCHECK do Docker precisa chegar a healthy
for _ in $(seq 1 40); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$NAME")" = "healthy" ] && { echo "ok  container healthy"; echo "smoke OK: $IMAGE"; exit 0; }
  sleep 1
done
fail "container não ficou healthy"
