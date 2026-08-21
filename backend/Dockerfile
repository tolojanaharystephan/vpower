# syntax=docker/dockerfile:1
# NestJS API (@vpower777/api) — multi-stage production build
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/admin-web/package.json ./apps/admin-web/
COPY apps/client-web/package.json ./apps/client-web/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config ./packages/eslint-config/
COPY packages/typescript-config ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/config ./packages/config
COPY packages/types ./packages/types

RUN pnpm --filter @vpower777/types build \
 && pnpm --filter @vpower777/config build \
 && pnpm --filter @vpower777/api build

RUN pnpm --filter @vpower777/api --prod deploy /prod/api

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3000

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nestjs

COPY --from=build --chown=nestjs:nodejs /prod/api ./

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/health/live || exit 1

CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
