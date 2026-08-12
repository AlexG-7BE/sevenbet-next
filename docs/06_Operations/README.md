# B4GAMBLE Operations

These runbooks implement [RFC-013](../06_RFC/RFC-013-Production-Engineering-and-Release-Governance.md) for the current closed-beta operating model.

| Runbook | Purpose |
| --- | --- |
| [Production Release Governance](Production-Release-Governance.md) | Pull-request, deployment, verification and rollback path |
| [Environment and Secrets](Environment-and-Secrets.md) | Trust zones, variable inventory, ownership and isolation gates |
| [Product Analytics](Product-Analytics.md) | Vercel plan boundary, privacy contract, aggregate report, activation and rollback |
| [Programme Runtime Hardening](Programme-Runtime-Hardening.md) | Distributed limits, database bindings, migration, purge and cron operations |
| [Google Authentication and Email Readiness](Google-Authentication-and-Email-Readiness.md) | Exact OAuth callbacks, account-linking controls, sender architecture and deliverability activation gates |
| [Database Migrations](Database-Migrations.md) | Expand/contract policy and fresh-database verification |
| [Backup and Restore](Backup-and-Restore.md) | Required recovery capabilities and evidence gates |
| [Monitoring and Incident Response](Monitoring-and-Incident-Response.md) | Detection, severity, ownership, containment and recovery |
| [GB Partner Onboarding](GB-Partner-Onboarding-Runbook.md) | Contract evidence, due diligence, activation, review and pause controls |

Implementation claims are labelled **Detected**, **Inferred**, **Planned**, or **Not detected**. Runbooks never contain secret values.
