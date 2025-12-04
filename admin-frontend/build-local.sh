#!/bin/bash
# build-local.sh в папке admin-frontend

# 1. Удаляем старые зависимости
rm -rf node_modules package-lock.json

# 2. Устанавливаем локально
npm install

# 3. Проверяем таблицы
if [ ! -d "node_modules/@tiptap/extension-table" ]; then
  echo "Installing table extensions..."
  npm install @tiptap/extension-table@2.1.13 @tiptap/extension-table-row@2.1.13 @tiptap/extension-table-header@2.1.13 @tiptap/extension-table-cell@2.1.13
fi

# 4. Собираем
npm run build
