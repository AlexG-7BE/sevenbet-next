# Database Backup and Recovery

## Status

**RECOVERY-01: PARTIAL.** RFC-024 is approved and the 2026-08-11 Preview-sourced logical restore drill passed. Production still has no automatic backup, retained restore point or provider-native recovery evidence on the current Free plan. The logical drill proves that a Preview backup can produce a usable isolated database; it does not provide a recurring Production backup or satisfy the ongoing RPO target.

The internal closed-beta targets are RPO no greater than 24 hours, RTO no greater than 4 hours and at least seven daily restore points or equivalent provider-native recoverability. These are internal objectives, not customer promises, SLAs or public copy.

## Database identities

| Environment | Resource | Immutable Vercel resource ID | Connection | Detected plan | Backup state |
| --- | --- | --- | --- | --- | --- |
| Preview | `sevenbet-preview` | `store_hLPkkgamL7rJNmCe` | Preview only | Free | No backups available |
| Production | `prisma-postgres-cobalt-school` | `store_1I4F54ETrwSKS42o` | Production only | Free | No backups available |

**Detected on 2026-08-11:** Vercel resource inspection reported both resources available and owned. Preview and Production connection-authority fingerprints were `DIFFERENT`. The exact fingerprints are operational evidence, not durable credentials; repeat the comparison before every drill or incident.

Never identify a database by display name alone. Require the immutable resource ID, environment connection, parsed database authority and safe SHA-256 fingerprint. A `MATCH` or `UNKNOWN` relation stops work.

## Provider capability audit

