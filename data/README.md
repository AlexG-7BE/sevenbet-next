# What lives in `data/`

**The database (CMS) is the only source of casino content on the site.** Production, Preview and local development all read casinos from Postgres. The live site never reads casino content from this folder; the files here are import inputs and release records.

## Start here

- **[`casino-registry.json`](casino-registry.json)** — the one list of every casino in the database: slug, status, markets, the release that introduced it and its import bundle(s). Currently 16 casinos: 15 published and 1 archived (Boostwin).
  - `tests/casino-registry.test.ts` checks that the registry matches the bundles in this folder (runs in CI).
  - `npm run casino-registry:verify` compares the registry with the connected database (read-only).

## Folders

| Path | What it is | Used by |
| --- | --- | --- |
| `casino-ingestion/` | **Import bundles, one file per casino and market group.** All 15 published casinos have their bundle here (seven GB bundles sit in the `casino-data-population-01/` subfolder). | `npm run casino-market:ingest` |
| `casino-real-catalog-02/` | Release record for the first 8 casinos (3 Sep 2026). | `scripts/casino-real-catalog-02.ts` |
| `casino-real-catalog-03/` | Release record for the next 6 casinos (plus a Betsson logo upgrade), 8 Sep 2026. | `scripts/casino-real-catalog-03.ts` |
| `casino-commercial-activation/`, `casino-commercial-visibility-03/`, `commercial-activation/` | Commercial activation evidence and templates. | build preflight and release scripts |
| `current-partner-global-rollout/` | Partner rollout matrix (no casino content). | `scripts/current-partner-global-rollout.ts` |
| `placement-media-assignments-01-backfill.json` | Historical media backfill record (retired operation). | `npm run placement-media:audit` / `:verify` |
| `casinos.json` | **Legacy, not real casinos.** 220 placeholder records from July 2026. It is only read when `PUBLIC_CASINO_CMS_ENABLED=false` (database-less test runs), never by the live site. Scheduled for removal. | `lib/data.ts` |

The catalog folders are release history, not separate casino lists. The same casino can appear in more than one of them (Betsson is in both 02 and 03).

## Adding or changing a casino

1. Add or edit the bundle in `casino-ingestion/`.
2. Import it into the database with `npm run casino-market:ingest -- --bundle <path>` (a dry-run plan by default; writing needs `--write --source-root <dir>`), or edit the casino in `/admin`.
3. Add or update the entry in `casino-registry.json`, then run `npm run casino-registry:verify`.

Edits made in `/admin` are not written back to the bundles. Treat the bundles as the import input, and the database as the current state.

## Local development database

Local `npm run dev` reads the `b4gamble-dev` Prisma Postgres database, which Vercel connects to the Development environment only (`vercel env pull .env.local --environment=development`, then set `DIRECT_URL` to the same value as `DATABASE_URL`). To refresh it with a copy of Production, run `bash scripts/local/copy-prod-to-dev-db.sh`. The script only reads Production (`pg_dump`), refuses to run if the target is the Production database, and overwrites the dev database only.
