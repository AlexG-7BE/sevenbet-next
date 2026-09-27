# Monitoring and Incident Response

## Launch monitoring (from 28 Sep 2026)

- **Detected:** Vercel provides deployment state plus deployment/runtime logs.
- **Detected:** the `Production Smoke` workflow (`.github/workflows/production-smoke.yml`) runs `scripts/production-smoke.mjs` every 10 minutes and on demand from a US GitHub runner. It is read-only, dependency-free and identifies itself as a monitor, so the site records its requests as BOT traffic.
- **Detected:** any failing check opens or updates one GitHub issue titled `[Production] Smoke alert`, assigned to the repository owner. The issue body lists each failing check in plain words; a comment is added only when the set of failing checks changes; the first green run comments and closes the issue.
- **Detected:** the hourly schedule this replaced fired only about five times a day (gaps of 3–6 hours, 16–27 Sep 2026) because GitHub drops scheduled runs under load. The 10-minute schedule keeps a real run inside the one-hour detection target; the public repository makes these runner minutes free.
- **Not detected:** Sentry/APM, central log retention, regional (in-market) page checks, phone paging beyond GitHub notifications.

### What the smoke checks

| Check | Catches |
| --- | --- |
| `/`, `/en`, `/sv`, `/da`, `/de` (redirects followed) | Home down; a localised home falling back to another language (the page `lang` must match — this is how a missing `BETTER_AUTH_SECRET` shows up publicly) |
| `/en/best-offers`, `/en/bonuses`, `/en/casinos` | Conversion pages down, or their database-backed lists empty or shrinking: at least 2 / 13 / 14 casino review links (half of the 3 / 26 / 28 served on 27 Sep 2026) |
| First review linked from `/en/casinos` (fallback `/en/casino/betsson`) | A published casino review not rendering |
| `/program`, `/login`, `/api/auth/ok` | Programme entry, sign-in page and the auth runtime (`{"ok":true}`) |
| `/help`, `/responsible-gambling`, `/faq`, `/privacy`, `/terms` | Protected Help and legal pages available |
| `/sitemap.xml` | Silent fallback to core routes on a database error: at least 35 URLs and 14 casino reviews (69 and 27 on 27 Sep 2026; a database failure leaves 12) |
| `/llms.txt` | Silent fallback to an empty article list: at least 14 Learning Center articles (27 on 27 Sep 2026) |
| `/api/internal/ops-health` | See below |

Every check gets three attempts (15 s timeout each) before it counts as failing. Raise a floor only when the published catalogue has grown for good; lower one only when content was removed on purpose.

### Ops health endpoint

`GET /api/internal/ops-health` with `Authorization: Bearer <AFFILIATE_HEALTH_MONITOR_TOKEN>`; `404` when the token is not configured in Vercel, `401` for a missing or wrong bearer, `200` when healthy, `503` with the failing check names otherwise; always `no-store`. The report holds only booleans and latencies, never a configured value:

| Check | Fails when |
| --- | --- |
| `database` | A constant `SELECT 1` fails twice or takes longer than 5 s |
| `betterAuthSecret`, `cronSecret`, `siteUrl` | `BETTER_AUTH_SECRET`, `CRON_SECRET` or `NEXT_PUBLIC_SITE_URL` is missing |
| `lifecycleEmail` | `LIFECYCLE_EMAIL_DELIVERY_ENABLED=true` in Production but the existing resolver rejects the configuration (the cron would otherwise report success with zeros) |
| `contactEmail` | `CONTACT_EMAIL_DELIVERY_ENABLED=true` but the `CONTACT_EMAIL_*` / Resend configuration is rejected |
| `programmeAi` | Programme AI is switched on but its provider/model settings do not match the pinned contract, or OpenAI answers 401/403/404 to a free `GET /v1/models/<pinned model>` (5 s timeout). Provider timeouts, 429 and 5xx are reported as inconclusive and do not alert |

### Responding to a smoke alert

1. Open the run linked in the issue; its step summary lists every check with counts and timings.
2. `HTTP 5xx`, timeouts, empty lists or a shrunken sitemap: check Vercel → Deployments (roll back if the last deployment just shipped) and runtime logs for `Can't reach database server`.
3. An `ops-health` line names the setting at fault: fix it in Vercel Production environment variables and redeploy.
4. Re-run `Production Smoke` manually (Actions → Production Smoke → Run workflow); the issue closes itself on a green run.

The Founder must keep GitHub notifications for issue assignments switched on (email and/or GitHub Mobile push); that is the alert channel.

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
