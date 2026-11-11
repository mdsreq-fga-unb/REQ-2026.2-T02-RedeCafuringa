# syntax=docker/dockerfile:1.7
# Imagem multi-arquitetura: roda em x86 (dev) e ARM64 (OCI Ampere A1).
# Base pinada por digest para build reprodutível.
ARG NODE_IMAGE=node:24.22-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

# hadolint ignore=DL3006
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# hadolint ignore=DL3006
FROM ${NODE_IMAGE}

LABEL org.opencontainers.image.title="Rede Cafuringa API" \
      org.opencontainers.image.description="API REST da plataforma Rede Cafuringa" \
      org.opencontainers.image.source="https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa" \
      org.opencontainers.image.licenses="UNLICENSED"

ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--enable-source-maps

WORKDIR /app

COPY --from=build --chown=1000:1000 /app/package.json ./
COPY --from=build --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=build --chown=1000:1000 /app/dist ./dist

# O runtime não precisa de npm/npx/corepack. Removê-los elimina as CVEs
# transitivas do npm e reduz a superfície de ataque.
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack

USER 1000:1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD ["sh", "-c", "wget -qO- \"http://127.0.0.1:${PORT:-3000}/api/v1/health/live\" || exit 1"]

STOPSIGNAL SIGTERM

CMD ["node", "dist/main.js"]
