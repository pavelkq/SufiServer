#!/bin/bash

set -e

BACKUP_DIR="/opt/Sufi/backup"
DB_USER="user"

show_usage() {
    echo "Использование:"
    echo "  $0 <база> <тип_бэкапа> [дата_в_форматеYYYYMMDD]"
    echo ""
    echo "Примеры:"
    echo "  $0 saki daily                    # Восстановить последний daily бэкап saki"
    echo "  $0 articles weekly 20241225      # Восстановить weekly бэкап articles от 2024-12-25"
    echo ""
    echo "Доступные базы: saki, articles, auth"
    echo "Доступные типы: daily, weekly, monthly, yearly"
}

list_backups() {
    local db=$1
    local type=$2
    
    echo "Доступные бэкапы для $db ($type):"
    ls -lh $BACKUP_DIR/$type/${db}_*.sql.gz 2>/dev/null | awk '{print $9}' | sort -r
}

if [ $# -lt 2 ]; then
    show_usage
    exit 1
fi

DB_NAME=$1
BACKUP_TYPE=$2
SPECIFIC_DATE=$3

# Проверяем что контейнер БД запущен
if ! docker compose ps db | grep -q "Up"; then
    echo "❌ Контейнер БД не запущен. Запускаем..."
    docker compose up -d db
    echo "Ждем запуска БД..."
    sleep 15
fi

# Проверяем существование базы
if ! docker compose exec -T db psql -U $DB_USER -l 2>/dev/null | grep -q $DB_NAME; then
    echo "❌ База $DB_NAME не существует. Создаем..."
    docker compose exec -T db createdb -U $DB_USER $DB_NAME
fi

# Определяем файл для восстановления
if [ -n "$SPECIFIC_DATE" ]; then
    BACKUP_FILE=$(ls $BACKUP_DIR/$BACKUP_TYPE/${DB_NAME}_${SPECIFIC_DATE}*.sql.gz 2>/dev/null | head -1)
else
    BACKUP_FILE=$(ls -t $BACKUP_DIR/$BACKUP_TYPE/${DB_NAME}_*.sql.gz 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Бэкапы не найдены для $DB_NAME ($BACKUP_TYPE)"
    list_backups $DB_NAME $BACKUP_TYPE
    exit 1
fi

echo "Восстанавливаем базу $DB_NAME из: $(basename $BACKUP_FILE)"
echo "Размер бэкапа: $(du -h "$BACKUP_FILE" | cut -f1)"

# Проверяем бэкап
echo "Проверяем целостность бэкапа..."
if ! gzip -t "$BACKUP_FILE"; then
    echo "❌ Бэкап поврежден"
    exit 1
fi
echo "✅ Бэкап прошел проверку"

# Подтверждение
read -p "Вы уверены? Это перезапишет данные в БД $DB_NAME [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 1
fi

# Останавливаем сервисы которые используют эту БД
echo "Останавливаем зависимые сервисы..."
docker compose stop saki-service admin-backend auth-service 2>/dev/null || true

# Восстанавливаем бэкап напрямую из gz файла
echo "Восстановление..."
echo "Это может занять несколько минут..."

# Способ 1: Восстановление напрямую из gz
echo "Способ 1: Восстановление напрямую из архива..."
if gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U $DB_USER -d $DB_NAME; then
    echo "✅ Восстановление завершено успешно"
else
    echo "❌ Способ 1 не сработал, пробуем способ 2..."
    
    # Способ 2: Копируем файл в контейнер и восстанавливаем оттуда
    echo "Способ 2: Копируем файл в контейнер..."
    docker compose cp "$BACKUP_FILE" db:/tmp/backup.sql.gz
    docker compose exec -T db gunzip -f /tmp/backup.sql.gz
    if docker compose exec -T db psql -U $DB_USER -d $DB_NAME -f /tmp/backup.sql; then
        echo "✅ Восстановление завершено успешно (способ 2)"
        docker compose exec -T db rm -f /tmp/backup.sql
    else
        echo "❌ Оба способа не сработали"
        docker compose exec -T db rm -f /tmp/backup.sql
        exit 1
    fi
fi

# Запускаем сервисы обратно
echo "Запускаем сервисы..."
docker compose up -d

echo "✅ Восстановление завершено!"

# Проверяем что данные восстановились
echo ""
echo "Проверка восстановленных данных:"
case $DB_NAME in
    "saki")
        docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as daily_records FROM daily_content;" 2>/dev/null || echo "Таблица daily_content не найдена"
        ;;
    "articles")
        docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as articles_count FROM articles;" 2>/dev/null || echo "Таблица articles не найдena"
        ;;
    "auth")
        docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as users_count FROM users;" 2>/dev/null || echo "Таблица users не найдена"
        ;;
esac
