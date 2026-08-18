# Technical pre-production readiness

Date: 2026-08-18  
Repository: `AlexG-7BE/sevenbet-next`  
Branch: `codex/final-design-handoff-v1`  
Draft PR: `#76`  
Starting SHA: `c0f2550893b1052b92103a17078a5bd8502f0f7f`
Audited runtime/source SHA: `c0f2550893b1052b92103a17078a5bd8502f0f7f`

This is the authoritative evidence ledger for the final technical pre-production configuration pass. The documentation closure follows the runtime/source SHA above and contains no runtime change. Production remained unchanged throughout the pass.

## Evidence language

- **Detected:** directly established from repository, CI, Vercel configuration/build/runtime evidence or an existing provider event.
- **Inferred:** strongly supported but not directly observable because the active value is platform-masked.
- **Unknown:** not safely established with the available read-only authority.
- **Mismatch:** observed state conflicts with the approved contract.
- **Proposed:** a future authorised action; it was not performed in this pass.

## Executive verdict

**NOT PRE-DEPLOY READY.**

The branch code is ready and the Contact delivery receipt is verified. The current Production Cron `308` is a known old-deployment result whose source defect is fixed and tested in the branch; it is a mandatory post-deploy smoke gate, not an unresolved branch or pre-deploy code blocker.

One pre-deploy technical blocker remains: the platform-masked Production `DATABASE_URL` / `DIRECT_URL` pair has not been directly classified as pooled/direct with matching database identity. Vercel's read-only UI proved both Sensitive Production entries are present, but did not expose their values; an isolated `vercel env run --environment production` check did not make either Sensitive value available to the local readiness process. That safe failure is a tooling/authority limitation, not evidence that the deployed values are missing or mismatched.

No blind Production mutation is recommended. The minimal closure actions are recorded at the end.

## Repository and deployment baseline

- **Detected:** local, origin and PR started at `c0f2550893b1052b92103a17078a5bd8502f0f7f`; the worktree was clean; PR #76 was Open/Draft and mergeable; Production had not been deployed from this branch.
- **Detected:** runtime remediation was committed as `9a6507add82d74bf6290add45daa0d70d9d06c02` and pushed to the same branch/PR.
- **Detected:** exact-source Preview deployment `dpl_AnwQQ3KBXf5YAmTDKDvmKHH7m2TA` is Ready at `https://sevenbet-next-k2afxxgr7-alexg-7bes-projects.vercel.app`; the branch alias is `https://sevenbet-next-git-codex-final-design-9fca2f-alexg-7bes-projects.vercel.app`.
- **Detected:** the unchanged Production deployment is `dpl_BVu6YTMWUqTtGja6z2jxDg4nUVMk` at main SHA `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`.

## 1. Programme operations

Workstream status: **READY** in the audited branch. Current Production purge execution remains a known old-deployment `308`; validation of the first deployed execution is a mandatory post-deploy acceptance gate.

### Migrations

| Gate | Status | Evidence |
| --- | --- | --- |
| Migration history | **READY** | **Detected:** 19 ordered Prisma migrations, `0001` through `0019`; schema and history are internally consistent. |
| Production migration mechanism | **READY** | **Detected:** `npm run programme:migrate` runs bounded preflights then `prisma migrate deploy`; the runbook requires an explicit controlled operator step. |
| Startup mutation safety | **READY** | **Detected:** install/build generate the Prisma client only; application startup does not run `db push`, reset or migrate. |
| CI verification | **READY** | **Detected:** the remote Database / Migration Verification job creates a disposable PostgreSQL target, applies the full history and verifies representative reads. |

Prisma governs migration idempotency. No Production migration or data mutation was run.

### Retention and purge

