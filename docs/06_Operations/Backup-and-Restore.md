# Database Backup and Recovery

## Status

**RECOVERY-01: MANAGED RESTORE DRILL COMPLETE.** RFC-024 is approved. The Preview-sourced logical restore drill passed, Starter is detected for the exact Vercel-billed Prisma workspace, completed managed Production snapshots are visible, and provider-native Preview snapshots restored into fresh isolated databases and passed validation. The final follow-up used a completed snapshot containing the synthetic structural canary, proved exact canary parity, and deleted both the target and canary with absence verification. Production remained read-only; any Production restore still requires separate incident authority.

The internal closed-beta targets are RPO no greater than 24 hours, RTO no greater than 4 hours and at least seven daily restore points or equivalent provider-native recoverability. These are internal objectives, not customer promises, SLAs or public copy.

## Database identities

| Environment | Resource | Prisma database ID | Immutable Vercel resource ID | Connection | Detected plan | Backup state |
| --- | --- | --- | --- | --- | --- | --- |
| Preview | `sevenbet-preview` | `cn8xojfxs6i5z82riihkfjfy` | `store_hLPkkgamL7rJNmCe` | Preview only | Starter, workspace inherited | 6 completed snapshots |
| Production | `prisma-postgres-cobalt-school` | `cmrixqbwl21xqyif8ab2vr2xw` | `store_1I4F54ETrwSKS42o` | Production only | Starter, workspace inherited | 14 completed snapshots |

**Detected on 2026-08-11:** both databases belong to Prisma workspace `cmrixpep23o54wfdvy6ikjzc1` and project `cmrixqbwl21xsyif8kj8xl01s`. The workspace is Starter, billing is owned through the existing `alexg-7bes-projects` Vercel context, and both installed resources report `Prisma Postgres - Starter`. Preview and Production connection-authority fingerprints were `DIFFERENT`. The exact fingerprints are operational evidence, not durable credentials; repeat the comparison before every drill or incident.

Never identify a database by display name alone. Require the immutable resource ID, environment connection, parsed database authority and safe SHA-256 fingerprint. A `MATCH` or `UNKNOWN` relation stops work.

## Provider capability audit

