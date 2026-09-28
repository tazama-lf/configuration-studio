# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN \
    npm ci --omit=dev && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3015

CMD ["node", "dist/main.js"]