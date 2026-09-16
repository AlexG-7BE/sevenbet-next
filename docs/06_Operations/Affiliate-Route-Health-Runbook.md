# Affiliate Route Health Runbook

**DETECTED / PRODUCTION — 3 September 2026:** the checker, protected endpoint
and deduplicated workflow are deployed and final manual dispatch passed. See the
[commercial-platform completion release record](Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

**PROPOSED / NOT YET PRODUCTION — 16 September 2026:** the companion monitoring
change classifies operational evidence into four public monitor states, records
the checked Production commit, and suppresses unchanged issue comments. It does
not change a route, activation or commercial decision. These semantics become
Production facts only after Founder-authorised merge and deployment.

## Scope

`npm run affiliate:health` checks only canonical Casino `MarketActivation`
records whose desired and reconciled state are both `ACTIVE`. RFC-042 remains
the sole route authority: the monitor does not select routes from deprecated
`AffiliateTrackingLinkCountry.productionEligible` compatibility state and does
not re-project programme, offer, workflow, link or redirect lifecycle fields.
It never changes activation, route, evidence, jurisdiction or policy state.

Supported filters:

- all routes: `npm run affiliate:health`;
- one Casino: `npm run affiliate:health -- --casino <id-or-slug>`;
- one GEO: `npm run affiliate:health -- --geo <country-code>`;
- JSON: add `--json`.

No active routes is a healthy empty result. A real failed route produces a non-zero exit.

## Checks and states

Each claim is passed to the existing RFC-042 `MarketActivation` route verifier,
which validates HTTPS/public-network targets, finite manual redirects, HTTP
status, the exact market/operator host and path expectation, required
attribution-key presence and bounded terminal content. It uses an ordinary
visitor-shaped GET. The shared low-level checker also retries a synthetic HEAD
`404`, `405` or `501` with that GET when invoked by a HEAD-based caller. A real
GET error or disguised 200 error page still fails closed. Canonical `www` and
non-`www` forms of the same expected operator host are equivalent.

- `HEALTHY`: safe finite route reached the expected destination;
- `DEGRADED`: an unusual non-error response or inconclusive verifier transport needs review;
- `EXTERNAL_CHALLENGE`: an identified CDN/bot challenge, not automatically a broken relationship;
- `BROKEN`: unsafe URL, missing canonical relationship, loop, 4xx/5xx, or terminal error page;
- `EXPIRED`: route authority or HTTP 410 expired;
- `CROSS_GEO`: final host/path differs from the exact market expectation;
- `ATTRIBUTION_FAILURE`: required attribution key is absent.

Outputs contain safe route IDs, Casino/GEO, status, reason, and final hostname only. They omit raw tracking URLs, query values, credentials, and visitor data.

The GitHub alert layer deliberately collapses those detailed verifier results
into four incident states:

- `HEALTHY`: the current material route has `verificationSource=DIRECT` and the
  direct verifier returned `HEALTHY`;
- `EXTERNAL_CHALLENGE`: the direct request reached an identified CDN/bot
  challenge, so the relationship is not labelled broken without evidence;
- `VERIFIER_INCONCLUSIVE`: transport, endpoint, malformed-report or verifier
  evidence cannot establish route state; and
- `ROUTE_BROKEN`: a material route has a direct or canonical failure such as a
  missing relationship, HTTP failure, expiry, wrong GEO or attribution loss.

Each v2 report includes the direct check time, last persisted direct success
when available, and exact `MarketActivation` identity/version as an evidence
revision. The alert evaluates direct-success freshness against the seven-day
operational threshold. Crossing that threshold is a state change for notification
deduplication; it does not rewrite canonical evidence.

## Daily workflow and alerts

`.github/workflows/affiliate-route-health.yml` runs daily at 05:37 UTC and may be dispatched manually. It calls the bearer-protected Production endpoint `/api/internal/affiliate/route-health` using the same `AFFILIATE_HEALTH_MONITOR_TOKEN` held in GitHub Actions and Vercel Production secret stores.

On failure the workflow opens or updates one issue titled `[Production] Affiliate
route health alert`, then fails the workflow. The issue body records Production
SHA, workflow source SHA and run ID, check time, evidence revision, last direct
success and freshness when available. The body may be refreshed on every run,
but a comment is added only when the state signature changes because the
classification, affected route set or freshness band changed. Evidence detail
and revision updates still refresh the body without producing comment noise.
Identical reruns therefore do not generate identical comments.

An open incident is closed automatically only when a non-empty current report
contains exclusively directly verified `HEALTHY` material routes. A stored state,
manual/Founder override, malformed result or empty route set cannot independently
close an existing issue. An empty canonical route set remains a valid quiet
result only when there is no open incident to erase. The monitor never changes
commercial records.

## Response

1. Open the workflow run and deduplicated issue.
2. Identify Casino × GEO × route and failure class.
3. Re-run the scoped CLI command.
4. Inspect current partner portal status and evidence without copying secrets into GitHub.
5. Correct or expire the governed route through the normal `MarketActivation`
   controller workflow; do not weaken jurisdiction, safe-URL, relational,
   attribution or trusted-GEO controls.
6. Re-run health. A workflow run closes the alert only after all current material
   routes pass the direct recovery gate.

## Rollback

Disable the scheduled workflow only if it is itself causing harm; leave the protected endpoint secret in place. A code rollback removes checker/endpoint/workflow changes but does not alter affiliate records. Rotate the monitoring token in both stores if exposure is suspected.