| Gate | Status | Evidence |
| --- | --- | --- |
| Purge implementation | **READY** | **Detected:** bounded batches delete only expired pending claims, eligible expired anonymous sessions and expired runtime limiter buckets. A 24-hour anonymous-session grace and consumed-claim rules are retained. |
| Purge authentication | **READY** | **Detected:** exact Bearer `CRON_SECRET` verification uses constant-time comparison; unauthenticated live Production access returned `401`; manual Production execution requires two explicit confirmations. |
| Purge schedule | **READY** | **Detected:** source and the Vercel Cron configuration both declare `/api/internal/cron/programme-expiry-purge` at `17 4 * * *`; Cron is enabled and the Production secret is present. |
| Current Production execution | **KNOWN OLD-DEPLOYMENT FAILURE (`308`)** | **Detected:** one earlier Production execution returned `200`, followed by daily `308` responses on 2026-08-14 through 2026-08-18; a fresh read-only request to the unchanged Production alias still returned `308`. The deployed canonical-host middleware redirects the generated deployment-host Cron request before handler authentication. |
| Branch remediation | **READY; NOT A BRANCH BLOCKER** | **Detected:** the exact internal Cron path now bypasses public-host canonicalisation while adjacent paths still redirect; focused regression tests pass. After a separately authorised deployment, the exact acceptance contract below must pass. |

The purge implementation was also hardened against a serverless race: `deleteMany` now repeats the expiry/eligibility predicate together with the selected identifiers, so a limiter bucket refreshed between selection and deletion is preserved.

### Multi-instance and idempotency

| Gate | Status | Evidence |
| --- | --- | --- |
| Multi-instance safety | **PASS** | **Detected:** authoritative Programme state is PostgreSQL-backed; browser storage holds only bounded transient drafts/markers; critical server flows do not depend on local files, process locks or a single instance. |
| Idempotency | **PASS** | **Detected:** unique keys, conditional writes, `skipDuplicates`, Serializable units of work and `P2034` retry protect enrolment, claim redemption, Starting Point, progress, completion and XP award. |
| Critical concurrency tests | **PASS** | **Detected:** tests prove one claim winner, one redemption use and exact-once completion/XP under duplicate and concurrent requests. |

### Runtime logs and observability

- **Detected — Preview:** the audited current-branch window contained no Programme API `5xx`, Prisma connection/transaction/timeout failures, purge errors, AI-provider failures, repeated loops or unhandled exceptions. Observed Programme requests returned `200/201`.
- **Detected — Production:** the inspected recent window contained no Programme `5xx`, Prisma connection/transaction/timeout failures or unhandled exceptions. Two Better Auth callback outcomes were expected policy failures (`signup_disabled`, `account_link`), not Programme or database `5xx` and not Google redirect mismatch.
- **Detected:** bounded structured events, explicit HTTP failure codes, Vercel runtime/build logs, CI and the scheduled Production smoke workflow provide minimum diagnosis for Programme API, database, AI, auth and Cron failures.
- **Minimum operational observability:** **READY**. The Cron `308` was visible and attributable in existing logs; no new vendor is necessary.

## 2. Database pooling and Prisma connectivity

Workstream status: **UNKNOWN** for final Production readiness; **READY** for the exact Preview.

### Provider and intended contract

- **Provider — Detected:** Prisma Postgres through the existing Vercel integration.
- **Detected:** `prisma/schema.prisma` uses `DATABASE_URL` as `url` and `DIRECT_URL` as `directUrl`.
- **Expected runtime contract:** `DATABASE_URL` uses the Prisma pooled endpoint with `sslmode=require`, `connection_limit=1` and a finite pool timeout.
- **Expected migration/admin contract:** `DIRECT_URL` uses the matching direct Prisma endpoint with `sslmode=require`.
- **Expected identity contract:** both URLs identify the same database without comparing or logging credentials.

### Hosted classification

