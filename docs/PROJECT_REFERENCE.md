# PROJECT REFERENCE — VPower777

> Fichier de reference genere le 2026-07-28.
> Ce document resume l'etat complet du projet, l'architecture, les conventions,
> les modules existants, les modules prevus, et les regles de developpement.

---

## 1. STACK TECHNIQUE

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | >= 22 (actuel: 24.14.0) |
| Package manager | pnpm | 9.15.9 (workspaces) |
| Monorepo | Turborepo | ^2.5.4 |
| Frontend client | Next.js (App Router) + React 19 | ^15.3.3 / ^19.1.0 |
| Frontend admin | Next.js (App Router) + React 19 | ^15.3.3 / ^19.1.0 |
| Backend | NestJS | ^11.1.3 |
| Base de donnees | PostgreSQL 16 | postgres:16-alpine |
| ORM | Drizzle ORM | ^0.44.2 |
| Cache / Queues | Redis 7 + BullMQ (prevu) | redis:7-alpine |
| Auth | JWT + Passport + Argon2id | @nestjs/jwt ^11, @node-rs/argon2 ^2 |
| Validation | Zod (env) + class-validator (DTOs) | ^3.25.67 |
| CSS | Tailwind CSS v4 (CSS-first) | ^4.1.11 |
| UI | shadcn/ui pattern (CVA) + Lucide | ^0.525.0 |
| i18n | next-intl v4 (fr, en) | ^4.3.4 |
| Forms | React Hook Form + Zod resolver | ^7.60.0 |
| Data fetching | TanStack Query v5 | ^5.81.5 |
| Linting | ESLint 9 (flat config) | ^9.28.0 |
| Formatting | Prettier | ^3.5.3 |

---

## 2. ARBORESCENCE DU MONOREPO

```
vpower777/
├── apps/
│   ├── api/                          # NestJS modular monolith (port 4000)
│   ├── client-web/                   # Next.js client public (port 3000)
│   └── admin-web/                    # Next.js back-office (port 3001)
├── packages/
│   ├── types/                        # Types partages (Role, Locale, FeatureFlags, etc.)
│   ├── config/                       # Config partagee (brand, ports, locales, flags)
│   ├── ui/                           # Composants UI partages (BrandMark)
│   ├── eslint-config/                # Presets ESLint (base, next, nestjs)
│   └── typescript-config/            # Presets TSConfig (base, nextjs, nestjs, react-library)
├── infra/
│   ├── docker/                       # Placeholders Dockerfiles (Phase 17)
│   ├── nginx/                        # Placeholders nginx (Phase 17/20)
│   └── scripts/                      # Scripts utilitaires (infra-up, dev-up, dev-down)
├── docs/                             # Documentation projet
├── .env                              # Variables d'environnement (non commuque)
├── .env.example                      # Template de variables
├── docker-compose.yml                # PostgreSQL + Redis
├── pnpm-workspace.yaml               # Declaration des workspaces
├── turbo.json                        # Configuration Turborepo
├── package.json                      # Scripts racine
└── .prettierrc                       # Config Prettier
```

---

## 3. ETAT D'AVANCEMENT PAR PHASE

### PHASES TERMINEES

| Phase | Description | Statut |
|-------|-------------|--------|
| **Phase 0** | Architecture et monorepo | **TERMINEE** |
| **Phase 1** | Docker, PostgreSQL, Redis, Drizzle | **TERMINEE** |
| **Phase 2** | NestJS Core + configuration + securite | **TERMINEE** |
| **Phase 3** | Authentification + utilisateurs + RBAC | **TERMINEE** |
| **Phase 4** | Client Web Next.js | **TERMINEE** |
| **Phase 5** | Admin Web Next.js | **TERMINEE** |
| **Phase 6** | Catalogue jeux | **TERMINEE** |

### PHASES A VENIR

