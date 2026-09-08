# Safe cross-market offer presentation

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 2026-09-08

**Initial implementation phase:** Phase A — read/presentation architecture

**Governing baseline:** `4c902a2b11751d5f8a9636c038c5b9879ce6aeb2`

## Decision

For a casino and a trusted presentation market, published offer content is
resolved in this order:

1. `EXACT` — a published offer explicitly scoped to the presentation country;
2. `ROW` — a genuine published global/Rest-of-World offer;
3. `OTHER_MARKET` — one deterministic published offer from another factual
   market, shown as informational fallback; and
4. `NONE` — no current published offer candidate is known.

Offer existence, current-market verification, and commercial action are three
independent facts. An editorial offer does not create a `MarketActivation`, an
affiliate redirect, tracking authority, or suitable commercial media.

## Safety boundary

**DETECTED:** the public casino repository projects the current published
`CasinoVersion` snapshot to the trusted two-letter market before ordinary
presentation. That projection remains the safety boundary for licences,
payments, operators, legal entities, local domains, KYC, withdrawal data,
market evidence, and market-specific media.

Only a bounded, bonus-only read model may cross presentation markets. Its
authority is the latest immutable `PUBLISHED` `CasinoVersion` for a currently
published, non-archived casino. The read model contains only the casino and
bonus identities, offer copy and material terms, active dates, verification
date, editorial order, source scope/country, and explicit bonus GEO metadata.
Mutable or draft `CasinoBonus` rows are not public candidate authority.

**CONTRADICTION (pre-Phase-A Production evidence):** the catalog verifier
counted seven existing market bonuses for the six real-catalog identities, but
their latest immutable snapshots retained child state `APPROVED/DRAFT`. The
public mapper correctly rejected that state, so the offers were not actually
public. Phase A makes market bonuses receive `PUBLISHED` state when the parent
immutable version is built, matching the long-established global-bonus
behaviour. The bounded CASINO-REAL-CATALOG-03 preflight independently changes
only its seven already-existing factual offers to `offerStatus=ACTIVE` before
republishing. It creates none of the missing StarCasino/ROW records; those
remain Phase B work.

## ROW representation

**DETECTED:** the established global editorial bonus representation is
`CasinoBonus.casinoCountryId = null`, with the existing bonus GEO metadata.
Genuine ROW offers use that model with `geoMode = GLOBAL`.

`ROW` is not a `CasinoCountry`. `ROW` and `ZZ` must not be inserted as factual
country codes. `ZZ` remains the RFC-042 sentinel for global commercial
fallback only. A country-specific offer is never automatically converted to
ROW.

## Phase B corpus reconciliation

**DETECTED:** the three governed copies of the Betsson Product=Casino direct-
link corpus each contain 60 ordered rows with identical title, description and
tracking-URL triples after newline normalization. Twenty rows are labelled
`WELCOME_OFFER`; 19 are casino offers and one is a sportsbook route. Of the 19
casino offers, 15 are exact-market, two are genuine ROW and two are regional
but not ROW. None of the 60 source rows has a direct production route mapping.

**DETECTED / RECONCILED:** the complete row audit leaves exactly three safe
editorial omissions:

- StarCasino row 10 becomes `starcasino-it-welcome`, attached to its existing
  Italian market profile;
- Rizk row 38 becomes the global `rizk-row-welcome`; and
- NordicBet row 56 becomes the global `nordicbet-row-welcome`.

The two ROW records use the established global bonus mechanism. All three
records state only that a welcome-offer route exists; amount, currency,
wagering, deposit, expiry and eligibility mechanics remain null or explicitly
unknown. The bounded reconciler is deterministic, transactional, idempotent
and audit-logged. It is called from the existing CASINO-REAL-CATALOG-03
production preflight, after which the established publisher creates immutable
published snapshots.

**UNKNOWN / INTENTIONAL EXCLUSION:** Betsson CL and IS have no published exact
country profile. Betsson EN is not explicitly ROW. Betsson LATAM is regional
and supplies no country list. These four records remain absent instead of
being promoted to global evidence.

**CONTRADICTION / INTENTIONAL EXCLUSION:** Rizk NZ remains absent while its
legal/footer conflict is unresolved. SuperCasino row 28 is brand protection,
not an offer, and Inkabet row 53 is sportsbook-only. The executable audit and
all 60 row dispositions are recorded in
`SAFE-OFFER-CORPUS-DIRECT-LINK-AUDIT-2026-09-08.md`.

