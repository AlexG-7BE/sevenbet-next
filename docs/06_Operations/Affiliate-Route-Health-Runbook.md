# Affiliate Route Health Runbook

**DETECTED / PRODUCTION HISTORY — 3 September 2026:** the protected checker,
endpoint and deduplicated workflow were deployed and verified. See the
[commercial-platform completion release record](Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

**DETECTED / PRODUCTION HISTORY — 16 September 2026:** PR #299 deployed the
stateful evidence and comment-deduplication baseline. The minimal model below
keeps that evidence quality while replacing its public monitor-state taxonomy
with one boolean decision. This implementation remains subject to ordinary PR,
CI, Founder review, merge and deployment.

## Production model

The operational model has three deliberately separate roles:

```text
MarketActivation = sole commercial and route authority
Verifier         = technical observation only
Monitor          = actionRequired: true | false
```

Everything other than `actionRequired` is diagnostic evidence. The monitor
does not activate, deactivate, approve, reject or override a route. It does not
write `MarketActivation`, Affiliate, Partner, Casino or Production data.

`npm run affiliate:health` selects only canonical Casino `MarketActivation`
records whose desired and reconciled states are both `ACTIVE`. It does not
select routes from CRM, Affiliate lifecycle values, country projections,
`productionEligible` compatibility data or operator-specific rules.

Supported filters:

- all routes: `npm run affiliate:health`;
- one Casino: `npm run affiliate:health -- --casino <id-or-slug>`;
- one GEO: `npm run affiliate:health -- --geo <country-or-subdivision>`; and
- JSON output: add `--json`.

## One monitoring decision

Every selected material route receives exactly one decision:

| Current evidence | Historical direct success | `actionRequired` |
| --- | --- | --- |
| Current direct success | Current check becomes the direct-success timestamp | `false` |
| Confirmed material defect | Any | `true` |
| Inconclusive transport, timeout or identified challenge | Within 7 days | `false` |
| Inconclusive check | Older than 7 days | `true` |
| Inconclusive check | Never directly verified | `true` |

The freshness threshold is one universal, inclusive seven-day window. It has
no Casino, operator, Partner or GEO exception.

Confirmed material defects include missing canonical relationships, unsafe or
invalid targets, non-challenge HTTP failures, expiry, wrong destination/GEO,
missing attribution and terminal error pages. Inconclusive evidence includes
network/transport failure, timeout, identified CDN/bot challenge and challenge
responses such as HTTP 401, 403 or 429. The detailed verifier result remains
visible but does not become a second monitor decision.

The monitor uses the existing `MarketActivation` direct-success evidence. A
successful current direct check reports its actual check time as
`lastDirectSuccessAt`. No Founder or stored override is relabelled as a direct
success.

## Report contract

The protected Production report exposes route identity, Casino, country and
exact market, controlled `/r` slug, check time, `actionRequired`, a plain-text
action reason when needed, `lastDirectSuccessAt`, current safe verifier
evidence and the exact `MarketActivation` evidence revision. It omits raw
tracking URLs, query values, credentials and visitor data.

The report aggregate contains:

- `actionRequired=true` only when at least one material route has
  `actionRequired=true`;
- total route count;
- count requiring action; and
- count not requiring action.

Verifier status counts may remain as diagnostics. They do not control the
aggregate or Issue lifecycle.

## Daily workflow and one Issue

`.github/workflows/affiliate-route-health.yml` runs daily at 05:37 UTC and may
be dispatched manually. It calls the bearer-protected Production endpoint
`/api/internal/affiliate/route-health` with the existing monitor token.

For every valid report, the complete Issue lifecycle is:

```text
one or more routes with actionRequired=true -> open or update one deduplicated Issue
zero routes with actionRequired=true        -> close that Issue automatically if open
```

The Issue is titled `[Production] Affiliate route health alert`. Its body lists
actionable routes first with Casino × GEO, controlled route, action reason,
current safe diagnostic evidence, last direct success, age/freshness and
evidence revision. A compact non-actionable diagnostic section may follow.
Diagnostic-only noise is never presented as an incident.

A comment is added only when the actionable route set changes, an actionable
reason changes, or the Issue closes on recovery. Check time, run ID, evidence
revision, response time, final-host formatting and other diagnostic-only
changes may refresh the body without creating comment noise. When every route
has `actionRequired=false`, the Issue closes even if a current check is
inconclusive but a direct success remains inside the seven-day window.

An unreachable or malformed Production report cannot prove either boolean
outcome. The workflow therefore fails without reconciling the Issue and waits
for the next valid report; it does not invent a Casino-route decision.

## Response

1. Open the workflow run and the single deduplicated Issue.
2. Review routes with `actionRequired=true` first.
3. Re-run the scoped CLI command when useful.
4. Inspect current Partner evidence without copying secrets into GitHub.
5. Correct or expire the governed route only through the separately authorised
   `MarketActivation` control path; never through monitoring.
6. Re-run health. A valid report with zero actionable routes closes the Issue
   automatically.

## Rollback

An application revert restores the previous monitor interpretation without
changing any route or commercial record. Disable the scheduled workflow only
if it is itself causing harm. Rotate the monitor token in both secret stores if
exposure is suspected; never print or copy its value into an Issue or log.
