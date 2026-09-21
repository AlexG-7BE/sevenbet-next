#!/usr/bin/env bash
# Copies the Production database into the Development database (b4gamble-dev).
# Production is only READ (pg_dump). Only the dev database is overwritten.
# Run manually from the repo root: bash scripts/local/copy-prod-to-dev-db.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

env_value() { grep "^$1=" "$2" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

PROD_ENV="$(mktemp)"
trap 'rm -f "$PROD_ENV"' EXIT

echo "→ Fetching Production connection string from Vercel…"
vercel env pull "$PROD_ENV" --environment=production --yes >/dev/null

SRC=""
for key in DIRECT_URL DATABASE_URL PRODDB_POSTGRES_URL PRODDB_DATABASE_URL; do
  SRC="$(env_value "$key" "$PROD_ENV")"
  if [ -n "$SRC" ]; then echo "→ Using Production $key"; break; fi
done
DST="$(env_value DATABASE_URL .env.local)"

[ -n "$SRC" ] && [ -n "$DST" ] || { echo "✗ Missing connection string"; exit 1; }
[ "$SRC" != "$DST" ] || { echo "✗ Source and target are the same database — aborting"; exit 1; }
case "$DST" in *"$(echo "$SRC" | sed -E 's#^[a-z+]+://([^:@]*).*#\1#')"*)
  echo "✗ Target looks like the Production database — aborting"; exit 1;;
esac

echo "→ Clearing dev database…"
psql "$DST" -q -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;"

echo "→ Copying Production → dev (read-only on Production)…"
# The dev schema is already recreated above; skip the dump's own CREATE SCHEMA
# and any provider-managed extensions (e.g. prisma_postgres) the app doesn't need.
pg_dump --no-owner --no-privileges --schema=public "$SRC" \
  | sed -E -e '/^CREATE SCHEMA public;$/d' -e '/^(CREATE|COMMENT ON) EXTENSION /d' \
  | psql "$DST" -q -v ON_ERROR_STOP=1

echo "→ Verifying…"
psql "$DST" -t -A -c 'SELECT count(*) || '"' casinos, '"' || (SELECT count(*) FROM "Article") || '"' articles'"' FROM "Casino";' || true
echo "→ Published casinos:"
psql "$DST" -t -A -c "SELECT string_agg(slug, ', ' ORDER BY slug) FROM \"Casino\" WHERE status = 'PUBLISHED';" || true
echo "✓ Done. Dev database is a copy of Production."
