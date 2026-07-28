# API

## Base URL

- Versioned API: `/api/v1/*`
- Health (no version prefix): `/health`, `/health/live`, `/health/ready`
- Swagger UI: `/docs`

## Error format

```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Human readable message",
  "correlationId": "uuid",
  "details": []
}
```

## Correlation

Send or receive:

- `x-correlation-id`
- `x-request-id` (always generated server-side)

## Security (Phase 2)

- Helmet
- Strict CORS (`APP_URL`, `ADMIN_URL`, `API_URL`)
- Global ValidationPipe (whitelist + forbid unknown)
- Rate limiting (Throttler — 120 req / 60s default)
- Centralized exception filter (no stack traces to clients)

Auth/RBAC arrives in Phase 3.
