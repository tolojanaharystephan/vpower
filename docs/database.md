# Database

## Stack

- PostgreSQL 16+ (Docker image `postgres:16-alpine`, or native local)
- Drizzle ORM + Drizzle Kit
- Schema location: `apps/api/src/database/schema`

## Local strategies

### A. Native local (current machine — no Docker)

PostgreSQL Windows + Redis Windows are enough:

```bash
pnpm infra:up
# or explicitly:
pnpm infra:up:native
pnpm db:migrate
```

### B. Docker Compose (when Docker Desktop is installed)

```bash
pnpm infra:up:docker
# or: pnpm infra:up  (auto-detects Docker)
```

Credentials (dev only):

- user / password / db: `vpower777`
- URL: `postgresql://vpower777:vpower777@127.0.0.1:5432/vpower777`

**Important:** use the same DB user in `DATABASE_URL` as the one that owns tables / schema `drizzle`. Mixing `postgres` then `vpower777` causes silent migrate failures (permission denied).

## Commands

```bash
pnpm db:generate   # create SQL migration from schema
pnpm db:migrate    # apply migrations
pnpm db:push       # push schema (dev shortcut)
pnpm db:studio     # Drizzle Studio
```

## Phase 1 tables

- `system_meta` — bootstrap / key-value
- `feature_flags` — flag persistence ready for later phases

Domain tables (users, games, support, …) arrive in later phases.
