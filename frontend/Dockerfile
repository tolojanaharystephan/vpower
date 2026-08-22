# syntax=docker/dockerfile:1
# Next.js client (@vpower777/client-web) — multi-stage production build
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
ARG NEXT_PUBLIC_API_URL=https://staging.vpower777.fun
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

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

COPY apps/client-web ./apps/client-web
COPY packages/config ./packages/config
COPY packages/types ./packages/types
COPY packages/ui ./packages/ui

RUN pnpm --filter @vpower777/types build \
 && pnpm --filter @vpower777/config build \
 && pnpm --filter @vpower777/client-web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/apps/client-web/public ./apps/client-web/public
COPY --from=build --chown=nextjs:nodejs /app/apps/client-web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/client-web/.next/static ./apps/client-web/.next/static

USER nextjs
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3001').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/client-web/server.js"]