| Variable | Preview | Production | Classification | Correctness |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | **Detected:** present, Sensitive, Preview-scoped; deployed preflight reports pooled | **Detected:** present, Sensitive, Production-scoped; direct value unavailable to the authorised read-only check | Preview **POOLED**; Production **UNKNOWN** | Preview **VERIFIED**; Production **UNKNOWN** because the current Sensitive value could not be safely supplied to the readiness process |
| `DIRECT_URL` | **Detected:** present, Sensitive, Preview-scoped; deployed preflight reports direct | **Detected:** present, Sensitive, Production-scoped | Preview **DIRECT**; Production **UNKNOWN** | Preview **VERIFIED**; Production **UNKNOWN** |

The exact Preview Vercel build emitted only safe classifications:

`environment=preview`, `runtimeMode=pooled`, `directMode=direct`, `sameDatabaseIdentity=true`, `ready=true`.

No URL, host credential, username or password was printed. The successful Preview deployment therefore directly replaces the previous Preview pooling mismatch with verified evidence.

### Connection and migration results

- **Detected:** Prisma client construction is module-scoped. Serverless instances may create independent clients, but the verified pooled runtime URL bounds connection pressure; no process-wide lock is treated as authority.
- **Detected:** migration tooling follows Prisma's `directUrl`; CI applied all 19 migrations on a fresh database and verified reads.
- **Detected:** Prisma `6.19.3` generation and schema validation pass.
- **Detected:** Programme transaction/concurrency suites pass, including Serializable retry and exact-once paths.
- **Inferred:** current Production runtime is pooled because the runtime warning executes when the Prisma module loads in `NODE_ENV=production`, and no warning appeared in the inspected live traffic window. This is strong evidence, but not a substitute for direct classification of the masked `DIRECT_URL`.
- **Detected:** Vercel's Production environment UI shows both required entries as present, Sensitive and Production-scoped. Copying secret values is disabled, and the edit form exposes only a blank replacement field; no save was attempted.
- **Unknown:** the isolated Vercel CLI Production-environment execution omitted the Sensitive pair from the local readiness process. The sanitiser failed closed without printing a secret, no database connection/read probe was possible, the temporary CLI session was logged out, and all temporary Vercel state was deleted and verified absent.
- **Database pooling:** **UNKNOWN** for the Production pair. No Production database, environment value or row was changed. The branch will fail a future Vercel Preview or Production build unless both roles, SSL settings and redacted database identity satisfy the contract.

## 3. Contact delivery

Workstream status: **VERIFIED** for the existing Production event; no new message was sent.

### Flow and provider

- **Contact provider — Detected:** Resend, called through a server-only direct HTTPS adapter.
- **Detected flow:** `/contact` -> `POST /api/contact` -> strict JSON/body/origin/honeypot validation -> one plain-text internal provider envelope -> fixed configured destination.
- **Detected success contract:** the application returns success only after a provider `2xx`; validation failure does not invoke the provider; provider `4xx` maps to `502`; disabled, network and provider `5xx` conditions map to `503`.
- **Detected abuse control:** Vercel Firewall rule `contact-form-rate-limit` matches exact `POST /api/contact`, fixed window 600 seconds, 5 requests, IP key, response `429`.
- **Detected content safety:** bounded fields, CR/LF rejection, plain text rather than user-authored HTML, visitor email only as Reply-To, metadata-only logs, no analytics/database persistence and no provider secret in the browser.

### Configuration

| Variable | Preview | Production | Correctness |
| --- | --- | --- | --- |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | **ABSENT** for this branch; old unrelated branch-scoped entry does not apply | **PRESENT**, Sensitive, Production-scoped | **VERIFIED** by a current Production provider-delivered event and mailbox receipt |
| `RESEND_API_KEY` | **ABSENT** for this branch; old unrelated branch-scoped entry does not apply | **PRESENT**, Sensitive, Production-scoped | **VERIFIED** by provider delivery; value not exposed |
| `CONTACT_EMAIL_FROM` | **ABSENT** for this branch; old unrelated branch-scoped entry does not apply | **PRESENT**, Sensitive, Production-scoped | **VERIFIED** by provider delivery; value not exposed |
| `CONTACT_EMAIL_TO` | **ABSENT** for this branch; old unrelated branch-scoped entry does not apply | **PRESENT**, Sensitive, Production-scoped | **VERIFIED** by provider delivery plus correlated receipt in the actual configured support mailbox |

