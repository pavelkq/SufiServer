#!/bin/bash

BACKUP_DIR="/opt/Sufi/backup"
DB_USER="user"

echo "=== Статус системы бэкапов ==="
echo ""

# Проверяем существование БД
echo "📊 Существующие базы данных:"
docker compose exec -T db psql -U $DB_USER -d postgres -t -c "
SELECT datname, pg_size_pretty(pg_database_size(datname)) as size 
FROM pg_database 
WHERE datistemplate = false AND datname NOT IN ('postgres')
ORDER BY datname;" | while read line; do
    if [ -n "$line" ]; then
        echo "  ✅ $line"
    fi
done

echo ""
echo "💾 Статус бэкапов:"

for type in daily weekly monthly yearly; do
    echo ""
    echo "--- $type ---"
    for db in articles auth saki; do
        latest=$(ls -t $BACKUP_DIR/$type/${db}_*.sql.gz 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            size=$(du -h "$latest" | cut -f1)
            date=$(stat -c %y "$latest" | cut -d' ' -f1)
            echo "  ✅ $db: $size ($date)"
        else
            echo "  ❌ $db: нет бэкапов"
        fi
    done
done

echo ""
echo "📈 Статистика:"
total_backups=$(find $BACKUP_DIR -name "*.sql.gz" | wc -l)
total_size=$(du -sh $BACKUP_DIR | cut -f1)
echo "Всего бэкапов: $total_backups"
echo "Общий размер: $total_size"

# Проверяем cron
echo ""
echo "⏰ Cron задания:"
crontab -l | grep backup || echo "  ❌ Cron задания не найдены"

echo ""
echo "🔍 Последние бэкапы:"
for db in articles auth saki; do
    latest=$(ls -t $BACKUP_DIR/daily/${db}_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest" ]; then
        echo "  $db: $(basename $latest)"
    fi
done
