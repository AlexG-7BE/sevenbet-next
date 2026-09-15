# Production Hardening Closure — 15 September 2026

**Authority:** explicit Founder Office final-closure instruction<br>
**Decision:** `GO — HARDENING CYCLE CLOSED`<br>
**Production origin:** `https://b4gamble.com`<br>
**Audited source:** `cf2aa0e66744955b6580d985645931142dad3a07`<br>
**Audited deployment:** `dpl_AZksXiaYyh3UKpxfeeZez6Nghggc` (`READY`, promoted)<br>
**Migration head:** `0042_admin_mfa`

This is the durable closure record for the bounded final audit. It does not
reopen or replace historical RFC decisions. Documentation-only commits may
advance `main` and produce an equivalent Vercel rebuild after the audited
runtime baseline; live GitHub and Vercel evidence controls the exact current
head/deployment when that distinction matters.

## Closed controls

| Control | Result | Current evidence |
| --- | --- | --- |
| P0-A anonymous mutation route retirement | `VERIFIED CLOSED` | Both obsolete route directories are absent. Anonymous Production GETs to `/api/internal/goldenplay-score-publish-20260911` and `/api/internal/gp-linkhash-fix-20260911-c91a7e` return 404. No replacement anonymous mutation surface was detected. |
| P0-B Next.js / Sharp floor | `VERIFIED CLOSED` | Exact Next.js and `eslint-config-next` parity at `15.5.24`; one effective Sharp resolution at `0.35.4`; release-governance regression passed. |
| P1 Email Reliability | `VERIFIED CLOSED` | Existing `EmailMessage` only; guarded atomic claim, stale-claim recovery, bounded retry, CAS settlement, campaign-parent authority, final consent/suppression recheck and auth-email recovery remain. Exact-source PostgreSQL concurrency/reliability CI passed. No real email was sent. |
| P1 Production CI Gate | `VERIFIED CLOSED` | Protected `main`; strict five-context gate: `Agent Core`, `Quality`, `Database / Migration Verification`, `Build / Browser`, `Vercel`; administrator enforcement and conversation resolution enabled; force pushes and deletion disabled. |
| P1 Admin/Auth Security | `VERIFIED CLOSED` | Official Better Auth TOTP; one linked privileged Admin, one verified factor and two-factor enabled; no factor failure/lock; trusted-device lifetime zero; Google cannot establish an Admin session and no Google OAuth token material is persisted; `AdminUser` remains authorization authority; retired preview-token bypass denied. |
| P1 outbound `/r` abuse protection | `VERIFIED CLOSED` | Active Vercel Firewall rule `rule_outbound_redirect_rate_limit_HYMi7L`: `/r/*`, GET or HEAD, IP key, fixed window, 60 requests per 60 seconds, edge rate-limit response. Commercial routing and the click writer are unchanged. |

The Vercel Firewall also reports the expected enabled contact, auth-entry and
second-factor rules, for four active rules total, with no inactive rule or
unpublished change.

## Database and Production evidence

A repeatable-read transaction first enforced and read back
`transaction_read_only=on`. It returned aggregate counts and invariants only:

- repository and Production both have 42 effective migrations through
  `0042_admin_mfa`;
- 44 raw migration-ledger entries comprise 42 successful migrations and two
  resolved rolled-back attempts;
- zero unresolved, unknown or applied-checksum-mismatched migrations exist;
- `0042_admin_mfa` is applied exactly once;
- Mission 10 has zero enrollment-completion timestamp mismatches and XP has no
  negative event;
- there is no active legacy `ZZ` route, impossible outbound-click state, or
  queued/sending/failed email backlog; and
- `TwoFactor` is present while the retired OAuth-client and Commercial MCP
  rate-bucket tables are absent.

The canonical aliases `b4gamble.com`, `www.b4gamble.com`,
`sevenbet-next.vercel.app` and the main-branch alias resolve to the audited
deployment. Bounded HTTP smoke passed for Home, Casinos, a representative Rizk
profile, Bonuses, anonymous auth session, Admin denial, both retired P0 routes
and image optimization. The anonymous session response was `null`; `/admin`
returned 307 to its login boundary. A six-hour error-level query for the exact
deployment returned no runtime events.

## Recovery

**P1 RECOVERY PROOF — ACCEPTED EXCEPTION**

**FOUNDER-ACCEPTED EXCEPTION:** Prisma managed Production backups are assumed
to continue automatically on their normal daily cadence. Seven consecutive
successful daily Production snapshots were present during the recovery audit;
the newest observed point was `backup-01m2h5wzvms79ywv4hyt3833kz` at
`2026-09-15T00:01:37.140Z`. It predated the successful `0042_admin_mfa`
migration. No provider-native post-MFA isolated restore was performed and no
safe provider on-demand backup creation mechanism was detected.

