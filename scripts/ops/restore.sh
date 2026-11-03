#!/usr/bin/env bash
# Restores a backup made by backup.sh into an empty Supabase project, following
# Supabase's documented order: roles, then schema, then data with triggers off.
#
#   BACKUP_PASSPHRASE='...' bash scripts/ops/restore.sh graphite-backup-2026-11-08.tar.gz.gpg 'postgresql://...'
#
# Needs gpg and psql. Use the new project's Session pooler connection string.
set -euo pipefail

archive="${1:?Usage: restore.sh ARCHIVE DATABASE_URL}"
db="${2:?Usage: restore.sh ARCHIVE DATABASE_URL}"
: "${BACKUP_PASSPHRASE:?Set BACKUP_PASSPHRASE to the passphrase the backups were made with}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

if ! gpg --batch --quiet --pinentry-mode loopback \
  --passphrase-file <(printf '%s' "$BACKUP_PASSPHRASE") \
  --decrypt "$archive" > "$work/backup.tar.gz" 2> "$work/gpg.log"; then
  echo "Couldn't open $(basename "$archive"): the passphrase is wrong or the file isn't a Graphite backup." >&2
  exit 1
fi
tar -C "$work" -xzf "$work/backup.tar.gz"

psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file "$work/roles.sql" \
  --file "$work/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$work/data.sql" \
  --dbname "$db"

echo "Restored $(basename "$archive")."
