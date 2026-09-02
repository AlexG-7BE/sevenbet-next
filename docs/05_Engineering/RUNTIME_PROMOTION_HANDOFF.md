# Runtime Promotion Handoff — PR #111 after DB-First 0025

Status: **ACTIVE RELEASE HANDOFF**. Production migration 0025 is complete. The direct Founder Office release instruction authorises #111 merge and normal Production deployment only after the exact-head gates below pass.

After the reconciled Release-04 lands, update PR #111 onto current `main` without changing `prisma/migrations/0025_casino_market_profile_architecture/migration.sql`. Resolve the expected overlap in `scripts/vercel-build-preflight.ts`, `scripts/ci-migrations.mjs`, `.github/workflows/ci.yml`, `package.json`, the 0025 fixture/tests, and release documentation. Preserve the Release-04 read-only 0025 checksum/schema guard while taking #111's Prisma schema, market models, services, routes, and admin/public behavior.

The final #111 diff should add the architecture Prisma schema and runtime only; the migration already present on main should show no content change and no duplicate 0026. Confirm schema/client alignment, same-profile projections, stable first-country unqualified results, exact route authority, and no factual editor setter for `productionEligible`.

Rerun `npm ci`, Prisma validation/generation, clean/staged migration replay, casino-market tests, release guard tests, Programme/Better Auth/MCP migration tests, typecheck, lint, structural checks, build-secret scan, build, required browser CI, Preview, and exact-head hosted checks. Confirm no commercial route becomes active before merge and Production acceptance.
