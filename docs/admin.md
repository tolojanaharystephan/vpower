# Admin Web

Back-office Next.js (`apps/admin-web`) on port **3001**.

## Features (Phase 5)

- Login staff (JWT) with gate on permission `admin:access`
- Sidebar shell: Dashboard, Utilisateurs, Jeux, Contenu, Support
- Dashboard overview via `GET /api/v1/admin/overview`
- Placeholder pages for later phases
- i18n FR/EN via `next-intl` (`/fr/...`, `/en/...`)

## Local run

```bash
# API with seed admin (see .env)
pnpm --filter @vpower777/api dev

pnpm --filter @vpower777/admin-web dev
# http://localhost:3001 → redirect /fr
# http://localhost:3001/fr/login
```

i18n: `fr` / `en` with `localePrefix: 'always'` (middleware in `src/middleware.ts`, same pattern as next-intl + `src/app`).

Default seed (when set in `.env`):

- Email: `admin@vpower777.local`
- Password: `ChangeMeAdmin123!`
- Role: `SUPER_ADMIN`

Leave `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` empty to disable auto-seed.
