# CMS Admin Simplification — PR2 Release Record

**Status:** PR CANDIDATE — NOT YET MERGED OR DEPLOYED
**Authority:** current Founder instruction of 15 September 2026
**Exact base:** `e210f265e31839c1f8803d766b820cddb9386ddb`
**Base Production deployment:** `dpl_CYiuPvGtiLdjH2u4P9eezEkivS4Y`

## Evidence boundary

**DETECTED:** PR2 was created only after PR1 was merged, migration 0043 was
applied, the exact PR1 merge commit reached Ready Production and live
Learning Center acceptance passed. The implementation uses an isolated clean
worktree based on that exact merge commit. Dependency, generated, build and
cache directories are excluded from source conclusions.

## Candidate outcome

**DETECTED IN SOURCE:** the role-filtered top-level sidebar contains exactly
Dashboard, Programs, Learning Center, Casinos, Affiliate Operations,
Commercial, Customers, Analytics, Email and Email Templates. Programme-local
navigation preserves the real PostgreSQL XP Rules and Achievements routes.
Email-local navigation joins Email and its versioned Email Templates without
creating another template concept.

**DETECTED IN SOURCE:** the Dashboard no longer imports Phase-1 seed records,
process-local audit state or `listCmsRecords`. Its available summary values
come directly from current Programme, Article, Casino and Customer PostgreSQL
services. A unified recent-activity feed is deliberately omitted because there
is no single durable cross-domain feed and this release does not create one.

**DETECTED IN SOURCE:** the old dynamic Admin section handler no longer renders
generic CMS records. Program settings redirects to Programs. The obsolete
generic Bonuses workspace and retired Media Operations page redirect to
Casinos, where their real current product concerns are managed. Generic
Settings and unknown sections return the intentional Admin 404.

**DETECTED IN SOURCE:** the old `globalThis` seed repository, its synthetic
seed, in-memory revisions/audit and exclusively dependent validation/workflow
helpers had no remaining canonical caller after the Dashboard and section
retirement, and are removed. The shared CMS types, Programme validation and
role permissions remain because current PostgreSQL Programme, Article and
Admin systems use them.

**DETECTED IN SOURCE:** the dynamic generic Admin entity APIs remain only as
authenticated `410 LEGACY_CMS_RETIRED` tombstones. They cannot list or mutate
seed records and direct staff to dedicated PostgreSQL domain APIs. Current
Article, Program, Casino, Affiliate, Commercial, Customer, Analytics, Email
and Template routes remain separate and unchanged in authority.

## Security and responsive UX

**DETECTED IN SOURCE:** the obsolete preview-token fallback notice is gone.
The sidebar states only that Better Auth and TOTP protect privileged Admin
access. No auth flow, permission, role, session or MFA implementation changes.

**DETECTED IN SOURCE:** top-level and local navigation collapse to bounded
two-column and one-column layouts at tablet/mobile widths. Existing Learning
filters and Article editor controls retain their mobile layout. Browser
acceptance covers exact navigation, every retained operational destination,
retired-route semantics, authenticated legacy-API tombstones and horizontal
overflow at 390px.

## Data and architecture impact

**DETECTED:** this candidate changes no Prisma schema or migration, writes no
Production data, creates no service/model/worker/queue/media system, and
changes no Article, Commercial, Programme, Casino, analytics, email or auth
authority. It adds no content and performs no commercial redirect or email.

## Release gate

The exact candidate head must pass focused CMS/Admin tests, Article and Admin
auth regressions, Programme/Casino/Affiliate/Commercial/Customer/Analytics/
Email coverage, `ci:quality`, optimized Production build, secret scan, full
browser matrix, `git diff --check`, and the five required GitHub contexts:
Agent Core, Quality, Database / Migration Verification, Build / Browser and
Vercel. Merge must use the normal protected flow. Production acceptance is
read-only and must not create an Article, invoke a commercial redirect or send
email.
