# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh \
    && chown -R node:node /app

USER node

EXPOSE 5176

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["serve", "-s", "dist", "-l", "5176"]