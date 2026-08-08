# RFC-013 — Production Engineering and Release Governance

## Status

Approved by Founder Office on 2026-08-08 through the OPS-01 execution authorisation.

## Decision

SevenBet will use one low-complexity production-governance path:

`feature branch → pull request → required GitHub Actions → Vercel Preview → Founder review → merge commit to main → Vercel Production → production smoke → incident or rollback when required`.

Direct pushes to `main`, automatic merge and deployments from arbitrary local branches are outside the approved path. Vercel Git deployment remains the application deployment engine. Git commits, pull requests and Vercel Git metadata remain the release identifiers; no second release-ID system is introduced.

## Repository evidence at approval

- **Detected:** `main` was unprotected and had no required GitHub checks.
- **Detected:** the repository had no GitHub Actions workflow.
- **Detected:** `npm run lint` invoked the removed Next.js `next lint` command and no ESLint toolchain was installed.
- **Detected:** Prisma defines PostgreSQL with runtime and direct URL variables and 17 existing migrations; repository CI did not prove fresh-database migration application.
- **Detected:** Vercel deploys the Git repository and uses Node.js 24.x.
- **Detected:** Vercel provides deployment/runtime logs, while repository-owned alerting, incident ownership, backup verification and rollback instructions were not established.
- **Detected:** Preview and Production currently have identical redacted database, Better Auth and admin-preview secret values. This is a high operational isolation gap; OPS-01 documents it but does not rotate unverified credentials.
- **Detected:** the Programme baseline is 36/43 because seven Mission 04 fixtures are outside the rolling 30-day validator. OPS-01 does not change Programme behaviour or fixtures.

## CI architecture

The primary CI workflow has three stable required contexts:

1. **Quality** — ESLint, TypeScript, Prisma schema validation and an explicit deterministic structural/unit manifest.
2. **Build / Browser** — production build, browser-deliverable secret scan and a Chromium-only OPS browser manifest that does not depend on shared or production data.
3. **Database / Migration Verification** — fresh PostgreSQL 16 service container, strict localhost/database-name guard, Prisma validation and generation, the existing idempotent migration-0015 enum preflight, `prisma migrate deploy`, then connected representative reads.

CI uses Vercel's verified Node.js 24 major, `npm ci`, read-only repository permissions and immutable SHAs for GitHub-owned actions. Pull-request code is never run through `pull_request_target`. No required PR job receives a production secret or production database URL.

The known Programme suite runs visibly as non-required evidence. Its failure is not hidden, and it cannot make the three deterministic checks red until its date fixtures are corrected in the governed Programme workstream.

## Browser and visual decision

The required browser manifest covers Public Shell, Protected Help, Privacy, Self-Check, Personal Gambling Limit Tracker, FAQ, managed commercial confirmation/recovery, shared Action interaction, Home and 10 Steps. It uses a locally started production build and no shared database.

The existing pixel snapshots remain valuable local Design System evidence but are not branch-required because they were authored with platform-dependent system fonts and do not yet have a controlled Linux rendering baseline. Required CI instead exercises deterministic responsive, overflow, focus, hover and semantic visual contracts. This does not reopen Design System v1.

## Database and migration policy

- Required PR verification uses only a disposable PostgreSQL 16 service on localhost.
- CI must fail before any migration command unless both Prisma URLs use the expected local host, expected port and a database name ending in `_ci`.
- Historical migration 0015 adds and uses a PostgreSQL enum value. The committed idempotent preflight runs as a separate transaction before `migrate deploy`; migration history itself is not rewritten.
- Existing migration history is immutable in OPS-01. No migration or schema change is approved.
- Future production schema changes use expand/contract compatibility across deployment boundaries.
- Application rollback uses a known-good Vercel deployment. Database recovery defaults to forward-fix; reverse SQL is never improvised.
- Production migration automation is **PROVIDER/SECRET-ARCHITECTURE GATED**. OPS-01 will not duplicate a long-lived production database credential into GitHub merely to automate deployment.

## Repository governance

After the OPS-01 pull request's exact-head contexts have succeeded, `main` will require pull requests, strict successful status checks, resolved conversations and admin enforcement where the GitHub plan permits. Force push and branch deletion remain disabled. Approval count is zero because the repository currently has one primary maintainer; this avoids creating an unsatisfiable approval policy. Merge commits remain allowed and linear history remains off.

The exact Vercel context is discovered from the OPS-01 head before it is required. No status name is guessed.

## Monitoring and incident decision

A read-only hourly GitHub Actions smoke checks representative production GET routes and valid root HTML. Failure makes the workflow visibly red. Vercel deployment/runtime logs plus the scheduled smoke, an explicit Founder/technical incident owner and tested rollback instructions are the approved low-cost v1 monitoring foundation for closed beta. This is not enterprise observability and does not remove the need to verify notification ownership after merge.

No paid monitor, Sentry SDK, new runtime health endpoint or infrastructure platform is introduced.

## Environment and secret decision

Local, CI, Preview and Production are distinct trust zones. CI is ephemeral only. Preview must use isolated non-production data and separate auth/admin secrets before mutation-capable preview use is approved. Production retains only the bounded RFC-012 fictional-data exception until its separate cleanup/replacement gate.

Secret values are never committed, printed in runbooks or copied into GitHub for PR checks. Environment documentation records names, classifications, consumers and ownership evidence only.

## Operational boundaries

OPS-01 does not change:

- Prisma schema or migration history;
- production data or the RFC-012 dataset;
- Programme behaviour, rewards, validation or Mission order;
- public product/design behaviour or Figma;
- casino scoring/ranking, jurisdiction decisions or affiliate destination logic;
- legal copy, CMS capability or analytics/tracking.

Jurisdiction authority, Programme distributed rate limiting/purge, account lifecycle, autosave/concurrency, real operator/partner evidence and legal/compliance approval remain separate release gates.

## Rejected alternatives

- Production credentials in GitHub Actions — duplicates a high-impact secret without an approved short-lived access model.
- A shared Preview/Production database — violates environment isolation and makes preview mutation unsafe.
- Kubernetes, Terraform, Redis or a paid observability vendor — no current evidence justifies the cost or operational surface.
- Automatic database rollback — unsafe for stateful migrations; reviewed forward-fix/restore is the default.
- Requiring the time-unstable Programme suite — would make branch protection non-deterministic without fixing its governed fixtures.
- Requiring platform-dependent pixel snapshots — would create runner-specific false failures; deterministic visual interaction contracts remain required.

## Success and rollback

Success requires all three exact-head GitHub checks and the discovered Vercel Preview context to succeed, repository governance to be applied or explicitly handed off as a manual blocker, and the documented local validation to pass. OPS-01 itself is not merged by the implementing agent.

If OPS-01 governance causes a release defect, revert or redeploy the last known-good application commit through the normal protected PR/Vercel flow. No production database reverse migration is authorised by this RFC.
