# PostgreSQL Learning Center — PR1 Release Record

**Status:** PR CANDIDATE — NOT YET APPLIED OR DEPLOYED
**Authority:** current Founder instruction of 15 September 2026
**Review base:** `85dfabe85441f3e91bbe08628a8b7ca9b3e39970`
**Expected pre-change Production deployment:** `dpl_DS4CYYA9nuZZQtZnKyRhM9uxf8Wq`

## Evidence boundary

**DETECTED:** the active repository root is
`/private/tmp/b4gamble-learning-pr1-20260915`. The complete tracked repository
was scanned, excluding dependencies, generated output, build artefacts, caches
and `tsconfig.tsbuildinfo` from source conclusions. Implementation statements
below describe the exact PR1 candidate. They are not Production claims.

**DETECTED:** the pre-change Prisma schema has one durable `Article` model and
one reusable durable `ContentRevision` model. The legacy `lib/cms` repository is
process-memory state populated from synthetic seeds and is not a Production
content authority. No existing safe Article block schema or PostgreSQL Article
service was present. Public `/learn` routes existed but were backed by a static
manifest.

## Candidate outcome

**DETECTED IN SOURCE:** the candidate keeps the existing Prisma `Article` as the
only Article authority. A narrow Article service now owns Admin CRUD, filters,
validation, editorial transitions, publication reads and durable revisions.
Admin `/admin/learning` supports create, edit, authenticated preview, review,
approve, publish, revise, archive, restore and revision restore. Public `/learn`
and `/learn/[category]/[slug]` read only valid, due, `PUBLISHED` rows for the
exact presentation locale. Missing, draft, archived, future or malformed rows
fail closed.

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

## Production migration and deployment gate

**PROPOSED UNTIL EXECUTED AND VERIFIED:**

1. Confirm exact release-head SHA and all required checks.
2. Confirm the canonical Vercel project/environment, matching pooled/direct
   database identity and a current recoverable provider point.
3. In read-only preflight, require 42 completed migrations through 0042, no
   failed/unknown/checksum-mismatched rows, and exact pending suffix 0043 only.
   Record aggregate Article count and status counts; return no Article content.
4. Apply `prisma migrate deploy` once through the canonical Production binding.
   Do not use `db push`, `migrate reset`, manual SQL or a backfill.
5. Recheck 43 completed migrations, the exact 0043 checksum, four columns, the
   publication index, supported locale values and unchanged Article/status
   counts.
6. Merge the exact checked head through branch protection and allow canonical
   Vercel Production deployment. The build must fail closed if 0043 is absent.
7. Verify anonymous Admin denial, authenticated `/admin/learning`, create and
   preview UI presence, public `/learn`, missing/unpublished 404 behavior,
   absence of synthetic content, Admin/TOTP regression and no new 5xx.

Stop before migration or merge on database-identity mismatch, absent recovery
posture, any pending migration other than 0043, unresolved migration history,
checksum drift, unsupported existing locale values, row/status-count change or
any failed required check.

## Architecture boundary

**DETECTED:** no new Article authority, generic CMS, auth authority, worker,
queue, outbox, media service or Commercial/Programme/Casino authority change is
introduced. `ContentRevision` is reused only as immutable Article history.
