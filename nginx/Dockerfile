# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY default.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /docker-entrypoint.d/40-vpower-certs.sh
RUN chmod +x /docker-entrypoint.d/40-vpower-certs.sh

EXPOSE 80 443