### Delivery evidence

- **Detected:** existing Production provider event `55880e83-cad4-434b-89ea-8ebdda7cd09e`, generic technical subject `[B4GAMBLE Contact] B4GAMBLE Contact Production verification`, was sent and marked `delivered` by Resend on 2026-08-13 at 17:41 local time.
- **Detected:** a bounded read-only search in the actual configured support mailbox found the exact correlated subject and timestamp in Inbox.
- **Detected:** no customer content or personal sender data was needed for correlation, no password or secret was exposed, and no new Contact message was sent.
- **Contact delivery:** **VERIFIED**.

## 4. Production configuration readiness

Workstream status: **UNKNOWN** until the Production database pair passes the sanitised contract. All other inspected release-critical configuration is either directly ready or intentionally fail-closed.

### Authoritative matrix

`SCOPED` below means the entry is restricted to the named Vercel environment or exact branch. Secret values were neither recorded nor printed.

| Name/configuration | Preview status | Production status | Correctness | Action required |
| --- | --- | --- | --- | --- |
| Source canonical origin | **PRESENT** in source | **PRESENT** in source | **VERIFIED:** `https://b4gamble.com` | None |
| `NEXT_PUBLIC_SITE_URL` | **ABSENT**; Preview derives its safe runtime behaviour | **PRESENT / SCOPED** | **VERIFIED:** canonical Production origin | None |
| `BETTER_AUTH_URL` | **ABSENT**; Preview derives exact branch authority | **PRESENT / SCOPED** | **VERIFIED:** canonical Production origin | None |
| `BETTER_AUTH_SECRET` | **PRESENT / SCOPED / Sensitive** | **PRESENT / SCOPED / Sensitive** | **VERIFIED** presence/scope; value intentionally hidden | None |
| `BETTER_AUTH_TRUSTED_ORIGINS` | **ABSENT**; Preview derives exact stable branch origin | **PRESENT / SCOPED** | **VERIFIED:** canonical origin only; `www` redirects before auth | None |
| `GOOGLE_CLIENT_ID` | **PRESENT / exact branch SCOPED** | **PRESENT / SCOPED** | **VERIFIED** configuration shape; secret not printed | None |
| `GOOGLE_CLIENT_SECRET` | **PRESENT / exact branch SCOPED / Sensitive** | **PRESENT / SCOPED / Sensitive** | **VERIFIED** presence/scope | None |
| `DATABASE_URL` | **PRESENT / SCOPED / Sensitive** | **PRESENT / SCOPED / Sensitive** | Preview **VERIFIED POOLED**; Production **UNKNOWN** | Run the sanitised Production preflight; change only if it fails |
| `DIRECT_URL` | **PRESENT / SCOPED / Sensitive** | **PRESENT / SCOPED / Sensitive** | Preview **VERIFIED DIRECT**; Production **UNKNOWN** | Run the sanitised Production preflight; change only if it fails |
| `PROGRAM_AI_PROVIDER` | **PRESENT / exact branch SCOPED** | **PRESENT / SCOPED** | **VERIFIED:** approved provider selection | None |
| `PROGRAM_AI_REAL_PROVIDER_ENABLED` | **PRESENT / exact branch SCOPED** | **PRESENT / SCOPED** | **VERIFIED:** enabled under the Founder reconciliation decision | None |
| `PROGRAM_AI_V1_ENABLED` | **PRESENT / exact branch SCOPED** | **PRESENT / SCOPED** | **VERIFIED:** enabled under the Founder reconciliation decision | None |
| `OPENAI_API_KEY` | **PRESENT / SCOPED / Sensitive** | **PRESENT / SCOPED / Sensitive** | **VERIFIED** presence/scope; value hidden | None |
| `PROGRAM_AI_OPENAI_MODEL` | **ABSENT**; source default applies | **PRESENT / SCOPED** | **VERIFIED:** approved model/default | None |
| `PROGRAM_AI_TRANSCRIPTION_MODEL` | **ABSENT**; source default applies | **PRESENT / SCOPED** | **VERIFIED:** approved model/default | None |
| `CRON_SECRET` | **ABSENT** intentionally | **PRESENT / SCOPED / Sensitive** | **VERIFIED:** unauthorised request fails `401`; an earlier scheduled invocation reached `200` | Deploy branch only with Founder authority, then require first scheduled `200` |
| Vercel Programme purge Cron | Not scheduled for Preview | **PRESENT / Production** | Branch source/schedule **READY**; current old deployment returns `308` | Mandatory post-deploy smoke after separately authorised deployment; not a branch blocker |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | **ABSENT** for this branch | **PRESENT / SCOPED / Sensitive** | **VERIFIED** by delivered provider event and mailbox receipt | None |
| `RESEND_API_KEY` | **ABSENT** for this branch | **PRESENT / SCOPED / Sensitive** | **VERIFIED** by provider acceptance | None |
| `CONTACT_EMAIL_FROM` | **ABSENT** for this branch | **PRESENT / SCOPED / Sensitive** | **VERIFIED** by provider acceptance | None |
| `CONTACT_EMAIL_TO` | **ABSENT** for this branch | **PRESENT / SCOPED / Sensitive** | Application/provider/mailbox receipt **VERIFIED** | None |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | **ABSENT**; default disabled | **PRESENT / SCOPED** | **VERIFIED:** enabled; Vercel Analytics is active on the Pro project | None |
| `AFFILIATE_REDIRECT_ENGINE_ENABLED` | **PRESENT / SCOPED**, disabled | **ABSENT**; fail-closed default disabled | **VERIFIED** disabled | None |
| `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS` | **ABSENT** | **ABSENT** | **VERIFIED** fail-closed | None |
| `CMS_PHASE1_ALLOW_DEV_ADMIN` | **ABSENT** | **ABSENT** | **VERIFIED** fail-closed | None |
| `JURISDICTION_RESOLVER_SHADOW_ENABLED` | **ABSENT** | **ABSENT** | **VERIFIED** fail-closed | None |

