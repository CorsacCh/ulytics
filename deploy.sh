#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVER="${SERVER:-vm166@146.83.216.166}"
REMOTE_DIR="${REMOTE_DIR:-grupo4}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-grupo4_ulytics}"
COMPOSE_FILE="docker-compose.yml"

echo "==> Directorio local confirmado: $(pwd)"
echo "==> Estado del repositorio antes del despliegue:"
git status --short --branch

if [[ -n "$(git status --porcelain)" ]]; then
  echo "!! El repositorio tiene cambios sin confirmar. Revisa y confirma el commit antes de desplegar."
  exit 1
fi

echo "==> Servidor: $SERVER"
echo "==> Directorio remoto: ~/$REMOTE_DIR"
echo "==> Proyecto Compose: $COMPOSE_PROJECT"

ssh "$SERVER" "mkdir -p '$REMOTE_DIR/database' '$REMOTE_DIR/backend' '$REMOTE_DIR/frontend' && cd '$REMOTE_DIR' && pwd"

echo "==> Verificando los tres archivos de entorno privados..."
missing_env=0
for env_file in database/.env backend/.env frontend/.env; do
  if ! ssh "$SERVER" "test -f '$REMOTE_DIR/$env_file'"; then
    echo "!! Falta ~/$REMOTE_DIR/$env_file"
    missing_env=1
  fi
done

if [[ "$missing_env" -ne 0 ]]; then
  echo ""
  echo "Crea y edita los archivos faltantes directamente en el servidor."
  echo "Usa .env.server.example solo como guía y no copies secretos a Git."
  exit 1
fi

echo "==> Copiando exclusivamente el Compose del grupo 4..."
scp docker-compose.server.yml "$SERVER:$REMOTE_DIR/$COMPOSE_FILE"

echo "==> Descargando las imágenes del grupo 4..."
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose -p '$COMPOSE_PROJECT' -f '$COMPOSE_FILE' pull"

echo "==> Actualizando los servicios sin eliminar volúmenes..."
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose -p '$COMPOSE_PROJECT' -f '$COMPOSE_FILE' up -d"

echo "==> Aplicando migraciones y datos iniciales pendientes..."
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose -p '$COMPOSE_PROJECT' -f '$COMPOSE_FILE' exec -T grupo4_backend npm run db:migrate"
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose -p '$COMPOSE_PROJECT' -f '$COMPOSE_FILE' exec -T grupo4_backend npm run db:seed"

echo "==> Estado de los servicios del grupo 4:"
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose -p '$COMPOSE_PROJECT' -f '$COMPOSE_FILE' ps"

echo "==> Despliegue finalizado: http://grupo4.146.83.216.166.nip.io"
