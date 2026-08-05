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

## Domain tables (current)

Auth / users: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, refresh / reset / verification tokens.

Games: `game_providers`, `game_categories`, `games`, `user_favorites`, `user_game_history`.

**Support (Phases 9–10 + realtime):**
- `support_tickets` — includes free-form `preferred_lang`
- `support_messages` — original `body` + detected `source_lang` + `kind` (`text`|`voice`) + `audio_url`
- `support_message_translations` — cache `(message_id, target_lang)`
- `support_bot_faqs` — FAQ for first-line quick assistant
- `notifications` — in-app notifications (support message / status)

Later: `support_attachments`, `support_agents`, knowledge base / FAQ tables.