| Phase | Description | Statut |
|-------|-------------|--------|
| **Phase 7** | Game Provider Adapter + API reelle | **A FAIRE** (prochaine) |
| **Phase 8** | Customer Portal | **A FAIRE** |
| **Phase 9** | Support Center | **A FAIRE** |
| **Phase 10** | Tickets + conversations + messagerie | **A FAIRE** |
| **Phase 11** | Translation Service | **A FAIRE** |
| **Phase 12** | Notifications | **A FAIRE** |
| **Phase 13** | Admin Support Management | **A FAIRE** |
| **Phase 14** | Preparation Payment Architecture | **A FAIRE** |
| **Phase 15** | Preparation Live Games Architecture | **A FAIRE** |
| **Phase 16** | Tests complets | **A FAIRE** |
| **Phase 17** | Dockerisation complete | **A FAIRE** |
| **Phase 18** | CI/CD | **A FAIRE** |
| **Phase 19** | Documentation | **A FAIRE** |
| **Phase 20** | Preparation deploiement AWS | **A FAIRE** |

---

## 4. API NESTJS — ETAT DETAILLE

### 4.1 Modules existants

| Module | Fichier | Description |
|--------|---------|-------------|
| `AppModule` | `app.module.ts` | Module racine, importe tous les modules |
| `AppConfigModule` (Global) | `config/app-config.module.ts` | ConfigModule + Zod validation env |
| `CommonModule` (Global) | `common/common.module.ts` | Throttler, Guards globaux, Filtre, Interceptor |
| `DatabaseModule` (Global) | `database/database.module.ts` | Connection PostgreSQL + Drizzle |
| `RedisModule` (Global) | `redis/redis.module.ts` | Connection Redis (ioredis) |
| `RbacModule` | `modules/rbac/rbac.module.ts` | Seed roles + permissions au demarrage |
| `UsersModule` | `modules/users/users.module.ts` | CRUD utilisateurs |
| `AuthModule` | `modules/auth/auth.module.ts` | JWT auth, login, register, refresh, etc. |
| `AdminModule` | `modules/admin/admin.module.ts` | Admin overview + seed admin |
| `GamesModule` | `modules/games/games.module.ts` | Games, categories, providers CRUD |
| `HealthModule` | `modules/health/health.module.ts` | Health, liveness, readiness checks |
| `MetaModule` | `modules/meta/meta.module.ts` | Root info, favicon |

### 4.2 Endpoints API

| Methode | Route | Auth | Rate Limit | Description |
|---------|-------|------|------------|-------------|
| GET | `/` | Public | - | Info root |
| GET | `/favicon.ico` | Public | - | No-op 204 |
| GET | `/health` | Public | SkipThrottle | Health check complet |
| GET | `/health/live` | Public | SkipThrottle | Liveness |
| GET | `/health/ready` | Public | SkipThrottle | Readiness |
| POST | `/api/v1/auth/register` | Public | 10/min | Inscription |
| POST | `/api/v1/auth/login` | Public | 20/min | Connexion |
| POST | `/api/v1/auth/refresh` | Public | default | Rotation refresh token |
| POST | `/api/v1/auth/logout` | Public | default | Revocation refresh token |
| POST | `/api/v1/auth/forgot-password` | Public | 5/min | Demande reinitialisation MDP |
| POST | `/api/v1/auth/reset-password` | Public | default | Reset MDP avec token |
| POST | `/api/v1/auth/verify-email` | Public | default | Verification email |
| GET | `/api/v1/users/me` | JWT | default | Profil utilisateur courant |
| GET | `/api/v1/admin/overview` | JWT + `admin:access` | default | Dashboard admin |
| GET | `/api/v1/games` | JWT | default | Liste jeux (filtres, pagination) |
| GET | `/api/v1/games/:id` | JWT | default | Detail jeu par ID |
| POST | `/api/v1/games` | JWT + `games:write` | default | Creer un jeu |
| PUT | `/api/v1/games/:id` | JWT + `games:write` | default | Modifier un jeu |
| DELETE | `/api/v1/games/:id` | JWT + `games:write` | default | Supprimer un jeu (soft) |
| GET | `/api/v1/game-categories` | JWT | default | Liste categories |
| GET | `/api/v1/game-categories/:id` | JWT | default | Detail categorie |
| POST | `/api/v1/game-categories` | JWT + `games:write` | default | Creer une categorie |
| PUT | `/api/v1/game-categories/:id` | JWT + `games:write` | default | Modifier une categorie |
| DELETE | `/api/v1/game-categories/:id` | JWT + `games:write` | default | Supprimer une categorie (soft) |
| GET | `/api/v1/game-providers` | JWT | default | Liste providers |
| GET | `/api/v1/game-providers/:id` | JWT | default | Detail provider |
| POST | `/api/v1/game-providers` | JWT + `games:write` | default | Creer un provider |
| PUT | `/api/v1/game-providers/:id` | JWT + `games:write` | default | Modifier un provider |
| DELETE | `/api/v1/game-providers/:id` | JWT + `games:write` | default | Supprimer un provider |

