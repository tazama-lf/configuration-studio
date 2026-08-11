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

USER node

EXPOSE 5176

CMD ["serve", "-s", "dist", "-l", "5176"]