No Phase B reconciliation creates or updates an affiliate offer, tracking
link, redirect slug, `MarketActivation`, media record, Editor Score, schema or
migration. StarCasino remains informational/noindex and receives no outbound
action.

## Deterministic selection

After relation priority, candidates are ordered by:

1. lower explicit `sortOrder` (missing order is last);
2. greater material-term completeness;
3. more recent `lastVerifiedAt`;
4. ascending factual `sourceCountryCode`; and
5. ascending stable bonus slug.

Material-term completeness counts the presence of: percentage, minimum
deposit, maximum bonus, maximum bet, currency, free spins, wagering value or
text, eligibility, important conditions, and terms URL. Database UUID and
insertion order are not selection inputs. Exact-market bonus-directory
inventory remains plural; without an exact candidate the directory receives
at most one ROW or other-market representative.

## Commercial and media independence

The presentation resolver creates content metadata only. Every candidate it
constructs has no affiliate action and no media. Existing current-market
commercial runtime may remain attached only to the same governed object; an
`OTHER_MARKET` fallback cannot inherit an action. RFC-042 `MarketActivation`
semantics, redirect inventory, and external jurisdiction controls remain
authoritative and unchanged.

RFC-043/MEDIA-GEO3 remains independently exact-offer governed. A fallback
offer cannot receive creative media from another market or offer.

A WELCOME_OFFER tracking route proves route existence in its recorded scope.
It does not prove material bonus terms, local eligibility, current-market
verification, or commercial activation authority.

## Presentation contract

Public casino and offer DTOs receive additive typed metadata:

- selected published offer;
- `EXACT | ROW | OTHER_MARKET | NONE` relation;
- factual source country when applicable;
- trusted presentation country; and
- explicit current-market verification state.

Display components consume this metadata and never infer scope from offer
titles. `Published` alone is insufficient where it could imply local
availability. `Review only` describes commercial action state, not offer
absence. `Not listed` is reserved for `NONE`.

## Phase A production acceptance finding

**DETECTED:** the first Phase A production acceptance run reached the trusted
Kazakhstan presentation but did not render `OTHER_MARKET`. PostgreSQL rejected
the bounded candidate query because its UUID column was compared with text
parameters. The service failed closed to the already market-projected snapshot:
no foreign profile data, offer action, or media crossed the boundary.

The Phase A corrective change validates candidate IDs as UUIDs and casts every
bound parameter to PostgreSQL `uuid`. A disposable-PostgreSQL regression test
executes the real repository path, including a rejected non-UUID input. This is
a query-typing correction only; it does not broaden the whitelist or change the
selection, commercial, media, or market-isolation rules above.

**DETECTED:** the follow-up production DTO audit found that top-level licence
rows remained present after the requested country's profile array was removed.
The immutable snapshot contains each licence both at casino level and through
its `CasinoCountryLicense` relationship; projecting only `countries` therefore
left the duplicated market-linked row visible. No foreign operator, local
domain, currency, payment, provider, category, bonus, market profile, action,
or offer media was present in the audited Kazakhstan DTOs. `Casino.domain`
remains the established unscoped canonical brand identity; only
`CasinoCountry.localDomain` is market-scoped.

The repository projection now classifies top-level licences before removing
foreign profiles. It retains only a licence that is unscoped or linked to the
exact trusted market; an unqualified or unmatched request receives unscoped
licences only. The mapper independently removes any market-profile licence from
its global set before resolving the exact profile. Synthetic and disposable-
PostgreSQL regressions cover both boundaries, including `PE`, `SE`, unmatched
`KZ`, and unqualified projections. This closes a pre-existing projection defect
without changing factual data, schema, or the offer whitelist.

## UI reference lock and decision ledger

**DETECTED:** the accepted Casino directory, casino profile, Bonuses, and Best
Offers surfaces already provide status kickers, supporting evidence lines,
material-term blocks, and disabled commercial actions.

The implementation reuses those exact patterns, typography, colours, spacing,
and responsive layouts. It adds factual offer-scope and verification copy only.
No new accent, imagery, card system, motion, or CTA treatment is introduced.
This preserves the current visual hierarchy while making the highest-risk
misreading—foreign evidence presented as a Kazakhstan-verified offer—explicit.