### 4.3 Guards globaux (dans l'ordre)

1. `ThrottlerGuard` — Rate limiting (120 req/min defaut)
2. `JwtAuthGuard` — Validation JWT, ignore si `@Public()`
3. `RolesGuard` — Verification `@Roles()` vs `user.roles`
4. `PermissionsGuard` — Verification `@RequirePermissions()` vs `user.permissions`

### 4.4 Decorateurs custom

| Decorateur | Fichier | Usage |
|------------|---------|-------|
| `@Public()` | `common/decorators/public.decorator.ts` | Bypass JWT auth |
| `@Roles(...roles)` | `common/decorators/roles.decorator.ts` | Restriction par role |
| `@RequirePermissions(...perms)` | `common/decorators/permissions.decorator.ts` | Restriction par permission |
| `@CurrentUser()` | `common/decorators/current-user.decorator.ts` | Recuperer l'utilisateur courant |

### 4.5 Filtres, Interceptors, Middleware

| Element | Fichier | Portee |
|---------|---------|--------|
| `GlobalExceptionFilter` | `common/filters/global-exception.filter.ts` | Global |
| `RequestLoggingInterceptor` | `common/interceptors/request-logging.interceptor.ts` | Global |
| Correlation ID (inline) | `main.ts` (app.use) | Global |
| `CorrelationIdMiddleware` | `common/middleware/correlation-id.middleware.ts` | **INUTILISE** (code mort) |

---

## 5. BASE DE DONNEES — TABLES

### 5.1 Tables existantes (15 tables)

| Table | Description | Cles etrangeres |
|-------|-------------|-----------------|
| `system_meta` | Cle-valeur systeme | - |
| `feature_flags` | Feature flags | - |
| `users` | Utilisateurs | - |
| `roles` | Roles RBAC | - |
| `permissions` | Permissions RBAC | - |
| `role_permissions` | Jointure role-permission | `role_id` -> `roles`, `permission_id` -> `permissions` |
| `user_roles` | Jointure user-role | `user_id` -> `users`, `role_id` -> `roles` |
| `refresh_tokens` | Tokens de rafraichissement | `user_id` -> `users` |
| `password_reset_tokens` | Tokens reinitialisation MDP | `user_id` -> `users` |
| `email_verification_tokens` | Tokens verification email | `user_id` -> `users` |
| `game_providers` | Fournisseurs de jeux | - |
| `game_categories` | Categories de jeux | - |
| `games` | Jeux | `provider_id` -> `game_providers`, `category_id` -> `game_categories` |
| `user_favorites` | Jeux favoris | `user_id` -> `users`, `game_id` -> `games` |
| `user_game_history` | Historique consultation | `user_id` -> `users`, `game_id` -> `games` |

### 5.2 Tables prevues (pas encore creees)

**LOT 2 — Support:**
- `support_tickets` — Tickets support
- `support_messages` — Messages support
- `support_attachments` — Pieces jointes
- `support_agents` — Agents support
- `knowledge_base_articles` — Base de connaissances
- `faqs` — FAQ
- `notifications` — Notifications in-app
- `audit_logs` — Logs d'audit

**LOT 2 — Payment Ready:**
- `wallets` — Portefeuilles
- `transactions` — Transactions
- `payment_providers` — Fournisseurs paiement
- `payment_webhooks` — Webhooks paiement

**LOT 3 — Live Games Ready:**
- `live_games` — Jeux en direct
- `live_game_providers` — Fournisseurs live

### 5.3 Conventions de schema

- Toutes les tables ont `created_at` et `updated_at` (timestamptz)
- Les tables pertinentes ont `deleted_at` (soft delete)
- PK: uuid (gen_random_uuid())
- FK: ON DELETE CASCADE
- Index uniques sur les colonnes d'unicite
- Drizzle ORM avec postgres.js driver
- Migrations dans `apps/api/drizzle/`

---

