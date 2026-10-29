# syntax=docker/dockerfile:1.7
# Imagem do frontend (React + Vite + PWA).
#   target dev  -> Vite com hot reload (usado pelo compose.yaml da raiz)
#   target prod -> arquivos estáticos servidos por nginx sem privilégios
# Mesma base de Node do backend (versão e digest), build reprodutível e multi-arch (amd64/arm64).
ARG NODE_IMAGE=node:24.22-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6

# hadolint ignore=DL3006
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
RUN npm ci

FROM deps AS dev
COPY --chown=node:node . .
ENV NODE_ENV=development
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD ["wget", "-qO-", "http://127.0.0.1:5173/"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM deps AS build
COPY --chown=node:node . .
# URL da API embutida no bundle em tempo de build (nunca coloque segredo aqui: VITE_* é público).
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# hadolint ignore=DL3006
FROM ${NGINX_IMAGE} AS prod

LABEL org.opencontainers.image.title="Rede Cafuringa App" \
      org.opencontainers.image.description="Frontend (PWA) da plataforma Rede Cafuringa" \
      org.opencontainers.image.source="https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
  CMD ["wget", "-qO-", "http://127.0.0.1:8080/healthz"]

STOPSIGNAL SIGQUIT
