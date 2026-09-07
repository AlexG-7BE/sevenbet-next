# BGA-MEDIA-E2E-01 Release Record

- **Execution date:** 7 September 2026
- **Authority:** explicit Founder instruction `B4GAMBLE FOUNDER OFFICE — END-TO-END BGA MEDIA COMPLETION`
- **Application pull request:** [#178](https://github.com/AlexG-7BE/sevenbet-next/pull/178)
- **Accepted application commits:** `670f8a1` and `f07abc6`
- **Production application merge SHA:** `6fc8a7cf2aa79ed435b427579c15e35f3218f538`
- **Production deployment:** `dpl_WPgC21HgnvTNDDXMqieY5prqpDBL`
- **Canonical Production URL:** `https://b4gamble.com`
- **Release status:** **HOLD — MEDIA DEPLOYED AND VERIFIED; COMMERCIAL AUTHORITY ABSENT**

This record contains no secret value, raw affiliate destination, visitor data
or Programme data. Implementation and Production claims are classified as
**DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or **CONTRADICTION**.

## Outcome

**DETECTED:** the complete supplied Betsson Group Affiliates media source was
reconciled. Exactly 52 of 88 Bannerflow rows had one supportable Casino, offer,
governed tracking link and exact country scope. Those 52 records are active,
validated, destination-verified, assigned to their existing subjects and
captured in immutable published Casino snapshots. Production renders the
selected partner creatives through B4-owned same-site frames.

**DETECTED:** no external referral action was activated. The three existing
offers and their programmes remain `DRAFT`; all 52 exact tracking-link country
records remain `productionEligible=false`; the selected route projections all
return the same cumulative fail-closed reason set. Public creative presentation
is therefore informational and its outbound action remains unavailable.

**DETECTED:** no Programme, Help, score, offer term, reward, GEO policy,
partner destination, Casino identity or factual market record was created or
changed. No migration ran and no row was deleted.

## Source boundary

The evidence file was `betsson_media_store_embed_codes.csv`: 88 data rows plus
one header and SHA-256
`0d319ac2fc0ad76fac90f09657e69f5439af434af314b6111f6bbe6ab27b827f`.
It contained 88 distinct provider identities and 88 distinct destinations.

| Classification | Rows | Decision |
| --- | ---: | --- |
| Inkabet / PE | 29 | supported through the exact existing Inkabet offer, redirect and PE tracking links |
| Betsson / PE | 7 | supported through the exact existing Betsson offer, redirect and PE tracking links |
| Betsafe / EE | 9 | supported through the exact existing Betsafe offer, redirect and EE tracking links |
| Betsafe / LV | 7 | supported through the exact existing Betsafe offer, redirect and LV tracking links |
| Betsson / CL | 9 | blocked; outside the authorised target scope |
| Betsson / SE | 10 | blocked; outside the authorised target scope |
| Betsson / unspecified | 8 | blocked; generic LATAM evidence was not converted into exact authority |
| Betsafe Baltics / unspecified | 9 | blocked; country-silent rows, including the reported `6a10188b5728eb32b1e5fea4…` conflict family, were not assigned |

**DETECTED:** unsupported-source assignments are zero. No country, language,
offer relationship or destination was inferred to force a blocked row into the
release.

## Existing governed graph

| Casino / GEO | Casino | AffiliateOffer | AffiliateRedirectSlug | Public slug |
| --- | --- | --- | --- | --- |
| Inkabet / PE | `804f1724-f939-5ad0-b997-ea27cb239e2c` | `7688f533-1f9b-5a93-9c76-ca585466bdae` | `be3e689f-9f19-584d-a35d-8874d638ff88` | `inkabet-casino` |
| Betsson / PE | `2c6b8a18-5bfa-59c6-8d17-c8a43c75b081` | `3ad6d589-c754-4dc9-94e9-1ceef455206a` | `338de328-e879-4253-bafa-187d29977c14` | `betsson-casino` |
| Betsafe / EE + LV | `90934fb5-9efe-57ad-9bf1-6435003f961b` | `8c6da8b6-5d8b-5104-a55d-ecc69d4df1aa` | `afa62863-7da8-5145-9f94-6dae8ca46754` | `betsafe-casino` |

**DETECTED:** all three Casinos remain `PUBLISHED`. All three offers, parent
programmes and programme workflows remain `DRAFT`. The 52 matched tracking
links were already active, non-archived, unique and exact-country scoped, so no
tracking-link activation was required.

## Production mutation ledger

The operation used four independently recorded 52-item ingestion batches and
16 subject/country-isolated plans. Earlier attempts stopped at review or
transaction boundaries; committed writes remained idempotent and auditable.

| Record family | Created | Updated / reused | Deactivated | Deleted | Final state |
| --- | ---: | ---: | ---: | ---: | --- |
| `PartnerHostedCreative` | 10 | 198 audited upsert-update events: 42 on the first pass and 52 on each of three replays | 0 | 0 | 52 unique active, validated, verified records |
| Media ingestion batches | 4 | each retained as audit evidence | 0 | 0 | four 52-item batches; zero rejected or review-required intake rows |
| Media ingestion plans | 16 | 16 analysis events and 5 committed apply-plan events | 0 | 0 | durable subject/country plans retained |
| Offer hosted assignments | 9 | 2 exact incumbents retained | 4 | 0 | 11 active exact assignments |
| Casino-profile hosted assignments | 7 | 4 exact incumbents retained | 5 | 0 | 11 active exact assignments |
| `CasinoVersion` | 3 | 0 | 0 | 0 | one new immutable current snapshot per Casino |
| Exact tracking links | 0 | 52 matched and reused; 0 activated | 0 | 0 | 52 active; 0 Production-eligible |

The four offer deactivations comprise two stale global Inkabet assignments and
two replaced Betsafe mobile assignments. The five profile deactivations
comprise three stale global Inkabet assignments and two replaced Betsafe mobile
assignments. Final stale active assignment counts are zero for both families.

The recorded batch IDs are:

- `fea37a31-f414-4828-ad30-5ef2a5597579` — 10 created / 42 reused;
- `7861cff1-74a3-49db-a4b0-955f0e3cef28` — 0 created / 52 reused;
- `495389a9-e4eb-4fac-9ccc-777377ad9b83` — 0 created / 52 reused; and
- `9cbf4c24-1116-48ac-a340-468089555476` — 0 created / 52 reused.

## Final assignment ledger

All entries use `CASINO_OFFER_BLOCK` for the offer assignment and
`CASINO_DIRECTORY_CARD` for the public profile projection. Language is
explicitly `UNKNOWN`, not neutral.

| Casino / GEO / variant | Creative / provider ID / size | Tracking link | Offer assignment | Profile assignment |
| --- | --- | --- | --- | --- |
| Inkabet PE DEFAULT | `b1844b2f-2908-44ab-911a-32de0d5fa32d` / `68b7f8946327a220ccefa54b` / 300×250 | `e2ed910b-3b95-4960-a6df-00c47e8a54d2` | `60dba536-1ffb-4fe0-9ff3-4d13bf49960f` | `8f03078d-a7ab-427b-843d-20696d856dd7` |
| Inkabet PE MOBILE | no exact assignment; safe DEFAULT fallback to `b1844b2f-2908-44ab-911a-32de0d5fa32d` | same DEFAULT link | none | same DEFAULT assignment |
| Inkabet PE DESKTOP | `3595abcc-7fd7-4f92-97f8-ba3a9bce8b4e` / `68b7f8946327a220ccefa558` / 728×90 | `b931e957-112a-4e35-b3cf-33dcb470dfd2` | `3b322de4-4056-4862-933a-30cac7d723b2` | `dcaea555-d001-4508-a41a-7c3e7b4781d6` |
| Betsson PE DEFAULT | `75b211ca-854c-4a10-8677-06303122eccb` / `66d092d7d762e0beba0936c5` / 300×250 | `cb03c14c-337d-4911-ba76-0e274ec20e4f` | `545ac3ad-52e6-46f3-bfed-245c3f125101` | `11658272-d3cb-45bf-b7a8-8963b09dbe6d` |
| Betsson PE MOBILE | `9a4ecd08-52e9-46c4-babd-255747d69d66` / `66d092d7d762e0beba0936c4` / 300×100 | `6bd194f3-955c-440f-93b2-3de03145ff36` | `37af57a8-e236-4d66-9f25-a24cf563f233` | `f00c2e84-b2b6-4e21-84e2-de17965ccd40` |
| Betsson PE DESKTOP | `f404f335-4e47-4f73-8ca2-0ea7e1ff8898` / `66d092d7d762e0beba0936c8` / 728×90 | `0fd45d53-1395-49cf-bdda-f4587b46bad1` | `cbb4a191-f3e2-4b20-a91c-075285205622` | `e44e00a1-5f38-417c-9286-8f9cf465fa86` |
| Betsafe EE DEFAULT | `4eb5e1a7-0058-46de-96b4-1fce72f47b71` / `6a1017fee7be921323b816c8` / 300×250 | `220f4134-90a6-47d9-96f8-cef02c32d42e` | `30939238-1fbb-4f58-bd81-e7f5ddab960a` | `e5845d04-6bf1-413b-860a-2b361390e0fc` |
| Betsafe EE MOBILE | `0a35dc8f-c8da-483f-8646-9fc628a19063` / `6a1017fee7be921323b816c7` / 300×100 | `ce028c22-05f5-48da-9873-6c5a71cd5404` | `585f70b2-f390-493e-8e27-6bf9aaf833c2` | `80e58e60-0a4e-4aef-a775-213afd51ad40` |
| Betsafe EE DESKTOP | `675c882b-86e6-495c-bfc7-dfc787bbc284` / `6a1017fee7be921323b816cc` / 728×90 | `96838c6d-cfa5-4966-a2df-afb11d3bf34c` | `3916df3a-7ad4-4374-9201-326b15d718c3` | `6607c469-2014-43d1-aa7b-0ad0c83bb8e9` |
| Betsafe LV DEFAULT | `ff1a0276-bb2e-46a1-bd60-ae441a27e9bb` / `666bf999137dd6c92914a2eb` / 300×250 | `013bd1a6-e4d4-4035-bea9-29b5479322f4` | `e6f64b8c-05c2-4a26-b060-5e33b814829c` | `d44e2536-3408-47ff-bc02-c73dfc434394` |
| Betsafe LV MOBILE | `db5b0aee-6809-42f7-8a4c-712f273300bf` / `666bf999137dd6c92914a2ef` / 320×100 | `6643cc01-f313-47e6-98b7-b13581a8c166` | `9330d23f-7a99-462c-81c0-4e359f47e65d` | `bb305fbe-1b38-4930-9ef4-5cadd307fd6c` |
| Betsafe LV DESKTOP | `43a02494-5c87-4db8-8f13-ac6ddc59240f` / `666bf999137dd6c92914a2f3` / 728×90 | `8136508e-b99f-4b8e-972a-c1f7b919ae4b` | `12622940-b876-4c0c-b665-d75285650e50` | `3bb319aa-de57-4fad-a59c-2f310def6db6` |

**DETECTED:** the three 320×50 Inkabet mobile candidates all remained blocked
by `RECOMMENDATION_REQUIRES_REVIEW`. No manual override or fabricated exact
assignment was used. The public resolver materializes the exact PE DEFAULT
creative as its safe responsive fallback.

## Immutable publication evidence

| Casino | Current version | Version ID | Evidence checksum |
| --- | ---: | --- | --- |
| Inkabet | 3 | `88c85ebc-0f27-484c-998c-da5c0138a2e9` | `60b67c885a46be66c3b0c5b6cad8f5655a8a883458eb6647f717e66b242e1207` |
| Betsson | 4 | `7d36be42-c8d3-480c-a459-438a54475528` | `0662f92f20136f92b99c89e2309a355145eef70fc794af04a3afd18a86ec2e75` |
| Betsafe | 3 | `8eb427f4-4bcb-4199-af9a-c7ef568ec24a` | `42e002cd0f9a23826ac88d68e9a77f4e622589c20eeb2f2d310cf6af71a8bbc6` |

The Production migration projection remained 32 rows with fingerprint
`ce40d6000ceffef5f593a80120fb4941d6546c3a7a6441bc6bffd58065d344d7`
before and after the operation. Only the already-approved rolled-back baseline
rows `0002_program_builder` and `0015_active_control_program_flow` are
unfinished.

## Code correction and release path

**DETECTED:** the earlier lifecycle check allowed draft media application only
when the parent Casino was also draft. PR #178 preserves the existing strict
Casino and Bonus rule while allowing an exact same-Casino `DRAFT`
`AffiliateOffer` to receive review-safe media when its Casino is already
`PUBLISHED`. It also:

- applies exact Founder target context to provider-country-silent hosted media
  only when one country is supplied;
- rejects source/target conflicts and country fan-out;
- passes corrected targeting into the existing hosted binding;
- prevents the deployment bootstrap from replacing an exact active incumbent;
  and
- adds unit, PostgreSQL and renderer regression coverage.

The code files changed by the application PR were:

- `lib/media-operations/repository.ts` — subject-aware draft lifecycle checks;
- `lib/media-operations/partner-hosted.ts` — exact hosted target-context rule;
- `lib/media-operations/service.ts` — target correction before binding;
- `scripts/bga-media-first-casino-bootstrap-01.ts` — exact-slot incumbent guard;
- `tests/media-operations-bulk.test.ts` — target conflict/fan-out coverage;
- `tests/media-ingestion-autoplacement-postgres.test.ts` — published-Casino / draft-offer lifecycle coverage;
- `tests/partner-hosted-render-only.test.ts` — bootstrap durability coverage; and
- `docs/05_Engineering/Media-Ingestion-Contract.md` — governing contract correction.

PR #178 passed Agent Core, Quality, Database / Migration Verification,
Build / Browser and Vercel. It merged normally; the exact merge deployed Ready
as `dpl_WPgC21HgnvTNDDXMqieY5prqpDBL`. The sensitive Production variable
`VETTED_PARTNER_HOSTED_CREATIVES_ENABLED` was enabled without recording its
value in repository evidence.

## Production acceptance

**DETECTED:** read-only service verification resolved all 12 responsive
projections: 11 exact assignments plus the Inkabet PE mobile DEFAULT fallback.
All 52 supported creative records retained their exact Casino, offer, tracking,
redirect, country, source checksum and destination hash. Active stale assignment
and blocked-source assignment counts were zero.

**DETECTED:** independent country-origin probes reached the live Production
casino-page component at HTTP 200. Each response contained the hosted-media
component and every expected creative ID for that market:

| Live page | Probe | Evidence |
| --- | --- | --- |
| Inkabet PE | Lima, PE | [measurement `2ZpyQQfE2R66JseDk000215dh`](https://globalping.io?measurement=2ZpyQQfE2R66JseDk000215dh): DEFAULT + DESKTOP IDs; mobile uses DEFAULT fallback |
| Betsson PE | Lima, PE | [measurement `2maarU2YZ9Euka9WS000215dg`](https://globalping.io?measurement=2maarU2YZ9Euka9WS000215dg): DEFAULT + MOBILE + DESKTOP IDs |
| Betsafe EE | Johvi, EE | [measurement `2oL1GP9Ye1BViAYFI000215dh`](https://globalping.io?measurement=2oL1GP9Ye1BViAYFI000215dh): DEFAULT + MOBILE + DESKTOP IDs |
| Betsafe LV | Riga, LV | [measurement `2JSSZ6Y1ycFbZI7Rk000215dh`](https://globalping.io?measurement=2JSSZ6Y1ycFbZI7Rk000215dh): DEFAULT + MOBILE + DESKTOP IDs |

These were credential-free requests from actual country probes, not forged
Vercel GEO headers. Each bounded response contained one
`data-casino-profile-hosted-media` component and no unavailable-frame marker.

**DETECTED:** all 11 selected Production frame routes rendered non-empty
provider content. Observed provider traffic remained on `c.bannerflow.net`.
The four DEFAULT frames displayed the expected Peruvian, Estonian or Latvian
creative copy; all seven additional responsive frames also rendered with one
content child and no unavailable state.

**DETECTED:** the four live B4 governed creative-click probes returned HTTP 303
to `/outbound/unavailable`, never an external destination. Exact-country route
resolution independently returned `productionEligible=false` with:

- `PROGRAM_INACTIVE`;
- `PROGRAM_NOT_PUBLISHED`;
- `OFFER_INACTIVE_OR_EXPIRED`;
- `TRACKING_VERIFICATION_MISSING_OR_STALE`; and
- `PRODUCTION_AUTHORITY_ABSENT`.

## Rollback and containment

Immediate presentation containment is the independent
`VETTED_PARTNER_HOSTED_CREATIVES_ENABLED` kill switch. Disabling it removes the
partner-hosted projection without deleting evidence or changing commercial
authority. Application rollback follows the normal last-known-good deployment
path. If data rollback is separately authorised, the exact 11 offer and 11
profile assignment identities above can be deactivated and the prior immutable
Casino versions republished through the ordinary governed workflow; creative,
batch, plan and audit evidence remains retained. No migration reversal or
destructive reset is required.

## Remaining release gate

**UNKNOWN / NOT GRANTED:** governed Production commercial authority for Inkabet
PE, Betsson PE, Betsafe EE and Betsafe LV. The current programmes/offers are not
published and active, tracking verification is missing or stale, and every
exact country route remains `productionEligible=false`. Until all cumulative
commercial controls are satisfied through their owning workflow, the correct
release status is **HOLD**.
