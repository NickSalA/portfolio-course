#!/bin/sh
# Runs inside the local database container. Never modifies or copies rows from postgres.
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work=$(mktemp -d /tmp/grp06-concurrency.XXXXXXXX)
db=qa_grp06_$(basename "$work" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9')
created=0
cleanup() {
  if [ "$created" = 1 ]; then
    dropdb -U postgres --if-exists --force "$db" || { echo "ERROR: could not drop temporary database $db" >&2; exit 1; }
  fi
  rm -rf -- "$work"
}
trap cleanup EXIT HUP INT TERM
createdb -U postgres -T template0 "$db"
created=1
psql -X -q -v ON_ERROR_STOP=1 -U postgres -d "$db" -c 'drop schema public cascade; create schema extensions; create extension btree_gist with schema extensions; create extension pgcrypto with schema extensions; create extension "uuid-ossp" with schema extensions; create extension dblink with schema extensions'
# Restrict the dump to relevant schemas; no application data or database-wide settings.
pg_dump -U postgres -d postgres --schema-only --no-owner --no-privileges -n public -n auth -n academic_access -n extensions > "$work/schema.sql"
sed 's/^CREATE SCHEMA extensions;$/-- pre-created for extensions/' "$work/schema.sql" > "$work/restore.sql"
psql -X -q -v ON_ERROR_STOP=1 -U postgres -d "$db" -f "$work/restore.sql" > "$work/restore.log" 2>&1 || { cat "$work/restore.log" >&2; exit 1; }
psql -X -v ON_ERROR_STOP=1 -U supabase_admin -d "$db" -f "$here/grp_06_concurrency.sql"
echo "PASS GRP-06 concurrency: isolated database removed on exit"
