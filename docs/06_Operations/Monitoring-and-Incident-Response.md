# Monitoring and Incident Response

## Closed-beta monitoring foundation

- **Detected:** Vercel provides deployment state plus deployment/runtime logs.
- **Detected:** `Production Smoke` performs hourly and manual read-only checks of nine representative public routes; failures are visible in GitHub Actions.
- **Planned until first post-merge run:** confirm the scheduled workflow is enabled and its failure notification reaches the accountable GitHub owner.
- **Not detected:** Sentry/APM, central log retention, synthetic regional monitoring, automated paging or a runtime health endpoint.

This is sufficient only for the current low-cost closed-beta foundation after notification delivery is verified. It is not an availability guarantee. Add tooling only through evidence of need and an approved decision.

## Roles

| Role | Current assignment |
| --- | --- |
| Incident commander / product decision owner | Founder Office |
| Technical responder | Repository maintainer with Vercel/GitHub access |
| Database recovery approver | Founder Office plus the verified provider/project owner |
| Legal/compliance escalation | Required but **not documented**; Founder Office must identify the person/adviser before a regulated/privacy launch |

## Severity

| Severity | Examples | Response |
| --- | --- | --- |
| SEV-1 | Protected Help unavailable/commercialised, secret or personal-data exposure, unsafe affiliate redirection, broad auth compromise, destructive data loss | Immediate release freeze and containment; Founder Office notified; consider disabling affected feature/path; recovery/rollback starts now |
| SEV-2 | Sustained key-route 5xx, admin lockout, material stale/wrong commercial data without immediate harm, migration degradation | Respond promptly during the operating window; assign owner; rollback or forward-fix based on lowest risk |
| SEV-3 | Isolated cosmetic issue, non-critical monitor noise, minor degraded path with safe fallback | Record, triage and fix through normal protected PR flow |

## Response loop

1. **Detect and verify:** correlate smoke/deployment status with the exact Git SHA. Reproduce with read-only requests first.
2. **Classify:** choose severity and affected trust boundary—Help/safety, auth/privacy, data, commercial/affiliate, or general availability.
3. **Contain:** freeze releases; disable only through an existing safe flag when that reduces harm. Fail closed for missing casino, affiliate, jurisdiction or Programme truth.
4. **Recover:** follow the release rollback or verified database restore runbook. No improvised Production mutation.
5. **Validate:** run smoke, inspect logs and confirm the original symptom plus adjacent protected paths.
6. **Communicate:** Founder Office owns user/regulator/partner communication decisions. Legal/compliance advice is mandatory for suspected personal-data exposure or regulated claims.
7. **Learn:** produce a concise incident record and corrective RFC/PR for material architecture or policy changes.

## Logging and privacy

Do not add or copy Self-Check answers, limit values, Programme progress, raw affiliate destination URLs/credentials, authentication secrets, passwords, session tokens, or database URLs to logs. Minimise personal identifiers. Use request/deployment identifiers and aggregate counts where possible. Restrict Vercel/GitHub access and follow the manual privacy-request process until a governed account lifecycle and retention implementation exists.
