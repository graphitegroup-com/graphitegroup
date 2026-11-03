#!/usr/bin/env bash
# Dumps the Supabase database with the Supabase CLI (roles, schema and data, as
# Supabase documents) and encrypts the three files into one archive. The repo
# is public and anyone signed in to GitHub can download a run's files, so the
# dump only ever leaves the runner encrypted with BACKUP_PASSPHRASE.
#
# Writes $BACKUP_DIR/graphite-backup-YYYY-MM-DD.tar.gz.gpg (default ./backup).
# Restore with scripts/ops/restore.sh.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set the SUPABASE_DB_URL secret (Supabase, Connect, Session pooler)}"
: "${BACKUP_PASSPHRASE:?Set the BACKUP_PASSPHRASE secret}"

out="${BACKUP_DIR:-backup}"
stamp="$(date -u +%Y-%m-%d)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$out"

supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/roles.sql" --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/schema.sql"
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/data.sql" --use-copy --data-only

# A project with no custom roles can have an empty roles file; schema and data never should.
for f in schema data; do
  if [ ! -s "$work/$f.sql" ]; then
    echo "::error::$f.sql came out empty, so this isn't a usable backup."
    exit 1
  fi
done

archive="$out/graphite-backup-$stamp.tar.gz.gpg"
tar -C "$work" -czf - roles.sql schema.sql data.sql |
  gpg --batch --yes --quiet --pinentry-mode loopback \
    --passphrase-file <(printf '%s' "$BACKUP_PASSPHRASE") \
    --symmetric --cipher-algo AES256 --output "$archive"

# Prove the archive opens with the passphrase before calling it a backup.
contents=$(gpg --batch --quiet --pinentry-mode loopback \
  --passphrase-file <(printf '%s' "$BACKUP_PASSPHRASE") \
  --decrypt "$archive" | tar -tzf - | sort | tr '\n' ' ')
if [ "$contents" != "data.sql roles.sql schema.sql " ]; then
  echo "::error::The encrypted archive didn't open cleanly (found: $contents)."
  exit 1
fi

echo "date=$stamp" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "Saved $archive ($(du -h "$archive" | cut -f1)), encrypted, with roles, schema and data."
