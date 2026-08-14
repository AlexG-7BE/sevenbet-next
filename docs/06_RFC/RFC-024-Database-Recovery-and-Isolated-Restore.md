# RFC-024: Database Recovery and Isolated Restore

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `RECOVERY-01`
- **Approved:** 2026-08-11
- **Scope:** Prisma Postgres backup governance, fail-closed recovery tooling and a Preview-sourced isolated restore drill
- **Base:** `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`
- **Depends on:** Product Vision & Principles v2.0, RFC-013, RFC-017, ENV-ISO-01 and the Production release governance
- **Supersedes:** The provisional recovery direction in the operations baseline where this RFC is more specific

**Implementation outcome — Detected 2026-08-12:** RECOVERY-01's managed Preview restore drill is complete. Completed backup `backup-01kzszywy038jepagf0zk705zs` captured the synthetic canary; a fresh disconnected target passed the required parity checks, then the exact target and canary were deleted and verified absent. Production remained read-only. This outcome does not authorise a Production restore or change the decision ceiling below.

## 1. Decision and release ceiling

B4GAMBLE will use a restore-to-new-target recovery process. Production is read-only during drills and is never a drill restore target. Preview synthetic/test data is the only authorised live drill source. Recovery copies remain disconnected from Vercel runtimes, public traffic, Google OAuth, OpenAI, email and affiliate systems.

The internal closed-beta objectives are:

| Objective | Target | Classification |
| --- | --- | --- |
| Recovery point objective | no greater than 24 hours | Internal operating target, not a customer promise or SLA |
| Recovery time objective | no greater than 4 hours | Internal operating target, not a customer promise or SLA |
| Recoverability window | at least seven daily restore points or equivalent | Desired managed-provider capability |

RECOVERY-01 may be classified `CLOSED` only after managed Production backup capability, a provider-native isolated restore and snapshot-contained deterministic canary parity are proven. A logical Preview restore or a provider restore of a pre-canary snapshot is `PARTIAL`. No implementation may upgrade a plan, accept a recurring charge beyond separate Founder authority or present documented provider behaviour as tested evidence.

## 2. Current provider decision

**Detected on 2026-08-11:** Founder Office enabled Starter. Vercel and Prisma control-plane evidence identifies workspace `cmrixpep23o54wfdvy6ikjzc1`, project `cmrixqbwl21xsyif8kj8xl01s` and Vercel billing context `alexg-7bes-projects`. `sevenbet-preview` (`cn8xojfxs6i5z82riihkfjfy`, `store_hLPkkgamL7rJNmCe`) remains Preview-only; `prisma-postgres-cobalt-school` (`cmrixqbwl21xqyif8ab2vr2xw`, `store_1I4F54ETrwSKS42o`) remains Production-only. Both resources report `Prisma Postgres - Starter` and have different safe connection fingerprints.

**Detected:** the documented Management API reports `backupRetentionDays=7` for both. Production has 14 completed snapshots; newest `backup-01kzq2vm7gagejt88nn3hjqgpz` at `2026-08-11T00:16:47.856Z`. Preview has six; selected newest `backup-01kzqcxb1ak4rx3amh1snpwdag` at `2026-08-11T03:12:29.738Z`.

