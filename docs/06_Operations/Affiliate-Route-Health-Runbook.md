# Affiliate Route Health Runbook

**DETECTED / RELEASE CANDIDATE — 3 September 2026:** the checker, protected
endpoint and deduplicated workflow described here exist on the
commercial-platform code completion branch. Production enablement is recorded
only after the corresponding release is verified.

## Scope

`npm run affiliate:health` checks only route-country records explicitly marked Production-eligible whose network, programme, offer, tracking link, and redirect are active. It reads the existing PartnerRoute projection and never changes route, evidence, jurisdiction, or policy state.

Supported filters:

- all routes: `npm run affiliate:health`;
- one Casino: `npm run affiliate:health -- --casino <id-or-slug>`;
- one GEO: `npm run affiliate:health -- --geo <country-code>`;
- JSON: add `--json`.

No active routes is a healthy empty result. A real failed route produces a non-zero exit.

## Checks and states

The checker validates HTTPS/public-network targets, current PartnerRoute eligibility, finite manual redirects, HTTP status, expected final host/path, and required attribution-key presence. It uses HEAD first and a non-converting one-byte GET only for servers that reject HEAD.

- `HEALTHY`: safe finite route reached the expected destination;
- `DEGRADED`: an unusual non-error HTTP response needs review;
- `EXTERNAL_CHALLENGE`: an identified CDN/bot challenge, not automatically a broken relationship;
- `BROKEN`: unsafe URL, missing governed route, loop, network failure, 4xx/5xx, or projection failure;
- `EXPIRED`: route authority or HTTP 410 expired;
- `CROSS_GEO`: final host/path differs from the exact market expectation;
- `ATTRIBUTION_FAILURE`: required attribution key is absent.

Outputs contain safe route IDs, Casino/GEO, status, reason, and final hostname only. They omit raw tracking URLs, query values, credentials, and visitor data.

## Daily workflow and alerts

`.github/workflows/affiliate-route-health.yml` runs daily at 05:37 UTC and may be dispatched manually. It calls the bearer-protected Production endpoint `/api/internal/affiliate/route-health` using the same `AFFILIATE_HEALTH_MONITOR_TOKEN` held in GitHub Actions and Vercel Production secret stores.

On failure the workflow opens or updates one issue titled `[Production] Affiliate route health alert`, then fails the workflow. On recovery it closes that issue. It never creates one issue per day.

## Response

1. Open the workflow run and deduplicated issue.
2. Identify Casino × GEO × route and failure class.
3. Re-run the scoped CLI command.
4. Inspect current partner portal status and evidence without copying secrets into GitHub.
5. Correct or expire the governed commercial record through the normal activation workflow; do not weaken jurisdiction or PartnerRoute rules.
6. Re-run health. The next successful workflow closes the alert automatically.

## Rollback

Disable the scheduled workflow only if it is itself causing harm; leave the protected endpoint secret in place. A code rollback removes checker/endpoint/workflow changes but does not alter affiliate records. Rotate the monitoring token in both stores if exposure is suspected.
