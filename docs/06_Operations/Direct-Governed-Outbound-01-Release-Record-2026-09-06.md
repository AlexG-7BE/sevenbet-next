# DIRECT-GOVERNED-OUTBOUND-01 Release Record

- **Execution date:** 6 September 2026
- **Authority:** explicit Founder instruction `DIRECT-GOVERNED-OUTBOUND-01`
- **Baseline `origin/main`:** `2ebe1d76c9e70b278acbbfb3ac69d4864867c9c4`
- **Accepted implementation head:** `2124d6c35dd916158342af8f37a8616474cac1a5`
- **Application pull request:** [#165](https://github.com/AlexG-7BE/sevenbet-next/pull/165)
- **Documentation closure pull request:** [#166](https://github.com/AlexG-7BE/sevenbet-next/pull/166)
- **Production application merge SHA:** `02034b520ecd2c0c6f2ebd1605baa4c4b7275cb5`
- **Production deployment:** `dpl_DcAiTyArEtqLYQZpNco1yrKymU47`
- **Status:** COMPLETE — DEPLOYED AND VERIFIED IN PRODUCTION

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
| Focused implementation tests | Direct-governed-outbound suite 79/79; commercial creative suite 88/88; market 113/113; GB market 134/134; commercial activation 4/4; commercial platform 28/28; public integrity 61/61; public IA 34/34; placement media 42/42; MVP runtime 44/44 plus analytics report 3/3. Lint, typecheck, Prisma validation, optimized build and `git diff --check` passed under Node 24. |
| Full required CI | Accepted head `2124d6c35dd916158342af8f37a8616474cac1a5`: run [33990444548](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33990444548), with Agent Core, Quality, Database / Migration Verification and Build / Browser all successful. Exact merge SHA: run [33991249952](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33991249952), with the same four required jobs successful. |
| Vercel Preview | Ready deployment `dpl_CAzi9waBHoPr4JQie8Myc2UddV7F`; canonical branch alias `https://sevenbet-next-git-codex-direct-gover-a35581-alexg-7bes-projects.vercel.app`. GitHub's Vercel check was successful. |
| Manual Preview 390/430/768/1024/1280/1440 | No horizontal overflow, leaving copy, commercial confirmation surface, raw partner href or normal `/outbound/{slug}` action. Preview intentionally retained its configured affiliate kill switch: no authorized CTA was exposed, and the compatibility route failed closed through unavailable. No provider configuration was changed to manufacture a Preview click. |
| Commercial MCP exactly 4 tools | `npm run mcp-bridge:test`: 32/32; official-client discovery remained exactly four Commercial tools. |
| Media MCP exactly 5 tools | `npm run media-ingestion:test`: 27/27; official-client discovery remained exactly five Media tools. |
| Pull request / merge SHA | PR [#165](https://github.com/AlexG-7BE/sevenbet-next/pull/165) merged from the accepted head into `main` as `02034b520ecd2c0c6f2ebd1605baa4c4b7275cb5` at `2026-09-05T20:49:33Z`. |
| Production deployment | GitHub's Vercel status on the exact merge SHA reports success and resolves to Ready Production deployment `dpl_DcAiTyArEtqLYQZpNco1yrKymU47`, serving `https://b4gamble.com`. |
| Production responsive/browser acceptance | At 390, 430, 768, 1024, 1280 and 1440 px, `/en/bonuses` rendered 9 visible governed CTAs and 3 visible governed creatives, all through named, keyboard-reachable first-party `/r/{slug}` anchors with the preserved new-tab and `rel` contract. Every width had zero overflow, confirmation UI, leaving copy, normal legacy action or raw external commercial href. `/en/best-offers`, `/en/casinos` and `/en/casino/skol-casino` passed the same boundary checks. |
| Real Production click-through | One standard CTA and one commercial creative each opened a new tab, traversed the governed first-party route and reached an external HTTP(S) destination. Neither landed on unavailable or created a confirmation surface. The destination values were not emitted into test output or this record. |
| Route compatibility | Status-only probes for three live `/r/{slug}` routes returned 302. `/outbound/21-prive-welcome` returned 307 with same-origin `Location: /r/21-prive-welcome`; an invalid slug returned 307 with same-origin `Location: /outbound/unavailable`. |
| Production smoke / logs | `PRODUCTION_SMOKE_BASE_URL=https://b4gamble.com npm run ops:smoke` passed all nine read-only routes. Exact-deployment logs recorded the exercised `/r/{slug}` requests as 302 and legacy requests as 307; the post-release window contained zero 5xx entries and zero error-level entries. |

## Release conclusion

`DIRECT-GOVERNED-OUTBOUND-01` is complete. The normal commercial journey now
requires one user activation while the existing server-side commercial, GEO,
legal and destination authority remains cumulative and unchanged. Preview's
fail-closed configuration and Production's authorized route inventory both
behaved as designed. No database, migration, provider, partner destination,
MCP tool surface or Media subsystem was changed.

## Rollback

Rollback is the normal RFC-013 application rollback to the last known-good
deployment. It requires no schema, data, provider or partner configuration
change. The `/r` feature flag and cumulative commercial gates remain independent
containment controls throughout.
