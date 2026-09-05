# GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01 Release Record — 5 September 2026

**Status:** COMPLETE — capability Ready in Production; real localized creative
inventory not installed

**Founder authority:** `B4GAMBLE — GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01`

**Starting `origin/main`:**
`4c7e6814247556dd61beeff8b33fcba9c4551c57`

**Initial Production:** source
`4c7e6814247556dd61beeff8b33fcba9c4551c57`; Vercel deployment
`dpl_6Gf3NjQMgUAZJVC6qpXZBZ3bcki7`

**Implementation branch:** `codex/geo-localized-creative-assignments-01`

**Implementation pull request:**
[#163](https://github.com/AlexG-7BE/sevenbet-next/pull/163)

**Accepted implementation head:**
`7c53864cf92dc78918ae36f6e38b949af37ea354`

**Implementation merge:**
`aedfaee48cefea34ac9b1fac71315ba7c8c3df19`

**Accepted Preview:** GitHub deployment `6283475092`; post-migration Ready
Vercel deployment `dpl_3bFpLK8G6PSvX9MncwLn1cXzWcfD` at
`https://sevenbet-next-esvi5tg1x-alexg-7bes-projects.vercel.app`

**Accepted Production:** GitHub deployment `6283734100`; post-migration Ready
Vercel deployment `dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu` at
`https://sevenbet-next-dw18sjlaf-alexg-7bes-projects.vercel.app`

**Production origin:** `https://b4gamble.com`

**Release-record branch:**
`codex/geo-localized-creative-assignments-01-release-record`

**Release-record pull request:** pending creation

This record contains no database credential, OAuth token/code, raw IP, raw
partner destination, visitor data or Programme data. Claims use **DETECTED**,
**INFERRED**, **PROPOSED**, **UNKNOWN** and **CONTRADICTION** under the technical
documentation evidence rule.

## Executive result

**DETECTED:** the RFC-040 Option C assignment architecture now supports exact
country and primary-language targeting without moving jurisdiction authority
into the browser, URL, language preference, physical asset or CTA. The additive
schema, deterministic resolver, Media Operations draft workflow, immutable
publication snapshots and historical-snapshot compatibility are merged and
accepted in Production.

**DETECTED:** no real localized partner creative was installed. All 46 existing
Production assignments remain global/language-neutral (`NULL/NULL`), and the
targeted-row count is zero. This release is **CAPABILITY READY**, not **REAL
LOCALIZED INVENTORY INSTALLED**.

## Baseline and root gap

At initial main and Production, migration history ended at applied
`0027_placement_media_assignments`. Production held 26 Casino, 20 CasinoBonus
and zero AffiliateOffer assignments. Those rows selected semantic placement
and responsive variant but carried no exact country or creative-language
dimension.

The existing physical `MediaAsset` reuse model was correct, but the resolver,
immutable snapshots and Media Operations plan scope could not distinguish
`FI/fi`, `GLOBAL/en` or `SE/neutral`. Adding targeting to `MediaAsset` would
have incorrectly coupled one physical object to one market. Inferring country
from page language, URL, query or cookie would also have violated the existing
trusted-GEO boundary.

## Architecture

Targeting belongs on each typed relationship:

- `CasinoMediaAssignment.countryCode` / `languageCode`;
- `CasinoBonusMediaAssignment.countryCode` / `languageCode`; and
- `AffiliateOfferMediaAssignment.countryCode` / `languageCode`.

One `MediaAsset` can therefore be reused by multiple exact assignment scopes
without duplicating an R2 object. `NULL` country means global eligibility;
`NULL` language means language-neutral presentation. Exact country uses a
normalized two-letter uppercase code. Primary language uses normalized
lowercase alphabetic text of length 2–8.

This extends RFC-040 Option C rather than replacing it. RFC-039 commercial
authority remains separate: media eligibility and presentation cannot create
an offer, activate a route or authorize a CTA.

## Migration

**DETECTED / APPLIED:** `0028_geo_localized_creative_assignments`, immutable
SHA-256
`4511b403f4e7d72fcec972870bca0f3c61eaf673ad8b9b4ab28cf3120493ffc7`.

The migration adds six nullable text columns, bounded country/language shape
checks and one target-resolver index per typed assignment table. It contains no
default, update, backfill, table replacement, deletion or destructive
operation.

Production preflight and postflight were exact:

| Protected count | Before | After |
| --- | ---: | ---: |
| Casinos | 34 | 34 |
| Casino bonuses | 33 | 33 |
| Affiliate offers | 11 | 11 |
| Redirect routes | 11 | 11 |
| Media assets | 15 | 15 |
| Casino versions | 74 | 74 |
| Casino assignments | 26 | 26 |
| Bonus assignments | 20 | 20 |
| Offer assignments | 0 | 0 |

Independent verification found all 26 Casino and 20 Bonus rows global-neutral,
zero targeted rows and no pending migration. The same staged migration had
already passed on isolated Preview and disposable PostgreSQL.

## Trusted GEO and language

Country eligibility comes only from the server-side trusted Vercel request
country signal in positively identified Preview/Production runtimes. Public
path, query, cookie and `Accept-Language` cannot grant country authority. No raw
IP is persisted or emitted.

Presentation language comes from the existing server presentation resolver.
It never creates country eligibility. An explicit creative in another language
is not an automatic fallback: `FI/fi` cannot satisfy a Finnish request
presented in English merely because its country matches, and `IT/it` can never
satisfy an unknown-GEO request.

## Resolution contract

For known trusted country plus requested language, the target order is:

1. exact country / exact language;
2. global / exact language;
3. exact country / neutral language; and
4. global / neutral language.

When GEO is unknown, only global/exact-language then global/neutral are
eligible. When language is unavailable, only exact-country/neutral then
global/neutral are eligible for known GEO; unknown GEO uses global/neutral.

The resolver exhausts one target bucket before applying the existing placement
fallback chain and responsive variant order. Within a placement and subject
group, the requested `MOBILE` or `DESKTOP` variant wins before `DEFAULT`; stable
sort order and ID break ties. A more convenient device or placement match can
never pull in a lower-priority country/language bucket.

Wrong-country and explicit wrong-language assignments are never controlled
fallbacks. Malformed target fields fail closed. Every asset referenced by any
country- or language-targeted assignment is excluded from legacy HERO/LOGO
fallback, including when the assignment is inactive, expired or malformed.

## Media Operations

The separate Media MCP remains exactly five tools:

1. `media_ingest_partner_snippet`
2. `media_analyze_and_plan`
3. `media_apply_draft_plan`
4. `media_get_plan`
5. `media_list_recent_ingestions`

Ingestion accepts up to 20 normalized, deduplicated exact
`targetCountryCodes`, plus `creativeLanguage` and explicit language state
`EXPLICIT`, `NEUTRAL` or `UNKNOWN`. Unknown is not silently converted to
neutral. Strong text-free identity evidence may establish neutral; otherwise
uncertainty stays review-required.

Founder-declared target countries are preserved as intent. Analysis checks
brand, language, exact-market evidence and offer/currency separately. A
semantic contradiction cannot silently rewrite Founder intent and forces
review. Offer mismatch remains an independent review blocker. One accepted
physical asset expands to one draft recommendation for each exact
country/language assignment scope, with no extra R2 copy.

There is no publish MCP tool. Media tools can only produce and apply eligible
draft assignments; the existing editorial publication path remains the sole
public boundary.

## Assignment conflict, replacement and rollback

The former logical slot was subject + placement + variant. The new slot is
subject + placement + variant + country + language. Conflict detection,
replacement, audit and rollback now operate on that exact scope. Replacing
`FI/fi` cannot disturb `FI/en`, `SE/fi` or `GLOBAL/fi`.

Plan-owned rollback deletes only the exact draft assignment created by that
plan and restores an explicitly replaced draft only when its exact slot is
free. It never deletes the physical `MediaAsset` or publishes a revision.

## Immutable publication

New Casino publication snapshots carry assignment target fields. Historical
snapshots without those fields deserialize as global-neutral. Public reads
resolve only the selected media projection; they do not send the browser a
hidden full-country inventory for client-side selection.

Draft changes are not public until the existing governed publication action
creates a new immutable snapshot. CTA and route state remain independently
resolved after media presentation.

## Verification matrix

**DETECTED:** deterministic resolver acceptance passed:

| Case | Accepted result |
| --- | --- |
| FI / fi | `FI/fi` |
| FI / en | `FI/en` before `GLOBAL/en` |
| SE / sv | `SE/sv` before `GLOBAL/sv` |
| SE / en | `GLOBAL/en` before `SE/neutral`; never `SE/sv` |
| UNKNOWN / it | `GLOBAL/it`; never `IT/it` |
| Cross-GEO rejection | `FI/*` never serves SE or unknown GEO |
| Wrong-language rejection | explicit other-language rows never auto-fallback |
| Neutral fallback | `SE/neutral` then `GLOBAL/neutral` when no same-language row exists |
| Device precedence | requested responsive variant then `DEFAULT`, inside the chosen target bucket |
| Placement fallback | existing semantic chain, inside the chosen target bucket |
| Multi-country reuse | EE/en, LV/en and LT/en recommendations share one asset |
| Semantic contradiction | Founder target retained; automatic assignment blocked |
| Offer mismatch | independent review requirement retained |
| Snapshot compatibility | new targets round-trip; old absent targets read global-neutral |

Malformed target, inactive/expired target, legacy-fallback exclusion,
scope-aware replacement, rollback and CTA-independence cases also passed.

## CI and database reliability

Accepted implementation head
`7c53864cf92dc78918ae36f6e38b949af37ea354` passed [CI run
33979315413](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33979315413):
Agent Core, Quality, Database / Migration Verification, Build / Browser and
Vercel Preview.

Exact merge SHA `aedfaee48cefea34ac9b1fac71315ba7c8c3df19` passed [main CI
run 33980705862](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33980705862),
including the full 15m35s Build / Browser job. Disposable PostgreSQL replayed
all 28 migrations, staged 0027→0028 with representative rows, rejected invalid
target shapes and proved idempotent migration deploy. Placement and Media
Operations PostgreSQL integration passed. The intentional pooled
one-connection Production runtime acceptance passed with final `P2024` count
zero. No N+1 selection path was introduced; assignment graphs remain loaded in
bounded repository queries and selection is in-memory.

## Preview

Initial branch Preview `dpl_GrWb8c1GcfDT9M4Uaia1yK1P1m3B` proved the
new-code/old-schema compatibility boundary. A browser-driven resolver review
then detected that a target-scoped physical asset could re-enter through legacy
HERO/LOGO lookup when its targeted assignment was inactive, expired or
malformed. The accepted head excludes every target-scoped asset from that
legacy path and added regression coverage.

The isolated Preview database had only 0028 pending and the expected
`26/20/0` assignments. The guarded migration applied once, preserved all
counts and left all 46 rows `NULL/NULL`. Post-migration deployment
`dpl_3bFpLK8G6PSvX9MncwLn1cXzWcfD` was Ready at the exact implementation head.

Hosted acceptance passed all public surfaces and eight review pages; 8 Casino
and 6 Bonus API records; exact order, scores and terms; private/no-store GEO
cache variation; no raw external partner link; native 300×250 and 320×50
geometry; 390px/desktop no-overflow; and an empty browser-console error set.
Bounded exact-deployment log scans found no error, fatal, HTTP 500, `P2024`,
Prisma initialization, unhandled rejection, process exit, migration, resolver,
snapshot or credential-token term.

## Production migration and deployment

The compatible application first reached Ready at exact merge SHA as
`dpl_AWjWKt6sWcmKB8ZGCsGfYEK8GRih` while Production still had only 0028
pending. Its build verified the same pooled/direct database identity and the
safe `schema_pending_global_compatibility` state.

Only after exact merge-SHA CI passed, the guarded executor verified the exact
Vercel project/org, Production resource, fingerprint, SHA, prior migration,
pending suffix and protected counts. It applied only 0028. A separate read-only
process independently verified checksum, schema, indexes, counts and zero
targeted rows.

The same merge SHA was then redeployed without cache as
`dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu`. Build logs show branch `main`, commit
`aedfaee`, same-database identity, `production_geo_localized_creative_preflight`
`schema_ready` and `production_geo_localized_creative_readiness`
`already_applied_and_verified`. Canonical, `www`, stable Vercel and main-branch
aliases point to it.

## Production public and adaptive acceptance

`/casinos`, `/bonuses`, `/best-offers` and `/compare` resolved 200 through the
canonical language route. All eight real Casino review routes resolved 200.
The public API retained eight Casinos ordered Betsson, Skol Casino, Hello
Casino, G'day Casino, Diamond7, DragonBet, 21 Privé and Slotnite with exact
Editor Scores 8.8, 8.4, 8.3, 8.1, 7.9, 7.7, 7.4 and 7.2. It retained the six
published offer records and their exact terms/order. Public pages exposed no
raw external partner href.

API responses remain `private, no-store` and vary by trusted
`X-Vercel-IP-Country` plus `Accept-Language`. Page responses remain private,
no-cache/no-store. At 390px and 1440px, the accepted 300×250 media rendered at
exact 1.2 ratio, the 320×50 strip at exact 6.4 ratio, all inspected images
loaded and horizontal overflow was zero.

The live request was legitimately detected as KZ. No country header, URL,
query or cookie was spoofed to manufacture a localized Production result.
Because Production contains zero targeted assignments, its visible global
presentation correctly remained unchanged.

## MCP regression

Production authorization-server and protected-resource metadata for Commercial
and Media each returned 200 with `no-store`, distinct resource/issuer paths and
disjoint scope sets. GET returned 405/Allow POST for both resources. Anonymous
initialization returned 401 with each resource's own metadata challenge.

Source, exact-head tests and build evidence retain exactly four Commercial tools
and five Media tools; neither has publish authority. A current Founder bearer
credential was not available, so acceptance did not invent a client, token or
authenticated tools/list request.

## Runtime logs

Bounded scans for exact Production deployment
`dpl_ANq5SXZAGB8XnE7ZQ9RuckN2gLhu` returned zero error, fatal and HTTP-500
records; zero `P2024`, Prisma initialization, unhandled rejection and process
exit matches; zero migration/resolver/snapshot error matches; and zero
`client_secret`, `access_token` or `refresh_token` matches.

## Rollback

Preferred rollback is an application release through the protected path. The
additive columns stay in place; all old global behavior remains representable
as `NULL/NULL`, so no destructive schema rollback is justified. The existing
RFC-040 feature/kill switch remains available. A bad future target is
deactivated and republished through the governed assignment workflow without
deleting its `MediaAsset`.

## Remaining limitations

- No real localized partner creative has been supplied, ingested, assigned or
  published. Production therefore has zero real targeted assignments.
- The first real target will still require Founder-supplied partner HTML,
  review of brand/language/market/offer evidence, draft application and the
  existing publication action.
- No live authenticated Production Media/Commercial tools list was executed
  because no current Founder bearer credential was available. Exact tool-count,
  authorization and resource-isolation coverage passed in source, CI, Preview
  and unauthenticated Production metadata/method probes.

## Final state

**DETECTED:** GEO-localized creative assignment capability is Ready in
Production, with preserved public state and no installed localized inventory.

`GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01: COMPLETE`