**Documented:** Prisma's detailed [backup documentation](https://www.prisma.io/docs/postgres/database/backups) says Starter, Pro and Business receive activity-day daily snapshots; Starter and Pro retain the last seven days and Business retains the last 30 days. It describes point-in-time restore as future functionality. The broader product overview currently uses contradictory point-in-time-recovery language, so the detailed backup contract and live console state govern this decision conservatively. Prisma's current [pricing](https://www.prisma.io/pricing) lists Starter at USD 10 per month and does not list daily backups for Free.

**Documented:** The live Prisma Console states that an available snapshot can be restored to a new or existing database. Prisma's Management API also exposes a destructive restore into an existing target while retaining that target's connections and credentials. RECOVERY-01 therefore permits only a newly created, identity-proven recovery target. It never permits restore over Preview or Production.

**Detected/unknown:** Preview's Vercel metadata reports `iad1`; Production's actual region remains unknown. The temporary restored target reported `us-east-1` / `US East (N. Virginia)` and the restore dialog exposed no region selector. Backup storage location and encryption details specific to snapshots are not established by the detailed backup contract. Prisma publicly states that Prisma Postgres data is encrypted at rest and in transit; direct connections additionally require SSL. These general provider statements do not establish the storage location of a particular backup.

**Tested:** Prisma Console's `Restore backup` → `Restore to a new database` flow instantiated the selected Preview point as new database `cmsodg4461nfn17e56q2juff7`, disconnected from every runtime. It reached `ready`, passed connectivity, exact 18-migration and schema parity, zero-orphan/FK checks, auth/Programme structure and a repository read with external systems disabled. Exact-ID Management API deletion returned 204; exact lookup then returned 404 and the console list showed it absent.

## 3. Recovery architecture

Recovery follows this order:

1. Use a provider-native snapshot only when it already exists under the current plan and can be restored into a newly created, isolated target without a new recurring commitment.
2. Otherwise, use a custom-format logical `pg_dump` of Preview through its direct connection and restore it into a disposable local PostgreSQL 16 database.
3. Never create a Production dump for a drill, clone Production personal data into Preview, or introduce a second persistent database architecture.

The logical drill is evidence that a coherent Preview backup can produce a usable database. It is not an automated Production backup architecture and cannot by itself meet the ongoing RPO target.

## 4. Identity and fail-closed authority

Before any dump or restore, the operator supplies source, target, Preview reference and Production reference connection authorities only through process environment or restrictive temporary files. The local recovery guard:

- parses only PostgreSQL connection URLs;
- derives SHA-256 fingerprints without printing credentials or URLs;
- requires the source fingerprint to equal Preview and differ from Production;
- requires the target to be loopback, use an explicit recovery database name and differ from Preview and Production;
- denies missing, malformed, matching or unknown identities;
- denies `VERCEL_ENV=production` and any Production source or target;
- requires the exact recovery-drill acknowledgement.

Provider resource IDs remain independent control-plane evidence. A connection fingerprint never replaces the resource-ID check.

The provider-native path is deliberately separate and smaller. It additionally requires the exact workspace/project, exact Preview source database ID, exact newly created target database ID supplied twice, Prisma Postgres provider classification, `RECOVERY_TEMP`, a managed-restore acknowledgement and non-Production runtime. It denies either real database ID, a mismatched/unknown target ID, loopback in managed mode or any source/target authority match. It is not a general remote-database administration path.

## 5. Logical backup and temporary-data handling

Prisma documents direct connections for `pg_dump` and `pg_restore`. PostgreSQL documents custom archives as compressed, portable inputs to `pg_restore`. The drill uses a private temporary directory, restrictive permissions, a custom-format archive, no owner or access-control replay, and an empty disposable target. The archive is never committed, uploaded, retained as a CI artifact or copied to shared storage.

The temporary archive contains Preview test/synthetic data only. It is deleted immediately after verification. The target PostgreSQL data directory is destroyed after the server is stopped and its local identity is rechecked. If a future provider-native target cannot be deleted with an immutable-ID match, it remains disconnected and is handed off for exact-ID manual cleanup.

## 6. Recovery canary and validation

The drill canary uses the existing Programme session repository to create one synthetic anonymous-session root and one related pending-claim row. It stores only opaque hashes and versioned structural fields, has no email address or real-person data, and invokes no external provider. Its safe manifest contains only the canary row ID, hashes, versions and timestamps.

When the selected snapshot predates a new managed-snapshot canary, restore mechanics, migration/schema parity and structural integrity may be tested, but current source/target count parity and canary parity are `NOT_APPLICABLE`. The canary remains in Preview only until a later snapshot captures it. At approval time, the pending canary's safe root ID was `73a3c254-8ffb-4d35-b91f-9fb7436ad45f`, safe hash was `dfcb30eb93bac399ac3a342782e23fd6f3f19f3e9e3260d735757d9ae2e08cab`, and creation time was `2026-08-11T08:00:45.569Z`; the implementation outcome above records its later parity and cleanup.

Validation requires:

- source/target identity proof and connectivity;
- the exact repository migration set derived at the base SHA;
- selected table-count parity at the backup point;
- exact canary and parent/child parity;
- foreign-key integrity and no orphaned canary claim;
- auth/session table structural presence without login reuse;
- Programme structural reads without OpenAI;
- source/target public-schema fingerprint parity;
- a repository-level read of the restored canary;
- `prisma validate` and `prisma generate` against repository code.

Normal CI tests only the guards and deterministic verification logic. It never receives live database credentials and never creates cloud resources.

## 7. Incident recovery procedure

Founder Office and the verified provider/project owner authorise a Production restore. The incident commander first freezes writes when continued mutation would worsen loss, confirms the exact resource and selects a recovery point whose loss window is acceptable. The technical responder restores to a new isolated target, validates it with the compatible application SHA and the recovery checks, rotates affected credentials after suspected compromise, then seeks a separate traffic-switch decision.

Traffic never switches merely because a restore command completed. The new target must pass schema, migration, integrity, application-read, authentication-structure and smoke checks. The old target remains unchanged until the cutover decision. A failed attempt is abandoned or destroyed; no reverse SQL or restore-over-existing retry is improvised.

## 8. Privacy, security and observability

Recovery evidence contains resource IDs, safe fingerprints, migration names, counts, timings, canary hashes and PASS/FAIL outcomes only. It excludes connection strings, credentials, personal identifiers, user-authored content, raw Programme content and database records.

After a serious incident, operators assess rotation of database connection strings, Vercel tokens, Better Auth secrets, admin credentials and any provider credentials that may have been exposed. Rotation is based on incident scope; this RFC does not authorise unrelated Production configuration changes during a drill.

## 9. Cost and provider gap

Founder Office authorised and manually enabled Starter at the documented USD 10/month base price. Starter scope, the Vercel billing owner/context, seven-day retention metadata and completed snapshots on both databases are detected. No Pro/Business change, second paid service or additional recurring commitment was accepted; no separately itemised incremental restore charge was detected.

The originally remaining gap was not plan activation: it was a later completed Preview snapshot containing the exact pending canary, followed by another new-target restore, parity and cleanup. The 2026-08-12 implementation outcome above closed that drill gap. Routine monitoring and any separately authorised Production incident restore remain outside that closure.

## 10. Rollback and stop conditions

Repository rollback removes the recovery scripts and documentation through the normal protected PR flow; it does not mutate a database. Drill rollback normally deletes the Preview canary, stops a disposable local server and removes private archive/data after exact identity checks. If a separately authorised managed canary must await snapshot capture, it may remain only in Preview until the later restore proves parity, then must be removed immediately by exact identity. No such RECOVERY-01 canary remains.

Live work stops when any identity is unknown or matching, a target could be Production, a paid acceptance appears, a Production dump would be needed, credentials could be printed, the provider would overwrite a shared database, or schema change/migration becomes necessary. Documentation and deterministic tests may continue while the live gate is reported truthfully.
