# Backup and Restore

## Current evidence

Reconciled on 2026-08-08 during ENV-ISO-01. Production and Preview are distinct Prisma Postgres resources, and Vercel account metadata reports both on the **Free** plan.

| Capability | Classification | Evidence |
| --- | --- | --- |
| Automated snapshots | **Not available on the current plan** | Prisma's detailed [backup documentation](https://www.prisma.io/docs/postgres/database/backups) lists automatic snapshots for Starter, Pro and Business; account metadata reports Free. |
| Backup schedule | **Not applicable / unverified for Free** | Paid snapshots are described as daily on active days; no Free snapshot is available to inspect. |
| Retention | **Not applicable / unverified for Free** | Paid retention is documented as 7 days for Starter/Pro and 30 days for Business. |
| Point-in-time recovery | **Not available** | The detailed backup documentation describes point-in-time restore as future functionality. |
| Restore from provider snapshot | **Not available on the current plan** | Neither Free resource exposes a provider snapshot recovery point. |
| Restore permissions | **Unverified** | No restore authority was exercised; Production restore was prohibited. |
| Manual `pg_dump` / `pg_restore` | **Documented provider mechanism, not an active managed backup** | Prisma documents direct connections for manual backup tooling. No Production dump or unmanaged copy was created. |

The broader provider overview currently uses less-specific backup/PITR language; this runbook follows the detailed backup feature page plus the account's verified Free plan. Conclusions are therefore plan-specific and deliberately conservative.

## ENV-ISO-01 restore-drill outcome

- Source environment: Preview only was required.
- Production data used: **No**.
- Recovery point available: **No**.
- Temporary recovery resource created: **No**.
- Paid plan enabled: **No**.
- Manual Production export created: **No**.
- Result: **NOT AVAILABLE — blocked by current provider plan capability**.

No restore was attempted because the Free Preview resource has no provider snapshot/PITR recovery point. Creating an unmanaged dump solely to satisfy the checklist would not verify the managed Production recovery path and would introduce another sensitive copy. No recovery clone is retained.

## Recovery status and gate

**RECOVERY CAPABILITY PARTIAL.** Provider, plan and limitation are verified; automated backup, retention, restore permission and an isolated restore drill are not operationally proven. The existing internal targets remain RPO no greater than 24 hours and RTO no greater than 4 hours for closed beta; they are objectives, not guarantees.

Before stateful closed-beta or regulated release, Founder Office must authorise exactly one bounded recovery path:

1. upgrade to a plan with provider snapshots, verify the actual schedule/retention and complete a Preview-sourced restore into a new isolated resource; or
2. approve a separately governed encrypted backup architecture, retention authority and restore drill.

ENV-ISO-01 did not authorise either spend or architecture choice.

## Future non-production restore drill

1. Select a Preview recovery point containing only disposable non-production data. Never use a Production export to satisfy the drill.
2. Record operator, source resource, recovery point and start time outside public logs.
3. Restore into a new isolated recovery resource. Never overwrite Production or Preview.
4. Verify the 17 repository migrations, representative harmless counts, authentication isolation and read paths. Do not inspect protected/private content.
5. Record measured duration as drill evidence, not a guaranteed Production RTO.
6. Delete the temporary recovery resource and verify deletion. Do not retain a clone or recurring cost.

## Incident restore

The incident commander freezes writes when continued mutation increases harm. The technical responder confirms the failure mode, recovery point and expected loss window. Founder Office authorises any Production restore. Restore through the verified provider procedure, rotate credentials if compromise is possible, verify schema/migration invariants, deploy a compatible known-good application, run Production Smoke and monitor. Preserve an audit record of actors, timestamps, SHAs and provider operation IDs—never credential values or protected user answers.
