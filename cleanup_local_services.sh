#!/bin/bash

set -euo pipefail

PROJECT_DIR="/opt/Sufi/admin-backend"

echo "Останавливаем локальные процессы, слушающие порт 4001 (admin-backend)..."
PIDS=$(lsof -ti tcp:4001 || true)
if [ -n "$PIDS" ]; then
  echo "Найдены процессы: $PIDS. Убиваем..."
  kill $PIDS || kill -9 $PIDS || true
else
  echo "Процессов на порту 4001 не найдено."
fi

echo
echo "Удаляем локальные артефакты в $PROJECT_DIR..."

rm -rf "$PROJECT_DIR/node_modules"
rm -f "$PROJECT_DIR/package-lock.json"
rm -f "$PROJECT_DIR/.env"
rm -rf "$PROJECT_DIR/.cache"  # если есть
rm -rf "$PROJECT_DIR/dist"    # если есть

echo "Проверяем наличие важных файлов и папок (оставляем):"
for item in src package.json Dockerfile docker-compose.yml; do
  if [ -e "$PROJECT_DIR/$item" ]; then
    echo "  Оставляем: $item"
  else
    echo "  Внимание! Отсутствует: $item"
  fi
done

echo
echo "Локальные сервисы очищены от временных файлов и процессов."
echo "Docker-контейнеры и данные не затронуты."
echo "Рекомендуется запускать сервисы только через Docker Compose."
echo "Для запуска: cd /opt/Sufi && docker compose up -d"