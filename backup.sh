#!/bin/bash
# CashMap Database Backup Script
# Crontab: 0 2 * * * /home/cashmap/backup.sh

BACKUP_DIR="/home/cashmap/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U cashmap cashmap | gzip > "$BACKUP_DIR/cashmap_$TIMESTAMP.sql.gz"

# Keep last 30 backups
ls -t $BACKUP_DIR/*.sql.gz | tail -n +31 | xargs rm -f 2>/dev/null

echo "Backup completed: cashmap_$TIMESTAMP.sql.gz"