### Site, auth and Google

- **Site/canonical — READY:** Vercel maps `b4gamble.com` to Production and redirects `www.b4gamble.com` with `308`; sitemap, robots and canonical output use only `https://b4gamble.com`, with no localhost, `vercel.app` or former SevenBet public origin.
- **Auth — READY:** Production base/trusted-origin values match the canonical origin. `www` is intentionally handled by the canonical redirect, not added as an auth authority.
- **Google Production config — READY:** current Production callback traffic is observed at `/api/auth/callback/google`; no redirect-mismatch category appeared. Expected callback is `https://b4gamble.com/api/auth/callback/google`.
- Preview Google callback was not tested and no Google/OAuth configuration was changed.

### Programme AI, analytics and commercial posture

- **Programme AI — READY:** provider, feature flags, server-only key and Production models are present and consistent with the approved Founder reconciliation decision. Recent inspected logs had no provider-failure category.
- **Analytics — ENABLED:** the exact Production flag is true and Vercel Analytics is active. Preview defaults off.
- **Commercial activation — DISABLED:** the affiliate engine is false/absent-fail-closed and no temporary Production demo, governed operator or outbound-referral activation was detected.

### Security and secret exposure

- **Detected:** the full tracked-repository scan found no committed environment secret file; only `.env.example` and generated `next-env.d.ts` are committed in that category.
- **Detected:** the browser-deliverable build-secret scan passes; the new database preflight logs classifications only.
- **Detected:** `DIRECT_URL`, Contact credentials, `CRON_SECRET`, Better Auth/Google secrets and the OpenAI key remain server-only.
- **Detected:** Contact and Cron secrets do not reach client bundles; unauthorised purge returns `401`; Contact has same-origin, body-size, validation, honeypot and WAF controls.