This is not a claim that post-MFA restore was tested or empirically proved.
Under the explicit Founder decision, the remaining uncertainty is an accepted
operating residual and is not a blocker to this hardening cycle. The closure
audit did not wait for a backup, create an automation, run `pg_dump`, create a
recovery target, or mutate Preview or Production.

## Preserved authority invariants

- Commercial authority remains trusted exact GEO → exact
  `MarketActivation` → factual route/binding/destination/legal/health checks →
  governed action or null. CRM, analytics, ranking, media, lifecycle labels,
  parent/`ZZ` GEO and retired MCP/OAuth transport do not grant authority.
- Programme authority remains persisted server state. Mission 10 and enrollment
  completion timestamps agree; XP/reward/replay invariants and persisted-state
  analytics remain covered by regression evidence.
- Successful click persistence remains one transaction containing
  `OutboundClick`, canonical `AnalyticsEvent` projections and the success-only
  `AffiliateOutboundClickDaily` projection. Analytics failure does not decide
  the redirect, and detailed/aggregate histories remain separate semantics.

## P2 and residual classification

| Item | Status | Material reason |
| --- | --- | --- |
| Consent serialization edge case | `DEFERRED P2` | Concurrent consent writes can both classify from the same prior event because the append transaction has no explicit subject lock/serializable retry. Current preference enforcement is independent; no concrete Production privacy bypass or ledger corruption was detected. |
| Retention/concurrency race | `DEFERRED P2` | Bounded retention selects IDs and then deletes by ID without rechecking the cutoff/state predicate. The race window is real but bounded to retention execution; no active critical-data loss or corruption was detected. |
| Affiliate-health pinned-IP hardening | `DEFERRED P2` | DNS is validated before `fetch`, so DNS rebinding remains a theoretical lookup-to-connect gap. The runner is exact-Bearer protected and reads governed canonical route destinations; there is no anonymous attacker-controlled Production target path. |
| `sanitize-html` advisory | `DEFERRED P2` | Installed `2.17.5` is in the affected advisory ranges. B4GAMBLE allows neither `textarea`/`xmp` nor SVG/SMIL tags or attributes, allows only HTTPS `a.href`, revalidates canonical links, and accepts template mutations only from authorized Admins. Same-options probes discarded the exploit elements. The current paths required by [GHSA-jxwj-j7wr-gfrw](https://github.com/apostrophecms/apostrophe/security/advisories/GHSA-jxwj-j7wr-gfrw) and [GHSA-g8qq-57p8-ggw5](https://github.com/advisories/GHSA-g8qq-57p8-ggw5) are not materially reachable. |
| Development-only `js-yaml` issue | `DEFERRED P2` | `4.3.1` is present only through the ESLint development chain and no application/script import exists. No untrusted YAML reaches a Production runtime path. |
| Stale Preview environment configuration | `DEFERRED P2` | Stale variables are Preview- or branch-scoped; retired preview-token variables are absent from Production. Preview cannot grant Production authority or satisfy the Production release gate. |
| Preview database drift | `DEFERRED P2` | Preview resource `store_hLPkkgamL7rJNmCe` is connected only to Preview; Production resource `store_1I4F54ETrwSKS42o` is connected only to Production and has a distinct authority fingerprint. Production verifiers skip Preview and required CI uses disposable PostgreSQL. |
| Post-MFA provider restore proof | `ACCEPTED RESIDUAL` | Actual post-MFA isolated restore was not performed. The explicit Founder exception accepts the daily managed-backup assumption and residual restore uncertainty for this cycle. |

None of these items currently demonstrates a path to Production compromise,
Admin or Commercial authority bypass, critical-data loss/corruption, serious
privacy breach, core-operation failure or severe user-facing failure.

## Verification evidence

- Exact source required contexts: five of five successful.
- Focused deterministic suites: release governance 8/8, auth 57/57, recovery
  25/25, customer-data core 32/32, MVP runtime 40/40, Commercial Core PR4
  76/76, PR5 83/83 and PR6 15/15.
- Exact-source database CI: migrations, release governance, customer-data core,
  email reliability/concurrency and one-connection Production reliability all
  successful against disposable PostgreSQL.
- This closure introduced no runtime service, queue, outbox, authority, database
  model, migration, Vercel configuration or Production data mutation.

## Reopen conditions

Reopen this hardening area only for concrete new evidence:

- managed backup jobs stop succeeding, provider backup/restore behavior changes
  materially, or an actual recovery incident cannot meet the approved process;
- a material Admin/auth bypass, MFA failure or persisted credential/token
  exposure is discovered;
- the five-context protected-main gate is disabled or bypassed;
- anonymous mutation routes reappear or a critical reachable dependency exploit
  is established;
- Commercial authority regresses, Programme persisted-state invariants fail, or
  a competing/partial click writer appears; or
- a current Production incident causes critical-data loss, serious privacy
  impact, sustained core-operation failure or severe user-facing failure.

Routine dependency freshness, Preview-only drift and the accepted recovery
uncertainty do not by themselves reopen this cycle.
