#!/bin/sh

# Espera a que PostgreSQL acepte conexiones antes de iniciar la aplicación.
set -eu

host="${DB_HOST:-grupo4_db}"
port="${DB_PORT:-5432}"

echo "Esperando PostgreSQL en $host:$port..."

while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "PostgreSQL disponible, iniciando backend..."
exec "$@"
