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
