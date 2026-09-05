# SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01 Release Record

- **Execution date:** 6 September 2026
- **Authority:** explicit Founder instruction `SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01`
- **Baseline `origin/main`:** `fa6512b3df51a39867b8c9ec3e411d3b7693f037`
- **Accepted implementation heads:** `9a1c6d382c88146dcbfdb946fae7c860c27f6973`, `741aa9f57adbd1ac99a73a2dc30a22fa443bdf08`
- **Application pull requests:** [#167](https://github.com/AlexG-7BE/sevenbet-next/pull/167), [#168](https://github.com/AlexG-7BE/sevenbet-next/pull/168)
- **Application merge SHAs:** `b28c43a2d77bdb520a857ddbc6f53738159e03e9`, `0fc312db5bfbf4f6064454b94bb3a1e00f61dd59`
- **Final Production deployment:** `dpl_8GB8majgeNzx7v9wHdCVHZ16oxGb`
- **Status:** COMPLETE — DEPLOYED, REPAIRED AND VERIFIED IN PRODUCTION

## Decision and bounded scope

The Founder authorized a route-destination integrity repair for the six active
Superfly brands. This release changed only exact server-side campaign
destinations, their checksum provenance and the guarded operational executor.
It did not change `/r` governance, GEO policy, blocks, offers, scores, media,
MCP surfaces, commercial eligibility, outbound UX, Bannerflow, schema or
future architecture.

No RFC was required: this was a bounded Production data correction under the
existing RFC-013 release path and RFC-015/RFC-038 destination authority.

## Authoritative evidence and defect classification

**DETECTED:** the authenticated Superfly portal exposed exactly six active
campaigns for the B4GAMBLE affiliate, with one canonical campaign link per
scoped brand. The live Production CRM contained the same six active
programme/offer/link/redirect graphs and the exact preserved seven-country
block set (`DK`, `ES`, `FI`, `NO`, `CL`, `SE`, `GB`).

**DETECTED:** five Production `AffiliateTrackingLink.destinationUrl` and
`trackingUrl` values ended with a terminal period. Their linked programme/link
metadata checksums described those dotted values. Skol was already the exact
clean canonical campaign destination.

**INFERRED ROOT CAUSE:** the prior evidence extractor used a whitespace-bounded
URL token, so sentence-ending punctuation in five CRM evidence claims was
consumed as URL path content and then checksum-bound as if canonical. The new
extractor accepts only the exact Superfly campaign shape and may exclude one
sentence period only when the resulting clean value matches the governed
checksum. It is not a generic URL cleaner.

**CONTRADICTION:** the initial six-broken-route premise did not match live
Production evidence for Skol. Skol was therefore an explicit no-op, not an
unnecessary rewrite.

## Per-brand acceptance ledger

| Brand | B4 slug | Old destination state | Root cause | New exact destination type | Superfly response | Final casino host | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 Privé | `21-prive-welcome` | Campaign URL plus terminal `.` | Sentence punctuation consumed and checksum-bound | Canonical campaign; no fallback | 302, one hop | `21prive.com` | PASS |
| Skol Casino | `skol-casino-welcome` | Canonical campaign; already clean | No defect detected | Existing canonical campaign; no rewrite/fallback | 302, one hop | `www.skolcasino.com` | PASS |
| Slotnite | `slotnite-welcome` | Campaign URL plus terminal `.` | Sentence punctuation consumed and checksum-bound | Canonical campaign; no fallback | 302, one hop | `www.slotnite.com` | PASS |
| Hello Casino | `hello-casino-welcome` | Campaign URL plus terminal `.` | Sentence punctuation consumed and checksum-bound | Canonical campaign; no fallback | 302, one hop | `www.hellocasino.com` | PASS |
| G'day Casino | `gday-casino-welcome` | Campaign URL plus terminal `.` | Sentence punctuation consumed and checksum-bound | Canonical campaign; no fallback | 302, one hop | `www.gdaycasino.com` | PASS |
| Diamond7 | `diamond7-welcome` | Campaign URL plus terminal `.` | Sentence punctuation consumed and checksum-bound | Canonical campaign; no fallback | 302, one hop | `www.diamond7casino.com` | PASS |

The six provider requests were performed once against the portal-generated
canonical campaign links before mutation. Each returned a single Superfly 302
to the matching operator landing host, with no Superfly error page, wrong
brand or redirect loop. After repair, each first-party `/r/{slug}` was requested
once without following the external response; all six returned 302 and the
Location checksums exactly matched those already-verified canonical campaign
links. This composes the end-to-end chain without generating a second set of
external partner clicks.

## Production mutation ledger

- One Serializable transaction updated the five affected tracking-link
  destination/tracking values and linked checksum provenance, created five new
  link revisions and five audit records. Skol remained unchanged.
- No row was created, deleted, archived, re-associated or made newly eligible.
  Offer/link country rows, redirect slugs, programme/offer/link active state and
  commercial source authority were unchanged.
- The first guarded execution reached Prisma's default remote interactive-
  transaction timeout. The transaction rolled back atomically; an immediate
  independent audit found the same five pending rows and clean Skol state.
  PR #168 added explicit 30-second acquisition and 120-second execution bounds.
  The single retry then committed successfully.
- No temporary or creative-click fallback was installed. All six canonical
  campaign destinations were live, so the Founder-authorized fallback condition
  never activated.

## Verification ledger

| Gate | Evidence |
| --- | --- |
| Focused implementation | Route/catalog tests 23/23, targeted ESLint, typecheck and `git diff --check` passed. Strict validation rejects punctuation, query strings, alternate hosts, duplicate URL tokens and checksum mismatch. |
| Full local quality/build | Clean-worktree `npm run ci:quality`, Prisma validation and optimized Next.js build passed. The user-owned modified GB DPIA file was excluded; its unrelated local test conflict did not enter either PR. |
| PR #167 CI / Preview | Candidate run [33994958598](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33994958598) passed Agent Core, Quality, Database / Migration Verification and Build / Browser. Ready Preview `dpl_DtkYaqFEsxcDxLmBeXxMD6RF6VqD` passed nine read-only routes. |
| PR #167 merge CI / Production | Exact merge run [33995796464](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33995796464) passed all four jobs. Ready Production deployment `dpl_2YxekYR7cED9uzav5yw4aYqfUo1P` served the first merged implementation. |
| Refused write / rollback | The default transaction timeout closed the first attempt. Independent audit proved all five rows remained in their exact dotted pre-repair state, Skol remained current and no partial write occurred. |
| PR #168 CI / Preview | Candidate run [33996607756](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33996607756) passed all four jobs. Ready Preview `dpl_oLy62jrU9UEPThQCAYsANfMEu3U2` passed nine read-only routes. |
| Final Production | Merge SHA `0fc312db5bfbf4f6064454b94bb3a1e00f61dd59`; Ready deployment `dpl_8GB8majgeNzx7v9wHdCVHZ16oxGb` served `https://b4gamble.com`. The merge-triggered Production Smoke run [33997315091](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33997315091) succeeded. |
| Independent data verification | All six records were `CURRENT`; destination and evidence checksums matched; allowed projections `KZ`, `US`, `DE`, `IE`, `MX` were ON; preserved blocked projections `DK`, `ES`, `FI`, `NO`, `CL`, `SE`, `GB` were OFF; issues, destructive writes and raw URL output were zero. |
| Production route acceptance | Exactly six non-following `/r/{slug}` requests returned 302 and a checksum-matched canonical Superfly campaign destination. Nine public read-only smoke routes returned 200. Exact-deployment logs showed those six 302s, zero HTTP 500 entries and zero error-level entries in the acceptance window. |

## Release conclusion and rollback

`SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01` is complete. All six scoped B4GAMBLE
routes resolve through the unchanged server-governed `/r` boundary to a
verified canonical Superfly campaign that redirects to the correct casino host.

Containment remains the existing fail-closed route/offer/link controls. A data
rollback, if ever required, must use the recorded revisions and a separately
authorized exact reconciliation; no automatic rollback or temporary fallback
was installed.
