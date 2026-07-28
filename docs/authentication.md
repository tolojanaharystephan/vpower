# Authentication

## Overview

- Access token: JWT Bearer (short-lived, default `15m`)
- Refresh token: opaque token stored **hashed** in `refresh_tokens` (default `7d`), rotated on refresh
- Passwords: Argon2 (`@node-rs/argon2`)
- RBAC: roles + permissions enforced by Nest guards (never trust the frontend)

## Endpoints (`/api/v1/auth`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/register` | public |
| POST | `/login` | public |
| POST | `/refresh` | public (refresh token body) |
| POST | `/logout` | public (refresh token body) |
| POST | `/forgot-password` | public |
| POST | `/reset-password` | public |
| POST | `/verify-email` | public |
| GET | `/users/me` | Bearer access token |

## Roles

- `SUPER_ADMIN`
- `ADMIN`
- `SUPPORT_AGENT`
- `CONTENT_MANAGER`
- `CUSTOMER` (default on register)

## Guards

Global:

1. ThrottlerGuard
2. JwtAuthGuard (`@Public()` to skip)
3. RolesGuard (`@Roles(...)`)
4. PermissionsGuard (`@RequirePermissions(...)`)

## Dev notes

- Email sending is **logged** until Notification module (Phase 12).
- Check API logs for verification / reset tokens in development.
- Swagger: http://localhost:4000/docs → Authorize with `Bearer <accessToken>`