## 6. RBAC — ROLES ET PERMISSIONS

### 6.1 Roles (5)

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Toutes les permissions |
| `ADMIN` | Toutes les permissions (identique a SUPER_ADMIN) |
| `SUPPORT_AGENT` | `support:read`, `support:write`, `users:read` |
| `CONTENT_MANAGER` | `content:read`, `content:write`, `games:read` |
| `CUSTOMER` | Aucune |

### 6.2 Permissions (10)

| Code | Domaine |
|------|---------|
| `users:read` | Utilisateurs |
| `users:write` | Utilisateurs |
| `games:read` | Jeux |
| `games:write` | Jeux |
| `content:read` | Contenu |
| `content:write` | Contenu |
| `support:read` | Support |
| `support:write` | Support |
| `admin:access` | Acces admin |
| `audit:read` | Audit logs |

### 6.3 Seed automatique

Le `RbacSeedService` seed les roles et permissions au `OnModuleInit` du `RbacModule`.

---

## 7. CLIENT WEB — ETAT

### 7.1 Pages

| Route | Statut | Description |
|-------|--------|-------------|
| `/[locale]` | **Implementee** | Landing page (hero, carrousel, rails, promos) |
| `/[locale]/games` | **Implementee** | Catalogue jeux (API, filtres, pagination) |
| `/[locale]/promotions` | **Implementee** | Page promotions |
| `/[locale]/faq` | **Implementee** | FAQ (2 items) |
| `/[locale]/help` | **Stub** | Titre + sous-titre uniquement |
| `/[locale]/login` | **Placeholder** | Spinner, vrai UX = modal |
| `/[locale]/register` | **Placeholder** | Spinner, vrai UX = modal |

### 7.2 Composants

| Composant | Type | Description |
|-----------|------|-------------|
| `SiteHeader` | Client | Header responsive, nav, locale switch, auth buttons |
| `SiteFooter` | Server | Footer colonnes, social, legal |
| `HeroSection` | Server | Hero avec gradient anime |
| `HeroCtas` | Client | Boutons CTA hero |
| `FavoritesCarousel` | Client | Carrousel auto-play jeux favoris |
| `GameRail` | Server | Grille horizontale jeux |
| `PromoStrip` | Server | Bandeau promos |
| `GameTile` | Server | Carte jeu avec effets hover |
| `AuthUiProvider` + `useAuthUi` | Client | Context modal auth |
| `AuthModal` | Client | Modal overlay auth |
| `AuthDeepLink` | Client | Handler deep-link auth |
| `LoginForm` | Client | Formulaire connexion |
| `RegisterForm` | Client | Formulaire inscription |
| `BrandMark` | Client | Logo SVG |
| `Button` | Server | Bouton CVA |
| `Input` | Server | Input style |
| `Providers` | Client | QueryClient + AuthUi providers |

### 7.3 i18n

- Locales: `fr` (defaut), `en`
- Fichiers: `src/messages/fr.json`, `src/messages/en.json` (90 cles chacun)
- Middleware de redirection de locale
- Toggle locale dans le header

### 7.4 Theme

