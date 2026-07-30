# Environment Variables

Root file: `.env.example` → copy to `.env` (never commit `.env`).

Validated at API boot via Zod (`apps/api/src/config/env.schema.ts`).

## Required (Phase 1)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | ≥ 32 chars (used from Phase 3) |
| `JWT_REFRESH_SECRET` | ≥ 32 chars (used from Phase 3) |

## Feature flags

| Variable | LOT 1 default |
|----------|----------------|
| `PAYMENTS_ENABLED` | `false` |
| `LIVE_GAMES_ENABLED` | `false` |
| `TRANSLATION_ENABLED` | `false` |
| `GOOGLE_TRANSLATION_API_KEY` | Optional; required when translation is on |
| `GAME_PROVIDER_MODE` | `mock` |

## Admin seed (Phase 5)

| Variable | Description |
|----------|-------------|
| `SEED_ADMIN_EMAIL` | Optional staff email to bootstrap |
| `SEED_ADMIN_PASSWORD` | Optional (≥ 8 chars); empty = skip seed |
| `SEED_ADMIN_ROLE` | `SUPER_ADMIN` (default) / `ADMIN` / … |

Invalid env values prevent the API from starting (fail-fast).
