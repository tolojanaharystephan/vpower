# Admin Web

Back-office Next.js (`apps/admin-web`) on port **3001**.

## Features

### Phase 5
- Login staff (JWT) with gate on permission `admin:access`
- Sidebar shell: Dashboard, Utilisateurs, Jeux, Contenu, Support
- Dashboard overview via `GET /api/v1/admin/overview`
- i18n FR/EN via `next-intl` (`/fr/...`, `/en/...`)

### Phase 6
- Games CRUD UI (`/fr/games`) — list, create, edit, soft delete
- Uses `games:write` for mutations; reads providers/categories for selects

## Local run

```bash
# API with seed admin + catalog seed
pnpm --filter @vpower777/api dev

pnpm --filter @vpower777/admin-web dev
# http://localhost:3001 → redirect /fr
# http://localhost:3001/fr/login
# http://localhost:3001/fr/games
```

i18n: `fr` / `en` with `localePrefix: 'always'` (middleware in `src/middleware.ts`).

Default seed (when set in `.env`):

- Email: `admin@vpower777.local`
- Password: `ChangeMeAdmin123!`
- Role: `SUPER_ADMIN`

Leave `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` empty to disable auto-seed.
Catalog games seed runs automatically when the `games` table is empty.
