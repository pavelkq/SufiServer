#!/bin/bash
set -x  # Включаем режим отладки

echo "=== ПРОВЕРЯЕМ ПАКЕТЫ В PACKAGE.JSON ==="
grep -n "tiptap" package.json

echo "=== ВЕРСИЯ NPM ==="
npm --version

echo "=== ВЕРСИЯ NODE ==="
node --version

echo "=== УСТАНАВЛИВАЕМ ЗАВИСИМОСТИ С ПОДРОБНЫМ ЛОГОМ ==="
npm install --legacy-peer-deps --verbose 2>&1 | tee npm-install.log

echo "=== ИЩЕМ TIPTOP В ЛОГАХ ==="
grep -i "tiptap" npm-install.log | head -50

echo "=== ИЩЕМ TABLE В ЛОГАХ ==="  
grep -i "table" npm-install.log | head -50

echo "=== ПРОВЕРЯЕМ ЧТО УСТАНОВИЛОСЬ ==="
find node_modules/@tiptap -type d -name "*table*" 2>/dev/null || echo "ТАБЛИЦ НЕТ!"

echo "=== ЛИСТИМ @tiptap ==="
ls -la node_modules/@tiptap/ || echo "ПАПКИ @tiptap НЕТ"
