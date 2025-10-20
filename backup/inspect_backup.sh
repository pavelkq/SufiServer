#!/bin/bash

BACKUP_DIR="/opt/Sufi/backup"

show_tables_in_backup() {
    local backup_file=$1
    
    echo "Таблицы в бэкапе $(basename $backup_file):"
    gunzip -c "$backup_file" | grep "^CREATE TABLE" | awk '{print $3}' | sed 's/"//g' | sort
}

show_backup_info() {
    local backup_file=$1
    
    echo "=== Информация о бэкапе ==="
    echo "Файл: $(basename $backup_file)"
    echo "Размер: $(du -h "$backup_file" | cut -f1)"
    echo "Дата создания: $(stat -c %y "$backup_file")"
    echo ""
    
    show_tables_in_backup "$backup_file"
    
    echo ""
    echo "Первые 5 строк данных:"
    gunzip -c "$backup_file" | grep -A5 "^COPY" | head -10
}

if [ $# -eq 0 ]; then
    echo "Использование: $0 <путь_к_бэкапу>"
    echo "Пример: $0 /opt/Sufi/backup/daily/saki_20241225_120000.sql.gz"
    exit 1
fi

show_backup_info "$1"