| Capability | Production | Preview | Classification and evidence |
| --- | --- | --- | --- |
| Automatic backup state | **No** | **No** | **Detected:** each live Prisma Console Backups page reported `No Backups Available` and required a Starter, Pro or Business upgrade. |
| Snapshot capability | Not available on Free | Not available on Free | **Documented:** [Prisma backups](https://www.prisma.io/docs/postgres/database/backups) list snapshots for Starter, Pro and Business. |
| Schedule | None | None | **Documented for paid plans only:** daily on days with database activity. |
| Retention | None | None | **Documented for paid plans only:** Starter/Pro last seven days; Business last 30 days. |
| Point-in-time recovery | Not available | Not available | **Documented:** the detailed backup page describes fine-grained/PITR restore as future functionality. The broader overview currently conflicts; use the detailed feature contract and live console conservatively. |
| Latest recoverable timestamp | None | None | **Detected:** no snapshot or recovery range exists on either live backup page. |
| Provider restore | No point to restore | No point to restore | **Documented:** Prisma Console says an available snapshot can restore to a new or existing database. The Management API's existing-target restore is destructive. B4GAMBLE permits a newly created isolated target only. |
| Restore permissions | Not exercised | Not exercised | **Detected:** authenticated Vercel-to-Prisma console access can inspect backups. **Unknown:** exact least-privilege restore role; verify before provider-native recovery. |
| Billing dependency | Starter or higher | Starter or higher | **Documented:** current [Prisma pricing](https://www.prisma.io/pricing) starts Starter at USD 10/month with seven-day daily backups. No upgrade is authorised. |
| Region | Unknown | Unknown | **Unknown:** current region is not exposed by the inspected Vercel resource metadata or Prisma database settings. Do not infer it from Prisma's available-region list. |
| Encryption/storage | General service claim only | General service claim only | **Documented:** Prisma states encryption at rest and in transit; direct connections require SSL. Snapshot-specific storage location and encryption details are not documented by the detailed backup page. |

Production backup state before RECOVERY-01 was **NO** and after RECOVERY-01 is **UNCHANGED / NO**. No provider setting, plan, deployment, runtime route or Production row changed.

## Passed isolated restore drill — 2026-08-11

| Evidence | Result |
| --- | --- |
| Source | Preview `store_hLPkkgamL7rJNmCe`; no Production dump or data |
| Recovery canary | Synthetic `AnonymousProgrammeSession` root plus related `PendingProgrammeClaim`; UUID `1a7a055d-f073-497a-85fe-e575c0f26ea1`; safe combined hash `e36ff1d63dd26a2ada68d83a26ab645bae7b49fee7f2f1484b8a03bd8d40d71b` |
| Backup point | `2026-08-11T06:26:08.767Z` |
| Backup method | PostgreSQL 17 `pg_dump`, custom format, no owner/ACL replay, direct Preview connection |
| Backup artifact | 244,999 bytes; SHA-256 `d4056704221dba1c0d32f01735dc183d8b9fd485374738e37d1324d96c1c6b36`; private mode `0600`; deleted after verification |
| Target | Disposable local PostgreSQL 16.14, loopback only, database `sevenbet_recovery_20260811_fuh8t3`, safe fingerprint `e094a5712666d9b53d7e3048d94648596a76f5ed6049d7708722b45941fd6a29` |
| Identity proof | Source `PREVIEW`; target `RECOVERY_TEMP`; source/target and Preview/Production relations `DIFFERENT` |
| Compatibility handling | Excluded only the provider-owned `prisma_postgres` extension and removed the PostgreSQL 17-only `SET transaction_timeout = 0`; standard `pgcrypto`, application schema and data remained |
| Repository migrations | 18/18 exact parity through `0018_program_ai_m1_foundation` |
| Selected count parity | PASS across 12 migration/auth/Programme tables |
| Schema fingerprint | Source and restored target `23c26a4a98f8651ef71ab5958abde5c0935315016e6230cb5f6c478b9f0ea327` |
| Canary/FK integrity | Exact root/child parity PASS; orphan count zero |
| Auth/session structure | PASS without attempting login/session reuse |
| Programme structure | PASS without OpenAI or other provider calls |
| Application read | `ProgrammeSessionRepository` read the restored canary and related claim — PASS |
| Prisma checks | `prisma validate` and `prisma generate` PASS |
| Duration | Approximately 4 minutes 45 seconds from canary creation to full cleanup; not a Production RTO guarantee |
| Preview cleanup | Exact canary UUID/hash/child relation rechecked; deletion and absence verification PASS |
| Target cleanup | Three exact local attempt database names confirmed; temporary server stopped; entire private drill directory removed |
| Cost | USD 0; no recurring commitment |

The first fresh target stopped before schema creation because the PostgreSQL 17 restore client emitted `transaction_timeout` to PostgreSQL 16. The second fresh target stopped on the provider-only `prisma_postgres` extension. Neither target was reused. The third fresh target used the bounded compatibility handling above and passed. Recording these failed attempts prevents a future operator from improvising or retrying over a partial target.

## Normal recovery tooling

- `npm run recovery:preflight` classifies and compares source, target, Preview and Production authorities. It requires the exact acknowledgement and refuses Production, matching, malformed, missing, non-loopback or unknown identities.
- `npm run recovery:canary -- create|cleanup` creates and removes the Preview-only structural canary. It requires separate Preview mutation authority.
- `npm run recovery:verify -- capture|verify` captures safe source evidence and verifies the restored target. Evidence contains counts, hashes, migration names and PASS/FAIL only.
- `npm run recovery:test` runs deterministic guard and structural tests without live credentials or databases.

The repository deliberately contains no Production restore script. Commands receive credentials through process environment only; URLs and passwords must never appear in command output or shell history.

## Incident runbook

### Incident quick answers

| # | Operator question | Current answer |
| --- | --- | --- |
| 1 | What is backed up? | No managed Production or Preview snapshot exists. The drill backed up the complete Preview PostgreSQL database at one point in time, including schema, migration history and Preview test/synthetic rows. |
| 2 | Which database is Production? | `prisma-postgres-cobalt-school`, immutable resource ID `store_1I4F54ETrwSKS42o`. |
| 3 | Which database is Preview? | `sevenbet-preview`, immutable resource ID `store_hLPkkgamL7rJNmCe`. |
| 4 | What is the current backup mechanism? | No recurring managed mechanism on Free. The proven fallback is a private custom-format logical Preview dump for isolated verification only. |
| 5 | What is the current retention? | Zero managed restore points. Paid Starter/Pro documentation says the last seven activity-day daily snapshots; that is not enabled or tested here. |
| 6 | What is the internal RPO target? | No greater than 24 hours. Current managed capability does not meet it. |
| 7 | What is the internal RTO target? | No greater than 4 hours. The 4m45 Preview drill is useful evidence, not a Production guarantee. |
| 8 | How is an outage/data-loss event identified? | Production Smoke plus Vercel deployment/runtime evidence, application errors and database/provider state; broad loss/corruption or personal-data compromise is SEV-1. |
| 9 | Who decides to restore? | Founder Office as incident commander, with the verified provider/project owner and technical responder executing. |
| 10 | How is a restore point selected? | Choose the newest coherent available point with an acceptable explicitly recorded loss window; never infer one when the provider lists none. |
| 11 | Why restore to a new isolated target first? | It preserves the original, prevents overwrite, supports validation before traffic and makes a failed attempt abandonable. |
| 12 | How is the target proven not to be Production? | Match immutable control-plane IDs, compare credential-free connection fingerprints, require `TARGET=RECOVERY_TEMP` and stop on `MATCH` or `UNKNOWN`. |
| 13 | How is the target validated? | Connectivity, exact migrations, selected counts, schema fingerprint, canary/relation/FK integrity, auth/Programme structure, repository read, Prisma validation/generation and external-provider-off checks. |
| 14 | When can traffic switch? | Only after validation and a separate Founder Office decision covering compatible application SHA, credentials and monitoring. A completed restore alone is insufficient. |
| 15 | Which secrets may need rotation? | Database URLs, Vercel tokens, Better Auth/admin credentials and any exposed Google/OpenAI/provider credentials, according to incident scope. |
| 16 | How is a failed attempt rolled back? | Leave the source unchanged, abandon/destroy the exact failed target, understand the failure, then use a fresh isolated target; never reverse-SQL or retry over a partial restore. |
| 17 | How is privacy preserved? | Minimise access; never copy Production personal data into drills or evidence; retain only safe IDs, hashes, counts, migration names, timestamps and results. |
| 18 | How are temporary copies destroyed? | Verify the exact target identity, disconnect and delete it (or stop the exact local server and remove its validated private directory), verify deletion, and record any provider operation ID. |

### 1. Detect, contain and decide

1. Correlate the hourly Production Smoke, Vercel deployment/runtime logs and exact application SHA. Treat destructive loss, broad corruption or personal-data compromise as SEV-1.
2. Freeze releases and, when continued writes increase harm, freeze mutation through the safest existing operational control. Do not improvise SQL.
3. Founder Office is incident commander and restore decision owner. The technical responder and verified Vercel/Prisma project owner execute the approved procedure. Suspected personal-data exposure also follows the breach runbook.
4. Confirm Production resource ID `store_1I4F54ETrwSKS42o`, current connection fingerprint and provider backup page. If any identity is unknown, stop.

### 2. Select the recovery point

1. List available provider restore points without restoring. Record timestamps, plan, retention and provider operation IDs outside public logs.
2. Select the newest coherent point whose expected loss window is acceptable. State the estimated data-loss interval against the internal 24-hour RPO.
3. If no provider restore point exists, the current Production recovery gate is blocked. A Preview logical dump is drill evidence only and cannot recover Production.

### 3. Restore to a new isolated target

1. Create a new target with an unmistakable recovery name under separately confirmed plan/cost authority. Never restore over Production or Preview.
2. Keep it disconnected from Vercel environments and all public/external systems.
3. Record the new immutable resource ID. Run `recovery:preflight`; require `SOURCE=PREVIEW` for drills or a separately Founder-authorised Production incident source, `TARGET=RECOVERY_TEMP`, and all relations `DIFFERENT`.
4. During drills, use the Preview canary. During a real incident, never add a Production canary.
5. Restore the selected provider point or the separately approved secure backup. Do not accept overwrite prompts for a shared target.

### 4. Validate before any traffic decision

Require connectivity, exact repository migrations for the selected application SHA, selected count/integrity checks, no schema drift, representative repository reads, auth/session structural checks and a local smoke with external providers disabled. Inspect no private narrative merely to prove restore.

Traffic switching is a separate Founder Office decision after validation, compatible application deployment selection, credential review and monitoring readiness. Restore completion alone is insufficient.

### 5. Secrets and rollback

After suspected compromise, assess and rotate database connection strings, Vercel tokens, Better Auth/admin secrets and any exposed provider credentials. Coordinate rotation with connection verification and a known rollback path; do not rotate unrelated secrets during a drill.

If a restore attempt fails, abandon that target. Never retry over a partially restored target, run reverse SQL or mutate the source. Create a new isolated target only after the failure is understood and identity preflight passes again. The original database remains unchanged until an approved cutover.

### 6. Privacy and temporary-copy destruction

Use minimum necessary access. Do not copy Production personal data to Preview, developer-visible evidence, GitHub Actions, Vercel artifacts, Drive or object storage. Evidence is limited to safe IDs, hashes, counts, migration names, timestamps and outcomes.

After evidence/cutover, confirm the exact temporary resource ID, disconnect it, delete it through the provider, verify deletion and record the provider operation ID. For local drills, stop the exact temporary server, validate its data-directory identity and remove the entire private directory. If deletion identity is ambiguous, leave the target disconnected and return `MANUAL RECOVERY TARGET CLEANUP REQUIRED` with its immutable ID.

## Remaining Founder action

`FOUNDER ACTION REQUIRED — PRODUCTION BACKUP CONFIGURATION`

Approve or decline the smallest recurring plan change that supplies managed snapshots. If approved, upgrade the exact Production Prisma Postgres installation to at least Starter, verify billing ownership and no runtime/resource replacement, wait for and inspect the first snapshot, confirm the actual region/retention/permissions, then run a Preview-snapshot restore into a new isolated provider target. Only that evidence can move RECOVERY-01 from `PARTIAL` to `CLOSED`.