## Production completion evidence

**DETECTED — PHASE A:** [PR #208](https://github.com/AlexG-7BE/sevenbet-next/pull/208)
merged as `cf8bcac59501f15237fbb5702e777285cf259bcb`. Live acceptance then
produced two bounded corrective findings: [PR #209](https://github.com/AlexG-7BE/sevenbet-next/pull/209)
fixed PostgreSQL UUID parameter typing and [PR #210](https://github.com/AlexG-7BE/sevenbet-next/pull/210)
closed duplicated top-level foreign-licence projection. The final Phase A
runtime `c98ff14caea2077571b75ca61bea5642a38ae2c6` was Ready on the
canonical aliases as `dpl_2iS9gpDrYJs2AGF7N5g3kqM4UK3q`; trusted Kazakhstan
presentation, nine routes, commercial inventory and media invariants passed
before Phase B started.

**DETECTED — PHASE B:** [PR #211](https://github.com/AlexG-7BE/sevenbet-next/pull/211)
merged as `b9251f0723ab20cd663da83ac0502e8312ebdd2c`. Deployment
`dpl_AeUybayahufSMfhiy7sxTSCaf3Vf` reconciled and published the three
governed records, then failed postflight: the verifier looked only in the
top-level global `casinoBonuses` container even though the correct StarCasino
IT record lives under its factual country's nested `bonuses` container.
Read-only Production inspection first proved that the transaction had
committed exactly once, each record was active/published in its intended scope,
and all protected bindings remained zero. No blind replay was attempted.

[PR #212](https://github.com/AlexG-7BE/sevenbet-next/pull/212) merged the
container-aware verifier as `6deca5539812a72f5eac1c09fbd2f9b107da32d3`.
Corrective deployment `dpl_5u5zVe8qMvbuUq2Kw2Y287v4bEkx` reported all three
records unchanged on immediate replay, verified each exactly once in the
correct global or factual-market snapshot container, reached Ready, and owns
`b4gamble.com` plus `www.b4gamble.com`.

The direct Production catalog verifier passed with StarCasino IT
`COUNTRY/IT`, Rizk `ROW` and NordicBet `ROW`; all three have zero action and
media bindings. The exact before/after hashes and counts match across
AffiliateOffer, tracking-link, redirect, MarketActivation, creative-set,
media-revision, MediaAsset, three typed assignment and hosted-creative
inventories. All six Founder scores also match. MEDIA-GEO3 reports three active
catalog creative sets, zero invalid sets/variants/preflight cells, zero
duplicate active revisions, zero raw destinations and zero destructive writes.
MarketActivation reports all internal invariants passed; its sole non-passing
golden fixture remains the pre-existing bounded Inkabet PE partner HTTP 403.

Trusted-KZ browser acceptance proves Rizk and NordicBet select `ROW`; Inkabet
PE, Betsafe EE/LV, SuperCasino NZ and StarCasino IT select `OTHER_MARKET` with
Kazakhstan explicitly unverified. Foreign countries and licences are empty in
the public DTO, and no governed fallback card or profile receives a transferred
`/r/` action. The casino directory, all six profiles, Bonuses and Best Offers
return HTTP 200 with no horizontal overflow, runtime error, console error or
page error; all six profile logos decode at non-zero intrinsic dimensions.

The first directory acceptance harness incorrectly asserted that every ROW
card on Bonuses must lack a commercial link, including unrelated, pre-existing
RFC-042-authorised casinos. The corrected regression targets only the six
casinos governed by this workstream and passes Production. This changes test
scope only; it neither removes legitimate existing actions nor weakens any
assertion on the new or fallback records.

## Protected invariants

- Market-profile projection remains in place.
- Foreign licences, payments, operators, domains, KYC, evidence, and media do
  not enter the current presentation.
- Editor Scores and their order are unchanged.
- Existing exact-market offers are not overwritten by ROW.
- Sparse supported facts are preferred to invented terms.
- Rizk NZ remains excluded while its legal/footer contradiction is unresolved.
- StarCasino remains informational/noindex and gains no outbound authority from
  editorial offer existence.
- No schema migration, ingestion-contract fiction, `vercel.json` change, or
  protected Programme change is part of this decision.