| Capability | Production | Preview | Classification and evidence |
| --- | --- | --- | --- |
| Automatic backup state | **Yes** | **Yes** | **Detected:** 14 completed Production snapshots and six completed Preview snapshots. |
| Snapshot capability | Active | Active | **Detected:** backup lists are queryable through Prisma Console and the documented Management API. **Documented:** [Prisma backups](https://www.prisma.io/docs/postgres/database/backups) provide snapshots for Starter, Pro and Business. |
| Schedule | Activity-day snapshots detected | Activity-day snapshots detected | **Documented:** daily on days with database activity. Multiple completed restore points can appear within a calendar day; do not convert that observation into a guaranteed higher-frequency SLA. |
| Retention | 7 days metadata | 7 days metadata | **Detected:** Management API `backupRetentionDays=7` for both databases. **Documented:** Starter/Pro retain the last seven days; Business retains 30 days. |
| Point-in-time recovery | Not detected | Not detected | **Documented:** the detailed backup page describes fine-grained/PITR restore as future functionality. Use the detailed feature contract and live console conservatively. |
| Latest recoverable timestamp | `2026-08-11T00:16:47.856Z` | `2026-08-11T03:12:29.738Z` | **Detected:** both newest points were `completed`; exact IDs are recorded below. |
| Provider restore | Not exercised; no Production restore authorised | Tested to a new isolated target | **Detected:** Prisma Console's `Restore backup` → `Restore to a new database` path succeeded for Preview. Existing-target restore remains destructive and prohibited for drills. |
| Restore permissions | Backup inspection only | New-target restore exercised | **Detected:** authenticated console restored the snapshot. A one-use `workspace:admin` service token used the documented exact-ID delete endpoint and was immediately revoked. |
| Billing dependency | Starter | Starter | **Detected:** Starter is active through Vercel. **Documented:** current [Prisma pricing](https://www.prisma.io/pricing) lists USD 10/month with seven-day daily backups. No Pro/Business change or second paid service was accepted. |
| Region | Unknown | Vercel `iad1` | **Detected:** Preview's source resource reports `iad1`. The temporary restored target reported `us-east-1` / `US East (N. Virginia)`; the restore dialog exposed no region selector. Production region remains unknown. |
| Encryption/storage | General service claim only | General service claim only | **Documented:** Prisma states encryption at rest and in transit; direct connections require SSL. Snapshot-specific storage location and encryption details are not documented by the detailed backup page. |

Production backup state before Starter activation was **NO**. After the Founder-enabled Starter change it is **ACTIVE / DETECTED** with 14 completed snapshots. This continuation performed no Production row mutation, dump, restore, deployment, runtime-environment change or plan change.

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

## Passed provider-native new-target restore drill — 2026-08-11

| Evidence | Result |
| --- | --- |
| Workspace / project | `cmrixpep23o54wfdvy6ikjzc1` / `cmrixqbwl21xsyif8kj8xl01s`; Starter; Vercel-billed |
| Production snapshot evidence | 14 `completed`; newest `backup-01kzq2vm7gagejt88nn3hjqgpz` at `2026-08-11T00:16:47.856Z`; `backupRetentionDays=7` |
| Preview snapshot evidence | 6 `completed`; selected newest `backup-01kzqcxb1ak4rx3amh1snpwdag` at `2026-08-11T03:12:29.738Z`; `backupRetentionDays=7` |
| Method | Prisma Console `Restore backup` → `Restore to a new database`; no existing target overwritten |
| Source | Exact Preview database `cn8xojfxs6i5z82riihkfjfy`; Production was not a source |
| Target | `sevenbet-recovery-managed-20260811-394gow`; Prisma database `cmsodg4461nfn17e56q2juff7`; no Vercel binding, deployment or public traffic |
| Target region | Management API: `us-east-1`, `US East (N. Virginia)`; the restore flow exposed no region selector |
| Identity proof | Exact workspace/project/source/target database IDs plus distinct safe authority fingerprints; target differed from Preview and Production |
| Restore operation | Started `2026-08-11T08:01:23Z`; database reached provider `ready` within the observed 15-second check window; separate operation ID/completion timestamp not exposed |
| Repository migrations | 18/18 exact parity through `0018_program_ai_m1_foundation` |
| Schema | Source/target parity PASS; fingerprint `23c26a4a98f8651ef71ab5958abde5c0935315016e6230cb5f6c478b9f0ea327` |
| Selected counts | `NOT_APPLICABLE_POINT_IN_TIME_GAP`; current Preview contains a post-snapshot canary, so current counts are not snapshot-point evidence |
| Canary parity | `NOT_APPLICABLE_SNAPSHOT_PREDATES_CANARY` |
| Integrity and structure | Connectivity, zero-orphan/FK integrity, auth/session tables and Programme tables PASS; no restored login attempted |
| Application read | `ProgrammeSessionRepository` deterministic absent-record read PASS |
| External systems | OpenAI, Google, email and affiliate calls absent; target had no environment binding |
| Prisma checks | Repository `prisma validate` and `prisma generate` PASS with the target authority held in process memory |
| Cleanup | Management API pre-delete identity matched exact database/name/project and excluded both real database IDs; DELETE returned 204, exact GET returned 404, and the console list showed the target absent |
| Temporary authority | Two one-use service tokens supported exact metadata/delete evidence; both were revoked and the workspace returned to zero service tokens |
| Cost | Existing Starter base plan: USD 10/month. No additional recurring plan/service accepted; no separately itemised incremental restore charge detected. |

### Completed managed-snapshot canary follow-up — 2026-08-12

Completed Preview backup `backup-01kzszywy038jepagf0zk705zs` at `2026-08-12T03:23:52.640Z` captured the synthetic structural canary. It was restored provider-natively to fresh disconnected target `cmspkm3vo22py12f5nej7sdfc`, which reached `ready` and passed exact 18-migration, 12 selected-table-count, schema, FK/orphan, auth/Programme, repository-read and canary parent/claim parity.

The exact target deletion returned HTTP 204; subsequent exact GET returned 404 and console absence was confirmed. The exact Preview canary root and claim were then deleted and verified absent, with all unrelated selected-table counts unchanged. Temporary credentials were revoked. No real-person content or external-provider call was involved; Production remained read-only.

## Normal recovery tooling

- `npm run recovery:preflight` classifies and compares source, target, Preview and Production authorities. It requires the exact acknowledgement and refuses Production, matching, malformed, missing, non-loopback or unknown identities.
- `npm run recovery:canary -- create|cleanup` creates and removes the Preview-only structural canary. It requires separate Preview mutation authority.
- `npm run recovery:verify -- capture|verify` captures safe logical-source evidence and verifies a local restored target. `verify-managed` adds a separate exact Prisma workspace/project/source/target database-ID path for a newly created remote recovery target; it does not weaken the local loopback guard or authorise a Production target.
- `npm run recovery:test` runs deterministic guard and structural tests without live credentials or databases.

The repository deliberately contains no Production restore script. Commands receive credentials through process environment only; URLs and passwords must never appear in command output or shell history.

## Incident runbook

### Incident quick answers

| # | Operator question | Current answer |
| --- | --- | --- |
| 1 | What is backed up? | Starter-managed snapshots cover both exact databases on activity days. The API currently lists 14 completed Production points and six completed Preview points. The logical drill also backed up Preview at one point in time. |
| 2 | Which database is Production? | `prisma-postgres-cobalt-school`, immutable resource ID `store_1I4F54ETrwSKS42o`. |
| 3 | Which database is Preview? | `sevenbet-preview`, immutable resource ID `store_hLPkkgamL7rJNmCe`. |
| 4 | What is the current backup mechanism? | Prisma Starter managed activity-day snapshots; the proven logical Preview dump remains a drill fallback, not a Production backup service. |
| 5 | What is the current retention? | Management API metadata reports seven days for both resources, matching Starter documentation. Do not promise selective backup deletion or a customer SLA. |
| 6 | What is the internal RPO target? | No greater than 24 hours. Completed Production restore points are detected within that interval, but this remains an internal target rather than a provider/customer guarantee. |
| 7 | What is the internal RTO target? | No greater than 4 hours. The provider-native Preview target reached `ready` within the observed 15-second check and validation passed; neither timing is a Production RTO guarantee. |
| 8 | How is an outage/data-loss event identified? | Production Smoke plus Vercel deployment/runtime evidence, application errors and database/provider state; broad loss/corruption or personal-data compromise is SEV-1. |
| 9 | Who decides to restore? | Founder Office as incident commander, with the verified provider/project owner and technical responder executing. |
| 10 | How is a restore point selected? | Query exact provider IDs/status/timestamps, choose the newest coherent `completed` point with an acceptable explicitly recorded loss window, and distinguish its timestamp from any canary or incident boundary. |
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
3. If no provider restore point exists during an incident, the Production recovery gate is blocked. A Preview logical dump is drill evidence only and cannot recover Production.

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

## Ongoing operational action

RECOVERY-01 has no remaining drill-closure action. Continue routine snapshot/retention monitoring and preserve the evidence above. A real Production restore, target cutover, plan change or incident mutation remains separately Founder-authorised work under the incident runbook; drill completion does not authorise it.