- Dark cinema + accent gold/amber (#D4A017)
- Fonts: Syne (display) + Outfit (body)
- Config Tailwind v4 CSS-first dans `globals.css`

---

## 8. ADMIN WEB — ETAT

### 8.1 Pages

| Route | Statut | Description |
|-------|--------|-------------|
| `/login` | **Implementee** | Formulaire connexion admin |
| `/` | **Implementee** | Dashboard avec stats API |
| `/users` | **Coming Soon** | Gestion utilisateurs |
| `/games` | **Implementee** | CRUD jeux (liste, creation, edition, suppression) |
| `/content` | **Coming Soon** | Contenu CMS |
| `/support` | **Coming Soon** | Tickets support |

### 8.2 Composants

| Composant | Type | Description |
|-----------|------|-------------|
| `AdminAuthProvider` + `useAdminAuth` | Client | Context auth admin |
| `RequireAdmin` | Client | Garde de route (redirect si non auth) |
| `AdminLoginForm` | Client | Formulaire login |
| `AdminSidebar` | Client | Sidebar navigation |
| `AdminTopbar` | Client | Barre superieure |
| `DashboardOverview` | Client | Stats + roadmap |
| `AdminMark` | Server | Logo admin |
| `Button` | Server | Bouton CVA |
| `Input` | Server | Input style |
| `Providers` | Client | QueryClient + Auth providers |

---

## 9. PACKAGES PARTAGES

### `@vpower777/types`

Exports: `Locale`, `FeatureFlags`, `ApiErrorBody`, `PaginatedResponse<T>`, `HealthStatus`, `GameProviderMode`, `ROLES`, `Role`, `AuthUser`, `AuthResponse`, `MeResponse`, `ApiError`, `GameStatus`, `GameProvider`, `GameCategory`, `Game`, `GameWithRelations`, `PaginatedGamesResponse`, `UserFavorite`

### `@vpower777/config`

Exports: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `APP_PORTS`, `BRAND`, `DEFAULT_FEATURE_FLAGS`, `API_PREFIX`

### `@vpower777/ui`

Exports: `BrandMark`, `globals.css` (CSS custom properties)

### `@vpower777/eslint-config`

Exports: `./base` (recommande + prettier), `./next` (+ unused-vars warn), `./nestjs` (+ unused-vars warn + no-explicit-any warn)

### `@vpower777/typescript-config`

Fichiers: `base.json`, `nextjs.json`, `nestjs.json`, `react-library.json`

---

## 10. VARIABLES D'ENVIRONNEMENT

### 10.1 Requises

| Variable | Valeur defaut | Validation |
|----------|---------------|------------|
| `DATABASE_URL` | - | **Obligatoire** |
| `REDIS_URL` | - | **Obligatoire** |
| `JWT_SECRET` | - | Min 32 chars, **obligatoire** |
| `JWT_REFRESH_SECRET` | - | Min 32 chars, **obligatoire** |

### 10.2 Optionnelles

| Variable | Valeur defaut | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `development` | Environnement |
| `APP_NAME` | `vpower777` | Nom application |
| `APP_URL` | `http://localhost:3000` | URL client |
| `ADMIN_URL` | `http://localhost:3001` | URL admin |
| `API_URL` | `http://localhost:4000` | URL API |
| `API_PORT` | `4000` | Port API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL API (cote client) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Duree access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Duree refresh token |
| `GAME_API_BASE_URL` | `https://games-api.example.com` | URL API jeux externe |
| `GAME_API_KEY` | `''` | Cle API jeux |
| `GAME_API_SECRET` | `''` | Secret API jeux |
| `GAME_API_TIMEOUT` | `10000` | Timeout API jeux (ms) |
| `GAME_PROVIDER_MODE` | `mock` | Mode provider (`mock` ou `client`) |
| `GOOGLE_TRANSLATION_API_KEY` | `''` | Cle Google Translation |
| `TRANSLATION_ENABLED` | `false` | Activer traduction |
| `PAYMENTS_ENABLED` | `false` | Activer paiements |
| `LIVE_GAMES_ENABLED` | `false` | Activer live games |
| `SENTRY_DSN` | `''` | DSN Sentry |
| `LOG_LEVEL` | `info` | Niveau de log |
| `SEED_ADMIN_EMAIL` | `''` | Email admin bootstrap |
| `SEED_ADMIN_PASSWORD` | `''` | MDP admin bootstrap |
| `SEED_ADMIN_ROLE` | `SUPER_ADMIN` | Role admin bootstrap |

### 10.3 Regles

- **JAMAIS** commiter `.env` (seul `.env.example` est commuque)
- **JAMAIS** exposer `NEXT_PUBLIC_*` aux secrets serveur
- **JAMAIS** exposer les cles API jeux au frontend
- Validation Zod au demarrage de l'API (fail-fast)

---

## 11. CONVENTIONS DE CODE

### 11.1 TypeScript

- Strict mode active partout
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- Target: ES2022
- Module: NodeNext (base), Node16 (NestJS), ESNext + Bundler (Next.js)

### 11.2 Prettier

- Semi: yes
- Single quotes: yes
- Trailing commas: all
- Print width: 100
- Tab width: 2

### 11.3 ESLint

- ESLint 9 flat config
- Presets partages dans `packages/eslint-config/`
- Unused vars: warn (ignore prefix `_`)
- No-explicit-any: warn (NestJS uniquement)

### 11.4 NestJS

- Modular monolith
- Chaque domaine = un module dans `modules/`
- DTOs avec class-validator
- Guards globaux pour auth, roles, permissions
- Exception filter global avec format standardise
- Swagger/OpenAPI a `/docs`
- Preffixe API: `/api/v1`

### 11.5 Next.js

- App Router
- Server Components par defaut
- Client Components uniquement pour l'interactivite
- `src/` directory
- Path alias: `@/*` -> `./src/*`
- i18n via next-intl avec route prefix (`/fr/...`, `/en/...`)

### 11.6 Database

- Drizzle ORM avec postgres.js
- Migrations dans `apps/api/drizzle/`
- Schema dans `apps/api/src/database/schema/`
- UUID PKs (gen_random_uuid)
- Toutes les tables: `created_at`, `updated_at`
- Soft delete: `deleted_at` quand pertinent
- **JAMAIS** modifier manuellement la base de production

---

## 12. ARCHITECTURE MODULAIRE — MODULES PREVUS

### 12.1 Modules candidats a l'extraction microservices

- `Payment Service` (LOT 2)
- `Game Integration Service`
- `Live Game Service` (LOT 3)
- `Notification Service`
- `Analytics Service`

### 12.2 Modules a creer

| Module | Phase | Statut |
|--------|-------|--------|
| `games` | 6 | **Cree** (games, categories, providers dans GamesModule) |
| `game-categories` | 6 | **Cree** (dans GamesModule) |
| `game-providers` | 6 | **Cree** (dans GamesModule) |
| `customer-portal` | 8 | A creer |
| `support` | 9 | A creer |
| `tickets` | 10 | A creer |
| `conversations` | 10 | A creer |
| `content` | 10 | A creer |
| `translation` | 11 | A creer |
| `notifications` | 12 | A creer |
| `audit` | 13 | A creer |
| `wallet` | 14 | A creer (LOT 2, desactive) |
| `payments` | 14 | A creer (LOT 2, desactive) |
| `transactions` | 14 | A creer (LOT 2, desactive) |
| `live-games` | 15 | A creer (LOT 3, desactive) |

### 12.3 Pattern Game Provider

```
Frontend -> NestJS API -> Game Integration Module -> GameProvider -> Client Game API
                                    |
                            GameProvider (interface)
                                ├── ClientGameProvider (reel)
                                ├── MockGameProvider (dev)
                                └── FutureProviderA/B
```

### 12.4 Pattern Payment Provider (LOT 2)

```
PaymentProvider (interface)
    ├── ProviderAdapterA
    ├── ProviderAdapterB
    ├── ProviderAdapterC
    └── ProviderAdapterD
```

---

## 13. CONVENTIONS DE SECURITE

- HTTPS-ready (Helmet actif)
- JWT access tokens (15min) + refresh tokens (7d, rotation)
- RBAC enforce cote backend (jamais frontend)
- Rate limiting global (120 req/min) + endpoints sensibles plus restrictifs
- CORS strict (APP_URL, ADMIN_URL)
- Validation entrees (Zod + class-validator)
- Password hashing: Argon2id
- Correlation ID sur chaque requete
- Exception filter: pas de stack traces exposees aux clients
- **JAMAIS** stocker des secrets dans Git
- **JAMAIS** exposer les cles API au frontend
- **JAMAIS** stocker les MDP en clair
- **JAMAIS** faire confiance aux permissions du frontend

---

## 14. COMMANDES UTILES

```bash
# Installation
pnpm install

# Infrastructure
pnpm infra:up              # Auto-detect Docker ou natif
pnpm infra:up:docker       # Docker Compose uniquement
pnpm infra:up:native       # PostgreSQL/Redis natifs Windows
pnpm infra:down            # Arreter Docker Compose
pnpm infra:ps              # Etat Docker Compose

# Database
pnpm db:generate           # Generer les migrations Drizzle
pnpm db:migrate            # Appliquer les migrations
pnpm db:push               # Push schema directement
pnpm db:studio             # Drizzle Studio (GUI)

# Development
pnpm dev                   # Toutes les apps en parallele
pnpm dev:api               # API NestJS uniquement
pnpm dev:client            # Client Web uniquement
pnpm dev:admin             # Admin Web uniquement

# Verification
pnpm typecheck             # Type checking toutes les apps
pnpm lint                  # Lint toutes les apps
pnpm test                  # Tests toutes les apps
pnpm format                # Formater avec Prettier
pnpm format:check          # Verifier le formatage
pnpm build                 # Build toutes les apps
```

### URLs de development

| App | URL |
|-----|-----|
| Client Web | http://localhost:3000/fr |
| Admin Web | http://localhost:3001/login |
| API Swagger | http://localhost:4000/docs |
| Health Check | http://localhost:4000/health |

### Seed admin

```
Email: admin@vpower777.local
Password: ChangeMeAdmin123!
Role: SUPER_ADMIN
```

---

## 15. PROBLEMES ET GAPS CONNUS

### Corriges (Phase 5 refactorisation)
1. ~~`CorrelationIdMiddleware` — code mort~~ → Supprime, type `RequestWithIds` deplace dans `common/types.ts`
2. ~~`JWT_REFRESH_SECRET` — inutilise~~ → Supprime du schema Zod
3. ~~`users/me` retourne `null`~~ → Maintenant `NotFoundException`
4. ~~Token logging en clair~~ → Supprime de `auth.service.ts`
5. ~~Pas de try/catch dans les seed services~~ → Corrige
6. ~~CORS inclut l'URL de l'API~~ → Corrige
7. ~~Credentials DB hardcodes en fallback~~ → Remplaces par un throw
8. ~~`console.log` au lieu de Logger~~ → Remplace par NestJS Logger
9. ~~Imports dupliques dans auth.service.ts~~ → Fusionnes
10. ~~`ConfigModule` importe inutilement~~ → Retire de AuthModule
11. ~~Pas de pages d'erreur admin~~ → Ajoutes (loading, error, not-found)
12. ~~Pas de refresh token admin~~ → Ajoute via `fetchWithAuth()`
13. ~~Types API dupliques~~ → Extraits dans `@vpower777/types`
14. ~~Variables CSS incoherentes~~ → Alignees avec client-web
15. ~~Index DB manquants~~ → Migration 0002 ajoutee

### Manques fonctionnels
- Pas d'envoi d'email (Phase 12 prevue)
- `SUPER_ADMIN` et `ADMIN` ont les memes permissions (pas de distinction)
- Admin-web: FR uniquement (i18n prevue plus tard si besoin)

### Tests
- Aucun fichier `.spec.ts` ou `.test.ts` dans tout le projet
- Jest configure mais jamais utilise

### Redis
- Redis connecte mais jamais utilise (pas de cache, pas de rate limiting Redis, pas de queues)

### Modules manquants
- Tous les modules listes dans la section 12.2 n'existent pas encore

### CI/CD
- Pas de GitHub Actions
- Pas de Dockerfiles
- Pas de nginx config

### Observabilite
- Pas d'OpenTelemetry
- Pas d'integration Sentry (DSN dans env mais jamais utilise)

---

## 16. REGLES DE DEVELOPPEMENT

1. **Phase par phase** — Ne jamais passer a la phase suivante sans stabiliser la courante
2. **Analyser avant coder** — Toujours verifier l'existant avant de creer/modifier
3. **Architecture modulaire** — Chaque domaine = un module isole
4. **Pas de code mort** — Supprimer ou marquer explicitement comme "future use"
5. **Pas d'API inventee** — Utiliser des abstractions/mocks clairement identifies
6. **Tests avant validation** — Lancer typecheck, lint, tests apres chaque phase
7. **Securite d'abord** — Validation, RBAC, pas de secrets exposes
8. **Documentation a jour** — Mettre a jour les docs apres chaque phase
9. **Minimal changes** — Modifications minimales et propres, ne pas ecraser du code fonctionnel
10. **Code production-ready** — Code propre, maintenable, documente

---

## 17. PROCHAINE ETAPE RECOMMANDEE

**Phase 7 — Game Provider Adapter + API reelle**

Actions requises:
1. Creer l'interface `GameProvider` (provider pattern)
2. Implementer `MockGameProvider` pour le dev
3. Implementer `ClientGameProvider` pour l'API reelle
4. Creer le module `GameIntegrationModule`
5. Ajouter les endpoints de sync (pull games from provider)
6. Ajouter les endpoints launch (redirect to game)
7. Tests typecheck + lint
8. Mise a jour documentation
