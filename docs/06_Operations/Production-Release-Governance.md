# Production Release Governance

This is the default operational path. [Decision & Documentation
Governance](../GOVERNANCE.md) controls internal authority: a current explicit
Founder instruction may approve merge, deployment or another bounded action
without a redundant second decision. Repository/platform permissions and
external technical, legal and evidence constraints still apply.

## Approved flow

`branch → pull request → required GitHub checks → Vercel Preview → Founder review → merge to main → Vercel Production → production smoke`

- **Detected:** Vercel is linked to this Git repository and Production uses Node.js 24.x.
- **Detected:** the repository supplies three deterministic CI contexts: `Quality`, `Build / Browser`, and `Database / Migration Verification`.
- **Detected during OPS-01:** `main` branch protection is enabled and currently requires pull-request delivery; strict, up-to-date `Quality`, `Build / Browser`, `Database / Migration Verification`, and `Vercel` contexts; resolved review conversations; administrator enforcement; zero required approvals for the current single-maintainer model; and no force push or branch deletion.
- **Detected:** [PR #45](https://github.com/AlexG-7BE/sevenbet-next/pull/45) is merged at `e140f4d`; required branch protection and successful Production Smoke evidence are active.
- **Detected:** ENV-ISO-01 [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) merged under explicit Founder Office authority as `a954243`; exact-merge main CI, Production deployment, Production Smoke and real staff auth E2E passed. The environment-isolation/configuration incident is closed.
- **Default prohibited:** direct Production mutation, automatic PR merge, force
  push, branch deletion, Production credentials in PR CI, or deployment from
  an arbitrary local branch. A Founder instruction may change an internal
  execution boundary for an explicit scope, but it does not bypass branch
  protection, platform permissions or external constraints.

The Git commit SHA is the release identifier. Record the pull request and Vercel deployment URL in the release/incident record; do not create a parallel ID.

## Read-only Vercel build boundary

The Vercel Production build is an application compatibility gate, not an
implicit database executor. Its Production database access is read-only and
may fail the deployment when migration, schema or required business state is
incompatible. The build must never repair that state.

Keep these release operations separate:

1. apply and verify an authorised schema migration DB-first;
2. execute and verify any authorised business-data migration/reconciliation;
3. deploy the compatible application through Git/Vercel with read-only checks.

The canonical build-side-effect classification is:

| Build component | Allowed effect |
| --- | --- |
| `prisma generate` during dependency install | Writes generated build files only; no database connection or business mutation |
| `scripts/vercel-build-preflight.ts` | Reads environment, repository migration files, migration/schema/business invariants; its Production queries and optional historical commercial audit are PostgreSQL-enforced read-only |
| `scripts/logo-only-media-build-preflight.ts verify` | Reads published-logo and retired-media authority state in a PostgreSQL read-only transaction |
| `scripts/casino-real-catalog-03.ts verify` | Reads six governed catalog publications, scores, market facts, snapshots, safe offers and protected authority state in a PostgreSQL read-only transaction |
| `next build` | Writes application build artefacts; database-backed application routes remain dynamic and no business-data mutation is authorised |

Do not add reconciliation, repair, seed, ingestion, publication, activation or
`prisma migrate deploy` commands to `vercel.json`. The explicit
release-governance structural and disposable-PostgreSQL tests are required
regression evidence for changes to this chain.

### 13 September 2026 build-mutation incident

Commercial Core PR2 did not introduce the defect. During its otherwise healthy
Production deployment, the pre-existing
`casino-real-catalog-03.ts build-preflight` command ingested/reconciled and
republished the governed catalog, creating 30 `CasinoRevision` rows, six
`EditorialReviewRevision` rows and 66 `AuditLog` rows. The adjacent
`gp-meta.ts` step was also write-capable, although its GoldenPlay metadata was
already current and it performed no write in that deployment. Commercial
routes and PR2 authority state were unchanged.

The remediation removes both writers from the build, uses explicit catalog and
logo `verify` modes, and retains all historical revision/publication/audit rows
as truthful evidence. It does not authorise cleanup or rewriting of that
history. Until the remediation PR is reviewed, merged and deployed, treat the
current canonical Production build configuration as an open release-control
defect.

## Risk classification

| Risk | Examples | Minimum release treatment |
| --- | --- | --- |
| Low | Documentation, non-runtime test, reversible copy/style change | Required checks, Preview inspection, normal smoke |
| Medium | Runtime logic, dependency patch, authentication-adjacent or CMS behaviour | Required checks, focused regression evidence, explicit rollback trigger, Founder review |
| High | Schema/data migration, auth/secret model, affiliate destination, jurisdiction, Protected Help, Programme, privacy/compliance | Relevant current durable decision record, named technical and decision owners, staged/non-production proof, explicit rollback/recovery plan; use an RFC when the change materially alters durable architecture; stop for unresolved external or factual blockers |

## Pre-merge checklist

1. Confirm the change is aligned with the current Founder instruction, Current State, Product Vision and the relevant `ACTIVE` RFCs, if any.
2. Confirm the pull request head SHA is the reviewed SHA.
3. Confirm all four required contexts are green on that exact SHA.
4. Inspect Vercel Preview without creating or modifying Production data.
5. Confirm no CI job received a hosted Production or Preview secret.
6. For schema work, complete [Database Migrations](Database-Migrations.md) and [Backup and Restore](Backup-and-Restore.md) gates.
7. Confirm the Vercel build command contains only read-only Production
   compatibility checks and application compilation; exercise Production-mode
   verifier paths against disposable PostgreSQL where applicable.
8. Record risk, rollback trigger and post-release owner in the PR.
9. Confirm current Founder/project execution authority covers the merge. Do not
   require a second Founder decision when an explicit current instruction
   already covers it. The implementing agent does not merge unless that current
   instruction explicitly authorises the agent to do so.
10. For BRAND-CUTOVER-01, Founder/Operations sets and verifies `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` as `https://b4gamble.com` in Production only before merge, without triggering a deployment or mutating the current Production application.

## Post-merge verification

1. For BRAND-CUTOVER-01, confirm the automatic Production deployment built with the pre-verified B4GAMBLE Production environment contract; do not perform a separate environment-change redeploy after merge.
2. In Vercel, confirm the Production deployment source commit equals the merged `main` SHA and status is Ready.
3. Run `npm run ops:smoke` against the fixed canonical Production origin `https://b4gamble.com`. The script performs read-only GET requests only.
4. Confirm `/`, `/responsible-gambling`, `/privacy`, `/terms`, `/self-check`, `/tools/budget-calculator`, `/faq`, `/casinos`, and `/bonuses` return HTTP 200; root must return HTML.
5. Review Vercel deployment/runtime logs for new errors without copying personal data, protected Self-Check answers, limit values, Programme data, raw affiliate URLs or secrets into the incident record.
6. Observe the next scheduled `Production Smoke` result and confirm its GitHub notification reaches the accountable owner.

## Rollback decision

Rollback triggers include sustained 5xx responses, broken Protected Help, authentication lockout, unsafe commercial routing, an unapproved data mutation, or a confirmed privacy/security defect.

### Application

1. Declare the incident and freeze unrelated releases.
2. Identify the last known-good Production deployment by its verified Git SHA in Vercel.
3. Prefer a reviewed revert PR. When severity requires immediate recovery, the Founder/technical responder may promote or redeploy the verified known-good deployment through Vercel, then open the corrective PR.
4. Re-run the smoke and inspect logs. Record deployment URLs and SHAs, never secrets.

### Configuration

Restore only a previously verified configuration version/value through Vercel's protected settings. Do not infer or reconstruct a secret. Redeploy if required, smoke, and rotate a secret when exposure is suspected.

### Content or fictional data

Use the owning, approved CMS/data procedure. Do not run the temporary Production demo seed or cleanup scripts as a general rollback tool. RFC-012 remains the only authority for its bounded fictional dataset.

### Database

Do not improvise reverse SQL or edit migration history. Stop writes when necessary, forward-fix when safe, or use the provider-verified restore process in [Backup and Restore](Backup-and-Restore.md). Application rollback is not proof of schema rollback safety.
