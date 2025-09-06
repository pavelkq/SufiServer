#!/bin/bash

echo "=== admin-backend/src/routes/userRoutes.js ==="
cat admin-backend/src/routes/userRoutes.js || echo "Файл не найден"

echo
echo "=== admin-backend/src/controllers/userController.js ==="
cat admin-backend/src/controllers/userController.js || echo "Файл не найден"

echo
echo "=== admin-backend/src/models/User.js (функция getUserById) ==="
if [ -f admin-backend/src/models/User.js ]; then
  awk '/async function getUserById/,/^}/' admin-backend/src/models/User.js
else
  echo "Файл не найден"
fi

echo
echo "=== основной файл запуска сервера (например, app.js или server.js) ==="
# Попробуйте оба варианта
if [ -f admin-backend/src/app.js ]; then
  echo "--- admin-backend/src/app.js ---"
  cat admin-backend/src/app.js
elif [ -f admin-backend/src/server.js ]; then
  echo "--- admin-backend/src/server.js ---"
  cat admin-backend/src/server.js
else
  echo "Файл app.js или server.js не найден"
fi
