# Backup and Restore

## Evidence and objectives

- **Detected:** the hosted database endpoint class is Prisma Postgres.
- **Not detected:** repository or provider evidence proving backup schedule, retention, point-in-time recovery, regional redundancy, restore permissions, encryption controls, or a completed restore drill.
- **Planned target:** RPO no greater than 24 hours and RTO no greater than 4 hours for closed beta. These are objectives, not current guarantees.

Database-changing Production work is blocked until the provider console/contract confirms the required capabilities and a non-production restore drill succeeds.

## Verification checklist

The Founder/configuration owner and technical responder must record, outside this public repository where sensitive account detail is involved:

- provider project/database identity and accountable owner;
- automated backup frequency, retention and encryption;
- point-in-time recovery window, if available;
- restore target options and whether restore can avoid overwriting Production;
- roles permitted to initiate and approve restore;
- estimated restore duration and cost;
- provider support/escalation path;
- last successful isolated restore drill date, source recovery point and verified application invariants.

## Non-production restore drill

1. Select a recovery point that contains no unapproved Production export. Use provider-native isolated restore/clone capability; do not overwrite Production.
2. Restrict access and record start time, recovery point and operator.
3. Restore to a new non-production target with separate credentials.
4. Apply no ad-hoc schema edits. Verify migration history, representative table accessibility, authentication isolation and application read paths.
5. Do not copy personal data into issue/CI logs. Destroy or retain the restored target according to an approved data-retention decision.
6. Record measured RPO/RTO and discrepancies; update this runbook only with non-secret evidence.

## Incident restore

The incident commander freezes writes when continued mutation increases harm. The technical responder confirms the failure mode, recovery point and expected loss window. Founder Office authorises a Production restore. Restore through the verified provider procedure, rotate credentials if compromise is possible, verify schema/migration invariants, deploy a compatible known-good application, run Production smoke and monitor. Preserve an audit record of actors, timestamps, SHAs and provider operation IDs—never credential values or protected user answers.
