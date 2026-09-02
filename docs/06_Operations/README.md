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
| [Casino Market Data Release — 2 September 2026](Casino-Market-Data-Release-Record-2026-09-02.md) | Exact migration, runtime, one-time Betsson PE/SE import/publication and commercial-firewall evidence |
| [Casino Data Population 01 — 2 September 2026](Casino-Data-Population-01-Release-Record-2026-09-02.md) | Frozen-corpus eligibility, checksum-bound GB factual bundles, guarded release gates and exact exclusions |
| [Casino Commercial Activation 01 — 2 September 2026](Casino-Commercial-Activation-01-Release-Record-2026-09-02.md) | Current partner-route reconciliation, fail-closed activation matrix, tracking/asset evidence and Production acceptance |
| [Commercial Platform Code Completion — 3 September 2026](Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md) | Activation and asset adapters, aggregate click accounting, health automation, SEO publication policy and final release acceptance |
| [Commercial Platform Operations](Commercial-Platform-Operations.md) | Repeatable activation, aggregate click measurement, centralized SEO publication policy, migration and rollback contract |
| [Partner Portal Data Handoff](Partner-Portal-Data-Handoff.md) | Exact Casino × GEO campaign, linking-code, tracking URL and creative ingestion procedure |
| [Affiliate Route Health](Affiliate-Route-Health-Runbook.md) | Secret-safe daily route checks, deduplicated alerts, response and rollback |
| [Backup and Restore](Backup-and-Restore.md) | Required recovery capabilities and evidence gates |
| [Monitoring and Incident Response](Monitoring-and-Incident-Response.md) | Detection, severity, ownership, containment and recovery |
| [GB Partner Onboarding](GB-Partner-Onboarding-Runbook.md) | Contract evidence, due diligence, activation, review and pause controls |

Implementation claims are labelled **Detected**, **Inferred**, **Planned**, or **Not detected**. Runbooks never contain secret values.
