# Development Guide

## Phase 0 (done)

Monorepo scaffold.

## Phase 1 (done)

Docker Compose + native local Postgres/Redis, Drizzle, typed env.

```bash
# Infra (Docker when available)
pnpm infra:up

# Or native: PostgreSQL service + Redis (redis-server)

# DB
pnpm db:generate
pnpm db:migrate

# API
pnpm --filter @vpower777/types build
pnpm --filter @vpower777/config build
pnpm --filter @vpower777/api dev
# http://localhost:4000/health
# http://localhost:4000/health/ready
```

### Windows note

If `pnpm install` fails with `EPERM` on symlinks, keep the root `.npmrc` settings:

- `node-linker=hoisted`
- `package-import-method=copy`
- `inject-workspace-packages=true`

Optional: enable **Windows Developer Mode** (Settings → Privacy & security → For developers) for better symlink support.

## Phase 4 (done)

Client Web — dark cinema + amber, landing hero, catalog shell, i18n FR/EN, auth forms.

```bash
pnpm --filter @vpower777/api dev
pnpm --filter @vpower777/client-web dev
# http://localhost:3000/fr
# http://localhost:3000/en
```

Mock games are placeholders until Phase 6 catalog sync.

## Phase 5 (done)

Admin Web — login staff, sidebar shell, dashboard overview.

```bash
pnpm --filter @vpower777/api dev
pnpm --filter @vpower777/admin-web dev
# http://localhost:3001/login
# Seed: admin@vpower777.local / ChangeMeAdmin123! (if SEED_ADMIN_* set)
```

See `docs/admin.md`.

## Phase 6 (in progress)

Game catalog schema + Nest CRUD (`/api/v1/games`, categories, providers). Admin UI CRUD and client sync still pending.

## Dual local strategy

1. **Docker** — PostgreSQL + Redis via Compose (`pnpm infra:up` when Docker is installed).
2. **Native local** — PostgreSQL Windows service + Redis (`pnpm infra:up` auto-fallback).

Apps run via `pnpm` on the host.

## Phase order

0 Architecture & monorepo  
1 Docker, Postgres, Redis, Drizzle  
2 NestJS core + security  
3 Auth + users + RBAC  
4 Client Web  
5 Admin Web  
6 Game catalog  
7 Real game provider adapter (mock until then)  
8 Customer portal  
9–10 Support + tickets  
11 Translation  
12 Notifications  
13 Admin support  
14–15 Payment & live stubs  
16–20 Tests, Docker apps, CI/CD, docs, AWS prep  

## Rules

- Do not invent external game API endpoints.
- Feature flags: `PAYMENTS_ENABLED=false`, `LIVE_GAMES_ENABLED=false` in LOT 1.
- Never expose server secrets to Next.js client bundles.
