#!/usr/bin/env bash
# Удаляет ВСЕ тикеты, сообщения и вложения из системы:
#   - TRUNCATE таблиц Ticket / Message / Attachment в postgres (с CASCADE и сбросом auto-increment)
#   - очистка содержимого MinIO bucket'а с файлами вложений
#
# Запускать рядом с docker-compose.yml. Все credentials берутся из env работающих контейнеров.
#
# Использование:
#   ./scripts/cleanup-tickets.sh         # с подтверждением
#   ./scripts/cleanup-tickets.sh --yes   # без подтверждения

set -euo pipefail

CONFIRM="${1:-}"

if [ "$CONFIRM" != "--yes" ] && [ "$CONFIRM" != "-y" ]; then
  echo "⚠  Сейчас будут БЕЗВОЗВРАТНО удалены ВСЕ тикеты, сообщения и вложения."
  echo "   Postgres: TRUNCATE Attachment, Message, Ticket (RESTART IDENTITY CASCADE)"
  echo "   MinIO:    rm -r всё содержимое bucket'а"
  echo
  read -r -p "Продолжить? введи 'yes' для подтверждения: " ans
  if [ "$ans" != "yes" ]; then
    echo "Отменено."
    exit 1
  fi
fi

echo "→ Postgres: TRUNCATE…"
docker compose exec -T postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TRUNCATE \"Attachment\", \"Message\", \"Ticket\" RESTART IDENTITY CASCADE;"'

echo "→ MinIO: чищу bucket…"
BUCKET=$(docker compose exec -T support-api printenv MINIO_BUCKET | tr -d '\r')
if [ -z "$BUCKET" ]; then
  echo "✗ Не удалось прочитать MINIO_BUCKET из контейнера support-api" >&2
  exit 1
fi

docker compose exec -T -e BUCKET="$BUCKET" minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  mc rm --recursive --force "local/$BUCKET" >/dev/null &&
  mc mb --ignore-existing "local/$BUCKET" >/dev/null
'

echo "✓ Готово. БД и bucket очищены."
