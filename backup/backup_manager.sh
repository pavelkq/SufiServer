#!/bin/bash

set -e

# Конфигурация
BACKUP_DIR="/opt/Sufi/backup"
DB_USER="user"
DB_PASSWORD="pass"
RETENTION_DAILY=7
RETENTION_WEEKLY=5
RETENTION_MONTHLY=12
RETENTION_YEARLY=1

# Создаем директории если нет
mkdir -p $BACKUP_DIR/{daily,weekly,monthly,yearly}

# Функция получения списка всех БД (кроме системных)
get_all_databases() {
    docker compose exec -T db psql -U $DB_USER -d postgres -t -c "
    SELECT datname FROM pg_database 
    WHERE datistemplate = false 
    AND datname NOT IN ('postgres')
    ORDER BY datname;" | tr -d ' ' | grep -v '^$'
}

# Функция проверки бэкапа
verify_backup() {
    local backup_file=$1
    local db_name=$2
    
    echo "Проверка бэкапа: $(basename $backup_file)"
    
    # Проверяем что файл не пустой
    if [ ! -s "$backup_file" ]; then
        echo "❌ Бэкап пустой или не существует"
        return 1
    fi
    
    # Для .sql.gz проверяем целостность
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            echo "❌ Бэкап поврежден (gzip проверка)"
            return 1
        fi
        
        # Проверяем структуру SQL
        if ! gunzip -c "$backup_file" | head -10 | grep -q "PostgreSQL"; then
            echo "❌ Неверный формат SQL в бэкапе"
            return 1
        fi
    else
        # Для .sql файлов
        if ! head -10 "$backup_file" | grep -q "PostgreSQL"; then
            echo "❌ Неверный формат SQL в бэкапе"
            return 1
        fi
    fi
    
    # Убираем строгую проверку таблиц, так как имена могут отличаться
    echo "✅ Бэкап прошел базовую проверку"
    
    # Дополнительная информация о содержимом
    if [[ "$backup_file" == *.gz ]]; then
        table_count=$(gunzip -c "$backup_file" | grep -c "CREATE TABLE" 2>/dev/null || echo "N/A")
        echo "📊 Таблиц в бэкапе: $table_count"
    else
        table_count=$(grep -c "CREATE TABLE" "$backup_file" 2>/dev/null || echo "N/A")
        echo "📊 Таблиц в бэкапе: $table_count"
    fi
    
    return 0
}

# Функция создания бэкапа
create_backup() {
    local db_name=$1
    local backup_type=$2
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Создание $backup_type бэкапа для $db_name"
    
    # Создаем бэкап в формате .sql
    local sql_file="$BACKUP_DIR/$backup_type/${db_name}_${timestamp}.sql"
    echo "Создаем бэкап: $sql_file"
    
    if ! docker compose exec -T db pg_dump -U $DB_USER $db_name > "$sql_file"; then
        echo "❌ Ошибка при создании бэкапа для $db_name"
        rm -f "$sql_file"
        return 1
    fi
    
    # Проверяем SQL бэкап
    if verify_backup "$sql_file" "$db_name"; then
        # Создаем сжатый вариант
        gzip -c "$sql_file" > "$sql_file.gz"
        
        # Проверяем сжатый бэкап
        if verify_backup "$sql_file.gz" "$db_name"; then
            # Удаляем несжатый если сжатый прошел проверку
            rm "$sql_file"
            echo "✅ Бэкап создан и проверен: ${db_name}_${timestamp}.sql.gz"
        else
            echo "❌ Сжатый бэкап не прошел проверку, оставляем .sql"
        fi
    else
        echo "❌ SQL бэкап не прошел проверку"
        rm "$sql_file"
        return 1
    fi
}

# Функция очистки старых бэкапов
cleanup_backups() {
    local backup_type=$1
    local retention=$2
    
    echo "Очистка $backup_type бэкапов (оставляем $retention)"
    
    # Получаем список всех БД для очистки
    local databases=$(get_all_databases)
    
    for db in $databases; do
        # Удаляем старые .sql файлы
        ls -t $BACKUP_DIR/$backup_type/${db}_*.sql 2>/dev/null | tail -n +$(($retention + 1)) | xargs -r rm -f
        
        # Удаляем старые .sql.gz файлы  
        ls -t $BACKUP_DIR/$backup_type/${db}_*.sql.gz 2>/dev/null | tail -n +$(($retention + 1)) | xargs -r rm -f
    done
}

# Функция копирования бэкапа между типами
copy_backup() {
    local source_type=$1
    local target_type=$2
    local db_name=$3
    
    # Берем самый свежий бэкап из source
    local latest_backup=$(ls -t $BACKUP_DIR/$source_type/${db_name}_*.sql.gz 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        local filename=$(basename $latest_backup)
        cp $latest_backup $BACKUP_DIR/$target_type/$filename
        
        # Проверяем скопированный бэкап
        if verify_backup "$BACKUP_DIR/$target_type/$filename" "$db_name"; then
            echo "✅ Скопирован в $target_type: $filename"
        else
            echo "❌ Скопированный бэкап не прошел проверку"
            rm "$BACKUP_DIR/$target_type/$filename"
        fi
    else
        echo "⚠️  Нет бэкапов в $source_type для копирования в $target_type"
    fi
}

# Основная логика
main() {
    local backup_type=$1
    
    # Получаем актуальный список БД
    DATABASES=$(get_all_databases)
    echo "Обнаружены БД: $DATABASES"
    
    if [ -z "$DATABASES" ]; then
        echo "❌ Не найдено ни одной базы данных"
        exit 1
    fi
    
    case $backup_type in
        "daily")
            for db in $DATABASES; do
                create_backup $db "daily"
            done
            cleanup_backups "daily" $RETENTION_DAILY
            ;;
            
        "weekly")
            for db in $DATABASES; do
                copy_backup "daily" "weekly" $db
            done
            cleanup_backups "weekly" $RETENTION_WEEKLY
            ;;
            
        "monthly")
            for db in $DATABASES; do
                copy_backup "daily" "monthly" $db
            done
            cleanup_backups "monthly" $RETENTION_MONTHLY
            ;;
            
        "yearly")
            for db in $DATABASES; do
                copy_backup "daily" "yearly" $db
            done
            cleanup_backups "yearly" $RETENTION_YEARLY
            ;;
            
        *)
            echo "Использование: $0 {daily|weekly|monthly|yearly}"
            exit 1
            ;;
    esac
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $backup_type бэкап завершен"
    echo "=== Статус бэкапов ==="
    for type in daily weekly monthly yearly; do
        count=$(ls $BACKUP_DIR/$type/*.sql.gz 2>/dev/null | wc -l)
        echo "$type: $count файлов"
    done
}

main "$@"
