# DIRECT-GOVERNED-OUTBOUND-01 Release Record

- **Execution date:** 6 September 2026
- **Authority:** explicit Founder instruction `DIRECT-GOVERNED-OUTBOUND-01`
- **Baseline `origin/main`:** `2ebe1d76c9e70b278acbbfb3ac69d4864867c9c4`
- **Status:** RELEASE CANDIDATE — PREVIEW, MERGE AND PRODUCTION EVIDENCE PENDING

## Decision and bounded scope

The Founder removed the mandatory outbound confirmation popup/page from the
normal commercial journey. The implementation changes only the user-facing
handoff and legacy compatibility behavior:

```text
OLD: CTA/creative → /outbound/{slug} or dialog → second click → /r/{slug} → partner
NEW: CTA/creative → /r/{slug} → governed server check → partner
```

No affiliate destination, affiliate/campaign/creative ID, GEO policy,
legal/contract gate, offer eligibility, media assignment, database record,
Commercial MCP, Media MCP or partner tracking semantic is changed.

## Detected implementation

- `GovernedCommercialAction` renders the authorized `action.href` directly,
  preserves the normal semantic anchor, accessible name, placement/source/media
  metadata, new-tab behavior and `rel="nofollow sponsored noopener"`, and does
  not prevent navigation or render a dialog.
- Direct CTA/creative activation records the bounded `outbound_intent` outcome
  `direct`. Historical `confirmation_opened` and `continued` values remain
  accepted by the closed parser for backward compatibility. Public product
  analytics remains disabled by repository policy.
- `/outbound/{valid-slug}` issues an internal server redirect to `/r/{slug}`.
  Invalid slugs remain same-origin and fail closed through
  `/outbound/unavailable`.
- `CommercialHandoffConfirmation` and its now-unused modal/page styling are
  removed. `CommercialHandoffUnavailable` remains intact.
- Normal rendered public CTA and creative markup contains `/r/{slug}`, never a
  raw partner URL and never `/outbound/{slug}` as its action.

## Preserved `/r` authority

`app/r/[slug]/route.ts` is unchanged. It still requires affiliate redirect
enablement, derives GEO only from the trusted server-side request signal, calls
`affiliateRedirectService`, preserves jurisdiction logging, fails closed to
`/outbound/unavailable`, uses `safeAffiliateRedirectResponse`, requires an
authorized stored destination for the final 302 and records outbound clicks
best-effort. Raw affiliate destinations remain absent from public HTML.

## Verification ledger

| Gate | Evidence |
| --- | --- |
| Focused pre-change baseline | 68/69 passed; one stale source-shape assertion on current `main` was corrected in the candidate. |
| Focused implementation tests | PENDING final exact-head run |
| Full required CI | PENDING |
| Vercel Preview | PENDING |
| Manual Preview 390/430/768/1024/1280/1440 | PENDING |
| Commercial MCP exactly 4 tools | PENDING |
| Media MCP exactly 5 tools | PENDING |
| Pull request / merge SHA | PENDING |
| Production deployment / smoke / logs | PENDING |

## Rollback

Rollback is the normal RFC-013 application rollback to the last known-good
deployment. It requires no schema, data, provider or partner configuration
change. The `/r` feature flag and cumulative commercial gates remain independent
containment controls throughout.
