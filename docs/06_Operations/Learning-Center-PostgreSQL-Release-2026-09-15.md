# PostgreSQL Learning Center — PR1 Release Record

**Status:** COMPLETE — MERGED AND VERIFIED IN PRODUCTION
**Authority:** current Founder instruction of 15 September 2026
**Review base:** `85dfabe85441f3e91bbe08628a8b7ca9b3e39970`
**Expected pre-change Production deployment:** `dpl_DS4CYYA9nuZZQtZnKyRhM9uxf8Wq`
**PR:** [#296](https://github.com/AlexG-7BE/sevenbet-next/pull/296)
**Reviewed head:** `14d80d8363e23a6d7d01f097a2e0bfd9dd937134`
**Merge commit:** `e210f265e31839c1f8803d766b820cddb9386ddb`
**Verified Production deployment:** `dpl_CYiuPvGtiLdjH2u4P9eezEkivS4Y`

## Evidence boundary

**DETECTED:** the active repository root is
`/private/tmp/b4gamble-learning-pr1-20260915`. The complete tracked repository
was scanned, excluding dependencies, generated output, build artefacts, caches
and `tsconfig.tsbuildinfo` from source conclusions. The reviewed implementation
was subsequently merged and the exact merge commit was verified in Production.

**DETECTED:** the pre-change Prisma schema has one durable `Article` model and
one reusable durable `ContentRevision` model. The legacy `lib/cms` repository is
process-memory state populated from synthetic seeds and is not a Production
content authority. No existing safe Article block schema or PostgreSQL Article
service was present. Public `/learn` routes existed but were backed by a static
manifest.

## Released outcome

**DETECTED IN SOURCE AND VERIFIED IN PRODUCTION:** the release keeps the existing Prisma `Article` as the
only Article authority. A narrow Article service now owns Admin CRUD, filters,
validation, editorial transitions, publication reads and durable revisions.
Admin `/admin/learning` supports create, edit, authenticated preview, review,
approve, publish, revise, archive, restore and revision restore. Public `/learn`
and `/learn/[category]/[slug]` read only valid, due, `PUBLISHED` rows for the
exact presentation locale. Missing, draft, archived, future or malformed rows
fail closed.

**DETECTED IN SOURCE:** when no matching Article is published, the localized
Learning hub shows a truthful locale-aware empty state and no synthetic cards.
Legacy educational links terminate at a filtered `/learn?category=...`
catalogue until an editor publishes a matching PostgreSQL Article; they do not
point at removed Phase-1 article slugs.

**DETECTED IN SOURCE:** body content has one controlled JSON block format:
paragraph, heading, list, quote, callout, image and link. The shared React
renderer does not accept raw HTML, scripts, iframes, SVG markup, event handlers
or JavaScript URLs. External URLs are restricted to safe HTTP(S); internal URLs
must be canonical absolute paths.

**DETECTED IN SOURCE:** authenticated preview uses the same Article view as the
public route, remains `noindex`, and has no token bypass. Publication metadata,
canonical URL, Open Graph, Article/Breadcrumb structured data and sitemap rows
are derived only from valid published PostgreSQL records.

## Schema and compatibility

**DETECTED IN SOURCE:** exactly one migration exists:
`0043_article_learning_center`. It adds four compatibility fields to the
existing Article table and one read index. It creates zero models/tables,
rewrites zero content rows, deletes zero rows and seeds zero Articles. Existing
rows receive `en-GB` only because the previously required locale field was
absent from the actual baseline schema.

The pre-change application safely ignores the expansion. The new application
requires 0043 in Production and its build preflight checks the immutable
migration checksum, column/index shape and supported locale values. Application
rollback leaves the compatible expansion in place. Reverse or destructive SQL
is not part of this release.

## Verification contract

The exact candidate head must pass:

- Article validation, renderer, authorization, routing, SEO, sitemap and legacy
  authority structural tests;
- disposable PostgreSQL create/edit/review/approve/publish/revise/archive and
  revision-restore acceptance;
- exact 0042-to-0043 staged migration preservation and replay checks;
- Admin authentication, Programme and Casino regressions;
- `ci:quality`, Programme regressions, optimized build, secret scan, browser
  tests and `git diff --check`;
- required GitHub contexts Agent Core, Quality, Database / Migration
  Verification, Build / Browser and Vercel.

Preview/CI fixtures may mutate only isolated databases. No synthetic Article
may be written to Production.

## Production migration and deployment evidence

**VERIFIED:** all required GitHub contexts passed on reviewed head
`14d80d8363e23a6d7d01f097a2e0bfd9dd937134`. A database-enforced read-only
preflight proved the expected Production identity, 42 completed migrations
through `0042_admin_mfa`, zero unresolved attempts, exact pending suffix 0043,
zero Article rows and no target columns/index.

**VERIFIED:** normal `prisma migrate deploy` applied
`0043_article_learning_center` exactly once through the canonical direct
Production binding. Read-only postflight then proved 43 completed migrations,
head 0043, exact checksum
`539de896e0a05fe9e602f538e3c18be7bcedcbc135c38606210c32851fad2405`,
four target columns, one target index, zero unsupported locales and unchanged
zero Article/status counts. No backfill, seed or manual SQL was used.

**VERIFIED:** PR #296 merged normally and Ready deployment
`dpl_CYiuPvGtiLdjH2u4P9eezEkivS4Y` built exact merge commit
`e210f265e31839c1f8803d766b820cddb9386ddb`. Build preflight proved same
pooled/direct database identity and the 0043 Article shape. Live acceptance
proved authenticated Learning Center list/create UI, anonymous Admin denial,
PostgreSQL public Article API with zero records, truthful public empty state,
missing Article 404, one-hop legacy redirect/query preservation, unchanged
Admin MFA boundary and no representative 5xx. No Production Article was
created or modified.

## Architecture boundary

**DETECTED:** no new Article authority, generic CMS, auth authority, worker,
queue, outbox, media service or Commercial/Programme/Casino authority change is
introduced. `ContentRevision` is reused only as immutable Article history.
