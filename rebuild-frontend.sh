#!/bin/bash

set -e

echo "=== Быстрая пересборка фронтенда ==="

cd admin-frontend

echo "1. Очистка..."
rm -rf node_modules package-lock.json
npm cache clean --force

echo "2. Установка зависимостей..."
npm install
npm install @tiptap/extension-code-block @tiptap/extension-image @tiptap/extension-link @tiptap/extension-underline --save

echo "3. Пересборка контейнера..."
docker compose stop admin-frontend
docker compose build --no-cache admin-frontend
docker compose up -d admin-frontend

echo "4. Логи..."
docker compose logs -f admin-frontend
