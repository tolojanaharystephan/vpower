#!/bin/sh
set -eu

CERT_DIR="${CERT_DIR:-/etc/nginx/certs}"
DOMAIN="${SSL_DOMAIN:-staging.vpower777.fun}"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
  echo "[nginx] generating self-signed TLS cert for ${DOMAIN}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=${DOMAIN}"
fi
