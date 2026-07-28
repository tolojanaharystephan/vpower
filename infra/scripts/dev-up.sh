#!/usr/bin/env bash
# Start local infra (PostgreSQL + Redis) via Docker Compose.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
docker compose up -d
docker compose ps
echo "Postgres: localhost:5432 | Redis: localhost:6379"
