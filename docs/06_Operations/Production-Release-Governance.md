# Production Release Governance

## Approved flow

`branch → pull request → required GitHub checks → Vercel Preview → Founder review → merge to main → Vercel Production → production smoke`

- **Detected:** Vercel is linked to this Git repository and Production uses Node.js 24.x.
- **Detected:** the repository supplies three deterministic CI contexts: `Quality`, `Build / Browser`, and `Database / Migration Verification`.
- **Detected during OPS-01:** `main` branch protection is enabled and currently requires pull-request delivery; strict, up-to-date `Quality`, `Build / Browser`, `Database / Migration Verification`, and `Vercel` contexts; resolved review conversations; administrator enforcement; zero required approvals for the current single-maintainer model; and no force push or branch deletion.
- **Detected:** [PR #45](https://github.com/AlexG-7BE/sevenbet-next/pull/45) is merged at `e140f4d`; required branch protection and successful Production Smoke evidence are active.
- **Detected:** ENV-ISO-01 [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) merged under explicit Founder Office authority as `a954243`; exact-merge main CI, Production deployment, Production Smoke and real staff auth E2E passed. The environment-isolation/configuration incident is closed.
- **Not authorised:** direct Production mutation, automatic PR merge, force push, branch deletion, production credentials in PR CI, or deployment from an arbitrary local branch.

The Git commit SHA is the release identifier. Record the pull request and Vercel deployment URL in the release/incident record; do not create a parallel ID.

## Risk classification

| Risk | Examples | Minimum release treatment |
| --- | --- | --- |
| Low | Documentation, non-runtime test, reversible copy/style change | Required checks, Preview inspection, normal smoke |
| Medium | Runtime logic, dependency patch, authentication-adjacent or CMS behaviour | Required checks, focused regression evidence, explicit rollback trigger, Founder review |
| High | Schema/data migration, auth/secret model, affiliate destination, jurisdiction, Protected Help, Programme, privacy/compliance | Approved governing RFC, named technical and decision owners, staged/non-production proof, explicit rollback/recovery plan; stop if any release gate is unknown |

## Pre-merge checklist

1. Confirm the change is aligned with Product Vision, Project State, Roadmap and its governing RFC.
2. Confirm the pull request head SHA is the reviewed SHA.
3. Confirm all four required contexts are green on that exact SHA.
4. Inspect Vercel Preview without creating or modifying Production data.
5. Confirm no CI job received a hosted Production or Preview secret.
6. For schema work, complete [Database Migrations](Database-Migrations.md) and [Backup and Restore](Backup-and-Restore.md) gates.
7. Record risk, rollback trigger and post-release owner in the PR.
8. Founder Office makes the merge decision. The implementing agent does not merge its delivery PR.
9. For BRAND-CUTOVER-01, Founder/Operations sets and verifies `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` as `https://b4gamble.com` in Production only before merge, without triggering a deployment or mutating the current Production application.

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
