# Architecture — VPower777

## Style

**Modular Monolith** (NestJS) inside a **pnpm + Turborepo** monorepo.

Not microservices at start. Domain modules are isolated with clear interfaces so they can be extracted later:

- Payment Service
- Game Integration Service
- Live Game Service
- Notification Service
- Analytics Service

## Apps

| App | Role |
|-----|------|
| `apps/client-web` | Player-facing product UI |
| `apps/admin-web` | Back-office |
| `apps/api` | NestJS modular monolith |

## Shared packages

| Package | Role |
|---------|------|
| `@vpower777/types` | Shared contracts |
| `@vpower777/config` | Centralized non-secret config (locales, brand, ports, flags) |
| `@vpower777/ui` | Shared UI primitives / design tokens |
| `@vpower777/typescript-config` | TSConfig presets |
| `@vpower777/eslint-config` | ESLint presets |

## Game integration (planned)

```
Frontend → NestJS API → Game Integration Module → GameProvider → ClientGameProvider | MockClientGameProvider
```

Until Phase 7: `GAME_PROVIDER_MODE=mock`.

## Brand / UI

Dark cinema + amber/gold (`#D4A017`). Client UX inspired by premium casino layouts (hero, game grids) — not a generic SaaS dashboard.

## Phases

See `docs/development-guide.md`.
