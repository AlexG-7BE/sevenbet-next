# MEDIA-INGESTION-AUTOPLACEMENT-01 Release Record — 5 September 2026

**Status:** COMPLETE — exact-head CI and Preview, Production R2 preflight,
post-merge deployment, real novel ingestion, duplicate replay, authority and
public-integrity acceptance passed

**Founder authority:** `B4GAMBLE — MEDIA-INGESTION-AUTOPLACEMENT-01` and its
5 September 2026 continuation approving Cloudflare R2 Standard

**Starting `origin/main`:**
`da14152704e52b071dad24bb532e7e3dea7f3f54`

**Implementation branch:** `codex/media-ingestion-autoplacement-01`

**Implementation pull request:**
[#157](https://github.com/AlexG-7BE/sevenbet-next/pull/157)

**Accepted implementation head:**
`11ac0bc85891b595e8577b847ab1cab4c60cd111`

**Implementation merge:**
`b9965d5ca2744bdc510baadaad48fde3c1d39fba`

**Accepted Preview:** Ready deployment
`dpl_FsH3qhTrNaJ4LN7cWqRp431ikR1W`

**Accepted Production:** GitHub deployment `6279577626`; Vercel deployment
`dpl_AWTHUgp2fp4XsVwRe4v25NKrcQoL`; Ready at
`https://sevenbet-next-92i65pobk-alexg-7bes-projects.vercel.app`

**Production origin:** `https://b4gamble.com`

**Release-record branch:**
`codex/media-ingestion-autoplacement-01-release-record`

**Release-record pull request:**
[#158](https://github.com/AlexG-7BE/sevenbet-next/pull/158)

This record contains no credential value, signed request, OAuth token/code,
raw affiliate destination, visitor data or Programme data. Claims are
classified as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or
**CONTRADICTION** under the repository technical-evidence rule.

## Executive result

**DETECTED:** the former Production hold is resolved. The existing generic S3
provider persists validated media to the approved Cloudflare R2 Standard
bucket, and first-party public retrieval uses `https://media.b4gamble.com`.
No Cloudflare-specific storage architecture was added.

**DETECTED:** one current controlled Diamond7 creative completed the real
Production path from bounded partner-style snippet through safe fetch,
validation, first-party persistence, `MediaAsset`, visual analysis and plan.
The immediate replay reused the same object and `MediaAsset`. Both plans
remained review-required, no assignment was applied and nothing was published.

## Former hold and Founder resolution

The prior terminal state was:

`HOLD — PRODUCTION FIRST-PARTY MEDIA STORAGE IS NOT CONFIGURED`

**DETECTED:** the Founder then approved and provisioned Cloudflare R2 Standard
for Production with S3-compatible semantics, bucket
`b4gamble-media-prod`, region `auto` and public base
`https://media.b4gamble.com`. Production configuration was checked by name
and safe semantic value only.

| Production setting | Result | Safe semantic evidence |
| --- | --- | --- |
| `MEDIA_STORAGE_PROVIDER` | PRESENT | `S3` |
| `MEDIA_S3_ENDPOINT` | PRESENT | HTTPS Cloudflare R2 account endpoint |
| `MEDIA_S3_REGION` | PRESENT | `auto` |
| `MEDIA_S3_BUCKET` | PRESENT | `b4gamble-media-prod` |
| `MEDIA_S3_PUBLIC_BASE_URL` | PRESENT | `media.b4gamble.com` |
| `MEDIA_S3_ACCESS_KEY_ID` | PRESENT | value not read back or recorded |
| `MEDIA_S3_SECRET_ACCESS_KEY` | PRESENT | value not read back or recorded |
| `MEDIA_S3_SESSION_TOKEN` | ABSENT | not required by the approved contract |

**DETECTED:** live Cloudflare control-plane evidence showed one active R2
Account Token for `b4gamble-media-prod` with Object Read & Write authority.
Account-wide Cloudflare authority was not required, opened or recorded.

## R2 compatibility and custom-domain preflight

An unaliased Production-target preflight deployment
`dpl_Dvm1VfANpof4u4gExrB86oYDLBya` exercised a unique disposable
`non-publication-canary` PNG. The canary was deleted after verification.

| Gate | Result |
| --- | --- |
| HTTPS endpoint | PASS — configured R2 account endpoint used by the existing S3 signer |
| Initial `HEAD` | PASS — object absent |
| `PUT` | PASS — object created with `image/png` |
| Post-write `HEAD` | PASS — size and Content-Type matched |
| Conditional duplicate | PASS — `If-None-Match: *` blocked the second write and left the object unchanged |
| Public custom-domain `GET` | PASS — HTTPS 200 from exact host `media.b4gamble.com`, byte-exact PNG |
| `DELETE` | PASS — subsequent `HEAD` confirmed absence |
| Bucket listing | PASS — not used and not required |

**DETECTED:** neither `r2.dev` nor any Cloudflare account endpoint is the
Production public base URL. No unrelated B4GAMBLE DNS was changed.

## Security and exact-head verification

**DETECTED:** exact implementation head
`11ac0bc85891b595e8577b847ab1cab4c60cd111` passed all required GitHub checks
in [CI run 33948023793](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33948023793):
Agent Core, Quality, Database / Migration Verification, Build / Browser and
Vercel Preview.

Targeted final-head evidence included:

- media-ingestion parser, SSRF, redirect, remote-fetch, MIME/signature,
  animation/GIF, dedupe and authority tests: 22/22;
- auth tests: 52/52;
- MCP bridge and exact-resource isolation tests: 31/31;
- placement-media and draft-authority regressions: 26/26; and
- the disposable-PostgreSQL `media-ingestion:postgres-test` in CI.

**DETECTED:** the PostgreSQL test guard permits only loopback disposable CI
databases. No test suite was pointed at the Production database. The release
contains no Prisma schema change or migration.

## Protected merge and Production deployment

**DETECTED:** PR #157 remained mergeable at the accepted head and was merged
through the protected GitHub workflow at `2026-09-05T09:45:13Z`. There was no
direct push to `main`.

**DETECTED:** exact merge SHA
`b9965d5ca2744bdc510baadaad48fde3c1d39fba` produced successful GitHub
Production deployment `6279577626` and Ready Vercel deployment
`dpl_AWTHUgp2fp4XsVwRe4v25NKrcQoL`. Canonical `b4gamble.com`, `www`, the
stable Vercel alias and the main-branch alias resolve to that deployment.

Canonical smoke followed locale redirects and returned 200 for `/`,
`/casinos`, `/bonuses`, `/best-offers`, `/help`, `/program` and `/login`.
Anonymous Admin routes redirected to Admin login, and the Admin ingestion API
returned 401.

## Real novel creative acceptance

The bounded acceptance used the current governed
`public/partner-preview/diamond7-generic.jpg` creative in a controlled
partner-style `<img>` snippet. It contained no anchor or tracking destination.

| Evidence | Result |
| --- | --- |
| Source type | JPEG, 250×250, controlled current repository source |
| Validated source SHA-256 | `ed7231256fab2a7a50171f817c41d0f47f7e496fd20f3a07818d7af5349540bc` |
| Snippet checksum | `1b8e5c35801c181e8fc6b987619dc41640cf7582133ba68bb6f6ee98681ddb1d` |
| Context | deterministic Diamond7 resolution; tracking destination `NOT_PRESENT` |
| Plan | `7cbc9b71-6ec8-4726-8286-6947362d7e49`, `PLANNED` |
| MediaAsset | `fb0a9f46-fb70-430e-a799-fc2cbf939f07`, ACTIVE |
| Stored SHA-256 | `180115ce2c09ce51a1c07beea9189c386b24ef673bce744817ac13621156c0a4` |
| Stored media | JPEG, 250×250, 31,520 bytes, S3 provider |
| Physical family | `CARD` |
| First-party URL | `https://media.b4gamble.com/media-ingestion/by-checksum/180115ce2c09ce51a1c07beea9189c386b24ef673bce744817ac13621156c0a4.jpg` |
| Visual classification | Diamond7 Casino, `PROMO`, English, confidence 0.94 |
| Recommendation | `SUGGEST_REVIEW`; `MARKET_SPECIFIC_REVIEW`; existing assignment `CONFLICT`; score 20 |

**DETECTED:** the public object returned HTTPS 200 with `image/jpeg`; its
downloaded body hash exactly matched the stored checksum and decoded as
250×250. Controlled metadata processing stripped source EXIF, so the processed
checksum correctly differs from the validated source-byte checksum.

**DETECTED:** no raw source URL or pasted snippet became public action
authority. The durable plan persisted safe provenance only. It created no
offer, CTA, route or tracking destination.

## Duplicate replay

**DETECTED:** the exact same snippet was immediately ingested again as plan
`0e022258-0064-4c79-bf95-73e71555f198`.

- asset state was `REUSED` with `duplicate=true`;
- `MediaAsset` ID remained `fb0a9f46-fb70-430e-a799-fc2cbf939f07`;
- checksum, public URL, dimensions, MIME and `CARD` family remained exact;
- total media assets changed only from 14 to 15 across both requests;
- controlled checksum matches remained exactly one; and
- both plans produced the same score-20 `SUGGEST_REVIEW` authority outcome.

The advisory model's second visual reading had confidence 0.98, marked crop
safe and read “Diamond in Every Spin.” That evidence variation did not broaden
authority: market/offer evidence remained insufficient, the existing explicit
assignment remained protected and apply stayed disabled.

## Draft-only authority

**DETECTED:** the real creative was review-required, so acceptance did not
override it merely to force a write. No `/apply` Production request exists,
both `appliedAssignmentId` values are null, both `rolledBackAt` values are null,
and all 46 active assignments retained the pre-ingestion digest.

**DETECTED:** the exact-head disposable-PostgreSQL test proves eligible draft
application, repeat idempotency, stale-assignment refusal and exact plan-owned
rollback. A second Production fixture was therefore unnecessary. No public
publication, `CasinoVersion` change, CTA, PartnerRoute, GEO, score or offer-term
change occurred.

## Media Operations MCP

**DETECTED:** the Production Media resource is the exact protected resource
`https://b4gamble.com/api/mcp/media` and exposes exactly:

1. `media_ingest_partner_snippet`
2. `media_analyze_and_plan`
3. `media_apply_draft_plan`
4. `media_get_plan`
5. `media_list_recent_ingestions`

Write tools require `media:safe_write`; read tools require `media:read`.
`offline_access` is optional grant lifecycle authority. There is no publish
tool.

**DETECTED:** an anonymous tools/list request returned 401 with the Media
protected-resource metadata challenge. Production dynamic-registration probes
requested a Commercial scope for the Media resource and a Media scope for the
Commercial resource; each failed with `invalid_scope` before client creation.
The expected Production Commercial and Media resources remained separately
enabled with disjoint scopes.

## Public and protected-state integrity

Read-only Production snapshots before ingestion and after duplicate replay
reported:

| Invariant | Before | After |
| --- | ---: | ---: |
| Real published Casinos | 8 | 8 |
| Published Bonuses | 6 | 6 |
| Published `CasinoVersion` snapshots | 30 | 30 |
| Active Casino assignments | 26 | 26 |
| Active Bonus assignments | 20 | 20 |
| Active AffiliateOffer assignments | 0 | 0 |
| Total active assignments | 46 | 46 |
| Media assets | 14 | 15 |
| Ingestion plans | 0 | 2 |
| Controlled asset checksum matches | 0 | 1 |

**DETECTED:** the exact pre/post SHA-256 digests matched for publication
snapshots, Casino editorial content and scores, published bonus terms, all
active assignments, CTA/routes, GEO authority and Programme state.

**DETECTED:** the structured public UI snapshot hash remained
`5d17f092b89a4ff221d58beacb904d064f2e1e3c7d0085734e3c305ce5942c4e`
before and after. Casino discovery retained eight cards; Bonuses and Best
Offers retained six governed records. The Top-3 remained 21 Privé, Skol Casino
and Slotnite with their existing terms. The checked public surfaces contained
no direct external main-content action.

**DETECTED:** Admin authority was compared semantically because the
timestamp-inclusive OAuth-resource digest changed during build collection. In
one reconciliation build, the Admin role hash
`590451f1677f2a99d80644551e57c1391e8e582da60fbc22fe4b22fc5500fef4`
and OAuth policy hash
`a7cb6e7f5f67ae9e62256ce78951cfc24ab848707974e6eab48c6a74daca2a8c`
were exact before and after; resource identifiers, names, scopes, TTLs,
disabled flags and policy versions did not change. The timestamp-inclusive
digest is deliberately not used as an authority invariant. **INFERRED:** the
coarse physical change was provider-managed timestamp churn, not an authority
change.

## Runtime logs

**DETECTED:** exact-deployment runtime records show two ingestion POSTs
returning 201, two analysis POSTs returning 200 and the first plan GET returning
200. No apply request exists.

The relevant records contain empty application message/log arrays and only
request metadata. Filtered inspection found no secret, credential, signed
Authorization header, full partner tracking URL or pasted HTML. Error- and
fatal-level queries for the exact Production deployment returned no entries.
The R2 preflight emitted only safe contract states and canary outcomes.

## Rollback and retained evidence

There is no schema rollback. Application rollback reverts PR #157 and
redeploys through the protected path. Production storage credentials can be
rotated or revoked by the storage owner without documenting their values.

For a future eligible applied plan, `media_apply_draft_plan` rollback deletes
only the exact plan-owned draft assignment and restores an explicitly replaced
draft assignment only when the slot is free. It never publishes or deletes the
underlying `MediaAsset`.

No assignment was applied in this acceptance, so no data rollback is required.
The controlled `MediaAsset` and two plans are retained as non-published audit
evidence. The disposable transport canary was deleted.

## Controlled release

| Gate | Result |
| --- | --- |
| Production configuration, names only | PASS |
| Bucket-scoped credential evidence | PASS |
| R2 PUT / HEAD / conditional duplicate / GET / DELETE | PASS |
| Exact-head CI and PostgreSQL boundary | PASS |
| Exact-head Preview | PASS |
| Protected PR merge | PASS |
| Exact-merge Production deployment | PASS |
| Novel controlled Production ingestion | PASS |
| Immediate object and `MediaAsset` dedupe | PASS |
| Review-required draft authority | PASS |
| Exact Media MCP tools and resource isolation | PASS |
| Public/product/Programme/auth semantic integrity | PASS |
| Secret-safe runtime logs | PASS |

## Final state

**DETECTED:** real Production R2 persistence and hard-gate duplicate reuse are
proven. The accepted implementation is merged and Ready, and the controlled
asset remains first-party, non-published and review-required.

`MEDIA-INGESTION-AUTOPLACEMENT-01: COMPLETE`
