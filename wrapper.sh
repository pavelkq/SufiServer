#!/bin/sh
mkdir -p /var/log/postgresql
touch /var/log/postgresql/postgresql.log
chmod 777 /var/log/postgresql/postgresql.log
tail -F /var/log/postgresql/postgresql.log &
exec docker-entrypoint.sh postgres -c logging_collector=on -c log_directory=/var/log/postgresql -c log_filename=postgresql.log -c log_statement=all -c log_destination=stderr

