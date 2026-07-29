# VPower777

Plateforme web de jeux — monorepo modulaire (Modular Monolith NestJS + Next.js).

## Stack

- **Client Web** — Next.js (App Router)
- **Admin Web** — Next.js (App Router)
- **API** — NestJS (modular monolith)
- **DB** — PostgreSQL + Drizzle ORM
- **Cache / Queues** — Redis + BullMQ
- **Monorepo** — pnpm workspaces + Turborepo

## Prérequis

- Node.js >= 22
- pnpm 9.15.9 (`corepack enable`)
- Docker Desktop (PostgreSQL + Redis) — Phase 1
- Ou PostgreSQL / Redis installés en local pour demo

## Démarrage

```bash
pnpm install
pnpm typecheck
```

## Apps

| App | Package | Port (prévu) |
|-----|---------|--------------|
| Client | `@vpower777/client-web` | 3000 |
| Admin | `@vpower777/admin-web` | 3001 |
| API | `@vpower777/api` | 4000 |

## Phase actuelle

**Phase 6 — Catalogue jeux** ✅ terminée (API + seed + CRUD admin + sync client).

Prochaine étape recommandée : **Phase 7** (game provider adapter).

```bash
pnpm --filter @vpower777/api dev
pnpm --filter @vpower777/client-web dev
pnpm --filter @vpower777/admin-web dev
# Client http://localhost:3000/fr
# Admin  http://localhost:3001/fr/login
# Catalogue public GET http://localhost:4000/api/v1/catalog/games
```
