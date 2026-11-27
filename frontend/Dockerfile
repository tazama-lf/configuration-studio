# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Pinned serve (issue #45): the version was previously unpinned, so image
# builds were not reproducible.
RUN npm install -g serve@14.2.2

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh \
    && chown -R node:node /app

USER node

EXPOSE 5176

# Frontend liveness: the SPA shell must be reachable.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5176/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["serve", "-s", "dist", "-l", "5176", "-c", "/app/serve.json"]
