#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> VPower777 deploy ($(date -u +%Y-%m-%dT%H:%M:%SZ))"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.example to .env and fill secrets before deploy."
  exit 1
fi

mkdir -p nginx/certs

echo "==> git pull"
git pull --ff-only

echo "==> docker compose build"
docker compose build

echo "==> docker compose up -d"
docker compose up -d

echo "==> status"
docker compose ps

echo "==> deploy done"
