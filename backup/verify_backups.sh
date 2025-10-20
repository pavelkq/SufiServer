#!/bin/bash

BACKUP_DIR="/opt/Sufi/backup"

verify_backup_content() {
    local backup_file=$1
    local db_name=$2
    
    echo "=== Проверка бэкапа: $(basename $backup_file) ==="
    
    # Проверяем основные метрики
    local size=$(du -h "$backup_file" | cut -f1)
    echo "Размер: $size"
    
    # Смотрим реальное содержимое
    echo "Содержимое бэкапа:"
    
    if [[ "$backup_file" == *.gz ]]; then
        # Для сжатых файлов
        gunzip -c "$backup_file" | head -20
    else
        # Для несжатых
        head -20 "$backup_file"
    fi
    
    echo "--- Ключевые таблицы в бэкапе ---"
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | grep -E "CREATE TABLE|COPY.*FROM stdin;" | head -10
    else
        grep -E "CREATE TABLE|COPY.*FROM stdin;" "$backup_file" | head -10
    fi
    
    echo ""
}

# Проверяем все последние бэкапы
echo "Проверка последних бэкапов..."
echo ""

for db in articles auth saki; do
    latest_backup=$(ls -t $BACKUP_DIR/daily/${db}_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        verify_backup_content "$latest_backup" "$db"
    else
        echo "❌ Нет бэкапов для $db"
    fi
done

echo "=== Сводка ==="
for type in daily weekly monthly yearly; do
    count=$(ls $BACKUP_DIR/$type/*.sql.gz 2>/dev/null | wc -l)
    total_size=$(du -ch $BACKUP_DIR/$type/*.sql.gz 2>/dev/null | grep total | cut -f1)
    echo "$type: $count файлов ($total_size)"
done