## Code fixes on the existing branch

1. `lib/auth/runtime-canonical-host.ts`: allow only the exact authenticated Vercel Cron path to reach the handler on a generated Production deployment hostname; retain canonical redirects for all near paths.
2. `lib/programme/runtime-expiry-purge.ts`: reapply eligibility at deletion time to prevent deleting a record refreshed after batch selection.
3. `lib/db/vercel-database-readiness.ts` and `scripts/vercel-build-preflight.ts`: fail Vercel Preview/Production builds unless pooled runtime, direct migration URL, SSL, `connection_limit=1` and matched redacted database identity satisfy the approved contract; emit no connection value.
4. Focused regression tests cover exact Cron bypass, near-path redirect, purge refresh race and database preflight pass/fail/redaction behaviour.

## Verification

### Local

- `npm run ci:quality` — **PASS**.
- `npm run build` — **PASS**.
- `npm run ci:build-secrets` — **PASS**, 721 browser-deliverable files inspected.
- `npm run typecheck` — **PASS**.
- Focused Cron/database/Contact regressions — **PASS**, 49/49.
- `npm run programme:test` — **PASS**, 120/120.
- Programme runtime/analytics — **PASS**, 43/43 plus 3/3.
- Auth/security — **PASS**, 49/49.
- Contact/launch-polish — **PASS**, 30/30.
- Release readiness — **PASS**, 9/9.
- Prisma schema validation — **PASS**.
- `git diff --check` — **PASS**.

The local `.env` uses a direct runtime URL and therefore deliberately does not establish hosted readiness. The Vercel-only preflight skips outside Vercel; local inspection truthfully reports that local mismatch.

### Remote at starting runtime/source SHA

- Agent Core — **PASS**.
- Quality — **PASS**.
- Database / Migration Verification — **PASS**.
- Vercel — **PASS**, exact-source Preview Ready.
- Vercel Preview Comments — **PASS**.
- Build / Browser — **PASS**.

### Post-deploy Cron acceptance contract

After a separately authorised Production deployment:

1. verify `/api/internal/cron/programme-expiry-purge` is not canonical-redirected;
2. verify an unauthenticated request returns `401`;
3. verify an authorised scheduled invocation reaches the handler;
4. verify HTTP `200`;
5. verify structured `cron_result=success`;
6. verify no Programme/purge errors in runtime logs;
7. verify adjacent non-Cron deployment-host routes still follow the canonical redirect policy.

## Required pre-deploy closure action

1. **Production database pair — secure verification only.** In a Founder/platform-owner-controlled execution context that actually receives both Sensitive Production values, run the repository's sanitised readiness check and require only the safe result `runtimeMode=pooled`, `directMode=direct`, `sameDatabaseIdentity=true`, `ready=true`. Do not reveal or deliberately materialise either URL. If the check reports a mismatch, stop and separately authorise the exact correction; do not infer or mutate blindly. **Production mutation performed: NO.**

The Contact closure is complete. Programme Cron execution is a post-deploy acceptance gate and not a remaining pre-deploy branch blocker.

## Founder authority required

- Approve or reject merge/Production deployment of Draft PR #76; neither occurred here.
- Provide a secure execution context with access to both Sensitive Production database values, or have the platform owner run the sanitised check and return only its classifications. Approve any correction only if that check directly proves a mismatch.

## Production status

**UNCHANGED.** No Production deployment, environment/configuration change, database operation, migration, Cron change, DNS change, Google OAuth change, secret rotation or external message was performed.
