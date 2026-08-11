# RFC-024: Database Recovery and Isolated Restore

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `RECOVERY-01`
- **Approved:** 2026-08-11
- **Scope:** Prisma Postgres backup governance, fail-closed recovery tooling and a Preview-sourced isolated restore drill
- **Base:** `15b6cd61ec7ea8835dce6837984ccc4f7448a0c4`
- **Depends on:** Product Vision & Principles v2.0, RFC-013, RFC-017, ENV-ISO-01 and the Production release governance
- **Supersedes:** The provisional recovery direction in the operations baseline where this RFC is more specific

## 1. Decision and release ceiling

B4GAMBLE will use a restore-to-new-target recovery process. Production is read-only during drills and is never a drill restore target. Preview synthetic/test data is the only authorised live drill source. Recovery copies remain disconnected from Vercel runtimes, public traffic, Google OAuth, OpenAI, email and affiliate systems.

The internal closed-beta objectives are:

| Objective | Target | Classification |
| --- | --- | --- |
| Recovery point objective | no greater than 24 hours | Internal operating target, not a customer promise or SLA |
| Recovery time objective | no greater than 4 hours | Internal operating target, not a customer promise or SLA |
| Recoverability window | at least seven daily restore points or equivalent | Desired managed-provider capability |

RECOVERY-01 may be classified `CLOSED` only after managed Production backup capability and an isolated restore are both proven. A successful logical Preview restore with no managed Production backup is `PARTIAL`. No implementation may upgrade a plan, accept a recurring charge or present documented provider behaviour as tested evidence.

## 2. Current provider decision

**Detected on 2026-08-11:** Vercel resource inspection classifies both `sevenbet-preview` (`store_hLPkkgamL7rJNmCe`) and `prisma-postgres-cobalt-school` (`store_1I4F54ETrwSKS42o`) as available, owned Prisma Postgres resources on the Free plan. The Preview resource is connected only to Preview and the Production resource only to Production. Both live Prisma Console backup pages report no backups and require a Starter, Pro or Business upgrade.

**Documented:** Prisma's detailed [backup documentation](https://www.prisma.io/docs/postgres/database/backups) says Starter, Pro and Business receive activity-day daily snapshots; Starter and Pro retain the last seven days and Business retains the last 30 days. It describes point-in-time restore as future functionality. The broader product overview currently uses contradictory point-in-time-recovery language, so the detailed backup contract and live console state govern this decision conservatively. Prisma's current [pricing](https://www.prisma.io/pricing) lists Starter at USD 10 per month and does not list daily backups for Free.

**Documented:** The live Prisma Console states that an available snapshot can be restored to a new or existing database. Prisma's Management API also exposes a destructive restore into an existing target while retaining that target's connections and credentials. RECOVERY-01 therefore permits only a newly created, identity-proven recovery target. It never permits restore over Preview or Production.

**Unknown:** The current region of each existing database is not exposed by the inspected Vercel resource metadata or Prisma database settings. Prisma documents the regions available for new databases, but that list is not evidence of either resource's actual region. Backup storage location and encryption details specific to snapshots are not documented in the detailed backup contract. Prisma publicly states that Prisma Postgres data is encrypted at rest and in transit; direct connections additionally require SSL. These provider statements do not establish the storage location of a particular backup.

## 3. Recovery architecture

Recovery follows this order:

1. Use a provider-native snapshot only when it already exists under the current plan and can be restored into a newly created, isolated target without a new recurring commitment.
2. Otherwise, use a custom-format logical `pg_dump` of Preview through its direct connection and restore it into a disposable local PostgreSQL 16 database.
3. Never create a Production dump for a drill, clone Production personal data into Preview, or introduce a second persistent database architecture.

The logical drill is evidence that a coherent Preview backup can produce a usable database. It is not an automated Production backup architecture and cannot by itself meet the ongoing RPO target.

## 4. Identity and fail-closed authority

Before any dump or restore, the operator supplies source, target, Preview reference and Production reference connection authorities only through process environment or restrictive temporary files. The recovery guard:

- parses only PostgreSQL connection URLs;
- derives SHA-256 fingerprints without printing credentials or URLs;
- requires the source fingerprint to equal Preview and differ from Production;
- requires the target to be loopback, use an explicit recovery database name and differ from Preview and Production;
- denies missing, malformed, matching or unknown identities;
- denies `VERCEL_ENV=production` and any Production source or target;
- requires the exact recovery-drill acknowledgement.

Provider resource IDs remain independent control-plane evidence. A connection fingerprint never replaces the resource-ID check.

## 5. Logical backup and temporary-data handling

Prisma documents direct connections for `pg_dump` and `pg_restore`. PostgreSQL documents custom archives as compressed, portable inputs to `pg_restore`. The drill uses a private temporary directory, restrictive permissions, a custom-format archive, no owner or access-control replay, and an empty disposable target. The archive is never committed, uploaded, retained as a CI artifact or copied to shared storage.

The temporary archive contains Preview test/synthetic data only. It is deleted immediately after verification. The target PostgreSQL data directory is destroyed after the server is stopped and its local identity is rechecked. If a future provider-native target cannot be deleted with an immutable-ID match, it remains disconnected and is handed off for exact-ID manual cleanup.

## 6. Recovery canary and validation

The drill canary uses the existing Programme session repository to create one synthetic anonymous-session root and one related pending-claim row. It stores only opaque hashes and versioned structural fields, has no email address or real-person data, and invokes no external provider. Its safe manifest contains only the canary row ID, hashes, versions, timestamps and aggregate counts.

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

The live Free plan has no managed snapshots. The smallest current provider upgrade that documents seven-day daily backups is Starter at USD 10 per month. Founder Office has not authorised that recurring commitment. Production backup state therefore remains unchanged and the managed recovery gate remains open after a logical drill.

A future paid-plan decision must verify the actual plan, billing owner, backup activation time, first available snapshot, activity-day schedule, retention, restore permissions, target creation semantics and region before RECOVERY-01 can close.

## 10. Rollback and stop conditions

Repository rollback removes the recovery scripts and documentation through the normal protected PR flow; it does not mutate a database. Drill rollback deletes the Preview canary, stops the disposable local server and removes the private archive/data directory after exact identity checks.

Live work stops when any identity is unknown or matching, a target could be Production, a paid acceptance appears, a Production dump would be needed, credentials could be printed, the provider would overwrite a shared database, or schema change/migration becomes necessary. Documentation and deterministic tests may continue while the live gate is reported truthfully.
